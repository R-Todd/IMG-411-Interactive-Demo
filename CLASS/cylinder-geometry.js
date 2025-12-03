//
// cylinder-geometry.js
// Glass containment cylinder + thin metal end caps.
// Cylinder is built with radius = 1, halfHeight = 1, and is
// intended to be scaled in main.js.
//

function createCylinderGeometry(gl, slices) {
    if (slices === undefined) slices = 64;

    // -------------------------------------------------------------
    // Side (glass tube) – inside facing
    // -------------------------------------------------------------
    var sidePositions = [];
    var sideNormals   = [];
    var sideTexCoords = [];
    var sideIndices   = [];

    for (var i = 0; i <= slices; i++) {
        var theta = 2.0 * Math.PI * i / slices;
        var cosT = Math.cos(theta);
        var sinT = Math.sin(theta);

        var x = cosT;
        var z = sinT;

        // y = -1 (bottom), y = +1 (top)
        // Two vertices per slice
        sidePositions.push(x, -1.0, z);
        sidePositions.push(x,  1.0, z);

        // Normals point inward (negate outward direction)
        var nx = -cosT;
        var nz = -sinT;
        sideNormals.push(nx, 0.0, nz);
        sideNormals.push(nx, 0.0, nz);

        // Simple cylindrical UVs
        var u = i / slices;
        sideTexCoords.push(u, 0.0);
        sideTexCoords.push(u, 1.0);
    }

    for (var j = 0; j < slices; j++) {
        var i0 = 2 * j;
        var i1 = i0 + 1;
        var i2 = i0 + 2;
        var i3 = i0 + 3;

        // Two triangles per quad
        sideIndices.push(i0, i1, i2);
        sideIndices.push(i1, i3, i2);
    }

    // -------------------------------------------------------------
    // End caps (metal disks) – ultra thin
    // -------------------------------------------------------------
    function buildDisk(y, inwardNormalY) {
        var positions = [];
        var normals   = [];
        var texCoords = [];
        var indices   = [];

        // Center vertex
        positions.push(0.0, y, 0.0);
        normals.push(0.0, inwardNormalY, 0.0);
        texCoords.push(0.5, 0.5);

        for (var k = 0; k <= slices; k++) {
            var angle = 2.0 * Math.PI * k / slices;
            var cx = Math.cos(angle);
            var cz = Math.sin(angle);

            positions.push(cx, y, cz);
            normals.push(0.0, inwardNormalY, 0.0);

            // Map x/z to [0,1] for simple radial UVs
            var u = 0.5 + 0.5 * cx;
            var v = 0.5 + 0.5 * cz;
            texCoords.push(u, v);
        }

        for (var t = 0; t < slices; t++) {
            var centerIndex = 0;
            var v1 = t + 1;
            var v2 = t + 2;

            // Triangle fan around center
            if (inwardNormalY > 0.0) {
                // bottom disk, inward normal up
                indices.push(centerIndex, v1, v2);
            } else {
                // top disk, inward normal down (reverse winding)
                indices.push(centerIndex, v2, v1);
            }
        }

        return {
            positions: positions,
            normals: normals,
            texCoords: texCoords,
            indices: indices
        };
    }

    // bottom (y = -1, interior normal up)
    var bottomDisk = buildDisk(-1.0, 1.0);
    // top    (y = +1, interior normal down)
    var topDisk    = buildDisk( 1.0,-1.0);

    // -------------------------------------------------------------
    // Buffer helper
    // -------------------------------------------------------------
    function createBuffer(target, data, usage) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(target, buffer);
        gl.bufferData(target, data, usage || gl.STATIC_DRAW);
        return buffer;
    }

    function buildGeometryObject(posArr, normArr, uvArr, idxArr) {
        return {
            positionBuffer: createBuffer(gl.ARRAY_BUFFER, new Float32Array(posArr)),
            normalBuffer:   createBuffer(gl.ARRAY_BUFFER, new Float32Array(normArr)),
            texCoordBuffer: createBuffer(gl.ARRAY_BUFFER, new Float32Array(uvArr)),
            indexBuffer:    createBuffer(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idxArr)),
            numIndices:     idxArr.length
        };
    }

    var sideGeom   = buildGeometryObject(sidePositions, sideNormals, sideTexCoords, sideIndices);
    var bottomGeom = buildGeometryObject(bottomDisk.positions, bottomDisk.normals, bottomDisk.texCoords, bottomDisk.indices);
    var topGeom    = buildGeometryObject(topDisk.positions, topDisk.normals, topDisk.texCoords, topDisk.indices);

    return {
        side:   sideGeom,
        bottom: bottomGeom,
        top:    topGeom
    };
}
