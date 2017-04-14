// This class controls how objects are parented and deparented for demonstration purposes
// demoManual - true if the Object3D methods should be used, false if the SceneUtils methods should be used
// updateWorldMatrix - true if the matrix world should be updated before parenting or deparenting objects
function Parenter(demoManual, updateWorldMatrix) {
    this.updateWorldMatrix = updateWorldMatrix;
    
    this.parent;      // This method is used to parent a child to a parent
    this.deparent;    // This method is used to deparent a child from a parent
    
    // Deparent a child from and old parent are parent it to a new parent
    this.switchParent = function(oldParent, newParent, child, scene) {
        this.deparent(oldParent, child, scene);
        this.parent(newParent, child, scene);
    }
    
    // Make sure the world matrices for a child and parent object are updated
    // before attaching or detaching them
    this.updateMatrixWorlds = function(parent, child) {
        if (this.updateWorldMatrix) {
            parent.updateMatrixWorld(true);
            child.updateMatrixWorld(true);
        }
    }
    
    // Parent a child to a parent naively
    this.parentManual = function(parent, child, scene) {
        parent.add(child);
        scene.remove(child);
    }
    
    // Parent a child to a parent using the built-in SceneUtils method
    this.parentAuto = function(parent, child, scene) {
        this.updateMatrixWorlds(parent, child);
        THREE.SceneUtils.attach(child, scene, parent);
    }
    
    // Deparent a child from a parent naively
    this.deparentManual = function(parent, child, scene) {
        parent.remove(child);
        scene.add(child);
    }
    
    // Deparent a child from a parent using the built-in SceneUtils method
    this.deparentAuto = function(parent, child, scene) {
        this.updateMatrixWorlds(parent, child);
        THREE.SceneUtils.detach(child, parent, scene);
    }
    
    // Set which method for parenting a child to a parent should be used
    this.parent = this.parentAuto;
    if (demoManual) {
        this.parent = this.parentManual;
    }
    
    // Set which method for deparenting a child from a parent should be used
    this.deparent = this.deparentAuto;
    if (demoManual) {
        this.deparent = this.deparentManual;
    }
}