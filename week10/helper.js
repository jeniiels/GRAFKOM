// --- Konten yang seharusnya ada di helper.js ---

        // Menggunakan alias agar lebih mudah dibaca
        const vec3 = glMatrix.vec3;

        /**
         * Menghitung intersection antara ray dan sphere.
         * Mengembalikan true jika ada intersection di depan ray origin, false jika tidak.
         * @param {vec3} rayOrigin - Titik asal ray.
         * @param {vec3} rayDirection - Arah ray (harus normalized).
         * @param {vec3} sphereCenter - Pusat bola.
         * @param {number} sphereRadius - Radius bola.
         * @returns {boolean} - True jika ada intersection valid.
         */
        function intersectSphere(rayOrigin, rayDirection, sphereCenter, sphereRadius) {
            const L = vec3.create();
            vec3.subtract(L, sphereCenter, rayOrigin); // Vektor dari origin ray ke pusat sphere

            const tca = vec3.dot(L, rayDirection); // Proyeksi L ke arah ray

            // Jika tca < 0, sphere berada di belakang ray origin,
            // tapi masih mungkin intersect jika origin di dalam sphere.
            // Untuk demo sederhana ini, kita abaikan intersection di belakang.
            // if (tca < 0) return false; // Opsi: Abaikan jika pusat sphere di belakang

            const d2 = vec3.dot(L, L) - tca * tca; // Jarak kuadrat dari pusat sphere ke garis ray
            const radius2 = sphereRadius * sphereRadius;

            if (d2 > radius2) {
                return false; // Ray melewati sphere (tidak ada intersection)
            }

            // Hitung t (jarak) ke intersection point.
            // Kita perlu memastikan intersection terjadi di depan origin ray (t >= 0)
            const thc = Math.sqrt(radius2 - d2);
            const t0 = tca - thc; // Jarak ke intersection terdekat
            const t1 = tca + thc; // Jarak ke intersection terjauh

            // Jika kedua t negatif, intersection di belakang origin
            if (t0 < 0 && t1 < 0) {
                return false;
            }

            // Jika t0 negatif tapi t1 positif, origin ray ada di dalam sphere
            // Intersection valid ada di t1.
            // Jika keduanya positif, intersection valid terdekat ada di t0.
            // Cukup return true karena kita hanya butuh info ada/tidaknya intersection
            return true;
        }

        // --- Akhir Konten helper.js ---