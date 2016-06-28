
import THREE from 'three';
import _ from 'lodash';

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
matrix.basis = function(xVector, yVector, zVector, origin=point.byXYZ(0,0,0)) {
	let tmp = new THREE.Matrix4();
	tmp.makeBasis(xVector, yVector, zVector);
	tmp.setPosition(origin);
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


//TODO Add transform to rotate from one axis to other axis.
//TODO Make transforms functions that can be applied to objects.
const transform = {};
transform.translation = {};
transform.translation.byVector = function(vector) {
	return matrix.translation(vector.x, vector.y, vector.z);
};
transform.rotation = {};
transform.rotation.aroundAxisByAngle = function(axis, radians) {
	let axisOrig = axis.origin;
	let axisToWorldOriginMatrix = matrix.translation(-axisOrig.x, -axisOrig.y, -axisOrig.z);
	let rotationMatrix = matrix.rotation(axis.vector, radians);
	let repositionAxisMatrix = matrix.translation(axisOrig.x, axisOrig.y, axisOrig.z);
	return matrix.multiply(repositionAxisMatrix, 
		matrix.multiply(rotationMatrix, axisToWorldOriginMatrix));
};
transform.rotation.aroundAxisVectorByAngle = function(axisVector, radians) {
	let normalizedAxis = axisVector.clone().normalize();
	return matrix.rotation(normalizedAxis, radians);
};
transform.rotation.aroundXByAngle = function(radians) {
	return matrix.rotation(vector.byX(1.0), radians);
};
transform.rotation.aroundYByAngle = function(radians) {
	return matrix.rotation(vector.byY(1.0), radians);
};
transform.rotation.aroundZByAngle = function(radians) {
	return matrix.rotation(vector.byZ(1.0), radians);
};
transform.scaling = {};
transform.scaling.byFactor = function(scaleFactor) {
	return matrix.scaling(scaleFactor, scaleFactor, scaleFactor);
};
transform.compose = function(t1, t2) {
	return matrix.multiply(t1, t2);
};
r.provide("transform", transform);


const axis = {};
axis.byPointVector = function(point, vector) {
	return {
		origin: point,
		vector
	};
};
r.provide("axis", axis);


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
vector.byXY = function(x, y) {
	return vector.byXYZ(x, y, 0);
};
vector.byYZ = function(y, z) {
	return vector.byXYZ(0, y, z);
};
vector.byX = function(x) {
	return vector.byXYZ(x, 0.0, 0.0);
};
vector.byY = function(y) {
	return vector.byXYZ(0.0, y, 0.0);
};
vector.byZ = function(z) {
	return vector.byXYZ(0.0, 0.0, z);
};
vector.byCylindrical = function(radius, theta, height) {
	return vector.byXYZ(radius*Math.cos(theta), radius*Math.sin(theta), height);
};
vector.bySpherical = function(radius, azimuthAngle, polarAngle) {
	let sinPolar = Math.sin(polarAngle);
	return vector.byXYZ(
		radius*Math.cos(azimuthAngle)*sinPolar,
		radius*Math.sin(azimuthAngle)*sinPolar,
		radius*Math.cos(polarAngle));
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
point.byXY = function(x, y) {
	return point.byXYZ(x, y, 0);
};
point.byXZ = function(x, z) {
	return point.byXYZ(x, 0, z);
};
point.byYZ = function(y, z) {
	return point.byXYZ(0, y, z);
};
point.byX = function(x) {
	return point.byXYZ(x, 0.0, 0.0);
};
point.byY = function(y) {
	return point.byXYZ(0.0, y, 0.0);
};
point.byZ = function(z) {
	return point.byXYZ(0.0, 0.0, z);
};
point.byCylindrical = function(radius, theta, height) {
	return point.byXYZ(radius*Math.cos(theta), radius*Math.sin(theta), height);
};
point.bySpherical = function(radius, azimuthAngle, polarAngle) {
	let sinPolar = Math.sin(polarAngle);
	return point.byXYZ(
		radius*Math.cos(azimuthAngle)*sinPolar,
		radius*Math.sin(azimuthAngle)*sinPolar,
		radius*Math.cos(polarAngle));
};
point.x = function(pt) {
	return pt.x;
};
point.y = function(pt) {
	return pt.y;
};
point.z = function(pt) {
	return pt.z;
};
point.origin = function() {
	return point.byXYZ(0, 0, 0);
}
point.add = function(point, vec) {
	return point.clone().add(vec);
};
point.addX = function(pt, x) {
	return point.add(pt, vector.byXYZ(x, 0, 0));
};
point.addXZ = function(pt, x, z) {
	return point.add(pt, vector.byXYZ(x, 0, z));
};
point.addZ = function(pt, z) {
	return point.add(pt, vector.byXYZ(0, 0, z));
};
point.sub = function(p1, p2) {
	return p1.clone().sub(p2);
};
point.pointPlusVector = point.add;
point.pointMinusPoint = point.sub;
r.provide("point", point);
//TODO Check if all vector operations are implemented and available.
// vectors
//
//r.defPrimitive("point_distance", ["p1", "p2"], function(p1, p2){
//	return p2.clone().sub( p1 ).length();
//});
//r.defPrimitive("direction_from_to", ["p0", "p1"], function(p0, p1){
//	return p1.clone().sub( p0 ).normalize();
//});
//r.defPrimitive("linear_interpolation", ["p0", "p1", "t"], function(p0, p1, t) {
//	return p0.clone().lerp( p1, t );
//});
//r.defPrimitive("mult", ["v1", "v2"], function(v1, v2) {
//	return v1.clone().multiply(v2);
//});
/*
vec = {}; 
{_threeVec: new THREE.Vector3(0,0,0),
 cartesianCoords: [x,y,z],
 dir: [alpha, beta],
 magntitude: num
 }
vec.byPolar
vec.mul
vec.lengthSqr 
*/


//TODO Define more primitives.
//primitives
const boxPrimitive = r.defPrimitive("box", ["width", "height", "depth"]);
const spherePrimitive = r.defPrimitive("sphere", ["radius"]);
const cylinderPrimitive = r.defPrimitive("cylinder", ["radius", "height"]);
const rectanglePrimitive = r.defPrimitive("rectangle", ["width", "height"]);
const polygonSurfacePrimitive = r.defPrimitive("polygonSurface", ["vertices"]);
const extrusionPrimitive = r.defPrimitive("extrusion", ["extrudable", "displacement"]);
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
	function sphPhi(vec) {
		let {x, y} = vec;
		if(x == 0 && y == 0) {
			return 0;
		} else {
			return Math.atan2(y, x);
		}
	}

	let boxAxis = point.pointMinusPoint(topCenter, baseCenter);
	let worldXAxis = vector.byCylindrical(1, sphPhi(boxAxis) + Math.PI/2, 0);
	let worldYAxis = vector.normalized(vector.cross(boxAxis, worldXAxis));
	let worldZAxis = vector.normalized(boxAxis);
	let midPoint = point.pointPlusVector(
		baseCenter, 
		vector.scale(
			point.pointMinusPoint(topCenter, baseCenter),
			0.5));

	let transformation = matrix.basis(worldXAxis, worldYAxis, boxAxis, midPoint);

	let box = boxPrimitive(width, height, 1.0);
	return transformObjectPrimitive(box, transformation);
};
box.byBottomWidthHeightZ = function(baseCenter, [width, height], z) {
	const prim = boxPrimitive(width, height, z);
	const transform = matrix.translation(baseCenter.x, baseCenter.y, baseCenter.z);
	return transformObjectPrimitive(prim, transform);
};
box.byCorners = function([pt1, pt2]) {
	const dimsVec = point.sub(pt2, pt1);
	const box = boxPrimitive(Math.abs(dimsVec.x), Math.abs(dimsVec.y), Math.abs(dimsVec.z));
	const centerPt = point.add(pt1, vector.scale(dimsVec, 0.5));
	const transformation = matrix.translation(centerPt.x, centerPt.y, centerPt.z);
	return transformObjectPrimitive(box, transformation);
};
r.provide("box", box);


const sphere = {};
sphere.byRadius = function(radius) {
	return spherePrimitive(radius);
};
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


const rectangle = {};
rectangle.surface = {};
rectangle.surface.byCornerWidthHeight = function(corner, [width, height]) {
	const rect = rectanglePrimitive(width, height);
	const transformation = matrix.translation(width*0.5+corner.x, height*0.5+corner.y, corner.z);
	return transformObjectPrimitive(rect, transformation);
};
r.provide("rectangle", rectangle);


const polygon = {};
polygon.surface = {};
polygon.surface.byVertices = function(vertices) {
	return polygonSurfacePrimitive(vertices);
};
r.provide("polygon", polygon);


const extrusion = {};
extrusion.bySurfaceVector = function(surface, displacementVector) {
	return extrusionPrimitive(surface, displacementVector);
};
r.provide("extrusion", extrusion);


// shape transformation functions
function translateAux(object, vec) {
	return transformObjectPrimitive(object, 
				transform.translation.byVector(vec));
}
const translate = function(object) {
	return {
		byVector: (vec)=>{
			return translateAux(object, vec);
		},
		byXYZ: (x, y, z)=>{
			return translateAux(object, vector.byXYZ(x, y, z));
		},
		byX: (x)=>{
			return translateAux(object, vector.byX(x));
		},
		byY: (y)=>{
			return translateAux(object, vector.byY(y));
		},
		byZ: (z)=>{
			return translateAux(object, vector.byZ(z));
		}
	};
};
translate.byVector = function(vec) {
	return _.partial(translateAux, _, vec);
}
translate.byXYZ = function(x, y, z) {
	return _.partial(translateAux, _, vector.byXYZ(x, y, z));
};
translate.byX = function(x){
	return _.partial(translateAux, _, vector.byX(x));
};
translate.byY = function(y){
	return _.partial(translateAux, _, vector.byY(y));
};
translate.byZ = function(z){
	return _.partial(translateAux, _, vector.byZ(z));
};
r.provide("translate", translate);


const rotate = function(object) {
	return {
		aroundAxisByAngle: function(axis, radians) {
			return transformObjectPrimitive(object,
				transform.rotation.aroundAxisByAngle(axis, radians));
		},
		aroundAxisVectorByAngle: function(axis, radians) {
			return transformObjectPrimitive(object,
				transform.rotation.aroundAxisVectorByAngle(axis, radians));
		},
		aroundXByAngle: function(radians) {
			return transformObjectPrimitive(object,
				transform.rotation.aroundXByAngle(radians));
		},
		aroundYByAngle: function(radians) {
			return transformObjectPrimitive(object,
				transform.rotation.aroundYByAngle(radians));
		},
		aroundZByAngle: function(radians) {
			return transformObjectPrimitive(object,
				transform.rotation.aroundZByAngle(radians));
		}
	};
};
rotate.aroundAxisVectorByAngle = function(axis, radians) {
	return function(object) {
		return transformObjectPrimitive(object,
			transform.rotation.aroundAxisVectorByAngle(axis, radians));
	};
};
rotate.aroundXByAngle = function(radians) {
	return function(object) {
		return transformObjectPrimitive(object,
				transform.rotation.aroundXByAngle(radians));
	};
};
rotate.aroundYByAngle = function(radians) {
	return function(object) {
		return transformObjectPrimitive(object,
				transform.rotation.aroundYByAngle(radians));
	};
};
rotate.aroundZByAngle = function(radians) {
	return function(object) {
		return transformObjectPrimitive(object,
				transform.rotation.aroundZByAngle(radians));
	};
};
r.provide("rotate", rotate);


//////////////////////////////////
//////////////////////////////////
//////////////////////////////////
//TODO Make shapes objects that can have methods.
//TODO Consider whether to extend shape objects with methods to transform them.
/*
shape.translate.byXYZ(x,y,z)
shape.translate.byZ(z)
shape.translate.byVector(vector)
shape.rotate.byAxisAngle(axis,angle)
shape.scale.uniform(scale)
shape.mirror.byPlane
*/


const sequence = {};
sequence.map = function(fn, seq) {
	return seq.map(fn);
};
sequence.reduce = function(fn, seq, initialValue) {
	return seq.reduce(fn, initialValue);
};
sequence.division = function(start, end, divisions) {
	// Divide directed interval defined by 'start' and 'end' into 'divisions' segments.
	//    Return return the sequence of numbers that define those segments.
	// Return a sequence of equally spaced numbers between start and end.
	// [x_1=start, ..., x_divisions, x_divisions+1=end]
	var arr = [];
	var stepSize = (end-start) / divisions;
	var i = 0;
	while(i<divisions+1) {
		arr.push(stepSize*i);
		i++;
	}
	return arr;
};
sequence.intervalDivision = function(a, b, n) {
	//[x_1=start, ..., x_n=end]
  var spacing = (b-a)/(n-1);
  var res = [];
  for(var i=0; i<n; i++) {
    res.push(a+i*spacing);
  }
  return res;
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
sequence.zip = function(...lists) {
	const smallerLength = Math.min(...lists.map(lst => lst.length));
	var arr = [];
	var i = 0;
	while(i<smallerLength) {
		arr.push(lists.map(lst => lst[i]));
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
};
sequence.concat = function(lst1, lst2) {
	return lst1.concat(lst2);
};
sequence.length = function(lst) {
	return lst.length;
};
sequence.drop = function(lst, n) {
	return lst.slice(n);
};
sequence.dropRight = function(lst, n) {
	return lst.slice(0, lst.length-n);
};
r.provide("sequence", sequence);


const random = {};
random.inRange = function(lower, upper) {
	return _.random(lower, upper);
};
random.integer = function(upper) {
	return _.random(Math.trunc(upper));
};
random.integer.inRange = function(lower, upper) {
	return _.random(Math.trunc(lower), Math.trunc(upper));
};
random.real = function(upper) {
	return _.random(upper, true);
};
random.real.inRange = function(lower, upper) {
	return _.random(lower, upper, true);
};
r.provide("random", random);



export default r.primitives;
export {PrimitiveProp};
