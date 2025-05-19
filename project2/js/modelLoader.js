// js/modelLoader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'; // Uncomment jika pakai DRACO

export function loadModel(scene, modelPath, options = {}) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();

        // const dracoLoader = new DRACOLoader(); // Uncomment jika pakai DRACO
        // dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        // loader.setDRACOLoader(dracoLoader);

        loader.load(
            modelPath,
            (gltf) => {
                // ... (logika pengaturan model tetap sama) ...
                const model = gltf.scene;
                model.position.set(options.position?.x || 0, options.position?.y || 0, options.position?.z || 0);
                model.rotation.set(options.rotation?.x || 0, options.rotation?.y || 0, options.rotation?.z || 0);
                model.scale.set(options.scale?.x || 1, options.scale?.y || 1, options.scale?.z || 1);
                model.name = options.name || "loadedModel";
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(model);
                console.log(`Model "${model.name}" dari ${modelPath} berhasil dimuat.`);
                resolve(model);
            },
            (xhr) => { // onProgress callback
                if (options.onProgress) {
                    const percentLoaded = (xhr.loaded / xhr.total) * 100;
                    options.onProgress(percentLoaded);
                }
                // console.log(`${modelPath}: ${percentLoaded.toFixed(2)}% loaded`);
            },
            (error) => {
                console.error(`Error memuat model ${modelPath}:`, error);
                reject(error);
            }
        );
    });
}