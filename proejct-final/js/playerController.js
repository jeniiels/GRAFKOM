// js/playerController.js
import * as THREE from 'three';

export class PlayerController {
    constructor(initialModel, initialMixer, initialAnimations, inputManager, camera, gameMap,
                initialCollectibleLetters = [], onLetterCollectedCallback = () => {},
                initialPoopObjects = [], onPoopHitCallback = () => {}) { // Tambahkan poop
        this.model = initialModel;
        this.characterModelData = {
            model: initialModel,
            mixer: initialMixer,
            animationsMap: {}
        };
        this.inputManager = inputManager;
        this.camera = camera;
        this.collisionMesh = gameMap;
        this.collectibleLetters = [...initialCollectibleLetters];
        this.onLetterCollectedCallback = onLetterCollectedCallback;
        this.poopObjects = [...initialPoopObjects]; // Simpan referensi ke objek poop
        this.onPoopHitCallback = onPoopHitCallback; // Callback saat kena poop

        this.baseCharacterMoveSpeed = 10.0; // Saya kembalikan ke 10 sesuai kode Anda
        this.characterRunMultiplier = 1.8;
        this.baseCarMoveSpeed = this.baseCharacterMoveSpeed * 2.0; // Mobil 2x karakter
        this.carReverseSpeedMultiplier = 0.7;
        this.currentMoveSpeed = this.baseCharacterMoveSpeed;

        this.characterRotationSpeedFactor = 10.0;
        this.carRotationSpeedFactor = 3.0;
        this.currentRotationSpeedFactor = this.characterRotationSpeedFactor;

        this.currentAction = null;
        this.targetMovementDirection = new THREE.Vector3();
        this.modelForwardVector = new THREE.Vector3(0, 0, 1);
        this.velocity = new THREE.Vector3();

        this.raycasterGround = new THREE.Raycaster();
        this.characterGroundRayOriginOffset = new THREE.Vector3(0, 1.5, 0);
        this.characterYOffsetFromGround = 0.1;
        this.carGroundRayOriginOffset = new THREE.Vector3(0, 0.8, 0);
        this.carYOffsetFromGround = 0.2;
        this.currentGroundRayOriginOffset = this.characterGroundRayOriginOffset;
        this.currentPlayerYOffsetFromGround = this.characterYOffsetFromGround;
        this.groundCheckDistance = 3.0;

        this.collectionDistance = 6; // Sesuai kode Anda sebelumnya
        this.poopInteractionDistance = 2.3; // Jarak untuk "menginjak" poop, sesuaikan
        this.isControllingCar = false;
        this.isGameOver = false; // Flag untuk game over

        this._setupAnimations(initialAnimations);
        this.playAnimationByName('idle') || this.playAnimationByName('take 001');
    }

    _setupAnimations(animations) { /* ... kode sama ... */
        if (this.characterModelData.mixer && animations && animations.length > 0) {
            animations.forEach(clip => {
                const actionName = clip.name;
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

    setControlledObject(newModel, isCar) { /* ... kode sama ... */
        this.model = newModel;
        this.isControllingCar = isCar;

        if (isCar) {
            this.currentMoveSpeed = this.baseCarMoveSpeed;
            this.currentRotationSpeedFactor = this.carRotationSpeedFactor;
            this.currentGroundRayOriginOffset = this.carGroundRayOriginOffset;
            this.currentPlayerYOffsetFromGround = this.carYOffsetFromGround;
            if (this.currentAction) {
                this.currentAction.fadeOut(0.1);
                this.currentAction = null;
            }
        } else {
            this.currentMoveSpeed = this.baseCharacterMoveSpeed;
            this.currentRotationSpeedFactor = this.characterRotationSpeedFactor;
            this.currentGroundRayOriginOffset = this.characterGroundRayOriginOffset;
            this.currentPlayerYOffsetFromGround = this.characterYOffsetFromGround;
            this.playAnimationByName('idle') || this.playAnimationByName('take 001');
        }
        // console.log(`PlayerController: Now controlling ${this.model.name}. Is car: ${this.isControllingCar}. Speed: ${this.currentMoveSpeed}`);
    }
    
    setGameOver() {
        this.isGameOver = true;
        // Hentikan gerakan jika game over
        this.velocity.set(0,0,0);
        if (this.currentAction) {
            this.currentAction.stop(); // Hentikan animasi
        }
        // Atau mainkan animasi kalah jika ada
    }


    playAnimationByName(name, crossFadeDuration = 0.2) { /* ... kode sama ... */
        if (this.isGameOver) return false; // Jangan mainkan animasi jika game over
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
        if (this.isGameOver || !this.model || !this.model.position) return; // Hentikan update jika game over

        const keys = this.inputManager.keys;
        let isMoving = false;
        let actualSpeed = this.currentMoveSpeed;
        this.targetMovementDirection.set(0, 0, 0);

        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        const rightDirection = new THREE.Vector3().crossVectors(this.camera.up, cameraDirection).normalize();

        if (this.isControllingCar) {
            let forwardAmount = 0;
            if (keys.KeyW) forwardAmount = 1;
            if (keys.KeyS) forwardAmount = -1;
            let turnAmount = 0;
            if (keys.KeyA) turnAmount = -1;
            if (keys.KeyD) turnAmount = 1;

            if (forwardAmount !== 0) {
                isMoving = true;
                const carForward = new THREE.Vector3();
                this.model.getWorldDirection(carForward);
                carForward.y = 0;
                carForward.normalize();
                this.targetMovementDirection.copy(carForward).multiplyScalar(forwardAmount);
                actualSpeed = (forwardAmount > 0) ? this.currentMoveSpeed : this.currentMoveSpeed * this.carReverseSpeedMultiplier;
            }
            if (turnAmount !== 0 && (forwardAmount !== 0 || Math.abs(this.velocity.lengthSq()) > 0.01)) {
                const rotationAngle = -turnAmount * this.currentRotationSpeedFactor * 0.02 * (forwardAmount >=0 ? 1 : -1) ;
                this.model.rotateOnWorldAxis(this.model.up, rotationAngle);
            }
        } else {
            // Kontrol karakter seperti di PlayerController Anda sebelumnya (WASD pointer mouse)
            if (keys.KeyW) this.targetMovementDirection.add(cameraDirection);
            if (keys.KeyS) this.targetMovementDirection.sub(cameraDirection);
            // Untuk A dan D pada karakter, kita gunakan rightDirection yang sudah benar dari kode Anda
            if (keys.KeyA) this.targetMovementDirection.add(rightDirection); // Ini adalah A kiri kamera, D kanan kamera
            if (keys.KeyD) this.targetMovementDirection.sub(rightDirection);

            if (this.targetMovementDirection.lengthSq() > 0) {
                isMoving = true; // isMoving untuk karakter
                this.targetMovementDirection.normalize();
                const targetQuaternion = new THREE.Quaternion();
                targetQuaternion.setFromUnitVectors(this.modelForwardVector, this.targetMovementDirection);
                this.model.quaternion.slerp(targetQuaternion, this.currentRotationSpeedFactor * deltaTime);
            }
            if (keys.ShiftLeft) {
                actualSpeed *= this.characterRunMultiplier;
            }
        }

        if (isMoving || (this.isControllingCar && this.targetMovementDirection.lengthSq() > 0) ) {
            this.velocity.copy(this.targetMovementDirection).multiplyScalar(actualSpeed * deltaTime);
            this.model.position.add(this.velocity);
        } else {
            this.velocity.set(0, 0, 0);
        }

        if (this.collisionMesh) { /* ... kode ground raycasting sama ... */
            const groundRayOrigin = this.model.position.clone().add(this.currentGroundRayOriginOffset);
            this.raycasterGround.set(groundRayOrigin, new THREE.Vector3(0, -1, 0));
            this.raycasterGround.far = this.groundCheckDistance;
            const groundIntersects = this.raycasterGround.intersectObject(this.collisionMesh, true);
            if (groundIntersects.length > 0) {
                this.model.position.y = groundIntersects[0].point.y + this.currentPlayerYOffsetFromGround;
            }
        }
        

        // --- DETEKSI POOP (untuk karakter DAN mobil) ---
        // if (this.poopObjects && Array.isArray(this.poopObjects)) {
        //     const currentModelWorldPosition = new THREE.Vector3();
        //     this.model.getWorldPosition(currentModelWorldPosition);

        //     for (let i = this.poopObjects.length - 1; i >= 0; i--) {
        //         const poopObj = this.poopObjects[i];
        //         if (poopObj && poopObj.parent) { // Pastikan objek poop masih ada di scene
        //             const poopWorldPosition = new THREE.Vector3();
        //             poopObj.getWorldPosition(poopWorldPosition);

        //             const distanceToPoop = currentModelWorldPosition.distanceTo(poopWorldPosition);

        //             if (distanceToPoop < this.poopInteractionDistance) {
        //                 console.log(`PlayerController: Terkena poop: ${poopObj.name} pada jarak ${distanceToPoop.toFixed(4)}`);
        //                 poopObj.removeFromParent(); // Hapus dari scene
        //                 this.poopObjects.splice(i, 1); // Hapus dari array internal PlayerController
        //                 this.onPoopHitCallback(poopObj); // Panggil callback ke main.js
        //                 break; // Hanya satu poop per frame untuk menghindari multiple hits
        //             }
        //         } else {
        //             this.poopObjects.splice(i, 1); // Bersihkan jika sudah tidak valid
        //         }
        //     }
        // }

        if (this.poopObjects && Array.isArray(this.poopObjects)) {
            // Dapatkan bounding sphere untuk model yang dikontrol (pemain/mobil)
            // Penting: Bounding sphere ada di 'geometry'. Model GLB/FBX adalah Group,
            // jadi kita perlu mencari mesh utama atau menggabungkannya.
            // Untuk pendekatan sederhana, kita bisa coba buat sphere manual di sekitar model.
            
            const controlledModel = this.model; // Pemain atau mobil
            let controlledModelSphere;

            // Cara 1: Buat sphere manual di sekitar model (lebih kontrol)
            const controlledModelCenter = new THREE.Vector3();
            controlledModel.getWorldPosition(controlledModelCenter);
            // Radius sphere pemain/mobil perlu disesuaikan dengan ukuran visualnya
            // Misal, jika lebar pemain/mobil sekitar 0.015 (dari skala), radiusnya bisa 0.0075 atau sedikit lebih besar
            let controlledModelRadius = 0.01; // SESUAIKAN INI!
            if (this.isControllingCar) {
                controlledModelRadius = 0.02; // Mobil mungkin lebih besar, SESUAIKAN!
            }
            controlledModelSphere = new THREE.Sphere(controlledModelCenter, controlledModelRadius);


            // Cara 2: Coba dapatkan dari geometri (lebih kompleks jika model adalah Group)
            // controlledModel.traverse((child) => {
            //     if (child.isMesh && !controlledModelSphere) { // Ambil mesh pertama
            //         if (!child.geometry.boundingSphere) {
            //             child.geometry.computeBoundingSphere();
            //         }
            //         if (child.geometry.boundingSphere) {
            //             controlledModelSphere = child.geometry.boundingSphere.clone();
            //             controlledModelSphere.applyMatrix4(child.matrixWorld); // Transform ke world space
            //         }
            //     }
            // });
            // if (!controlledModelSphere) {
            //     // Fallback ke cara 1 jika tidak ditemukan mesh dengan bounding sphere
            //     const tempCenter = new THREE.Vector3();
            //     controlledModel.getWorldPosition(tempCenter);
            //     controlledModelSphere = new THREE.Sphere(tempCenter, 0.01); // Fallback radius
            // }


            for (let i = this.poopObjects.length - 1; i >= 0; i--) {
                const poopObj = this.poopObjects[i];
                if (poopObj && poopObj.parent) {
                    let poopSphere;

                    // Cara 1: Buat sphere manual di sekitar poop
                    const poopCenter = new THREE.Vector3();
                    poopObj.getWorldPosition(poopCenter);
                    // Radius poop, misal setengah dari skala Y poop (0.005 / 2 = 0.0025) atau sedikit lebih besar
                    const poopRadius = 3 * 0.75; // 0.75x skala. SESUAIKAN INI!
                    poopSphere = new THREE.Sphere(poopCenter, poopRadius);

                    if (controlledModelSphere && poopSphere && controlledModelSphere.intersectsSphere(poopSphere)) {
                        console.log(`PlayerController: Terkena poop (sphere): ${poopObj.name}`);
                        poopObj.removeFromParent();
                        this.poopObjects.splice(i, 1);
                        this.onPoopHitCallback(poopObj);
                        break;
                    }
                } else {
                    this.poopObjects.splice(i, 1);
                }
            }
        }


        // Interaksi Huruf (hanya untuk karakter)
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
                            // console.log(`PlayerController: Mengambil huruf: ${collectedChar} (Objek: ${letterObj.name})`);
                            letterObj.removeFromParent();
                            this.collectibleLetters.splice(i, 1);
                            this.onLetterCollectedCallback(collectedChar, letterObj);
                        } else { this.collectibleLetters.splice(i, 1); }
                    }
                } else { this.collectibleLetters.splice(i, 1); }
            }
        }

        if (!this.isControllingCar) { /* ... kode animasi karakter sama ... */
            if (isMoving) {
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