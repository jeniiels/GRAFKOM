// js/objects.js
import * as THREE from 'three';

export function createAllObjects() {
    const objects = {};

    // Warna default untuk objek
    const defaultCubeColor = 0x00ff00; // Hijau
    const defaultSphereColor = 0xff0000; // Merah
    const defaultPyramidColor = 0x0000ff; // Biru
    const defaultPlaneColor = 0x888888; // Abu-abu

    // 1. Create Plane (Lantai)
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({
        color: defaultPlaneColor, // Gunakan warna, bukan map
        roughness: 1.0,
        metalness: 0.0,
        side: THREE.DoubleSide
    });
    objects.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    objects.plane.name = "plane"; // Beri nama untuk identifikasi (opsional untuk plane)
    objects.plane.rotation.x = -Math.PI / 2;
    objects.plane.position.y = -1.5;
    objects.plane.receiveShadow = true;


    // 2. Create Cube
    const cubeGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const cubeMaterial = new THREE.MeshStandardMaterial({
        color: defaultCubeColor, // Gunakan warna
        roughness: 0.5,
        metalness: 0.1
    });
    objects.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    objects.cube.name = "cube"; // Beri nama untuk identifikasi raycasting
    // Simpan warna asli
    objects.cube.userData.originalColor = new THREE.Color(defaultCubeColor);
    objects.cube.castShadow = true;
    objects.cube.receiveShadow = true;


    // 3. Create Sphere
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
        color: defaultSphereColor, // Gunakan warna
        roughness: 0.2, // Biarkan roughness berbeda untuk variasi visual
        metalness: 0.1
    });
    objects.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    objects.sphere.name = "sphere"; // Beri nama
    // Simpan warna asli
    objects.sphere.userData.originalColor = new THREE.Color(defaultSphereColor);
    objects.sphere.castShadow = true;
    objects.sphere.receiveShadow = true;


    // 4. Create Pyramid (Limas Segi Empat)
    const pyramidGeometry = new THREE.ConeGeometry(1, 1.5, 4);
    const pyramidMaterial = new THREE.MeshStandardMaterial({
        color: defaultPyramidColor, // Gunakan warna
        roughness: 0.7, // Biarkan roughness berbeda
        metalness: 0.1
    });
    objects.pyramid = new THREE.Mesh(pyramidGeometry, pyramidMaterial);
    objects.pyramid.name = "pyramid"; // Beri nama
    // Simpan warna asli
    objects.pyramid.userData.originalColor = new THREE.Color(defaultPyramidColor);
    objects.pyramid.geometry.rotateY(Math.PI / 4);
    objects.pyramid.castShadow = true;
    objects.pyramid.receiveShadow = true;

    // Sesuaikan posisi y objek agar pas di atas plane
    const planeY = objects.plane.position.y;
    objects.cube.position.set(-2.5, (1.5 / 2) + planeY, 0);
    objects.sphere.position.set(0, 1 + planeY, 0);
    objects.pyramid.position.set(2.5, (1.5 / 2) + planeY, 0);

    return objects;
}