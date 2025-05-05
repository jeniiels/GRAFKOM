// --- Konten yang seharusnya ada di script.js ---

        // Tunggu DOM siap
        document.addEventListener('DOMContentLoaded', () => {
            const canvas = document.getElementById('raytraceCanvas');
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            // Dapatkan data pixel canvas untuk manipulasi langsung
            const imageData = ctx.createImageData(width, height);
            const data = imageData.data; // Array [R, G, B, A, R, G, B, A, ...]

            // Definisi Scene
            const sphereCenter = vec3.fromValues(0, 0, -5); // Tengah layar, sedikit ke dalam sumbu Z negatif
            const sphereRadius = 1.5; // Radius bola
            const sphereColor = [255, 0, 0, 255]; // Merah (RGBA)
            const backgroundColor = [100, 149, 237, 255]; // Cornflower Blue (RGBA)

            // Definisi Kamera (Sederhana)
            const cameraOrigin = vec3.fromValues(0, 0, 0); // Kamera di origin

            // Mulai Raytracing
            console.time("Raytracing Render"); // Ukur waktu render

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {

                    // 1. Konversi koordinat pixel (x, y) ke koordinat viewport
                    //    Viewport -1 sampai +1 untuk X dan Y (Y terbalik)
                    const viewportX = (x / width) * 2 - 1;
                    const viewportY = 1 - (y / height) * 2; // Y terbalik karena canvas Y=0 di atas

                    // 2. Hitung arah Ray
                    //    Ray dari cameraOrigin menuju titik di viewport pada Z=-1 (view plane sederhana)
                    const rayDirectionRaw = vec3.fromValues(viewportX, viewportY, -1);
                    const rayDirection = vec3.create();
                    vec3.normalize(rayDirection, rayDirectionRaw); // Normalisasi arah ray

                    // 3. Cek Intersection
                    const hit = intersectSphere(cameraOrigin, rayDirection, sphereCenter, sphereRadius);

                    // 4. Tentukan Warna Pixel
                    const pixelIndex = (y * width + x) * 4; // Index awal untuk pixel (x, y) di array data
                    let colorToUse;

                    if (hit) {
                        colorToUse = sphereColor; // Kena bola -> warna bola
                    } else {
                        colorToUse = backgroundColor; // Tidak kena -> warna background
                    }

                    // 5. Set warna pixel di ImageData
                    data[pixelIndex]     = colorToUse[0]; // R
                    data[pixelIndex + 1] = colorToUse[1]; // G
                    data[pixelIndex + 2] = colorToUse[2]; // B
                    data[pixelIndex + 3] = colorToUse[3]; // A
                }
            }

            // 6. Gambar ImageData ke Canvas
            ctx.putImageData(imageData, 0, 0);

            console.timeEnd("Raytracing Render"); // Selesai ukur waktu
            console.log("Raytracing selesai.");
        });

        // --- Akhir Konten script.js ---