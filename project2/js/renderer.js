// js/renderer.js
import * as THREE from 'three';

export function createRenderer(canvasElement) {
    const renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Pengaturan untuk warna dan pencahayaan yang lebih akurat
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Tone mapping yang baik
    renderer.toneMappingExposure = 1.0;

    // Aktifkan shadow map
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Handle window resize
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        // Kamera juga perlu diupdate aspek rasionya, akan ditangani di main.js atau camera.js
    });

    return renderer;
}