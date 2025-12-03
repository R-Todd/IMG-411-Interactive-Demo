//
// main.js – REFACTORED VERSION with PROJECTION TOGGLE AND ASYNC FIX
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

var uMaterialLocs = {}; 

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
// Camera Settings 
// =======================================================
var eye = vec3(0.0, 0.0, -20.0); // Camera starts at (0, 0, -20)
var at  = vec3(0.0, 0.0, 0.0);   // Looking at origin
var up  = vec3(0.0, 1.0, 0.0); 

var moveSpeed = 0.3; 
var turnSpeed = 2.0; 

// Projection State
var isOrthographic = false; 
var near = 0.1;
var far = 100.0;
var fovy = 45.0; 
var ORTHO_SIZE = 6.0; 

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

var coreResolution = 32; 
var MIN_RESOLUTION = 4;
var MAX_RESOLUTION = 64;

// =======================================================
// Textures (UPDATED FOR ASYNC COUNTING)
// =======================================================
var textures = {
    glass: null,
    metal: null
};

// Counters for synchronization
var textureCount = 0;
var texturesLoaded = 0;

function loadTexture(path) {
    var tex = gl.createTexture();
    
    // 1. Register this texture to be counted
    textureCount++; 
    
    tex.image = new Image();
    tex.image.onload = function() {

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                      gl.UNSIGNED_BYTE, tex.image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // 2. Mark as loaded
        texturesLoaded++; 
        
        // 3. Check if all textures are done. If so, start rendering.
        if (texturesLoaded === textureCount) {
            render(); 
        }
    };
    tex.image.src = path;
    return tex;
}

// =======================================================
// Core Resolution Functions (unchanged)
// =======================================================

function recreateCoreGeometry() {
    if (coreGeom) {
        gl.deleteBuffer(coreGeom.positionBuffer);
        gl.deleteBuffer(coreGeom.normalBuffer);
        gl.deleteBuffer(coreGeom.texCoordBuffer);
    }
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
// Projection Toggle Function (NEW)
// =======================================================
function toggleProjection() {
    isOrthographic = !isOrthographic;
}

// =======================================================
// Keyboard/Button Controls (unchanged)
// =======================================================
window.onkeydown = function(event) {
    var key = event.key;
    var V, R, R_XZ_Norm; 

    V = normalize( subtract(at, eye) ); 
    R = normalize( cross(V, up) );       

    var R_XZ = vec3(R[0], 0.0, R[2]); 
    var R_XZ_len = length(R_XZ);
    if (R_XZ_len < 1e-6) {
        R_XZ_Norm = vec3(1.0, 0.0, 0.0); 
    } else {
        R_XZ_Norm = scale(1.0 / R_XZ_len, R_XZ);
    }

    var moveVector; 
    var rotateMatrix;

    if (key === "w" || key === "W") { 
        moveVector = scale(moveSpeed, V);
    } else if (key === "s" || key === "S") { 
        moveVector = scale(-moveSpeed, V);
    } else if (key === "d" || key === "D") { 
        moveVector = scale(moveSpeed, R_XZ_Norm);
    } else if (key === "a" || key === "A") { 
        moveVector = scale(-moveSpeed, R_XZ_Norm);
    }
    
    if (moveVector) {
        eye = add(eye, moveVector);
        at = add(at, moveVector);
    }

    if (key === "ArrowLeft") { 
        rotateMatrix = rotate(turnSpeed, up); 
    } else if (key === "ArrowRight") { 
        rotateMatrix = rotate(-turnSpeed, up); 
    }

    if (rotateMatrix) {
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
    
    if (key === "1") corePulseSpeed = (corePulseSpeed > 0.05) ? 0.02 : 0.08;
    if (key === "2") {
        shardOrbitSpeeds = (shardOrbitSpeeds[0] < 1.5)
            ? [2.0, 2.5, 3.0, 3.5]
            : [1.0, 1.4, 1.8, 2.2];
    }
};

function orbitLeft()  { 
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
    eye = vec3(0.0, 0.0, -20.0);
    at  = vec3(0.0, 0.0, 0.0);
}

function toggleLightOrbit() { 
    lightOrbitOn = !lightOrbitOn;
}


// =======================================================
// Initialization (FIXED)
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

    // --- Retrieve and Store ALL Uniform Locations for Helpers ---
    vPositionLoc = gl.getAttribLocation(program, "vPosition");
    aNormalLoc   = gl.getAttribLocation(program, "aNormal");
    vTexCoordLoc = gl.getAttribLocation(program, "vTexCoord");

    uModelLoc        = gl.getUniformLocation(program, "uModel");
    uViewLoc         = gl.getUniformLocation(program, "uView");
    uProjectionLoc   = gl.getUniformLocation(program, "uProjection");
    uNormalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

    uMaterialLocs.uAmbientLoc    = gl.getUniformLocation(program, "uAmbient");
    uMaterialLocs.uDiffuseLoc    = gl.getUniformLocation(program, "uDiffuse");
    uMaterialLocs.uSpecularLoc   = gl.getUniformLocation(program, "uSpecular");
    uMaterialLocs.uShininessLoc  = gl.getUniformLocation(program, "uShininess");

    uLightPosLoc   = gl.getUniformLocation(program, "uLightPos");
    uCameraPosLoc  = gl.getUniformLocation(program, "uCameraPos");

    uMaterialLocs.uUseTextureLoc = gl.getUniformLocation(program, "uUseTexture");
    uTextureLoc                  = gl.getUniformLocation(program, "uTexture");
    uMaterialLocs.uAlphaLoc      = gl.getUniformLocation(program, "uAlpha");
    // -------------------------------------------------------------

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uTextureLoc, 0);
    
    // --- START TEXTURE LOADING ---
    textures.glass = loadTexture("textures/glass.jpg");
    textures.metal = loadTexture("textures/metal.jpg");
    // render() call is now removed from here and placed in the loadTexture onload callback
    // to ensure synchronization.
    
    // --- GEOMETRY SETUP (runs immediately) ---
    coreGeom     = createCoreGeometry(gl, 1.0, coreResolution, coreResolution); 
    shardGeom    = createShardGeometry(gl, 1.2, 0.35);

    var cyl = createCylinderGeometry(gl, 64);
    cylinderGeom    = cyl.side;
    metalBottomGeom = cyl.bottom;
    metalTopGeom    = cyl.top;

    var slider = document.getElementById("shardRadiusSlider");
    if (slider) {
        shardRadiusFactor = slider.valueAsNumber;
    }

}; // end init()


// =======================================================
// Helpers (unchanged)
// =======================================================
function sendMatrices(model) {

    gl.uniformMatrix4fv(uModelLoc, false, flatten(model));

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

    if (geom === coreGeom) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, geom.numVertices);
    } else {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indexBuffer);
        gl.drawElements(gl.TRIANGLES, geom.numIndices, gl.UNSIGNED_SHORT, 0);
    }
}


// =======================================================
// Render Loop (Core Logic)
// =======================================================
function render() {
    requestAnimFrame(render);

    // ... (rest of animation logic) ...

    gl.clearColor(0.05, 0.05, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

    // --- Dynamic Projection Matrix Calculation ---
    var canvas = document.getElementById("gl-canvas");
    var aspect = canvas.width / canvas.height;
    var projMat;

    if (isOrthographic) {
        var w = ORTHO_SIZE * aspect;
        var h = ORTHO_SIZE; 
        projMat = ortho(-w, w, -h, h, near, far);
    } else {
        projMat = perspective(fovy, aspect, near, far);
    }

    gl.uniformMatrix4fv(uProjectionLoc, false, flatten(projMat));

    // ... (rest of rendering loop logic) ...

    var currentLightPos;
    if (lightOrbitOn) {
        var radLight = radians(lightOrbitAngle);
        var lx = lightDistance * Math.sin(radLight);
        var lz = lightDistance * Math.cos(radLight);
        currentLightPos = vec3(lx, lightOrbitHeight, lz);
        lightOrbitAngle += lightOrbitSpeed * 0.01;
    } else {
        currentLightPos = vec3(0.0, lightOrbitHeight, 0.0);
    }
    gl.uniform3fv(uLightPosLoc, flatten(currentLightPos));

    var view = lookAt(eye, at, up);
    gl.uniformMatrix4fv(uViewLoc, false, flatten(view));
    gl.uniform3fv(uCameraPosLoc, flatten(eye));

    shardOrbitRadius = 2.3 * shardRadiusFactor; 

    // =======================================================
    // 1. CORE (opaque)
    // =======================================================
    setMaterial(gl, uMaterialLocs, Materials.CORE);
    
    var coreModel = mat4();
    coreModel = mult(coreModel, translate(0.0, 0.6, 0.0));
    var pulse = 1.0 + 0.05 * Math.sin(corePulsePhase * 3.0);
    coreModel = mult(coreModel, scalem(pulse, pulse, pulse));
    coreModel = mult(coreModel, rotate(coreAngle, [0, 1, 0]));
    var bob = Math.sin(coreBobPhase * 4.0) * 0.1;
    coreModel = mult(coreModel, translate(0.0, bob, 0.0));

    sendMatrices(coreModel);
    drawGeometry(coreGeom); 

    // =======================================================
    // 2. SHARDS (opaque)
    // =======================================================
    setMaterial(gl, uMaterialLocs, Materials.SHARDS_PURPLE);

    for (var i = 0; i < 4; i++) {
        var ang = radians(shardAngles[i]);
        var shardModel = mat4();

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
    setMaterial(gl, uMaterialLocs, Materials.METAL_COLLAR(textures.metal));

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
    // 4. METAL CAPS (solid color)
    // =======================================================
    setMaterial(gl, uMaterialLocs, Materials.METAL_CAP);

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
    // 6. PEDESTAL 
    // =======================================================
    
    const pedestalHelpers = { 
        cylinderGeom: cylinderGeom, 
        metalBottomGeom: metalBottomGeom, 
        metalTopGeom: metalTopGeom, 
        sendMatrices: sendMatrices, 
        drawGeometry: drawGeometry 
    };
    
    drawPedestal(gl, 
        (gl, material) => setMaterial(gl, uMaterialLocs, material), 
        pedestalHelpers
    );
    
    // =======================================================
    // 5. GLASS CYLINDER (transparent, last)
    // =======================================================
    setMaterial(gl, uMaterialLocs, Materials.GLASS_CYLINDER(textures.glass));
    
    var cylModel = mat4();
    cylModel = mult(cylModel, scalem(4.0, 3.0, 4.0));
    sendMatrices(cylModel);
    drawGeometry(cylinderGeom);
}