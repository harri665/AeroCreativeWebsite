// Run this script to generate sample STL files for testing:
//   node generate-sample-stl.js
//
// Once you have real models, delete the samples and drop your .stl files
// into server/public/models/

const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });

// Write a binary STL from an array of triangles [{v1, v2, v3, normal}]
function writeBinarySTL(filepath, triangles) {
  const numTriangles = triangles.length;
  const bufferSize = 84 + numTriangles * 50;
  const buffer = Buffer.alloc(bufferSize);

  // 80-byte header
  buffer.write('Binary STL - sample', 0);
  // Number of triangles
  buffer.writeUInt32LE(numTriangles, 80);

  let offset = 84;
  for (const tri of triangles) {
    // Normal
    buffer.writeFloatLE(tri.normal[0], offset); offset += 4;
    buffer.writeFloatLE(tri.normal[1], offset); offset += 4;
    buffer.writeFloatLE(tri.normal[2], offset); offset += 4;
    // Vertex 1
    buffer.writeFloatLE(tri.v1[0], offset); offset += 4;
    buffer.writeFloatLE(tri.v1[1], offset); offset += 4;
    buffer.writeFloatLE(tri.v1[2], offset); offset += 4;
    // Vertex 2
    buffer.writeFloatLE(tri.v2[0], offset); offset += 4;
    buffer.writeFloatLE(tri.v2[1], offset); offset += 4;
    buffer.writeFloatLE(tri.v2[2], offset); offset += 4;
    // Vertex 3
    buffer.writeFloatLE(tri.v3[0], offset); offset += 4;
    buffer.writeFloatLE(tri.v3[1], offset); offset += 4;
    buffer.writeFloatLE(tri.v3[2], offset); offset += 4;
    // Attribute byte count
    buffer.writeUInt16LE(0, offset); offset += 2;
  }

  fs.writeFileSync(filepath, buffer);
}

// Generate icosphere-ish shape
function generateSphere(radius, detail) {
  const triangles = [];
  const stacks = detail;
  const slices = detail * 2;

  for (let i = 0; i < stacks; i++) {
    const phi1 = (Math.PI * i) / stacks;
    const phi2 = (Math.PI * (i + 1)) / stacks;

    for (let j = 0; j < slices; j++) {
      const theta1 = (2 * Math.PI * j) / slices;
      const theta2 = (2 * Math.PI * (j + 1)) / slices;

      const p = (phi, theta) => [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      ];

      const a = p(phi1, theta1);
      const b = p(phi1, theta2);
      const c = p(phi2, theta1);
      const d = p(phi2, theta2);

      const norm = (v) => {
        const l = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        return [v[0]/l, v[1]/l, v[2]/l];
      };

      if (i !== 0) {
        triangles.push({ v1: a, v2: b, v3: c, normal: norm(a) });
      }
      if (i !== stacks - 1) {
        triangles.push({ v1: b, v2: d, v3: c, normal: norm(d) });
      }
    }
  }
  return triangles;
}

// Generate a cube
function generateCube(size) {
  const s = size / 2;
  const faces = [
    { n: [0,0,1],  verts: [[-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s]] },
    { n: [0,0,-1], verts: [[s,-s,-s],[-s,-s,-s],[-s,s,-s],[s,s,-s]] },
    { n: [0,1,0],  verts: [[-s,s,s],[s,s,s],[s,s,-s],[-s,s,-s]] },
    { n: [0,-1,0], verts: [[-s,-s,-s],[s,-s,-s],[s,-s,s],[-s,-s,s]] },
    { n: [1,0,0],  verts: [[s,-s,s],[s,-s,-s],[s,s,-s],[s,s,s]] },
    { n: [-1,0,0], verts: [[-s,-s,-s],[-s,-s,s],[-s,s,s],[-s,s,-s]] },
  ];
  const triangles = [];
  for (const f of faces) {
    triangles.push({ v1: f.verts[0], v2: f.verts[1], v3: f.verts[2], normal: f.n });
    triangles.push({ v1: f.verts[0], v2: f.verts[2], v3: f.verts[3], normal: f.n });
  }
  return triangles;
}

// Generate a torus
function generateTorus(R, r, segments, tubes) {
  const triangles = [];
  for (let i = 0; i < segments; i++) {
    const theta1 = (2 * Math.PI * i) / segments;
    const theta2 = (2 * Math.PI * (i + 1)) / segments;
    for (let j = 0; j < tubes; j++) {
      const phi1 = (2 * Math.PI * j) / tubes;
      const phi2 = (2 * Math.PI * (j + 1)) / tubes;

      const p = (theta, phi) => [
        (R + r * Math.cos(phi)) * Math.cos(theta),
        r * Math.sin(phi),
        (R + r * Math.cos(phi)) * Math.sin(theta),
      ];

      const a = p(theta1, phi1);
      const b = p(theta2, phi1);
      const c = p(theta2, phi2);
      const d = p(theta1, phi2);

      const norm = (theta, phi) => [
        Math.cos(phi) * Math.cos(theta),
        Math.sin(phi),
        Math.cos(phi) * Math.sin(theta),
      ];

      triangles.push({ v1: a, v2: b, v3: c, normal: norm(theta1, phi1) });
      triangles.push({ v1: a, v2: c, v3: d, normal: norm(theta1, phi2) });
    }
  }
  return triangles;
}

// Generate files
writeBinarySTL(path.join(MODELS_DIR, 'Sample-Sphere.stl'), generateSphere(30, 24));
writeBinarySTL(path.join(MODELS_DIR, 'Sample-Cube.stl'), generateCube(50));
writeBinarySTL(path.join(MODELS_DIR, 'Sample-Torus.stl'), generateTorus(30, 12, 32, 16));

console.log('Sample STL files generated in', MODELS_DIR);
console.log('Files:');
fs.readdirSync(MODELS_DIR).forEach(f => console.log(' ', f));
