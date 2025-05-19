// js/lights.js
import * as THREE from 'three';

export function createLights() {
    // Cahaya ambient untuk menerangi semua objek secara merata
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Warna putih, intensitas 0.6

    // Cahaya directional untuk memberikan bayangan dan highlight
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Warna putih, intensitas 1.0
    directionalLight.position.set(5, 10, 7.5); // Atur posisi cahaya

    return [ambientLight, directionalLight];
}