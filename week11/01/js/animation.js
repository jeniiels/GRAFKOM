// js/animation.js
export function startAnimationLoop(scene, camera, renderer, objectsToAnimate) {
    const clock = { elapsedTime: 0 }; // Bisa menggunakan THREE.Clock jika perlu delta time

    function animate() {
        requestAnimationFrame(animate);

        // Perbarui elapsedTime (sederhana, bisa diganti THREE.Clock)
        clock.elapsedTime += 0.016; // Asumsi 60 FPS

        // Animasikan objek
        objectsToAnimate.forEach(obj => {
            if (obj && obj.rotation) { // Pastikan objek ada dan memiliki properti rotasi
                obj.rotation.x += 0.005;
                obj.rotation.y += 0.008;
                // obj.rotation.z += 0.003;
            }
        });

        // Render scene dengan kamera
        renderer.render(scene, camera);
    }

    animate(); // Mulai loop animasi
}