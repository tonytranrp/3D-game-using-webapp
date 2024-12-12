class Cube {
    constructor(width, height, depth, x, y, z, color) {
        this.geometry = new THREE.BoxGeometry(width, height, depth);
        this.material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.3,
            envMapIntensity: 1.0,
            dithering: true
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
    }

    updateBoundingBox() {
        if(this.mesh && this.boundingBox) {
            this.boundingBox.setFromObject(this.mesh);
        }
    }
}

function createFloor(scene) {
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    
    for(let x = 0; x < canvas.width; x++) {
        for(let y = 0; y < canvas.height; y++) {
            const r = Math.random() * (139 - 119) + 119;
            const g = Math.random() * (119 - 99) + 99;
            const b = Math.random() * (99 - 79) + 79;
            context.fillStyle = `rgb(${r},${g},${b})`;
            context.fillRect(x, y, 1, 1);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.8,
        metalness: 0.2,
        envMapIntensity: 1.0,
        dithering: true
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
}

function createObstacles(scene, obstacles) {
    for(let i = 0; i < 50; i++) {
        const width = Math.random() * 4 + 1;
        const height = Math.random() * 8 + 2;
        const depth = Math.random() * 4 + 1;
        const x = Math.random() * 200 - 100;
        const z = Math.random() * 200 - 100;
        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        
        const cube = new Cube(width, height, depth, x, height/2, z, color);
        scene.add(cube.mesh);
        obstacles.push(cube);
    }
}

function createSun(scene) {
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(100, 100, 50);
    scene.add(sun);
}

function setupLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(100, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.bias = -0.0001;
    dirLight.shadow.normalBias = 0.02;
    dirLight.shadow.radius = 1.5;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight1.position.set(10, 10, 10);
    pointLight1.castShadow = true;
    pointLight1.shadow.mapSize.width = 1024;
    pointLight1.shadow.mapSize.height = 1024;
    scene.add(pointLight1);
}

function createPlayerModel(scene) {
    const playerModel = new THREE.Group();
    const hands = { left: null, right: null };
    
    const handGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const handMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    
    hands.left = new THREE.Mesh(handGeometry, handMaterial);
    hands.right = new THREE.Mesh(handGeometry, handMaterial);
    
    hands.left.position.set(-0.6, -0.8, -0.3);
    hands.right.position.set(0.6, -0.8, -0.3);
    hands.left.rotation.order = 'YXZ';
    hands.right.rotation.order = 'YXZ';
    
    const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x000080 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    
    const leftLegPivot = new THREE.Group();
    const rightLegPivot = new THREE.Group();
    
    leftLegPivot.position.set(-0.3, -1.6, 0);
    rightLegPivot.position.set(0.3, -1.6, 0);
    
    leftLeg.position.y = -0.4;
    rightLeg.position.y = -0.4;
    
    leftLegPivot.add(leftLeg);
    rightLegPivot.add(rightLeg);
    
    playerModel.add(hands.left, hands.right, leftLegPivot, rightLegPivot);
    playerModel.rotation.order = 'YXZ';
    
    scene.add(playerModel);
    
    playerModel.leftLegPivot = leftLegPivot;
    playerModel.rightLegPivot = rightLegPivot;
    playerModel.hands = hands;
    
    return playerModel;
}

export { 
    Cube,
    createFloor,
    createObstacles,
    createSun,
    setupLights,
    createPlayerModel
};