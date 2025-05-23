// js/playerController.js
import * as THREE from 'three';

export class PlayerController {
    constructor(playerModel, mixer, animations, inputManager, camera, gameMap, initialCollectibleLetters = [], onLetterCollectedCallback = () => {}) {
        this.model = playerModel;
        this.mixer = mixer;
        this.animationsMap = {};
        this.inputManager = inputManager;
        this.camera = camera;
        this.collisionMesh = gameMap;
        this.collectibleLetters = [...initialCollectibleLetters];
        this.onLetterCollectedCallback = onLetterCollectedCallback;

        this.moveSpeed = 15.0;
        this.runSpeedMultiplier = 1.8;
        this.rotationSpeedFactor = 10.0;

        this.currentAction = null;
        this.targetMovementDirection = new THREE.Vector3();
        this.modelFacingDirection = new THREE.Vector3(0, 0, 1);
        this.velocity = new THREE.Vector3();

        this.raycasterGround = new THREE.Raycaster();
        this.groundRayOriginOffset = new THREE.Vector3(0, 1.5, 0);
        this.groundCheckDistance = 3.0;
        this.playerYOffsetFromGround = 0.1; // Pemain akan berada sedikit di atas titik kontak tanah

        // Jarak untuk mengambil huruf.
        // Dengan skala pemain 0.015 dan skala huruf 2, jarak ini mungkin perlu disesuaikan.
        // Mari kita pertahankan 2.5 untuk sekarang, tapi ini mungkin perlu lebih besar atau lebih kecil
        // tergantung pada ukuran visual aktual dan bagaimana Anda ingin "rasa" interseksinya.
        this.collectionDistance = 6; // Default, bisa diubah

        if (animations && animations.length > 0) {
            animations.forEach(clip => {
                const actionName = clip.name;
                this.animationsMap[actionName] = this.mixer.clipAction(clip);
                if (actionName.toLowerCase().includes('idle') || actionName.toLowerCase() === 'take 001') {
                    this.animationsMap[actionName].loop = THREE.LoopRepeat;
                } else if (actionName.toLowerCase().includes('walk') || actionName.toLowerCase().includes('run') || actionName.toLowerCase() === 'mixamo.com') {
                    this.animationsMap[actionName].loop = THREE.LoopRepeat;
                } else {
                    this.animationsMap[actionName].loop = THREE.LoopOnce;
                }
            });
        }
        this.playAnimationByName('idle') || this.playAnimationByName('take 001');
    }

    playAnimationByName(name, crossFadeDuration = 0.2) {
        if (!name) return false;
        let actionToPlay = this.animationsMap[name];

        if (!actionToPlay) {
            const lowerCaseName = name.toLowerCase();
            for (const animName in this.animationsMap) {
                if (animName.toLowerCase().includes(lowerCaseName)) {
                    actionToPlay = this.animationsMap[animName];
                    break;
                }
            }
        }

        if (!actionToPlay) {
            return false;
        }

        if (this.currentAction === actionToPlay && actionToPlay.isRunning()) return true;

        if (this.currentAction) {
            this.currentAction.fadeOut(crossFadeDuration);
        }

        actionToPlay.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(crossFadeDuration).play();
        this.currentAction = actionToPlay;
        return true;
    }

    update(deltaTime) {
        const keys = this.inputManager.keys;
        let isMovingHorizontally = false;
        let currentSpeed = this.moveSpeed;

        if (keys.ShiftLeft) {
            currentSpeed *= this.runSpeedMultiplier;
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
            this.model.quaternion.slerp(targetQuaternion, this.rotationSpeedFactor * deltaTime);

            this.velocity.copy(this.targetMovementDirection).multiplyScalar(currentSpeed * deltaTime);
            this.model.position.add(this.velocity);

        } else {
            this.velocity.set(0,0,0);
        }

        if (this.collisionMesh) {
            const groundRayOrigin = this.model.position.clone().add(this.groundRayOriginOffset);
            this.raycasterGround.set(groundRayOrigin, new THREE.Vector3(0, -1, 0));
            this.raycasterGround.far = this.groundCheckDistance;

            const groundIntersects = this.raycasterGround.intersectObject(this.collisionMesh, true);

            if (groundIntersects.length > 0) {
                const groundY = groundIntersects[0].point.y;
                this.model.position.y = groundY + this.playerYOffsetFromGround;
            }
        }

        // --- Cek Interaksi dengan Huruf (collectibleLetters) ---
        if (this.collectibleLetters && Array.isArray(this.collectibleLetters)) {
            const playerWorldPosition = new THREE.Vector3();
            this.model.getWorldPosition(playerWorldPosition); // Dapatkan posisi dunia pemain

            for (let i = this.collectibleLetters.length - 1; i >= 0; i--) {
                const letterObj = this.collectibleLetters[i];
                if (letterObj && letterObj.parent) {
                    const letterWorldPosition = new THREE.Vector3();
                    letterObj.getWorldPosition(letterWorldPosition); // Dapatkan posisi dunia huruf

                    const distanceToLetter = playerWorldPosition.distanceTo(letterWorldPosition);

                    // DEBUG LOGGING (nonaktifkan jika terlalu banyak output):
                    // console.log(`Pemain @ (${playerWorldPosition.x.toFixed(1)}, ${playerWorldPosition.y.toFixed(1)}, ${playerWorldPosition.z.toFixed(1)}) | Huruf ${letterObj.name} @ (${letterWorldPosition.x.toFixed(1)}, ${letterWorldPosition.y.toFixed(1)}, ${letterWorldPosition.z.toFixed(1)}) | Jarak: ${distanceToLetter.toFixed(2)} | Target Jarak: ${this.collectionDistance}`);

                    if (distanceToLetter < this.collectionDistance) {
                        const letterNameParts = letterObj.name.split('_');
                        const collectedChar = letterNameParts.length > 1 ? letterNameParts[1].toUpperCase() : null;

                        if (collectedChar) {
                            // INI console.log yang Anda bilang tidak muncul
                            console.log(`PlayerController: Mengambil huruf: ${collectedChar} (Objek: ${letterObj.name}) - JARAK SUKSES: ${distanceToLetter.toFixed(2)}`);
                            
                            letterObj.removeFromParent();
                            this.collectibleLetters.splice(i, 1);
                            this.onLetterCollectedCallback(collectedChar, letterObj);
                        } else {
                            console.warn(`PlayerController: Nama objek huruf tidak sesuai format: ${letterObj.name}. Menghapus dari daftar.`);
                            this.collectibleLetters.splice(i, 1);
                        }
                    }
                } else {
                    this.collectibleLetters.splice(i, 1);
                }
            }
        }

        // Pemilihan Animasi
        if (isMovingHorizontally) {
            if (keys.ShiftLeft) {
                if (!this.playAnimationByName('run')) this.playAnimationByName('mixamo.com');
            } else {
                if (!this.playAnimationByName('walk')) this.playAnimationByName('mixamo.com');
            }
        } else {
            if (!this.playAnimationByName('idle')) this.playAnimationByName('take 001');
        }

        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}