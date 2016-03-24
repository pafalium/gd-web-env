
//This file defines the set of primitives that programs written in the IDE can use.

var p = {
	primitives: [],
	defPrimitive: function(name, args) {
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

p.defPrimitive("xyz", ["x", "y", "z"]);
p.defPrimitive("polar", ["radius", "phi"]);
p.defPrimitive("cylindrical", ["radius", "phi", "z"]);
p.defPrimitive("spherical", ["radius", "longitude", "azimuth"]);

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
p.defPrimitive("group", ["objects"]);

module.exports = p.primitives;