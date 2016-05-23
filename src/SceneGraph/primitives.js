
import THREE from 'three';

//This file defines the set of primitives that programs written in the IDE can use.

const PrimitiveProp = Symbol("PrimitiveName");

const r = {
	primitives: [],
	provide: function(name, value) {
		this.primitives.push({
			[PrimitiveProp]: name,
			value: value
		});
	},
	defPrimitive: function(name, args) {
		return function() {
			var realArguments = arguments;
			var callArgs = {};
			args.forEach(function(paramName, i){
				callArgs[paramName] = i<realArguments.length ? realArguments[i] : undefined;
			});
			return {
				[PrimitiveProp]: name,
				args: callArgs
			};
		};
	},
	defPrimitiveAndProvide: function(name, args) {
		let primitive = this.defPrimitive(name, args);
		this.provide(name, primitive);
		return primitive;
	}
};

//No points when creating things
//Functional behavior


const matrix = {};
matrix.identity = new THREE.Matrix4();
matrix.translation = function(x, y, z) {
	return (new THREE.Matrix4()).makeTranslation(x, y, z);
};
matrix.rotation = function(axisVector, radians) {
	return (new THREE.Matrix4()).makeRotationAxis(axisVector, radians);
};
matrix.scaling = function(xFactor, yFactor, zFactor) {
	return (new THREE.Matrix4()).makeScale(xFactor, yFactor, zFactor);
};
matrix.multiply = function(m1, m2) {
	return m1.clone().multiply(m2);
};
matrix.basis = function(xVector, yVector, zVector) {
	let tmp = new THREE.Matrix4();
	tmp.makeBasis(xVector, yVector, zVector);
	return tmp;
};
matrix.axisCosSinAngle = function(axisVector, cosAngle, sinAngle) {
	//Based on http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToMatrix/index.htm
	let a = axisVector, c = cosAngle, s = sinAngle;
	let t = 1.0 - c;

	let tmp1 = a.x*a.y*t,
		tmp2 = a.z*s,
		tmp3 = a.x*a.z*t,
		tmp4 = a.y*s,
		tmp5 = a.y*a.z*t,
		tmp6 = a.x*s;

	let matr = new THREE.Matrix4();
	matr.set(
		c + a.x*a.x*t, tmp1 - tmp2,   tmp3 + tmp4,   0.0,
		tmp1 + tmp2,   c + a.y*a.y*t, tmp5 - tmp6,   0.0,
		tmp3 - tmp4,   tmp5 + tmp6,   c + a.z*a.z*t, 0.0,
		0.0,           0.0,           0.0,           1.0);

	return matr;
};
matrix.alignFromAxisToAxis = function(fromAxis, toAxis) {
	let dot = fromAxis.dot(toAxis),
		cross = (new THREE.Vector3()).crossVectors(fromAxis, toAxis),
		crossLength = cross.length();
	//TODO Improve vector colinearity check. Use approximate equality.
	let areColinear = crossLength === 0.0;
	if(areColinear) {
		let axis = new THREE.Vector4(1.0, 0.0, 0.0, 0.0);
		return dot < 0.0
			?	matrix.axisCosSinAngle(axis, -1.0, 0.0)
			: matrix.axisCosSinAngle(axis, 1.0, 0.0);
	}	else {
		let axis = cross.clone().multiplyScalar(1.0/crossLength);
		return matrix.axisCosSinAngle(axis, dot, crossLength);
	}
};


const transform = {};
transform.translation = {};
transform.translation.byVector = function(vector) {
	return matrix.translation(vector.x, vector.y, vector.z);
};
transform.rotation = {};
transform.rotation.aroundAxisVectorByAngle = function(axisVector, radians) {
	let normalizedAxis = axisVector.clone().normalize();
	return matrix.rotation(normalizedAxis, radians);
};
transform.scaling = {};
transform.scaling.byFactor = function(scaleFactor) {
	return matrix.scaling(scaleFactor, scaleFactor, scaleFactor);
};
transform.compose = function(t1, t2) {
	return matrix.multiply(t1, t2);
};

r.provide("transform", transform);


const coordinates = {};
coordinates.world = matrix.identity; //TODO getter
coordinates.current = coordinates.world; //TODO getter
coordinates.with = function(coordinateSystem, callback) {
	const oldCoordinateSystem = coordinates.current;
	coordinates.current = coordinateSystem;
	let ret = callback();
	coordinates.current = oldCoordinateSystem;
	return ret;
}

const vector = {};
vector.byXYZ = function(x, y, z) {
	return (new THREE.Vector4(x, y, z, 0.0)).applyMatrix4(coordinates.current);
};
vector.add = function(v1, v2) {
	return v1.clone().add(v2);
};
vector.sub = function(v1, v2) {
	return v1.clone().sub(v2);
};
vector.dot = function(v1, v2) {
	return v1.dot(v2);
};
vector.cross = function(v1, v2) {
	let vec3Result = (new THREE.Vector3()).crossVectors(v1, v2);
	return new THREE.Vector4(vec3Result.x, vec3Result.y, vec3Result.z, 0.0);
};
vector.scale = function(vec, scalar) {
	return vec.clone().multiplyScalar(scalar);
};
vector.length = function(vec) {
	return vec.length();
}
vector.normalized = function(vec) {
	return vec.clone().normalize();
};

r.provide("vector", vector);


const point = {};
point.byXYZ = function(x, y, z) {
	return (new THREE.Vector4(x, y, z, 1.0)).applyMatrix4(coordinates.current);
};
point.origin = function() {
	return point.byXYZ(0, 0, 0);
}
point.pointPlusVector = function(point, vec) {
	return point.clone().add(vec);
};
point.pointMinusPoint = function(p1, p2) {
	return p1.clone().sub(p2);
};

r.provide("point", point);
//TODO Check if all vector operations are implemented and available.
// vectors
//r.defPrimitive("xyz", ["x", "y", "z"], function(x,y,z) {
//	return new THREE.Vector3(x,y,z);
//});
//r.defPrimitive("polar", ["radius", "phi"]);
//r.defPrimitive("cylindrical", ["radius", "phi", "z"]);
//r.defPrimitive("spherical", ["radius", "longitude", "azimuth"]);
//
//r.defPrimitive("point_distance", ["p1", "p2"], function(p1, p2){
//	return p2.clone().sub( p1 ).length();
//});
//r.defPrimitive("dot", ["v1", "v2"], function(v1, v2) {
//	return v1.dot(v2);
//});
//r.defPrimitive("cross", ["v1", "v2"], function(v0, v1){
//	return v0.clone().cross( v1 );
//});
//r.defPrimitive("direction_from_to", ["p0", "p1"], function(p0, p1){
//	return p1.clone().sub( p0 ).normalize();
//});
//r.defPrimitive("linear_interpolation", ["p0", "p1", "t"], function(p0, p1, t) {
//	return p0.clone().lerp( p1, t );
//});
//r.defPrimitive("add", ["v1", "v2"], function(v1, v2){
//	return v1.clone().add(v2);
//});
//r.defPrimitive("sub", ["v1", "v2"], function(v1, v2) {
//	return v1.clone().sub(v2);
//});
//r.defPrimitive("mult", ["v1", "v2"], function(v1, v2) {
//	return v1.clone().multiply(v2);
//});
//r.defPrimitive("multScalar", ["v", "s"], function(v, s) {
//	return v.clone().multiplyScalar(s);
//});
//r.defPrimitive("normalize", ["v"], function(v) {
//	return v.clone().normalize();
//});
//r.defPrimitive("length", ["v"], function(v) {
//	return v.length();
//});
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


//TODO Define more primitives.
//primitives
const boxPrimitive = r.defPrimitive("box", ["width", "height", "depth"]);
const spherePrimitive = r.defPrimitive("sphere", ["radius"]);
const cylinderPrimitive = r.defPrimitive("cylinder", ["radius", "height"]);
const transformObjectPrimitive = r.defPrimitiveAndProvide("transformObjectWith", ["object", "transform"]);
//r.defPrimitiveAndProvide("cone", ["radius", "height"]);
//r.defPrimitiveAndProvide("coneFrustum", ["bottomRadius", "topRadius", "height"]);
//r.defPrimitiveAndProvide("regularPyramid", ["sides", "height"]);

//r.defPrimitiveAndProvide("line", ["origin", "direction"]);
//r.defPrimitiveAndProvide("polyline", ["coordinates", "closed"]);
//r.defPrimitiveAndProvide("spline", ["coordinates", "closed"]);
//r.defPrimitiveAndProvide("arc", ["radius", "angle"]);

//r.defPrimitiveAndProvide("circle", ["radius"]);
//r.defPrimitiveAndProvide("plane", ["origin", "normal"]);
//r.defPrimitiveAndProvide("polygon", ["coordinates"]);
//r.defPrimitiveAndProvide("regularPolygon", ["radius", "sides"]);


// shapes
const box = {};
box.byWidthHeightDepth = function(width, height, depth) {
	return boxPrimitive(width, height, depth);
};
box.byCentersAxes = function([baseCenter, topCenter], [xVector, yVector]) {
	let translateBaseToOrigin = matrix.translation(0.0, 0.0, 0.5);

	let zVector = point.pointMinusPoint(topCenter, baseCenter);
	let basisTransform = matrix.basis(xVector, yVector, zVector);

	let translateToBaseCenter = matrix.translation(baseCenter.x, baseCenter.y, baseCenter.z);

	let completeTransform = matrix.multiply(
		translateToBaseCenter, 
		matrix.multiply(basisTransform, translateBaseToOrigin));
	//transform: move base to wanted base * apply basis * move base to origin

	return transformObjectPrimitive(boxPrimitive(1.0, 1.0, 1.0), completeTransform);
};
box.byCentersWidthHeight = function([baseCenter, topCenter], [width, height]) {
	let boxAxis = point.pointMinusPoint(topCenter, baseCenter);
	let worldZAxis = coordinates.with(coordinates.world, ()=>vector.byXYZ(0.0,0.0,1.0));
	let orientAxisTransform = matrix.alignFromAxisToAxis(worldZAxis, vector.normalized(boxAxis));

	let worldOrigin = coordinates.with(coordinates.world, ()=>point.byXYZ(0.0,0.0,0.0));
	let midPoint = point.pointPlusVector(
		baseCenter, 
		vector.scale(
			point.pointMinusPoint(topCenter, baseCenter),
			0.5));
	let translationVector = point.pointMinusPoint(midPoint, worldOrigin);
	let translationTransform = transform.translation.byVector(translationVector);

	let transformation = transform.compose(translationTransform, orientAxisTransform);
	let box = boxPrimitive(width, height, vector.length(boxAxis));
	return transformObjectPrimitive(box, transformation);
};
r.provide("box", box);


const sphere = {};
sphere.byCenterRadius = function(vec, radius) {
	let translation = transform.translation.byVector(vec);
	return transformObjectPrimitive(spherePrimitive(radius), translation);
};
r.provide("sphere", sphere);


const cylinder = {};
cylinder.byRadiusHeight = function(radius, height) {
	return cylinderPrimitive(radius, height);
};
cylinder.byCentersRadius = function([baseCenter, topCenter], radius) {
	let cylinderAxis = point.pointMinusPoint(topCenter, baseCenter);
	let worldZAxis = coordinates.with(coordinates.world, ()=>vector.byXYZ(0.0,0.0,1.0));
	let orientAxisTransform = matrix.alignFromAxisToAxis(worldZAxis, vector.normalized(cylinderAxis));

	let worldOrigin = coordinates.with(coordinates.world, ()=>point.byXYZ(0.0,0.0,0.0));
	let midPoint = point.pointPlusVector(
		baseCenter, 
		vector.scale(
			point.pointMinusPoint(topCenter, baseCenter),
			0.5));
	let translationVector = point.pointMinusPoint(midPoint, worldOrigin);
	let translationTransform = transform.translation.byVector(translationVector);

	let transformation = transform.compose(translationTransform, orientAxisTransform);
	let cylinder = cylinderPrimitive(radius, vector.length(cylinderAxis));
	return transformObjectPrimitive(cylinder, transformation);
};
r.provide("cylinder", cylinder);


const sequence = {};
sequence.map = function(fn, seq) {
	return seq.map(fn);
};
sequence.division = function(start, end, divisions) {
	var arr = [];
	var stepSize = (end-start) / divisions;
	var i = 0;
	while(i<divisions+1) {
		arr.push(stepSize*i);
		i++;
	}
	return arr;
};
sequence.count = function(n) {
	var arr = [];
	var i = 0;
	while(i<n) {
		arr.push(i);
		i++;
	}
	return arr;
};
sequence.zip = function(l1, l2) {
	var arr = [];
	var i = 0;
	while(i<l1.length) {
		arr.push([l1[i], l2[i]]);
		i++;
	}
	return arr;
};
sequence.cartesianProduct = function(l1, l2) {
	var arr = [];
	for(let i=0; i<l1.length; i++) {
		for(let j=0; j<l2.length; j++) {
			arr.push([l1[i], l2[j]]);
		}
	}
	return arr;
};
sequence.rotate = function(lst, offset) {
	function posModulo(dividend, divisor) {
		return ((dividend%divisor)+divisor)%divisor;
	}
	var arr = [];
	for(let i=0; i<lst.length; i++) {
		arr.push(lst[posModulo(i+offset, lst.length)]);
	}
	return arr;
};
sequence.repeatTimes = function(elem, n) {
	let i=0;
	let arr = [];
	while(i<n) {
		arr.push(elem);
		i++;
	}
	return arr;
}
sequence.concat = function(lst1, lst2) {
	return lst1.concat(lst2);
}

r.provide("sequence", sequence);



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
