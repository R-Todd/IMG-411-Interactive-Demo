//
// pedestal-model.js
// Contains functions to draw the pedestal geometry using transformations.
//
// Assumes global helper functions (mult, translate, scalem) are available.
//
function drawPedestal(gl, materialSetter, helpers) {
    const { cylinderGeom, metalBottomGeom, metalTopGeom, sendMatrices, drawGeometry } = helpers;
    
    // Set Pedestal Material (Reusing Dark Metal from Cap/Tier)
    materialSetter(gl, Materials.METAL_CAP);

    // --- Pedestal Modeling using layered transformations ---
    
    // Tier 3 (Lip): Sits just below the containment vessel at Y = -3.0
    var pedestalTier3Model = mat4();
    // Center Y = -3.1. Height 0.2 (scale 0.1). Top edge is at -3.0.
    pedestalTier3Model = mult(pedestalTier3Model, translate(0.0, -3.1, 0.0)); 
    pedestalTier3Model = mult(pedestalTier3Model, scalem(5.5, 0.1, 5.5));
    sendMatrices(pedestalTier3Model);
    drawGeometry(metalTopGeom); 

    // Tier 2 (Riser): Vertical part. Top edge must meet Tier 3 bottom (-3.2).
    var pedestalTier2Model = mat4();
    // Center Y = -3.7. Height 1.0 (scale 0.5). Top edge is at -3.2.
    pedestalTier2Model = mult(pedestalTier2Model, translate(0.0, -3.7, 0.0));
    pedestalTier2Model = mult(pedestalTier2Model, scalem(5.0, 0.5, 5.0));
    sendMatrices(pedestalTier2Model);
    drawGeometry(cylinderGeom); 
    
    // Tier 1 (Base): Bottom flat part. Top edge must meet Tier 2 bottom (-4.2).
    var pedestalTier1Model = mat4();
    // Center Y = -5.2. Height 2.0 (scale 1.0). Top edge is at -4.2.
    pedestalTier1Model = mult(pedestalTier1Model, translate(0.0, -5.2, 0.0)); 
    pedestalTier1Model = mult(pedestalTier1Model, scalem(6.0, 1.0, 6.0));
    sendMatrices(pedestalTier1Model);
    drawGeometry(metalBottomGeom); 
}