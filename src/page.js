"use strict";

var ace = require('brace');
require('brace/mode/javascript');
require('brace/theme/monokai');
var view = require('./view');
var style = require('./utils/styling');
var _ = require('underscore');

var fs = require('fs');
var initProgram = fs.readFileSync(__dirname + "/example-programs/edificio_carmo.js", "utf8");


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

var running = require("./running-idea");
var traceCall = require('./Runner/Instrumentation/trace-call-transform').transform;
var saveTopLevel = require('./Runner/Instrumentation/save-top-level-transform').transform;
var results = running.runProgramPrime2(initProgram, [saveTopLevel, traceCall]);

var THREE = require('three'),
	toThree = require('./to-three');
var threeObjects = Array.from(results[0].topLevelExprResults.values())
	.filter(v=>toThree.isRenderable(v))
	.map(v=>toThree.resultToThree(v));
var scene = new THREE.Scene();
scene.add.apply(scene, threeObjects);
realView.setScene(scene);

//highlight traced calls
var Range = ace.acequire('ace/range').Range;
Array.from(results[1].callTraces.keys())
	.map(id=>JSON.parse(id))
	.forEach(loc=>{
		var r = new Range(loc.start.line-1, loc.start.column, loc.end.line-1, loc.end.column);
		codeEditor.getSession().addMarker(r, "text-call-marker", "text", true);
	});
var callStyle = ".text-call-marker {position: absolute; background-color: yellowgreen; opacity: 0.1; }";
var callStyleElem = document.createElement("style");
callStyleElem.innerText = callStyle;
document.head.appendChild(callStyleElem);

//highlight hovered call
//style for call highlight
var callHighlightStyle = ".highlight-call-marker {position: absolute; background-color: hsl(47, 100%, 71%); opacity: 0.5; }";
var callHighlightStyleElem = document.createElement("style");
callHighlightStyleElem.innerText = callHighlightStyle;
document.head.appendChild(callHighlightStyleElem);

var highlightableNodes = Array.from(results[1].callTraces.keys())
	.filter(id=>toThree.isRenderable(results[1].callTraces.get(id)[0].result))
	.map(id=>{
		const loc = JSON.parse(id);
		return {
			id: id, 
			range: new Range(loc.start.line-1, loc.start.column, loc.end.line-1, loc.end.column)
		};
	});
function deepestHighlightableContainingCoord(line, column) {
	return (
		highlightableNodes
		.filter(h=>h.range.contains(line, column))
		.reduce((prev, curr)=>prev === null || prev.range.containsRange(curr.range) ? curr : prev, null)
		);
}
var currMarker = null;
var currTHREEObjs = null;
var threeObjToOldMaterial = new Map();
var highlightMaterial = new THREE.MeshPhongMaterial();
highlightMaterial.emissive.setHSL(52/360.0, 0.92, 0.49);
function setHighlighted(highlightable) {
	//highlight code
	if(currMarker !== null) {
		codeEditor.getSession().removeMarker(currMarker);
	}
	currMarker = codeEditor.getSession()
		.addMarker(highlightable.range, "highlight-call-marker", "text", true);
	//highlight THREEObject3Ds
	if(currTHREEObjs !== null) {
		currTHREEObjs.forEach(obj=>{
			obj.material = threeObjToOldMaterial.get(obj);
		});
		threeObjToOldMaterial.clear();
		currTHREEObjs = null;
	}
	var resultsToHighlight = results[1].callTraces.get(highlightable.id)
		.map(callTrace=>callTrace.result);
	var objsToHighlight = resultsToHighlight
		.map(res=>toThree.resultsThreeObjects.get(res))
		.reduce((l1,l2)=>l1.concat(l2));
	var objsWithMaterial = new Set();
	objsToHighlight.forEach(o=>o.traverse(o=>{
		if(o.material !== undefined) {
			objsWithMaterial.add(o);
		}
	}));
	objsWithMaterial.forEach(o=>{
		threeObjToOldMaterial.set(o, o.material);
		o.material = highlightMaterial;
	});
	currTHREEObjs = Array.from(objsWithMaterial);
}
function unsetHighlighted() {
	if(currMarker !== null) {
		codeEditor.getSession().removeMarker(currMarker);
		currMarker = null;
	}
	if(currTHREEObjs !== null) {
		currTHREEObjs.forEach(obj=>{
			obj.material = threeObjToOldMaterial.get(obj);
		});
		threeObjToOldMaterial.clear();
		currTHREEObjs = null;
	}
}

var lastHighlightable = null;
function handleMouseMove(e) {
	var screenCoords = codeEditor.renderer.pixelToScreenCoordinates(e.clientX, e.clientY);
	var docCoords = codeEditor.getSession().screenToDocumentPosition(screenCoords.row, screenCoords.column);
	var highlightable = deepestHighlightableContainingCoord(docCoords.row, docCoords.column);
	if(highlightable === lastHighlightable) {
		return;
	}
	if(highlightable !== null) {
		setHighlighted(highlightable);
	} else {
		unsetHighlighted();
	}
	lastHighlightable = highlightable;
	realView.redraw();
}
codeEditor.renderer.container.addEventListener("mousemove", _.throttle(handleMouseMove, 100));

