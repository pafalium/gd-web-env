"use strict";

var ace = require('brace');
require('brace/mode/javascript');
require('brace/theme/monokai');
var view = require('./view');
var style = require('./utils/styling');

var fs = require('fs');
var initProgram = fs.readFileSync(__dirname + "/example-programs/initialProgram.js", "utf8");


var viewDiv = document.createElement("div");
var codeEditorDiv = document.createElement("div");

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
var codeEditorDivStyle = {
	"float": "right"
};

style.applyStyle(viewDiv, style.join(divStyle, viewDivStyle));
style.applyStyle(codeEditorDiv, style.join(divStyle, codeEditorDivStyle));
style.applyStyle(document.body, bodyStyle);

document.body.appendChild(viewDiv);
document.body.appendChild(codeEditorDiv);

var codeEditor = ace.edit(codeEditorDiv);
codeEditor.getSession().setMode("ace/mode/javascript");
codeEditor.setTheme("ace/theme/monokai");

var realView = view.on(viewDiv);



codeEditor.setValue(initProgram);
codeEditor.clearSelection();


var resultViewing = require('./results-viewer');
resultViewing.doIt(realView, codeEditor);
