// js/lights.js
import * as THREE from 'three';

export function setupLights(scene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Intensitas mungkin perlu disesuaikan
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Intensitas mungkin perlu disesuaikan
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096; // Shadow map lebih besar untuk kualitas
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);

    // const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
    // scene.add(dirLightHelper);
    // const dirLightShadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(dirLightShadowHelper);
}