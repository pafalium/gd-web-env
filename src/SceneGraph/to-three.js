
var THREE = require('three');

/*
	THREE representation generation code.
*/
function isRenderable(result) {
	var isArrayOfRenderables = Array.isArray(result) && result.every(isRenderable);
	return isPrimitive(result) || isArrayOfRenderables;
}

function isPrimitive(result) {
	return renderableFunctions[result.name] !== undefined;
}

// The THREEObject generated for non-renderable results.
function nullThreeObj() {
	return new THREE.Object3D();
}

function resultToThree(result, callback) {
	var threeObj; 
	if(isPrimitive(result)){
		threeObj = renderableFunctions[result.name](result, callback);
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
	parent.add.apply(parent, objs);
	return parent;
}

var renderableFunctions = {
	sphere: sphere,
	cylinder: cylinder,
	box: box,
	move: move,
	rotate: rotate
};

var solidMat = new THREE.MeshPhongMaterial();

var sphereGeom = new THREE.SphereGeometry(1, 32, 32);
function sphere(result, callback) {
	var radius = result.args.radius;
	var obj = new THREE.Mesh(sphereGeom, solidMat);
	obj.scale.set(radius, radius, radius);
	return obj;
}
var cylinderGeom = new THREE.CylinderGeometry(1, 1, 1, 32);
function cylinder(result, callback) {
	var radius = result.args.radius;
	var height = result.args.height;
	var obj = new THREE.Mesh(cylinderGeom, solidMat);
	obj.scale.set(radius, height, radius);
	return obj;
}
var boxGeom = new THREE.BoxGeometry(1, 1, 1);
function box(result, callback) {
	var width = result.args.width,
		height = result.args.height,
		depth = result.args.depth;
	var obj = new THREE.Mesh(boxGeom, solidMat);
	obj.scale.set(width, depth, height);
	return obj;
}
function move(result, callback) {
	var objToMove = resultToThree(result.args.object, callback);
	var x = result.args.x,
		y = result.args.z, //conversion
		z = -result.args.y; //from XZ to XY ground plane
	var obj = new THREE.Object3D();
	obj.position.set(x, y, z);
	obj.add(objToMove);
	return obj;
}
function rotate(result, callback) {
	var objToMove = resultToThree(result.args.object, callback);
	var axis = result.args.axis,
		angle = result.args.angle;
	var yUpAxis = new THREE.Vector3(axis.x, axis.z, -axis.y);
	var obj = new THREE.Object3D();
	obj.add(objToMove);
	obj.quaternion.setFromAxisAngle(yUpAxis, angle);
	return obj;
}



//
// 
//
function convertKeepingCorrespondence(resultsIterable) {

	let resultToTHREEObjects = new Map();
	function keepCorrespondence({result, threeObj}) {
		if(!resultToTHREEObjects.has(result)) {
			resultToTHREEObjects.set(result, []);
		}
		resultToTHREEObjects.get(result).push(threeObj);
	}

	var threeObjects = [];
	for(let result of resultsIterable) {
		let threeObj = resultToThree(result, keepCorrespondence);
		threeObjects.push(threeObj);
	}

	return {
		threeObjects,
		resultToTHREEObjects
	};
}

function convertNormally(resultsIterable) {
	var threeObjects = [];
	for(let result of resultsIterable) {
		threeObjects.push(resultToThree(result, function({result, threeObj}){}));
	}
	return threeObjects;
}

module.exports = {
	isRenderable: isRenderable,
	convert: {
		keepingCorrespondence: convertKeepingCorrespondence,
		normally: convertNormally
	}
};
