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

// Global variables
let camera, scene, renderer;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let canJump = true;
let obstacles = [];
let playerCollider;
let showHitbox = false;
let playerModel;
let playerHitboxHelper;
let hands = { left: null, right: null };
let handAnimation = { value: 0 };
let lastTime = performance.now();
let walkCycle = 0;
let isMoving = false;
let lastPlayerRotation = new THREE.Euler();

// Constants
const PLAYER_WIDTH = 0.6;
const PLAYER_HEIGHT = 1.8;
const PLAYER_DEPTH = 0.6;
const MOVEMENT_SPEED = 0.1;

// Define all functions before using them
function setupCollision() {
    // Create player hitbox
    const hitboxGeometry = new THREE.BoxGeometry(PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DEPTH);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        visible: false
    });
    
    const hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    playerHitboxHelper = hitboxMesh;
    
    // Create hitbox edges
    const edges = new THREE.EdgesGeometry(hitboxGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const edgesLines = new THREE.LineSegments(edges, edgesMaterial);
    hitboxMesh.add(edgesLines);
    
    scene.add(hitboxMesh);
    
    playerCollider = new THREE.Box3();
    updatePlayerCollider();
}

function updatePlayerCollider() {
    playerCollider.setFromCenterAndSize(
        camera.position,
        new THREE.Vector3(PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DEPTH)
    );
    
    if (playerHitboxHelper) {
        playerHitboxHelper.position.copy(camera.position);
        playerHitboxHelper.material.visible = showHitbox;
        // Update edges visibility
        playerHitboxHelper.children[0].visible = showHitbox;
    }
}

function setupLights() {
    // Enhanced ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Enhanced directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(100, 100, 50);
    
    // Enhanced shadow settings
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;  // Increased resolution
    dirLight.shadow.mapSize.height = 4096; // Increased resolution
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

    // Add hemisphere light for better ambient lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Add point lights for enhanced lighting
    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 50);
    pointLight1.position.set(10, 10, 10);
    pointLight1.castShadow = true;
    pointLight1.shadow.mapSize.width = 1024;
    pointLight1.shadow.mapSize.height = 1024;
    scene.add(pointLight1);
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(100, 100, 50);
    scene.add(sun);
}

function createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Increased texture resolution
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
function createObstacles() {
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

function createPlayerModel() {
    playerModel = new THREE.Group();
    
    // Create hands with more detailed positioning
    const handGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const handMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    
    hands.left = new THREE.Mesh(handGeometry, handMaterial);
    hands.right = new THREE.Mesh(handGeometry, handMaterial);
    
    // Position hands relative to camera view
    hands.left.position.set(-0.6, -0.8, -0.3);
    hands.right.position.set(0.6, -0.8, -0.3);
    hands.left.rotation.order = 'YXZ';
    hands.right.rotation.order = 'YXZ';
    
    // Create legs with pivot points for animation
    const legGeometry = new THREE.BoxGeometry(0.25, 0.8, 0.25);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x000080 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    
    // Create pivot points for legs
    const leftLegPivot = new THREE.Group();
    const rightLegPivot = new THREE.Group();
    
    leftLegPivot.position.set(-0.3, -1.6, 0);
    rightLegPivot.position.set(0.3, -1.6, 0);
    
    leftLeg.position.y = -0.4; // Half of leg height
    rightLeg.position.y = -0.4;
    
    leftLegPivot.add(leftLeg);
    rightLegPivot.add(rightLeg);
    
    // Add all parts to the player model
    playerModel.add(hands.left, hands.right, leftLegPivot, rightLegPivot);
    playerModel.rotation.order = 'YXZ'; // Match camera rotation order
    
    scene.add(playerModel);
    
    // Store leg pivots for animation
    playerModel.leftLegPivot = leftLegPivot;
    playerModel.rightLegPivot = rightLegPivot;
}

function animateHands() {
    const handTween = new TWEEN.Tween(handAnimation)
        .to({ value: Math.PI * 2 }, 3000)
        .repeat(Infinity)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(() => {
            const angle = Math.sin(handAnimation.value) * 0.1;
            // Add idle hand animation
            if (!isMoving) {
                hands.left.rotation.z += angle;
                hands.right.rotation.z -= angle;
            }
        })
        .start();
}

function setupControls() {
    camera.position.y = 2;
    
    document.addEventListener('click', function() {
        document.body.requestPointerLock();
    });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
}

function onMouseMove(event) {
    if (document.pointerLockElement === document.body) {
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);
        
        euler.y -= event.movementX * 0.002;
        euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x - event.movementY * 0.002));
        
        camera.quaternion.setFromEuler(euler);
    }
}

function onKeyDown(event) {
    switch(event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft': moveUp = true; break;
        case 'Space': moveDown = true; break;
        case 'KeyH': showHitbox = !showHitbox; break;
    }
}

function onKeyUp(event) {
    switch(event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
        case 'ShiftLeft': moveUp = false; break;
        case 'Space': moveDown = false; break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updatePlayerModel() {
    // Update movement state
    isMoving = moveForward || moveBackward || moveLeft || moveRight;
    
    // Update player model position to match camera
    playerModel.position.copy(camera.position);
    
    // Get camera rotation
    const cameraRotation = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    
    // Update player model rotation to match camera horizontal rotation
    playerModel.rotation.y = cameraRotation.y;
    
    // Smooth camera look transition for hands
    const lookDownAmount = cameraRotation.x;
    const handRotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, lookDownAmount));
    
    // Update hands position and rotation
    hands.left.rotation.x = handRotationX;
    hands.right.rotation.x = handRotationX;
    
    // Add slight swing to hands based on camera rotation
    hands.left.rotation.z = Math.sin(cameraRotation.y) * 0.1;
    hands.right.rotation.z = -Math.sin(cameraRotation.y) * 0.1;
    
    // Animate walking cycle
    if (isMoving) {
        walkCycle += 0.15; // Adjust speed of animation
        
        // Animate legs
        playerModel.leftLegPivot.rotation.x = Math.sin(walkCycle) * 0.5;
        playerModel.rightLegPivot.rotation.x = Math.sin(walkCycle + Math.PI) * 0.5;
        
        // Add hand swing during movement
        hands.left.rotation.x += Math.sin(walkCycle + Math.PI) * 0.2;
        hands.right.rotation.x += Math.sin(walkCycle) * 0.2;
    } else {
        // Reset animations when not moving
        playerModel.leftLegPivot.rotation.x *= 0.8;
        playerModel.rightLegPivot.rotation.x *= 0.8;
        walkCycle = 0;
    }
    
    // Store last rotation for smooth transitions
    lastPlayerRotation.copy(cameraRotation);
    
    // Add slight bob effect when walking
    if (isMoving) {
        playerModel.position.y += Math.sin(walkCycle * 2) * 0.05;
    }
}
function checkDetailedCollision(newPosition) {
    const futureBox = playerCollider.clone();
    const currentPosition = camera.position.clone();
    const targetPosition = currentPosition.clone().add(newPosition);
    
    // Update future box position
    futureBox.setFromCenterAndSize(
        targetPosition,
        new THREE.Vector3(PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DEPTH)
    );

    let finalMovement = newPosition.clone();

    for (const obstacle of obstacles) {
        // Get movement correction
        const correctedMovement = MathUtils.resolveCollision(
            currentPosition,
            targetPosition,
            futureBox,
            obstacle.boundingBox
        );

        // Apply the correction that moves us the least
        if (correctedMovement.lengthSq() < finalMovement.lengthSq()) {
            finalMovement.copy(correctedMovement);
        }

        // Update future box for next iteration
        futureBox.setFromCenterAndSize(
            currentPosition.clone().add(finalMovement),
            new THREE.Vector3(PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_DEPTH)
        );
    }

    return finalMovement;
}
function updateMovement() {
    const currentTime = performance.now();
    const delta = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    const speed = MOVEMENT_SPEED * delta * 60;
    const direction = new THREE.Vector3();

    // Update movement direction
    direction.z = Number(moveBackward) - Number(moveForward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.y = Number(moveDown) - Number(moveUp);
    direction.normalize();

    let newPosition = new THREE.Vector3();

    if (moveForward || moveBackward || moveLeft || moveRight) {
        const forward = MathUtils.FORWARD.clone().applyQuaternion(camera.quaternion);
        const right = MathUtils.RIGHT.clone().applyQuaternion(camera.quaternion);
        
        // Keep movement on horizontal plane
        forward.y = 0;
        right.y = 0;
        
        forward.normalize().multiplyScalar(direction.z * speed);
        right.normalize().multiplyScalar(direction.x * speed);
        
        newPosition.add(forward).add(right);
    }

    if (moveUp || moveDown) {
        newPosition.y = direction.y * speed;
    }

    // Check collisions and update position
    newPosition = checkDetailedCollision(newPosition);
    camera.position.add(newPosition);
    
    // Ensure minimum height
    camera.position.y = Math.max(2, camera.position.y);
    
    // Update visuals
    updatePlayerModel();
    updatePlayerCollider();
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    updateMovement();
    
    // Fix the obstacle updating
    for(const obstacle of obstacles) {
        if(obstacle && obstacle.updateBoundingBox) {
            obstacle.updateBoundingBox();
        }
    }
    
    renderer.render(scene, camera);
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    // Enhanced camera settings
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.y = 2;
    
    // Enhanced renderer settings
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance",
        precision: "highp",
        stencil: true,
        depth: true,
        logarithmicDepthBuffer: true
    });
    
    // Set high resolution
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Balance performance and quality
    
    // Enhanced shadow settings
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputEncoding = THREE.sRGBEncoding;
    
    document.body.appendChild(renderer.domElement);

    setupLights();
    createSun();
    createFloor();
    createObstacles();
    setupCollision();
    createPlayerModel();
    setupControls();
    
    window.addEventListener('resize', onWindowResize, false);
}

// Start the game
init();
animate();