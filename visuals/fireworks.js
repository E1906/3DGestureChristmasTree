
import * as THREE from 'three';

export function createFireworks(scene) {
    // We will return a container object that holds the state of our fireworks
    return {
        scene: scene,
        activeFireworks: [] // Arrays of firework objects
    };
}

export function updateFireworks(system, state) {
    // Only spawn if showPhoto is true
    if (state.showPhoto) {
        // ~2% chance per frame to spawn a new firework
        if (Math.random() < 0.03) {
            spawnFirework(system);
        }
    }

    // Update all active fireworks
    const gravity = -0.005;
    for (let i = system.activeFireworks.length - 1; i >= 0; i--) {
        const fw = system.activeFireworks[i];
        
        fw.age++;
        
        const positions = fw.mesh.geometry.attributes.position.array;
        
        for (let k = 0; k < fw.particleCount; k++) {
            // Update velocity with gravity
            fw.velocities[k * 3 + 1] += gravity;

            // Update position
            positions[k * 3] += fw.velocities[k * 3];
            positions[k * 3 + 1] += fw.velocities[k * 3 + 1];
            positions[k * 3 + 2] += fw.velocities[k * 3 + 2];
        }
        
        fw.mesh.geometry.attributes.position.needsUpdate = true;
        
        // Fade out
        if (fw.age > fw.life) {
            fw.mesh.material.opacity -= 0.02;
        }
        
        // Remove if invisible
        if (fw.mesh.material.opacity <= 0) {
            fw.isDead = true;
        }
    }
}

function spawnFirework(system) {
    const particleCount = 100 + Math.floor(Math.random() * 100);
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    
    // Random starting position for the explosion center
    // Behind the tree (z < 0) and somewhat high up
    const startX = (Math.random() - 0.5) * 12; // Slightly wider
    const startY = 2 + Math.random() * 5;
    const startZ = -2 - Math.random() * 6; // Closer: -2 to -8
    
    const color = new THREE.Color().setHSL(Math.random(), 1.0, 0.6); // Bright random color

    for (let i = 0; i < particleCount; i++) {
        positions.push(startX, startY, startZ);
        
        // Explosion velocity: sphere distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const speed = 0.05 + Math.random() * 0.1;
        
        const vx = speed * Math.sin(phi) * Math.cos(theta);
        const vy = speed * Math.sin(phi) * Math.sin(theta);
        const vz = speed * Math.cos(phi);
        
        velocities.push(vx, vy, vz);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: color,
        size: 0.15,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const mesh = new THREE.Points(geometry, material);
    system.scene.add(mesh);
    
    system.activeFireworks.push({
        mesh: mesh,
        velocities: velocities,
        particleCount: particleCount,
        age: 0,
        life: 40 + Math.random() * 20, // Frames before fading
        isDead: false
    });
}
