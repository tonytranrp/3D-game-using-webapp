// Car class definition
class Car {
    constructor(x, y, z) {
        this.object = new THREE.Group();
        
        // Car body
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0055ff });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 1;
        this.body.castShadow = true;
        this.object.add(this.body);

        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        this.wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelFL.position.set(-1.2, 0.4, -1.2);
        this.wheelFR.position.set(1.2, 0.4, -1.2);
        this.wheelFL.rotation.z = Math.PI/2;
        this.wheelFR.rotation.z = Math.PI/2;
        
        this.wheelBL = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelBR = new THREE.Mesh(wheelGeometry, wheelMaterial);
        this.wheelBL.position.set(-1.2, 0.4, 1.2);
        this.wheelBR.position.set(1.2, 0.4, 1.2);
        this.wheelBL.rotation.z = Math.PI/2;
        this.wheelBR.rotation.z = Math.PI/2;

        this.wheels = [this.wheelFL, this.wheelFR, this.wheelBL, this.wheelBR];
        this.wheels.forEach(wheel => {
            wheel.castShadow = true;
            this.object.add(wheel);
        });

        // Roof
        const roofGeometry = new THREE.BoxGeometry(1.8, 0.8, 2);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x0044cc });
        this.roof = new THREE.Mesh(roofGeometry, roofMaterial);
        this.roof.position.y = 1.9;
        this.roof.castShadow = true;
        this.object.add(this.roof);

        // Position the entire car
        this.object.position.set(x, y, z);
    }

    update() {
        if (isDriving) {
            if (moveForward) {
                this.wheels.forEach(wheel => wheel.rotation.x += 0.2);
            } else if (moveBackward) {
                this.wheels.forEach(wheel => wheel.rotation.x -= 0.2);
            }
        }
    }
}

// Cube class for obstacles
class Cube {
    constructor(width, height, depth, x, y, z, color) {
        this.geometry = new THREE.BoxGeometry(width, height, depth);
        this.material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.3,
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
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
let isMoving = false;
let isDriving = false;
let car;
let gameMenu;
let isGamePaused = false;
let obstacles = [];
let lastTime = performance.now();

// Constants
const MOVEMENT_SPEED = 0.1;
let isNearCar = false;
let carInteractionDistance = 4;

// Add this function
function createInteractionPrompt() {
    const prompt = document.createElement('div');
    prompt.id = 'interaction-prompt';
    prompt.innerHTML = 'Press E to enter vehicle';
    prompt.style.display = 'none';
    document.body.appendChild(prompt);
    return prompt;
}
// Helper functions
function createCar() {
    car = new Car(10, 0, 10);
    car.object.rotation.y = Math.PI;
    scene.add(car.object);
}

function updateCarMovement() {
    const speed = MOVEMENT_SPEED * 4;
    const rotation = 0.03;
    
    if (moveForward) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(car.object.quaternion);
        car.object.position.addScaledVector(forward, speed);
    }
    if (moveBackward) {
        const backward = new THREE.Vector3(0, 0, 1).applyQuaternion(car.object.quaternion);
        car.object.position.addScaledVector(backward, speed);
    }
    if (moveLeft) car.object.rotation.y += rotation;
    if (moveRight) car.object.rotation.y -= rotation;

    const cameraOffset = new THREE.Vector3(0, 3, 8);
    cameraOffset.applyQuaternion(car.object.quaternion);
    camera.position.copy(car.object.position).add(cameraOffset);
    camera.lookAt(car.object.position);
}

function updatePlayerMovement() {
    const currentTime = performance.now();
    const delta = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (isDriving) {
        updateCarMovement();
        return;
    }

    // Check distance to car
    const distanceToCar = camera.position.distanceTo(car.object.position);
    if (distanceToCar < carInteractionDistance && !isNearCar) {
        isNearCar = true;
        interactionPrompt.style.display = 'block';
    } else if (distanceToCar >= carInteractionDistance && isNearCar) {
        isNearCar = false;
        interactionPrompt.style.display = 'none';
    }

    const speed = MOVEMENT_SPEED * delta * 60;
    const direction = new THREE.Vector3();

    direction.z = Number(moveBackward) - Number(moveForward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.y = Number(moveDown) - Number(moveUp);
    direction.normalize();

    if (moveForward || moveBackward || moveLeft || moveRight) {
        const forward = new THREE.Vector3(0, 0, 1);
        const right = new THREE.Vector3(1, 0, 0);
        forward.applyQuaternion(camera.quaternion);
        right.applyQuaternion(camera.quaternion);
        
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();
        
        forward.multiplyScalar(direction.z * speed);
        right.multiplyScalar(direction.x * speed);
        
        camera.position.add(forward);
        camera.position.add(right);
    }

    if (moveUp || moveDown) {
        camera.position.y += direction.y * speed;
    }
}

function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(100, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(100, 100, 50);
    scene.add(sun);
}

function createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
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

function onKeyDown(event) {
    if (event.repeat) return;
    switch(event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
        case 'ShiftLeft': moveUp = true; break;
        case 'Space': moveDown = true; break;
        case 'KeyE': isDriving = !isDriving; break;
        case 'Escape': 
            if (!event.repeat) {
                isGamePaused = !isGamePaused;
                if (isGamePaused) document.exitPointerLock();
                else document.body.requestPointerLock();
            }
            break;
        case 'KeyE': 
            if (isNearCar && !isDriving) {
                isDriving = true;
                isNearCar = false;
                interactionPrompt.style.display = 'none';
                // Position camera behind and above car
                const cameraOffset = new THREE.Vector3(0, 4, 12);
                cameraOffset.applyQuaternion(car.object.quaternion);
                camera.position.copy(car.object.position).add(cameraOffset);
                camera.lookAt(car.object.position);
            } else if (isDriving) {
                isDriving = false;
                // Exit car position
                const exitOffset = new THREE.Vector3(2, 0, 0);
                exitOffset.applyQuaternion(car.object.quaternion);
                camera.position.copy(car.object.position).add(exitOffset);
                camera.position.y = 2;
            }
            break;
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

function onMouseMove(event) {
    if (document.pointerLockElement === document.body && !isDriving) {
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);
        
        euler.y -= event.movementX * 0.002;
        euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x - event.movementY * 0.002));
        
        camera.quaternion.setFromEuler(euler);
    }
}

function setupControls() {
    document.addEventListener('click', () => document.body.requestPointerLock());
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (!isGamePaused) {
        updatePlayerMovement();
        if (car) car.update();
        renderer.render(scene, camera);
    }
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.y = 2;
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    interactionPrompt = createInteractionPrompt();
    setupLights();
    createSun();
    createFloor();
    createObstacles();
    createCar();
    setupControls();
}

init();
animate();