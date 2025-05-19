// js/lights.js
import * as THREE from 'three';

export function setupLights(scene) {
    // Cahaya Ambient
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Cahaya Directional (Matahari)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(10, 15, 10); // Atur posisi cahaya
    directionalLight.castShadow = true;

    // Konfigurasi shadow untuk directional light
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.001;

    scene.add(directionalLight);

    // Helper untuk directional light (opsional, untuk debugging)
    // const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
    // scene.add(dirLightHelper);
    // const dirLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(dirLightShadowHelper);

    // Anda bisa menambahkan HemisphereLight untuk pencahayaan environment yang lebih lembut
    // const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
    // scene.add(hemisphereLight);
}