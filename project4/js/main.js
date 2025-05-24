// js/main.js
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
const CAR_MODEL_PATH = './assets/models/car2.glb'; // Ganti jika perlu
const HDR_ENV_PATH = './assets/hdri/sky.hdr';
const LETTER_MODEL_BASE_PATH = './assets/models/letter_';

// --- Konfigurasi Game ---
const INITIAL_LIVES = 5;
let lives = INITIAL_LIVES;
const lettersToCollectForDay = [];
const letterObjectsInScene = [];

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
const RAYCAST_START_Y_FOR_ITEMS = 50; // Untuk huruf dan mobil

// Konfigurasi Mobil
const CAR_SPAWN_POSITION = { x: 95, z: -210 }; // Y akan di-raycast
const CAR_SCALE = { x: 0.015, y: 0.015, z: 0.015 }; // Sesuaikan skala mobil jika perlu
const DISTANCE_TO_ENTER_CAR = 5;
const PLAYER_EXIT_CAR_OFFSET_RIGHT = 2.5; // Offset X (kanan mobil) saat keluar
const PLAYER_EXIT_CAR_OFFSET_UP = 0.5; // Sedikit ke atas agar tidak spawn di dalam tanah

// State Kendaraan
let playerCharacterObject, carObject; // Ini akan menjadi THREE.Group atau THREE.Scene
let isPlayerInCar = false;

function getCurrentDayName() { /* ... kode sama ... */
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = new Date().getDay();
    return days[today];
}
function getRandomBaseSpawnPoint(spawnPointsArray) { /* ... kode sama ... */
    if (!spawnPointsArray || spawnPointsArray.length === 0) {
        console.warn("Tidak ada lagi titik spawn yang tersedia untuk huruf.");
        return { x: Math.random() * 200 - 100, z: Math.random() * 200 - 100 }; // Fallback
    }
    const randomIndex = Math.floor(Math.random() * spawnPointsArray.length);
    const selectedPoint = spawnPointsArray.splice(randomIndex, 1)[0];
    return selectedPoint;
}
function handleLetterCollected(collectedChar, collectedLetterObject) { /* ... kode sama ... */
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
    const playerCoordinatesDisplay = document.getElementById('player-coordinates');

    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer(canvas);
    await loadEnvironment(scene, renderer, HDR_ENV_PATH).catch(() => scene.background = new THREE.Color(0x333333));
    setupLights(scene);

    const inputManager = new InputManager(canvas);
    inputManager.enable();

    let playerController, tpvCameraControls, gameMapModel;
    const clock = new THREE.Clock();
    const generalRaycaster = new THREE.Raycaster();

    try {
        gameMapModel = await loadGLB(scene, MAP_MODEL_PATH, { name: "gameMap" });
    } catch (error) { console.error("Gagal memuat map:", error); return; }

    // --- Load Huruf ---
    const currentDay = getCurrentDayName();
    const uniqueDayLetters = [...new Set(currentDay.toUpperCase().split(''))];

    lettersToCollectForDay.push(...uniqueDayLetters);
    console.log("Main.js: Daftar target huruf yang harus dikumpulkan (unik):", lettersToCollectForDay);


    let remainingBaseSpawnPoints = [...baseLetterSpawnPoints];
    letterObjectsInScene.length = 0;

    for (const letterChar of uniqueDayLetters) {
        const letterModelPath = `${LETTER_MODEL_BASE_PATH}${letterChar.toLowerCase()}.glb`;
        
        if (remainingBaseSpawnPoints.length === 0) {
            console.warn(`Tidak ada titik spawn tersisa untuk huruf ${letterChar}. Melewati.`);
            continue;
        }
        const baseSpawnPoint = getRandomBaseSpawnPoint(remainingBaseSpawnPoints);

        let finalLetterY = -5;
        const rayOrigin = new THREE.Vector3(baseSpawnPoint.x, RAYCAST_START_Y_FOR_ITEMS, baseSpawnPoint.z);
        const rayDirection = new THREE.Vector3(0, -1, 0);
        generalRaycaster.set(rayOrigin, rayDirection);
        generalRaycaster.far = RAYCAST_START_Y_FOR_ITEMS + 20;

        const intersects = generalRaycaster.intersectObject(gameMapModel, true);

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

    // --- TODO 4: Load Object Car ---
    try {
        const carRayOrigin = new THREE.Vector3(CAR_SPAWN_POSITION.x, RAYCAST_START_Y_FOR_ITEMS, CAR_SPAWN_POSITION.z);
        generalRaycaster.set(carRayOrigin, new THREE.Vector3(0, -1, 0));
        generalRaycaster.far = RAYCAST_START_Y_FOR_ITEMS + 20;
        const carGroundIntersects = generalRaycaster.intersectObject(gameMapModel, true);
        // Asumsi pivot mobil di tengah alasnya atau sedikit di atasnya. Jika mobil lebih tinggi, sesuaikan offset Y.
        const carFinalY = carGroundIntersects.length > 0 ? carGroundIntersects[0].point.y + (CAR_SCALE.y * 0.2) : 0.5; // 0.2 dari skala Y, atau 0.5 fallback

        carObject = await loadGLB(scene, CAR_MODEL_PATH, {
            position: { x: CAR_SPAWN_POSITION.x, y: carFinalY, z: CAR_SPAWN_POSITION.z },
            scale: CAR_SCALE,
            name: "PlayerCar"
        });
        carObject.visible = true; // Mobil terlihat dari awal
        console.log("Mobil berhasil dimuat di:", carObject.position);
    } catch (error) {
        console.error("Gagal memuat mobil:", error);
        // Game bisa lanjut tanpa mobil jika ini hanya fitur tambahan
    }

    // --- Load Player Character ---
    try {
        const { model, mixer, animations } = await loadFBX(scene, PLAYER_MODEL_PATH, {
            position: { x: 150, y: 0, z: -165 },
            scale: { x: 0.015, y: 0.015, z: 0.015 },
            name: "PlayerCharacter"
        });
        playerCharacterObject = model;
        playerCharacterObject.visible = true; // Karakter terlihat dari awal

        playerController = new PlayerController(
            playerCharacterObject, // Model awal
            mixer, animations, inputManager, camera, gameMapModel,
            letterObjectsInScene, handleLetterCollected
        );

        tpvCameraControls = new TPVCameraControls(camera, playerCharacterObject, canvas, inputManager);
        tpvCameraControls.update(0);

    } catch (error) { console.error("Gagal memuat karakter pemain:", error); return; }

    window.addEventListener('resize', () => { /* ... kode sama ... */ });

    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();

        // --- TODO 5 & 6: Logika Masuk/Keluar Mobil ---
        if (playerCharacterObject && carObject && playerController && tpvCameraControls) {
            if (inputManager.isKeyPressedOnce('KeyE')) {
                if (!isPlayerInCar) { // Jika belum di mobil, coba masuk
                    const distance = playerCharacterObject.position.distanceTo(carObject.position);
                    if (distance < DISTANCE_TO_ENTER_CAR) {
                        isPlayerInCar = true;
                        playerCharacterObject.visible = false; // Sembunyikan karakter
                        // Pindahkan mobil ke posisi karakter & samakan orientasi (atau sedikit di belakang)
                        carObject.position.copy(playerCharacterObject.position);
                        // Optional: mundurkan mobil sedikit agar karakter "masuk"
                        // const backOffset = new THREE.Vector3();
                        // playerCharacterObject.getWorldDirection(backOffset);
                        // carObject.position.sub(backOffset.multiplyScalar(0.5));
                        carObject.quaternion.copy(playerCharacterObject.quaternion);

                        playerController.setControlledObject(carObject, true);
                        tpvCameraControls.setTargetToFollow(carObject, true); // true untuk isCar
                        console.log("Masuk Mobil!");
                    } else {
                        console.log("Mobil terlalu jauh untuk dimasuki. Jarak:", distance.toFixed(2));
                    }
                }
            } else if (inputManager.isKeyPressedOnce('KeyF')) {
                if (isPlayerInCar) { // Jika di mobil, coba keluar
                    isPlayerInCar = false;
                    playerCharacterObject.visible = true; // Tampilkan karakter

                    // Posisikan karakter di samping kanan mobil
                    const exitPosition = new THREE.Vector3();
                    const carRightDirection = new THREE.Vector3();
                    carObject.getWorldDirection(carRightDirection); // Ini arah depan mobil
                    carRightDirection.cross(carObject.up); // Ubah jadi arah kanan
                    carRightDirection.normalize();

                    exitPosition.copy(carObject.position)
                        .add(carRightDirection.multiplyScalar(PLAYER_EXIT_CAR_OFFSET_RIGHT))
                        .add(new THREE.Vector3(0, PLAYER_EXIT_CAR_OFFSET_UP, 0)); // Naikkan sedikit
                    
                    playerCharacterObject.position.copy(exitPosition);
                    playerCharacterObject.quaternion.copy(carObject.quaternion); // Samakan orientasi

                    playerController.setControlledObject(playerCharacterObject, false);
                    tpvCameraControls.setTargetToFollow(playerCharacterObject, false); // false untuk isCar
                    console.log("Keluar Mobil!");
                }
            }
        }

        if (playerController) playerController.update(deltaTime);
        if (tpvCameraControls) tpvCameraControls.update(deltaTime);

        if (playerCoordinatesDisplay) {
            const currentTarget = isPlayerInCar ? carObject : playerCharacterObject;
            if (currentTarget) {
                playerCoordinatesDisplay.textContent = `Posisi: X: ${currentTarget.position.x.toFixed(1)}, Z: ${currentTarget.position.z.toFixed(1)}${isPlayerInCar ? " (Mobil)" : " (Karakter)"}`;
            }
        }

        letterObjectsInScene.forEach(letterObj => { if (letterObj.parent) letterObj.rotation.y += 0.01; });

        // inputManager.resetMouseDeltas(); // Ini sudah dipanggil di InputManager setelah isKeyPressedOnce
        renderer.render(scene, camera);
    }
    animate();
}

init().catch(err => console.error("Initialization failed:", err));