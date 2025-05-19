// js/animation.js
import * as THREE from 'three';

let clock;

export function startAnimationLoop(scene, camera, renderer, orbitControls, animState) { // Menerima animState
    if (!clock) {
        clock = new THREE.Clock();
        console.log("Clock initialized in animation.js");
    }

    const rotationSpeed = 1.5; // Kecepatan rotasi dalam radian per detik (sesuaikan)
    const rotationThreshold = 0.05; // Toleransi untuk berhenti (radian)

    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();

        if (orbitControls && orbitControls.enabled) {
            orbitControls.update();
        }

        // Cek dan proses animasi model
        if (animState && animState.object && animState.isAnimating) {
            const model = animState.object;

            // Hitung sisa rotasi ke target
            // Kita perlu menangani normalisasi sudut agar perbandingan benar
            let currentRotationNormalized = model.rotation.y % (2 * Math.PI);
            if (currentRotationNormalized < 0) currentRotationNormalized += (2 * Math.PI);

            let targetRotationNormalized = animState.targetYRotation % (2 * Math.PI);
            if (targetRotationNormalized < 0) targetRotationNormalized += (2 * Math.PI);
            
            // Jika targetnya adalah kembali ke rotasi awal, maka target normalisasinya juga sama dengan initial normalisasi
            let initialRotationNormalized = animState.initialYRotation % (2 * Math.PI);
            if (initialRotationNormalized < 0) initialRotationNormalized += (2 * Math.PI);


            // Jika justStarted, pastikan kita bergerak menjauh dari initial dulu
            if (animState.justStarted) {
                model.rotation.y += rotationSpeed * deltaTime;
                // Setelah bergerak sedikit, matikan flag justStarted
                // Cek apakah sudah cukup jauh dari initial untuk menghindari berhenti prematur
                if (Math.abs(model.rotation.y - animState.initialYRotation) > rotationThreshold * 2) {
                    animState.justStarted = false;
                }
            } else {
                 // Cek apakah sudah mencapai atau melewati target (dengan toleransi)
                 // Ini lebih rumit karena rotasi adalah siklik.
                 // Kita ingin berhenti ketika kita mendekati target DARI ARAH YANG BENAR.

                const remainingRotation = animState.targetYRotation - model.rotation.y;
                
                // Jika kita ingin berhenti di initialYRotation setelah satu putaran:
                // Kita perlu berputar sampai model.rotation.y >= animState.initialYRotation + (2*Math.PI) - epsilon
                // DAN model.rotation.y <= animState.initialYRotation + (2*Math.PI) + epsilon
                // Sederhananya, kita akan berputar, dan jika kita sudah melewati initialYRotation + (sedikit sebelum 2PI)
                // dan mendekati initialYRotation + 2PI, kita set ke target.

                const targetStopRotation = animState.initialYRotation + (2* Math.PI); // Target setelah satu putaran penuh dari initial

                if (model.rotation.y < targetStopRotation - rotationThreshold) {
                     model.rotation.y += rotationSpeed * deltaTime;
                     // Pastikan tidak overshoot terlalu jauh
                     if (model.rotation.y >= targetStopRotation) {
                         model.rotation.y = targetStopRotation; // Snap ke target
                     }
                } else {
                    // Sudah mencapai atau sangat dekat dengan target setelah satu putaran
                    model.rotation.y = targetStopRotation; // Snap ke posisi akhir
                    animState.isAnimating = false;
                    animState.object = null; // Reset object
                    console.log("Animasi selesai, berhenti di rotasi Y:", model.rotation.y.toFixed(2));
                }
            }
        }
        renderer.render(scene, camera);
    }
    animate();
}