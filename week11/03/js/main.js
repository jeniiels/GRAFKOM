// js/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Impor OrbitControls
import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { createLights } from './lights.js';
import { createAllObjects } from './objects.js';
import { setupResizeHandler } from './resize.js';
import { startAnimationLoop } from './animation.js';

const canvas = document.getElementById('three-canvas');
if (!canvas) {
    console.error("Elemen canvas dengan id 'three-canvas' tidak ditemukan.");
} else {
    // 1. Buat Scene
    const scene = createScene();

    // 2. Buat Kamera
    const camera = createCamera();
    camera.position.set(0, 2.5, 8); // Posisi kamera awal
    // camera.lookAt(0, 0, 0); // OrbitControls akan mengatur target
    scene.add(camera);

    // 3. Buat Renderer
    const renderer = createRenderer(canvas);

    // 4. Setup OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Memberikan efek "gesekan" atau "ineria" saat interaksi berhenti
    controls.dampingFactor = 0.05;
    // controls.screenSpacePanning = false; // Batasi panning pada bidang XY dari target
    // controls.minDistance = 2; // Jarak zoom minimal
    // controls.maxDistance = 20; // Jarak zoom maksimal
    // controls.maxPolarAngle = Math.PI / 2 - 0.05; // Batasi orbit agar tidak bisa melihat dari bawah plane

    // 5. Tambahkan Cahaya ke Scene
    const lights = createLights();
    lights.forEach(light => scene.add(light));

    // 6. Buat dan Tambahkan Objek ke Scene
    const gameObjects = createAllObjects();
    scene.add(gameObjects.plane);
    scene.add(gameObjects.cube);
    scene.add(gameObjects.sphere);
    scene.add(gameObjects.pyramid);

    // 7. Setup Penanganan Resize
    setupResizeHandler(camera, renderer);

    // 8. Mulai Loop Animasi
    // Kita tidak lagi menganimasikan objek secara manual
    // Array objek yang dianimasikan sekarang bisa kosong,
    // atau kita bisa menghapus parameter tersebut dari startAnimationLoop jika tidak ada objek yang dianimasikan.
    // Untuk saat ini, kita hanya akan meneruskan controls.
    startAnimationLoop(scene, camera, renderer, controls); // Kirim controls ke loop animasi
}