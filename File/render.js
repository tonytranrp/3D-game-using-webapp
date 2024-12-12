function setupRenderer() {
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance",
        precision: "highp",
        stencil: true,
        depth: true,
        logarithmicDepthBuffer: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    return renderer;
}

function updatePlayerModel(playerModel, camera, isMoving, walkCycle) {
    const cameraRotation = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    
    playerModel.position.copy(camera.position);
    playerModel.rotation.y = cameraRotation.y;
    
    const lookDownAmount = cameraRotation.x;
    const handRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, lookDownAmount));
    
    playerModel.hands.left.rotation.x = handRotationX;
    playerModel.hands.right.rotation.x = handRotationX;
    
    playerModel.hands.left.rotation.z = Math.sin(cameraRotation.y) * 0.1;
    playerModel.hands.right.rotation.z = -Math.sin(cameraRotation.y) * 0.1;
    
    if (isMoving) {
        playerModel.leftLegPivot.rotation.x = Math.sin(walkCycle) * 0.5;
        playerModel.rightLegPivot.rotation.x = Math.sin(walkCycle + Math.PI) * 0.5;
        playerModel.hands.left.rotation.x += Math.sin(walkCycle + Math.PI) * 0.2;
        playerModel.hands.right.rotation.x += Math.sin(walkCycle) * 0.2;
        playerModel.position.y += Math.sin(walkCycle * 2) * 0.05;
    } else {
        playerModel.leftLegPivot.rotation.x *= 0.8;
        playerModel.rightLegPivot.rotation.x *= 0.8;
    }
}

function updateCollider(playerCollider, hitboxHelper, camera, showHitbox, dimensions) {
    playerCollider.setFromCenterAndSize(
        camera.position,
        dimensions
    );
    
    if (hitboxHelper) {
        hitboxHelper.position.copy(camera.position);
        hitboxHelper.material.visible = showHitbox;
        hitboxHelper.children[0].visible = showHitbox;
    }
}

export {
    setupRenderer,
    updatePlayerModel,
    updateCollider
};