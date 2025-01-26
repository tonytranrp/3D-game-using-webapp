export class Road {
    constructor() {
        this.object = new THREE.Group();
        this.roads = [];
        this.intersections = [];
        this.createCityGrid();
    }

    createCityGrid() {
        // Main grid parameters
        const gridSize = 200;
    const blockSize = 40;
    const roadWidth = 10;
    const laneWidth = roadWidth / 2;

    // Create procedural asphalt texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 512;
    
    // Dark base color
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add noise for asphalt texture
    for (let i = 0; i < 15000; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
        ctx.fillRect(
            Math.random() * 512,
            Math.random() * 512,
            2,
            2
        );
    }

    const asphaltTexture = new THREE.CanvasTexture(canvas);
    asphaltTexture.wrapS = THREE.RepeatWrapping;
    asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(4, 4);

        // Road material with normal and roughness maps
        const roadMaterial = new THREE.MeshStandardMaterial({
            map: asphaltTexture,
            roughness: 0.8,
            metalness: 0.2,
            bumpMap: asphaltTexture,
            bumpScale: 0.1
        });

        // Create horizontal and vertical roads
        for (let i = -gridSize/2; i <= gridSize/2; i += blockSize) {
            // Horizontal road
            this.createRoadSegment(
                -gridSize/2, i, gridSize, roadWidth,
                roadMaterial, true
            );

            // Vertical road
            this.createRoadSegment(
                i, -gridSize/2, gridSize, roadWidth,
                roadMaterial, false
            );

            // Create intersections at crossings
            for (let j = -gridSize/2; j <= gridSize/2; j += blockSize) {
                this.createIntersection(i, j, roadWidth, roadMaterial);
            }
        }

        this.addRoadMarkings(gridSize, blockSize, laneWidth);
    }

    createRoadSegment(x, z, length, width, material, isHorizontal) {
        const geometry = new THREE.PlaneGeometry(
            isHorizontal ? length : width,
            isHorizontal ? width : length
        );
        const road = new THREE.Mesh(geometry, material);
        road.rotation.x = -Math.PI / 2;
        road.position.set(
            isHorizontal ? 0 : x,
            0.01,
            isHorizontal ? z : 0
        );
        road.receiveShadow = true;
        this.object.add(road);
        this.roads.push(road);
    }

    createIntersection(x, z, size, material) {
        const geometry = new THREE.PlaneGeometry(size * 1.2, size * 1.2);
        const intersection = new THREE.Mesh(geometry, material);
        intersection.rotation.x = -Math.PI / 2;
        intersection.position.set(x, 0.015, z);
        intersection.receiveShadow = true;
        this.object.add(intersection);
        this.intersections.push(intersection);
    }

    addRoadMarkings(gridSize, blockSize, laneWidth) {
        const lineWidth = 0.2;
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            roughness: 0.5
        });

        // Add lane dividers
        for (let i = -gridSize/2; i <= gridSize/2; i += blockSize) {
            // Horizontal lines
            this.createRoadLine(
                -gridSize/2, i, gridSize, lineWidth,
                lineMaterial, true
            );

            // Vertical lines
            this.createRoadLine(
                i, -gridSize/2, gridSize, lineWidth,
                lineMaterial, false
            );

            // Dashed lines for lane separation
            this.createDashedLines(i, gridSize, laneWidth, lineMaterial);
        }
    }

    createRoadLine(x, z, length, width, material, isHorizontal) {
        const geometry = new THREE.PlaneGeometry(
            isHorizontal ? length : width,
            isHorizontal ? width : length
        );
        const line = new THREE.Mesh(geometry, material);
        line.rotation.x = -Math.PI / 2;
        line.position.set(
            isHorizontal ? 0 : x,
            0.02,
            isHorizontal ? z : 0
        );
        this.object.add(line);
    }

    createDashedLines(pos, gridSize, laneWidth, material) {
        const dashLength = 3;
        const gapLength = 3;
        const lineWidth = 0.15;

        for (let i = -gridSize/2; i < gridSize/2; i += dashLength + gapLength) {
            // Horizontal dashed lines
            const dashH = new THREE.Mesh(
                new THREE.PlaneGeometry(dashLength, lineWidth),
                material
            );
            dashH.rotation.x = -Math.PI / 2;
            dashH.position.set(i + dashLength/2, 0.02, pos);
            this.object.add(dashH);

            // Vertical dashed lines
            const dashV = new THREE.Mesh(
                new THREE.PlaneGeometry(lineWidth, dashLength),
                material
            );
            dashV.rotation.x = -Math.PI / 2;
            dashV.position.set(pos, 0.02, i + dashLength/2);
            this.object.add(dashV);
        }
    }

    setRoadColor(color) {
        this.roads.forEach(road => {
            road.material.color = color;
        });
        this.intersections.forEach(intersection => {
            intersection.material.color = color;
        });
    }

    isPointOnRoad(point) {
        // Check if point is on any road segment
        const tolerance = 5;
        for (const road of this.roads) {
            const roadBounds = new THREE.Box3().setFromObject(road);
            roadBounds.min.y -= tolerance;
            roadBounds.max.y += tolerance;
            if (roadBounds.containsPoint(point)) return true;
        }
        return false;
    }
}