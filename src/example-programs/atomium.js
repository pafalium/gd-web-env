
//atomium
//a cube with spheres in vertices and geometric center, with cylinders in diagonals and edges

const xyz = point.byXYZ;

function atomium() {
	var c0 = xyz(0,0,0),
		c1 = xyz(-1,-1,1),
		c2 = xyz(1,-1,1),
		c3 = xyz(1,1,1),
		c4 = xyz(-1,1,1),
		c5 = xyz(-1,-1,-1),
		c6 = xyz(1,-1,-1),
		c7 = xyz(1,1,-1),
		c8 = xyz(-1,1,-1);
	return [
		atomiumSpheres([c0,c1,c2,c3,c4,c5,c6,c7,c8]),
		atomiumFrame(c0, [c1,c2,c3,c4], [c5,c6,c7,c8])
	];
}

function atomiumSpheres(cs) {
	return sequence.map(c=>sphere.byCenterRadius(c, 0.3), cs);
}

function atomiumFrame(c0, upCs, downCs) {
	return [
		sequence.map(
			([p1,p2])=>atomiumTube(p1,p2),
			sequence.zip(upCs, sequence.rotate(upCs, 1))),
		sequence.map(
			([p1,p2])=>atomiumTube(p1,p2),
			sequence.zip(downCs, sequence.rotate(downCs, 1))),
		sequence.map(
			([p1,p2])=>atomiumTube(p1,p2),
			sequence.zip(upCs, downCs)),
		sequence.map(
			([p1,p2])=>atomiumTube(p1,p2),
			sequence.zip(
				sequence.repeatTimes(c0, 8), sequence.concat(upCs, downCs)))
	];
}

function atomiumTube(p1, p2) {
	return cylinder.byCentersRadius([p1, p2], 0.1);
}

atomium();

