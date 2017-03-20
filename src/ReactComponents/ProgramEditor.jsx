
import {noop, times, constant, difference} from 'lodash';
import React, {PropTypes} from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';
const Range = brace.acequire('ace/range').Range;

import 'brace/mode/javascript';
import 'brace/theme/monokai';
import 'brace/ext/language_tools';// this module is imported to get rid of "mispelled options" warning from react-ace

import {validSource, sourceToAst} from '../Runner/Parsing/program.js';
import {nodesContainingCoords, signedLiteralNodes, nodeAtPath} from '../Runner/Parsing/program-queries.js';
import {recognizers as NodeP, constructors as Nodes} from '../Runner/Parsing/ast-utils.js';
import * as dragmanager from './drag-manager.js';

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
      - onClickedNode
    State:
      - ast
      - dragging
  */
  render() {
    const {ast, dragging} = this.state;
    return (
      <div
        onMouseMove={ast !== null ? this.handleMouseMove : noop}
        onMouseDown={ast !== null ? this.handleMouseDown : noop}
        onClick={ast !== null ? this.handleClick : noop}>
        <AceEditor
          ref="aceEditor"
          onChange={this.handleChange}
          value={this.props.program}
          mode="javascript"
          theme="monokai"
          width="100%"
          height="100%"
          editorProps={{$blockScrolling: Infinity}}
          setOptions={{dragEnabled: false}}
          className={dragging ? 'prog-editor-no-selection' : ''}/>
      </div>
    );
  }

  constructor(props) {
    super(props);
    this.state = {
      ast: validSource(props.program) 
        ? sourceToAst(props.program)
        : null,
        dragging: false
    };
    // Initialize state.
    this.initializeDecorations();
    this.initializeSliderMarkers();
    // Initialize bound methods.
    this.handleChange = this.handleChange.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount() {
    this.aceEditor = this.refs["aceEditor"].editor;
    this.updateSliderMarkers();
    this.updateDecorations(this.props.nodeDecorations);
  }

  componentWillReceiveProps(newProps) {
    const {program} = newProps;
    this.setState({
      ast: validSource(program)
        ? sourceToAst(program)
        : null
    });
  }

  componentDidUpdate() {
    this.updateSliderMarkers();
    this.updateDecorations(this.props.nodeDecorations);
  }

  handleMouseDown(mouseDownEvent) {
    // Begin slider behavior when necessary.
    this.tryStartConstantAdjustment(mouseDownEvent);
  }

  handleMouseMove(mouseMoveEvent) {
    let programCoords = this.mouseEventToEsprimaCoords(mouseMoveEvent);
    let {deepestNode, bottomUpNodes} = nodesContainingCoords(this.state.ast, programCoords);
    this.props.onHoveredNode({
      node: deepestNode,
      path: bottomUpNodes
    });
  }

  handleClick(clickEvent) {
    let programCoords = this.mouseEventToEsprimaCoords(clickEvent);
    let {deepestNode, bottomUpNodes} = nodesContainingCoords(this.state.ast, programCoords);
    this.props.onClickedNode({
      node: deepestNode,
      path: bottomUpNodes
    });
  }

  handleChange(newSource) {
    this.props.onProgramChange(newSource);
    if (validSource(newSource)) {
      this.props.onValidProgram(newSource);
    }
  }

  initializeDecorations() {
    this.decorationsToMarkers = new Map();
  }

  updateDecorations(newDecorations) {
    let currentDecorations = Array.from(this.decorationsToMarkers.keys());
    let leavingDecorations = difference(currentDecorations, newDecorations);
    let keepingDecorations = difference(currentDecorations, leavingDecorations);
    let enteringDecorations = difference(newDecorations, keepingDecorations);
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

  initializeSliderMarkers() {
    this.sliderMarkers = [];
  }

  updateSliderMarkers() {
    // Remove previous markers.
    this.sliderMarkers.forEach(marker => {
      this.aceEditor.getSession().removeMarker(marker);
    });
    this.sliderMarkers = [];
    // Add current markers.
    let numericLiterals = this.state.ast !== null 
      ? signedLiteralNodes(this.state.ast)
      : [];
    numericLiterals.forEach(literal => {
      let range = getNodeRange(literal);
      let marker = this.aceEditor.getSession().addMarker(range, "adjustable-hint", "text", false);
      this.sliderMarkers.push(marker);
    });
  }

  tryStartConstantAdjustment(mouseDownEvent) {
    let programCoords = this.mouseEventToEsprimaCoords(mouseDownEvent);
    let {bottomUpNodes, pathToDeepest} = nodesContainingCoords(this.state.ast, programCoords);
    let shouldStart = NodeP.isNumericLiteral(bottomUpNodes[0]);
    if (shouldStart) {
      // Update state
      this.setState({dragging: true});
      // Setup text adjustment
      let pathToNode = NodeP.isSignedNumericLiteral(bottomUpNodes[1]) 
        ? pathToDeepest.slice(0, -1)
        : pathToDeepest;
      let initialTargetNode = nodeAtPath(this.state.ast, pathToNode);
      let literalText = literalSourceCode(initialTargetNode);
      let componentExtractor = /^(\+|\-)?([0-9]*)(?:\.([0-9]+))?$/; // Not handling 0x 0o 0b
      let [,signStr="", intStr, fracStr=""] = componentExtractor.exec(literalText);
      let fracDigitsNum = fracStr.length;
      const startingInt = Number.parseInt(signStr+intStr+fracStr);
      const startX = mouseDownEvent.clientX;
      const onMove = mouseMoveEvent => {
        let deltaX = mouseMoveEvent.clientX - startX;
        let deltaInt = deltaX;
        let newInt = startingInt + deltaInt;

        let targetNode = nodeAtPath(this.state.ast, pathToNode);
        let doc = this.aceEditor.getSession().getDocument();
        doc.replace(
          getNodeRange(targetNode), 
          literalTextFromInt(newInt, fracDigitsNum));
      };
      const onUp = () => {
        this.setState({dragging: false});
      };
      dragmanager.start(mouseDownEvent, {onMove, onUp});
    }
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



ProgramEditor.propTypes = {
  program: PropTypes.string.isRequired,
  nodeDecorations: PropTypes.arrayOf(PropTypes.instanceOf(NodeDecoration)).isRequired,
  onProgramChange: PropTypes.func,
  onValidProgram: PropTypes.func,
  onHoveredNode: PropTypes.func,
  onClickedNode: PropTypes.func
};




// Adjustable constants helper functions.
function literalSourceCode(node) {
  if (NodeP.isUnaryExpression(node)) {
    return node.operator + node.argument.raw;
  } else {
    return node.raw;
  }
}

function absoluteValueTextFromInt(int, fracDigitsNum) {
  function getDigits(int) {
    let intDigits = [];
    let currentInt = Math.abs(int);
    while (currentInt !== 0) {
      let digit = currentInt % 10;
      intDigits.unshift(digit);
      currentInt = Math.floor(currentInt / 10);
    }
    return intDigits;
  }
  let intDigits = getDigits(int);
  let neededDigits = fracDigitsNum + 1; // e.g. X.XXX (fracDigitsNum=3)
  let allDigits = [
    ...times(Math.max(neededDigits - intDigits.length), constant("0")),
    ...intDigits
  ];
  let needsDecimalPoint = fracDigitsNum > 0;
  let completeStr = needsDecimalPoint
    ? [...allDigits.slice(0, -fracDigitsNum), ".", ...allDigits.slice(-fracDigitsNum)].join("")
    : allDigits.join("");
  return completeStr;
}

function numericLiteralFromInt(int, fracDigitsNum) {
  let absStr = absoluteValueTextFromInt(int, fracDigitsNum);
  let isNegative = int < 0;
  return isNegative
    ? Nodes.unaryExpr("-", 
        Nodes.literal(Number.parseFloat(absStr), absStr))
    : Nodes.literal(Number.parseFloat(absStr), absStr);
}

function literalTextFromInt(int, fracDigitsNum) {
  let absStr = absoluteValueTextFromInt(int, fracDigitsNum);
  let signStr = int < 0 ? "-" : "";
  return signStr + absStr;
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


