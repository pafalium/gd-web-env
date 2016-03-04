
//This file defines the set of primitives that programs written in the IDE can use.

var THREE = require('three'),
	Vector3 = THREE.Vector3,
	BoxGeometry = THREE.BoxGeometry;

var p = {
	primitives: [],
	defPrimitive: function(name, args, threeFunc) {
		this.primitives.push({
			name: name,
			args: args,
			fn: function() {
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

p.defPrimitive("xyz", ["x", "y", "z"], function(x,y,z){
	return new Vector3(x,z,-y);
});
p.defPrimitive("polar", ["radius", "phi"], function(radius, phi){
	return new Vector3(Math.cos(phi)*radius, 0, -Math.sin(phi)*radius);
});
p.defPrimitive("cylindrical", ["radius", "phi", "z"], function(radius,phi,z){
	return new Vector3(Math.cos(phi)*radius, z, -Math.sin(phi)*radius);
});
p.defPrimitive("spherical", ["radius", "longitude", "azimuth"], function(radius, longitude, azimuth){
	var sinAzimuth = Math.sin(azimuth);
	return new Vector3(
		radius*Math.cos(longitude)*sinAzimuth, 
		radius*Math.cos(azimuth), 
		-radius*Math.sin(longitude)*sinAzimuth);
});

p.defPrimitive("box", ["width", "height", "depth"], (function(){
	var geom = new BoxGeometry(1,1,1);
	return function(width, height, depth) {
		
	};
})());
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
p.defPrimitive("group", ["objects"]);

module.exports = p.primitives;