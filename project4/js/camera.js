// js/camera.js
import * as THREE from 'three';

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        60, // FOV sedikit lebih kecil mungkin cocok untuk TPV
        window.innerWidth / window.innerHeight,
        0.1,
        2000 // Jangkauan pandang jauh
    );
    // Posisi awal akan diatur oleh TPVCameraController
    return camera;
}