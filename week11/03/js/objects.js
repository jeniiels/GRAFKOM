// js/objects.js
import * as THREE from 'three';

export function createAllObjects() {
    const objects = {};

    // 1. Load Texture
    const textureLoader = new THREE.TextureLoader();

    // =======================================================================
    // == PENTING: GANTI DENGAN PATH KE FILE GAMBAR TEKSTUR ANDA ==
    // == Contoh:
    // == const textureUrl = './nama_gambar_anda.jpg'; // Jika gambar di root folder
    // == const textureUrl = 'textures/nama_gambar_anda.png'; // Jika gambar di folder 'textures'
    // =======================================================================
    const textureUrl = './uv_texture_mapping.png'; // << GANTI INI!

    const sharedTexture = textureLoader.load(
        textureUrl,
        // onLoad callback (opsional)
        function (texture) {
            console.log('Tekstur berhasil dimuat:', textureUrl);
            // Atur color space setelah tekstur dimuat
            texture.colorSpace = THREE.SRGBColorSpace;
            // Atur wrapping jika diperlukan (misalnya, jika tekstur akan di-tile)
            texture.wrapS = THREE.RepeatWrapping; // Ulangi secara horizontal
            texture.wrapT = THREE.RepeatWrapping; // Ulangi secara vertikal
        },
        // onProgress callback (opsional)
        undefined,
        // onError callback (opsional)
        function (err) {
            console.error('Gagal memuat tekstur:', textureUrl, err);
            // Anda bisa fallback ke warna solid atau tekstur default di sini jika mau
        }
    );


    // 2. Create Plane (Lantai)
    // Shininess 0 -> roughness: 1.0 (sangat kasar/tidak berkilau)
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({
        map: sharedTexture,
        roughness: 1.0, // Shininess 0
        metalness: 0.0, // Non-metalik
        side: THREE.DoubleSide
    });
    objects.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    objects.plane.rotation.x = -Math.PI / 2;
    objects.plane.position.y = -1.5;


    // 3. Create Cube (Material emisi, tidak ada terang gelap)
    // MeshBasicMaterial tidak dipengaruhi oleh cahaya dan tidak memiliki properti roughness/shininess
    const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const cubeMaterial = new THREE.MeshBasicMaterial({ map: sharedTexture });
    objects.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    objects.cube.position.set(-2.5, 0, 0);


    // 4. Create Sphere
    // Shininess bola lebih kecil -> roughness lebih BESAR
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        map: sharedTexture,
        roughness: 0.2, // Shininess kecil, contoh: 0.7 - 0.9 (0.0 = sangat berkilau, 1.0 = sangat kasar)
        metalness: 0.1  // Sedikit metalik bisa membantu menunjukkan perbedaan roughness
    });
    objects.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    objects.sphere.position.set(0, 0.25, 0);


    // 5. Create Pyramid (Limas Segi Empat)
    // Shininess limas lebih besar -> roughness lebih KECIL
    const pyramidGeometry = new THREE.ConeGeometry(1, 1.5, 4); // Radius dasar 1, tinggi 1.5, 4 sisi
    const pyramidMaterial = new THREE.MeshStandardMaterial({
        map: sharedTexture,
        roughness: 0.3, // Shininess besar, contoh: 0.1 - 0.3
        metalness: 0.1  // Sedikit metalik
    });
    objects.pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    objects.pyramid.position.set(2.5, 0, 0);
    objects.pyramid.geometry.rotateY(Math.PI / 4); // Opsional: Putar alas agar sejajar sumbu

    return objects;
}