//
// CLASS/shaders.js
// 
// Defines the GLSL source code for the Vertex and Fragment shaders 
// implementing the Blinn-Phong (Modified Phong) Lighting Model 
// with Per-Fragment calculations (Phong Shading).
//

function setShaderSource() {

    // =========================================================
    // VERTEX SHADER: Passes transformed light/view vectors 
    // for per-fragment lighting calculation.
    // =========================================================

    const vertexShaderSource = `
        // Qualifiers: attribute (per vertex data), uniform (per primitive data), varying (interpolated output)
        attribute vec4 vPosition;        // Vertex position from geometry buffer
        attribute vec4 vNormal;          // Vertex normal from geometry buffer
        attribute vec2 vTexCoord;        // Texture coordinates
        
        uniform mat4 ModelViewMatrix;    // Transformation: model/object space -> eye/camera space
        uniform mat4 ProjectionMatrix;   // Transformation: eye space -> clip space
        uniform mat4 NormalMatrix;       // Transformation matrix for normals (inverse transpose of MV)
        uniform vec4 LightPosition;      // Light source position (in eye coordinates)

        varying vec3 N;                 // Normalized Normal vector (to fragment shader)
        varying vec3 L;                 // Normalized Light vector (to fragment shader)
        varying vec3 E;                 // Normalized Eye/View vector (to fragment shader)
        varying vec2 fTexCoord;         // Interpolated texture coordinates

        void main() 
        {
            // 1. Transform vertex position to Eye Coordinates (pos)
            // Note: The eye (camera) is at the origin (0,0,0) in Eye Coordinates.
            vec3 pos = (ModelViewMatrix * vPosition).xyz; 

            // 2. Calculate Light Vector (L) 
            // The light vector points from the vertex position (pos) to the light source.
            // lightPosition must be in eye coordinates.
            vec3 LightDir = LightPosition.w == 0.0 ? LightPosition.xyz : LightPosition.xyz - pos; 
            L = normalize(LightDir);

            // 3. Calculate Eye Vector (E)
            // The eye vector points from the vertex position (pos) to the eye (0,0,0).
            E = normalize(-pos); 

            // 4. Calculate Normal Vector (N)
            // The normal is transformed by the NormalMatrix (inverse transpose of MV) 
            // to correctly preserve the angle with the tangent plane after non-uniform scaling.
            N = normalize((NormalMatrix * vNormal).xyz); 
            
            // 5. Transform and output vertex position to Clip Coordinates 
            gl_Position = ProjectionMatrix * ModelViewMatrix * vPosition;
            
            // 6. Pass texture coordinates for interpolation
            fTexCoord = vTexCoord;
        }
    `;

    // =========================================================
    // FRAGMENT SHADER: Performs the Blinn-Phong illumination 
    // model calculation per fragment (Phong Shading).
    // =========================================================

    const fragmentShaderSource = `
        precision mediump float; // Required for WebGL ES

        // Uniforms for lighting parameters
        uniform vec4 AmbientProduct;      // k_a * I_a (Material ambient coefficient * Light ambient color)
        uniform vec4 DiffuseProduct;      // k_d * I_d (Material diffuse coefficient * Light diffuse color)
        uniform vec4 SpecularProduct;     // k_s * I_s (Material specular coefficient * Light specular color)
        uniform float Shininess;          // The specular exponent (alpha/beta) for the highlight
        uniform sampler2D uTexture;       // Texture sampler object
        uniform bool bIsCore;             // Flag for special core rendering logic (emissive, etc.)
        uniform vec4 CoreEmissiveColor;   // Color used for the glowing core (emissive component)
        
        // Interpolated vectors from the Vertex Shader
        varying vec3 N;
        varying vec3 L;
        varying vec3 E;
        varying vec2 fTexCoord;
        
        void main() 
        {
            // 1. Re-normalize interpolated vectors (essential for per-fragment lighting)
            // Interpolation does not preserve unit length.
            vec3 N_norm = normalize(N);
            vec3 L_norm = normalize(L);
            vec3 E_norm = normalize(E);

            // 2. Calculate Halfway Vector (H) for Blinn-Phong
            vec3 H = normalize(L_norm + E_norm);
            
            // 3. Ambient Term: k_a * I_a
            vec4 ambient = AmbientProduct;
            
            // 4. Diffuse Term: k_d * I_d * max(L . N, 0)
            float Kd_factor = max(dot(L_norm, N_norm), 0.0);
            vec4 diffuse = Kd_factor * DiffuseProduct;
            
            // 5. Specular Term: k_s * I_s * max(N . H, 0)^Shininess
            float Ks_factor = pow(max(dot(N_norm, H), 0.0), Shininess);
            vec4 specular = Ks_factor * SpecularProduct;

            // Handle light behind surface (avoids lighting from the back, important for transparent/thin objects)
            if (dot(L_norm, N_norm) < 0.0) {
                specular = vec4(0.0);
            }
            
            // 6. Final lighting result
            vec4 lightingColor = ambient + diffuse + specular;

            // 7. Core-specific handling (for the glowing energy effect)
            if (bIsCore) {
                // Core is emissive and does not rely on directional light reflection, 
                // but its glow is amplified by the light source proximity/intensity.
                lightingColor = CoreEmissiveColor;
            }

            // 8. Texture Application and Final Fragment Color
            // Fetch texture color and modulate/multiply it with the calculated light color.
            vec4 texelColor = texture2D(uTexture, fTexCoord); //
            
            // Final Color (Texture * Lighting)
            gl_FragColor = texelColor * lightingColor;
            gl_FragColor.a = 1.0; // Ensure opacity is set
        }
    `;

    // Retrieve script tags and update their content
    document.getElementById("vertex-shader").text = vertexShaderSource;
    document.getElementById("fragment-shader").text = fragmentShaderSource;

    console.log("Shaders source successfully loaded with Blinn-Phong logic.");
}

// Ensure the shader source is loaded before init() runs in main.js
setShaderSource();