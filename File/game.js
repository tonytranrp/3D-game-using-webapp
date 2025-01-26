import { Car } from './entities/Car.js';
import { AICar } from './entities/AICar.js';
import { Road } from './world/Road.js';
import { CollisionSystem } from './utils/CollisionSystem.js';
import { MathUtils } from './utils/MathUtils.js';
import { GameMenu } from './ui/GameMenu.js';

export class Game {
    constructor() {
        this.initializeVariables();
        this.setupScene();
        this.setupControls();
        this.createGameElements();
        this.startGameLoop();
        this.createInteractionPrompt();
        // Add initial camera setup
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 0, 0);
    }
    createInteractionPrompt() {
        this.prompt = document.createElement('div');
        this.prompt.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            display: none;
            font-family: Arial, sans-serif;
        `;
        this.prompt.textContent = 'Press E to enter vehicle';
        document.body.appendChild(this.prompt);
    }
    initializeVariables() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isGamePaused = false;
        this.isDriving = false;
        this.lastTime = performance.now();
        
        this.points = 0;
        this.POINTS_TO_WIN = 1000;
        this.POINTS_PER_SECOND_ON_ROAD = 5;
        this.POINTS_LOSS_OFF_ROAD = -10;
        this.lastPointUpdate = performance.now();
        this.gameStatus = 'playing';
        this.playerHeight = 2;
        this.velocity = new THREE.Vector3();
        this.gravity = -9.8;
        this.isOnGround = false;
        this.debugMenuVisible = false;
    }

    setupScene() {
        this.scene.background = new THREE.Color(0x87CEEB);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        this.camera.position.set(0, 2, 10);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(100, 100, 50);
        dirLight.castShadow = true;
        
        this.scene.add(ambientLight);
        this.scene.add(dirLight);
    }

    createGameElements() {
        // Create road
        this.road = new Road();
        this.scene.add(this.road.object);

        // Create player car
        this.playerCar = new Car(0, 0, 90);
        this.scene.add(this.playerCar.object);

        // Create AI cars
        this.aiCars = [];
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const radius = 45;
            const aiCar = new AICar(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            this.scene.add(aiCar.object);
            this.aiCars.push(aiCar);
        }

        // Create ground
        const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1a472a,
            roughness: 0.8 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.ground = ground; // Store reference to ground
        this.gameMenu = new GameMenu();
    }

    setupControls() {
        document.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                document.body.requestPointerLock();
            }
        });
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('resize', () => this.handleResize());
    }

    handleKeyDown(event) {
        if (event.repeat) return;
        
        switch(event.code) {
            case 'Space': if (this.isOnGround) {this.velocity.y = 0.3; this.isOnGround = false;}break;
            case 'Tab': event.preventDefault(); this.toggleDebugMenu(); break;
            case 'KeyW': this.moveForward = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'KeyE': this.toggleDriving(); break;
            case 'Escape': this.togglePause(); break;
        }
    }
    toggleDebugMenu() {
        this.debugMenuVisible = !this.debugMenuVisible;
        if (!this.debugMenu) {
            this.createDebugMenu();
        }
        this.debugMenu.style.display = this.debugMenuVisible ? 'block' : 'none';
    }
    
    createDebugMenu() {
        this.debugMenu = document.createElement('div');
        this.debugMenu.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            padding: 20px;
            color: white;
            border-radius: 5px;
        `;
        this.debugMenu.innerHTML = `
            <h3>Debug Menu</h3>
            <div>
                <label>Road Color:</label>
                <input type="color" id="roadColor" value="#333333">
            </div>
        `;
        document.body.appendChild(this.debugMenu);
        
        document.getElementById('roadColor').addEventListener('input', (e) => {
            this.road.setRoadColor(new THREE.Color(e.target.value));
        });
    }
    handleKeyUp(event) {
        switch(event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyD': this.moveRight = false; break;
        }
    }

    handleMouseMove(event) {
        if (document.pointerLockElement === document.body && !this.isDriving) {
            const sensitivity = 0.002;
            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.setFromQuaternion(this.camera.quaternion);
            
            euler.y -= event.movementX * sensitivity;
            euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x - event.movementY * sensitivity));
            
            this.camera.quaternion.setFromEuler(euler);
        }
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    toggleDriving() {
        this.isDriving = !this.isDriving;
        
        if (this.isDriving) {
            const cameraOffset = new THREE.Vector3(0, 4, 12);
            cameraOffset.applyQuaternion(this.playerCar.object.quaternion);
            this.camera.position.copy(this.playerCar.object.position).add(cameraOffset);
            this.camera.lookAt(this.playerCar.object.position);
        } else {
            const exitOffset = new THREE.Vector3(2, 2, 0);
            exitOffset.applyQuaternion(this.playerCar.object.quaternion);
            this.camera.position.copy(this.playerCar.object.position).add(exitOffset);
        }
    }

    togglePause() {
        this.isGamePaused = !this.isGamePaused;
        this.gameMenu.toggleMenu();
    }

    updateGameState() {
        if (this.gameStatus !== 'playing') return;

        const currentTime = performance.now();
        if (currentTime - this.lastPointUpdate > 1000) {
            this.lastPointUpdate = currentTime;
            
            if (this.isDriving) {
                const isOnRoad = this.road.isPointOnRoad(this.playerCar.object.position);
                this.points += isOnRoad ? this.POINTS_PER_SECOND_ON_ROAD : this.POINTS_LOSS_OFF_ROAD;
                
                if (this.points >= this.POINTS_TO_WIN) {
                    this.gameStatus = 'won';
                    this.showGameEndScreen('Congratulations! You won!');
                } else if (this.points < -500) {
                    this.gameStatus = 'failed';
                    this.showGameEndScreen('Game Over! Too many penalties!');
                }
            }
        }
    }

    showGameEndScreen(message) {
        const endScreen = document.createElement('div');
        endScreen.style.position = 'fixed';
        endScreen.style.top = '50%';
        endScreen.style.left = '50%';
        endScreen.style.transform = 'translate(-50%, -50%)';
        endScreen.style.background = 'rgba(0, 0, 0, 0.8)';
        endScreen.style.color = 'white';
        endScreen.style.padding = '20px';
        endScreen.style.textAlign = 'center';
        endScreen.innerHTML = `
            <h2>${message}</h2>
            <p>Final Score: ${this.points}</p>
            <button onclick="location.reload()">Play Again</button>
        `;
        document.body.appendChild(endScreen);
    }
    updatePlayerMovement() {
        if (this.isDriving) return;
    
        const speed = 0.1;
        const direction = new THREE.Vector3();
    
        // Get forward and right vectors relative to camera
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    
        // Zero out Y components to keep movement horizontal
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();
    
        if (this.moveForward) direction.add(forward);
        if (this.moveBackward) direction.sub(forward);
        if (this.moveRight) direction.add(right);
        if (this.moveLeft) direction.sub(right);
    
        direction.normalize().multiplyScalar(speed);
    
        // Apply gravity
        if (!this.isOnGround) {
            this.velocity.y += this.gravity * 0.016;
        }
        
        // Ground check
        const raycaster = new THREE.Raycaster(
            this.camera.position,
            new THREE.Vector3(0, -1, 0)
        );
        const intersects = raycaster.intersectObjects([this.ground]);
        
        if (intersects.length > 0 && intersects[0].distance < this.playerHeight) {
            this.isOnGround = true;
            this.velocity.y = 0;
            this.camera.position.y = this.playerHeight;
        } else {
            this.isOnGround = false;
        }
    
        this.camera.position.add(direction);
        this.camera.position.add(this.velocity);
    }
    update() {
        if (this.isGamePaused) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update player car
        if (this.isDriving) {
            this.playerCar.update(
                this.moveForward,
                this.moveBackward,
                this.moveLeft,
                this.moveRight
            );

            // Update camera to follow car
            const cameraOffset = new THREE.Vector3(0, 4, 12);
            cameraOffset.applyQuaternion(this.playerCar.object.quaternion);
            this.camera.position.copy(this.playerCar.object.position).add(cameraOffset);
            this.camera.lookAt(this.playerCar.object.position);
        } else {
            this.updatePlayerMovement(); // Add this line
        }

        // Update AI cars
        this.aiCars.forEach(aiCar => aiCar.update(currentTime));

        // Check collisions
        const hasCollision = CollisionSystem.getCollisionResponse(
            this.playerCar.object,
            this.aiCars.map(car => car.object)
        );

        if (hasCollision) {
            this.points -= 20;
        }

        this.updateGameState();
    }

    startGameLoop() {
        const animate = () => {
            requestAnimationFrame(animate);
            this.update();
            this.renderer.render(this.scene, this.camera);
        };
        animate();
    }
}
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});