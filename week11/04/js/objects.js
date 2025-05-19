// js/objects.js
import * as THREE from 'three';

export function createAllObjects() {
    const objects = {};

    const textureLoader = new THREE.TextureLoader();
    const textureUrl = './uv_texture_mapping.png'; // PASTIKAN PATH INI BENAR

    const sharedTexture = textureLoader.load(
        textureUrl,
        (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
        },
        undefined,
        (err) => console.error('Gagal memuat tekstur:', textureUrl, err)
    );

    // 2. Create Plane (Lantai)
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({
        map: sharedTexture,
        roughness: 1.0,
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    objects.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    objects.plane.rotation.x = -Math.PI / 2;
    objects.plane.position.y = -1.5;
    objects.plane.receiveShadow = true; // Lantai menerima bayangan
    // objects.plane.castShadow = false; // Defaultnya false, jadi tidak perlu


    // 3. Create Cube
    // MeshBasicMaterial tidak bisa menerima atau menghasilkan bayangan secara realistis.
    // Untuk shadow, kita perlu menggantinya ke MeshStandardMaterial.
    // Jika Anda ingin efek "emisi" tanpa terang gelap DAN bayangan, ini agak rumit.
    // Opsi 1: Tetap MeshBasicMaterial, tidak ada shadow realistis dari/ke kubus.
    // Opsi 2: Ganti ke MeshStandardMaterial agar bisa shadow. Efek emisi bisa disimulasikan
    //         dengan emissive map atau emissive color jika diinginkan, tapi akan tetap dipengaruhi cahaya.
    //         Untuk saat ini, kita akan membuatnya standar agar bisa shadow.
    const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const cubeMaterial = new THREE.MeshStandardMaterial({ // Ganti ke MeshStandardMaterial
        map: sharedTexture,
        roughness: 0.5, // Beri sedikit roughness
        metalness: 0.1
    });
    objects.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    objects.cube.position.set(-2.5, 0, 0); // Naikkan sedikit agar bayangan tidak terpotong
    objects.cube.castShadow = true;    // Kubus menghasilkan bayangan
    objects.cube.receiveShadow = true; // Kubus juga bisa menerima bayangan (opsional)


    // 4. Create Sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        map: sharedTexture,
        roughness: 0.2,
        metalness: 0.1
    });
    objects.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    objects.sphere.position.set(0, 0.25, 0);
    objects.sphere.castShadow = true;    // Bola menghasilkan bayangan
    objects.sphere.receiveShadow = true; // Bola juga bisa menerima bayangan


    // 5. Create Pyramid (Limas Segi Empat)
    const pyramidGeometry = new THREE.ConeGeometry(1, 1.5, 4);
    const pyramidMaterial = new THREE.MeshStandardMaterial({
        map: sharedTexture,
        roughness: 0.2,
        metalness: 0.1
    });
    objects.pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    // Naikkan sedikit agar alas limas tidak tenggelam dan bayangannya terlihat baik
    objects.pyramid.position.set(2.5, (1.5/2) - 1.5 + 0.01, 0); // (tinggi/2) + posisi_plane.y + sedikit_offset
    // objects.pyramid.position.set(2.5, 0, 0); // Posisi lama
    objects.pyramid.geometry.rotateY(Math.PI / 4);
    objects.pyramid.castShadow = true;    // Limas menghasilkan bayangan
    objects.pyramid.receiveShadow = true; // Limas juga bisa menerima bayangan

    // Sesuaikan posisi y objek agar pas di atas plane dan bayangan tidak terpotong
    // Untuk BoxGeometry, titik pivotnya di tengah, jadi y = ukuran_y/2 + posisi_plane.y
    objects.cube.position.y = (1.5 / 2) + objects.plane.position.y;
    // Untuk SphereGeometry, titik pivotnya di tengah, jadi y = radius + posisi_plane.y
    objects.sphere.position.y = 1 + objects.plane.position.y;
    // Untuk ConeGeometry, titik pivotnya di tengah alas, jadi y = tinggi/2 + posisi_plane.y
    objects.pyramid.position.y = (1.5 / 2) + objects.plane.position.y;


    return objects;
}