// js/cube.js
import * as THREE from 'three';

export function createCube() {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); // Ukuran kubus
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false }); // Warna hijau, tanpa wireframe
    // const material = new THREE.MeshNormalMaterial(); // Material dengan warna berdasarkan normal
    const cube = new THREE.Mesh(geometry, material);
    return cube;
}