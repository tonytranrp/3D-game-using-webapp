
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
let points = 0;
const POINTS_TO_WIN = 1000;
const POINTS_PER_SECOND_ON_ROAD = 5;
const POINTS_LOSS_OFF_ROAD = -10;
let isOnRoad = false;
let gameStatus = 'playing'; // 'playing', 'won', 'failed'
let lastPointUpdate = 0;
let mapOpen = false;
let currentDestination = null;
let trafficLights = [];
let navigationArrows = [];
let parkingSpots = [];
class Road {
    constructor() {
        this.object = new THREE.Group();
        this.createMainRoad();
        this.createIntersections();
    }

    createMainRoad() {
        // Create circular road
        const roadRadius = 50;
        const roadWidth = 10;
        const segments = 64;

        const roadGeometry = new THREE.RingGeometry(roadRadius - roadWidth/2, roadRadius + roadWidth/2, segments);
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });

        this.mainRoad = new THREE.Mesh(roadGeometry, roadMaterial);
        this.mainRoad.rotation.x = -Math.PI / 2;
        this.mainRoad.position.y = 0.01;

        // Add lane markings
        const innerLine = new THREE.RingGeometry(roadRadius - 0.15, roadRadius + 0.15, segments);
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.5
        });
        this.centerLine = new THREE.Mesh(innerLine, lineMaterial);
        this.centerLine.rotation.x = -Math.PI / 2;
        this.centerLine.position.y = 0.02;

        this.object.add(this.mainRoad);
        this.object.add(this.centerLine);
    }

    createIntersections() {
        // Add four intersections at cardinal points
        const intersectionPoints = [
            {x: 50, z: 0},
            {x: -50, z: 0},
            {x: 0, z: 50},
            {x: 0, z: -50}
        ];

        intersectionPoints.forEach(point => {
            const intersection = this.createIntersection();
            intersection.position.set(point.x, 0, point.z);
            this.object.add(intersection);
        });
    }

    createIntersection() {
        const group = new THREE.Group();
        const size = 15;

        const roadGeometry = new THREE.PlaneGeometry(size, size);
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });

        const intersection = new THREE.Mesh(roadGeometry, roadMaterial);
        intersection.rotation.x = -Math.PI / 2;
        intersection.position.y = 0.01;

        group.add(intersection);
        return group;
    }

    isPointOnRoad(point) {
        const distance = Math.sqrt(point.x * point.x + point.z * point.z);
        return Math.abs(distance - 50) < 5;
    }
}
// Enhance Car class
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
        
        // Car properties
        this.speed = 0;
        this.maxSpeed = 0.005; // Reduced max speed
        this.acceleration = 0.005; // Reduced acceleration
        this.deceleration = 0.003; // Reduced deceleration
        this.turnSpeed = 0.002; // Reduced turn speed
        this.targetSpeed = 0;
        this.smoothFactor = 0.1;
    }

    update() {
        if (!isDriving) return;

        // Update target speed based on input
        if (moveForward) {
            this.targetSpeed = this.maxSpeed;
        } else if (moveBackward) {
            this.targetSpeed = -this.maxSpeed / 2;
        } else {
            this.targetSpeed = 0;
        }

        // Smoothly interpolate current speed
        this.speed += (this.targetSpeed - this.speed) * this.smoothFactor;

        // Apply movement if speed isn't negligible
        if (Math.abs(this.speed) > 0.001) {
            const forward = new THREE.Vector3(0, 0, -1)
                .applyQuaternion(this.object.quaternion)
                .multiplyScalar(this.speed);

            const nextPosition = this.object.position.clone().add(forward);

            // Only check collisions with nearby obstacles
            const nearbyObstacles = obstacles.filter(obstacle => 
                obstacle.mesh.position.distanceTo(this.object.position) < 20
            );

            if (!CollisionSystem.getCollisionResponse(this.object, nearbyObstacles)) {
                this.object.position.copy(nextPosition);
                
                // Update wheel rotation
                const wheelSpeed = this.speed * 3;
                this.wheels.forEach(wheel => wheel.rotation.x += wheelSpeed);
            }
        }

        // Smooth turning
        if (moveLeft) this.object.rotation.y += this.turnSpeed;
        if (moveRight) this.object.rotation.y -= this.turnSpeed;
    }
}
class AICar extends Car {
    constructor(x, y, z) {
        super(x, y, z);
        this.pathPoints = [];
        this.currentPoint = 0;
        this.generatePath();
    }

    generatePath() {
        // Generate circular path points
        const points = 36;
        const radius = 50;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            this.pathPoints.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ));
        }
    }

    update(time) {
        const target = this.pathPoints[this.currentPoint];
        const direction = target.clone().sub(this.object.position).normalize();
        this.object.position.add(direction.multiplyScalar(0.1));
        
        if (this.object.position.distanceTo(target) < 0.5) {
            this.currentPoint = (this.currentPoint + 1) % this.pathPoints.length;
        }

        this.object.lookAt(target);
    }
}
const CAR_PHYSICS = {
    maxSpeed: 0.15,
    acceleration: 0.005,
    deceleration: 0.003,
    turnSpeed: 0.02
};

class TrafficLight {
    constructor(x, y, z) {
        this.object = new THREE.Group();
        
        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({color: 0x333333});
        this.pole = new THREE.Mesh(poleGeometry, poleMaterial);
        
        // Light housing
        const housingGeometry = new THREE.BoxGeometry(1, 2.5, 1);
        const housingMaterial = new THREE.MeshStandardMaterial({color: 0x222222});
        this.housing = new THREE.Mesh(housingGeometry, housingMaterial);
        this.housing.position.y = 4;
        
        // Lights
        const lightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        this.redLight = new THREE.Mesh(
            lightGeometry,
            new THREE.MeshStandardMaterial({
                emissive: 0x660000,
                emissiveIntensity: 0.5
            })
        );
        this.yellowLight = new THREE.Mesh(
            lightGeometry,
            new THREE.MeshStandardMaterial({
                emissive: 0x666600,
                emissiveIntensity: 0.5
            })
        );
        this.greenLight = new THREE.Mesh(
            lightGeometry,
            new THREE.MeshStandardMaterial({
                emissive: 0x006600,
                emissiveIntensity: 0.5
            })
        );
        
        this.redLight.position.set(0, 4.8, 0);
        this.yellowLight.position.set(0, 4, 0);
        this.greenLight.position.set(0, 3.2, 0);
        
        this.object.add(this.pole);
        this.object.add(this.housing);
        this.object.add(this.redLight);
        this.object.add(this.yellowLight);
        this.object.add(this.greenLight);
        
        this.object.position.set(x, y, z);
        this.state = 'red';
        this.lastStateChange = 0;
        this.updateLights();
 
        // Traffic violation detection
        this.violationBox = new THREE.Box3();
        this.violationActive = false;
        this.updateViolationBox();
    }
 
    updateViolationBox() {
        const boxSize = new THREE.Vector3(10, 5, 10);
        this.violationBox.setFromCenterAndSize(
            this.object.position,
            boxSize
        );
    }
 
    updateLights() {
        this.redLight.material.emissiveIntensity = this.state === 'red' ? 1 : 0.1;
        this.yellowLight.material.emissiveIntensity = this.state === 'yellow' ? 1 : 0.1;
        this.greenLight.material.emissiveIntensity = this.state === 'green' ? 1 : 0.1;
    }
 
    checkViolation(car) {
        if ((this.state === 'red' || this.state === 'yellow') && 
            this.violationBox.containsPoint(car.object.position) &&
            !this.violationActive) {
            this.violationActive = true;
            showTrafficViolation();
            points -= 50; // Penalty for running red light
            return true;
        }
        if (!this.violationBox.containsPoint(car.object.position)) {
            this.violationActive = false;
        }
        return false;
    }
    
    update(time) {
        if (time - this.lastStateChange > 5000) {
            switch(this.state) {
                case 'red':
                    this.state = 'green';
                    break;
                case 'green':
                    this.state = 'yellow';
                    break;
                case 'yellow':
                    this.state = 'red';
                    break;
            }
            this.lastStateChange = time;
            this.updateLights();
        }
    }
 }

class NavigationArrow {
    constructor() {
        this.object = new THREE.Group();
        
        // Create floating arrow
        const arrowShape = new THREE.Shape();
        arrowShape.moveTo(0, 2);
        arrowShape.lineTo(1, 0);
        arrowShape.lineTo(0.3, 0);
        arrowShape.lineTo(0.3, -1);
        arrowShape.lineTo(-0.3, -1);
        arrowShape.lineTo(-0.3, 0);
        arrowShape.lineTo(-1, 0);
        arrowShape.lineTo(0, 2);

        const geometry = new THREE.ShapeGeometry(arrowShape);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        this.arrow = new THREE.Mesh(geometry, material);
        this.arrow.rotation.x = -Math.PI / 2;
        
        // Add floating animation
        this.baseY = 3;
        this.floatAmplitude = 0.5;
        this.floatSpeed = 2;
        
        this.object.add(this.arrow);
        this.object.position.y = this.baseY;
    }

    update(time) {
        // Floating animation
        this.object.position.y = this.baseY + 
            Math.sin(time * 0.001 * this.floatSpeed) * this.floatAmplitude;
        
        // Scale animation
        const scale = 1 + Math.sin(time * 0.002) * 0.1;
        this.arrow.scale.set(scale, scale, scale);
    }

    pointTo(targetPos) {
        const direction = new THREE.Vector3();
        direction.subVectors(targetPos, car.object.position);
        direction.y = 0;
        
        const angle = Math.atan2(direction.x, direction.z);
        this.object.rotation.y = angle;
        
        // Position above car
        this.object.position.x = car.object.position.x;
        this.object.position.z = car.object.position.z;
    }
}

class ParkingSpot {
    constructor(x, z, rotation = 0) {
        this.position = new THREE.Vector3(x, 0, z);
        
        // Create parking spot markings
        const geometry = new THREE.PlaneGeometry(3, 6);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.set(x, 0.01, z);
        this.mesh.rotation.y = rotation;
    }
}
class CollisionSystem {
    static check(object1, object2) {
        const box1 = new THREE.Box3().setFromObject(object1);
        const box2 = new THREE.Box3().setFromObject(object2);
        return box1.intersectsBox(box2);
    }

    static getCollisionResponse(object, obstacles) {
        const objectBox = new THREE.Box3().setFromObject(object);
        for (const obstacle of obstacles) {
            const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh || obstacle);
            if (objectBox.intersectsBox(obstacleBox)) {
                return true;
            }
        }
        return false;
    }
}
function createTrafficLights() {
    const intersectionPoints = [
        {x: 50, z: 0, rot: 0},
        {x: -50, z: 0, rot: Math.PI},
        {x: 0, z: 50, rot: -Math.PI/2},
        {x: 0, z: -50, rot: Math.PI/2}
    ];

    intersectionPoints.forEach(point => {
        const light = new TrafficLight(point.x, 0, point.z);
        light.object.rotation.y = point.rot;
        scene.add(light.object);
        trafficLights.push(light);
    });
}
function createMap() {
    const map = document.createElement('div');
    map.id = 'map';
    map.style.cssText = `
        position: fixed;
        width: 200px;
        height: 200px;
        right: 20px;
        bottom: 20px;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid white;
        overflow: hidden;
        display: none;
    `;

    const minimapRenderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    minimapRenderer.setSize(200, 200);
    map.appendChild(minimapRenderer.domElement);

    const minimapCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 1000);
    minimapCamera.position.set(0, 200, 0);
    minimapCamera.lookAt(0, 0, 0);

    document.body.appendChild(map);

    return {
        element: map,
        renderer: minimapRenderer,
        camera: minimapCamera,
        update: function() {
            if (mapOpen) {
                minimapRenderer.render(scene, minimapCamera);
            }
        }
    };
}
function showTrafficViolation() {
    const violation = document.createElement('div');
    violation.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 1000;
    `;
    violation.innerHTML = 'Traffic Violation! Running a red light.';
    document.body.appendChild(violation);
    setTimeout(() => violation.remove(), 3000);
}
function selectDestination(position) {
    currentDestination = position;
    toggleMap();
    
    // Show navigation arrow
    if (!navigationArrows.length) {
        const arrow = new NavigationArrow();
        scene.add(arrow.mesh);
        navigationArrows.push(arrow);
    }
}

function toggleMap() {
    mapOpen = !mapOpen;
    gameMap.element.style.display = mapOpen ? 'block' : 'none';
    if (mapOpen) {
        gameMap.update();
    }
}
// Enhanced game state management
function updateGameState() {
    if (gameStatus !== 'playing') return;

    const currentTime = performance.now();
    if (currentTime - lastPointUpdate > 1000) { // Update points every second
        lastPointUpdate = currentTime;
        
        if (isDriving) {
            isOnRoad = road.isPointOnRoad(car.object.position);
            points += isOnRoad ? POINTS_PER_SECOND_ON_ROAD : POINTS_LOSS_OFF_ROAD;
            
            // Check win/lose conditions
            if (points >= POINTS_TO_WIN) {
                gameStatus = 'won';
                showGameEndScreen('Congratulations! You got your license!');
            } else if (points < -500) {
                gameStatus = 'failed';
                showGameEndScreen('Failed! Too many penalties!');
            }
            
            updatePointsDisplay();
        }
    }
}

function showGameEndScreen(message) {
    const endScreen = document.createElement('div');
    endScreen.style.position = 'fixed';
    endScreen.style.top = '50%';
    endScreen.style.left = '50%';
    endScreen.style.transform = 'translate(-50%, -50%)';
    endScreen.style.background = 'rgba(0, 0, 0, 0.8)';
    endScreen.style.color = 'white';
    endScreen.style.padding = '20px';
    endScreen.style.borderRadius = '10px';
    endScreen.style.textAlign = 'center';
    endScreen.innerHTML = `
        <h2>${message}</h2>
        <p>Final Score: ${points}</p>
        <button onclick="location.reload()">Try Again</button>
    `;
    document.body.appendChild(endScreen);
}

function updatePointsDisplay() {
    if (!pointsDisplay) {
        pointsDisplay = document.createElement('div');
        pointsDisplay.style.position = 'fixed';
        pointsDisplay.style.top = '20px';
        pointsDisplay.style.right = '20px';
        pointsDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
        pointsDisplay.style.color = 'white';
        pointsDisplay.style.padding = '10px';
        pointsDisplay.style.borderRadius = '5px';
        document.body.appendChild(pointsDisplay);
    }
    pointsDisplay.innerHTML = `Points: ${points}/${POINTS_TO_WIN}<br>Status: ${isOnRoad ? 'On Road' : 'Off Road'}`;
}

let road;
let pointsDisplay;
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
    const textureLoader = new THREE.TextureLoader();
    
    // Load the grass texture - update path to your texture
    const grassTexture = textureLoader.load('models/grass2k.jpg');
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(50, 50); // Adjust based on your texture size
    
    const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: grassTexture,
        roughness: 1.0,
        metalness: 0.0
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
        case 'KeyM':
        if (!event.repeat) toggleMap();
        break;
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
let gameMap;
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
        const time = performance.now();
        
        updatePlayerMovement();
        if (car) car.update();
        updateGameState();
        
        trafficLights.forEach(light => light.update(time));
        
        if (currentDestination && navigationArrows.length > 0) {
            navigationArrows[0].pointTo(currentDestination);
        }
        
        renderer.render(scene, camera);
        if (mapOpen) {
            gameMap.update();
        }
    }
}
function createBuildings() {
    const buildingPositions = [
        {x: -80, z: -80}, {x: 80, z: -80},
        {x: -80, z: 80}, {x: 80, z: 80}
    ];

    buildingPositions.forEach(pos => {
        const height = Math.random() * 30 + 20;
        const building = new Cube(15, height, 15, pos.x, height/2, pos.z, 0x808080);
        scene.add(building.mesh);
        obstacles.push(building);
    });
}
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 2, 10);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Create game elements
    interactionPrompt = createInteractionPrompt();
    setupLights();
    createSun();
    createFloor();
    
    // Create road first
    road = new Road();
    scene.add(road.object);
    
    // Create traffic lights at intersections
    const intersectionPoints = [
        {x: 50, z: 0, rot: 0},
        {x: -50, z: 0, rot: Math.PI},
        {x: 0, z: 50, rot: -Math.PI/2},
        {x: 0, z: -50, rot: Math.PI/2}
    ];

    intersectionPoints.forEach(point => {
        const light = new TrafficLight(point.x, 0, point.z);
        light.object.rotation.y = point.rot;
        scene.add(light.object);
        trafficLights.push(light);
    });
    createBuildings();
    // Create parking spots
    const parkingLocations = [
        {x: 60, z: 60, rotation: Math.PI/4},
        {x: -60, z: 60, rotation: -Math.PI/4},
        {x: 60, z: -60, rotation: -Math.PI/4},
        {x: -60, z: -60, rotation: Math.PI/4}
    ];
    
    parkingLocations.forEach(loc => {
        const spot = new ParkingSpot(loc.x, loc.z, loc.rotation);
        scene.add(spot.mesh);
        parkingSpots.push(spot);
    });
    
    // Create obstacles away from roads
    createObstacles();
    const aiCars = [];
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = 45;
        const aiCar = new AICar(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        );
        scene.add(aiCar.object);
        aiCars.push(aiCar);
    }
    
    // Create car last
    car = new Car(0, 0, 90);
    car.object.rotation.y = Math.PI;
    scene.add(car.object);
    
    // Initialize map
    const minimapCamera = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, 1000);
    minimapCamera.position.y = 200;
    minimapCamera.lookAt(0, 0, 0);
    
    const minimapRenderer = new THREE.WebGLRenderer({ antialias: true });
    minimapRenderer.setSize(200, 200);
    
    gameMap = createMap();
    
    // Setup controls and game state
    setupControls();
    lastPointUpdate = performance.now();
    
    // Start animation loop
    animate();
}

init();
animate();