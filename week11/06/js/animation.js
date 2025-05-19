// js/animation.js
export function startAnimationLoop(scene, camera, renderer, controls) { // Tambahkan controls
    function animate() {
        requestAnimationFrame(animate);

        // Update OrbitControls jika ada dan damping diaktifkan
        if (controls && controls.enabled) {
            controls.update();
        }

        // Tidak ada lagi animasi objek manual di sini

        renderer.render(scene, camera);
    }

    animate();
}