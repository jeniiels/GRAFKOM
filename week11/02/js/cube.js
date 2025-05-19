// js/cube.js
import * as THREE from 'three';

export function createCube() {
    // 1. Tentukan geometri dasar untuk bentuk kubus
    const boxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); // Ukuran kubus

    // 2. Buat EdgesGeometry dari geometri dasar
    // Ini akan menghasilkan data garis untuk semua rusuk dari boxGeometry
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);

    // 3. Buat material untuk garis (rusuk)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 }); // Warna hijau untuk rusuk

    // 4. Buat LineSegments menggunakan edgesGeometry dan lineMaterial
    // LineSegments digunakan untuk menggambar serangkaian garis yang tidak terhubung
    // (dalam kasus EdgesGeometry, garis-garis ini membentuk rusuk)
    const cubeEdges = new THREE.LineSegments(edgesGeometry, lineMaterial);

    // Set posisi jika perlu (meskipun defaultnya sudah di (0,0,0))
    // cubeEdges.position.set(0, 0, 0);

    return cubeEdges; // Kembalikan objek rusuk
}