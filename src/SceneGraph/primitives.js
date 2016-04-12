
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

p.defPrimitive("move", ["object", "x", "y", "z"]);
p.defPrimitive("rotate", ["object", "axis", "angle"]);

module.exports = p.primitives;