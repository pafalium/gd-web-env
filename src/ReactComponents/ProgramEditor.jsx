
import {noop} from 'lodash';
import React from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';
const Range = brace.acequire('ace/range').Range;

import 'brace/mode/javascript';
import 'brace/theme/monokai';
import 'brace/ext/language_tools';// this module is imported to get rid of "mispelled options" warning from react-ace

import {traverse} from 'estraverse';
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
// TODO Remove loop of ace editor changes.
//  AceEditor calls onChange both when the user changes the editor and when React re-renders
//  It emits a "delete everything" change followed by a "this is the new contents" change.
//  This behavior breaks Ace's javascript linting.
// TODO Convert ace editor changes into program changes.
// TODO Figure out how to keep the changes made by using Ace Editor without
//sending a syntatically invalid program to the onValidProgram callback.

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
  render() {
    return (
      <div onMouseMove={this.handleMouseMove.bind(this)}>
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
      </div>
    );
  }
  constructor(props) {
    super(props);
    this.initializeDecorations();
  }
  componentDidMount() {
    this.aceEditor = this.refs["aceEditor"].editor;
    this.updateDecorations(this.props.nodeDecorations);
  }
  componentDidUpdate() {
    this.updateDecorations(this.props.nodeDecorations);
  }
  handleChange(newValue) {
    if (Program.isSyntaticallyCorrect(newValue)) {
      this.props.onValidProgram(Program.fromSourceCode(newValue));
    }
  }
  initializeDecorations() {
    this.decorationsToMarkers = new Map();
  }
  updateDecorations(newDecorations) {
    let currentDecorations = Array.from(this.decorationsToMarkers.keys());
    let leavingDecorations = _.difference(currentDecorations, newDecorations);
    let keepingDecorations = _.difference(currentDecorations, leavingDecorations);
    let enteringDecorations = _.difference(newDecorations, keepingDecorations);
    //Remove leaving.
    leavingDecorations
      .map(dec => this.decorationsToMarkers.get(dec))
      .forEach(marker => {
        this.aceEditor.getSession().removeMarker(marker);
      });
    leavingDecorations.forEach(dec => {
      this.decorationsToMarkers.delete(dec);
    });
    //Add entering.
    enteringDecorations.forEach(dec => {
      let nodeRange = getNodeRange(dec.node);
      let marker = addColoredMarker(this.aceEditor, nodeRange, dec.color);
      this.decorationsToMarkers.set(dec, marker);
    });
  }
  handleMouseMove(mouseMoveEvent) {
    let programCoords = this.mouseEventToEsprimaCoords(mouseMoveEvent);
    let {deepestNode, path} = nodesContainingCoords(programCoords, this.props.program);
    this.props.onHoveredNode({
      node: deepestNode,
      path
    });
  }
  mouseEventToEsprimaCoords(mouseEvent) {
    //this.aceEditor
    let {clientX, clientY} = mouseEvent;
    let screenCoords = this.aceEditor.renderer.pixelToScreenCoordinates(clientX, clientY);
    let documentCoords = this.aceEditor.getSession().screenToDocumentPosition(screenCoords.row, screenCoords.column);
    let programCoords = documentCoordsToEsprimaCoords(documentCoords);
    return programCoords;
  }
}

// dependencies: Program + ace
function getNodeRange(astNode) {
  const {start, end} = astNode.loc;
  return new Range(start.line-1, start.column, end.line-1, end.column);
}
function documentCoordsToEsprimaCoords(documentCoords) {
  return {
    line: documentCoords.row + 1,
    column: documentCoords.column
  };
}
function esprimaCoordsToDocumentCoords(esprimaCoords) {
  return {
    row: esprimaCoords.line - 1,
    column: esprimaCoords.column
  };
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
  //Based on: ace/layer/marker - drawTextMarker().
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
  let next = start != end 
    ? session.getScreenLastRowColumn(row) 
    : range.end.column;
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
}


// dependencies: Program + lodash
function nodesContainingCoords(esprimaCoords, program) {
  const ast = program.getAST();
  let path = [];
  traverse(ast, {
    enter(node, parent) {
      if(nodeContainsCoord(node, esprimaCoords)) {
        path.push(node);
      }
    }
  });
  path.reverse();
  return {
    path: path, 
    deepestNode: path[0]
  };
}
function nodeContainsCoord(node, esprimaCoords) {
  function ifThen(premise, consequence) {
    return !premise || consequence;
  }
  const {start, end} = node.loc;
  let betweenLines = esprimaCoords.line >= start.line && esprimaCoords.line <= end.line;
  let onStartLine = esprimaCoords.line === start.line;
  let onEndLine = esprimaCoords.line === end.line;
  return betweenLines 
    && ifThen(onStartLine, esprimaCoords.column >= start.column)
    && ifThen(onEndLine, esprimaCoords.column <= end.column);
}


class NodeDecoration {
  constructor(node, color) {
    this.node = node;
    this.color = color;
  }
}
function makeNodeDecoration(node, color) {
  return new NodeDecoration(node, color);
}

export default ProgramEditor;
export {makeNodeDecoration};