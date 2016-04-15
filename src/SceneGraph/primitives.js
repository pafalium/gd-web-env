
//This file defines the set of primitives that programs written in the IDE can use.

var p = {
	primitives: [],
	defPrimitive: function(name, args, fn) {
		this.primitives.push({
			name: name,
			args: args,
			fn: fn ? fn : function() {
				var realArguments = arguments;
				var callArgs = {};
				args.forEach(function(paramName, i){
						callArgs[paramName] = i<realArguments.length ? realArguments[i] : undefined;
					});
				return {
					name: name,
					args: callArgs
				};
			}
		});
	}
};

//No points when creating things
//Functional behavior

var THREE = require('three');

// vectors
p.defPrimitive("xyz", ["x", "y", "z"], function(x,y,z) {
	return new THREE.Vector3(x,y,z);
});
p.defPrimitive("polar", ["radius", "phi"]);
p.defPrimitive("cylindrical", ["radius", "phi", "z"]);
p.defPrimitive("spherical", ["radius", "longitude", "azimuth"]);

p.defPrimitive("point_distance", ["p1", "p2"], function(p1, p2){
	return p2.clone().sub( p1 ).length();
});
p.defPrimitive("dot", ["v1", "v2"], function(v1, v2) {
	return v1.dot(v2);
});
p.defPrimitive("cross", ["v1", "v2"], function(v0, v1){
	return v0.clone().cross( v1 );
});
p.defPrimitive("direction_from_to", ["p0", "p1"], function(p0, p1){
	return p1.clone().sub( p0 ).normalize();
});
p.defPrimitive("linear_interpolation", ["p0", "p1", "t"], function(p0, p1, t) {
	return p0.clone().lerp( p1, t );
});
p.defPrimitive("add", ["v1", "v2"], function(v1, v2){
	return v1.clone().add(v2);
});
p.defPrimitive("sub", ["v1", "v2"], function(v1, v2) {
	return v1.clone().sub(v2);
});
p.defPrimitive("mult", ["v1", "v2"], function(v1, v2) {
	return v1.clone().multiply(v2);
});
p.defPrimitive("multScalar", ["v", "s"], function(v, s) {
	return v.clone().multiplyScalar(s);
});
p.defPrimitive("normalize", "v", function(v) {
	return v.clone().normalize();
});
p.defPrimitive("length", ["v"], function(v) {
	return v.length();
});

// shapes
p.defPrimitive("box", ["width", "height", "depth"]);
p.defPrimitive("cylinder", ["radius", "height"]);
p.defPrimitive("sphere", ["radius"]);
p.defPrimitive("cone", ["radius", "height"]);
p.defPrimitive("coneFrustum", ["bottomRadius", "topRadius", "height"]);
p.defPrimitive("regularPyramid", ["sides", "height"]);

p.defPrimitive("line", ["origin", "direction"]);
p.defPrimitive("polyline", ["coordinates", "closed"]);
p.defPrimitive("spline", ["coordinates", "closed"]);
p.defPrimitive("arc", ["radius", "angle"]);

p.defPrimitive("circle", ["radius"]);
p.defPrimitive("plane", ["origin", "normal"]);
p.defPrimitive("polygon", ["coordinates"]);
p.defPrimitive("regularPolygon", ["radius", "sides"]);

// transforms
p.defPrimitive("move", ["object", "x", "y", "z"]);
p.defPrimitive("rotate", ["object", "axis", "angle"]);

// sequences
p.defPrimitive("division", ["start", "end", "divisions"], function(start, end, divisions) {
	var arr = [];
	var stepSize = (end-start) / divisions;
	var i = 0;
	while(i<divisions+1) {
		arr.push(stepSize*i);
		i++;
	}
	return arr;
});
p.defPrimitive("count", ["n"], function(n) {
	var arr = [];
	var i = 0;
	while(i<n) {
		arr.push(i);
		i++;
	}
	return arr;
});
p.defPrimitive("zip", ["l1", "l2"], function(l1, l2) {
	var arr = [];
	var i = 0;
	while(i<l1.length) {
		arr.push([l1[i], l2[i]]);
		i++;
	}
	return arr;
});
p.defPrimitive("cartesianProduct", ["l1", "l2"], function(l1, l2) {
	var arr = [];
	for(let i=0; i<l1.length; i++) {
		for(let j=0; j<l2.length; j++) {
			arr.push([l1[i], l2[j]]);
		}
	}
	return arr;
});
p.defPrimitive("rot", ["lst", "forwardSteps"], function(lst, forwardSteps) {
	function posModulo(dividend, divisor) {
		return ((dividend%divisor)+divisor)%divisor;
	}
	var arr = [];
	for(let i=0; i<lst.length; i++) {
		arr.push(lst[posModulo(i-forwardSteps, lst.length)]);//FIXME positive modulo
	}
	return arr;
});

module.exports = p.primitives;