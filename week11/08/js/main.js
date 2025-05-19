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
    camera.position.set(0, 2.5, 9);
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

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let intersectedObjectForHover = null;
    const interactableObjects = [];

    // --- State Animasi Model ---
    let animatedModel = {
        object: null,         // Referensi ke model yang dianimasikan
        isAnimating: false,
        initialYRotation: 0,  // Rotasi Y saat animasi dimulai
        targetYRotation: 0,   // Rotasi Y target untuk berhenti (setelah satu putaran)
        justStarted: false    // Flag untuk memastikan animasi berjalan setidaknya sedikit
    };

    // Fungsi hover warna (tetap sama)
    function onMouseMove(event) {
        // ... (kode onMouseMove dari sebelumnya, tidak perlu diubah) ...
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactableObjects, true);

        if (intersects.length > 0) {
            let newIntersected = intersects[0].object;
            let targetObjectForColor = newIntersected;
            while(targetObjectForColor.parent && !targetObjectForColor.userData.originalMaterialColor && !targetObjectForColor.userData.originalColor) {
                if (targetObjectForColor.parent !== scene) {
                    targetObjectForColor = targetObjectForColor.parent;
                } else { break; }
            }

            if (intersectedObjectForHover !== targetObjectForColor) {
                if (intersectedObjectForHover) {
                    let originalColorToRestore = intersectedObjectForHover.userData.originalColor || intersectedObjectForHover.userData.originalMaterialColor;
                    if (originalColorToRestore) {
                        if (intersectedObjectForHover.isGroup || intersectedObjectForHover.isScene || !intersectedObjectForHover.material) {
                             intersectedObjectForHover.traverse(child => {
                                if (child.isMesh && child.material && child.material.color && child.userData.originalColorForThisMesh) {
                                    child.material.color.set(child.userData.originalColorForThisMesh);
                                } else if (child.isMesh && child.material && child.material.color && originalColorToRestore) {
                                    child.material.color.set(originalColorToRestore);
                                }
                            });
                        } else if (intersectedObjectForHover.material && intersectedObjectForHover.material.color) {
                             intersectedObjectForHover.material.color.set(originalColorToRestore);
                        }
                    }
                }
                intersectedObjectForHover = targetObjectForColor;
                let colorToChange = intersectedObjectForHover.userData.originalColor || intersectedObjectForHover.userData.originalMaterialColor;
                 if (colorToChange) {
                     const randomColor = new THREE.Color(Math.random(), Math.random(), Math.random());
                     if (intersectedObjectForHover.isGroup || intersectedObjectForHover.isScene || !intersectedObjectForHover.material) {
                         intersectedObjectForHover.traverse(child => {
                            if (child.isMesh && child.material && child.material.color) {
                                if (!child.userData.originalColorForThisMesh) {
                                    child.userData.originalColorForThisMesh = child.material.color.clone();
                                }
                                child.material.color.set(randomColor);
                            }
                        });
                    } else if (intersectedObjectForHover.material && intersectedObjectForHover.material.color) {
                         intersectedObjectForHover.material.color.set(randomColor);
                    }
                }
            }
        } else {
            if (intersectedObjectForHover) {
                let originalColorToRestore = intersectedObjectForHover.userData.originalColor || intersectedObjectForHover.userData.originalMaterialColor;
                if (originalColorToRestore) {
                    if (intersectedObjectForHover.isGroup || intersectedObjectForHover.isScene || !intersectedObjectForHover.material) {
                         intersectedObjectForHover.traverse(child => {
                            if (child.isMesh && child.material && child.material.color && child.userData.originalColorForThisMesh) {
                                child.material.color.set(child.userData.originalColorForThisMesh);
                            } else if (child.isMesh && child.material && child.material.color && originalColorToRestore) {
                                child.material.color.set(originalColorToRestore);
                            }
                        });
                    } else if (intersectedObjectForHover.material && intersectedObjectForHover.material.color) {
                        intersectedObjectForHover.material.color.set(originalColorToRestore);
                    }
                }
            }
            intersectedObjectForHover = null;
        }
    }
    window.addEventListener('mousemove', onMouseMove, false);


    function onClick(event) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        // Ganti "helmetModel" dengan nama model Anda jika berbeda (misalnya "catModel")
        const modelToInteract = interactableObjects.find(obj => obj.name === "helmetModel" || obj.name === "catModel");

        if (modelToInteract) {
            const intersects = raycaster.intersectObject(modelToInteract, true);

            if (intersects.length > 0) {
                console.log(modelToInteract.name + " diklik!");

                if (animatedModel.isAnimating && animatedModel.object === modelToInteract) {
                    // Jika sedang beranimasi dan diklik lagi, hentikan segera (opsional)
                    // atau biarkan menyelesaikan putaran. Untuk sekarang, kita toggle.
                    animatedModel.isAnimating = false;
                    animatedModel.object = null;
                    console.log("Menghentikan animasi " + modelToInteract.name + " secara manual.");
                } else if (!animatedModel.isAnimating) {
                    // Mulai animasi
                    animatedModel.object = modelToInteract;
                    animatedModel.isAnimating = true;
                    animatedModel.initialYRotation = modelToInteract.rotation.y;
                    // Target: kembali ke initialYRotation setelah setidaknya satu putaran.
                    // Agar berhenti tepat, kita bisa menargetkan initialYRotation + kelipatan 2*PI
                    // Namun, karena rotasi bisa > 2*PI, kita normalisasi dulu
                    const currentNormalizedRotation = animatedModel.initialYRotation % (2 * Math.PI);
                    // Target adalah kembali ke nilai normalisasi ini, tapi pastikan target > initial
                    animatedModel.targetYRotation = animatedModel.initialYRotation + (2 * Math.PI) - currentNormalizedRotation + (currentNormalizedRotation < 0 ? 2*Math.PI : 0) ;
                    // Atau jika ingin selalu kembali ke rotasi 0 absolut setelah 1 putaran dari kondisi saat ini:
                    // animatedModel.targetYRotation = modelToInteract.rotation.y + (2 * Math.PI) - (modelToInteract.rotation.y % (2 * Math.PI));

                    animatedModel.justStarted = true; // Tandai animasi baru dimulai
                    console.log(`Memulai animasi ${modelToInteract.name}. Initial Y: ${animatedModel.initialYRotation.toFixed(2)}, Target Y: ${animatedModel.targetYRotation.toFixed(2)}`);
                }
            }
        }
    }
    window.addEventListener('click', onClick, false);

    console.log("Memulai pemuatan objek...");
    createAllObjects(scene, interactableObjects, () => {
        console.log("Semua model telah dicoba dimuat. Memulai loop animasi.");
        console.log("Interactable objects:", interactableObjects);

        setupResizeHandler(camera, renderer);
        // Teruskan seluruh objek animatedModel ke loop animasi
        startAnimationLoop(scene, camera, renderer, controls, animatedModel);
    });
}