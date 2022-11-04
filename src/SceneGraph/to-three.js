
import THREE from 'three';
import {PrimitiveProp} from './primitives.js';
import makeMatrixTransformedObject3D from './makeMatrixTransformedObject3D.js';
import {surfaceMat, solidMat} from './default-materials.js';
import {polygonSurface} from './polygon-surface.js';
import {extrusion} from './extrusion.js';

/*
	THREE representation generation code.
*/
function isRenderable(result) {
	return isPrimitive(result) || isArrayOfRenderables(result);
}

function isPrimitive(result) {
	return isSomething(result) && renderableFunctions[result[PrimitiveProp]] !== undefined;
}

function isSomething(result) {
	return result !== undefined && result !== null;
}

function isArrayOfRenderables(result) {
	return Array.isArray(result) && result.every(isRenderable);
}

// The THREEObject generated for non-renderable results.
function nullThreeObj() {
	return new THREE.Object3D();
}

function resultToThree(result, callback) {
	var threeObj; 
	if(isPrimitive(result)){
		threeObj = renderableFunctions[result[PrimitiveProp]](result, callback);
	} else if(Array.isArray(result)) {
		threeObj = arrayToThree(result, callback);
	} else {
		threeObj = nullThreeObj();
	}
	callback({result, threeObj});
	return threeObj;
}

function arrayToThree(array, callback) {
	var objs = array.map(r=>resultToThree(r, callback));
	var parent = new THREE.Object3D();
	if (objs.length !== 0) {
		parent.add.apply(parent, objs);
	}
	return parent;
}

var renderableFunctions = {
	sphere,
	cylinder,
	box,
	rectangle,
	transformObjectWith,
	polygonSurface,
	extrusion,
	coneFrustum
};

// All geometries need to be rotated so that Z is their up axis.
// They are defined with Y as their up axis so they need to be rotated -pi/2 around X.
// This way Z becomes their up axis.
var yUpToZUpRotation = (new THREE.Matrix4())
	.makeRotationAxis(new THREE.Vector3(1.0, 0.0, 0.0), -Math.PI/2.0);

var sphereGeom = new THREE.SphereGeometry(1, 32, 32);
sphereGeom.applyMatrix(yUpToZUpRotation);
function sphere(result, callback) {
	var radius = result.args.radius;
	var obj = new THREE.Mesh(sphereGeom, solidMat);
	obj.scale.set(radius, radius, radius);
	return obj;
}
var cylinderGeom = new THREE.CylinderGeometry(1, 1, 1, 32);
cylinderGeom.applyMatrix(yUpToZUpRotation);
function cylinder(result, callback) {
	var radius = result.args.radius;
	var height = result.args.height;
	var obj = new THREE.Mesh(cylinderGeom, solidMat);
	obj.scale.set(radius, radius, height);
	return obj;
}
var boxGeom = new THREE.BoxGeometry(1, 1, 1);
boxGeom.applyMatrix(yUpToZUpRotation);
function box(result, callback) {
	var width = result.args.width,
		height = result.args.height,
		depth = result.args.depth;
	var obj = new THREE.Mesh(boxGeom, solidMat);
	obj.scale.set(width, height, depth);
	return obj;
}
var rectangleGeom = new THREE.PlaneGeometry(1, 1);
//rectangleGeom.applyMatrix(yUpToZUpRotation);
function rectangle(result, callback) {
	var width = result.args.width,
		height = result.args.height;
	var obj = new THREE.Mesh(rectangleGeom, surfaceMat);
	obj.scale.set(width, height, 1);
	return obj;
}
function transformObjectWith(result, callback) {
	var objToTransform = resultToThree(result.args.object, callback);
	var matrix = result.args.transform;
	var obj = makeMatrixTransformedObject3D(matrix);
	obj.add(objToTransform);
	return obj;
}
function coneFrustum(result, callback) {
	var {bottomRadius, topRadius, height} = result.args;
	var geom = new THREE.CylinderGeometry(bottomRadius, topRadius, height, 32);
	var obj = new THREE.Mesh(geom, solidMat);
	geom.applyMatrix(yUpToZUpRotation);
	return obj;
}



//
// 
//
function convertKeepingCorrespondence(resultsIterable) {

	let resultToTHREEObjects = new Map();
	let threeObjectToResult = new Map();
	function keepCorrespondence({result, threeObj}) {
		if(!resultToTHREEObjects.has(result)) {
			resultToTHREEObjects.set(result, []);
		}
		resultToTHREEObjects.get(result).push(threeObj);
		threeObjectToResult.set(threeObj, result);
	}

	var threeObjects = [];
	for(let result of resultsIterable) {
		let threeObj = resultToThree(result, keepCorrespondence);
		threeObjects.push(threeObj);
	}

	return {
		threeObjects,
		resultToTHREEObjects,
		threeObjectToResult
	};
}

function convertNormally(resultsIterable) {
	var threeObjects = [];
	for(let result of resultsIterable) {
		threeObjects.push(resultToThree(result, function({result, threeObj}){}));
	}
	return {threeObjects};
}

export {isRenderable};
export const convert = {
	keepingCorrespondence: convertKeepingCorrespondence,
	normally: convertNormally
};
