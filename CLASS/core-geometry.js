//
// core-geometry.js
// Generates a UV sphere for the floating energy core.
// Produces position, normal, and UV buffers, plus index buffer.
// Compatible with MV.js and the Blinn–Phong shaders.
//
// The sphere is generated using the standard latitude/longitude
// parameterization (stacks = latitude, slices = longitude).
//

function createCoreGeometry(gl, radius = 1.0, stacks = 30, slices = 30) {

    // -------------------------------------------------------------
    // 1) Generate arrays for raw vertex attributes
    // -------------------------------------------------------------
    const positions = [];
    const normals   = [];
    const texCoords = [];
    const indices   = [];

    // -------------------------------------------------------------
    // 2) Generate vertices
    // -------------------------------------------------------------
    //
    // Sphere parameterization:
    //   theta = latitude angle (0 to PI)
    //   phi   = longitude angle (0 to 2PI)
    //
    // Vertex position:
    //   x = r * sin(theta) * cos(phi)
    //   y = r * cos(theta)
    //   z = r * sin(theta) * sin(phi)
    //
    // Normal = normalized position (unit sphere)
    // UV mapping:
    //   u = phi / (2PI)
    //   v = theta / PI
    //
    for (let i = 0; i <= stacks; i++) {
        const theta = i * Math.PI / stacks;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let j = 0; j <= slices; j++) {
            const phi = j * 2.0 * Math.PI / slices;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            // Position on sphere
            const x = radius * sinTheta * cosPhi;
            const y = radius * cosTheta;
            const z = radius * sinTheta * sinPhi;

            // Normal (unit sphere)
            const nx = sinTheta * cosPhi;
            const ny = cosTheta;
            const nz = sinTheta * sinPhi;

            // UV coordinates
            const u = j / slices;
            const v = i / stacks;

            positions.push(x, y, z);
            normals.push(nx, ny, nz);
            texCoords.push(u, v);
        }
    }

    // -------------------------------------------------------------
    // 3) Generate indices (two triangles per quad)
    // -------------------------------------------------------------
    for (let i = 0; i < stacks; i++) {
        for (let j = 0; j < slices; j++) {
            const first  = i * (slices + 1) + j;
            const second = first + slices + 1;

            // Triangle 1
            indices.push(first, second, first + 1);

            // Triangle 2
            indices.push(second, second + 1, first + 1);
        }
    }

    // -------------------------------------------------------------
    // 4) Create WebGL buffers
    // -------------------------------------------------------------
    function createBuffer(target, data, usage = gl.STATIC_DRAW) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage);
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
    // 5) Return structured geometry object for main.js
    // -------------------------------------------------------------
    return {
        positionBuffer: positionBuffer,
        normalBuffer: normalBuffer,
        texCoordBuffer: texCoordBuffer,
        indexBuffer: indexBuffer,
        numIndices: indices.length,

        // Optional metadata
        radius: radius,
        stacks: stacks,
        slices: slices
    };
}
