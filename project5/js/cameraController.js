// js/cameraController.js
import * as THREE from 'three';

export class TPVCameraControls {
    constructor(camera, targetToFollow, canvasElement, inputManager) {
        this.camera = camera;
        this.target = targetToFollow;
        this.canvasElement = canvasElement;
        this.inputManager = inputManager;

        this.enabled = true;

        this.characterDistance = 8;
        this.carDistance = 15;
        this.distance = this.characterDistance;

        this.minDistance = 3;
        this.maxDistance = 25;
        this.phi = Math.PI / 3; // Sudut vertikal awal
        this.theta = 0;         // Sudut horizontal awal

        this.minPolarAngle = 0.1;
        this.maxPolarAngle = Math.PI / 2 - 0.05;

        this.rotateSpeed = 1.5;
        this.zoomSpeed = 1.0; // Kecepatan zoom dengan scroll
        this.dampingFactor = 0.05;

        this.spherical = new THREE.Spherical(this.distance, this.phi, this.theta);
        this.targetPosition = new THREE.Vector3();
        this.cameraOffset = new THREE.Vector3();
        // this.targetQuaternion = new THREE.Quaternion(); // Tidak digunakan saat ini

        this.characterHeightOffset = 1.0;
        this.carHeightOffset = 1.8;
        this.targetHeightOffset = this.characterHeightOffset;
    }

    setTargetToFollow(newTarget, isCar = false) {
        if (newTarget) {
            this.target = newTarget;
            this.targetHeightOffset = isCar ? this.carHeightOffset : this.characterHeightOffset;
            this.distance = isCar ? this.carDistance : this.characterDistance;

            // Langsung update spherical dengan jarak baru, phi, dan theta saat ini
            this.spherical.set(this.distance, this.phi, this.theta);

            if (this.target.position) {
                 this.targetPosition.copy(this.target.position).add(new THREE.Vector3(0, this.targetHeightOffset, 0));
            }
            console.log("TPVCameraControls: Target diubah ke", newTarget.name, "isCar:", isCar, "Jarak kamera:", this.distance);
        } else {
            console.warn("TPVCameraControls: Mencoba set target null.");
        }
    }

    update(deltaTime) {
        if (!this.enabled || !this.target || !this.target.position) return;

        const mouse = this.inputManager.mouse;

        // 1. Update theta dan phi berdasarkan input mouse (untuk orbit)
        if (mouse.isDragging && mouse.buttons[0]) { // Tombol kiri mouse untuk orbit
            this.theta -= mouse.deltaX * this.rotateSpeed * 0.01;
            this.phi -= mouse.deltaY * this.rotateSpeed * 0.01;
        }

        // 2. Batasi sudut phi (polar)
        this.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.phi));

        // 3. Update jarak berdasarkan scroll mouse (untuk zoom)
        if (this.inputManager.mouse.wheelDeltaY) {
            // event.deltaY positif saat scroll ke bawah (zoom out), negatif saat scroll ke atas (zoom in)
            // Jadi, kita tambahkan ke distance untuk efek yang benar jika deltaY positif = zoom out
            this.distance += this.inputManager.mouse.wheelDeltaY * 0.01 * this.zoomSpeed;
            this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
            this.inputManager.mouse.wheelDeltaY = 0; // Reset setelah digunakan
        }

        // 4. Update spherical coordinates dengan nilai distance, phi, dan theta saat ini
        this.spherical.set(this.distance, this.phi, this.theta);

        // 5. Hitung posisi kamera baru
        this.cameraOffset.setFromSpherical(this.spherical);

        const desiredTargetPosition = this.target.position.clone().add(new THREE.Vector3(0, this.targetHeightOffset, 0));
        this.targetPosition.lerp(desiredTargetPosition, (1 - this.dampingFactor)); // Posisi yang dilihat kamera
        this.camera.position.copy(this.targetPosition).add(this.cameraOffset);    // Atur posisi kamera
        this.camera.lookAt(this.targetPosition);                                  // Arahkan kamera
    }
}