// pedestal-model.js


function drawPedestal(gl, materialSetter, helpers) {
    // funtion imports 
    const { cylinderGeom, metalBottomGeom, metalTopGeom, sendMatrices, drawGeometry } = helpers;
    
    // sets dark metallic material (same as cap)
    materialSetter(gl, Materials.METAL_CAP);

    
    
    // pedestal is made of 3 tiers:
    // tier 1: Bottom wide layer
    // tier 2: Middle riser
    // tier 3: Top thin layer


    var pedestalTier3Model = mat4();
    // position: 
    //      Y = -3.1 
    //      Center of 0.2 
    //      height scaled by 0.1)
    pedestalTier3Model = mult(pedestalTier3Model, translate(0.0, -3.1, 0.0)); 


    // Scale: Wide (5.5) and very short (0.1)
    pedestalTier3Model = mult(pedestalTier3Model, scalem(5.5, 0.1, 5.5));
    sendMatrices(pedestalTier3Model);
    drawGeometry(metalTopGeom); // Use the disk geometry for the top surface

    // Tier 2 (middle riser) - Vertical cylindrical part
    var pedestalTier2Model = mat4();
    // Calculate position: 
    // - Y = -3.7
    // - Center of 1.0 
    // - height scaled by 0.5)
    pedestalTier2Model = mult(pedestalTier2Model, translate(0.0, -3.7, 0.0));

    // Scale: Medium width (5.0) and medium height (0.5)
    pedestalTier2Model = mult(pedestalTier2Model, scalem(5.0, 0.5, 5.0));
    sendMatrices(pedestalTier2Model);
    drawGeometry(cylinderGeom); // Use the cylinder geometry
    
    // Tier 1 (Base)
    var pedestalTier1Model = mat4();
    // Calculate position: 
    // - Y = -5.2 
    // - Center of 2.0 
    // - height scaled by 1.0)
    pedestalTier1Model = mult(pedestalTier1Model, translate(0.0, -5.2, 0.0)); 
    // Widest (6.0) and tall (1.0)
    pedestalTier1Model = mult(pedestalTier1Model, scalem(6.0, 1.0, 6.0));
    sendMatrices(pedestalTier1Model);
    drawGeometry(metalBottomGeom); // Use the disk geometry for the bottom surface
}
// _____________________________________________________________