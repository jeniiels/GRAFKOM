// js/environmentLoader.js
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export async function loadEnvironment(scene, renderer, hdrPath) {
    const rgbeLoader = new RGBELoader();
    try {
        const texture = await rgbeLoader.loadAsync(hdrPath);
        texture.mapping = THREE.EquirectangularReflectionMapping;

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.environment = envMap;
        scene.background = envMap;
        // scene.backgroundBlurriness = 0.1; // Opsional: sedikit blur pada background
        // scene.backgroundIntensity = 0.8; // Opsional: atur intensitas background

        texture.dispose();
        pmremGenerator.dispose();
        console.log("HDR Environment map berhasil dimuat dan diterapkan.");
        return true;
    } catch (error) {
        console.error("Gagal memuat HDR:", error);
        scene.background = new THREE.Color(0x222233); // Fallback warna solid
        return false;
    }
}