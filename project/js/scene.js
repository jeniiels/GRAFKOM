// js/scene.js
import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();
    // scene.background akan diatur oleh HDR di main.js
    // scene.fog = new THREE.Fog(0x333333, 10, 50); // Fog mungkin tidak terlalu terlihat dengan HDR
    return scene;
}

// Fungsi opsional untuk membantu mengatur environment map jika dipanggil dari main.js
export function setEnvironmentMap(scene, renderer, texture) {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromEquirectangular(texture).texture;

    scene.environment = envMap; // Untuk refleksi pada material PBR
    scene.background = envMap; // Untuk background scene (jika diinginkan)
    // Atau jika ingin background blur:
    // scene.backgroundBlurriness = 0.5; // Nilai antara 0 dan 1
    // scene.backgroundIntensity = 1.0; // Intensitas background

    texture.dispose(); // Buang tekstur asli karena kita sudah punya envMap
    pmremGenerator.dispose();
}