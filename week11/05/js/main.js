// js/main.js
import * as THREE from 'three';
import { InputController } from './inputController.js';
import { FPSStyleControls } from './cameraController.js'; // Nama kelas kontrol baru
import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { createLights } from './lights.js';
import { createAllObjects } from './objects.js';
import { setupResizeHandler } from './resize.js';
import { startAnimationLoop } from './animation.js';

const canvas = document.getElementById('three-canvas');
const instructionsDiv = document.getElementById('instructions');

if (!canvas) {
    console.error("Elemen canvas dengan id 'three-canvas' tidak ditemukan.");
} else {
    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer(canvas);

    // --- Inisialisasi Kontrol Tunggal ---
    const inputController = new InputController(canvas); // Kirim canvas ke InputController
    inputController.enable();

    const gameObjects = createAllObjects();
    const planeY = gameObjects.plane.position.y;

    const cameraHeightAbovePlane = 1;
    const fixedCameraHeight = planeY + cameraHeightAbovePlane;

    camera.position.set(0, fixedCameraHeight, 5);

    const fpsControls = new FPSStyleControls(camera, inputController, fixedCameraHeight);
    // fpsControls.moveSpeed = 0; // << PASTIKAN TIDAK ADA BARIS SEPERTI INI YANG MENGATUR JADI 0
    fpsControls.enable();

    // --- Setup Sisa Scene ---
    const lightSetup = createLights();
    lightSetup.lights.forEach(light => scene.add(light));
    // lightSetup.helpers.forEach(helper => scene.add(helper)); // Nonaktifkan helper jika tidak perlu

    scene.add(gameObjects.plane);
    scene.add(gameObjects.cube);
    scene.add(gameObjects.sphere);
    scene.add(gameObjects.pyramid);

    gameObjects.cube.position.y = (1.5 / 2) + planeY;
    gameObjects.sphere.position.y = 1 + planeY;
    gameObjects.pyramid.position.y = (1.5 / 2) + planeY;

    if (instructionsDiv) {
        instructionsDiv.textContent = "Gunakan WASD untuk bergerak. Mouse mengontrol pandangan. Shift Kanan untuk lari.";
        instructionsDiv.style.display = 'block';
    }

    setupResizeHandler(camera, renderer);
    // Pastikan fpsControls adalah instance yang benar dan memiliki metode update
    console.log("fpsControls instance:", fpsControls); // Tambahkan log ini
    console.log("typeof fpsControls.update:", typeof fpsControls.update); // Tambahkan log ini
    startAnimationLoop(scene, camera, renderer, fpsControls); // Kirim instance fpsControls
}