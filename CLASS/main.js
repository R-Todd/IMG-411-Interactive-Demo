//
// main.js – WITH FULL WASD CAMERA CONTROLS, PEDESTAL, AND OPTIMIZED CORE
//

var gl;
var program;

// Attribute locations
var vPositionLoc;
var aNormalLoc;
var vTexCoordLoc;

// Uniform locations
var uModelLoc;
var uViewLoc;
var uProjectionLoc;
var uNormalMatrixLoc;

var uLightPosLoc;
var uCameraPosLoc;

var uAmbientLoc;
var uDiffuseLoc;
var uSpecularLoc;
var uShininessLoc;

var uUseTextureLoc;
var uTextureLoc;

var uAlphaLoc;   // transparency control

// Geometry
var coreGeom;
var shardGeom;
var cylinderGeom;
var metalTopGeom;
var metalBottomGeom;

// =======================================================
// Camera Settings (UPDATED to start at (0, 0, -20) looking at origin)
// =======================================================
var eye = vec3(0.0, 0.0, -20.0); // Camera starts at (0, 0, -20)
var at  = vec3(0.0, 0.0, 0.0);   // Looking at origin
var up  = vec3(0.0, 1.0, 0.0); 

// NEW: Movement constants
var moveSpeed = 0.3; 
var turnSpeed = 2.0; // for arrow key rotation speed

// =======================================================
// Animation state
// =======================================================
var coreAngle       = 0.0;
var corePulsePhase  = 0.0;
var coreBobPhase    = 0.0;

var shardAngles = [0.0, 90.0, 180.0, 270.0];
var shardOrbitSpeeds = [1.0, 1.4, 1.8, 2.2];
var shardOrbitRadius = 2.3;
var shardYOffset     = [0.5, -0.3, 0.9, -0.1];

var coreRotateSpeed = 20.0;
var corePulseSpeed  = 0.08;
var coreBobSpeed    = 0.05;

// =======================================================
// Light Animation State
// =======================================================
var lightOrbitAngle = 0.0;
var lightOrbitSpeed = 20.0; 
var lightOrbitOn = false;
var lightDistance = 5.0; 
var lightOrbitHeight = 3.0; 

// =======================================================
// Interactivity State
// =======================================================
var shardRadiusFactor = 1.0; 

// NEW: Core Resolution State
var coreResolution = 32; // Default resolution for stacks/slices
var MIN_RESOLUTION = 4;
var MAX_RESOLUTION = 64;

// =======================================================
// Textures
// =======================================================
var textures = {
    glass: null,
    metal: null
};

function loadTexture(path) {
    var tex = gl.createTexture();
    tex.image = new Image();
    tex.image.onload = function() {

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                      gl.UNSIGNED_BYTE, tex.image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    tex.image.src = path;
    return tex;
}

// =======================================================
// Core Resolution Functions (NEW)
// =======================================================

function recreateCoreGeometry() {
    // Manually dispose of old buffers for cleaner memory management
    if (coreGeom) {
        gl.deleteBuffer(coreGeom.positionBuffer);
        gl.deleteBuffer(coreGeom.normalBuffer);
        gl.deleteBuffer(coreGeom.texCoordBuffer);
    }
    
    // Recreate geometry with new resolution
    coreGeom = createCoreGeometry(gl, 1.0, coreResolution, coreResolution);
}

function increaseResolution() {
    if (coreResolution < MAX_RESOLUTION) {
        coreResolution = Math.min(MAX_RESOLUTION, coreResolution * 2);
        recreateCoreGeometry();
    }
}

function decreaseResolution() {
    if (coreResolution > MIN_RESOLUTION) {
        coreResolution = Math.max(MIN_RESOLUTION, coreResolution / 2);
        recreateCoreGeometry();
    }
}

// =======================================================
// Keyboard Controls 
// =======================================================
window.onkeydown = function(event) {
    var key = event.key;
    var V, R, R_XZ_Norm; // Movement vectors

    // Calculate dynamic vectors for WASD movement
    V = normalize( subtract(at, eye) ); // Look vector (L)
    R = normalize( cross(V, up) );       // Right vector (R)

    // === XZ Plane Strafe Vector (R_XZ_Norm) for A/D ===
    var R_XZ = vec3(R[0], 0.0, R[2]); 
    var R_XZ_len = length(R_XZ);
    if (R_XZ_len < 1e-6) {
        R_XZ_Norm = vec3(1.0, 0.0, 0.0); 
    } else {
        R_XZ_Norm = scale(1.0 / R_XZ_len, R_XZ);
    }

    var moveVector; 
    var rotateMatrix;

    // --- WASD Movement ---
    if (key === "w" || key === "W") { // Forward (along 3D look vector)
        moveVector = scale(moveSpeed, V);
    } else if (key === "s" || key === "S") { // Backward (along 3D look vector)
        moveVector = scale(-moveSpeed, V);
    } else if (key === "d" || key === "D") { // Strafe Right (along XZ plane right vector)
        moveVector = scale(moveSpeed, R_XZ_Norm);
    } else if (key === "a" || key === "A") { // Strafe Left (along XZ plane left vector)
        moveVector = scale(-moveSpeed, R_XZ_Norm);
    }
    
    // Apply translational movement
    if (moveVector) {
        eye = add(eye, moveVector);
        at = add(at, moveVector);
    }

    // --- Left/Right Arrow Rotation (Y-axis) ---
    if (key === "ArrowLeft") { 
        rotateMatrix = rotate(turnSpeed, up); 
    } else if (key === "ArrowRight") { 
        rotateMatrix = rotate(-turnSpeed, up); 
    }

    if (rotateMatrix) {
        var V_vec4 = vec4(V[0], V[1], V[2], 0.0);
        var V_rotated_array = [];
        
        // Manual Matrix * Vector Multiplication
        for (var i = 0; i < 4; i++) {
            var row = rotateMatrix[i];
            var V_in = V_vec4;
            var sum = row[0] * V_in[0] + 
                      row[1] * V_in[1] + 
                      row[2] * V_in[2] + 
                      row[3] * V_in[3];
            V_rotated_array.push(sum);
        }
        var V_rotated = V_rotated_array; 

        var new_V = normalize(V_rotated.slice(0, 3)); 
        var distance = length(subtract(at, eye)); 
        
        at = add(eye, scale(distance, new_V));
    }
    
    // --- Other Controls (Unchanged) ---
    if (key === "1") corePulseSpeed = (corePulseSpeed > 0.05) ? 0.02 : 0.08;
    if (key === "2") {
        shardOrbitSpeeds = (shardOrbitSpeeds[0] < 1.5)
            ? [2.0, 2.5, 3.0, 3.5]
            : [1.0, 1.4, 1.8, 2.2];
    }
};

// =======================================================
// Buttons 
// =======================================================
function orbitLeft()  { 
    // Rotate V CCW around Y-axis, faster than keyboard arrows
    var V = normalize( subtract(at, eye) ); 
    var rotateMatrix = rotate(turnSpeed * 3.0, up); 
    
    var V_vec4 = vec4(V[0], V[1], V[2], 0.0);
    var V_rotated_array = [];
    for (var i = 0; i < 4; i++) {
        var row = rotateMatrix[i];
        var V_in = V_vec4;
        var sum = row[0] * V_in[0] + 
                  row[1] * V_in[1] + 
                  row[2] * V_in[2] + 
                  row[3] * V_in[3];
        V_rotated_array.push(sum);
    }
    var V_rotated = V_rotated_array; 
    
    var new_V = normalize(V_rotated.slice(0, 3)); 
    var distance = length(subtract(at, eye)); 
    at = add(eye, scale(distance, new_V));
}
function orbitRight() { 
    // Rotate V CW around Y-axis, faster than keyboard arrows
    var V = normalize( subtract(at, eye) ); 
    var rotateMatrix = rotate(-turnSpeed * 3.0, up);
    
    var V_vec4 = vec4(V[0], V[1], V[2], 0.0);
    var V_rotated_array = [];
    for (var i = 0; i < 4; i++) {
        var row = rotateMatrix[i];
        var V_in = V_vec4;
        var sum = row[0] * V_in[0] + 
                  row[1] * V_in[1] + 
                  row[2] * V_in[2] + 
                  row[3] * V_in[3];
        V_rotated_array.push(sum);
    }
    var V_rotated = V_rotated_array;
    
    var new_V = normalize(V_rotated.slice(0, 3));
    var distance = length(subtract(at, eye));
    at = add(eye, scale(distance, new_V));
}
function resetCamera(){
    // Reset to starting position and look-at point
    eye = vec3(0.0, 0.0, -20.0);
    at  = vec3(0.0, 0.0, 0.0);
}

function toggleLightOrbit() { 
    lightOrbitOn = !lightOrbitOn;
}


// =======================================================
// Initialization
// =======================================================
window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL unavailable"); return; }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    vPositionLoc = gl.getAttribLocation(program, "vPosition");
    aNormalLoc   = gl.getAttribLocation(program, "aNormal");
    vTexCoordLoc = gl.getAttribLocation(program, "vTexCoord");

    uModelLoc        = gl.getUniformLocation(program, "uModel");
    uViewLoc         = gl.getUniformLocation(program, "uView");
    uProjectionLoc   = gl.getUniformLocation(program, "uProjection");
    uNormalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

    uLightPosLoc   = gl.getUniformLocation(program, "uLightPos");
    uCameraPosLoc  = gl.getUniformLocation(program, "uCameraPos");

    uAmbientLoc    = gl.getUniformLocation(program, "uAmbient");
    uDiffuseLoc    = gl.getUniformLocation(program, "uDiffuse");
    uSpecularLoc   = gl.getUniformLocation(program, "uSpecular");
    uShininessLoc  = gl.getUniformLocation(program, "uShininess");

    uUseTextureLoc = gl.getUniformLocation(program, "uUseTexture");
    uTextureLoc    = gl.getUniformLocation(program, "uTexture");

    uAlphaLoc      = gl.getUniformLocation(program, "uAlpha");

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uTextureLoc, 0);

    var aspect = canvas.width / canvas.height;
    // Perspective projection setup
    var projMat = perspective(45.0, aspect, 0.1, 100.0);
    gl.uniformMatrix4fv(uProjectionLoc, false, flatten(projMat));
    
    textures.glass = loadTexture("textures/glass.jpg");
    textures.metal = loadTexture("textures/metal.jpg");

    // Initialize core geometry with the new dynamic resolution state
    coreGeom     = createCoreGeometry(gl, 1.0, coreResolution, coreResolution); 
    shardGeom    = createShardGeometry(gl, 1.2, 0.35);

    var cyl = createCylinderGeometry(gl, 64);
    cylinderGeom    = cyl.side;
    metalBottomGeom = cyl.bottom;
    metalTopGeom    = cyl.top;

    // Set initial slider value in JS to sync with HTML default
    var slider = document.getElementById("shardRadiusSlider");
    if (slider) {
        shardRadiusFactor = slider.valueAsNumber;
    }

    render();
};

// =======================================================
// Helpers
// =======================================================
function sendMatrices(model) {

    gl.uniformMatrix4fv(uModelLoc, false, flatten(model));

    // Calculates the inverse transpose for proper normal transformation
    var mv = mult(lookAt(eye, at, up), model);
    var normalM = normalMatrix(mv, true); 

    gl.uniformMatrix3fv(uNormalMatrixLoc, false, flatten(normalM));
}

function drawGeometry(geom) {
    gl.bindBuffer(gl.ARRAY_BUFFER, geom.positionBuffer);
    gl.vertexAttribPointer(vPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPositionLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, geom.normalBuffer);
    gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aNormalLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, geom.texCoordBuffer);
    gl.vertexAttribPointer(vTexCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoordLoc);

    // Differentiated drawing logic: Core uses non-indexed TRIANGLE_STRIP; others use indexed TRIANGLES.
    if (geom === coreGeom) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, geom.numVertices);
    } else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indexBuffer);
        gl.drawElements(gl.TRIANGLES, geom.numIndices, gl.UNSIGNED_SHORT, 0);
    }
}


// =======================================================
// Render Loop (Opaque → Transparent)
// =======================================================
function render() {
    requestAnimFrame(render);

    coreAngle      += coreRotateSpeed * 0.01;
    corePulsePhase += corePulseSpeed;
    coreBobPhase   += coreBobSpeed;

    for (var i = 0; i < 4; i++) {
        shardAngles[i] += shardOrbitSpeeds[i];
        if (shardAngles[i] > 360) shardAngles[i] -= 360;
    }

    gl.clearColor(0.05, 0.05, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Enables Z-buffer

    // --- Dynamic Light Source Logic ---
    var currentLightPos;
    if (lightOrbitOn) {
        lightOrbitAngle += lightOrbitSpeed * 0.01;
        var radLight = radians(lightOrbitAngle);
        var lx = lightDistance * Math.sin(radLight);
        var lz = lightDistance * Math.cos(radLight);
        currentLightPos = vec3(lx, lightOrbitHeight, lz);
    } else {
        currentLightPos = vec3(0.0, lightOrbitHeight, 0.0);
    }
    gl.uniform3fv(uLightPosLoc, flatten(currentLightPos));
    // ------------------------------------------

    // --- Camera Transformation ---
    var view = lookAt(eye, at, up);
    gl.uniformMatrix4fv(uViewLoc, false, flatten(view));
    gl.uniform3fv(uCameraPosLoc, flatten(eye));
    // ------------------------------------------


    // Update shard orbit radius dynamically from slider input
    shardOrbitRadius = 2.3 * shardRadiusFactor; 

    // =======================================================
    // 1. CORE (opaque)
    // =======================================================
    gl.uniform1f(uAlphaLoc, 1.0);
    gl.uniform1i(uUseTextureLoc, false);
    
    // Core Material Properties
    gl.uniform4fv(uAmbientLoc,  flatten(vec4(0.2, 0.0, 0.0, 1.0)));
    gl.uniform4fv(uDiffuseLoc,  flatten(vec4(1.0, 0.4, 0.0, 1.0)));
    gl.uniform4fv(uSpecularLoc, flatten(vec4(1.0, 1.0, 1.0, 1.0))); 
    gl.uniform1f(uShininessLoc, 20.0); 
    

    var coreModel = mat4();
    coreModel = mult(coreModel, translate(0.0, 0.6, 0.0));

    var pulse = 1.0 + 0.05 * Math.sin(corePulsePhase * 3.0);
    coreModel = mult(coreModel, scalem(pulse, pulse, pulse));

    coreModel = mult(coreModel, rotate(coreAngle, [0, 1, 0]));

    var bob = Math.sin(coreBobPhase * 4.0) * 0.1;
    coreModel = mult(coreModel, translate(0.0, bob, 0.0));

    sendMatrices(coreModel);
    drawGeometry(coreGeom); // Uses gl.TRIANGLE_STRIP inside drawGeometry now

    // =======================================================
    // 2. SHARDS (opaque) - PURPLE COLOR APPLIED
    // =======================================================
    
    // Shard Material Properties: PURPLE
    gl.uniform4fv(uAmbientLoc,  flatten(vec4(0.15, 0.05, 0.20, 1.0)));
    gl.uniform4fv(uDiffuseLoc,  flatten(vec4(0.6, 0.2, 0.8, 1.0))); 
    gl.uniform4fv(uSpecularLoc, flatten(vec4(1.0, 1.0, 1.0, 1.0)));
    gl.uniform1f(uShininessLoc, 40.0); 

    for (var i = 0; i < 4; i++) {

        var ang = radians(shardAngles[i]);
        var shardModel = mat4();

        // Use the dynamically updated shardOrbitRadius (from slider)
        var x = shardOrbitRadius * Math.sin(ang); 
        var z = shardOrbitRadius * Math.cos(ang);
        var y = shardYOffset[i];

        shardModel = mult(shardModel, translate(x, y, z));
        shardModel = mult(shardModel, rotate(-shardAngles[i], [0, 1, 0]));

        sendMatrices(shardModel);
        drawGeometry(shardGeom);
    }

    // =======================================================
    // 3. METAL COLLARS (textured)
    // =======================================================
    gl.uniform1i(uUseTextureLoc, true);
    gl.uniform1f(uAlphaLoc, 1.0);
    gl.bindTexture(gl.TEXTURE_2D, textures.metal);

    gl.uniform4fv(uAmbientLoc,  flatten(vec4(0.3, 0.3, 0.3, 1.0)));
    gl.uniform4fv(uDiffuseLoc,  flatten(vec4(0.8, 0.8, 0.8, 1.0)));
    gl.uniform4fv(uSpecularLoc, flatten(vec4(0.6, 0.6, 0.6, 1.0)));
    gl.uniform1f(uShininessLoc, 16.0);

    // Top Collar
    var ring1 = mat4();
    ring1 = mult(ring1, translate(0.0, 3.0, 0.0));
    ring1 = mult(ring1, scalem(4.02, 0.20, 4.02));
    sendMatrices(ring1);
    drawGeometry(cylinderGeom);

    // Bottom Collar
    var ring2 = mat4();
    ring2 = mult(ring2, translate(0.0, -3.0, 0.0));
    ring2 = mult(ring2, scalem(4.02, 0.20, 4.02));
    sendMatrices(ring2);
    drawGeometry(cylinderGeom);

    // =======================================================
    // 4. METAL CAPS (solid color – OPTION E)
    // =======================================================
    gl.uniform1i(uUseTextureLoc, false);
    gl.uniform1f(uAlphaLoc, 1.0);

    // Dark metallic color for caps and pedestal
    gl.uniform4fv(uAmbientLoc,  flatten(vec4(0.18, 0.22, 0.28, 1.0)));
    gl.uniform4fv(uDiffuseLoc,  flatten(vec4(0.30, 0.36, 0.42, 1.0)));
    gl.uniform4fv(uSpecularLoc, flatten(vec4(0.60, 0.68, 0.75, 1.0)));
    gl.uniform1f(uShininessLoc, 32.0);

    // Bottom Cap
    var bottomModel = mat4();
    bottomModel = mult(bottomModel, translate(0.0, -2.0, 0.0)); 
    bottomModel = mult(bottomModel, scalem(4.0, 1.0, 4.0));
    sendMatrices(bottomModel);
    drawGeometry(metalBottomGeom);

    // Top Cap
    var topModel = mat4();
    topModel = mult(topModel, translate(0.0, 2.0, 0.0));    
    topModel = mult(topModel, scalem(4.0, 1.0, 4.0));
    sendMatrices(topModel);
    drawGeometry(metalTopGeom);


    // =======================================================
    // 6. PEDESTAL (NEW MODELING GEOMETRY)
    // =======================================================
    
    // Tier 1: Wide, thick base (Uses metal disk for a flat top)
    var pedestalTier1Model = mat4();
    // Centered at Y = -3.5 (Base of the whole structure)
    pedestalTier1Model = mult(pedestalTier1Model, translate(0.0, -3.5, 0.0)); 
    pedestalTier1Model = mult(pedestalTier1Model, scalem(6.0, 1.0, 6.0));
    sendMatrices(pedestalTier1Model);
    drawGeometry(metalBottomGeom); 

    // Tier 2: Riser (Uses cylinder side for vertical look)
    var pedestalTier2Model = mat4();
    // Centered at Y = -2.75 
    pedestalTier2Model = mult(pedestalTier2Model, translate(0.0, -2.75, 0.0));
    pedestalTier2Model = mult(pedestalTier2Model, scalem(5.0, 0.5, 5.0));
    sendMatrices(pedestalTier2Model);
    drawGeometry(cylinderGeom); 
    
    // Tier 3: Cap/Lip (Use metal disk as a cap for the riser)
    var pedestalTier3Model = mat4();
    // Translate up to meet riser top edge
    pedestalTier3Model = mult(pedestalTier3Model, translate(0.0, -2.5, 0.0)); 
    pedestalTier3Model = mult(pedestalTier3Model, scalem(5.5, 0.1, 5.5));
    sendMatrices(pedestalTier3Model);
    drawGeometry(metalTopGeom); 
    
    // =======================================================
    // 5. GLASS CYLINDER (transparent, last)
    // =======================================================
    gl.uniform1i(uUseTextureLoc, true);
    gl.bindTexture(gl.TEXTURE_2D, textures.glass);

    gl.uniform1f(uAlphaLoc, 0.35);

    gl.uniform4fv(uAmbientLoc,  flatten(vec4(0.1, 0.1, 0.15, 1.0)));
    gl.uniform4fv(uDiffuseLoc,  flatten(vec4(0.3, 0.3, 0.4, 1.0)));
    gl.uniform4fv(uSpecularLoc, flatten(vec4(1.0, 1.0, 1.0, 1.0))); 
    gl.uniform1f(uShininessLoc, 32.0); 
    
    var cylModel = mat4();
    cylModel = mult(cylModel, scalem(4.0, 3.0, 4.0));
    sendMatrices(cylModel);
    drawGeometry(cylinderGeom);
}