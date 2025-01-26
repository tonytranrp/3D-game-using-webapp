export class CollisionSystem {
    static check(object1, object2) {
        const box1 = new THREE.Box3().setFromObject(object1);
        const box2 = new THREE.Box3().setFromObject(object2);
        return box1.intersectsBox(box2);
    }

    static getCollisionResponse(object, obstacles) {
        const objectBox = new THREE.Box3().setFromObject(object);
        return obstacles.some(obstacle => {
            const obstacleBox = new THREE.Box3().setFromObject(obstacle.mesh || obstacle);
            return objectBox.intersectsBox(obstacleBox);
        });
    }
}