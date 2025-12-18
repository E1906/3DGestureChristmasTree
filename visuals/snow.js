
import * as THREE from 'three';

export function createSnow(scene) {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = []; // Fall speed
    const initialCoords = []; // Store initial x,z for sway calculation
    const swayOffsets = []; // Random phase for sway

    for (let i = 0; i < particleCount; i++) {
        // Wider area to match wider tree
        const x = (Math.random() - 0.5) * 15; 
        const y = Math.random() * 10 - 5;
        const z = (Math.random() - 0.5) * 15;
        
        positions.push(x, y, z);
        initialCoords.push(x, z);
        
        // Slower, gentler fall (0.005 to 0.02)
         velocities.push(0.005 + Math.random() * 0.015);
        swayOffsets.push(Math.random() * Math.PI * 2);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 1));
    geometry.setAttribute('initialCoord', new THREE.Float32BufferAttribute(initialCoords, 2));
    geometry.setAttribute('swayOffset', new THREE.Float32BufferAttribute(swayOffsets, 1));

    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.08, 
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        map: createSnowTexture(),
        depthWrite: false
    });

    const snow = new THREE.Points(geometry, material);
    scene.add(snow);

    return { snow };
}

function createSnowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Softer gradient
    const grad = ctx.createRadialGradient(16,16,0,16,16,16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,32,32);

    return new THREE.CanvasTexture(canvas);
}

export function updateSnow(snowObj) {
    // Generate a time-like value since we don't pass 'time' everywhere yet,
    // or we can attach a counter to the object.
    if (!snowObj.time) snowObj.time = 0;
    snowObj.time += 0.015;

    const { snow } = snowObj;
    const positions = snow.geometry.attributes.position.array;
    const velocities = snow.geometry.attributes.velocity.array;
    const initialCoords = snow.geometry.attributes.initialCoord.array;
    const swayOffsets = snow.geometry.attributes.swayOffset.array;
    
    for (let i = 0; i < positions.length / 3; i++) {
        // Update Y (Fall)
        positions[i * 3 + 1] -= velocities[i];

        // Reset if too low
        if (positions[i * 3 + 1] < -5) {
            positions[i * 3 + 1] = 6;
        }

        // Sway (X and Z)
        // x = initialX + sin(time + offset) * amp
        const swayAmp = 0.5;
        positions[i * 3] = initialCoords[i * 2] + Math.sin(snowObj.time + swayOffsets[i]) * swayAmp;
        positions[i * 3 + 2] = initialCoords[i * 2 + 1] + Math.cos(snowObj.time + swayOffsets[i]) * swayAmp;
    }

    snow.geometry.attributes.position.needsUpdate = true;
}
