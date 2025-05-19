// js/main.js
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'; // Jika pakai HDR
import { createScene, setEnvironmentMap } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { setupLights } from './lights.js';
import { loadModel } from './modelLoader.js';
import { InputController } from './inputController.js';
import { FPSStyleControls } from './cameraController.js';

// Konstanta atau Pengaturan Awal
const MODEL_PATH = './assets/models/fishing_town.glb';
const HDR_PATH = './assets/hdri/sky.hdr';
async function init() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas element 'game-canvas' not found.");
        return;
    }

    // 1. Scene
    const scene = createScene();

    // 2. Camera
    const camera = createCamera();

    // 3. Renderer
    const renderer = createRenderer(canvas);

    // 4. (Opsional) Load HDR
    const rgbeLoader = new RGBELoader();
    try {
        const envTexture = await rgbeLoader.loadAsync(HDR_PATH);
        envTexture.mapping = THREE.EquirectangularReflectionMapping;
        setEnvironmentMap(scene, renderer, envTexture);
        console.log("HDR Environment map berhasil dimuat dan diterapkan.");
    } catch (error) {
        console.error("Gagal memuat HDR:", error);
        if (!scene.background) scene.background = new THREE.Color(0x333333); // Fallback jika scene.js tidak set
    }
    
    if (!scene.background && !scene.environment) { // Cek jika HDR juga tidak set environment sbg background
        scene.background = new THREE.Color(0x333333);
    }

    // 5. Lights
    setupLights(scene);

    // 7. Input Controller & FPS Controls
    const inputController = new InputController(canvas);
    inputController.enable();

    // Tentukan ketinggian Y tetap untuk kamera.
    // Karena tidak ada lantai, kita set Y kamera berdasarkan preferensi pandangan.
    const fixedCameraY = 1.7; // Misalnya, tinggi mata rata-rata dari Y=0
    camera.position.set(0, fixedCameraY, 5); // Posisi awal kamera

    const fpsControls = new FPSStyleControls(camera, inputController, fixedCameraY);
    fpsControls.enable();


    // 8. Load 3D Model (Asynchronous)
    try {
        const loadedModel = await loadModel(scene, MODEL_PATH, {
            // Atur posisi model. Jika Anda ingin model "duduk" di Y=0:
            position: { x: 0, y: 0, z: 0 },
            name: "myPlayerModel"
            // scale: { x: 1, y: 1, z: 1 }, // Sesuaikan skala jika perlu
            // rotation: { x: 0, y: 0, z: 0 } // Sesuaikan rotasi jika perlu
        });
        // Tidak ada target orbit controls yang perlu diupdate
    } catch (error) {
        console.error("Gagal memuat model utama:", error);
    }

    // Resize Handler untuk Kamera
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    // Animation Loop
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();

        if (fpsControls && fpsControls.enabled) {
            fpsControls.update(deltaTime);
        }

        renderer.render(scene, camera);
    }

    animate();
}

// Jalankan inisialisasi
init().catch(err => {
    console.error("Initialization failed:", err);
});