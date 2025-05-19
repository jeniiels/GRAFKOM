// js/main.js
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { createScene, setEnvironmentMap } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { setupLights } from './lights.js';
import { loadModel } from './modelLoader.js';
import { setupOrbitControls } from './orbitControlsHandler.js';

// Konstanta atau Pengaturan Awal
const MODEL_PATH = './assets/models/map.glb';
const HDR_PATH = './assets/hdri/sky.hdr'; 

// Elemen UI Loading
const loadingOverlay = document.getElementById('loading-overlay');
const progressBarElement = document.getElementById('progress-bar');
const loadingMessageElement = document.getElementById('loading-message');
const startButton = document.getElementById('start-button');

let totalAssetsToLoad = 2; // 1 HDR, 1 Model utama
let assetsLoaded = 0;
let currentProgress = 0;

function updateOverallProgress(assetProgress = 0, assetWeight = 1) {
}

function assetDidLoad() {
    assetsLoaded++;
    const progress = (assetsLoaded / totalAssetsToLoad) * 100;
    updateProgressBar(progress);

    if (assetsLoaded >= totalAssetsToLoad) {
        loadingMessageElement.textContent = "Assets loaded! Ready to start.";
        progressBarElement.style.width = '100%';
        progressBarElement.textContent = '100%';
        startButton.style.display = 'block';
    }
}

function updateProgressBar(percentage) {
    currentProgress = Math.min(Math.max(percentage, 0), 100);
    progressBarElement.style.width = currentProgress + '%';
    progressBarElement.textContent = Math.round(currentProgress) + '%';
}

// Simulasi loading jika onProgress tidak cukup atau untuk durasi minimum
let simulatedLoadingInterval;
function simulateLoading() {
    let simulatedProgress = 0;
    const duration = 5000; // 5 detik
    const steps = 100;
    const stepDuration = duration / steps;

    // Hentikan interval jika sudah ada sebelumnya
    if (simulatedLoadingInterval) clearInterval(simulatedLoadingInterval);

    simulatedLoadingInterval = setInterval(() => {
        if (assetsLoaded < totalAssetsToLoad) { // Hanya simulasikan jika aset belum semua termuat
            simulatedProgress += (100 / steps);
            // Hanya update progress bar jika progress simulasi > progress aktual dari loader
            if (simulatedProgress > currentProgress) {
                 updateProgressBar(Math.min(simulatedProgress, 99)); // Jangan sampai 100% sampai aset benar-benar termuat
            }
        } else {
            clearInterval(simulatedLoadingInterval); // Hentikan jika semua aset sudah termuat
        }
        if (simulatedProgress >= 100 && assetsLoaded < totalAssetsToLoad) {
            // Jika simulasi selesai tapi aset belum, tetap di 99%
            updateProgressBar(99);
            clearInterval(simulatedLoadingInterval);
        }

    }, stepDuration);
}


async function initGameModules() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas element 'game-canvas' not found.");
        return null;
    }

    const scene = createScene();
    const camera = createCamera();
    camera.position.set(0, 2, 5);
    const renderer = createRenderer(canvas);

    // Pindahkan pemuatan aset ke sini agar bisa di-await
    // dan tombol start hanya aktif setelah semua selesai

    // Load HDR
    loadingMessageElement.textContent = "Loading environment...";
    const rgbeLoader = new RGBELoader();
    try {
        // Kita tidak bisa mendapatkan progress detail dari loadAsync, jadi kita hitung sebagai 1 aset
        const envTexture = await rgbeLoader.loadAsync(HDR_PATH);
        envTexture.mapping = THREE.EquirectangularReflectionMapping;
        setEnvironmentMap(scene, renderer, envTexture);
        console.log("HDR Environment map berhasil dimuat.");
        assetDidLoad(); // Tandai HDR selesai
    } catch (error) {
        console.error("Gagal memuat HDR:", error);
        scene.background = new THREE.Color(0x333333);
        assetDidLoad(); // Tetap tandai selesai (walaupun gagal) agar progress lanjut
    }

    setupLights(scene);
    const orbitControls = setupOrbitControls(camera, renderer.domElement);

    // Load Model
    loadingMessageElement.textContent = "Loading 3D model...";
    try {
        const loadedModel = await loadModel(scene, MODEL_PATH, {
            position: { x: 0, y: 0.01, z: 0 },
            name: "myPlayerModel",
            onProgress: (percent) => {
            }
        });
        orbitControls.target.copy(loadedModel.position);
        orbitControls.target.y += 0.5; // Sesuaikan target agar sedikit di atas pivot model
        orbitControls.update();
        console.log("Model utama berhasil dimuat.");
        assetDidLoad(); // Tandai model selesai
    } catch (error) {
        console.error("Gagal memuat model utama:", error);
        assetDidLoad(); // Tetap tandai selesai
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    return { scene, camera, renderer, orbitControls };
}

// Fungsi utama aplikasi
async function main() {
    simulateLoading(); // Mulai simulasi progress bar

    const gameContext = await initGameModules(); // Tunggu semua aset penting dimuat

    if (!gameContext) return; // Jika init gagal

    // Sekarang semua aset sudah dimuat, tombol start seharusnya sudah muncul.
    // Kita tunggu tombol start diklik.

    startButton.onclick = () => {
        if (simulatedLoadingInterval) clearInterval(simulatedLoadingInterval); // Hentikan simulasi jika masih jalan
        loadingOverlay.classList.add('hidden'); // Sembunyikan overlay

        // Mulai loop animasi game
        function animate() {
            requestAnimationFrame(animate);
            gameContext.orbitControls.update();
            gameContext.renderer.render(gameContext.scene, gameContext.camera);
        }
        animate();
    };
}

// Jalankan
main().catch(err => {
    console.error("App initialization failed:", err);
    loadingMessageElement.textContent = "Error initializing game. Please refresh.";
    if (simulatedLoadingInterval) clearInterval(simulatedLoadingInterval);
});