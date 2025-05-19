// js/camera.js
import * as THREE from 'three';

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        75, // Field of View
        window.innerWidth / window.innerHeight, // Aspect Ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );
    // Posisi kamera awal, bisa disesuaikan di main.js atau orbitControlsHandler
    camera.position.set(0, 10, 100);
    return camera;
}