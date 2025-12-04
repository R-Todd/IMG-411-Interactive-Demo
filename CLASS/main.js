//
// main.js –
// Used for
//      - Handles camera control
//      - animation state
//      - rendering loop,
//      - loading resources 
//

var gl;
var program;

// Attribute Locations
var vPositionLoc;
var aNormalLoc;
var vTexCoordLoc;

// =======================================================

// Uniform Locations
var uModelLoc; // Model matrix
var uViewLoc; // View matrix
var uProjectionLoc; // Projection matrix
var uNormalMatrixLoc; // Normal matrix

var uLightPosLoc
var uCameraPosLoc;

var uMaterialLocs = {}; // stores all material-related uniform locations

var uUseTextureLoc;
var uTextureLoc;

var uAlphaLoc;   // transparency control


//  Geometry 
var coreGeom;
var shardGeom;
var cylinderGeom;
var metalTopGeom;
var metalBottomGeom;
// _______________________


// =======================================================
// Camera Settings movement same as assignment 4
var eye = vec3(0.0, 0.0, -20.0); // Camera starts at (0, 0, -20)
var at  = vec3(0.0, 0.0, 0.0);   // Looking at origin
var up  = vec3(0.0, 1.0, 0.0); // Up vector

var moveSpeed = 0.5; 
var turnSpeed = 2.0; 

// ----- Projection State -----
var isOrthographic = false; // Toggle between perspective and orthographic projection
var near = 0.1;
var far = 100.0;
var fovy = 45.0; 
var ORTHO_SIZE = 6.0; 



// =======================================================
// Animation 

var coreAngle       = 0.0;     // Y-axis rotation angle
var corePulsePhase  = 0.0;     // pulse animation timing
var coreBobPhase    = 0.0;     // Vertical bob animation timing

var shardAngles = [0.0, 90.0, 180.0, 270.0]; // Current angle for each shard
var shardOrbitSpeeds = [1.0, 1.4, 1.8, 2.2]; // updated - using diffrent speeds for each shard
var shardOrbitRadius = 2.3;
var shardYOffset     = [0.5, -0.3, 0.9, -0.1];

var coreRotateSpeed = 20.0;
var corePulseSpeed  = 0.08;
var coreBobSpeed    = 0.05;


// =======================================================
// Light orbit Settings


var lightOrbitAngle = 0.0;
var lightOrbitSpeed = 100.0; // speed of light source orbit
var lightOrbitOn = false;   // toggle state
var lightDistance = 5.0;    // distance from origin
var lightOrbitHeight = 3.0; // height above XZ plane



// =======================================================
// Set variables for buttons

var shardRadiusFactor = 1.0; 
var shardSpeedFactor = 1.0; 

var coreResolution = 32; 
var MIN_RESOLUTION = 4;
var MAX_RESOLUTION = 64;




// =======================================================
// Textures 
var textures = {
    glass: null, 
    metal: null
};

var textureCount = 0; // Total textures expected
var texturesLoaded = 0; // Textures finished loading

// --------------------------------------------
// Load texture from image file path

function loadTexture(path) {
    var tex = gl.createTexture();
    
    textureCount++; // increment expected count
    
    tex.image = new Image();
    
    // uses onload to upload texture when ready
    tex.image.onload = function() {
        // Prepare GL for texture upload
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);

        // Flip image in Y for correct UV coordinates
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        
        // Load the image data to the GPU
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
                      gl.UNSIGNED_BYTE, tex.image);

        // Set texture sampling parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        texturesLoaded++; // increment loaded count
        
        //  ----------
        // forces render to wait until textures are loaded
        if (texturesLoaded === textureCount) {
            render(); 
        }
    };
    
    tex.image.src = path; // start image download
    return tex;
}




// ===========================================
//  recreate core gromety for adding more faces to sphere (core)



// Delete old core geometry and generate a new one
function recreateCoreGeometry() {
    // Check and delete existing buffers to free memory
    if (coreGeom) {
        gl.deleteBuffer(coreGeom.positionBuffer); // delete position buffer
        gl.deleteBuffer(coreGeom.normalBuffer);  // delete normal buffer
        gl.deleteBuffer(coreGeom.texCoordBuffer); // delete texCoord buffer
    }
    // new core geometry with the updated resolution
    coreGeom = createCoreGeometry(gl, 1.0, coreResolution, coreResolution);
}

function increaseResolution() {
    // if below max, double resolution
    if (coreResolution < MAX_RESOLUTION) {
        coreResolution = Math.min(MAX_RESOLUTION, coreResolution * 2);
        recreateCoreGeometry();
    }
}

function decreaseResolution() {
    // if above min, 1/2 resolution
    if (coreResolution > MIN_RESOLUTION) {
        coreResolution = Math.max(MIN_RESOLUTION, coreResolution / 2);
        recreateCoreGeometry();
    }
}
// end 

// =======================================================
// Projection Toggle Function

function toggleProjection() {
    isOrthographic = !isOrthographic; // switch the projection mode
}


// =======================================================
// Keyboard/Button Controls (same as assignment 4)
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


// Orbit camera functions
function orbitLeft()  { 
    var V = normalize( subtract(at, eye) );  // view vector
    var rotateMatrix = rotate(turnSpeed * 3.0, up);  // rotation matrix
    
    var V_vec4 = vec4(V[0], V[1], V[2], 0.0); 
    var V_rotated_array = [];
    for (var i = 0; i < 4; i++) {
        // for each row
        // compute dot product
        var row = rotateMatrix[i];
        var V_in = V_vec4;
        var sum = row[0] * V_in[0] + 
                  row[1] * V_in[1] + 
                  row[2] * V_in[2] + 
                  row[3] * V_in[3];
        V_rotated_array.push(sum);
    }
    
    var V_rotated = V_rotated_array; 
    
    
    var new_V = normalize(V_rotated.slice(0, 3)); // take X,Y,Z
    var distance = length(subtract(at, eye));  // current distance
    at = add(eye, scale(distance, new_V)); // new at position
}

// same as abobe but opposite direction (negitive angle)
function orbitRight() { 
    var V = normalize( subtract(at, eye) ); 
    var rotateMatrix = rotate(-turnSpeed * 3.0, up); // !!!!! negitive angle
    
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

// reset camera for button
function resetCamera(){
    eye = vec3(0.0, 0.0, -20.0);
    at  = vec3(0.0, 0.0, 0.0);
}

// toggle light orbit for button
function toggleLightOrbit() { 
    lightOrbitOn = !lightOrbitOn;
}




// =======================================================
// INIT function


window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL unavailable"); return; }

    // webGL setup
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.DEPTH_TEST);

    // ==========
    // !!!! GLASS !!!!!
    // ==========
    // added bleed to make glass transparent
    gl.enable(gl.BLEND); // enables blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // set blending function



    // ===============================================================
    // Shaders and buffers

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    //Retrieve and Store every Uniform Location 

    // vertex data
    vPositionLoc = gl.getAttribLocation(program, "vPosition");
    aNormalLoc   = gl.getAttribLocation(program, "aNormal");
    vTexCoordLoc = gl.getAttribLocation(program, "vTexCoord");

    // matrices
    uModelLoc        = gl.getUniformLocation(program, "uModel");
    uViewLoc         = gl.getUniformLocation(program, "uView");
    uProjectionLoc   = gl.getUniformLocation(program, "uProjection");
    uNormalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

    // material uniforms
    uMaterialLocs.uAmbientLoc    = gl.getUniformLocation(program, "uAmbient");
    uMaterialLocs.uDiffuseLoc    = gl.getUniformLocation(program, "uDiffuse");
    uMaterialLocs.uSpecularLoc   = gl.getUniformLocation(program, "uSpecular");
    uMaterialLocs.uShininessLoc  = gl.getUniformLocation(program, "uShininess");

    // light and camera positions
    uLightPosLoc   = gl.getUniformLocation(program, "uLightPos");
    uCameraPosLoc  = gl.getUniformLocation(program, "uCameraPos");

    // material texture uniforms
    uMaterialLocs.uUseTextureLoc = gl.getUniformLocation(program, "uUseTexture");
    uTextureLoc                  = gl.getUniformLocation(program, "uTexture");
    uMaterialLocs.uAlphaLoc      = gl.getUniformLocation(program, "uAlpha");

    // Set texture unit 0 for uTexture uniform
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uTextureLoc, 0);
    
    // load textures using texture.image_name

    textures.glass = loadTexture("textures/glass.jpg");
    textures.metal = loadTexture("textures/metal.jpg");
    
    
    // |||| GEOMETRY SETUP  |||||

    // CORE
    coreGeom     = createCoreGeometry(gl, 1.0, coreResolution, coreResolution); 
    //SHARD
    shardGeom    = createShardGeometry(gl, 1.2, 0.35);

    // Create cylinder, 
    // - bottom cap
    // - top cap 
    var cyl = createCylinderGeometry(gl, 64);
    cylinderGeom    = cyl.side; // glass around core
    metalBottomGeom = cyl.bottom;
    metalTopGeom    = cyl.top;

    // Get slider values
    var slider = document.getElementById("shardRadiusSlider");
    // if slider exists, get value
    if (slider) {
        shardRadiusFactor = slider.valueAsNumber;
    }
    // same for speed
    var sliderSpeed = document.getElementById("shardSpeedSlider");
    if (sliderSpeed) {
        shardSpeedFactor = sliderSpeed.valueAsNumber;
    }


}; // end init()


// now we must add the functions from material setup and pedastal 


function sendMatrices(model) {

    // send Model matrix
    gl.uniformMatrix4fv(uModelLoc, false, flatten(model)); 

    // ModelView matrix = (View * Model)
    var mv = mult(lookAt(eye, at, up), model); 
    
    // Normal Matrix 
    var normalM = normalMatrix(mv, true); // true flag returns mat3

    // Send Normal Matrix
    gl.uniformMatrix3fv(uNormalMatrixLoc, false, flatten(normalM));
}


// Draw the given geometry object
function drawGeometry(geom) {

    // 1) position Buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, geom.positionBuffer); // bind position buffer
    gl.vertexAttribPointer(vPositionLoc, 3, gl.FLOAT, false, 0, 0); // setup pointer
    gl.enableVertexAttribArray(vPositionLoc); // enable 

    // 2)  normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, geom.normalBuffer); // bind normal buffer
    gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 0, 0); // setup pointer
    gl.enableVertexAttribArray(aNormalLoc); // enable 

    // 3) texture Coordinate buffer 
    gl.bindBuffer(gl.ARRAY_BUFFER, geom.texCoordBuffer); // bind texCoord buffer
    gl.vertexAttribPointer(vTexCoordLoc, 2, gl.FLOAT, false, 0, 0); // setup pointer
    gl.enableVertexAttribArray(vTexCoordLoc); // enable

    // DRAW 
    if (geom === coreGeom) {
        // core uses TRIANGLE_STRIP and numVertices
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, geom.numVertices);
    } else {
        // Other objects use index TRIANGLES
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indexBuffer);
        gl.drawElements(gl.TRIANGLES, geom.numIndices, gl.UNSIGNED_SHORT, 0);
    }
}





// =======================================================
// Render Loop

function render() {
    requestAnimFrame(render); // next frame (at top)

    // -Time Step
    coreAngle      += coreRotateSpeed * 0.01; // rotation
    corePulsePhase += corePulseSpeed; // pulse
    coreBobPhase   += coreBobSpeed; // bob 

    for (var i = 0; i < 4; i++) {
        // for loop for speed (slider)
        shardAngles[i] += shardOrbitSpeeds[i] * 0.1 * shardSpeedFactor; 
        // keep angles in 0-360 range
        if (shardAngles[i] > 360) shardAngles[i] -= 360;
    }

    gl.clearColor(0.05, 0.05, 0.08, 1.0); // Set background color
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear buffers


    // ===========================================
    // Projection matrix setup 

    var canvas = document.getElementById("gl-canvas");
    var aspect = canvas.width / canvas.height;
    var projMat;

    // projection matrix based on camera toggle
    if (isOrthographic) {
        var w = ORTHO_SIZE * aspect; //width
        var h = ORTHO_SIZE; // height
        projMat = ortho(-w, w, -h, h, near, far); // Orthographic 
    } else {
        projMat = perspective(fovy, aspect, near, far); // Perspective 
    }

    gl.uniformMatrix4fv(uProjectionLoc, false, flatten(projMat)); // Send projection matrix


    // ==================================
    // LIGHTING SETUP
    // first set the current postion
    var currentLightPos; 
    if (lightOrbitOn) {
        //  orbiting light position
        var radLight = radians(lightOrbitAngle); // current angle in radians
        var lx = lightDistance * Math.sin(radLight); // X position
        var lz = lightDistance * Math.cos(radLight); // Z position
        currentLightPos = vec3(lx, lightOrbitHeight, lz); // Y position
        lightOrbitAngle += lightOrbitSpeed * 0.01; // increment angle
    } else {
        // stationary light 
        currentLightPos = vec3(0.0, lightOrbitHeight, 0.0);
    }
    // after loop send light position
    gl.uniform3fv(uLightPosLoc, flatten(currentLightPos)); 

    // send view matrix + camera position
    var view = lookAt(eye, at, up);
    gl.uniformMatrix4fv(uViewLoc, false, flatten(view));
    gl.uniform3fv(uCameraPosLoc, flatten(eye));

    shardOrbitRadius = 2.3 * shardRadiusFactor; // Update radius based on slider
    
    
    // ==========================================
    // Draw commands (CORE)
    
    setMaterial(gl, uMaterialLocs, Materials.CORE);
    
    var coreModel = mat4();
    coreModel = mult(coreModel, translate(0.0, 0.6, 0.0)); // Base position
    // Scale pulse effect
    var pulse = 1.0 + 0.05 * Math.sin(corePulsePhase * 3.0);
    coreModel = mult(coreModel, scalem(pulse, pulse, pulse));
    coreModel = mult(coreModel, rotate(coreAngle, [0, 1, 0])); // Y-axis rotation
    // Vertical bob effect
    var bob = Math.sin(coreBobPhase * 4.0) * 0.1;
    coreModel = mult(coreModel, translate(0.0, bob, 0.0));

    sendMatrices(coreModel);
    drawGeometry(coreGeom); 
    // ==============================================================================
    // SHARDS 

    setMaterial(gl, uMaterialLocs, Materials.SHARDS_PURPLE);

    for (var i = 0; i < 4; i++) {
        // for each shard (4) 
        var ang = radians(shardAngles[i]);
        var shardModel = mat4();

        // Calculate orbit position
        var x = shardOrbitRadius * Math.sin(ang); 
        var z = shardOrbitRadius * Math.cos(ang);
        var y = shardYOffset[i];

        // transformations
        shardModel = mult(shardModel, translate(x, y, z)); // orbit position
        shardModel = mult(shardModel, rotate(-shardAngles[i], [0, 1, 0])); // Rotate the shard body

        sendMatrices(shardModel);
        drawGeometry(shardGeom);
    }
    // ==============================================================================
    // Metal rings (around glass)

    setMaterial(gl, uMaterialLocs, Materials.METAL_COLLAR(textures.metal));

    // top ring
    var ring1 = mat4();
    ring1 = mult(ring1, translate(0.0, 3.0, 0.0)); // Top position
    ring1 = mult(ring1, scalem(4.02, 0.20, 4.02)); // make slightly larger than glass
    sendMatrices(ring1);
    drawGeometry(cylinderGeom);

    // bottom (same as above but moved down)
    var ring2 = mat4();
    ring2 = mult(ring2, translate(0.0, -3.0, 0.0)); // Bottom position
    ring2 = mult(ring2, scalem(4.02, 0.20, 4.02)); 
    sendMatrices(ring2);
    drawGeometry(cylinderGeom);
    
    // ==============================================================================
    // METAL CAPS (top/bottom face)

    setMaterial(gl, uMaterialLocs, Materials.METAL_CAP);

    var bottomModel = mat4();
    bottomModel = mult(bottomModel, translate(0.0, -2.0, 0.0)); // position below core
    bottomModel = mult(bottomModel, scalem(4.0, 1.0, 4.0));
    sendMatrices(bottomModel);
    drawGeometry(metalBottomGeom); // call disk geometry

    var topModel = mat4();
    topModel = mult(topModel, translate(0.0, 2.0, 0.0));    // position above core
    topModel = mult(topModel, scalem(4.0, 1.0, 4.0));
    sendMatrices(topModel);
    drawGeometry(metalTopGeom); // call disk geometry

    // ==============================================================================
    // PEDESTAL  (from pedestal-model.js)
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

    // ==============================================================================
    // GLASS CYLINDER 
    // fix - must draw last for the transparency to work

    setMaterial(gl, uMaterialLocs, Materials.GLASS_CYLINDER(textures.glass));
    
    var cylModel = mat4();
    cylModel = mult(cylModel, scalem(4.0, 3.0, 4.0)); // Scale to fit around core
    sendMatrices(cylModel);
    drawGeometry(cylinderGeom);
}