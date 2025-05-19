// js/objects.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Fungsi pembantu untuk memuat model GLB
function loadGLBModel(scene, interactableObjects, path, options) {
    const loader = new GLTFLoader();
    loader.load(
        path,
        function (gltf) {
            const model = gltf.scene;

            // --- PENGATURAN POSISI, ROTASI, SKALA MODEL ---
            if (options.position) model.position.set(options.position.x, options.position.y, options.position.z);
            if (options.rotation) model.rotation.set(options.rotation.x, options.rotation.y, options.rotation.z);
            if (options.scale) model.scale.set(options.scale.x, options.scale.y, options.scale.z);
            // --- AKHIR PENGATURAN ---

            model.name = options.name || "glbModel"; // Beri nama default jika tidak ada

            // Aktifkan shadow untuk semua mesh di dalam model
            model.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true; // Opsional, jika model bisa menerima bayangan dari bagian lain dirinya
                    
                    // Simpan warna asli jika materialnya memiliki warna
                    if (child.material && child.material.color) {
                        // Jika kita ingin setiap child bisa di-raycast individual,
                        // kita perlu menambahkan child ke interactableObjects dan menangani originalColor-nya.
                        // Untuk kesederhanaan, kita anggap model adalah satu kesatuan untuk raycasting,
                        // dan kita akan mengubah warna material pertama yang ditemukan atau semua material.
                        // Untuk contoh ini, kita akan coba ubah warna material pertama yang ditemukan.
                        if (!model.userData.originalMaterialColor && child.material.color) {
                             model.userData.originalMaterialColor = child.material.color.clone();
                        }
                    }
                }
            });
             // Jika tidak ada originalMaterialColor yang diset dari child, coba set dari material model utama (jika ada)
            if (!model.userData.originalMaterialColor && model.material && model.material.color) {
                model.userData.originalMaterialColor = model.material.color.clone();
            }


            scene.add(model);
            if (interactableObjects && options.isInteractable !== false) { // Tambahkan ke interaktif jika diminta
                interactableObjects.push(model);
            }

            console.log(`Model ${path} berhasil dimuat dan ditambahkan ke scene.`);
            if (options.onLoad) options.onLoad(model); // Callback jika perlu
        },
        undefined, // onProgress callback (opsional)
        function (error) {
            console.error(`Error memuat model ${path}:`, error);
            if (options.onError) options.onError(error); // Callback jika perlu
        }
    );
}


export function createAllObjects(scene, interactableObjects, onAllModelsLoadedCallback) {
    const objects = {}; // Kita mungkin tidak banyak menggunakan ini lagi jika fokus ke model

    // Warna default untuk objek geometris dasar
    const defaultSphereColor = 0xff0000; // Merah
    const defaultPyramidColor = 0x0000ff; // Biru
    const defaultPlaneColor = 0x888888; // Abu-abu

    // 1. Create Plane (Lantai)
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: defaultPlaneColor,
        roughness: 1.0,
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    objects.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    objects.plane.name = "plane";
    objects.plane.rotation.x = -Math.PI / 2;
    const planeY = -1.5; // Definisikan planeY di sini
    objects.plane.position.y = planeY;
    objects.plane.receiveShadow = true;
    scene.add(objects.plane); // Langsung tambahkan plane ke scene


    // --- PENGATURAN MODEL GLB ---
    // Ganti './path/to/your/model.glb' dengan path file GLB Anda.
    // Pastikan file GLB ada di server Anda dan path-nya benar.
    const modelPath = './cat.glb'; // Contoh model
    // const modelPath = './models/nama_model_anda.glb'; // Jika Anda punya model lokal

    loadGLBModel(scene, interactableObjects, modelPath, {
        name: "catModel", // Nama untuk identifikasi
        position: { x: -2.5, y: planeY, z: 0 }, // ATUR POSISI DI SINI
        rotation: { x: 0, y: 0, z: 0 },    // ATUR ROTASI DI SINI (dalam radian)
        scale: { x: 2, y: 2, z: 2 },                  // ATUR SKALA DI SINI
        isInteractable: true, // Apakah model ini bisa di-raycast?
        onLoad: (loadedModel) => {
            // Anda bisa melakukan sesuatu dengan loadedModel di sini jika perlu
            console.log(loadedModel.name + " selesai dimuat dan dikonfigurasi.");
            checkAllModelsLoaded();
        },
        onError: () => {
            checkAllModelsLoaded(); // Tetap panggil ini agar callback utama bisa jalan
        }
    });
    // --- AKHIR PENGATURAN MODEL GLB ---


    // 3. Create Sphere (Tetap ada sebagai contoh objek geometris)
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: defaultSphereColor,
        roughness: 0.2,
        metalness: 0.1
    });
    objects.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    objects.sphere.name = "sphere";
    objects.sphere.userData.originalColor = new THREE.Color(defaultSphereColor);
    objects.sphere.castShadow = true;
    objects.sphere.receiveShadow = true;
    objects.sphere.position.set(0, 1 + planeY, 0);
    scene.add(objects.sphere);
    interactableObjects.push(objects.sphere);


    // 4. Create Pyramid (Tetap ada sebagai contoh objek geometris)
    const pyramidGeometry = new THREE.ConeGeometry(1, 1.5, 4);
    const pyramidMaterial = new THREE.MeshStandardMaterial({
        color: defaultPyramidColor,
        roughness: 0.7,
        metalness: 0.1
    });
    objects.pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    objects.pyramid.name = "pyramid";
    objects.pyramid.userData.originalColor = new THREE.Color(defaultPyramidColor);
    objects.pyramid.geometry.rotateY(Math.PI / 4);
    objects.pyramid.castShadow = true;
    objects.pyramid.receiveShadow = true;
    objects.pyramid.position.set(2.5, (1.5 / 2) + planeY, 0);
    scene.add(objects.pyramid);
    interactableObjects.push(objects.pyramid);

    // Logika untuk menandai bahwa semua model yang dijadwalkan telah "dicoba" dimuat
    // Ini sederhana, jika ada banyak model, Anda perlu sistem yang lebih canggih.
    let modelsToLoad = 1; // Jumlah model GLB yang kita coba muat
    let modelsLoadedAttempted = 0;
    function checkAllModelsLoaded() {
        modelsLoadedAttempted++;
        if (modelsLoadedAttempted >= modelsToLoad) {
            if (onAllModelsLoadedCallback) {
                onAllModelsLoadedCallback();
            }
        }
    }
    // Jika tidak ada model GLB yang dimuat, panggil callback langsung
    if (modelsToLoad === 0) {
         if (onAllModelsLoadedCallback) {
            onAllModelsLoadedCallback();
        }
    }


    return objects; // Kembalikan objek geometris dasar (jika masih ada)
}