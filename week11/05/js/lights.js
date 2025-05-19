// js/lights.js
import * as THREE from 'three';

export function createLights() {
    const lights = [];
    const helpers = []; // Array untuk menyimpan helper

    // Cahaya ambient untuk menerangi semua objek secara merata
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Kurangi intensitas ambient sedikit
    lights.push(ambientLight);

    // Cahaya directional untuk memberikan bayangan dan highlight
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Kurangi intensitas directional sedikit
    directionalLight.position.set(5, 10, 7.5);

    // --- Pengaturan Shadow untuk DirectionalLight ---
    directionalLight.castShadow = true; // Cahaya ini akan menghasilkan bayangan

    // Konfigurasi kamera shadow (area yang dicakup oleh bayangan)
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;

    // Konfigurasi ukuran peta bayangan (resolusi bayangan)
    // Nilai lebih tinggi = kualitas lebih baik, tapi lebih berat
    directionalLight.shadow.mapSize.width = 2048; // Default 512
    directionalLight.shadow.mapSize.height = 2048; // Default 512

    // Bias untuk mencegah shadow acne (artifak pada permukaan sendiri)
    directionalLight.shadow.bias = -0.001; // Coba sesuaikan nilai ini jika ada shadow acne

    lights.push(directionalLight);

    // --- Helper untuk DirectionalLight ---
    const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 2, 0xffff00); // Ukuran helper 2, warna kuning
    helpers.push(directionalLightHelper)

    // Helper untuk shadow camera (opsional, untuk debugging frustum shadow)
    // const shadowCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // helpers.push(shadowCameraHelper);


    // Anda bisa menambahkan cahaya lain jika perlu, misalnya PointLight
    // const pointLight = new THREE.PointLight(0xff9000, 0.8, 50, 0.5);
    // pointLight.position.set(-3, 3, 3);
    // pointLight.castShadow = true;
    // pointLight.shadow.mapSize.width = 1024;
    // pointLight.shadow.mapSize.height = 1024;
    // lights.push(pointLight);
    // const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.5);
    // helpers.push(pointLightHelper);


    return { lights, helpers }; // Kembalikan objek berisi array lights dan helpers
}