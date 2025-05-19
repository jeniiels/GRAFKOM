// js/resize.js
export function setupResizeHandler(camera, renderer) {
    window.addEventListener('resize', () => {
        // Update ukuran renderer
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Update aspek rasio kamera
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix(); // Penting setelah mengubah properti kamera
    });
}