// material-setup.js


// -------------------------------------------------------------
// setMaterial() 
// -------------------------------------------------------------
function setMaterial(gl, materialLocs, material) {

    // set float and int uniforms
    gl.uniform1i(materialLocs.uUseTextureLoc, material.useTexture); // texture use flag
    gl.uniform1f(materialLocs.uAlphaLoc, material.alpha);           // transparency factor
    gl.uniform1f(materialLocs.uShininessLoc, material.shininess);   // specular shininess value

    // set color vector uniforms
    gl.uniform4fv(materialLocs.uAmbientLoc, flatten(vec4(material.ambient))); // Ambient color
    gl.uniform4fv(materialLocs.uDiffuseLoc, flatten(vec4(material.diffuse))); // Diffuse color
    gl.uniform4fv(materialLocs.uSpecularLoc, flatten(vec4(material.specular))); // Specular color
    // ---------------------
    
    // if a material has a texture
    if (material.texture) {
        // bind the texture
        gl.bindTexture(gl.TEXTURE_2D, material.texture);
    }
}


// -------------------------------------------------------------
// Materials constant for different materials used 

const Materials = {
    CORE: {
        ambient: [0.2, 0.0, 0.0, 1.0],
        diffuse: [1.0, 0.4, 0.0, 1.0], // bright orange/red diffuse
        specular: [1.0, 1.0, 1.0, 1.0],
        shininess: 20.0,
        useTexture: false,
        alpha: 1.0
    },
    SHARDS_PURPLE: {
        ambient: [0.15, 0.05, 0.20, 1.0],
        diffuse: [0.6, 0.2, 0.8, 1.0], // purple diffuse color
        specular: [1.0, 1.0, 1.0, 1.0],
        shininess: 40.0,
        useTexture: false,
        alpha: 1.0
    },
    // Metal material with texture support
    // uses texture for different textures
    METAL_COLLAR: (texture) => ({
        ambient: [0.3, 0.3, 0.3, 1.0],
        diffuse: [0.8, 0.8, 0.8, 1.0],
        specular: [0.6, 0.6, 0.6, 1.0],
        shininess: 16.0,
        useTexture: true,
        texture: texture,
        alpha: 1.0
    }),
    // Solid metal material (cap/pedestal)
    METAL_CAP: {
        ambient: [0.18, 0.22, 0.28, 1.0],
        diffuse: [0.30, 0.36, 0.42, 1.0],
        specular: [0.60, 0.68, 0.75, 1.0],
        shininess: 32.0,
        useTexture: false,
        alpha: 1.0
    },
    // Glass material with texture and transparency
    GLASS_CYLINDER: (texture) => ({
        // neutral gray for diffuse base color
        ambient: [0.1, 0.1, 0.1, 1.0], 
        diffuse: [0.3, 0.3, 0.3, 1.0], 
        specular: [1.0, 1.0, 1.0, 1.0],
        shininess: 32.0,
        useTexture: true,
        texture: texture,
        alpha: 0.35 // Set high transparency
    })
};
