// js/orbitControlsHandler.js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function setupOrbitControls(camera, domElement) {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true; // Efek damping (ineria)
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Batasi panning pada bidang target
    controls.minDistance = 2;    // Jarak zoom minimal
    controls.maxDistance = 50;   // Jarak zoom maksimal
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Batasi agar tidak bisa melihat dari bawah lantai
    controls.target.set(0, 1, 0); // Arahkan target orbit sedikit di atas lantai
    controls.update(); // Panggil update sekali untuk menerapkan target awal
    return controls;
}