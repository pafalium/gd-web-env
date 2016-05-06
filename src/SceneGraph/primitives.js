
import THREE from 'three';

//This file defines the set of primitives that programs written in the IDE can use.

const PrimitiveProp = Symbol("PrimitiveName");

const r = {
	primitives: [],
	defPrimitive: function(name, args, fn) {
		this.primitives.push({
			[PrimitiveProp]: name,
			args: args,
			fn: fn ? fn : function delayedPrimitive() {
				var realArguments = arguments;
				var callArgs = {};
				args.forEach(function(paramName, i){
						callArgs[paramName] = i<realArguments.length ? realArguments[i] : undefined;
					});
				return {
					[PrimitiveProp]: name,
					args: callArgs
				};
			}
		});
	}
};

//No points when creating things
//Functional behavior

// vectors
r.defPrimitive("xyz", ["x", "y", "z"], function(x,y,z) {
	return new THREE.Vector3(x,y,z);
});
r.defPrimitive("polar", ["radius", "phi"]);
r.defPrimitive("cylindrical", ["radius", "phi", "z"]);
r.defPrimitive("spherical", ["radius", "longitude", "azimuth"]);

r.defPrimitive("point_distance", ["p1", "p2"], function(p1, p2){
	return p2.clone().sub( p1 ).length();
});
r.defPrimitive("dot", ["v1", "v2"], function(v1, v2) {
	return v1.dot(v2);
});
r.defPrimitive("cross", ["v1", "v2"], function(v0, v1){
	return v0.clone().cross( v1 );
});
r.defPrimitive("direction_from_to", ["p0", "p1"], function(p0, p1){
	return p1.clone().sub( p0 ).normalize();
});
r.defPrimitive("linear_interpolation", ["p0", "p1", "t"], function(p0, p1, t) {
	return p0.clone().lerp( p1, t );
});
r.defPrimitive("add", ["v1", "v2"], function(v1, v2){
	return v1.clone().add(v2);
});
r.defPrimitive("sub", ["v1", "v2"], function(v1, v2) {
	return v1.clone().sub(v2);
});
r.defPrimitive("mult", ["v1", "v2"], function(v1, v2) {
	return v1.clone().multiply(v2);
});
r.defPrimitive("multScalar", ["v", "s"], function(v, s) {
	return v.clone().multiplyScalar(s);
});
r.defPrimitive("normalize", "v", function(v) {
	return v.clone().normalize();
});
r.defPrimitive("length", ["v"], function(v) {
	return v.length();
});

// shapes
r.defPrimitive("box", ["width", "height", "depth"]);
r.defPrimitive("cylinder", ["radius", "height"]);
const sphere = (function sphere(radius){
	return {[PrimitiveProp]: "sphere", args: {radius}};
});
sphere.withCenter = (function withCenter(vec) {
	return {[PrimitiveProp]: "move", args: {object: this(1.0), x: vec.x, y: vec.y, z: vec.z}};
}).bind(sphere);
r.defPrimitive("sphere", ["radius"], sphere);
r.defPrimitive("cone", ["radius", "height"]);
r.defPrimitive("coneFrustum", ["bottomRadius", "topRadius", "height"]);
r.defPrimitive("regularPyramid", ["sides", "height"]);

r.defPrimitive("line", ["origin", "direction"]);
r.defPrimitive("polyline", ["coordinates", "closed"]);
r.defPrimitive("spline", ["coordinates", "closed"]);
r.defPrimitive("arc", ["radius", "angle"]);

r.defPrimitive("circle", ["radius"]);
r.defPrimitive("plane", ["origin", "normal"]);
r.defPrimitive("polygon", ["coordinates"]);
r.defPrimitive("regularPolygon", ["radius", "sides"]);

// transforms
r.defPrimitive("move", ["object", "x", "y", "z"]);
r.defPrimitive("rotate", ["object", "axis", "angle"]);

// sequences
r.defPrimitive("division", ["start", "end", "divisions"], function(start, end, divisions) {
	var arr = [];
	var stepSize = (end-start) / divisions;
	var i = 0;
	while(i<divisions+1) {
		arr.push(stepSize*i);
		i++;
	}
	return arr;
});
r.defPrimitive("count", ["n"], function(n) {
	var arr = [];
	var i = 0;
	while(i<n) {
		arr.push(i);
		i++;
	}
	return arr;
});
r.defPrimitive("zip", ["l1", "l2"], function(l1, l2) {
	var arr = [];
	var i = 0;
	while(i<l1.length) {
		arr.push([l1[i], l2[i]]);
		i++;
	}
	return arr;
});
r.defPrimitive("cartesianProduct", ["l1", "l2"], function(l1, l2) {
	var arr = [];
	for(let i=0; i<l1.length; i++) {
		for(let j=0; j<l2.length; j++) {
			arr.push([l1[i], l2[j]]);
		}
	}
	return arr;
});
r.defPrimitive("rot", ["lst", "forwardSteps"], function(lst, forwardSteps) {
	function posModulo(dividend, divisor) {
		return ((dividend%divisor)+divisor)%divisor;
	}
	var arr = [];
	for(let i=0; i<lst.length; i++) {
		arr.push(lst[posModulo(i-forwardSteps, lst.length)]);//FIXME positive modulo
	}
	return arr;
});

/*
vec = {}; 
{_threeVec: new THREE.Vector3(0,0,0),
 cartesianCoords: [x,y,z],
 dir: [alpha, beta],
 magntitude: num
 }
vec.byXYZ = vecbyXYZ;
vec.byCylindrical = vecbyCylindrical;
vec.byPolar
vec.bySpherical
vec.add
vec.sub
vec.scale
vec.mul
vec.dot
vec.cross
vec.length
vec.lengthSqr 
*/

/*
shape.move.byXYZ(x,y,z)
shape.move.byZ(z)
shape.move.byVector(vector)
shape.rotate.byAxisAngle(axis,angle)
shape.scale.uniform(scale)
shape.mirror.byPlane
*/

export default r.primitives;
export {PrimitiveProp};
