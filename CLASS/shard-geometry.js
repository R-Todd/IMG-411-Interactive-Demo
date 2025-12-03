//
// shard-geometry.js
// Low-poly crystal shard geometry for the Floating Energy Core project.
// Generates an elongated diamond (octahedron) with per-face normals
// and simple cylindrical UV mapping.
//
// Returns WebGL buffers compatible with the Blinn–Phong shaders.
//

function createShardGeometry(gl, height = 1.2, radius = 0.3) {

    // -------------------------------------------------------------
    // 1) Define key vertices of an elongated diamond
    // -------------------------------------------------------------
    //
    //        top (0, +h, 0)
    //          /  |  \
    //        /    |    \
    //   (-r,0,0)  |   (r,0,0)
    //        \    |    /
    //          \  |  /
    //       bottom (0, -h, 0)
    //
    const h = height;
    const r = radius;

    const top    = [ 0.0,  h,  0.0];
    const bottom = [ 0.0, -h,  0.0];
    const px     = [ r,   0.0,  0.0];
    const nx     = [-r,   0.0,  0.0];
    const pz     = [ 0.0, 0.0,  r  ];
    const nz     = [ 0.0, 0.0, -r  ];

    // -------------------------------------------------------------
    // 2) Storage for attributes
    // -------------------------------------------------------------
    const positions = [];
    const normals   = [];
    const texCoords = [];
    const indices   = [];

    // -------------------------------------------------------------
    // 3) Small vector helpers for normal calculation
    // -------------------------------------------------------------
    function vec3Sub(a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    function vec3Cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    function vec3Normalize(v) {
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        if (len > 0.0) {
            return [v[0] / len, v[1] / len, v[2] / len];
        }
        return [0.0, 0.0, 0.0];
    }

    // Cylindrical-like UV mapping based on position
    function uvFromPosition(pos) {
        const x = pos[0];
        const y = pos[1];
        const z = pos[2];

        const angle = Math.atan2(z, x);           // -PI to PI
        const u = 0.5 + angle / (2.0 * Math.PI);  // 0 to 1

        const totalHeight = 2.0 * h;
        const v = 0.5 + (y / totalHeight);        // roughly 0 to 1

        return [u, v];
    }

    // -------------------------------------------------------------
    // 4) Helper to add a triangular face (with per-face normal)
    // -------------------------------------------------------------
    function addFace(v0, v1, v2) {
        // Compute face normal (CCW winding -> outward)
        const e1 = vec3Sub(v1, v0);
        const e2 = vec3Sub(v2, v0);
        const n  = vec3Normalize(vec3Cross(e1, e2));

        const uv0 = uvFromPosition(v0);
        const uv1 = uvFromPosition(v1);
        const uv2 = uvFromPosition(v2);

        const baseIndex = positions.length / 3;

        // Vertex 0
        positions.push(v0[0], v0[1], v0[2]);
        normals.push(n[0], n[1], n[2]);
        texCoords.push(uv0[0], uv0[1]);

        // Vertex 1
        positions.push(v1[0], v1[1], v1[2]);
        normals.push(n[0], n[1], n[2]);
        texCoords.push(uv1[0], uv1[1]);

        // Vertex 2
        positions.push(v2[0], v2[1], v2[2]);
        normals.push(n[0], n[1], n[2]);
        texCoords.push(uv2[0], uv2[1]);

        // Indices (no vertex sharing; each face has unique vertices)
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
    }

    // -------------------------------------------------------------
    // 5) Define faces (top and bottom halves)
    // -------------------------------------------------------------
    //
    // Winding chosen so normals point outward.
    //

    // Top pyramid (y > 0)
    addFace(top, pz, px);   // top front-right
    addFace(top, nx, pz);   // top front-left
    addFace(top, nz, nx);   // top back-left
    addFace(top, px, nz);   // top back-right

    // Bottom pyramid (y < 0)
    addFace(bottom, px, pz);  // bottom front-right
    addFace(bottom, pz, nx);  // bottom front-left
    addFace(bottom, nx, nz);  // bottom back-left
    addFace(bottom, nz, px);  // bottom back-right

    // -------------------------------------------------------------
    // 6) Create WebGL buffers
    // -------------------------------------------------------------
    function createBuffer(target, data, usage) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage || gl.STATIC_DRAW);
        return buffer;
    }

    const positionBuffer = createBuffer(
        gl.ARRAY_BUFFER,
        new Float32Array(positions)
    );

    const normalBuffer = createBuffer(
        gl.ARRAY_BUFFER,
        new Float32Array(normals)
    );

    const texCoordBuffer = createBuffer(
        gl.ARRAY_BUFFER,
        new Float32Array(texCoords)
    );

    const indexBuffer = createBuffer(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices)
    );

    // -------------------------------------------------------------
    // 7) Return structured geometry object for main.js
    // -------------------------------------------------------------
    return {
        positionBuffer: positionBuffer,
        normalBuffer: normalBuffer,
        texCoordBuffer: texCoordBuffer,
        indexBuffer: indexBuffer,
        numIndices: indices.length,

        // Metadata (could be useful for effects)
        height: height,
        radius: radius
    };
}
