// js/animation.js
import * as THREE from 'three';

let clock; // Deklarasi di scope modul

export function startAnimationLoop(scene, camera, renderer, controlsInstance) {
    // Pastikan clock diinisialisasi HANYA SEKALI
    if (!clock) {
        clock = new THREE.Clock();
        console.log("Clock initialized in animation.js"); // Tambahkan log ini
    }

    function animate() {
        requestAnimationFrame(animate);

        // Dapatkan deltaTime DI DALAM loop animate
        const deltaTime = clock.getDelta();

        // Log deltaTime untuk memastikan nilainya benar
        // console.log("DeltaTime in animate:", deltaTime); // Uncomment untuk debug

        if (controlsInstance && controlsInstance.enabled && typeof controlsInstance.update === 'function') {
            // Pastikan deltaTime diteruskan ke controlsInstance.update
            controlsInstance.update(deltaTime);
        } else {
            // Log jika kontrol tidak diupdate
            // if (controlsInstance && !controlsInstance.enabled) console.log("Controls not enabled");
            // if (controlsInstance && typeof controlsInstance.update !== 'function') console.log("Controls.update is not a function");
        }

        renderer.render(scene, camera);
    }
    animate(); // Mulai loop
}