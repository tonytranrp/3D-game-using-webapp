export class Car {
    constructor(x, y, z) {
        this.object = new THREE.Group();
        this.createBody();
        this.createWheels();
        this.createRoof();
        this.setupPhysics();
        this.object.position.set(x, y, z);
    }

    createBody() {
        const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0055ff });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.body.position.y = 1;
        this.body.castShadow = true;
        this.object.add(this.body);
    }

    createWheels() {
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        
        this.wheels = [];
        const wheelPositions = [
            [-1.2, 0.4, -1.2], [1.2, 0.4, -1.2],
            [-1.2, 0.4, 1.2], [1.2, 0.4, 1.2]
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(...pos);
            wheel.rotation.z = Math.PI/2;
            wheel.castShadow = true;
            this.wheels.push(wheel);
            this.object.add(wheel);
        });
    }

    createRoof() {
        const roofGeometry = new THREE.BoxGeometry(1.8, 0.8, 2);
        const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x0044cc });
        this.roof = new THREE.Mesh(roofGeometry, roofMaterial);
        this.roof.position.y = 1.9;
        this.roof.castShadow = true;
        this.object.add(this.roof);
    }

    setupPhysics() {
        this.speed = 0;
        this.maxSpeed = 0.2;  // Increased from 0.005
        this.acceleration = 0.01; // Increased
        this.deceleration = 0.005;
        this.turnSpeed = 0.03; // Increased
        this.targetSpeed = 0;
        this.smoothFactor = 0.1;
    }

    update(moveForward, moveBackward, moveLeft, moveRight) {
        if (moveForward) {
            this.targetSpeed = this.maxSpeed;
        } else if (moveBackward) {
            this.targetSpeed = -this.maxSpeed / 2;
        } else {
            this.targetSpeed = 0;
        }

        this.speed += (this.targetSpeed - this.speed) * this.smoothFactor;

        if (Math.abs(this.speed) > 0.001) {
            const forward = new THREE.Vector3(0, 0, -1)
                .applyQuaternion(this.object.quaternion)
                .multiplyScalar(this.speed);
            this.object.position.add(forward);
            
            const wheelSpeed = this.speed * 3;
            this.wheels.forEach(wheel => wheel.rotation.x += wheelSpeed);
        }

        if (moveLeft) this.object.rotation.y += this.turnSpeed;
        if (moveRight) this.object.rotation.y -= this.turnSpeed;
    }
}

