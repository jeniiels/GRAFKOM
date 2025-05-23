import * as THREE from 'three';
import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { setupLights } from './lights.js';
import { loadEnvironment } from './environmentLoader.js';
import { loadGLB, loadFBX } from './modelLoader.js';
import { InputManager } from './inputManager.js';
import { PlayerController } from './playerController.js';
import { TPVCameraControls } from './cameraController.js';

// --- Path Aset ---
const MAP_MODEL_PATH = './assets/models/map2.glb';
const PLAYER_MODEL_PATH = './assets/models/character2.fbx';
const HDR_ENV_PATH = './assets/hdri/sky.hdr';
const LETTER_MODEL_BASE_PATH = './assets/models/letter_';

// --- Konfigurasi Game ---
const INITIAL_LIVES = 5;
let lives = INITIAL_LIVES;
const lettersToCollectForDay = [];
const letterObjectsInScene = [];

// --- Posisi X,Z yang Tersedia untuk Huruf (Y akan ditentukan oleh raycast) ---
const baseLetterSpawnPoints = [
    { x: 150, z: -150 },
    { x: -50, z: -50 },
    { x: 100, z: -150 },
    { x: 75, z: -240 },
    { x: 230, z: -110 },
    { x: -57, z: -202 },
    { x: -135, z: -40 },
    { x: 165, z: -56 },
    { x: -15, z: -35 },
];
const LETTER_SCALE_VALUE = 2;
const LETTER_Y_OFFSET_FROM_GROUND = LETTER_SCALE_VALUE / 2;
const RAYCAST_START_Y_FOR_LETTERS = 50;

// Fungsi untuk mendapatkan nama hari saat ini dalam bahasa Inggris
function getCurrentDayName() {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = new Date().getDay();
    return days[today];
}

// Fungsi untuk memilih posisi acak (X,Z) dan menghapusnya dari array yang diberikan
function getRandomBaseSpawnPoint(spawnPointsArray) {
    if (!spawnPointsArray || spawnPointsArray.length === 0) {
        console.warn("Tidak ada lagi titik spawn yang tersedia untuk huruf.");
        return { x: Math.random() * 200 - 100, z: Math.random() * 200 - 100 };
    }
    const randomIndex = Math.floor(Math.random() * spawnPointsArray.length);
    const selectedPoint = spawnPointsArray.splice(randomIndex, 1)[0];
    return selectedPoint;
}

// Callback function ketika huruf diambil oleh pemain
function handleLetterCollected(collectedChar, collectedLetterObject) {
    console.log(`Main.js: Huruf '${collectedChar}' telah dikoleksi.`);
    const indexToRemove = lettersToCollectForDay.indexOf(collectedChar);
    if (indexToRemove > -1) {
        lettersToCollectForDay.splice(indexToRemove, 1);
        console.log(`Main.js: Sisa huruf yang perlu dikumpulkan: [${lettersToCollectForDay.join(', ')}]`);
    } else {
        console.warn(`Main.js: Mencoba menghapus huruf '${collectedChar}' yang tidak (lagi) ada di daftar target.`);
    }

    const objIndexInMainList = letterObjectsInScene.indexOf(collectedLetterObject);
    if (objIndexInMainList > -1) {
        letterObjectsInScene.splice(objIndexInMainList, 1);
    }

    if (lettersToCollectForDay.length === 0) {
        console.log("🎉 Selamat! Semua huruf telah dikumpulkan!");
        alert("Kamu menang! Semua huruf terkumpul.");
    }
}


async function init() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Canvas element 'game-canvas' not found.");
        return;
    }
    // Dapatkan referensi ke elemen HTML untuk koordinat
    const playerCoordinatesDisplay = document.getElementById('player-coordinates');
    if (!playerCoordinatesDisplay) {
        console.warn("Elemen 'player-coordinates' tidak ditemukan di HTML.");
    }


    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer(canvas);

    try {
        await loadEnvironment(scene, renderer, HDR_ENV_PATH);
    } catch (error) {
        console.warn("HDR environment not loaded, using default background.");
        if (!scene.background && !scene.environment) {
            scene.background = new THREE.Color(0x333333);
        }
    }

    setupLights(scene);

    const inputManager = new InputManager(canvas);
    inputManager.enable();

    let player, playerController, tpvCameraControls, gameMapModel;
    const clock = new THREE.Clock();
    const letterRaycaster = new THREE.Raycaster();

    try {
        gameMapModel = await loadGLB(scene, MAP_MODEL_PATH, {
            position: { x: 0, y: 0, z: 0 },
            name: "gameMap"
        });
        console.log("Map model loaded:", gameMapModel);
    } catch (error) {
        console.error("Gagal memuat map:", error);
        return;
    }

    const currentDay = getCurrentDayName();
    console.log(`Hari ini adalah: ${currentDay}`);
    const uniqueDayLetters = [...new Set(currentDay.toUpperCase().split(''))];
    
    lettersToCollectForDay.length = 0;
    lettersToCollectForDay.push(...uniqueDayLetters);
    console.log("Main.js: Daftar target huruf yang harus dikumpulkan (unik):", lettersToCollectForDay);

    let remainingBaseSpawnPoints = [...baseLetterSpawnPoints];
    letterObjectsInScene.length = 0;

    console.log("Main.js: Huruf unik yang modelnya akan dimuat:", uniqueDayLetters);

    if (uniqueDayLetters.length > remainingBaseSpawnPoints.length) {
        console.warn(`Jumlah huruf unik (${uniqueDayLetters.length}) melebihi jumlah titik spawn yang tersedia (${remainingBaseSpawnPoints.length}).`);
    }

    for (const letterChar of uniqueDayLetters) {
        const letterModelPath = `${LETTER_MODEL_BASE_PATH}${letterChar.toLowerCase()}.glb`;
        
        if (remainingBaseSpawnPoints.length === 0) {
            console.warn(`Tidak ada titik spawn tersisa untuk huruf ${letterChar}. Melewati.`);
            continue;
        }
        const baseSpawnPoint = getRandomBaseSpawnPoint(remainingBaseSpawnPoints);

        let finalLetterY = -5;
        const rayOrigin = new THREE.Vector3(baseSpawnPoint.x, RAYCAST_START_Y_FOR_LETTERS, baseSpawnPoint.z);
        const rayDirection = new THREE.Vector3(0, -1, 0);
        letterRaycaster.set(rayOrigin, rayDirection);
        letterRaycaster.far = RAYCAST_START_Y_FOR_LETTERS + 20;

        const intersects = letterRaycaster.intersectObject(gameMapModel, true);

        if (intersects.length > 0) {
            finalLetterY = intersects[0].point.y + LETTER_Y_OFFSET_FROM_GROUND;
        } else {
            // finalLetterY = LETTER_Y_OFFSET_FROM_GROUND;
            console.warn(`Tidak ada tanah ditemukan di bawah X:${baseSpawnPoint.x}, Z:${baseSpawnPoint.z} untuk huruf ${letterChar}. Menggunakan Y fallback: ${finalLetterY}`);
        }
        
        const finalLetterPosition = { x: baseSpawnPoint.x, y: finalLetterY, z: baseSpawnPoint.z };
        console.log(`Main.js: Memuat huruf: ${letterChar} di posisi:`, finalLetterPosition);

        try {
            const letterModel = await loadGLB(scene, letterModelPath, {
                position: finalLetterPosition,
                scale: { x: LETTER_SCALE_VALUE, y: LETTER_SCALE_VALUE, z: LETTER_SCALE_VALUE },
                name: `letter_${letterChar}`
            });
            letterObjectsInScene.push(letterModel);
            console.log(`Main.js: Huruf ${letterChar} berhasil dimuat.`);
        } catch (error) {
            console.error(`Gagal memuat model untuk huruf ${letterChar} dari path ${letterModelPath}:`, error);
        }
    }
    console.log("Main.js: Objek huruf yang dimuat di scene:", letterObjectsInScene.map(obj => obj.name));

    try {
        const { model: playerModel, mixer: playerMixer, animations: playerAnimations } = await loadFBX(scene, PLAYER_MODEL_PATH, {
            position: { x: 150, y: 0, z: -165 },
            scale: { x: 0.015, y: 0.015, z: 0.015 },
            name: "playerCharacter"
        });
        player = playerModel; // Simpan referensi ke model pemain
        console.log("Player model loaded:", player);

        if (!gameMapModel) {
            console.error("Map model tidak termuat, PlayerController tidak bisa diinisialisasi dengan benar.");
            return;
        }

        playerController = new PlayerController(
            player,
            playerMixer,
            playerAnimations,
            inputManager,
            camera,
            gameMapModel,
            letterObjectsInScene,
            handleLetterCollected
        );

        tpvCameraControls = new TPVCameraControls(camera, player, canvas, inputManager);
        tpvCameraControls.update(0);

    } catch (error) {
        console.error("Gagal memuat karakter pemain:", error);
        return;
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();

        if (playerController) {
            playerController.update(deltaTime);
        }
        if (tpvCameraControls) {
            tpvCameraControls.update(deltaTime);
        }

        // Update tampilan koordinat pemain
        if (player && playerCoordinatesDisplay) { // Pastikan player dan elemen HTML ada
            playerCoordinatesDisplay.textContent = `Posisi Pemain: X: ${player.position.x.toFixed(2)}, Z: ${player.position.z.toFixed(2)}`;
        }

        letterObjectsInScene.forEach(letterObj => {
            if (letterObj && letterObj.parent) {
                 letterObj.rotation.y += 0.01;
            }
        });

        inputManager.resetMouseDeltas();
        renderer.render(scene, camera);
    }
    animate();
}

init().catch(err => {
    console.error("Initialization failed:", err);
});