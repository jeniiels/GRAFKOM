// js/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { createLights } from './lights.js'; // createLights sekarang mengembalikan objek { lights, helpers }
import { createAllObjects } from './objects.js';
import { setupResizeHandler } from './resize.js';
import { startAnimationLoop } from './animation.js';

const canvas = document.getElementById('three-canvas');
if (!canvas) {
    console.error("Elemen canvas dengan id 'three-canvas' tidak ditemukan.");
} else {
    const scene = createScene();
    const camera = createCamera();
    camera.position.set(0, 3.5, 10); // Naikkan kamera sedikit
    scene.add(camera);

    const renderer = createRenderer(canvas);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0); // Pastikan target orbit di pusat objek

    // --- Tambahkan Cahaya dan Helper ke Scene ---
    const lightSetup = createLights(); // createLights() sekarang mengembalikan { lights, helpers }
    lightSetup.lights.forEach(light => scene.add(light));
    lightSetup.helpers.forEach(helper => scene.add(helper)); // Tambahkan helper ke scene

    const gameObjects = createAllObjects();
    scene.add(gameObjects.plane);
    scene.add(gameObjects.cube);
    scene.add(gameObjects.sphere);
    scene.add(gameObjects.pyramid);

    setupResizeHandler(camera, renderer);
    startAnimationLoop(scene, camera, renderer, controls);
}