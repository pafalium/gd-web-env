"use strict";

var _ = require('lodash');
var ace = require('brace');
require('brace/mode/javascript');
require('brace/theme/monokai');
var Range = ace.acequire('ace/range').Range;
var View = require('./view');
var style = require('./utils/styling');
var Program = require('./Runner/Parsing/Program').Program;
var run = require('./Runner/run');
var THREE = require('three'),
	toThree = require('./SceneGraph/to-three');

var fs = require('fs');
var initProgramSourceCode = fs.readFileSync(__dirname + "/example-programs/ex6_trelica_mobius.js", "utf8");


/*
There is a page that contains the editing interface.
This is a description of that page.

The page has a code editor may have a view of the results of that program.
The layout of the page is as follows.
The logic of the UI is ...
*/
/*
//
// Layout (and components)
//

//The page has these elements.
var viewDiv = document.createElement("div");
var codeEditorDiv = document.createElement("div");

//They will have these styles.
var bodyStyle = {
	"margin": "0",
	//"overflow": "hidden"
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

//The code editor and the 3d view are mounted in the elements.
var codeEditor = ace.edit(codeEditorDiv);
codeEditor.getSession().setMode("ace/mode/javascript");
codeEditor.setTheme("ace/theme/monokai");
codeEditor.setValue(initProgramSourceCode);// TODO Change how the program is displayed.
codeEditor.clearSelection();

var realView = View.on(viewDiv);


//
// Traceability logic
//

var initProgram = Program.fromSourceCode(initProgramSourceCode);

console.time("instrument_n_run");
var results = run.withTraceability(initProgram);
console.timeEnd("instrument_n_run");


// threeObjects :
//    - THREE objects corresponding to values of the top level expressions.


//show renderable results 
// Generate THREE objects for all the top level expression values.
// Keep the correspondence between each value/sub-value and the THREE objects generated from it.
//    This way we can reference them given a value/sub-value.
//    From a call expression we get its values and from them we get their THREE objects.
// Can we do it in a different way? Something more local?
// TODO: Move THREE object generation to helpers of UI?
console.time("THREE conversion");
var {threeObjects, resultToTHREEObjects} = toThree.convert.keepingCorrespondence(results.results.topLevelExprResults.values());
console.timeEnd("THREE conversion");
var scene = new THREE.Scene();
scene.add.apply(scene, threeObjects);
//realView.setScene(scene);



//var callHighlighting = (function (){
	//
	// Initialization
	//

	function addStyleToDocument() {
		//style for call highlight
		var callHighlightStyle = ".highlight-call-marker {position: absolute; background-color: hsl(47, 100%, 71%); opacity: 0.5; }";
		var callHighlightStyleElem = document.createElement("style");
		callHighlightStyleElem.innerText = callHighlightStyle;
		document.head.appendChild(callHighlightStyleElem);
	}

	addStyleToDocument();

	// **********
	// Functions
	// **********

	//
	// Params: callTraces -> context of the 'trace-call-transform' after running the program.
	// Returns: [{id, range}] -> astNodes whose results are highlightable.
	//
	function highlightableAstNodes(results) {
		return Array.from(results.traceabilityInfo.callTraces.keys())
			.filter(id=>toThree.isRenderable(results.traceabilityInfo.callTraces.get(id)[0].result))
			.map(id=>{
				const {start, end} = JSON.parse(id);
				return {
					id: id, 
					range: new Range(start.line-1, start.column, end.line-1, end.column)
				};
			});
	}

	//
	// Returns: AstNode | null (if none found)
	//
	function deepestAstNodeContainingCoord(astNodes, loc) {
		const {line, column} = loc;
		return (
		astNodes
		.filter(h=>h.range.contains(line, column))
		.reduce((prev, curr)=>prev === null || prev.range.containsRange(curr.range) ? curr : prev, null)
		);
	}

	function acceptResults(topLevelResults, callExpressionResults){}
	//
	// TODO Finish rewriting traceability (both business logic and UI).
	//
	
//})();

var callExprsWithResults = highlightableAstNodes(results);
function deepestHighlightableContainingCoord(row, col) {
	return deepestAstNodeContainingCoord(callExprsWithResults, {line: row, column: col});
}

var currMarker = null;
var currTHREEObjs = null;
var threeObjToOldMaterial = new Map();
var highlightMaterial = new THREE.MeshPhongMaterial();
highlightMaterial.emissive.setHSL(52/360.0, 0.92, 0.49);
highlightMaterial.depthTest = false;
highlightMaterial.depthWrite = false;
highlightMaterial.transparent = true;
highlightMaterial.opacity = 0.8;
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
	var resultsToHighlight = results.traceabilityInfo.callTraces.get(highlightable.id)
		.map(callTrace=>callTrace.result);
	var objsToHighlight = resultsToHighlight
		.map(res=>resultToTHREEObjects.get(res))
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
	console.time("highlight change");
	if(highlightable !== null) {
		setHighlighted(highlightable);
	} else {
		unsetHighlighted();
	}
	lastHighlightable = highlightable;
	console.timeEnd("highlight change");
	realView.redraw();
}
codeEditor.renderer.container.addEventListener("mousemove", _.throttle(handleMouseMove, 100));


//
// React Three canvas experiment.
//
import React from 'react';
import ReactDOM from 'react-dom';
import OrbitThreeView from './ReactComponents/OrbitThreeView.jsx';

const reactContainer = document.createElement("div");
document.body.appendChild(reactContainer);

//const nyCam = new THREE.PerspectiveCamera(90, 1.0/1.0, 0.1, 1000);
//nyCam.position.set(0.0, 20.0, 30.0);
const nyScene = new THREE.Scene();
nyScene.add(scene);
const dirLight = new THREE.DirectionalLight(0xffffaa, 0.5);
dirLight.position.set(0.1, 1, 0.2);
nyScene.add(dirLight);
nyScene.add(new THREE.GridHelper(100, 1));
nyScene.add(new THREE.AxisHelper(5));

ReactDOM.render(
	React.createElement(
		OrbitThreeView, 
		{width:512, height:512, scene: nyScene}), 
	reactContainer);
*/

/*
//
// React ProgramTextView test.
//
import React from 'react';
import ReactDOM from 'react-dom';
import ProgramTextView from './ReactComponents/ProgramTextView.jsx';

const programViewContainer = document.createElement("div");
document.body.appendChild(programViewContainer);

programViewContainer.style.width = "512px";
programViewContainer.style.height = "512px";

ReactDOM.render(
	<ProgramTextView 
		program={{getSourceCode: ()=>initProgramSourceCode}}/>, 
	programViewContainer);
*/

/*
//
//
//
import React from 'react';
import ReactDOM from 'react-dom';
import RealTimeRunEditor from './ReactComponents/RealTimeRunEditor.jsx';

const realtimeEditorContainer = document.createElement("div");
document.body.appendChild(realtimeEditorContainer);
ReactDOM.render(<RealTimeRunEditor/>, realtimeEditorContainer);
*/


/*
//
//
//
import React from 'react';
import ReactDOM from 'react-dom';
import TextEditor from './ReactComponents/TextEditor.jsx';
const textEditorContainer = document.createElement("div");
document.body.appendChild(textEditorContainer);
ReactDOM.render(<TextEditor value={"sphere(5);\n"} onChange={function(){console.log(arguments)}}/>, textEditorContainer);
*/

import React from 'react';
import ReactDOM from 'react-dom';
import App from './ReactComponents/App.jsx';

ReactDOM.render(<App/>, document.getElementById("container"));
