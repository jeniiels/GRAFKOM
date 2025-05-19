// js/scene.js
import * as THREE from 'three';

export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222); // Warna latar belakang abu-abu gelap
    return scene;
}