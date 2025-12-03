//
// shard-geometry.js
// Generates the geometry for the low-poly crystal shard.
// It creates an elongated diamond (octahedron) with per-face normals.
//

function createShardGeometry(gl, height = 1.2, radius = 0.3) {

    // Set verticies for shard
    // - height = half-height of the shard along Y axis
    // - radius = distance from center to the midpoints on XZ plane
    // - a shard has 8 faces usng triangles
    
    const h = height; // half-height
    const r = radius; // radius at the center

    const top    = [ 0.0,  h,  0.0];
    const bottom = [ 0.0, -h,  0.0];
    const px     = [ r,   0.0,  0.0]; // +X axis point
    const nx     = [-r,   0.0,  0.0]; // -X axis point
    const pz     = [ 0.0, 0.0,  r  ]; // +Z axis point
    const nz     = [ 0.0, 0.0, -r  ]; // -Z axis point
    
    // create arrays to hold data 
    const positions = [];
    const normals   = [];
    const texCoords = [];
    const indices   = [];


    // ----------------
    // Small vector math helpers
    // --------------------
    // Compute vector A - B
    function vec3Sub(a, b) {
        return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    }

    // Compute cross product of two vectors
    function vec3Cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }

    // Normalize a vector to unit length
    function vec3Normalize(v) {
        // Compute length
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        if (len > 0.0) {
            // if length is non-zero, divide by length
            return [v[0] / len, v[1] / len, v[2] / len];
        }
        // else = 0 vector
        return [0.0, 0.0, 0.0];
    }


    
    // convert position to U, V coordinates
    function uvFromPosition(pos) {
        const x = pos[0];
        const y = pos[1];
        const z = pos[2];

        // Angle around the Y axis  (U coordinate)
        const angle = Math.atan2(z, x);           // result is -PI to PI
        const u = 0.5 + angle / (2.0 * Math.PI);  // map to 0 to 1 range

        // Y position  (V coordinate)
        const totalHeight = 2.0 * h;
        const v = 0.5 + (y / totalHeight);        // map y position to roughly 0 to 1 range

        return [u, v];
    }
    

    
    //add a triangular face
    function addFace(v0, v1, v2) {
        // Calculate face normal - cross product of two edges
        const e1 = vec3Sub(v1, v0);
        const e2 = vec3Sub(v2, v0);
        const n  = vec3Normalize(vec3Cross(e1, e2)); // calculate the face normal

        // Compute UVs for three vertices
        const uv0 = uvFromPosition(v0);
        const uv1 = uvFromPosition(v1);
        const uv2 = uvFromPosition(v2);

        const baseIndex = positions.length / 3; // current vertex index

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

        // Indices (since vertices are unique per face)
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
    }

    // -------------------------------------------------------
    //create the 8 faces of the crystal shard
    
    
    // --- Top pyramid --
    addFace(top, pz, px);   // top front-right face
    addFace(top, nx, pz);   // top front-left face
    addFace(top, nz, nx);   // top back-left face
    addFace(top, px, nz);   // top back-right face

    // -- Bottom pyramid -- 
    addFace(bottom, px, pz);  // bottom front-right face
    addFace(bottom, pz, nx);  // bottom front-left face
    addFace(bottom, nx, nz);  // bottom back-left face
    addFace(bottom, nz, px);  // bottom back-right face

    // createBuffer - creats buffer used in main
    function createBuffer(target, data, usage) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage || gl.STATIC_DRAW);
        return buffer;
    }
    

    // load data into webgl buffers
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
    

    
    return {
        positionBuffer: positionBuffer, //vertex positions
        normalBuffer: normalBuffer, //vertex normals
        texCoordBuffer: texCoordBuffer, //vertex texture coordinates
        indexBuffer: indexBuffer, //element index buffer
        numIndices: indices.length, //#  of indices

        // Store metadata
        height: height,
        radius: radius
    };
    
}