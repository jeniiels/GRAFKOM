// js/renderer.js
import * as THREE from 'three';

export function createRenderer(canvasElement) {
    const renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.useLegacyLights = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Aktifkan shadow map
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Jenis shadow map, PCFSoftShadowMap memberikan bayangan yang lebih lembut

    return renderer;
}