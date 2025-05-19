// js/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
    const scene = createScene();
    const camera = createCamera();
    // Sesuaikan posisi kamera awal jika perlu untuk tampilan yang lebih baik
    camera.position.set(0, 2.5, 7); // Mundur dan sedikit ke atas
    scene.add(camera);

    const renderer = createRenderer(canvas);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.5, 0); // Target orbit sedikit di atas lantai

    const lightSetup = createLights();
    lightSetup.lights.forEach(light => scene.add(light));
    if (lightSetup.helpers) { // Pastikan helpers ada sebelum di-loop
        lightSetup.helpers.forEach(helper => scene.add(helper));
    }


    const gameObjects = createAllObjects();
    const interactableObjects = []; // Array untuk objek yang bisa di-raycast

    scene.add(gameObjects.plane);
    scene.add(gameObjects.cube);
    interactableObjects.push(gameObjects.cube); // Tambahkan ke daftar interaktif

    scene.add(gameObjects.sphere);
    interactableObjects.push(gameObjects.sphere); // Tambahkan ke daftar interaktif

    scene.add(gameObjects.pyramid);
    interactableObjects.push(gameObjects.pyramid); // Tambahkan ke daftar interaktif


    // --- Setup Raycasting ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(); // Untuk menyimpan koordinat mouse NDC
    let intersectedObject = null; // Untuk menyimpan objek yang sedang di-hover

    function onMouseMove(event) {
        // Hitung posisi mouse dalam Normalized Device Coordinates (NDC) (-1 sampai +1)
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster dengan kamera dan posisi mouse
        raycaster.setFromCamera(mouse, camera);

        // Hitung objek yang berpotongan dengan picking ray
        const intersects = raycaster.intersectObjects(interactableObjects);

        if (intersects.length > 0) {
            // Jika objek yang di-intersect berbeda dari sebelumnya
            if (intersectedObject !== intersects[0].object) {
                // Kembalikan warna objek lama (jika ada)
                if (intersectedObject && intersectedObject.userData.originalColor) {
                    intersectedObject.material.color.set(intersectedObject.userData.originalColor);
                }
                // Simpan objek baru dan ubah warnanya
                intersectedObject = intersects[0].object;
                if (intersectedObject.material && intersectedObject.material.color) {
                    intersectedObject.material.color.setRGB(Math.random(), Math.random(), Math.random());
                }
            }
        } else {
            // Jika tidak ada perpotongan, kembalikan warna objek terakhir (jika ada)
            if (intersectedObject && intersectedObject.userData.originalColor) {
                intersectedObject.material.color.set(intersectedObject.userData.originalColor);
            }
            intersectedObject = null;
        }
    }

    window.addEventListener('mousemove', onMouseMove, false);

    // --- Sisa Setup ---
    setupResizeHandler(camera, renderer);
    startAnimationLoop(scene, camera, renderer, controls);
}