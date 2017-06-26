
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
	centersCylinder,
	rightCuboid,
	coneFrustum: coneFrustumRealizer,
	polygon: polygonRealizer,
	extrusion: extrusionRealizer,
	move,
	rotate: rotateRealizer
};

function packPoint(p) {
	return [p.x, p.y, p.z];
}

function cornersBox({p1, p2}) {
	return synchronousHttpRequest("corners-box", {
		p1: packPoint(p1),
		p2: packPoint(p2)
	});
}
function centerSphere({center, radius}) {
	return synchronousHttpRequest("center-sphere", {
		center: packPoint(center),
		radius
	});
}
function centersCylinder({p1, p2, radius}) {
	return synchronousHttpRequest("centers-cylinder", {
		p1: packPoint(p1),
		p2: packPoint(p2),
		radius
	});
}
function rightCuboid({p1, p2, width, height}) {
	return synchronousHttpRequest("right-cuboid", {
		p1: packPoint(p1),
		p2: packPoint(p2),
		width,
		height
	});
}
function coneFrustumRealizer({p1, p2, radTop, radBot}) {
	return synchronousHttpRequest("cone-frustum", {
		p1: packPoint(p1),
		p2: packPoint(p2),
		radBot,
		radTop
	});
}
function polygonRealizer({vertices}) {
	return synchronousHttpRequest("polygon", {
		vertices: vertices.map(packPoint)
	});
}
function extrusionRealizer({shape, vec}) {
	return synchronousHttpRequest("extrusion", {
		shape: toCAD(shape),
		vec: packPoint(vec)
	});
}
function move({shape, vec}) {
	return synchronousHttpRequest("move", {
		shape: toCAD(shape),
		vec: packPoint(vec)
	});
}
function rotateRealizer({shape, ang, p, vec}) {
	return synchronousHttpRequest("rotate", {
		shape: toCAD(shape),
		ang,
		p: packPoint(p),
		vec: packPoint(vec)
	});
}

export {resultsToCAD};





import {runProgramPrime2} from './running-idea.js';
import {transform as saveTopLevelTransform} from './Instrumentation/save-top-level-transform.js';

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
function rightCuboidPrimitive(p1, width, height, p2) {
	return {
		[PrimitiveProp]: "rightCuboid",
		p1,
		width,
		height,
		p2
	};
}
function coneFrustumPrimitive(p1, radBot, radTop, p2) {
	return {
		[PrimitiveProp]: "coneFrustum",
		p1, 
		radBot,
		radTop,
		p2
	};
}
function polygonPrimitive(verts) {
	return {
		[PrimitiveProp]: "polygon",
		vertices: verts
	};
}
function extrusionPrimitive(shape, vec) {
	return {
		[PrimitiveProp]: "extrusion",
		shape,
		vec
	};
}
function translatePrimitive(shape, vec) {
	return {
		[PrimitiveProp]: "move",
		shape,
		vec
	};
}
function rotatePrimitive(shape, ang, p, vec) {
	return {
		[PrimitiveProp]: "rotate",
		shape,
		ang,
		p,
		vec
	};
}

import _ from 'lodash';
import THREE from 'three';

import sequence from '../SceneGraph/Predefs/sequence.js';
import {point, vector} from '../SceneGraph/Predefs/point-vector-matrix.js';
import random from '../SceneGraph/Predefs/random.js';
import math from '../SceneGraph/Predefs/math.js';
import functional from '../SceneGraph/Predefs/functional.js';

const cylinder = {};
cylinder.byCentersRadius = function([c1, c2], radius) {
	return centersCylinderPrimitive(c1, c2, radius);
};
cylinder.byBottomRadiusHeight = function (bottom, radius, height) {
	let top = vector.add(bottom, vector.byXYZ(0, 0, height));
	return centersCylinderPrimitive(bottom, top, radius);
};

const sphere = {};
sphere.byCenterRadius = function(center, radius) {
	return centerSpherePrimitive(center, radius);
};

const box = {};
box.byCorners = function([c1, c2]) {
	return cornersBoxPrimitive(c1, c2);
};
box.byCornerXYZ = function(c, [dx, dy, dz]) {
	return cornersBoxPrimitive(c, vector.add(c, vector.byXYZ(dx, dy, dz)));
};
box.byBottomWidthHeightZ = function(p, [width, height], z) {
	return rightCuboidPrimitive(p, width, height, vector.add(p, vector.byZ(z)));
};
box.byCentersWidthHeight = function([c1, c2], [width, height]) {
	return rightCuboidPrimitive(c1, width, height, c2);
};
box.byWidthHeightDepth = function(width, height, depth) {
	return rightCuboidPrimitive(vector.byZ(-depth/2.0), width, height, vector.byZ(depth/2.0));
};

const coneFrustum = {};
coneFrustum.byBottomTopRadiusesHeight = function(p, radBot, radTop, height) {
	return coneFrustumPrimitive(p, radBot, radTop, point.add(p, vector.byZ(height)));
};
coneFrustum.byBottomRadiusTopRadius = function(p1, r1, p2, r2) {
	return coneFrustumPrimitive(p1, r1, r2, p2);
};

const polygon = {};
polygon.surface = {};
polygon.surface.byVertices = function(verts) {
	return polygonPrimitive(verts);
};

const extrusion = {};
extrusion.bySurfaceVector = function(surf, vec) {
	return extrusionPrimitive(surf, vec);
};


const translate = function(object) {
	return {
		byVector: (vec)=>{
			return translatePrimitive(object, vec);
		},
		byXYZ: (x, y, z)=>{
			return translatePrimitive(object, vector.byXYZ(x, y, z));
		},
		byX: (x)=>{
			return translatePrimitive(object, vector.byX(x));
		},
		byY: (y)=>{
			return translatePrimitive(object, vector.byY(y));
		},
		byZ: (z)=>{
			return translatePrimitive(object, vector.byZ(z));
		}
	};
};
translate.byVector = function(vec) {
	return _.partial(translatePrimitive, _, vec);
}
translate.byXYZ = function(x, y, z) {
	return _.partial(translatePrimitive, _, vector.byXYZ(x, y, z));
};
translate.byX = function(x){
	return _.partial(translatePrimitive, _, vector.byX(x));
};
translate.byY = function(y){
	return _.partial(translatePrimitive, _, vector.byY(y));
};
translate.byZ = function(z){
	return _.partial(translatePrimitive, _, vector.byZ(z));
};

const origin = vector.byZ(0);
const rotate = function(object) {
	return {
		aroundAxisByAngle: function(axis, radians) {
			return rotatePrimitive(object, radians, axis.center, axis.vector);
		},
		aroundAxisVectorByAngle: function(axisVector, radians) {
			return rotatePrimitive(object, radians, origin, axisVector);
		},
		aroundXByAngle: function(radians) {
			return rotatePrimitive(object, radians, origin, vector.byX(1));
		},
		aroundYByAngle: function(radians) {
			return rotatePrimitive(object, radians, origin, vector.byY(1));
		},
		aroundZByAngle: function(radians) {
			return rotatePrimitive(object, radians, origin, vector.byZ(1));
		},
		aligningAxes: function(fromAxis, toAxis) {
			let dot = fromAxis.dot(toAxis),
				cross = (new THREE.Vector3()).crossVectors(fromAxis, toAxis),
				crossLength = cross.length();
			if (dot === 0.0) {
				return object;
			} else {
				return rotatePrimitive(object, Math.acos(dot), origin, cross.multiplyScalar(1/crossLength));
			}
		}
	};
};
rotate.aroundAxisVectorByAngle = function(axis, radians) {
	return function(object) {
		return rotatePrimitive(object, radians, origin, axis);
	};
};
rotate.aroundXByAngle = function(radians) {
	return function(object) {
		return rotatePrimitive(object, radians, origin, vector.byX(1));
	};
};
rotate.aroundYByAngle = function(radians) {
	return function(object) {
		return rotatePrimitive(object, radians, origin, vector.byY(1));
	};
};
rotate.aroundZByAngle = function(radians) {
	return function(object) {
		return rotatePrimitive(object, radians, origin, vector.byZ(1));
	};
};
rotate.aligningAxes = function(fromAxis, toAxis) {
	return function(object) {
		let dot = fromAxis.dot(toAxis),
			cross = (new THREE.Vector3()).crossVectors(fromAxis, toAxis),
			crossLength = cross.length();
		if (dot === 0.0) {
			return object;
		} else {
			return rotatePrimitive(object, Math.acos(dot), origin, cross.multiplyScalar(1/crossLength));
		}
	}
};

let predefinedBindings = [
	{name: "sequence", value: sequence},
	{name: "box", value: box},
	{name: "cylinder", value: cylinder},
	{name: "sphere", value: sphere},
	{name: "coneFrustum", value: coneFrustum},
	{name: "polygon", value: polygon},
	{name: "extrusion", value: extrusion},
	{name: "point", value: point},
	{name: "vector", value: vector},
	{name: "random", value: random},
	{name: "math", value: math},
	{name: "functional", value: functional},
	{name: "translate", value: translate},
	{name: "rotate", value: rotate}
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

