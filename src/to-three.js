
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
	var renderables = {sphere: true, cylinder: true, box: true, move: true, group: true};
	return renderables[result.name] === true;
}

function resultToThree(result) {
	var renderableFunctions = {
		sphere: function(result) {
			var radius = result.args.radius;
			var geom = new THREE.SphereGeometry(radius, 32, 32);
			var mat = new THREE.MeshPhongMaterial();
			var obj = new THREE.Mesh(geom, mat);
			return obj;
		},
		cylinder: function(result) {
			var radius = result.args.radius;
			var height = result.args.height;
			var geom = new THREE.CylinderGeometry(radius, radius, height, 32);
			var mat = new THREE.MeshPhongMaterial();
			var obj = new THREE.Mesh(geom, mat);
			return obj;
		},
		box: function(result) {
			var width = result.args.width,
				height = result.args.height,
				depth = result.args.depth;
			var geom = new THREE.BoxGeometry(width, height, depth);
			var mat = new THREE.MeshPhongMaterial();
			var obj = new THREE.Mesh(geom, mat);
			return obj;
		},
		move: function(result){
			var objToMove = resultToThree(result.args.object);
			var x = result.args.x,
				y = result.args.z,//conversion
				z = -result.args.y;//from XZ to XY ground plane
			var obj = new THREE.Object3D();
			obj.position.set(x,y,z);
			obj.add(objToMove);
			return obj;
		},
		group: function(result){
			var objs = result.args.objects;
			var threeObjs = objs.map(resultToThree);
			var obj = new THREE.Object3D();
			obj.add.apply(obj, threeObjs);
			return obj;
		}
	};
	return renderableFunctions[result.name](result);
}


module.exports = {
	isRenderable: isRenderable,
	resultToThree: resultToThree
};
