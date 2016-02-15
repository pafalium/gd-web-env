"use strict";

var ace = require('brace');
require('brace/mode/javascript');
require('brace/theme/monokai');
var view = require('./view');
var style = require('./utils/styling');
var initProgram = require('./initialProgram');
var highlightProgramNodes = require('./highlight-program-nodes');

var viewDiv = document.createElement("div");
var editorDiv = document.createElement("div");

var bodyStyle = {
	"margin": "0"
};
var divStyle = {
	"width": "50%",
	"height": "100%"
};
var viewDivStyle = {
	"float": "left"
};
var editorDivStyle = {
	"float": "right"
};

style.applyStyle(viewDiv, style.join(divStyle, viewDivStyle));
style.applyStyle(editorDiv, style.join(divStyle, editorDivStyle));
style.applyStyle(document.body, bodyStyle);

document.body.appendChild(viewDiv);
document.body.appendChild(editorDiv);

var editor = ace.edit(editorDiv);
editor.getSession().setMode("ace/mode/javascript");
editor.setTheme("ace/theme/monokai");

var realView = view.on(viewDiv);



editor.setValue(initProgram);
editor.clearSelection();


highlightProgramNodes(editor);