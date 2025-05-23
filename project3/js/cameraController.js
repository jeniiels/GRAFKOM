// js/cameraController.js
import * as THREE from 'three';

export class TPVCameraControls {
    constructor(camera, targetToFollow, canvasElement, inputManager) {
        this.camera = camera;
        this.target = targetToFollow; // Objek yang akan diikuti kamera (model pemain)
        this.canvasElement = canvasElement;
        this.inputManager = inputManager;

        this.enabled = true;
        this.distance = 8; // Jarak kamera dari target
        this.minDistance = 3;
        this.maxDistance = 20;
        this.phi = Math.PI / 3; // Sudut vertikal (0 = atas, PI/2 = horizontal, PI = bawah)
        this.theta = 0;         // Sudut horizontal (orbit)
        this.minPolarAngle = 0.1; // Batas sudut vertikal (hindari gimbal lock)
        this.maxPolarAngle = Math.PI / 2 - 0.05; // Batas agar tidak terlalu ke bawah

        this.rotateSpeed = 1.5;
        this.zoomSpeed = 1.0;
        this.dampingFactor = 0.05; // Untuk gerakan kamera yang lebih halus

        this.spherical = new THREE.Spherical(this.distance, this.phi, this.theta);
        this.targetPosition = new THREE.Vector3(); // Posisi target yang diikuti kamera
        this.cameraOffset = new THREE.Vector3();
        this.targetQuaternion = new THREE.Quaternion(); // Untuk slerp orientasi

        this.targetHeightOffset = 1.0; // Offset Y pada target agar kamera melihat sedikit ke atas karakter
    }

    update(deltaTime) {
        if (!this.enabled || !this.target) return;

        const mouse = this.inputManager.mouse;

        // Orbit kamera dengan mouse jika tombol kiri ditekan (atau tombol lain sesuai preferensi)
        if (mouse.isDragging && mouse.buttons[0]) { // Anggap tombol kiri mouse untuk orbit
            this.theta -= mouse.deltaX * this.rotateSpeed * 0.01; // Sesuaikan sensitivitas
            this.phi -= mouse.deltaY * this.rotateSpeed * 0.01;
        }

        // Batasi sudut phi (polar)
        this.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.phi));

        // Zoom dengan scroll mouse (jika diimplementasikan di inputManager)
        // Untuk sekarang, kita biarkan jarak tetap atau bisa ditambahkan nanti.

        this.spherical.set(this.distance, this.phi, this.theta);

        // Hitung posisi kamera baru berdasarkan spherical coordinates
        this.cameraOffset.setFromSpherical(this.spherical);

        // Posisi target kamera adalah posisi model pemain + offset tinggi
        const desiredTargetPosition = this.target.position.clone().add(new THREE.Vector3(0, this.targetHeightOffset, 0));

        // Interpolasi posisi target kamera untuk gerakan yang lebih halus
        this.targetPosition.lerp(desiredTargetPosition, (1 - this.dampingFactor));

        this.camera.position.copy(this.targetPosition).add(this.cameraOffset);

        // Arahkan kamera ke target (dengan interpolasi agar tidak terlalu kaku)
        this.camera.lookAt(this.targetPosition);

        // Reset delta mouse setelah digunakan
        // this.inputManager.resetMouseDeltas(); // Seharusnya dipanggil di loop utama (main.js)
    }
}