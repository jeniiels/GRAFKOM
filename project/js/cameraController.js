// js/cameraController.js
import * as THREE from 'three';

const PI_2 = Math.PI / 2;

export class FPSStyleControls {
    constructor(camera, inputController, fixedYPosition = 0) {
        this.camera = camera;
        this.inputController = inputController; // InputController sekarang menangani pointer lock
        this.fixedYPosition = fixedYPosition;

        this.enabled = false;
        this.moveSpeed = 5.0;
        this.runMultiplier = 2.0;
        this.lookSpeed = 0.005; // Sensitivitas mouse

        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.minPitchAngle = -PI_2 * 0.9; // Batas lihat ke bawah
        this.maxPitchAngle = PI_2 * 0.9;  // Batas lihat ke atas

        this.movementVector = new THREE.Vector3(); // Arah input WASD lokal
        this.worldMovementVector = new THREE.Vector3(); // Arah gerakan di dunia
    }

    enable() {
        this.enabled = true;
        this.camera.position.y = this.fixedYPosition;
        this.camera.up.set(0, 1, 0);
        // Sinkronkan euler dengan orientasi kamera saat ini
        this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
        console.log("FPSStyleControls enabled. moveSpeed:", this.moveSpeed);
    }

    disable() {
        this.enabled = false;
        // InputController akan menangani pelepasan pointer lock jika perlu
    }

    update(deltaTime) {
        if (!this.enabled) {
            // this.inputController.resetMouseDelta(); // InputController akan meresetnya jika pointer dilepas
            return;
        }

        // Hanya proses input mouse jika pointer terkunci
        if (this.inputController.isPointerLocked) {
            const mouseDelta = this.inputController.mouseDelta;

            this.euler.y -= mouseDelta.x * this.lookSpeed; // Yaw
            this.euler.x -= mouseDelta.y * this.lookSpeed; // Pitch
            this.euler.x = Math.max(this.minPitchAngle, Math.min(this.maxPitchAngle, this.euler.x));

            this.camera.quaternion.setFromEuler(this.euler);
            this.inputController.resetMouseDelta(); // Penting untuk mereset setelah digunakan
        }


        const keys = this.inputController.keys;
        let currentMoveSpeed = this.moveSpeed;
        if (keys.ShiftRight) {
            currentMoveSpeed *= this.runMultiplier;
        }

        const moveDistance = currentMoveSpeed * deltaTime;
        this.movementVector.set(0, 0, 0);

        if (keys.KeyW) this.movementVector.z = -50;
        if (keys.KeyS) this.movementVector.z = 50;
        if (keys.KeyA) this.movementVector.x = -50;
        if (keys.KeyD) this.movementVector.x = 50;

        if (this.movementVector.lengthSq() > 0) {
            this.movementVector.normalize();
            this.worldMovementVector.copy(this.movementVector).applyQuaternion(this.camera.quaternion);

            this.camera.position.x += this.worldMovementVector.x * moveDistance;
            this.camera.position.z += this.worldMovementVector.z * moveDistance;
        }

        this.camera.position.y = this.fixedYPosition; // Pastikan Y tetap
    }
}