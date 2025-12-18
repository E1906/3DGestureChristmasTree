
import * as THREE from 'three';
import { setupScene } from './visuals/scene.js';
import { createTree, updateTree } from './visuals/tree.js';
import { createPhoto, updatePhoto } from './visuals/photo.js';
import { createSnow, updateSnow } from './visuals/snow.js';
import { createFireworks, updateFireworks } from './visuals/fireworks.js';
import { initializeHandTracking } from './tracking/hands.js';

// Application State
const state = {
    gesture: 'IDLE', // Current STABLE gesture
    treeScale: 1,
    rotationSpeed: 0.005,
    showPhoto: false,

    // Debounce State
    pendingGesture: 'IDLE',
    pendingGestureStartTime: 0,
    
    // Stability/History State
    sphereStartTime: null,
    lastValidSphereTime: 0,
    lastValidIndexTime: 0
};

// ... init ...

function handleGesture(rawGesture) {
    const now = Date.now();
    
    // --- DEBOUNCE LOGIC (Anti-Jitter) ---
    // User must hold a gesture for X ms before it counts
    if (rawGesture !== state.pendingGesture) {
        // Gesture changed? Start timer
        state.pendingGesture = rawGesture;
        state.pendingGestureStartTime = now;
    }

    let stableGesture = state.gesture;
    
    // Threshold: 150ms to switch
    if (now - state.pendingGestureStartTime > 150) {
        stableGesture = state.pendingGesture;
    }

    // Use stableGesture for all logic below
    let effectiveGesture = stableGesture;

    // --- STABILITY LOGIC (INPUT TRACKING) ---
    // Track raw sphere input for start time logic
    if (stableGesture === 'OPEN_PALM') {
        state.lastValidSphereTime = now;
        if (!state.sphereStartTime) state.sphereStartTime = now;
    } else {
        if (now - (state.lastValidSphereTime || 0) > 2000) { 
             state.sphereStartTime = null; 
        }
    }

    // --- INTERACTION LOGIC ---
    if (stableGesture === 'INDEX_POINT') {
        const timeSinceSphere = now - (state.lastValidSphereTime || 0);
        
        // Condition: Must have been in Sphere Mode recently
        // OR we are ALREADY in Index Mode (stickiness)
        const isSticky = (now - (state.lastValidIndexTime || 0) < 500); 
        
        if ((timeSinceSphere < 2000 && state.sphereStartTime) || isSticky) {
             const duration = now - state.sphereStartTime;
             
             // If sticky, we ignore the timer (already passed it)
             if (isSticky || duration > 400) {
                 // Valid - Pass through
             } else {
                 // console.log("Too soon!"); // Spams console
                  effectiveGesture = 'OPEN_PALM'; 
             }
        } else {
            effectiveGesture = 'IDLE'; // Not sphere mode recently -> IGNORE Index Point
        }
    } else if (stableGesture === 'IDLE') {
        // Stabilize IDLE gaps
        const timeSincePalm = now - (state.lastValidSphereTime || 0);
        const timeSinceIndex = now - (state.lastValidIndexTime || 0);
        
        // Priority: If we were just pointing, keep pointing (Photo stays up)
        if (timeSinceIndex < 800) { 
            effectiveGesture = 'INDEX_POINT';
        }
        // Else if likely just dropped Palm
        else if (timeSincePalm < 500) {
            effectiveGesture = 'OPEN_PALM';
        }
    }

    state.gesture = effectiveGesture;
    
    // update valid timestamps based on RESULT
    if (effectiveGesture === 'OPEN_PALM') {
        state.treeScale = 1.5; 
        state.rotationSpeed = 0.02;
        state.showPhoto = false;
    } else if (effectiveGesture === 'INDEX_POINT') {
        // ONLY update timestamp if the USER is actually pointing (STABLE).
        if (stableGesture === 'INDEX_POINT') {
            state.lastValidIndexTime = now;
        }

        state.treeScale = 1.0;
        state.rotationSpeed = 0;
        state.showPhoto = true;
    } else {
        // IDLE
        state.treeScale = 1.0;
        state.rotationSpeed = 0.005;
        state.showPhoto = false;
    }
}

// Helper to create faint background Cross
function createBackgroundCross(scene) {
    const crossGroup = new THREE.Group();
    
    const material = new THREE.MeshBasicMaterial({
        color: 0xffeebb, // Warm white
        transparent: true,
        opacity: 0.005, // Very faint
        fog: false // Ignore fog to stay visible
    });

    // Vertical Box (Huge)
    const vGeo = new THREE.BoxGeometry(1.5, 20, 1);
    const vMesh = new THREE.Mesh(vGeo, material);
    
    // Horizontal Box (Huge)
    const hGeo = new THREE.BoxGeometry(12, 1.5, 1);
    const hMesh = new THREE.Mesh(hGeo, material);
    hMesh.position.y = 4.0; // Higher crossbar relative to center

    crossGroup.add(vMesh);
    crossGroup.add(hMesh);
    
    // Position: Far away and High up
    crossGroup.position.set(0, 9, -25);
    
    scene.add(crossGroup);
    return { crossGroup, material };
}

async function init() {
    // 1. Setup Three.js Scene
    const { scene, camera, renderer } = setupScene();
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 1.5 Background Cross
    const { material: crossMat } = createBackgroundCross(scene);

    // 2. Create Visual Elements
    // Load photos...
    // Load photos by scraping the directory listing
    let photoUrls = [];
    try {
        // Fetch the directory page (generated by http-server/LiveServer)
        const response = await fetch('./assets/');
        if (!response.ok) throw new Error('Directory listing not available');
        
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        // Find all links (anchors)
        const links = Array.from(doc.querySelectorAll('a'));
        
        // Filter for image files
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        photoUrls = links
            .map(link => link.getAttribute('href')) // Get the href
            .filter(href => {
                if (!href) return false;
                const lower = href.toLowerCase();
                return imageExtensions.some(ext => lower.endsWith(ext));
            })
            .map(href => {
                // Ensure path is relative to root if it's just a filename
                return href.startsWith('http') || href.startsWith('/') 
                    ? href 
                    : `./assets/${href}`;
            });

        console.log("Discovered photos:", photoUrls);

        if (photoUrls.length === 0) throw new Error("No photos found in directory listing");

    } catch (err) {
        console.warn("Could not load photos from directory listing. Using fallback.", err);
        // Fallback
        photoUrls = ['./assets/christmas.png', './assets/1742792632841078_2.png', './assets/1743222584511748_4.png', './assets/1743574302300273_3.png']; 
    }
    
    // Pre-load all photo textures
    const textureLoader = new THREE.TextureLoader();
    const photoTextures = await Promise.all(photoUrls.map(url => {
        return new Promise((resolve) => textureLoader.load(url, resolve, undefined, (err) => {
            console.error(`Failed to load image: ${url}`, err);
            resolve(null); // Resolve null to avoid crash
        }));
    })).then(results => results.filter(tex => tex !== null)); // Filter out failures

    // Create Photo Frame (Main Display)
    const photoMesh = createPhoto(scene, photoTextures);

    // Create Tree (with thumbnails)
    const treeObj = createTree(scene, photoTextures);

    // 3. Create Snow
    const snowSystem = createSnow(scene);
    
    // 3.5 Create Fireworks
    const fireworksSystem = createFireworks(scene);

    // 4. Start Hand Tracking
    document.getElementById('loading-overlay').classList.add('hidden');
    
    // Gesture callback
    initializeHandTracking((gesture) => {
        handleGesture(gesture);
    });

    // 5. Animation Loop
    const clock = new THREE.Clock();
    
    function animate() {
        requestAnimationFrame(animate);
        
        const time = clock.getElapsedTime();
        const delta = clock.getDelta(); // Not really used but good practice

        // Logic updates...
        updateTree(treeObj, state, time);
        updatePhoto(photoMesh, state); // Update photo visibility/tex
        updateSnow(snowSystem, time);
        updateFireworks(fireworksSystem, state);
        
        // Faint Cross Pulse
        // Faint Cross Pulse
        const crossAlpha = 0.02 + Math.sin(time * 0.5) * 0.01; // 0.01 to 0.03 (Very Faint)
        crossMat.opacity = crossAlpha;

        renderer.render(scene, camera);
    }
    animate();
}

// Original handleGesture removed.


// Start application
init().then(() => {
    // Music Logic
    const bgm = document.getElementById('bgm');
    const toggleBtn = document.getElementById('music-toggle');
    let isPlaying = false;

    // Function to attempt playback
    const tryPlayMusic = () => {
        if (isPlaying) return;
        bgm.play().then(() => {
            console.log("Auto-play successful");
            isPlaying = true;
            toggleBtn.textContent = "🎶 音乐播放中";
            toggleBtn.style.color = "#ffd700";
        }).catch(e => {
            console.log("Auto-play blocked, waiting for interaction...");
            // Wait for ANY user interaction
            const events = ['click', 'touchstart', 'keydown'];
            const onInteraction = () => {
                if (!isPlaying) tryPlayMusic();
                events.forEach(evt => document.removeEventListener(evt, onInteraction));
            };
            events.forEach(evt => document.addEventListener(evt, onInteraction, { once: true }));
        });
    };

    // One-time interaction handler
    const onFirstInteraction = () => {
        if (!isPlaying) tryPlayMusic();
    };

    // Manually Toggle
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger document listener if clicking button
        if (isPlaying) {
            bgm.pause();
            isPlaying = false;
            toggleBtn.textContent = "🔇 播放音乐";
            toggleBtn.style.color = "white";
        } else {
            tryPlayMusic();
        }
    });

    // Try immediately on load!
    tryPlayMusic();

}).catch(console.error);

// Handle window resize
window.addEventListener('resize', () => {
    // Reload page or handle resize logic in scene.js (simplification)
    // For now we will rely on css and reload if needed, but proper resize is better:
    // camera.aspect = window.innerWidth / window.innerHeight;
    // camera.updateProjectionMatrix();
    // renderer.setSize(window.innerWidth, window.innerHeight);
});

