// cylinder-geometry.js

// The cylinder:
// - has radius 1.0
// - halfHeight 1.0,
// then scaled later.


function createCylinderGeometry(gl, slices) {
    if (slices === undefined) slices = 64;

    // attributes array
    var sidePositions = [];
    var sideNormals   = [];
    var sideTexCoords = [];
    var sideIndices   = [];

    // cylinder side mesh using slices
    for (var i = 0; i <= slices; i++) {
        var theta = 2.0 * Math.PI * i / slices; // angle around Y axis
        var cosT = Math.cos(theta); // X component
        var sinT = Math.sin(theta); // Z component

        var x = cosT; // radius is 1.0
        var z = sinT;

        // two vertices per slice (bottom Y=-1, top Y=1) 
        sidePositions.push(x, -1.0, z); // bottom vertex position
        sidePositions.push(x,  1.0, z); // top vertex position

        // Calculate normal vector (inward)
        var nx = -cosT;
        var nz = -sinT;
        sideNormals.push(nx, 0.0, nz); // normal for bottom vertex
        sideNormals.push(nx, 0.0, nz); // normal for top vertex

        // cylindrical UVs (U maps around, V maps vertically)
        var u = i / slices;
        sideTexCoords.push(u, 0.0); // bottom U, V=0.0
        sideTexCoords.push(u, 1.0); // top U, V=1.0
    }

    // Dindices for the quad faces of the cylinder sides
    for (var j = 0; j < slices; j++) {
        var i0 = 2 * j;     // V0 (bottom, current slice)
        var i1 = i0 + 1;    // V1 (top, current slice)
        var i2 = i0 + 2;    // V2 (bottom, next slice)
        var i3 = i0 + 3;    // V3 (top, next slice)

        // Draw triangles (i0, i1, i2) and (i1, i3, i2)
        sideIndices.push(i0, i1, i2);
        sideIndices.push(i1, i3, i2);
    }

    // -----------------------
    // End Caps (Metal Disks)
    // - create a disk @ Y = -1.0 (bottom)
    // - create a disk @ Y = +1.0 (top)

    function buildDisk(y, inwardNormalY) {
        var positions = [];
        var normals   = [];
        var texCoords = [];
        var indices   = [];

        // Center vertex (Index = 0)
        positions.push(0.0, y, 0.0);
        normals.push(0.0, inwardNormalY, 0.0);
        texCoords.push(0.5, 0.5); // UV center

        // Vertices around the edge
        for (var k = 0; k <= slices; k++) {
            var angle = 2.0 * Math.PI * k / slices;
            var cx = Math.cos(angle);
            var cz = Math.sin(angle);

            positions.push(cx, y, cz);
            normals.push(0.0, inwardNormalY, 0.0); // Normal is always vertical for the cap

            // Radial UVs
            var u = 0.5 + 0.5 * cx; // map to [0,1]
            var v = 0.5 + 0.5 * cz; // map to [0,1]
            texCoords.push(u, v);
        }

        // Create triangle fan indices
        for (var t = 0; t < slices; t++) {
            var centerIndex = 0;
            var v1 = t + 1;
            var v2 = t + 2;

            // Winding must be correct based on the cap's normal
            if (inwardNormalY > 0.0) {
                // Bottom disk: 
                // - normal points up (+Y)
                // - Use CCW winding (0, V1, V2).
                indices.push(centerIndex, v1, v2);
            } else {
                // Top disk: 
                // - normal points down (-Y). Use reversed winding (0, V2, V1).
                indices.push(centerIndex, v2, v1);
            }
        }

        return {
            positions: positions, // vertex positions
            normals: normals, // vertex normals
            texCoords: texCoords,  // vertex texture coordinates
            indices: indices // index
        };
    }


    
    // data for the top and bottom caps
    // Bottom cap:
    // -  is at Y = -1.0, 
    // - normal points up (+1.0)
    var bottomDisk = buildDisk(-1.0, 1.0);
    // Top cap:
    // -  Y = +1.0, 
    // - BUT normal points down (-1.0)
    var topDisk    = buildDisk( 1.0,-1.0);
    

    // -------------
    // Buffer helper
    // similar to geometry setup
    function createBuffer(target, data, usage) {
        var buffer = gl.createBuffer(); // buffer object
        gl.bindBuffer(target, buffer); // bind to target
        gl.bufferData(target, data, usage || gl.STATIC_DRAW); // upload data
        return buffer;
    }

    
    // buffer objects for the 3 geometry parts
    function buildGeometryObject(posArr, normArr, uvArr, idxArr) {
        return {
            positionBuffer: createBuffer(gl.ARRAY_BUFFER, new Float32Array(posArr)), //vertex positions
            normalBuffer:   createBuffer(gl.ARRAY_BUFFER, new Float32Array(normArr)), //vertex normals
            texCoordBuffer: createBuffer(gl.ARRAY_BUFFER, new Float32Array(uvArr)), //vertex texture coordinates
            indexBuffer:    createBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idxArr)), //element index buffer
            numIndices:     idxArr.length
        };
    }

    var sideGeom   = buildGeometryObject(sidePositions, sideNormals, sideTexCoords, sideIndices);
    var bottomGeom = buildGeometryObject(bottomDisk.positions, bottomDisk.normals, bottomDisk.texCoords, bottomDisk.indices);
    var topGeom    = buildGeometryObject(topDisk.positions, topDisk.normals, topDisk.texCoords, topDisk.indices);

    
    return {
        side:   sideGeom,   // cylinder wall (glass)
        bottom: bottomGeom, // bottom disk (metal)
        top:    topGeom     // top disk (metal)
    };
    
}