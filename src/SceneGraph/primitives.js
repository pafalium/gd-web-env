
import THREE from 'three';
import _ from 'lodash';

//This file defines the set of primitives that programs written in the IDE can use.

const PrimitiveProp = Symbol("PrimitiveName");

const r = {
	primitives: [],
	provide: function(name, value) {
		this.primitives.push({
			name,
			value
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

import {matrix} from './Predefs/point-vector-matrix.js';

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


import {point, vector} from './Predefs/point-vector-matrix.js';
r.provide("vector", vector);
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
	const transform = matrix.translation(
		baseCenter.x, 
		baseCenter.y, 
		baseCenter.z + z / 2.0);
	return transformObjectPrimitive(prim, transform);
};
box.byCorners = function([pt1, pt2]) {
	const dimsVec = point.sub(pt2, pt1);
	const box = boxPrimitive(Math.abs(dimsVec.x), Math.abs(dimsVec.y), Math.abs(dimsVec.z));
	const centerPt = point.add(pt1, vector.scale(dimsVec, 0.5));
	const transformation = matrix.translation(centerPt.x, centerPt.y, centerPt.z);
	return transformObjectPrimitive(box, transformation);
};
box.byCornerXYZ = function(pt, [x, y, z]) {
	let p2 = point.add(pt, vector.byXYZ(x, y, z));
	return box.byCorners([pt, p2]);
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
	let worldZAxis = vector.byXYZ(0.0,0.0,1.0);
	let orientAxisTransform = matrix.alignFromAxisToAxis(worldZAxis, vector.normalized(cylinderAxis));

	let worldOrigin = point.byXYZ(0.0,0.0,0.0);
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


import sequence from './Predefs/sequence.js';
r.provide("sequence", sequence);

import random from './Predefs/random.js';
r.provide("random", random);

import functional from './Predefs/functional.js';
r.provide("functional", functional);


export default r.primitives;
export {PrimitiveProp};
