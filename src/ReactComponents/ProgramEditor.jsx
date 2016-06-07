
import {noop} from 'lodash';
import React from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';
const Range = brace.acequire('ace/range').Range;

import 'brace/mode/javascript';
import 'brace/theme/monokai';
import 'brace/ext/language_tools';// this module is imported to get rid of "mispelled options" warning from react-ace

import {Program} from '../Runner/Parsing/Program.js';

/*
ProgramEditor
	A component responsible for the UI of editing a program.
	It has to have a way of communicating/signaling that it produced a new version of the program.
	It is just a top-level/abstract component as it doesn't impose any specific way of editing the program.
	CompositeEditor
		Edits a part of a program using other editors.
	TextFragmentEditor
		Edits a part of a program using the normal text editor.
	LockedView
		A part of the editor that is not being edited right now.
Cursors
	Does it have cursors controlled by the keyboard?
	Does it have mouse interaction?
	If there are multiple types of editors, how do we manage cursors and mouse interaction?
*/
// TODO Handle syntactically invalid text programs.
// TODO Hide ace editor disorientation when the program is updated.
//   Adding text by pasting or typing on top of a selection will cause 
//  two change events instead of one.
// TODO Add support for node decorations.
//   Should this component be responsible for that?
//   Currently, it displays the program as text and calls a callback when it
//  changes into a syntatically correct program.
//   Decorations are garantied to refer nodes that belong to the current 
//  program.

class ProgramEditor extends React.Component {
	/*
		Props:
			- program
			- nodeDecorations {Array.<NodeDecoration>}
			- onValidProgram
			- onHoveredNode
		State:
			*not-specified*
	*/
	//TODO Remove loop of ace editor changes.
	// AceEditor calls onChange both when the user changes the editor and when React re-renders
	// It emits a "delete everything" change followed by a "this is the new contents" change.
	// This behavior breaks Ace's javascript linting.
	// TODO Convert ace editor changes into program changes.
	handleChange(newValue) {
		if(Program.isSyntaticallyCorrect(newValue)) {
			this.props.onValidProgram(Program.fromSourceCode(newValue));
		}
	}
	handlePaste() {
	}
	render() {
		return (
			<AceEditor
				ref="aceEditor"
				onChange={this.handleChange.bind(this)}
				onPaste={this.handlePaste.bind(this)}
				value={this.props.program.getSourceCode()}
				mode="javascript"
				theme="monokai"
				width="100%"
				height="100%"
				editorProps={{$blockScrolling: Infinity}}/>
		);
	}
	constructor(props) {
		super(props);
		this.initializeDecorations(props.nodeDecorations);
	}
	componentDidMount() {
		this.aceEditor = this.refs["aceEditor"].editor;
	}
	componentDidUpdate() {
		this.updateDecorations(this.props.nodeDecorations);
	}
	initializeDecorations(initialDecorations) {
		this.decorationsToMarkers = new Map();
		this.updateDecorations(initialDecorations);
	}
	updateDecorations(newDecorations) {
		let currentDecorations = Array.from(this.decorationsToMarkers.keys());
		let leavingDecorations = _.difference(currentDecorations, newDecorations);
		let keepingDecorations = _.difference(currentDecorations, leavingDecorations);
		let enteringDecorations = _.difference(newDecorations, keepingDecorations);
		//Remove leaving.
		leavingDecorations
			.map(dec=>this.decorationsToMarkers.get(dec))
			.forEach(marker=>{
				this.aceEditor.getSession().removeMarker(marker);
			});
		leavingDecorations.forEach(dec=>{
			this.decorationsToMarkers.delete(dec);
		});
		//Add entering.
		enteringDecorations.forEach(dec=>{
			let nodeRange = getNodeRange(dec.node);
			let marker = addColoredMarker(this.aceEditor, nodeRange, dec.color);
			this.decorationsToMarkers.set(dec, marker);
		});
	}
}

// dependencies: Program + ace
function getNodeRange(astNode) {
	const {start, end} = astNode.loc;
	return new Range(start.line-1, start.column, end.line-1, end.column);
}


// dependencies: ace + THREE.Color
function addColoredMarker(aceEditor, range, color) {
	let marker = aceEditor.getSession().addDynamicMarker({
		range: range,
		update: noop,
		renderer: drawColoredMarker,
		color: color.getStyle(),
		editor: aceEditor
	});
	return marker.id;
}
function drawColoredMarker(htmlStringArray, range, left, top, config) {
	//push html string into htmlstringarray that represents the marker as DOM objects.
	function drawLine(range, clazz, extraLength, extraStyle) {
		var height = lineHeight;
	  var width = (range.end.column + (extraLength || 0) - range.start.column) * config.characterWidth;

	  var top = getTop(range.start.row, config);
	  var left = padding + range.start.column * characterWidth;

	  htmlStringArray.push(
	    "<div class='", clazz, "' style='",
	    "height:", height, "px;",
	    "width:", width, "px;",
	    "top:", top, "px;",
	    "left:", left, "px;", extraStyle || "", "'></div>"
 	 	);
	}
	const {characterWidth, lineHeight} = config;
	const padding = left - range.start.column * characterWidth;
	const session = this.editor.getSession();
	let start = range.start.row;
  let end = range.end.row;
  let row = start;
  let prev = 0; 
  let curr = 0;
  let next = session.getScreenLastRowColumn(row);
  let lineRange = new Range(row, range.start.column, row, curr);
  for (; row <= end; row++) {
    lineRange.start.row = lineRange.end.row = row;
    lineRange.start.column = row == start ? range.start.column : session.getRowWrapIndent(row);
    lineRange.end.column = next;
    prev = curr;
    curr = next;
    next = row + 1 < end ? session.getScreenLastRowColumn(row + 1) : row == end ? 0 : range.end.column;
    drawLine(
    	lineRange, 
      (row == start  ? " ace_start" : "")
        + getBorderClass(row == start || row == start + 1 && range.start.column, prev < curr, curr > next, row == end),
      row == end ? 0 : 1, 
      "background-color:"+this.color+";"+"position: absolute;"+"opacity: 0.4;");
  }
}
function getBorderClass(tl, tr, br, bl) {
  return (
  	"ace_br" +
  	((tl ? 1 : 0) | (tr ? 2 : 0) | (br ? 4 : 0) | (bl ? 8 : 0))
  );
}
function getTop(row, layerConfig) {
	return (row - layerConfig.firstRowScreen) * layerConfig.lineHeight;
};



class NodeDecoration {
	constructor(node, color) {
		this.node = node;
		this.color = color;
	}
}

export default ProgramEditor;
export {NodeDecoration};