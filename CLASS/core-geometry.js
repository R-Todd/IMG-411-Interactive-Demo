//
// core-geometry.js
// Generates a UV sphere using non-indexed data suitable for drawing with gl.TRIANGLE_STRIP.
//
function createCoreGeometry(gl, radius = 1.0, stacks = 30, slices = 30) {

    const positions = [];
    const normals   = [];
    const texCoords = [];
    let vertexCount = 0;

    for (let i = 0; i < stacks; i++) {
        const theta1 = i * Math.PI / stacks;
        const theta2 = (i + 1) * Math.PI / stacks;
        
        // Add degenerate triangle to connect the previous stack's strip (if not the first stack)
        if (i > 0) {
            // Duplicate the last vertex added (V_last)
            positions.push(positions[positions.length - 3], positions[positions.length - 2], positions[positions.length - 1]);
            normals.push(normals[normals.length - 3], normals[normals.length - 2], normals[normals.length - 1]);
            texCoords.push(texCoords[texCoords.length - 2], texCoords[texCoords.length - 1]);
            vertexCount++; 
        }

        for (let j = 0; j <= slices; j++) {
            const phi = j * 2.0 * Math.PI / slices;
            
            // --- V1: Top edge of this strip/quad (lat i) ---
            const sinT1 = Math.sin(theta1);
            const cosT1 = Math.cos(theta1);
            let x1 = radius * sinT1 * Math.cos(phi);
            let y1 = radius * cosT1;
            let z1 = radius * sinT1 * Math.sin(phi);
            
            positions.push(x1, y1, z1);
            normals.push(x1/radius, y1/radius, z1/radius);
            texCoords.push(j / slices, i / stacks);
            vertexCount++;


            // --- V2: Bottom edge of this strip/quad (lat i+1) ---
            const sinT2 = Math.sin(theta2);
            const cosT2 = Math.cos(theta2);
            let x2 = radius * sinT2 * Math.cos(phi);
            let y2 = radius * cosT2;
            let z2 = radius * sinT2 * Math.sin(phi);

            positions.push(x2, y2, z2);
            normals.push(x2/radius, y2/radius, z2/radius);
            texCoords.push(j / slices, (i + 1) / stacks);
            vertexCount++;
        }
    }
    
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

    return {
        positionBuffer: positionBuffer,
        normalBuffer: normalBuffer,
        texCoordBuffer: texCoordBuffer,
        numVertices: vertexCount
    };
}