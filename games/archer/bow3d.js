class Bow3D {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(600, 600);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = -0.23;
        this.camera.position.y = -0.5;

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
        backLight.position.set(-5, 5, -5);
        this.scene.add(backLight);

        this.defaultState = {
            rotation: new THREE.Euler(-Math.PI / 6, Math.PI * 0.7, Math.PI / 8),
            position: new THREE.Vector3(1.5, -0.5, -3)
        };

        this.aimingState = {
            rotation: new THREE.Euler(-Math.PI / 6, Math.PI / 2, 0),
            position: new THREE.Vector3(1.5, -0.8, -3)
        };

        this.targetRotation = new THREE.Euler().copy(this.defaultState.rotation);
        this.targetPosition = new THREE.Vector3().copy(this.defaultState.position);
        this.animationSpeed = 0.05;
        this.isAiming = false;

        this.loadBow();
        this.animate();
    }

    setAiming(isAiming) {
        if (isAiming !== this.isAiming) {
            this.isAiming = isAiming;

            if (isAiming) {
                this.container.classList.add('aiming');
                if (this.bowModel) {
                    this.targetRotation.copy(this.aimingState.rotation);
                    this.targetPosition.copy(this.aimingState.position);
                }
            } else {
                this.container.classList.remove('aiming');
                if (this.bowModel) {
                    this.targetRotation.copy(this.defaultState.rotation);
                    this.targetPosition.copy(this.defaultState.position);
                }
            }
        }
    }

    loadBow() {
        const loader = new THREE.GLTFLoader();
        loader.load(
            'assets/bow/Bow.glb',
            (gltf) => {
                this.bowModel = gltf.scene;

                this.bowModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        if (!this.bowMesh) this.bowMesh = child;
                    }
                });

                const box = new THREE.Box3().setFromObject(this.bowModel);
                const center = box.getCenter(new THREE.Vector3());
                this.bowModel.position.sub(center);

                this.bowModel.scale.set(3, 3, 3);
                this.bowModel.position.copy(this.defaultState.position);
                this.bowModel.rotation.copy(this.defaultState.rotation);

                this.scene.add(this.bowModel);

                this.loadArrow(); // Load arrow after bow for alignment
            },
            undefined,
            (error) => console.error('Error loading bow model:', error)
        );
    }

    loadArrow() {
        const loader = new THREE.GLTFLoader();
        loader.load(
            'assets/arrow/Arrow.glb',
            (arrowGltf) => {
                this.arrowModel = arrowGltf.scene;

                this.arrowModel.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        // Use the original material from the model
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.arrowModel.scale.set(2, 2, 2);

                // Place arrow to the LEFT of the bow
                this.arrowModel.position.set(1.2, -0.5, -2.8); // Move even closer to make boxes intersect more
                this.arrowModel.rotation.set(-Math.PI / 2, Math.PI / 2, 0); // Rotate 90 degrees downward

                this.scene.add(this.arrowModel);
            },
            undefined,
            (error) => console.error('Error loading arrow model:', error)
        );
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.bowModel) {
            this.bowModel.rotation.x += (this.targetRotation.x - this.bowModel.rotation.x) * this.animationSpeed;
            this.bowModel.rotation.y += (this.targetRotation.y - this.bowModel.rotation.y) * this.animationSpeed;
            this.bowModel.rotation.z += (this.targetRotation.z - this.bowModel.rotation.z) * this.animationSpeed;

            this.bowModel.position.x += (this.targetPosition.x - this.bowModel.position.x) * this.animationSpeed;
            this.bowModel.position.y += (this.targetPosition.y - this.bowModel.position.y) * this.animationSpeed;
            this.bowModel.position.z += (this.targetPosition.z - this.bowModel.position.z) * this.animationSpeed;
        }

        this.renderer.render(this.scene, this.camera);
    }

    hideArrow() {
        if (this.arrowModel && this.scene.children.includes(this.arrowModel)) {
            this.scene.remove(this.arrowModel);
        }
    }

    showArrow() {
        if (this.arrowModel && !this.scene.children.includes(this.arrowModel)) {
            this.scene.add(this.arrowModel);
        }
    }

    setYawAndPitch(yaw, pitch) {
        if (this.bowModel && !this.isAiming) {
            this.targetRotation.y = yaw;
            this.targetRotation.x = pitch;
        }
    }
    
    setPullDistance(pullDistance) {
        // Enhanced bow string animation based on pull distance
        // pullDistance is a normalized value between 0 and 1
        if (this.bowModel) {
            if (this.isAiming) {
                // Create a more dynamic and realistic bow animation
                
                // 1. Bow flexing - subtle bend based on pull
                const flexAmount = pullDistance * 0.15;
                this.targetRotation.z = flexAmount;
                
                // 2. Bow tilting slightly forward when pulled
                const tiltAmount = pullDistance * 0.1;
                this.targetRotation.x = this.aimingState.rotation.x - tiltAmount;
                
                // 3. Bow moving backward when pulled
                const originalZ = this.aimingState.position.z;
                this.targetPosition.z = originalZ - pullDistance * 0.7;
                
                // 4. Slight vertical adjustment for realism
                const originalY = this.aimingState.position.y;
                this.targetPosition.y = originalY + pullDistance * 0.1;
                
                // 5. Subtle horizontal movement
                const originalX = this.aimingState.position.x;
                this.targetPosition.x = originalX - pullDistance * 0.05;
            } else {
                // When not aiming, ensure bow returns to default position
                this.targetRotation.copy(this.defaultState.rotation);
                this.targetPosition.copy(this.defaultState.position);
            }
        }
    }
}

export default Bow3D;
