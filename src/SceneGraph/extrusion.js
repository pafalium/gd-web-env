
import THREE from 'three';
import {solidMat} from './default-materials.js';

// naive version:
//   assumes extrudable has vertices property
//   assumes surface extrudable (always closed)
//   assumes standard winding (CCW)
//   assumes convex extrudable
function extrudableVertices(extrudable) {
  return extrudable.args.vertices;
}

function extrusionGeometry(extrudable, displacement) {
  let geom = new THREE.Geometry();
  // set vertices
  let vertices = extrudableVertices(extrudable);
  let extrudedVertices = vertices.map(vert => vert.clone().add(displacement));
  geom.vertices = [
    ...vertices, 
    ...extrudedVertices, 
    ...vertices, 
    ...extrudedVertices
  ];
  // set faces (bottomTriangles, sideTriangles, topTriangles)
  let sideTriangles = [];
  let offset = vertices.length*2;
  for (let quad=0; quad < vertices.length; quad++) {
    // vertices         : v1, v2 
    // extrudedVertices : v4, v3
    let v1 = offset + quad, 
      v2 = offset + (quad + 1) % vertices.length,
      v3 = offset + vertices.length + (quad + 1) % vertices.length,
      v4 = offset + vertices.length + quad;
    sideTriangles.push(new THREE.Face3(v1, v2, v3));
    sideTriangles.push(new THREE.Face3(v3, v4, v1));
  }
  let bottomTriangles = [];
  for (let v0=0, v1=vertices.length-1, v2=vertices.length-2;
    v2 > v0; 
    v1--, v2--) {
    bottomTriangles.push(new THREE.Face3(v0, v1, v2));
  }
  let topTriangles = [];
  for (
    let v0=vertices.length, v1=v0+1, v2=v0+2; 
    v2 < vertices.length*2; 
    v1++, v2++) {
    bottomTriangles.push(new THREE.Face3(v0, v1, v2));
  }
  geom.faces = [...sideTriangles, ...bottomTriangles, ...topTriangles];
  // compute normals
  geom.computeFaceNormals();
  geom.computeVertexNormals();
  // compute bounding sphere
  geom.computeBoundingSphere();
  return geom;
}

// extrude.surface
// extrude.path
function toThreeExtrusion(result) {
  const extrudable = result.args.extrudable;
  const displacement = result.args.displacement;
  let geom = extrusionGeometry(extrudable, displacement);
  let obj = new THREE.Mesh(geom, solidMat);
  return obj;
}

export {toThreeExtrusion as extrusion};
