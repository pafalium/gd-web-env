
import THREE from 'three';

export const solidMat = new THREE.MeshPhongMaterial();
export const surfaceMat = new THREE.MeshPhongMaterial();
surfaceMat.side = THREE.DoubleSide;
