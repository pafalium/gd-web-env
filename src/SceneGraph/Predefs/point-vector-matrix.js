
import THREE from 'three';

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


const vector = {};
vector.byXYZ = function(x, y, z) {
	return new THREE.Vector4(x, y, z, 0.0);
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


const point = {};
point.byXYZ = function(x, y, z) {
	return new THREE.Vector4(x, y, z, 1.0);
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
point.subZ = function(pt, z) {
	return point.sub(pt, vector.byXYZ(0, 0, z));
};
point.pointPlusVector = point.add;
point.pointMinusPoint = point.sub;




export {vector, point, matrix};
