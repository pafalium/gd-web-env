

const {map, zip, concat, repeatTimes, rotateLeft} = sequence;
const xyz = point.byXYZ;

function atomiumSpheres(cs, r) {
	return map(c => sphere.byCenterRadius(c, r), cs);
}

function atomiumTubes(c0, upCs, downCs, r) {
	return [
		map(([p1,p2]) => atomiumTube(p1, p2, r),
			zip(upCs, rotateLeft(upCs, 1))),
		map(([p1,p2]) => atomiumTube(p1, p2, r),
			zip(downCs, rotateLeft(downCs, 1))),
		map(([p1,p2]) => atomiumTube(p1, p2, r),
			zip(upCs, downCs)),
		map(([p1,p2]) => atomiumTube(p1, p2, r),
			zip(repeatTimes(c0, 8), concat(upCs, downCs)))
	];
}

function atomiumTube(p1, p2, r) {
	return cylinder.byCentersRadius([p1, p2], r);
}

function atomiumFrame(sphereR, frameW, tubeR) {
	let c0 = xyz(0,0,0),
		c1 = xyz(-frameW, -frameW, +frameW),
		c2 = xyz(+frameW, -frameW, +frameW),
		c3 = xyz(+frameW, +frameW, +frameW),
		c4 = xyz(-frameW, +frameW, +frameW),
		c5 = xyz(-frameW, -frameW, -frameW),
		c6 = xyz(+frameW, -frameW, -frameW),
		c7 = xyz(+frameW, +frameW, -frameW),
		c8 = xyz(-frameW, +frameW, -frameW);
	return [
		atomiumSpheres([c0,c1,c2,c3,c4,c5,c6,c7,c8], sphereR),
		atomiumTubes(c0, [c1,c2,c3,c4], [c5,c6,c7,c8], tubeR)
	];
}

function atomium(sphereR, frameW, tubeR) {
	return rotate(atomiumFrame(sphereR, frameW, tubeR))
		.aligningAxes(axis.z, axis.xyz);
}

atomium(9, 32, 1.5);

