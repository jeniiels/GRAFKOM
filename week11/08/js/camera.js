// js/camera.js
import * as THREE from 'three';

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        75, // Field of View (FOV)
        window.innerWidth / window.innerHeight, // Aspect Ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
    );
    camera.position.z = 5; // Mundurkan kamera agar objek terlihat
    return camera;
}