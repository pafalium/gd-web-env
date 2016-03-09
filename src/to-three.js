
var THREE = require('three');

//TODO This code shouldn't be here.
//TODO Make it pretty.
//TODO Avoid repeating work, eg, creating THREE.Geometries that don't change.
//TODO Memoize if possible.(can't do if parent-child relation is bidirectional)
//TODO Work on the 3D result structure.
//TODO Make it possible to highlight 3D results.
/*
	THREE representation generation code.
*/
function isRenderable(result) {
	return renderableFunctions[result.name] !== undefined;
}

function resultToThree(result) {
	return renderableFunctions[result.name](result);
}


var renderableFunctions = {
	sphere: sphere,
	cylinder: cylinder,
	box: box,
	move: move,
	group: group
};

var solidMat = new THREE.MeshPhongMaterial();

var sphereGeom = new THREE.SphereGeometry(1, 32, 32);
function sphere(result) {
	var radius = result.args.radius;
	var obj = new THREE.Mesh(sphereGeom, solidMat);
	obj.scale.set(radius, radius, radius);
	return obj;
}
var cylinderGeom = new THREE.CylinderGeometry(1, 1, 1, 32);
function cylinder(result) {
	var radius = result.args.radius;
	var height = result.args.height;
	var obj = new THREE.Mesh(cylinderGeom, solidMat);
	obj.scale.set(radius, height, radius);
	return obj;
}
var boxGeom = new THREE.BoxGeometry(1, 1, 1);
function box(result) {
	var width = result.args.width,
		height = result.args.height,
		depth = result.args.depth;
	var obj = new THREE.Mesh(boxGeom, solidMat);
	obj.scale.set(width, height, depth);
	return obj;
}
function move(result) {
	var objToMove = resultToThree(result.args.object);
	var x = result.args.x,
		y = result.args.z, //conversion
		z = -result.args.y; //from XZ to XY ground plane
	var obj = new THREE.Object3D();
	obj.position.set(x, y, z);
	obj.add(objToMove);
	return obj;
}
function group(result) {
	var objs = result.args.objects;
	var threeObjs = objs.map(resultToThree);
	var obj = new THREE.Object3D();
	obj.add.apply(obj, threeObjs);
	return obj;
}

module.exports = {
	isRenderable: isRenderable,
	resultToThree: resultToThree
};
