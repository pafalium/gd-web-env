"use strict";
var THREE = require('three'),
	ace = require('brace'),
	aceRange = ace.acequire('ace/range').Range,
	running = require('./running-idea'),
	toThree = require('./to-three');

function resultLocation(resultId) {
	return JSON.parse(resultId);
}
function resultRange(resultId) {
	var loc = resultLocation(resultId);
	return new aceRange(
		loc.start.line-1, loc.start.column,
		loc.end.line-1, loc.end.column);
}

module.exports = {
	doIt: doIt
};

//Displaying results
//when results are computed, display them
//for each result
//if it is 3d renderable, display it in the view
//if it is an array, display each element
//if it is an object, display
//if it is a primitive type, put it beside its expression
//display each result beside its expression and in the 3D view if it is renderable


function doIt(view3D, codeEditor) {
	var results = running.runProgram(codeEditor.getValue());

	//display results in the 3d view
	var resultsThreejsObjects = computeThreejsObjects(results);
	addThreejsObjectsToView(resultsThreejsObjects, view3D);

	//mark code that generated results
	markResultSourcesInEditor(resultsThreejsObjects, codeEditor);

	//setup highlighting
	var highlightingPairs = resultsThreejsObjects;
	setupResultHighlighting(highlightingPairs, codeEditor, view3D);
	//setup listeners(hovering code, hovering 3d, moving codeEditor cursor)
}


function computeThreejsObjects(results) {
	var res = {};
	for(var prop in results) {
		if(toThree.isRenderable(results[prop])) {
			res[prop] = toThree.resultToThree(results[prop]);
		}
	}
	return res;
}

function addThreejsObjectsToView(resultsThreejsObjects, view3D) {
	var objects = [];
	for(var prop in resultsThreejsObjects) {
		objects.push(resultsThreejsObjects[prop]);
	}
	var scene = new THREE.Scene();
	scene.add.apply(scene, objects);
	view3D.setScene(scene);
}

function markResultSourcesInEditor(results, codeEditor) {

	for(var prop in results) {
		var range = resultRange(prop);
		codeEditor.getSession().addMarker(range, "ace_selected-word", "text", false);
	}
}

function setupResultHighlighting(highlightingPairs, codeEditor, view3D) {
	var highlighter = new ResultHighlighter(codeEditor, view3D);
	//TODO add code marker css class
	//codeEditor.onmouseover... detect pair, set highlighted pair
	codeEditor.renderer.container.addEventListener("mousemove", function(e){
		//hit test mouse position against code that produced each result
		var mousePos = [e.clientX, e.clientY];
		var aceScreenPos = codeEditor.renderer.pixelToScreenCoordinates(mousePos[0], mousePos[1]);
		var aceDocumentPos = codeEditor.getSession().screenToDocumentPosition(aceScreenPos.row, aceScreenPos.column);
		var resultBelowMouse = null;
		for(var result in highlightingPairs) {
			var range = resultRange(result);
			if(range.contains(aceDocumentPos.row, aceDocumentPos.column)) {
				resultBelowMouse = result;
			}
		}
		//if a result was hit, set highlight code-threeobjects pair.
		if(resultBelowMouse !== null) {
			highlighter.setHighlightedPair({
				code: resultBelowMouse,
				value: highlightingPairs[resultBelowMouse]
			});
		} else {
			highlighter.removeHighlighting();
		}
		view3D.redraw();
	});
	//codeEditor.oncursormove... detect pair, set highlighted pair
	//view3d.onmouseover... detect pair, set highlighted pair
	view3D.container.addEventListener("mousemove", function(e){
		//get the result below mouse
		var hittedResult = null;
		var hittedDistance = Number.MAX_VALUE;
		var viewRect = view3D.container.getBoundingClientRect();
		var mouseDeviceCoords = new THREE.Vector2(
			(e.clientX / viewRect.width) * 2 - 1,
			-((e.clientY / viewRect.height) * 2 - 1));
		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(mouseDeviceCoords, view3D.getCamera());
		for(var result in highlightingPairs) {
			var threeObj = highlightingPairs[result];
			var intersections = raycaster.intersectObject(threeObj, true);
			var didIntersect = intersections.length !== 0;
			if(didIntersect) {
				var intersectionIsCloser = intersections[0].distance < hittedDistance;
				if(intersectionIsCloser) {
					hittedDistance = intersections[0].distance;
					hittedResult = result;
				}
			}
		}
		//if a result was hit set hightlight code-threeobjects pair.
		if(hittedResult !== null) {
			highlighter.setHighlightedPair({
				code: hittedResult,
				value: highlightingPairs[hittedResult]
			});
		} else {
			highlighter.removeHighlighting();
		}
		view3D.redraw();
	});
}

var ResultHighlighter = (function (){
	function ResultHighlighter(codeEditor, view3D) {
		this.codeEditor = codeEditor;
		this.view3D = view3D;
		this.currentlyHighlightedPair = {code: "", value: null};
		this.currentCodeEditorHighlightMarker = null;
		this.currentHighlightedThreeObjects = [];
	}
	ResultHighlighter.prototype.setHighlightedPair = function(newPair) {
		if(newPair.code === this.currentlyHighlightedPair.code) {
			return;
		}
		this.removeHighlighting();
		this.addHighlighting(newPair);
	}
	ResultHighlighter.prototype.removeHighlighting = function() {
		this.codeEditor.getSession().removeMarker(this.currentCodeEditorHighlightMarker);
		this.currentCodeEditorHighlightMarker = null;
		var highlightedObjects = this.currentHighlightedThreeObjects;
		for(var i=0; i<highlightedObjects.length; i++) {
			highlightedObjects[i].object.material = highlightedObjects[i].oldMaterial;
		}
		this.currentHighlightedThreeObjects = [];
		this.currentlyHighlightedPair = {code: "", value: null};
	}
	ResultHighlighter.prototype.addHighlighting = function(newPair) {
		//Add marker to the codeEditor
		this.highlightCode(newPair.code);
		//Change objects material
		this.highlightThreeObjects(newPair.value);
		this.currentlyHighlightedPair = newPair;
	}
	ResultHighlighter.prototype.highlightCode = function(result) {
		var range = resultRange(result);
		this.currentCodeEditorHighlightMarker = this.codeEditor.getSession().addMarker(range, "code-highlight", "line", false);
	}
	ResultHighlighter.prototype.highlightThreeObjects = function(objects) {
		//Change the material of all objects to the highlight material.
		//Collect the old material for all of those objects.
		var highlightMaterial = new THREE.MeshPhongMaterial();
		highlightMaterial.emissive.setRGB(0.8,0.0,0.0);

		var highlighteds = [];

		objects.traverse(function(object){
			if(object.material === undefined) {
				return;
			}
			highlighteds.push({
				object: object,
				oldMaterial: object.material
			});
			object.material = highlightMaterial;
		});
		this.currentHighlightedThreeObjects = highlighteds;
	}

	var codeHighlightCss = ".code-highlight {background-color: red; position: absolute;}"
	var styleElem = document.createElement("style");
	styleElem.innerHTML = codeHighlightCss;
	document.head.appendChild(styleElem);

	return ResultHighlighter;
})();
