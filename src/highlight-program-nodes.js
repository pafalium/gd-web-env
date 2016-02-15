"use strict";

var esprima = require('esprima');
var estraverse = require('estraverse');
var ace = require('brace');
var aceRange = ace.acequire('ace/range').Range;

(function setHighlightClass() {
	var highlightStyle = ".node-highlight {\
		background-color: rgb(200, 128, 0); \
		position: absolute;\
		z-index: 30;\
		opacity: 0.9;\ }";
	var styleElem = document.createElement("style");
	styleElem.innerHTML = highlightStyle;
	document.head.appendChild(styleElem);
})();
var marker = null;
function highlightNode(node, editor) {
	if(marker !== null) {
		editor.getSession().removeMarker(marker);
		marker = null;
	}
	//make ace range for node
	var loc = node.loc;
	var start = ASTPosToDocPos(loc.start);
	var end = ASTPosToDocPos(loc.end);
	var nodeRange = new aceRange(start.row, start.column, 
		end.row, end.column);
	//add marker to editor
	//remember marker to remove it later
	marker = editor.getSession().addMarker(nodeRange, "node-highlight", "line");
}

function docPosToASTPos(docPos) {
	return {
		line: docPos.row+1,
		column: docPos.column
	};
}
function ASTPosToDocPos(astPos) {
	return {
		row: astPos.line-1,
		column: astPos.column
	};
}
function findNodeOnPos(docPos, ast) {
	function posInsideNode(pos, node) {
		return pos.line <= node.loc.end.line && pos.line >= node.loc.start.line && 
			pos.column <= node.loc.end.column && pos.column >= node.loc.start.column;
	}
	var bestNode = ast;
	estraverse.traverse(ast, {
		enter: function(node, parent) {
			if(posInsideNode(docPos, node)) {
				bestNode = node;
			} else {
				return estraverse.VisitorOption.Skip;
			}
		},
		leave: function(node, parent) {

		}
	});
	return bestNode;
}

function highlightProgramNodes(editor) {
	var program = editor.getValue();
	var ast = esprima.parse(program, {loc: true});
	console.log(ast);
	var editorContainer = editor.renderer.container;

	function highlightNodeBelowMouse(e) {
		//get document position below mouse
		var rendererCoords = editor.renderer.pixelToScreenCoordinates(e.x, e.y);
		var docPos = editor.getSession().screenToDocumentPosition(rendererCoords.row, rendererCoords.column);
		//get node containing that position
		var nodeToHighlight = findNodeOnPos(docPosToASTPos(docPos), ast);
		//highlight node text range
		highlightNode(nodeToHighlight, editor);
	}
	editorContainer.addEventListener("mousemove", highlightNodeBelowMouse);
}

module.exports = highlightProgramNodes;