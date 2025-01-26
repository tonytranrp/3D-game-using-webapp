export class TrafficLight {
    constructor(x, y, z) {
        this.object = new THREE.Group();
        this.state = 'red';
        this.lastChange = 0;
        this.changeInterval = 5000; // 5 seconds per state
        
        // Create post
        const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 5, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        post.position.y = 2.5;
        
        // Create lights housing
        const housing = new THREE.Mesh(
            new THREE.BoxGeometry(1, 2.5, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        housing.position.y = 5;
        
        // Create lights
        this.lights = {
            red: this.createLight(0xff0000, 0, 5.8),
            yellow: this.createLight(0xffff00, 0, 5),
            green: this.createLight(0x00ff00, 0, 4.2)
        };
        
        this.object.add(post, housing);
        Object.values(this.lights).forEach(light => this.object.add(light));
        this.object.position.set(x, y, z);
    }

    createLight(color, x, y) {
        return new THREE.Mesh(
            new THREE.SphereGeometry(0.3),
            new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.5
            })
        );
    }

    update(time) {
        if (time - this.lastChange > this.changeInterval) {
            this.state = this.state === 'red' ? 'green' : 
                        this.state === 'green' ? 'yellow' : 'red';
            this.lastChange = time;
            
            this.lights.red.material.emissiveIntensity = this.state === 'red' ? 1 : 0.1;
            this.lights.yellow.material.emissiveIntensity = this.state === 'yellow' ? 1 : 0.1;
            this.lights.green.material.emissiveIntensity = this.state === 'green' ? 1 : 0.1;
        }
    }
}