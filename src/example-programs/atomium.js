
//atomium
//a cube with spheres in vertices and geometric center, with cylinders in diagonals and edges

//
// TODO Get the prototype to run the atomium example.
// TODO Implement richer primitives.
//

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
	return cs.map(c=>sphere.withCenter(c));
}

function atomiumFrame(c0, upCs, downCs) {
	return box(0.1,0.1,0.1);
	/*return [
		upCs.zipWith(upCs.rotate(1)).map([c1,c2]=>cylinder.withCenters(c1, c2)),
		downCs.zipWith(downCs.rotate(1)).map([c1,c2]=>cylinder.withCenters(c1,c2)),
		upCs.zipWith(downCs).map([c1,c2]=>cylinder.withCenters(c1,c2)),
		repeat(c0).zipWith(upCs.concat(downCs)).map([c1,c2]=>cylinder.withCenters(c1,c2))
	];*/
}


atomium();

//extended arrays: zipWith, rotate
//lazy seqs: repeat
//mixing arrays and lazy seqs
//destructuring assignment: var [c1, c2] = [xyz(0,0,0), cylindric(10, 90deg, 0)];

//spheres and cylinders: 
//--constructors: withCenters, withCenter
//--modifiers: translate, rotate