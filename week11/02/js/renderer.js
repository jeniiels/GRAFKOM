// js/renderer.js
import * as THREE from 'three';

export function createRenderer(canvasElement) {
    const renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        antialias: true // Aktifkan antialiasing untuk tepi yang lebih halus
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Atur pixel ratio untuk tampilan yang lebih tajam di layar HiDPI
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    return renderer;
}