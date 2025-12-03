//
// core-geometry.js


// creeateCoreGeometry() - sphere geometry for the core
function createCoreGeometry(gl, radius = 1.0, stacks = 30, slices = 30) {

    
    const positions = []; // X, Y, Z coordinates
    const normals   = []; // X, Y, Z normal vectors
    const texCoords = []; // U, V texture coordinates
    let vertexCount = 0;
    

    
    // Loops through latitude stacks to build sphere geometry
    // step 1 - for each stack, compute the latitude angle
    // step 2 - for each slice, compute the longitude angle
    // step 3 - compute the vertex position, normal, and texture coordinates
    // step 4 - create triangle strip for each stack

    for (let i = 0; i < stacks; i++) {
        const theta1 = i * Math.PI / stacks;      // top latitude angle
        const theta2 = (i + 1) * Math.PI / stacks; // bottom latitude angle
        
        // use triangle strip for each stack
        if (i > 0) {
            // add degenerate vertex to connect strips
            positions.push(positions[positions.length - 3], positions[positions.length - 2], positions[positions.length - 1]); // repeat last vertex
            normals.push(normals[normals.length - 3], normals[normals.length - 2], normals[normals.length - 1]); // repeat last normal
            texCoords.push(texCoords[texCoords.length - 2], texCoords[texCoords.length - 1]); // repeat last tex coord
            vertexCount++; // increment
        }

        // longitude slices to for the quad strip
        for (let j = 0; j <= slices; j++) {
            const phi = j * 2.0 * Math.PI / slices; // longitude angle
            
            // ----- Top edge  (latitude i) -----
            const sinT1 = Math.sin(theta1); // sine of top latitude
            const cosT1 = Math.cos(theta1); // cosine of top latitude

            let x1 = radius * sinT1 * Math.cos(phi); // X position
            let y1 = radius * cosT1;                // Y position
            let z1 = radius * sinT1 * Math.sin(phi); // Z position
            
            positions.push(x1, y1, z1); 

            normals.push(x1/radius, y1/radius, z1/radius); // add normal (same as position for sphere)
            texCoords.push(j / slices, i / stacks); // add texture
            vertexCount++;


            // ----- Bottom edge for this strip/quad (latitude i+1) -----
            const sinT2 = Math.sin(theta2); // sine of bottom latitude
            const cosT2 = Math.cos(theta2); // cosine of bottom latitude
            let x2 = radius * sinT2 * Math.cos(phi); // X position
            let y2 = radius * cosT2;                // Y position
            let z2 = radius * sinT2 * Math.sin(phi); // Z position

            positions.push(x2, y2, z2); // add position
            normals.push(x2/radius, y2/radius, z2/radius); // add normal
            texCoords.push(j / slices, (i + 1) / stacks); // add texture coordinate
            vertexCount++;
        }
    }
    // _____________________________________________________________

    // createBuffer same as other files
    function createBuffer(target, data, usage = gl.STATIC_DRAW) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage);
        return buffer;
    }
    // setup buffer objects for positions, normals, texCoords
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