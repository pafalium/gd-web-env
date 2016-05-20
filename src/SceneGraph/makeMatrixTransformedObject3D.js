
import THREE from 'three';

function makeMatrixTransformedObject3D(matrix) {
	let object = new THREE.Object3D();
	object.matrixAutoUpdate = false;
	object.matrix = matrix;
	return object;
}

export default makeMatrixTransformedObject3D;
