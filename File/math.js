class MathUtils {
    static EPSILON = 0.000001;

    // Direction vectors
    static FORWARD = new THREE.Vector3(0, 0, 1);
    static RIGHT = new THREE.Vector3(1, 0, 0);
    static UP = new THREE.Vector3(0, 1, 0);

    // Get box vertices
    static getBoxVertices(box) {
        const vertices = [];
        vertices.push(
            new THREE.Vector3(box.min.x, box.min.y, box.min.z),
            new THREE.Vector3(box.min.x, box.min.y, box.max.z),
            new THREE.Vector3(box.min.x, box.max.y, box.min.z),
            new THREE.Vector3(box.min.x, box.max.y, box.max.z),
            new THREE.Vector3(box.max.x, box.min.y, box.min.z),
            new THREE.Vector3(box.max.x, box.min.y, box.max.z),
            new THREE.Vector3(box.max.x, box.max.y, box.min.z),
            new THREE.Vector3(box.max.x, box.max.y, box.max.z)
        );
        return vertices;
    }

    // Get box edges
    static getBoxEdges(box) {
        const vertices = this.getBoxVertices(box);
        const edges = [];
        // Connect vertices to form edges
        const edgeIndices = [
            [0,1], [1,3], [3,2], [2,0], // Front face
            [4,5], [5,7], [7,6], [6,4], // Back face
            [0,4], [1,5], [2,6], [3,7]  // Connecting edges
        ];
        
        for (const [i, j] of edgeIndices) {
            edges.push({
                start: vertices[i],
                end: vertices[j]
            });
        }
        return edges;
    }

    // Check if point is inside box
    static isPointInsideBox(point, box) {
        return (
            point.x >= box.min.x && point.x <= box.max.x &&
            point.y >= box.min.y && point.y <= box.max.y &&
            point.z >= box.min.z && point.z <= box.max.z
        );
    }

    // Get closest point on line segment to point
    static closestPointOnLineSegment(point, lineStart, lineEnd) {
        const line = lineEnd.clone().sub(lineStart);
        const len = line.length();
        line.normalize();

        const pointVector = point.clone().sub(lineStart);
        const dot = pointVector.dot(line);

        if (dot <= 0) return lineStart;
        if (dot >= len) return lineEnd;

        return lineStart.clone().add(line.multiplyScalar(dot));
    }

    // Check collision between moving box and static box
    static checkBoxCollision(movingBox, staticBox, movement) {
        // Expand static box slightly to prevent floating point issues
        const expandedBox = staticBox.clone().expandByScalar(0.01);
        
        // First, quick AABB test
        const futureBox = movingBox.clone().translate(movement);
        if (!futureBox.intersectsBox(expandedBox)) {
            return {
                collides: false,
                penetration: new THREE.Vector3()
            };
        }

        // Get penetration depths for each axis
        const xPen = movement.x > 0 ? 
            expandedBox.min.x - futureBox.max.x :
            expandedBox.max.x - futureBox.min.x;
        
        const yPen = movement.y > 0 ?
            expandedBox.min.y - futureBox.max.y :
            expandedBox.max.y - futureBox.min.y;
        
        const zPen = movement.z > 0 ?
            expandedBox.min.z - futureBox.max.z :
            expandedBox.max.z - futureBox.min.z;

        // Find smallest penetration
        const penetration = new THREE.Vector3(
            Math.abs(xPen) < Math.abs(movement.x) ? xPen : 0,
            Math.abs(yPen) < Math.abs(movement.y) ? yPen : 0,
            Math.abs(zPen) < Math.abs(movement.z) ? zPen : 0
        );

        return {
            collides: true,
            penetration: penetration
        };
    }

    // Resolve collision and return corrected position
    static resolveCollision(currentPos, newPos, playerBox, obstacleBox) {
        const movement = newPos.clone().sub(currentPos);
        const result = this.checkBoxCollision(playerBox, obstacleBox, movement);
        
        if (result.collides) {
            // Apply penetration correction
            movement.x += result.penetration.x;
            movement.y += result.penetration.y;
            movement.z += result.penetration.z;
            
            // Ensure we're not creating new collisions
            if (Math.abs(result.penetration.x) > Math.abs(result.penetration.z)) {
                movement.x = 0;
            } else {
                movement.z = 0;
            }
            
            // Special case for vertical movement
            if (Math.abs(result.penetration.y) > 0) {
                movement.y = 0;
            }
        }

        return movement;
    }
}