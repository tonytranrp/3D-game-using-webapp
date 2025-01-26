import { Car } from './Car.js';

export class AICar extends Car {
    constructor(x, y, z) {
        super(x, y, z);
        this.pathPoints = this.generatePath();
        this.currentPoint = 0;
        this.speed = 0.1;
    }

    generatePath() {
        const points = 36;
        const radius = 50;
        return Array.from({length: points}, (_, i) => {
            const angle = (i / points) * Math.PI * 2;
            return new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
        });
    }

    update(time, trafficLights) {
        const target = this.pathPoints[this.currentPoint];
        const direction = target.clone().sub(this.object.position).normalize();

        // Check traffic lights
        let shouldStop = false;
        if (trafficLights) {
            trafficLights.forEach(light => {
                const dist = this.object.position.distanceTo(light.object.position);
                if (dist < 10 && (light.state === 'red' || light.state === 'yellow')) {
                    shouldStop = true;
                }
            });
        }

        if (!shouldStop) {
            this.object.position.add(direction.multiplyScalar(this.speed));
            if (this.object.position.distanceTo(target) < 0.5) {
                this.currentPoint = (this.currentPoint + 1) % this.pathPoints.length;
            }
        }

        this.object.lookAt(target);
    }
}