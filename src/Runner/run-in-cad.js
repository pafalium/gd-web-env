
function synchronousHttpRequest(url, params, method="POST") {
	// prepare request
	let req = new XMLHttpRequest();
	req.open(method, url, false);
	req.setRequestHeader("Content-type", "application/json; charset=utf-8");
	req.send(JSON.stringify(params));
	return JSON.parse(req.response);
}

//
//function primitive(args)
//This code is called in a user's program to make a primitive's instance.
//
//function primitive.realize()
//This code is called to make another realization of the primitive's instance in the CAD.
//We do this because everything we call in the CAD will be displayed.


import {PrimitiveProp} from '../SceneGraph/primitives.js';

function isPrimitive(result) {
	return isSomething(result) && renderableFunctions[result[PrimitiveProp]] !== undefined;
}
function isSomething(result) {
	return result !== undefined && result !== null;
}
//to-three -> to-cad
//to-cad(array) -> array.map(to-cad)
//to-cad(primitive) -> primitive.realize()
function resultsToCAD(results) {
	let cadRefs = [];
	for (let result of results) {
		cadRefs.push(toCAD(result));
	}
	return {cadRefs};
}
function toCAD(result) {
	let cadRef; 
	if(isPrimitive(result)){
		cadRef = renderableFunctions[result[PrimitiveProp]](result);
	} else if(Array.isArray(result)) {
		cadRef = arrayToCAD(result);
	} else {
		cadRef = nullCADObj();
	}
	return cadRef;
}
function nullCADObj() {
	return null;
}
function arrayToCAD(array) {
	return array.map(r=>toCAD(r));
}
let renderableFunctions = {
	cornersBox,
	centerSphere,
	centersCylinder
};
function cornersBox({p1, p2}) {
	return synchronousHttpRequest("corners-box", {
		p1: [p1.x, p1.y, p1.z],
		p2: [p2.x, p2.y, p2.z]
	});
}
function centerSphere({center, radius}) {
	return synchronousHttpRequest("center-sphere", {
		center: [center.x, center.y, center.z],
		radius
	});
}
function centersCylinder({p1, p2, radius}) {
	return synchronousHttpRequest("centers-cylinder", {
		p1: [p1.x, p1.y, p1.z],
		p2: [p2.x, p2.y, p2.z],
		radius
	});
}

export {resultsToCAD};





import {runProgramPrime2} from './running-idea.js';
import {transform as saveTopLevelTransform} from './Instrumentation/save-top-level-transform.js';
import THREE from 'three';

function centersCylinderPrimitive(p1, p2, radius) {
	return {
		[PrimitiveProp]: "centersCylinder",
		p1,
		p2,
		radius
	};
}
function centerSpherePrimitive(center, radius) {
	return {
		[PrimitiveProp]: "centerSphere",
		center,
		radius
	};
}
function cornersBoxPrimitive(p1, p2) {
	return {
		[PrimitiveProp]: "cornersBox",
		p1,
		p2
	};
}

import sequence from '../SceneGraph/Predefs/sequence.js';

const cylinder = {};
cylinder.byCentersRadius = function([c1, c2], radius) {
	return centersCylinderPrimitive(c1, c2, radius);
};
const sphere = {};
sphere.byCenterRadius = function(center, radius) {
	return centerSpherePrimitive(center, radius);
};
import {point, vector} from '../SceneGraph/Predefs/point-vector-matrix.js';
const box = {};
box.byCorners = function([c1, c2]) {
	return cornersBoxPrimitive(c1, c2);
};

let predefinedBindings = [
	{name: "sequence", value: sequence},
	{name: "box", value: box},
	{name: "cylinder", value: cylinder},
	{name: "sphere", value: sphere},
	{name: "point", value: point},
	{name: "vector", value: vector}
];

//
// Runner
//

function runInCad(program) {
	// use different predefined functions and primitives (primitives)
	// run the program locally (running-idea)
	let [saveTopLevelContext] = runProgramPrime2(program, [saveTopLevelTransform], predefinedBindings);
	let results = saveTopLevelContext.topLevelExprResults.values();
	// execute the top-level results with the CAD API (to-three)
	clearCad();
	let {cadRefs} = resultsToCAD(results);
}

function clearCad() {
	synchronousHttpRequest("erase-all", {}, "GET");
}

function selectCads(cads) {
	synchronousHttpRequest("active-backends", {
		backends: cads
	}, "PUT");
}

export {runInCad, clearCad, selectCads};

