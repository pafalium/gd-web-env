
import _ from 'lodash';

//This file defines the set of primitives that programs written in the IDE can use.

//ASCII art font is Colossal
//Generated using http://patorjk.com/software/taag/

//- Provide mechanism
//- Declaration of placeholders for objects that are spawned later in to-three and to-cad
//- User program API specification
//   - points, vectors, translation, rotation
//   - APIs for creating objects


//8888888b.                           d8b      888          
//888   Y88b                          Y8P      888          
//888    888                                   888          
//888   d88P 888d888 .d88b.  888  888 888  .d88888  .d88b.  
//8888888P"  888P"  d88""88b 888  888 888 d88" 888 d8P  Y8b 
//888        888    888  888 Y88  88P 888 888  888 88888888 
//888        888    Y88..88P  Y8bd8P  888 Y88b 888 Y8b.     
//888        888     "Y88P"    Y88P   888  "Y88888  "Y8888  
//
//
//

const PrimitiveProp = Symbol("PrimitiveName");

const registry = {
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

export default registry.primitives;
export {PrimitiveProp};

//No points when creating things
//Functional behavior



//888     888 d8b                              .d88888b.  888       d8b          
//888     888 Y8P                             d88P" "Y88b 888       Y8P          
//888     888                                 888     888 888                    
//Y88b   d88P 888  .d88b.  888  888  888      888     888 88888b.  8888 .d8888b  
// Y88b d88P  888 d8P  Y8b 888  888  888      888     888 888 "88b "888 88K      
//  Y88o88P   888 88888888 888  888  888      888     888 888  888  888 "Y8888b. 
//   Y888P    888 Y8b.     Y88b 888 d88P      Y88b. .d88P 888 d88P  888      X88 
//    Y8P     888  "Y8888   "Y8888888P"        "Y88888P"  88888P"   888  88888P' 
//                                                                  888          
//                                                                 d88P          
//                                                               888P"           


//TODO Define more primitives.
//primitives
const boxPrimitive = registry.defPrimitive("box", ["width", "height", "depth"]);
const spherePrimitive = registry.defPrimitive("sphere", ["radius"]);
const cylinderPrimitive = registry.defPrimitive("cylinder", ["radius", "height"]);
const rectanglePrimitive = registry.defPrimitive("rectangle", ["width", "height"]);
const polygonSurfacePrimitive = registry.defPrimitive("polygonSurface", ["vertices"]);
const extrusionPrimitive = registry.defPrimitive("extrusion", ["extrudable", "displacement"]);
const transformObjectPrimitive = registry.defPrimitiveAndProvide("transformObjectWith", ["object", "transform"]);
//registry.defPrimitiveAndProvide("cone", ["radius", "height"]);
const coneFrustumPrimitive = registry.defPrimitive("coneFrustum", ["bottomRadius", "topRadius", "height"]);
//registry.defPrimitiveAndProvide("regularPyramid", ["sides", "height"]);

//registry.defPrimitiveAndProvide("line", ["origin", "direction"]);
//registry.defPrimitiveAndProvide("polyline", ["coordinates", "closed"]);
//registry.defPrimitiveAndProvide("spline", ["coordinates", "closed"]);
//registry.defPrimitiveAndProvide("arc", ["radius", "angle"]);

//registry.defPrimitiveAndProvide("circle", ["radius"]);
//registry.defPrimitiveAndProvide("plane", ["origin", "normal"]);
//registry.defPrimitiveAndProvide("polygon", ["coordinates"]);
//registry.defPrimitiveAndProvide("regularPolygon", ["radius", "sides"]);


//8888888b.          d8b          888                         d8888          d8b          
//888   Y88b         Y8P          888                        d88888          Y8P          
//888    888                      888                       d88P888                       
//888   d88P .d88b.  888 88888b.  888888 .d8888b           d88P 888 888  888 888 .d8888b  
//8888888P" d88""88b 888 888 "88b 888    88K              d88P  888 `Y8bd8P' 888 88K      
//888       888  888 888 888  888 888    "Y8888b.        d88P   888   X88K   888 "Y8888b. 
//888       Y88..88P 888 888  888 Y88b.       X88       d8888888888 .d8""8b. 888      X88 
//888        "Y88P"  888 888  888  "Y888  88888P'      d88P     888 888  888 888  88888P' 
//                                                                                        
//                                                                                        
//                                                                                        

import {point, vector, matrix} from './Predefs/point-vector-matrix.js';
registry.provide("vector", vector);
registry.provide("point", point);
//TODO Check if all vector operations are implemented and available.



const axis = {};
axis.byPointVector = function(point, vector) {
	return {
		origin: point,
		vector
	};
};
registry.provide("axis", axis);


// shapes                                 
// .d8888b.  888                                          
//d88P  Y88b 888                                          
//Y88b.      888                                          
// "Y888b.   88888b.   8888b.  88888b.   .d88b.  .d8888b  
//    "Y88b. 888 "88b     "88b 888 "88b d8P  Y8b 88K      
//      "888 888  888 .d888888 888  888 88888888 "Y8888b. 
//Y88b  d88P 888  888 888  888 888 d88P Y8b.          X88 
// "Y8888P"  888  888 "Y888888 88888P"   "Y8888   88888P' 
//                             888                        
//                             888                        
//                             888                        
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
registry.provide("box", box);


const sphere = {};
sphere.byRadius = function(radius) {
	return spherePrimitive(radius);
};
sphere.byCenterRadius = function(vec, radius) {
	let translation = matrix.translation(vec.x, vec.y, vec.z);
	return transformObjectPrimitive(spherePrimitive(radius), translation);
};
registry.provide("sphere", sphere);


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
	let translationTransform = matrix.translation(
		translationVector.x,
		translationVector.y,
		translationVector.z);

	let transformation = matrix.multiply(translationTransform, orientAxisTransform)
	let cylinder = cylinderPrimitive(radius, vector.length(cylinderAxis));
	return transformObjectPrimitive(cylinder, transformation);
};
registry.provide("cylinder", cylinder);


const rectangle = {};
rectangle.surface = {};
rectangle.surface.byCornerWidthHeight = function(corner, [width, height]) {
	const rect = rectanglePrimitive(width, height);
	const transformation = matrix.translation(width*0.5+corner.x, height*0.5+corner.y, corner.z);
	return transformObjectPrimitive(rect, transformation);
};
registry.provide("rectangle", rectangle);


const polygon = {};
polygon.surface = {};
polygon.surface.byVertices = function(vertices) {
	return polygonSurfacePrimitive(vertices);
};
registry.provide("polygon", polygon);


const extrusion = {};
extrusion.bySurfaceVector = function(surface, displacementVector) {
	return extrusionPrimitive(surface, displacementVector);
};
registry.provide("extrusion", extrusion);


const coneFrustum = {};
coneFrustum.byBottomRadiusTopRadius = function(bottom, botRadius, top, topRadius) {
	let bottomToTop = vector.sub(top, bottom);
	let worldZAxis = vector.byXYZ(0.0,0.0,1.0);
	let orientAxisTransform = matrix.alignFromAxisToAxis(worldZAxis, vector.normalized(bottomToTop));

	let worldOrigin = point.byXYZ(0.0,0.0,0.0);
	let midPoint = point.pointPlusVector(
		bottom, 
		vector.scale(bottomToTop, 0.5));
	let translationVector = point.pointMinusPoint(midPoint, worldOrigin);
	let translationTransform = matrix.translation(
		translationVector.x,
		translationVector.y,
		translationVector.z);

	let transformation = matrix.multiply(translationTransform, orientAxisTransform);

	let height = vector.length(bottomToTop);
	let frustum = coneFrustumPrimitive(botRadius, topRadius, height);

	return transformObjectPrimitive(frustum, transformation);
};
coneFrustum.byRadiusesHeight = function(botRadius, topRadius, height) {
	return coneFrustumPrimitive(botRadius, topRadius, height);
};
coneFrustum.byBottomTopRadiusesHeight = function(bottom, botRadius, topRadius, height) {
	let transformation = matrix.translation(
		bottom.x,
		bottom.y,
		bottom.z + height*0.5);
	return transformObjectPrimitive(
		coneFrustumPrimitive(botRadius, topRadius, height),
		transformation);
};
registry.provide("coneFrustum", coneFrustum);

//88888888888                                 .d888                                        
//    888                                    d88P"                                         
//    888                                    888                                           
//    888  888d888 8888b.  88888b.  .d8888b  888888 .d88b.  888d888 88888b.d88b.  .d8888b  
//    888  888P"      "88b 888 "88b 88K      888   d88""88b 888P"   888 "888 "88b 88K      
//    888  888    .d888888 888  888 "Y8888b. 888   888  888 888     888  888  888 "Y8888b. 
//    888  888    888  888 888  888      X88 888   Y88..88P 888     888  888  888      X88 
//    888  888    "Y888888 888  888  88888P' 888    "Y88P"  888     888  888  888  88888P' 
//
//
//

//TODO Make shapes objects that can have methods.
//TODO Consider whether to extend shape objects with methods to transform them.
/*
shape.scale.uniform(scale)
shape.mirror.byPlane
*/


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
registry.provide("transform", transform);



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
registry.provide("translate", translate);


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
registry.provide("rotate", rotate);


//888b     d888 d8b                   
//8888b   d8888 Y8P                   
//88888b.d88888                       
//888Y88888P888 888 .d8888b   .d8888b 
//888 Y888P 888 888 88K      d88P"    
//888  Y8P  888 888 "Y8888b. 888      
//888   "   888 888      X88 Y88b.    
//888       888 888  88888P'  "Y8888P 
//
//
//


import sequence from './Predefs/sequence.js';
registry.provide("sequence", sequence);

import random from './Predefs/random.js';
registry.provide("random", random);

import functional from './Predefs/functional.js';
registry.provide("functional", functional);



