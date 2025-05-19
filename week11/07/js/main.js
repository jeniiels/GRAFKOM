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
    camera.position.set(0, 2.5, 9); // Mundurkan kamera sedikit lagi untuk model
    scene.add(camera);

    const renderer = createRenderer(canvas);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.5, 0);

    const lightSetup = createLights();
    lightSetup.lights.forEach(light => scene.add(light));
    if (lightSetup.helpers) {
        lightSetup.helpers.forEach(helper => scene.add(helper));
    }

    // --- Raycasting Setup ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let intersectedObject = null;
    const interactableObjects = []; // Definisikan di sini, akan diisi oleh createAllObjects

    function onMouseMove(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactableObjects, true); // Set recursive true untuk model GLB

        if (intersects.length > 0) {
            let newIntersected = intersects[0].object;

            // Jika model GLB, kita mungkin ingin menargetkan parent group-nya
            // atau objek yang memiliki userData.originalMaterialColor
            let targetObjectForColor = newIntersected;
            while(targetObjectForColor.parent && !targetObjectForColor.userData.originalMaterialColor && !targetObjectForColor.userData.originalColor) {
                if (targetObjectForColor.parent !== scene) { // Jangan sampai ke scene
                    targetObjectForColor = targetObjectForColor.parent;
                } else {
                    break;
                }
            }


            if (intersectedObject !== targetObjectForColor) {
                if (intersectedObject) { // Kembalikan warna objek lama
                    let originalColorToRestore = intersectedObject.userData.originalColor || intersectedObject.userData.originalMaterialColor;
                    if (originalColorToRestore) {
                        // Jika model GLB, mungkin perlu traverse untuk mengembalikan semua material
                        if (intersectedObject.isGroup || intersectedObject.isScene || !intersectedObject.material) { // Cek jika ini adalah model group
                             intersectedObject.traverse(child => {
                                if (child.isMesh && child.material && child.material.color && child.userData.originalColorForThisMesh) {
                                    child.material.color.set(child.userData.originalColorForThisMesh);
                                } else if (child.isMesh && child.material && child.material.color && originalColorToRestore) {
                                    // Fallback ke warna utama model jika child tidak punya warna spesifik
                                    child.material.color.set(originalColorToRestore);
                                }
                            });
                        } else if (intersectedObject.material && intersectedObject.material.color) {
                             intersectedObject.material.color.set(originalColorToRestore);
                        }
                    }
                }

                intersectedObject = targetObjectForColor; // Simpan objek baru (bisa jadi parent group dari model)

                // Ubah warna objek baru
                let colorToChange = intersectedObject.userData.originalColor || intersectedObject.userData.originalMaterialColor;
                 if (colorToChange) {
                     const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
                     if (intersectedObject.isGroup || intersectedObject.isScene || !intersectedObject.material) {
                         intersectedObject.traverse(child => {
                            if (child.isMesh && child.material && child.material.color) {
                                // Simpan warna asli child jika belum ada, lalu ubah
                                if (!child.userData.originalColorForThisMesh) {
                                    child.userData.originalColorForThisMesh = child.material.color.clone();
                                }
                                child.material.color.set(randomColor);
                            }
                        });
                    } else if (intersectedObject.material && intersectedObject.material.color) {
                         intersectedObject.material.color.set(randomColor);
                    }
                }
            }
        } else {
            if (intersectedObject) { // Kembalikan warna objek terakhir
                let originalColorToRestore = intersectedObject.userData.originalColor || intersectedObject.userData.originalMaterialColor;
                if (originalColorToRestore) {
                    if (intersectedObject.isGroup || intersectedObject.isScene || !intersectedObject.material) {
                         intersectedObject.traverse(child => {
                            if (child.isMesh && child.material && child.material.color && child.userData.originalColorForThisMesh) {
                                child.material.color.set(child.userData.originalColorForThisMesh);
                            } else if (child.isMesh && child.material && child.material.color && originalColorToRestore) {
                                child.material.color.set(originalColorToRestore);
                            }
                        });
                    } else if (intersectedObject.material && intersectedObject.material.color) {
                        intersectedObject.material.color.set(originalColorToRestore);
                    }
                }
            }
            intersectedObject = null;
        }
    }
    window.addEventListener('mousemove', onMouseMove, false);


    // --- Panggil createAllObjects dan mulai animasi setelahnya ---
    // createAllObjects sekarang menerima scene dan interactableObjects secara langsung
    // serta callback untuk menandakan kapan harus memulai hal lain.
    console.log("Memulai pemuatan objek...");
    createAllObjects(scene, interactableObjects, () => {
        console.log("Semua model telah dicoba dimuat. Memulai loop animasi.");
        console.log("Interactable objects:", interactableObjects);

        setupResizeHandler(camera, renderer);
        startAnimationLoop(scene, camera, renderer, controls);
    });
}