// js/playerController.js
import * as THREE from 'three';

export class PlayerController {
    constructor(initialModel, initialMixer, initialAnimations, inputManager, camera, gameMap, initialCollectibleLetters = [], onLetterCollectedCallback = () => {}) {
        this.model = initialModel; // Model yang sedang dikontrol
        this.characterModelData = { // Simpan data spesifik karakter
            model: initialModel,
            mixer: initialMixer,
            animationsMap: {}
        };
        this.inputManager = inputManager;
        this.camera = camera;
        this.collisionMesh = gameMap;
        this.collectibleLetters = [...initialCollectibleLetters];
        this.onLetterCollectedCallback = onLetterCollectedCallback;

        // Kecepatan
        this.baseCharacterMoveSpeed = 10.0;
        this.characterRunMultiplier = 1.8;
        this.baseCarMoveSpeed = this.baseCharacterMoveSpeed // Mobil 2x lebih cepat
        this.currentMoveSpeed = this.baseCharacterMoveSpeed;

        // Rotasi
        this.characterRotationSpeedFactor = 10.0;
        this.carRotationSpeedFactor = 6.0; // Mobil mungkin berbelok sedikit beda
        this.currentRotationSpeedFactor = this.characterRotationSpeedFactor;

        this.currentAction = null;
        this.targetMovementDirection = new THREE.Vector3();
        this.modelFacingDirection = new THREE.Vector3(0, 0, 1);
        this.velocity = new THREE.Vector3();

        // Ground Raycasting (akan disesuaikan per model)
        this.raycasterGround = new THREE.Raycaster();
        this.characterGroundRayOriginOffset = new THREE.Vector3(0, 1.5, 0);
        this.characterYOffsetFromGround = 0.1;
        this.carGroundRayOriginOffset = new THREE.Vector3(0, 0.8, 0); // Asumsi mobil lebih rendah
        this.carYOffsetFromGround = 0.2; // Asumsi ban mobil membuat sedikit offset
        this.currentGroundRayOriginOffset = this.characterGroundRayOriginOffset;
        this.currentPlayerYOffsetFromGround = this.characterYOffsetFromGround;
        this.groundCheckDistance = 3.0;

        this.collectionDistance = 6;
        this.isControllingCar = false;

        this._setupAnimations(initialAnimations);
        this.playAnimationByName('idle') || this.playAnimationByName('take 001');
    }

    _setupAnimations(animations) {
        if (this.characterModelData.mixer && animations && animations.length > 0) {
            animations.forEach(clip => {
                const actionName = clip.name;
                // Simpan ke characterModelData.animationsMap
                this.characterModelData.animationsMap[actionName] = this.characterModelData.mixer.clipAction(clip);
                const anim = this.characterModelData.animationsMap[actionName];
                if (actionName.toLowerCase().includes('idle') || actionName.toLowerCase() === 'take 001') {
                    anim.loop = THREE.LoopRepeat;
                } else if (actionName.toLowerCase().includes('walk') || actionName.toLowerCase().includes('run') || actionName.toLowerCase() === 'mixamo.com') {
                    anim.loop = THREE.LoopRepeat;
                } else {
                    anim.loop = THREE.LoopOnce;
                }
            });
        }
    }

    setControlledObject(newModel, isCar) {
        this.model = newModel;
        this.isControllingCar = isCar;

        if (isCar) {
            this.currentMoveSpeed = this.baseCarMoveSpeed;
            this.currentRotationSpeedFactor = this.carRotationSpeedFactor;
            this.currentGroundRayOriginOffset = this.carGroundRayOriginOffset;
            this.currentPlayerYOffsetFromGround = this.carYOffsetFromGround;
            if (this.currentAction) { // Hentikan animasi karakter
                this.currentAction.fadeOut(0.1);
                this.currentAction = null;
            }
        } else { // Kembali ke karakter
            this.currentMoveSpeed = this.baseCharacterMoveSpeed;
            this.currentRotationSpeedFactor = this.characterRotationSpeedFactor;
            this.currentGroundRayOriginOffset = this.characterGroundRayOriginOffset;
            this.currentPlayerYOffsetFromGround = this.characterYOffsetFromGround;
            // Mainkan animasi idle karakter lagi
            this.playAnimationByName('idle') || this.playAnimationByName('take 001');
        }
        console.log(`PlayerController: Now controlling ${this.model.name}. Is car: ${this.isControllingCar}. Speed: ${this.currentMoveSpeed}`);
    }

    playAnimationByName(name, crossFadeDuration = 0.2) {
        if (this.isControllingCar || !this.characterModelData.mixer || Object.keys(this.characterModelData.animationsMap).length === 0) return false;

        if (!name) return false;
        let actionToPlay = this.characterModelData.animationsMap[name];

        if (!actionToPlay) {
            const lowerCaseName = name.toLowerCase();
            for (const animName in this.characterModelData.animationsMap) {
                if (animName.toLowerCase().includes(lowerCaseName)) {
                    actionToPlay = this.characterModelData.animationsMap[animName];
                    break;
                }
            }
        }

        if (!actionToPlay) return false;
        if (this.currentAction === actionToPlay && actionToPlay.isRunning()) return true;
        if (this.currentAction) this.currentAction.fadeOut(crossFadeDuration);

        actionToPlay.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(crossFadeDuration).play();
        this.currentAction = actionToPlay;
        return true;
    }

    update(deltaTime) {
        if (!this.model || !this.model.position) return;

        const keys = this.inputManager.keys;
        let isMovingHorizontally = false;
        let actualSpeed = this.currentMoveSpeed;

        if (!this.isControllingCar && keys.ShiftLeft) {
            actualSpeed *= this.characterRunMultiplier;
        }

        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();

        const rightDirection = new THREE.Vector3().crossVectors(this.camera.up, cameraDirection).normalize();
        this.targetMovementDirection.set(0, 0, 0);

        if (keys.KeyW) this.targetMovementDirection.add(cameraDirection);
        if (keys.KeyS) this.targetMovementDirection.sub(cameraDirection);
        if (keys.KeyA) this.targetMovementDirection.add(rightDirection);
        if (keys.KeyD) this.targetMovementDirection.sub(rightDirection);

        if (this.targetMovementDirection.lengthSq() > 0) {
            isMovingHorizontally = true;
            this.targetMovementDirection.normalize();

            const targetQuaternion = new THREE.Quaternion();
            targetQuaternion.setFromUnitVectors(this.modelFacingDirection, this.targetMovementDirection);
            this.model.quaternion.slerp(targetQuaternion, this.currentRotationSpeedFactor * deltaTime);

            this.velocity.copy(this.targetMovementDirection).multiplyScalar(actualSpeed * deltaTime);
            this.model.position.add(this.velocity);
        } else {
            this.velocity.set(0,0,0);
        }

        if (this.collisionMesh) {
            const groundRayOrigin = this.model.position.clone().add(this.currentGroundRayOriginOffset);
            this.raycasterGround.set(groundRayOrigin, new THREE.Vector3(0, -1, 0));
            this.raycasterGround.far = this.groundCheckDistance;
            const groundIntersects = this.raycasterGround.intersectObject(this.collisionMesh, true);
            if (groundIntersects.length > 0) {
                this.model.position.y = groundIntersects[0].point.y + this.currentPlayerYOffsetFromGround;
            }
        }

        if (!this.isControllingCar && this.collectibleLetters && Array.isArray(this.collectibleLetters)) {
            const playerWorldPosition = new THREE.Vector3();
            this.model.getWorldPosition(playerWorldPosition);
            for (let i = this.collectibleLetters.length - 1; i >= 0; i--) {
                const letterObj = this.collectibleLetters[i];
                if (letterObj && letterObj.parent) {
                    const letterWorldPosition = new THREE.Vector3();
                    letterObj.getWorldPosition(letterWorldPosition);
                    const distanceToLetter = playerWorldPosition.distanceTo(letterWorldPosition);
                    if (distanceToLetter < this.collectionDistance) {
                        const letterNameParts = letterObj.name.split('_');
                        const collectedChar = letterNameParts.length > 1 ? letterNameParts[1].toUpperCase() : null;
                        if (collectedChar) {
                            console.log(`PlayerController: Mengambil huruf: ${collectedChar} (Objek: ${letterObj.name})`);
                            letterObj.removeFromParent();
                            this.collectibleLetters.splice(i, 1);
                            this.onLetterCollectedCallback(collectedChar, letterObj);
                        } else { this.collectibleLetters.splice(i, 1); }
                    }
                } else { this.collectibleLetters.splice(i, 1); }
            }
        }

        if (!this.isControllingCar) {
            if (isMovingHorizontally) {
                if (keys.ShiftLeft) {
                    if (!this.playAnimationByName('run')) this.playAnimationByName('mixamo.com');
                } else {
                    if (!this.playAnimationByName('walk')) this.playAnimationByName('mixamo.com');
                }
            } else {
                if (!this.playAnimationByName('idle')) this.playAnimationByName('take 001');
            }
        }

        if (this.characterModelData.mixer && !this.isControllingCar) {
            this.characterModelData.mixer.update(deltaTime);
        }
    }
}