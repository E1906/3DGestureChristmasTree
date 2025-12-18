
import * as THREE from 'three';

export function createTree(scene, extraTextures = []) {
    const treeGroup = new THREE.Group();
    scene.add(treeGroup);

    // Helper to create geometries with morph targets
    function createMorphGeometry(count, type, baseR, h) {
        const geo = new THREE.BufferGeometry();
        const startPos = []; // Cone
        const endPos = [];   // Sphere
        const colors = [];
        const phases = [];

        for (let i = 0; i < count; i++) {
            // 1. Cone Position (Tree)
            let x, y, z;
            if (type === 'needle') {
                const hh = Math.random(); 
                const r = (1 - hh) * baseR + Math.random() * 0.3; 
                const angle = hh * 25 + Math.random() * Math.PI * 2;
                x = Math.cos(angle) * r;
                y = hh * h - h / 2;
                z = Math.sin(angle) * r;

                // Color Mixed: Green, Red, White/Gold
                const col = new THREE.Color();
                const rand = Math.random();
                if (rand > 0.9) {
                    col.setHex(0xff0000); // Red Ornaments mixed in needles
                } else if (rand > 0.8) {
                    col.setHex(0xffffff); // White Snow/Sparkle
                } else {
                    // Tree Green
                    col.setHSL(0.3 + Math.random() * 0.1, 0.8, 0.4 + Math.random() * 0.2);
                }
                colors.push(col.r, col.g, col.b);

            } else if (type === 'star') {
                const hh = Math.random();
                const r = (1 - hh) * baseR * 0.95; 
                const angle = Math.random() * Math.PI * 2;
                x = Math.cos(angle) * r;
                y = hh * h - h / 2;
                z = Math.sin(angle) * r;

                 // Color: Mostly Gold, some Red
                const col = new THREE.Color();
                if (Math.random() > 0.3) {
                    col.setHex(0xffd700); // Gold
                } else {
                    col.setHex(0xff0000); // Red Star
                }
                colors.push(col.r, col.g, col.b);
            }
            startPos.push(x, y, z);

            // 2. Sphere Position (Target)
            const phi = Math.acos(-1 + (2 * i) / count); // Uniform distribution
            const theta = Math.sqrt(count * Math.PI) * phi;
            const rSphere = 2.0 + Math.random() * 0.5; // Sphere radius approx 2-2.5
            
            const sx = rSphere * Math.cos(theta) * Math.sin(phi);
            const sy = rSphere * Math.sin(theta) * Math.sin(phi);
            const sz = rSphere * Math.cos(phi);
            endPos.push(sx, sy, sz);

            phases.push(Math.random() * Math.PI * 2);
        }

        geo.setAttribute('position', new THREE.Float32BufferAttribute(startPos, 3)); // Current pos
        geo.setAttribute('conePos', new THREE.Float32BufferAttribute(startPos, 3));
        geo.setAttribute('spherePos', new THREE.Float32BufferAttribute(endPos, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        return { geo, phases };
    }

    // 1. Tree Needles
    const { geo: needleGeo } = createMorphGeometry(2500, 'needle', 2.5, 4.5); // More particles
    const needleMat = new THREE.PointsMaterial({
        size: 0.12, vertexColors: true, map: createCircleTexture(),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        opacity: 0.9
    });
    const treePoints = new THREE.Points(needleGeo, needleMat);
    treeGroup.add(treePoints);

    // 2. Stars (Ornaments)
    const { geo: starGeo, phases: starPhases } = createMorphGeometry(300, 'star', 2.5, 4.5);
    const starMat = new THREE.PointsMaterial({
        size: 0.2, vertexColors: true, map: createStarTexture(),
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    treeGroup.add(starPoints);

    // 3. Orbs (Halo/Sphere)
    const orbCount = 300;
    const orbGeo = new THREE.BufferGeometry();
    const orbPos = [];
    const orbColors = [];
    for(let i=0; i<orbCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const rad = 2.5 + Math.random() * 1.5; 
        const x = rad * Math.sin(phi) * Math.cos(theta);
        const y = rad * Math.sin(phi) * Math.sin(theta);
        const z = rad * Math.cos(phi);
        orbPos.push(x, y, z);
        const color = new THREE.Color();
        color.setHSL(Math.random(), 0.9, 0.7);
        orbColors.push(color.r, color.g, color.b);
    }
    orbGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbPos, 3));
    orbGeo.setAttribute('color', new THREE.Float32BufferAttribute(orbColors, 3));
    const orbMat = new THREE.PointsMaterial({
        size: 0.15, vertexColors: true, map: createCircleTexture(),
        transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const orbPoints = new THREE.Points(orbGeo, orbMat);
    treeGroup.add(orbPoints);

    // 4. BIG TOP STAR
    const topStarGeo = new THREE.PlaneGeometry(0.8, 0.8);
    const topStarMat = new THREE.MeshBasicMaterial({ 
        map: createStarTexture(), color: 0xffff00, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
    });
    const topStar = new THREE.Mesh(topStarGeo, topStarMat);
    topStar.position.set(0, 4.5/2 + 0.2, 0); 
    treeGroup.add(topStar);

    // 5. Multicolor Sparkling Spheres
    const goldCount = 55;
    const goldGeo = new THREE.SphereGeometry(0.07, 16, 16);
    // Material color white to allow instance colors to show true
    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xffffff, 
        metalness: 0.5, 
        roughness: 0.2,
        emissive: 0x000000,
    });
    const goldMesh = new THREE.InstancedMesh(goldGeo, goldMat, goldCount);
    treeGroup.add(goldMesh);

    // Pre-calculate positions and colors
    const goldData = [];
    const dummy = new THREE.Object3D();
    const palette = [0xB8860B, 0xE5ACB6, 0xFFD700, 0xDC143C]; // Dark Gold, Rose Gold, Gold, Red
    
    for (let i = 0; i < goldCount; i++) {
        // 1. Cone Position
        const h = Math.random() * 0.8 + 0.1; 
        const r = (1 - h) * 2.5 * 0.9; 
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * r;
        const y = h * 4.5 - 4.5 / 2;
        const z = Math.sin(angle) * r;
        const conePos = new THREE.Vector3(x, y, z);

        // 2. Sphere Position
        const phi = Math.acos(-1 + (2 * i) / goldCount);
        const theta = Math.sqrt(goldCount * Math.PI) * phi;
        const rSphere = 2.0 + Math.random() * 0.5;
        const sx = rSphere * Math.cos(theta) * Math.sin(phi);
        const sy = rSphere * Math.sin(theta) * Math.sin(phi);
        const sz = rSphere * Math.cos(phi);
        const spherePos = new THREE.Vector3(sx, sy, sz);

        // 3. Color
        const colorHex = palette[Math.floor(Math.random() * palette.length)];
        const baseColor = new THREE.Color(colorHex);
        const phase = Math.random() * Math.PI * 2;

        goldData.push({ conePos, spherePos, baseColor, phase });
        
        // Init at cone
        dummy.position.copy(conePos);
        dummy.updateMatrix();
        goldMesh.setMatrixAt(i, dummy.matrix);
        goldMesh.setColorAt(i, baseColor);
    }
    goldMesh.instanceMatrix.needsUpdate = true;
    goldMesh.instanceColor.needsUpdate = true;

    
    // ... Photo Ornaments (Keep unchanged) ...



    // REMOVED GIFT GROUP

    // 6. Photo Thumbnails (Ornaments)
    const photoData = [];
    if (extraTextures && extraTextures.length > 0) {
        const photoCount = extraTextures.length;
        const photoGeo = new THREE.PlaneGeometry(0.4, 0.4);
        
        for(let i=0; i<photoCount; i++) {
            const tex = extraTextures[i];
            const mat = new THREE.MeshBasicMaterial({ 
                map: tex, 
                side: THREE.DoubleSide,
                transparent: true
            });
            const mesh = new THREE.Mesh(photoGeo, mat);
            
            // 1. Cone Position
            const h = (i + 0.5) / photoCount * 0.7 + 0.15; 
            const r = (1 - h) * 2.5 * 1.05; 
            const angle = Math.random() * Math.PI * 2;
            const conePos = new THREE.Vector3(
                Math.cos(angle) * r,
                h * 4.5 - 4.5/2,
                Math.sin(angle) * r
            );

            // 2. Sphere Position
            const phi = Math.acos(-1 + (2 * i) / photoCount);
            const theta = Math.sqrt(photoCount * Math.PI) * phi;
            const rSphere = 2.5; // Fixed radius on surface
            const sx = rSphere * Math.cos(theta) * Math.sin(phi);
            const sy = rSphere * Math.sin(theta) * Math.sin(phi);
            const sz = rSphere * Math.cos(phi);
            const spherePos = new THREE.Vector3(sx, sy, sz);

            mesh.position.copy(conePos);
            
            // Initial orient
            mesh.lookAt(0, conePos.y, 0);
            mesh.rotateY(Math.PI);
            mesh.rotation.z = (Math.random() - 0.5) * 0.5;

            treeGroup.add(mesh);
            photoData.push({ mesh, conePos, spherePos });
        }
    }

    return { treeGroup, treePoints, starPoints, orbPoints, starPhases, topStar, goldMesh, goldData, photoData };
}

function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)'); // Brighter core
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
}

function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 15; // More glow
    ctx.shadowColor = "white";
    ctx.beginPath();
    const cx = 32, cy = 32, outerRadius = 24, innerRadius = 10;
    for(let i=0; i<5; i++){
        let angle = (i * 4 * Math.PI) / 10 - Math.PI / 2;
        ctx.lineTo(cx + Math.cos(angle) * outerRadius, cy + Math.sin(angle) * outerRadius);
        angle += Math.PI / 5;
        ctx.lineTo(cx + Math.cos(angle) * innerRadius, cy + Math.sin(angle) * innerRadius);
    }
    ctx.closePath();
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}

export function updateTree(treeObj, state, time) {
    const { treeGroup, treePoints, starPoints, orbPoints, starPhases, topStar, goldMesh, goldData } = treeObj;
    
    // Rotation
    treeGroup.rotation.y += state.rotationSpeed;
    orbPoints.rotation.y -= state.rotationSpeed * 0.5;
    
    const targetScale = state.treeScale;
    treeGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    // Morph Logic
    const targetMorph = state.gesture === 'OPEN_PALM' ? 1 : 0;
    if (!state.morphCurrent) state.morphCurrent = 0;
    state.morphCurrent += (targetMorph - state.morphCurrent) * 0.05;

    // Apply Morph to Needles and Stars
    const morphGeometries = [treePoints.geometry, starPoints.geometry];
    
    morphGeometries.forEach(geo => {
        const positions = geo.attributes.position.array;
        const conePos = geo.attributes.conePos.array;
        const spherePos = geo.attributes.spherePos.array;

        for(let i = 0; i < positions.length; i++) {
            positions[i] = conePos[i] * (1 - state.morphCurrent) + spherePos[i] * state.morphCurrent;
        }
        geo.attributes.position.needsUpdate = true;
    });

    // Apply Morph & Sparkle to Gold Spheres (InstancedMesh)
    const dummy = new THREE.Object3D();
    const tempColor = new THREE.Color();
    
    for (let i = 0; i < goldData.length; i++) {
        const { conePos, spherePos, baseColor, phase } = goldData[i];
        
        // 1. Lerp position
        const currentPos = new THREE.Vector3().copy(conePos).lerp(spherePos, state.morphCurrent);
        dummy.position.copy(currentPos);
        dummy.updateMatrix();
        goldMesh.setMatrixAt(i, dummy.matrix);
        
        // 2. Sparkling Color
        // Modulate brightness
        const blink = (Math.sin(time * 6 + phase) + 1) / 2;
        const intensity = 0.5 + blink * 1.5; // Pulse from 0.5x to 2.0x brightness
        
        tempColor.copy(baseColor).multiplyScalar(intensity);
        goldMesh.setColorAt(i, tempColor);
    }
    goldMesh.instanceMatrix.needsUpdate = true;
    goldMesh.instanceColor.needsUpdate = true;

    // Apply Morph to Photo Thumbnails
    if (treeObj.photoData) {
        treeObj.photoData.forEach(item => {
            const { mesh, conePos, spherePos } = item;
            
            // Position
            const currentPos = new THREE.Vector3().copy(conePos).lerp(spherePos, state.morphCurrent);
            mesh.position.copy(currentPos);
            
            // Orientation: Constantly face outwards from center
            // Simple way: look at origin, then rotate 180
            mesh.lookAt(0, 0, 0);
            mesh.rotateY(Math.PI);
        });
    }


    // Fade out Top Star
    const solidOpacity = 1 - state.morphCurrent;
    topStar.material.opacity = solidOpacity;
    topStar.visible = solidOpacity > 0.01;

    // Twinkle Stars - Intense Sparkle
    const colors = starPoints.geometry.attributes.color;
    
    for(let i = 0; i < starPhases.length; i++) {
        // 1. Regular Sparkle (Fast)
        const input = time * 8 + starPhases[i];
        const blink = (Math.sin(input) + 1) / 2; 
        const regularSparkle = Math.pow(blink, 3); // Spiky blink
        
        // 2. Occasional "Camera Flash" (Rare, Random-ish)
        const flashInput = time * 1.3 + starPhases[i] * 13.7; 
        const flashWave = (Math.sin(flashInput) + 1) / 2;
        const flashIntensity = Math.pow(flashWave, 40); // Very rare spike
        
        // Combine
        let brightness = 0.5 + regularSparkle * 2.0;
        let isFlashing = false;

        if (flashIntensity > 0.6) {
             // Boom! Camera flash effect
             brightness = 4.0 + flashIntensity * 6.0; // Extremely bright
             isFlashing = true;
        }

        // Color Logic
        let r, g, b;
        
        if (isFlashing) {
            // Pure White Flash
            r = 1.0; g = 1.0; b = 1.0;
        } else {
            // Normal Colors
            if (i % 3 === 0) { // Red
                r=1; g=0.1; b=0.1;
            } else if (i % 3 === 1) { // Gold
                 r=1; g=0.84; b=0;
            } else { // White/Blueish
                 r=0.8; g=0.8; b=1;
            }
        }
        
        colors.setXYZ(i, r * brightness, g * brightness, b * brightness);
    }
    colors.needsUpdate = true;
}

