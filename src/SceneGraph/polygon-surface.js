
import THREE from 'three';
import {surfaceMat} from './default-materials.js';

// naive version:
//  assumes that a convex polygon is provided
//  assumes that all vertices are coplanar

function polygonSurfaceGeometry(vertices) {
  let geom = new THREE.Geometry();
  // set vertices
  geom.vertices = vertices;
  // set faces (GL_TRIANGLE_FAN)
  const v0 = 0;
  for (let v1=1, v2=2; v2 < vertices.length; v1++, v2++) {
    geom.faces.push(new THREE.Face3(v0, v1, v2));
  }
  // set normals
  geom.computeFaceNormals();
  geom.computeVertexNormals();
  // set bounding sphere
  geom.computeBoundingSphere();
  return geom;
}

function toThreePolygonSurface(result) {
  const vertices = result.args.vertices;
  let geom = polygonSurfaceGeometry(vertices);
  let obj = new THREE.Mesh(geom, surfaceMat);
  return obj;
}

export {toThreePolygonSurface as polygonSurface};
