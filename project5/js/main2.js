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
const POOP_MODEL_PATH = './assets/models/poop.glb';

// --- Konfigurasi Game ---
const INITIAL_LIVES = 5;
let lives = INITIAL_LIVES;
let isGameOver = false;
const lettersToCollectForDay = [];
const letterObjectsInScene = [];
const poopObjectsInScene = [];

// Konfigurasi Poop
const MAX_POOPS = 1000;
const POOP_SCALE_VALUE = 0.005;
const POOP_Y_OFFSET_FROM_GROUND = POOP_SCALE_VALUE / 2 - 0.3; // Jika pivot di tengah
const POOP_SPAWN_RADIUS_MIN = 10; // Jarak minimum spawn poop dari pemain
const POOP_SPAWN_RADIUS_MAX = 40; // Jarak maksimum spawn poop dari pemain
const POOP_SPAWN_INTERVAL = 5000; // Interval spawn poop dalam ms (misal, 5 detik)
let lastPoopSpawnTime = 0;

let baseLetterSpawnPoints = [
    { x: 150, z: -150 }, { x: -50, z: -50 }, { x: 100, z: -150 },
    { x: 75, z: -240 }, { x: 230, z: -110 }, { x: -57, z: -202 },
    { x: -135, z: -40 }, { x: 165, z: -56 }, { x: -15, z: -35 },
];

let baseLetterSpawnPointsOriginal = [
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
const PLAYER_INITIAL_POSITION = { x: 150, y: 0, z: -165 };

let playerCharacterObject, carObject;
let isPlayerInCar = false;
let playerController;
let inputManager;
let scene, camera, renderer, tpvCameraControls, gameMapModel;
const clock = new THREE.Clock();
const generalRaycaster = new THREE.Raycaster();

// --- Elemen UI ---
let playerCoordinatesDisplay, playerLivesDisplay, gameOverPopup, restartButton;
let loadingOverlay, loadingProgressBar, loadingStatusText;

// --- Loading Manager ---
const loadingManager = new THREE.LoadingManager();
let totalAssetsToLoad = 0; // Akan dihitung
let assetsLoaded = 0;

loadingManager.onStart = function (url, itemsLoaded, itemsTotal) {
    // console.log('Mulai memuat: ' + url + '.\nMemuat ' + itemsLoaded + ' dari ' + itemsTotal + ' file.');
    // totalAssetsToLoad akan dihitung secara manual untuk GLB/FBX/HDR
};
loadingManager.onLoad = function () {
    // console.log('Semua aset bawaan Three.js selesai dimuat!');
    // Ini mungkin terpanggil sebelum semua aset kustom kita selesai
};
loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    // console.log('Memuat file: ' + url + '.\nMemuat ' + itemsLoaded + ' dari ' + itemsTotal + ' file.');
    // Tidak ideal untuk progress bar utama kita karena itemsTotal bisa berubah
};
loadingManager.onError = function (url) {
    console.error('Terjadi error saat memuat ' + url);
};

function updateLoadingProgress(statusMessage = "Memuat...") {
    assetsLoaded++;
    const progress = totalAssetsToLoad > 0 ? Math.round((assetsLoaded / totalAssetsToLoad) * 100) : 0;
    if (loadingProgressBar) {
        loadingProgressBar.style.width = progress + '%';
        loadingProgressBar.textContent = progress + '%';
    }
    if (loadingStatusText) {
        loadingStatusText.textContent = statusMessage;
    }
    // console.log(`Progress: ${progress}% (${assetsLoaded}/${totalAssetsToLoad}) - ${statusMessage}`);
}

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
    if (playerLivesDisplay) playerLivesDisplay.textContent = `Nyawa: ${lives}`;
}

function showGameOverPopup() {
    if (gameOverPopup) gameOverPopup.style.display = 'block';
}

function hideGameOverPopup() {
    if (gameOverPopup) gameOverPopup.style.display = 'none';
}

function handleLetterCollected(collectedChar) {
    if (isGameOver) return;
    console.log(`Main.js: Huruf '${collectedChar}' telah dikoleksi.`);
    const indexToRemove = lettersToCollectForDay.indexOf(collectedChar);
    if (indexToRemove > -1) {
        lettersToCollectForDay.splice(indexToRemove, 1);
        // console.log(`Main.js: Sisa huruf yang perlu dikumpulkan: [${lettersToCollectForDay.join(', ')}]`);
    }

    if (lettersToCollectForDay.length === 0) {
        console.log("🎉 Selamat! Semua huruf telah dikumpulkan!");
        alert("Kamu menang! Semua huruf terkumpul.");
        // TODO: Implementasi tanam plant dan menang
    }
}

function handlePoopHit(poopObject) {
    if (isGameOver) return;
    lives--;
    updateLivesDisplay();
    const index = poopObjectsInScene.indexOf(poopObject);
    if (index > -1) poopObjectsInScene.splice(index, 1);

    if (lives <= 0) {
        isGameOver = true;
        showGameOverPopup();
        if (playerController) playerController.setGameOver();
        if (inputManager) inputManager.disable();
    }
}

async function spawnPoop(currentPC) { // scene, mapModel, generalRaycaster sekarang global
    if (isGameOver || poopObjectsInScene.length >= MAX_POOPS || !currentPC || !currentPC.model) return;
    const currentPlayerModel = currentPC.model;
    const angle = Math.random() * Math.PI * 2;
    const radius = POOP_SPAWN_RADIUS_MIN + Math.random() * (POOP_SPAWN_RADIUS_MAX - POOP_SPAWN_RADIUS_MIN);
    const spawnX = currentPlayerModel.position.x + radius * Math.cos(angle);
    const spawnZ = currentPlayerModel.position.z + radius * Math.sin(angle);
    const rayOrigin = new THREE.Vector3(spawnX, RAYCAST_START_Y_FOR_ITEMS, spawnZ);
    generalRaycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
    generalRaycaster.far = RAYCAST_START_Y_FOR_ITEMS + 20;
    const intersects = generalRaycaster.intersectObject(gameMapModel, true);
    let finalPoopY = POOP_Y_OFFSET_FROM_GROUND;
    if (intersects.length > 0) finalPoopY = intersects[0].point.y + POOP_Y_OFFSET_FROM_GROUND;
    else return; // Tidak spawn jika tidak ada tanah

    try {
        const poopModel = await loadGLB(scene, POOP_MODEL_PATH, {
            position: { x: spawnX, y: finalPoopY, z: spawnZ },
            scale: { x: POOP_SCALE_VALUE, y: POOP_SCALE_VALUE, z: POOP_SCALE_VALUE },
            name: `poop_${Date.now()}`
        });
        poopObjectsInScene.push(poopModel);
        if (currentPC) currentPC.poopObjects.push(poopModel);
    } catch (error) { console.error("Gagal memuat model poop:", error); }
}

async function setupLetters() {
    // Hapus huruf lama dari scene dan array
    letterObjectsInScene.forEach(letter => { if(letter.parent) letter.removeFromParent(); });
    letterObjectsInScene.length = 0;
    lettersToCollectForDay.length = 0;

    const currentDay = getCurrentDayName();
    const uniqueDayLetters = [...new Set(currentDay.toUpperCase().split(''))];
    lettersToCollectForDay.push(...uniqueDayLetters);
    baseLetterSpawnPoints = [...baseLetterSpawnPointsOriginal]; // Reset array posisi

    for (const letterChar of uniqueDayLetters) {
        updateLoadingProgress(`Memuat huruf ${letterChar}...`);
        const letterModelPath = `${LETTER_MODEL_BASE_PATH}${letterChar.toLowerCase()}.glb`;
        if (baseLetterSpawnPoints.length === 0) continue;
        const spawnPoint = getRandomBaseSpawnPoint(baseLetterSpawnPoints);
        let finalLetterY = -5; // Fallback Anda sebelumnya
        const rayOrigin = new THREE.Vector3(spawnPoint.x, RAYCAST_START_Y_FOR_ITEMS, spawnPoint.z);
        generalRaycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
        generalRaycaster.far = RAYCAST_START_Y_FOR_ITEMS + 20;
        const intersects = generalRaycaster.intersectObject(gameMapModel, true);
        if (intersects.length > 0) finalLetterY = intersects[0].point.y + LETTER_Y_OFFSET_FROM_GROUND;
        
        try {
            const letterModel = await loadGLB(scene, letterModelPath, {
                position: { x: spawnPoint.x, y: finalLetterY, z: spawnPoint.z },
                scale: { x: LETTER_SCALE_VALUE, y: LETTER_SCALE_VALUE, z: LETTER_SCALE_VALUE },
                name: `letter_${letterChar}`
            });
            letterObjectsInScene.push(letterModel);
        } catch (error) { console.error(`Gagal memuat huruf ${letterChar}:`, error); }
    }
}

async function resetGame() {
    console.log("Mereset game...");
    hideGameOverPopup();
    isGameOver = false;
    lives = INITIAL_LIVES;
    updateLivesDisplay();

    // Reset posisi pemain
    if (playerCharacterObject && playerController) {
        playerCharacterObject.position.set(PLAYER_INITIAL_POSITION.x, PLAYER_INITIAL_POSITION.y, PLAYER_INITIAL_POSITION.z);
        playerCharacterObject.rotation.set(0,0,0); // Reset rotasi juga
        playerCharacterObject.visible = true;
        playerController.setControlledObject(playerCharacterObject, false); // Pastikan kontrol ke karakter
        playerController.isGameOver = false; // Reset flag game over di controller
        playerController.velocity.set(0,0,0); // Reset velocity
        if (playerController.currentAction) playerController.playAnimationByName('idle'); // Mainkan idle
    }
    if (tpvCameraControls && playerCharacterObject) {
        tpvCameraControls.setTargetToFollow(playerCharacterObject, false); // Kamera ikuti karakter
        tpvCameraControls.update(0); // Update posisi kamera
    }

    // Reset mobil
    if (carObject) {
        const carRayOrigin = new THREE.Vector3(CAR_SPAWN_POSITION.x, RAYCAST_START_Y_FOR_ITEMS, CAR_SPAWN_POSITION.z);
        generalRaycaster.set(carRayOrigin, new THREE.Vector3(0, -1, 0));
        const carGroundIntersects = generalRaycaster.intersectObject(gameMapModel, true);
        const carFinalY = carGroundIntersects.length > 0 ? carGroundIntersects[0].point.y + (CAR_SCALE.y * 0.2) : 0.5;
        carObject.position.set(CAR_SPAWN_POSITION.x, carFinalY, CAR_SPAWN_POSITION.z);
        carObject.rotation.set(0,0,0);
        carObject.visible = true;
    }
    isPlayerInCar = false;

    // Hapus semua poop
    poopObjectsInScene.forEach(poop => { if(poop.parent) poop.removeFromParent(); });
    poopObjectsInScene.length = 0;
    if (playerController) playerController.poopObjects.length = 0; // Kosongkan juga di controller

    // Reset dan tampilkan kembali letters (tanpa loading progress update untuk restart cepat)
    assetsLoaded = 0; // Reset counter aset jika setupLetters melakukan load ulang
    totalAssetsToLoad = [...new Set(getCurrentDayName().toUpperCase().split(''))].length; // Hanya hitung huruf untuk loading
    await setupLetters(); // Muat ulang huruf

    // Spawn beberapa poop awal lagi
    if (playerController) { // Pastikan playerController sudah ada
      for (let i = 0; i < MAX_POOPS / 10; i++) {
          await spawnPoop(playerController);
      }
    }
    lastPoopSpawnTime = clock.getElapsedTime() * 1000;

    if (inputManager) inputManager.enable(); // Aktifkan kembali input
    console.log("Game telah direset.");
}

async function init() {
    const canvas = document.getElementById('game-canvas');
    playerCoordinatesDisplay = document.getElementById('player-coordinates');
    playerLivesDisplay = document.getElementById('player-lives');
    gameOverPopup = document.getElementById('game-over-popup');
    restartButton = document.getElementById('restart-button');
    loadingOverlay = document.getElementById('loading-overlay');
    loadingProgressBar = document.getElementById('loading-progress-bar');
    loadingStatusText = document.getElementById('loading-status');

    if (!canvas || !loadingOverlay || !restartButton ) { /* ... Cek elemen lain ... */
        console.error("Elemen UI penting tidak ditemukan!"); return;
    }
    updateLivesDisplay();
    restartButton.addEventListener('click', resetGame);

    // Hitung total aset utama yang akan di-load untuk progress bar
    totalAssetsToLoad = 0;
    totalAssetsToLoad++; // Map
    totalAssetsToLoad++; // Player
    totalAssetsToLoad++; // Car
    totalAssetsToLoad++; // HDR
    totalAssetsToLoad += [...new Set(getCurrentDayName().toUpperCase().split(''))].length; // Huruf unik
    // Poop di-load on-demand, jadi tidak masuk hitungan awal ini

    assetsLoaded = 0;
    updateLoadingProgress("Memulai...");


    scene = createScene();
    camera = createCamera();
    renderer = createRenderer(canvas);

    try {
        await loadEnvironment(scene, renderer, HDR_ENV_PATH);
        updateLoadingProgress("Langit dimuat...");
    } catch (e) { console.warn("HDR Gagal"); updateLoadingProgress("HDR Gagal"); }
    
    setupLights(scene);

    inputManager = new InputManager(canvas);
    inputManager.enable(); // Enable di sini, mungkin di-disable saat game over

    try {
        gameMapModel = await loadGLB(scene, MAP_MODEL_PATH, { name: "gameMap" });
        updateLoadingProgress("Peta dimuat...");
    } catch (error) { console.error("Gagal memuat map:", error); return; }

    // --- Load Huruf ---
    await setupLetters(); // Panggil fungsi setupLetters yang sudah ada progress update-nya
    
    // --- Load Mobil ---
    try {
        const carRayOrigin = new THREE.Vector3(CAR_SPAWN_POSITION.x, RAYCAST_START_Y_FOR_ITEMS, CAR_SPAWN_POSITION.z);
        generalRaycaster.set(carRayOrigin, new THREE.Vector3(0, -1, 0));
        const carGroundIntersects = generalRaycaster.intersectObject(gameMapModel, true);
        const carFinalY = carGroundIntersects.length > 0 ? carGroundIntersects[0].point.y + (CAR_SCALE.y * 0.2) : 0.5;
        carObject = await loadGLB(scene, CAR_MODEL_PATH, {
            position: { x: CAR_SPAWN_POSITION.x, y: carFinalY, z: CAR_SPAWN_POSITION.z },
            scale: CAR_SCALE, name: "PlayerCar"
        });
        carObject.visible = true;
        updateLoadingProgress("Mobil dimuat...");
    } catch (error) { console.error("Gagal memuat mobil:", error); updateLoadingProgress("Mobil gagal dimuat"); }

    // --- Load Player Character ---
    try {
        const { model, mixer, animations } = await loadFBX(scene, PLAYER_MODEL_PATH, PLAYER_INITIAL_POSITION, { name: "PlayerCharacter" });
        playerCharacterObject = model;
        playerCharacterObject.position.set(PLAYER_INITIAL_POSITION.x, PLAYER_INITIAL_POSITION.y, PLAYER_INITIAL_POSITION.z); // Set posisi awal
        playerCharacterObject.scale.set(0.015, 0.015, 0.015); // Pastikan skala dari kode Anda
        playerCharacterObject.visible = true;

        playerController = new PlayerController(
            playerCharacterObject, mixer, animations, inputManager, camera, gameMapModel,
            letterObjectsInScene, handleLetterCollected,
            poopObjectsInScene, handlePoopHit
        );
        tpvCameraControls = new TPVCameraControls(camera, playerCharacterObject, canvas, inputManager);
        tpvCameraControls.update(0);
        updateLoadingProgress("Pemain siap!");

    } catch (error) { console.error("Gagal memuat karakter pemain:", error); updateLoadingProgress("Karakter gagal"); return; }

    // Sembunyikan loading screen setelah semua aset utama dimuat
    // Beri sedikit delay agar progress 100% terlihat
    setTimeout(() => {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }, 500);


    // Spawn poop awal
    if (playerController) { // Pastikan playerController sudah ada
        for (let i = 0; i < MAX_POOPS / 10; i++) {
            await spawnPoop(playerController); // Hanya perlu playerController
        }
    }
    lastPoopSpawnTime = clock.getElapsedTime() * 1000;

    window.addEventListener('resize', () => { /* ... */ });
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

init().catch(err => {
    console.error("Initialization failed:", err);
    if(loadingStatusText) loadingStatusText.textContent = "Gagal memulai game!";
});