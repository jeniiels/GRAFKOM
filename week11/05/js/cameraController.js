// js/cameraController.js
import * as THREE from 'three';

const PI_2 = Math.PI / 2;

export class FPSStyleControls {
    constructor(camera, inputController, fixedYPosition = 0) {
        this.camera = camera;
        this.inputController = inputController;
        this.fixedYPosition = fixedYPosition;

        this.enabled = false;
        this.moveSpeed = 5.0; // << PASTIKAN INI NILAI POSITIF (misalnya 5.0 atau 7.0)
        this.runMultiplier = 2.0;
        this.lookSpeed = 0.002;

        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.minPitchAngle = -PI_2 * 0.95;
        this.maxPitchAngle = PI_2 * 0.95;

        this.movementVector = new THREE.Vector3();
        this.worldMovementVector = new THREE.Vector3();
    }

    enable() {
        this.enabled = true;
        this.camera.position.y = this.fixedYPosition;
        this.camera.up.set(0, 1, 0);
        this.euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
        // Log untuk memastikan moveSpeed benar saat enable
        console.log("FPSStyleControls enabled, moveSpeed:", this.moveSpeed);
    }

    disable() {
        this.enabled = false;
    }

    update(deltaTime) {
        // console.log("FPSControls update called, deltaTime:", deltaTime, "moveSpeed:", this.moveSpeed); // Log awal update

        if (!this.enabled) {
            this.inputController.resetMouseDelta();
            return;
        }

        if (typeof deltaTime === 'undefined' || isNaN(deltaTime) || deltaTime <= 0) {
            deltaTime = 0.016;
        }

        const mouseDelta = this.inputController.mouseDelta;
        const keys = this.inputController.keys;

        // Kontrol Pandangan (Mouse Look)
        this.euler.y -= mouseDelta.x * this.lookSpeed;
        this.euler.x -= mouseDelta.y * this.lookSpeed;
        this.euler.x = Math.max(this.minPitchAngle, Math.min(this.maxPitchAngle, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
        this.inputController.resetMouseDelta();

        // Pergerakan WASD
        let currentMoveSpeed = this.moveSpeed;
        if (keys.ShiftRight) {
            currentMoveSpeed *= this.runMultiplier;
        }
        const moveDistance = currentMoveSpeed * deltaTime;

        // Log untuk debug pergerakan
        // if (keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD) {
        //     console.log(`Key pressed: W:${keys.KeyW} A:${keys.KeyA} S:${keys.KeyS} D:${keys.KeyD}`);
        //     console.log(`moveSpeed: ${this.moveSpeed}, currentMoveSpeed: ${currentMoveSpeed}, deltaTime: ${deltaTime.toFixed(4)}, moveDistance: ${moveDistance.toFixed(4)}`);
        // }

        this.movementVector.set(0, 0, 0);

        if (keys.KeyW) this.movementVector.z = -1;
        if (keys.KeyS) this.movementVector.z = 1;
        if (keys.KeyA) this.movementVector.x = -1;
        if (keys.KeyD) this.movementVector.x = 1;

        if (this.movementVector.lengthSq() > 0) {
            this.movementVector.normalize();
            const cameraQuaternion = this.camera.quaternion.clone();
            this.worldMovementVector.copy(this.movementVector).applyQuaternion(cameraQuaternion);

            // if (keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD) {
            //    console.log("World Movement Vector:", this.worldMovementVector.x.toFixed(2), this.worldMovementVector.y.toFixed(2), this.worldMovementVector.z.toFixed(2));
            //    console.log("Applying to position: dX:", (this.worldMovementVector.x * moveDistance).toFixed(4), "dZ:", (this.worldMovementVector.z * moveDistance).toFixed(4));
            // }

            this.camera.position.x += this.worldMovementVector.x * moveDistance;
            this.camera.position.z += this.worldMovementVector.z * moveDistance;
        }
        this.camera.position.y = this.fixedYPosition;
    }
}