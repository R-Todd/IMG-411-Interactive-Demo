//
// material-setup.js
// Contains functions and data structures for setting WebGL material uniforms.
//

function setMaterial(gl, materialLocs, material) {
    // Note: Assumes vec4 and flatten (from MV.js) are available globally.

    gl.uniform1i(materialLocs.uUseTextureLoc, material.useTexture);
    gl.uniform1f(materialLocs.uAlphaLoc, material.alpha);
    gl.uniform1f(materialLocs.uShininessLoc, material.shininess);

    gl.uniform4fv(materialLocs.uAmbientLoc, flatten(vec4(material.ambient)));
    gl.uniform4fv(materialLocs.uDiffuseLoc, flatten(vec4(material.diffuse)));
    gl.uniform4fv(materialLocs.uSpecularLoc, flatten(vec4(material.specular)));
    
    // Bind texture if needed
    if (material.texture) {
        gl.bindTexture(gl.TEXTURE_2D, material.texture);
    }
}

// --- Material Definitions ---

const Materials = {
    CORE: {
        ambient: [0.2, 0.0, 0.0, 1.0],
        diffuse: [1.0, 0.4, 0.0, 1.0],
        specular: [1.0, 1.0, 1.0, 1.0],
        shininess: 20.0,
        useTexture: false,
        alpha: 1.0
    },
    SHARDS_PURPLE: {
        ambient: [0.15, 0.05, 0.20, 1.0],
        diffuse: [0.6, 0.2, 0.8, 1.0],
        specular: [1.0, 1.0, 1.0, 1.0],
        shininess: 40.0,
        useTexture: false,
        alpha: 1.0
    },
    METAL_COLLAR: (texture) => ({
        ambient: [0.3, 0.3, 0.3, 1.0],
        diffuse: [0.8, 0.8, 0.8, 1.0],
        specular: [0.6, 0.6, 0.6, 1.0],
        shininess: 16.0,
        useTexture: true,
        texture: texture,
        alpha: 1.0
    }),
    METAL_CAP: {
        ambient: [0.18, 0.22, 0.28, 1.0],
        diffuse: [0.30, 0.36, 0.42, 1.0],
        specular: [0.60, 0.68, 0.75, 1.0],
        shininess: 32.0,
        useTexture: false,
        alpha: 1.0
    },
    GLASS_CYLINDER: (texture) => ({
        ambient: [0.1, 0.1, 0.15, 1.0],
        diffuser: [0.3, 0.3, 0.4, 1.0],
        specular: [1.0, 1.0, 1.0, 1.0],
        shininess: 32.0,
        useTexture: true,
        texture: texture,
        alpha: 0.35
    })
};