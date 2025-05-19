// js/main.js
import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { createCube } from './cube.js';
import { setupResizeHandler } from './resize.js';
import { startAnimationLoop } from './animation.js';

// Dapatkan elemen canvas dari HTML
const canvas = document.getElementById('three-canvas');
if (!canvas) {
    console.error("Elemen canvas dengan id 'three-canvas' tidak ditemukan.");
    // Hentikan eksekusi jika canvas tidak ada
} else {
    // 1. Buat Scene
    const scene = createScene();

    // 2. Buat Kamera
    const camera = createCamera();
    scene.add(camera); // Tambahkan kamera ke scene (opsional, tapi praktik yang baik)

    // 3. Buat Renderer
    const renderer = createRenderer(canvas);

    // 4. Buat Objek (Kubus)
    const cube = createCube();
    scene.add(cube); // Tambahkan kubus ke scene

    // 5. Setup Penanganan Resize
    setupResizeHandler(camera, renderer);

    // 6. Mulai Loop Animasi
    // Kirim objek yang ingin dianimasikan ke dalam array
    startAnimationLoop(scene, camera, renderer, [cube]);

    // Render awal (opsional, karena loop animasi akan melakukannya)
    // renderer.render(scene, camera);
}