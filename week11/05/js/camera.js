// js/camera.js
import * as THREE from 'three';

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        75, // FOV
        window.innerWidth / window.innerHeight,
        0.1, // Near
        1000 // Far
    );
    // camera.position.y = 1.6; // Tinggi mata rata-rata (bisa diatur di main.js)
    return camera;
}