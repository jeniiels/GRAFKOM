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
const MAP_MODEL_PATH = './assets/models/map.glb';
const PLAYER_MODEL_PATH = './assets/models/character.fbx';
const CAR_MODEL_PATH = './assets/models/car.glb';
const HDR_ENV_PATH = './assets/hdri/sky.hdr';
const LETTER_MODEL_BASE_PATH = './assets/models/letter_';
const POOP_MODEL_PATH = './assets/models/poop.glb'; // Ganti jika perlu

// --- Konfigurasi Game ---
const INITIAL_LIVES = 5;
let lives = INITIAL_LIVES;
let isGameOver = false; // Flag global untuk game over
const lettersToCollectForDay = [];
const letterObjectsInScene = [];
const poopObjectsInScene = []; // Array untuk menyimpan objek poop

// Konfigurasi Poop
const MAX_POOPS = 50; // Jumlah maksimum poop di map
const POOP_SCALE_VALUE = 0.005; // Sesuaikan skala poop
const POOP_Y_OFFSET_FROM_GROUND = POOP_SCALE_VALUE / 2; // Jika pivot di tengah
const POOP_SPAWN_RADIUS_MIN = 10; // Jarak minimum spawn poop dari pemain
const POOP_SPAWN_RADIUS_MAX = 40; // Jarak maksimum spawn poop dari pemain
const POOP_SPAWN_INTERVAL = 1000; // Interval spawn poop dalam ms (misal, 5 detik)
let lastPoopSpawnTime = 0;

// ... (baseLetterSpawnPoints, LETTER_SCALE_VALUE, dll tetap sama) ...
const baseLetterSpawnPoints = [
    { x: 150, z: -150 }, { x: -50, z: -50 }, { x: 100, z: -150 },
    { x: 75, z: -240 }, { x: 230, z: -110 }, { x: -57, z: -202 },
    { x: -135, z: -40 }, { x: 165, z: -56 }, { x: -15, z: -35 },
];
const LETTER_SCALE_VALUE = 2;
const LETTER_Y_OFFSET_FROM_GROUND = LETTER_SCALE_VALUE / 2;
const RAYCAST_START_Y_FOR_ITEMS = 50;

const CAR_SPAWN_POSITION = { x: 95, z: -210 };
const CAR_SCALE = { x: 0.5, y: 0.5, z: 0.5 };
const DISTANCE_TO_ENTER_CAR = 5;
const PLAYER_EXIT_CAR_OFFSET_RIGHT = 2.5;
const PLAYER_EXIT_CAR_OFFSET_UP = 0.5;

let playerCharacterObject, carObject;
let isPlayerInCar = false;
let playerController;
let inputManager;

// --- Elemen UI ---
let playerCoordinatesDisplay, playerLivesDisplay, gameOverPopup;

function getCurrentDayName() { /* ... kode sama ... */
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = new Date().getDay();
    return days[today];
}
function getRandomBaseSpawnPoint(spawnPointsArray) { /* ... kode sama ... */
    if (!spawnPointsArray || spawnPointsArray.length === 0) {
        return { x: Math.random() * 200 - 100, z: Math.random() * 200 - 100 };
    }
    const randomIndex = Math.floor(Math.random() * spawnPointsArray.length);
    return spawnPointsArray.splice(randomIndex, 1)[0];
}

function updateLivesDisplay() {
    if (playerLivesDisplay) {
        playerLivesDisplay.textContent = `Nyawa: ${lives}`;
    }
}

function showGameOverPopup() {
    if (gameOverPopup) {
        gameOverPopup.style.display = 'block';
    }
}

function handleLetterCollected(collectedChar, collectedLetterObject) {
    if (isGameOver) return;
    console.log(`Main.js: Huruf '${collectedChar}' telah dikoleksi.`);
    // ... (sisa logika sama) ...
    const indexToRemove = lettersToCollectForDay.indexOf(collectedChar);
    if (indexToRemove > -1) {
        lettersToCollectForDay.splice(indexToRemove, 1);
        // console.log(`Main.js: Sisa huruf yang perlu dikumpulkan: [${lettersToCollectForDay.join(', ')}]`);
    }
    const objIndexInMainList = letterObjectsInScene.indexOf(collectedLetterObject);
    if (objIndexInMainList > -1) {
        letterObjectsInScene.splice(objIndexInMainList, 1);
    }
    if (lettersToCollectForDay.length === 0) {
        console.log("🎉 Selamat! Semua huruf telah dikumpulkan!");
        alert("Kamu menang! Semua huruf terkumpul.");
        // TODO: Implementasi tanam plant dan menang
    }
}

function handlePoopHit(poopObject) {
    if (isGameOver) return;

    console.log(`Main.js: Terkena Poop! Nyawa berkurang.`);
    lives--;
    updateLivesDisplay();

    // Hapus referensi poop dari array global di main.js
    const index = poopObjectsInScene.indexOf(poopObject);
    if (index > -1) {
        poopObjectsInScene.splice(index, 1);
    }

    if (lives <= 0) {
        isGameOver = true;
        console.log("GAME OVER - Nyawa habis!");
        showGameOverPopup();
        if (playerController) {
            playerController.setGameOver(); // Beritahu PlayerController
        }
        // Tambahan: Hentikan input atau sembunyikan UI lain jika perlu
        if (inputManager) inputManager.disable(); // Matikan input agar tidak bisa gerak lagi
    }
}

async function spawnPoop(scene, mapModel, generalRaycaster, currentPC) { // Tambahkan currentPC
    console.log("Attempting to spawn poop. Current poop count:", poopObjectsInScene.length, "Max poops:", MAX_POOPS);

    // Gunakan currentPC yang dilewatkan sebagai argumen
    if (isGameOver || poopObjectsInScene.length >= MAX_POOPS || !currentPC || !currentPC.model) {
        console.log("Spawn poop dibatalkan karena kondisi awal:", {
            isGameOver,
            poopCount: poopObjectsInScene.length,
            maxPoops: MAX_POOPS,
            playerControllerExists: !!currentPC, // Cek argumen
            playerModelExists: !!(currentPC && currentPC.model) // Cek argumen
        });
        return;
    }

    const currentPlayerModel = currentPC.model; // Gunakan dari argumen
    const angle = Math.random() * Math.PI * 2;
    const radius = POOP_SPAWN_RADIUS_MIN + Math.random() * (POOP_SPAWN_RADIUS_MAX - POOP_SPAWN_RADIUS_MIN);
    const spawnX = currentPlayerModel.position.x + radius * Math.cos(angle);
    const spawnZ = currentPlayerModel.position.z + radius * Math.sin(angle);

    // console.log(`Calculating spawn position: X=${spawnX.toFixed(1)}, Z=${spawnZ.toFixed(1)} around player at X=${currentPlayerModel.position.x.toFixed(1)}, Z=${currentPlayerModel.position.z.toFixed(1)}`);

    const rayOrigin = new THREE.Vector3(spawnX, RAYCAST_START_Y_FOR_ITEMS, spawnZ);
    generalRaycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
    generalRaycaster.far = RAYCAST_START_Y_FOR_ITEMS + 20;
    const intersects = generalRaycaster.intersectObject(mapModel, true);

    let finalPoopY = POOP_Y_OFFSET_FROM_GROUND;
    if (intersects.length > 0) {
        finalPoopY = intersects[0].point.y + POOP_Y_OFFSET_FROM_GROUND;
        // console.log(`Ground found for poop at Y=${intersects[0].point.y.toFixed(1)}. Final Poop Y=${finalPoopY.toFixed(1)}`);
    } else {
        console.warn(`Tidak ada tanah ditemukan untuk spawn poop di X:${spawnX.toFixed(1)}, Z:${spawnZ.toFixed(1)}. Mungkin di luar map.`);
        return;
    }

    // console.log(`Attempting to load poop model: ${POOP_MODEL_PATH}`);
    try {
        const poopModel = await loadGLB(scene, POOP_MODEL_PATH, {
            position: { x: spawnX, y: finalPoopY, z: spawnZ },
            scale: { x: POOP_SCALE_VALUE, y: POOP_SCALE_VALUE, z: POOP_SCALE_VALUE },
            name: `poop_${Date.now()}`
        });
        console.log("Poop baru dispawn:", poopModel.name, "Total poop:", poopObjectsInScene.length + 1);
        
        poopObjectsInScene.push(poopModel);
        if (currentPC) { // Gunakan argumen currentPC
            currentPC.poopObjects.push(poopModel);
        }
    } catch (error) {
        console.error("Gagal memuat model poop:", error);
    }
}

async function init() {
    const canvas = document.getElementById('game-canvas');
    playerCoordinatesDisplay = document.getElementById('player-coordinates'); // Ambil referensi UI
    playerLivesDisplay = document.getElementById('player-lives');
    gameOverPopup = document.getElementById('game-over-popup');

    if (!canvas || !playerCoordinatesDisplay || !playerLivesDisplay || !gameOverPopup) {
        console.error("Salah satu elemen UI penting tidak ditemukan. Cek HTML.");
        return;
    }
    updateLivesDisplay(); // Tampilkan nyawa awal

    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer(canvas);
    await loadEnvironment(scene, renderer, HDR_ENV_PATH).catch(() => scene.background = new THREE.Color(0x333333));
    setupLights(scene);

    const inputManager = new InputManager(canvas); // Deklarasikan inputManager di sini
    inputManager.enable();

    let playerController, tpvCameraControls, gameMapModel; // Deklarasikan playerController di sini
    const clock = new THREE.Clock();
    const generalRaycaster = new THREE.Raycaster();

    try {
        gameMapModel = await loadGLB(scene, MAP_MODEL_PATH, { name: "gameMap" });
    } catch (error) { console.error("Gagal memuat map:", error); return; }

    // --- Load Huruf ---
    // ... (kode load huruf sama seperti sebelumnya) ...
    const currentDay = getCurrentDayName();
    const uniqueDayLetters = [...new Set(currentDay.toUpperCase().split(''))];
    lettersToCollectForDay.push(...uniqueDayLetters);
    // console.log("Main.js: Daftar target huruf yang harus dikumpulkan (unik):", lettersToCollectForDay);
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
            console.warn(`Tidak ada tanah ditemukan di bawah X:${baseSpawnPoint.x}, Z:${baseSpawnPoint.z} untuk huruf ${letterChar}. Menggunakan Y fallback: ${finalLetterY}`);
        }
        const finalLetterPosition = { x: baseSpawnPoint.x, y: finalLetterY, z: baseSpawnPoint.z };
        // console.log(`Main.js: Memuat huruf: ${letterChar} di posisi:`, finalLetterPosition);
        try {
            const letterModel = await loadGLB(scene, letterModelPath, {
                position: finalLetterPosition,
                scale: { x: LETTER_SCALE_VALUE, y: LETTER_SCALE_VALUE, z: LETTER_SCALE_VALUE },
                name: `letter_${letterChar}`
            });
            letterObjectsInScene.push(letterModel);
        } catch (error) { console.error(`Gagal memuat model untuk huruf ${letterChar} dari path ${letterModelPath}:`, error); }
    }
    // console.log("Main.js: Objek huruf yang dimuat di scene:", letterObjectsInScene.map(obj => obj.name));


    // --- Load Mobil ---
    // ... (kode load mobil sama seperti sebelumnya) ...
    try {
        const carRayOrigin = new THREE.Vector3(CAR_SPAWN_POSITION.x, RAYCAST_START_Y_FOR_ITEMS, CAR_SPAWN_POSITION.z);
        generalRaycaster.set(carRayOrigin, new THREE.Vector3(0, -1, 0));
        generalRaycaster.far = RAYCAST_START_Y_FOR_ITEMS + 20;
        const carGroundIntersects = generalRaycaster.intersectObject(gameMapModel, true);
        const carFinalY = carGroundIntersects.length > 0 ? carGroundIntersects[0].point.y + (CAR_SCALE.y * 0.2) : 0.5;
        carObject = await loadGLB(scene, CAR_MODEL_PATH, {
            position: { x: CAR_SPAWN_POSITION.x, y: carFinalY, z: CAR_SPAWN_POSITION.z },
            scale: CAR_SCALE,
            name: "PlayerCar"
        });
        carObject.visible = true;
        // console.log("Mobil berhasil dimuat di:", carObject.position);
    } catch (error) { console.error("Gagal memuat mobil:", error); }


    // --- Load Player Character ---
    try {
        const { model, mixer, animations } = await loadFBX(scene, PLAYER_MODEL_PATH, {
            position: { x: 150, y: 0, z: -165 }, // Posisi awal Anda
            scale: { x: 0.015, y: 0.015, z: 0.015 },
            name: "PlayerCharacter"
        });

        playerCharacterObject = model;
        playerCharacterObject.visible = true;

        playerController = new PlayerController( // Inisialisasi playerController
            playerCharacterObject, mixer, animations, inputManager, camera, gameMapModel,
            letterObjectsInScene, handleLetterCollected,
            poopObjectsInScene, handlePoopHit // Teruskan poopObjects dan callback
        );

        tpvCameraControls = new TPVCameraControls(camera, playerCharacterObject, canvas, inputManager);
        tpvCameraControls.update(0);

    } catch (error) { console.error("Gagal memuat karakter pemain:", error); return; }

    // Spawn poop awal (jika diinginkan, bisa juga menunggu interval pertama)
    for (let i = 0; i < MAX_POOPS / 2; i++) { // Spawn setengah dari maks poop di awal
        await spawnPoop(scene, gameMapModel, generalRaycaster, playerController);
    }
    lastPoopSpawnTime = clock.getElapsedTime() * 1000; // Set waktu spawn terakhir

    window.addEventListener('resize', () => { /* ... kode sama ... */
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();
        const elapsedTime = clock.getElapsedTime() * 1000; // Waktu dalam ms

        if (!isGameOver) { // Hanya update game jika tidak game over
            // --- Logika Masuk/Keluar Mobil ---
            if (playerCharacterObject && carObject && playerController && tpvCameraControls) {
                // ... (logika masuk/keluar mobil sama seperti sebelumnya) ...
                if (inputManager.isKeyPressedOnce('KeyE')) {
                    if (!isPlayerInCar) {
                        const distance = playerCharacterObject.position.distanceTo(carObject.position);
                        if (distance < DISTANCE_TO_ENTER_CAR) {
                            isPlayerInCar = true;
                            playerCharacterObject.visible = false;
                            carObject.position.copy(playerCharacterObject.position);
                            carObject.quaternion.copy(playerCharacterObject.quaternion);
                            playerController.setControlledObject(carObject, true);
                            tpvCameraControls.setTargetToFollow(carObject, true);
                            // console.log("Masuk Mobil!");
                        } else {
                            // console.log("Mobil terlalu jauh untuk dimasuki. Jarak:", distance.toFixed(2));
                        }
                    }
                } else if (inputManager.isKeyPressedOnce('KeyF')) {
                    if (isPlayerInCar) {
                        isPlayerInCar = false;
                        playerCharacterObject.visible = true;
                        const exitPosition = new THREE.Vector3();
                        const carRightDirection = new THREE.Vector3();
                        carObject.getWorldDirection(carRightDirection);
                        carRightDirection.cross(carObject.up);
                        carRightDirection.normalize();
                        exitPosition.copy(carObject.position)
                            .add(carRightDirection.multiplyScalar(PLAYER_EXIT_CAR_OFFSET_RIGHT))
                            .add(new THREE.Vector3(0, PLAYER_EXIT_CAR_OFFSET_UP, 0));
                        playerCharacterObject.position.copy(exitPosition);
                        playerCharacterObject.quaternion.copy(carObject.quaternion);
                        playerController.setControlledObject(playerCharacterObject, false);
                        tpvCameraControls.setTargetToFollow(playerCharacterObject, false);
                        // console.log("Keluar Mobil!");
                    }
                }
            }


            if (playerController) playerController.update(deltaTime);

            // Spawn Poop Berkala
            if (elapsedTime - lastPoopSpawnTime > POOP_SPAWN_INTERVAL) {
                spawnPoop(scene, gameMapModel, generalRaycaster, playerController);
                lastPoopSpawnTime = elapsedTime;
            }
        } // akhir dari if (!isGameOver)

        if (tpvCameraControls) tpvCameraControls.update(deltaTime); // Kamera tetap bisa digerakkan saat game over

        if (playerCoordinatesDisplay) {
            const currentTarget = isPlayerInCar ? carObject : playerCharacterObject;
            if (currentTarget) {
                playerCoordinatesDisplay.textContent = `Posisi: X: ${currentTarget.position.x.toFixed(1)}, Z: ${currentTarget.position.z.toFixed(1)}${isPlayerInCar ? " (Mobil)" : " (Karakter)"}`;
            }
        }

        letterObjectsInScene.forEach(letterObj => { if (letterObj.parent) letterObj.rotation.y += 0.01; });

        renderer.render(scene, camera);
    }
    animate();
}

init().catch(err => console.error("Initialization failed:", err));