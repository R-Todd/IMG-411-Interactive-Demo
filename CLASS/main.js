//
// main.js – FINAL PATCHED VERSION
// Transparent Containment Cylinder + Metal End Caps + Core + Shards
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

var uAlphaLoc;   // NEW – transparency control

// Geometry
var coreGeom;
var shardGeom;
var cylinderGeom;
var metalTopGeom;
var metalBottomGeom;

// =======================================================
// Camera Settings (Patched)
// =======================================================
var cameraOrbitAngle = 180.0;   // start facing core
var cameraOrbitSpeed = 2.0;
var cameraDistance   = 2.0;     // start inside cylinder

var eye = vec3(0.0, 1.5, 6.0);
var at  = vec3(0.0, 0.6, 0.0);
var up  = vec3(0.0, 1.0, 0.0);

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
// Keyboard Controls
// =======================================================
window.onkeydown = function(event) {
    var key = event.key;

    if (key === "ArrowLeft")  cameraOrbitAngle -= cameraOrbitSpeed;
    if (key === "ArrowRight") cameraOrbitAngle += cameraOrbitSpeed;

    if (key === "w" || key === "W") cameraDistance -= 0.3;
    if (key === "s" || key === "S") cameraDistance += 0.3;

    if (key === "1") corePulseSpeed = (corePulseSpeed > 0.05) ? 0.02 : 0.08;

    if (key === "2") {
        shardOrbitSpeeds = (shardOrbitSpeeds[0] < 1.5)
            ? [2.0, 2.5, 3.0, 3.5]
            : [1.0, 1.4, 1.8, 2.2];
    }
};

// =======================================================
// Button Controls
// =======================================================
function orbitLeft()  { cameraOrbitAngle -= cameraOrbitSpeed * 3.0; }
function orbitRight() { cameraOrbitAngle += cameraOrbitSpeed * 3.0; }
function resetCamera(){
    cameraOrbitAngle = 180.0;
    cameraDistance   = 2.0;
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

    // Enable GLASS transparency blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Attributes
    vPositionLoc = gl.getAttribLocation(program, "vPosition");
    aNormalLoc   = gl.getAttribLocation(program, "aNormal");
    vTexCoordLoc = gl.getAttribLocation(program, "vTexCoord");

    // Uniforms
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

    uAlphaLoc = gl.getUniformLocation(program, "uAlpha");

    // Bind sampler uniform to texture unit 0  (CRITICAL FIX)
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uTextureLoc, 0);

    // Projection
    var aspect = canvas.width / canvas.height;
    var projMat = perspective(45.0, aspect, 0.1, 100.0);
    gl.uniformMatrix4fv(uProjectionLoc, false, flatten(projMat));

    // Lighting
    gl.uniform3fv(uLightPosLoc, flatten(vec3(0.0, 0.5, 0.0)));

    // Load textures
    textures.glass = loadTexture("textures/glass.jpg");
    textures.metal = loadTexture("textures/metal.jpg");

    // Geometry
    coreGeom     = createCoreGeometry(gl, 1.0, 32, 32);
    shardGeom    = createShardGeometry(gl, 1.2, 0.35);

    var cyl = createCylinderGeometry(gl, 64);
    cylinderGeom   = cyl.side;
    metalBottomGeom = cyl.bottom;
    metalTopGeom    = cyl.top;

    render();
};

// =======================================================
// Render Loop (PATCHED ORDER)
// =======================================================
function render() {
    requestAnimFrame(render);

    // Update animation
    coreAngle      += coreRotateSpeed * 0.01;
    corePulsePhase += corePulseSpeed;
    coreBobPhase   += coreBobSpeed;

    for (var i = 0; i < 4; i++) {
        shardAngles[i] += shardOrbitSpeeds[i];
        if (shardAngles[i] > 360) shardAngles[i] -= 360;
    }

    // Clear screen
    gl.clearColor(0.05, 0.05, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Camera orbit
    var rad = radians(cameraOrbitAngle);
    eye = vec3(
        cameraDistance * Math.sin(rad),
        1.5,
        cameraDistance * Math.cos(rad)
    );

    var view = lookAt(eye, at, up);
    gl.uniformMatrix4fv(uViewLoc, false, flatten(view));
    gl.uniform3fv(uCameraPosLoc, flatten(eye));

    // =======================================================
    // 1. OPAQUE OBJECTS FIRST
    // =======================================================

    // ------------------------------
    // CORE (opaque)
    // ------------------------------
    gl.uniform1f(uAlphaLoc, 1.0);
    gl.uniform1i(uUseTextureLoc, false);

    var coreModel = mat4();

    coreModel = mult(coreModel, translate(0.0, 0.6, 0.0));

    var pulse = 1.0 + 0.05 * Math.sin(corePulsePhase * 3.0);
    coreModel = mult(coreModel, scalem(pulse, pulse, pulse));

    coreModel = mult(coreModel, rotate(coreAngle, [0, 1, 0]));

    var bob = Math.sin(coreBobPhase * 4.0) * 0.1;
    coreModel = mult(coreModel, translate(0.0, bob, 0.0));

    sendMatrices(coreModel);
    drawGeometry(coreGeom);

    // ------------------------------
    // SHARDS (opaque)
    // ------------------------------
    gl.uniform1f(uAlphaLoc, 1.0);
    gl.uniform1i(uUseTextureLoc, false);

    gl.uniform4fv(uAmbientLoc,  flatten(vec4(0.2, 0.2, 0.2, 1.0)));
    gl.uniform4fv(uDiffuseLoc,  flatten(vec4(1.0, 1.0, 1.0, 1.0)));
    gl.uniform4fv(uSpecularLoc, flatten(vec4(1.0, 1.0, 1.0, 1.0)));
    gl.uniform1f(uShininessLoc, 32.0);

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

    // ------------------------------
    // METAL END CAPS (opaque)
    // ------------------------------
    gl.uniform1f(uAlphaLoc, 1.0);
    gl.uniform1i(uUseTextureLoc, true);

    gl.bindTexture(gl.TEXTURE_2D, textures.metal);

    gl.uniform4fv(uAmbientLoc,  flatten(vec4(0.3, 0.3, 0.3, 1.0)));
    gl.uniform4fv(uDiffuseLoc,  flatten(vec4(0.8, 0.8, 0.8, 1.0)));
    gl.uniform4fv(uSpecularLoc, flatten(vec4(0.6, 0.6, 0.6, 1.0)));
    gl.uniform1f(uShininessLoc, 16.0);

    // Bottom cap
    var bottomModel = mat4();
    bottomModel = mult(bottomModel, scalem(4.0, 1.0, 4.0));
    bottomModel = mult(bottomModel, translate(0.0, -3.0, 0.0));
    sendMatrices(bottomModel);
    drawGeometry(metalBottomGeom);

    // Top cap
    var topModel = mat4();
    topModel = mult(topModel, scalem(4.0, 1.0, 4.0));
    topModel = mult(topModel, translate(0.0, 3.0, 0.0));
    sendMatrices(topModel);
    drawGeometry(metalTopGeom);

    // =======================================================
    // 2. TRANSPARENT OBJECTS LAST
    // =======================================================

    // ------------------------------
    // GLASS CYLINDER (transparent)
    // ------------------------------
    gl.uniform1i(uUseTextureLoc, true);
    gl.bindTexture(gl.TEXTURE_2D, textures.glass);

    gl.uniform1f(uAlphaLoc, 0.35);   // TRANSPARENT

    gl.uniform4fv(uAmbientLoc,  flatten(vec4(0.1, 0.1, 0.15, 1.0)));
    gl.uniform4fv(uDiffuseLoc,  flatten(vec4(0.3, 0.3, 0.4, 1.0)));
    gl.uniform4fv(uSpecularLoc, flatten(vec4(0.9, 0.9, 1.0, 1.0)));
    gl.uniform1f(uShininessLoc, 64.0);

    var cylModel = mat4();
    cylModel = mult(cylModel, scalem(4.0, 3.0, 4.0));
    sendMatrices(cylModel);
    drawGeometry(cylinderGeom);
}

// =======================================================
// Helper Functions
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

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indexBuffer);
    gl.drawElements(gl.TRIANGLES, geom.numIndices, gl.UNSIGNED_SHORT, 0);
}
