// Road system
class Road {
    constructor() {
        this.width = 10;
        this.length = 200;
        const roadGeometry = new THREE.PlaneGeometry(this.width, this.length);
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
        });
        this.mesh = new THREE.Mesh(roadGeometry, roadMaterial);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = 0.01; // Slightly above ground
        
        // Add lane markings
        this.addLaneMarkings();
    }

    addLaneMarkings() {
        const markingGeometry = new THREE.PlaneGeometry(0.3, 3);
        const markingMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
        });
        
        for (let i = -this.length/2; i < this.length/2; i += 6) {
            const marking = new THREE.Mesh(markingGeometry, markingMaterial);
            marking.rotation.x = -Math.PI / 2;
            marking.position.set(0, 0.02, i);
            this.mesh.add(marking);
        }
    }

    isOnRoad(position) {
        const roadBounds = {
            minX: this.mesh.position.x - this.width/2,
            maxX: this.mesh.position.x + this.width/2,
            minZ: this.mesh.position.z - this.length/2,
            maxZ: this.mesh.position.z + this.length/2
        };
        
        return position.x >= roadBounds.minX && 
               position.x <= roadBounds.maxX && 
               position.z >= roadBounds.minZ && 
               position.z <= roadBounds.maxZ;
    }
}

// Points system
class PointsSystem {
    constructor() {
        this.lastCheck = Date.now();
        this.checkInterval = 1000; // Check every second
    }

    update(position) {
        const now = Date.now();
        if (now - this.lastCheck >= this.checkInterval) {
            const isOnRoad = road.isOnRoad(position);
            const points = isOnRoad ? 5 : -10;
            
            document.dispatchEvent(new CustomEvent('updatePoints', {
                detail: { points, isOnRoad }
            }));
            
            this.lastCheck = now;
        }
    }
}