// js/modelLoader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'; // <-- Impor DRACOLoader

// Inisialisasi DRACOLoader sekali saja untuk efisiensi (jika akan banyak memuat model DRACO)
// atau bisa dibuat di dalam fungsi loadGLB jika hanya dipakai di sana.
// Untuk sekarang, kita buat instance baru setiap kali loadGLB dipanggil,
// tapi Anda bisa mengoptimalkannya dengan membuat satu instance global jika perlu.

export function loadGLB(scene, modelPath, options = {}) {
    return new Promise((resolve, reject) => {
        const gltfLoader = new GLTFLoader(); // Ganti nama variabel agar tidak bentrok dengan impor

        // --- Setup DRACOLoader ---
        const dracoLoader = new DRACOLoader();
        // Anda PERLU menyediakan path ke folder yang berisi file decoder DRACO.
        // Three.js menyediakan file-file ini di dalam examples/jsm/libs/draco/gltf/
        // atau Anda bisa menggunakan CDN.
        //
        // Opsi 1: Menggunakan CDN (paling mudah untuk memulai)
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        //
        // Opsi 2: Path lokal jika Anda sudah menyalin folder draco ke proyek Anda
        // (misalnya, Anda menyalin folder 'draco' dari three.js/examples/jsm/libs/
        //  ke dalam folder 'js/libs/' di proyek Anda)
        // dracoLoader.setDecoderPath('./js/libs/draco/gltf/');
        //
        // Penting: Pastikan path ini benar dan file decoder (draco_decoder.wasm, draco_wasm_wrapper.js) bisa diakses.
        dracoLoader.setDecoderConfig({ type: 'js' }); // Bisa 'js' atau 'wasm'. 'js' lebih kompatibel.
                                                  // 'wasm' biasanya lebih cepat tapi perlu setup server yang benar untuk .wasm

        gltfLoader.setDRACOLoader(dracoLoader); // Beritahu GLTFLoader untuk menggunakan DRACOLoader ini
        // --- Akhir Setup DRACOLoader ---

        gltfLoader.load(modelPath,
            (gltf) => {
                const model = gltf.scene;
                model.position.set(options.position?.x || 0, options.position?.y || 0, options.position?.z || 0);
                model.rotation.set(options.rotation?.x || 0, options.rotation?.y || 0, options.rotation?.z || 0);
                model.scale.set(options.scale?.x || 1, options.scale?.y || 1, options.scale?.z || 1);
                model.name = options.name || "glbModel";

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                scene.add(model);
                console.log(`GLB Model (DRACO) "${model.name}" dari ${modelPath} berhasil dimuat.`);
                resolve(model);
            },
            options.onProgress,
            (error) => {
                console.error(`Error memuat GLB model ${modelPath} (mungkin masalah DRACO):`, error);
                reject(error);
            }
        );
    });
}

export function loadFBX(scene, modelPath, options = {}) {
    // ... (fungsi loadFBX tetap sama seperti sebelumnya) ...
    return new Promise((resolve, reject) => {
        const loader = new FBXLoader();
        loader.load(modelPath,
            (fbx) => {
                const model = fbx;
                model.position.set(options.position?.x || 0, options.position?.y || 0, options.position?.z || 0);
                model.rotation.set(options.rotation?.x || 0, options.rotation?.y || 0, options.rotation?.z || 0);
                model.scale.set(options.scale?.x || 0.01, options.scale?.y || 0.01, options.scale?.z || 0.01);
                model.name = options.name || "fbxModel";
                let mixer = null;
                if (fbx.animations && fbx.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(model);
                }
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(model);
                console.log(`FBX Model "${model.name}" dari ${modelPath} berhasil dimuat.`);
                resolve({ model, mixer, animations: fbx.animations });
            },
            options.onProgress,
            (error) => {
                console.error(`Error memuat FBX model ${modelPath}:`, error);
                reject(error);
            }
        );
    });
}