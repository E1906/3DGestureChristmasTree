
import { FilesetResolver, HandLandmarker } from '../libs/mediapipe/vision_bundle.js';

let handLandmarker = undefined;
let webcam = undefined;
let runningMode = "VIDEO";
let lastGestureTime = 0;

export async function initializeHandTracking(onGestureChange) {
    const vision = await FilesetResolver.forVisionTasks(
        "./libs/mediapipe/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `./libs/mediapipe/models/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: runningMode,
        numHands: 1
    });

    webcam = document.getElementById("webcam");
    
    // Check webcam permissions and start stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            webcam.srcObject = stream;
            
            // Wait for video to load
            await new Promise((resolve) => {
                webcam.addEventListener("loadeddata", resolve);
            });
            
            // Start prediction loop
            predictWebcam(onGestureChange);
            
        } catch (err) {
            console.error("Webcam access denied or error:", err);
            alert("Please enable webcam access for gesture control.");
        }
    }
}

async function predictWebcam(onGestureChange) {
    if (!handLandmarker) return;

    let startTimeMs = performance.now();
    
    if (webcam.currentTime !== lastGestureTime) {
        lastGestureTime = webcam.currentTime;
        
        const results = handLandmarker.detectForVideo(webcam, startTimeMs);
        
        if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const gesture = recognizeGesture(landmarks);
            onGestureChange(gesture);
        } else {
            onGestureChange('IDLE');
        }
    }

    window.requestAnimationFrame(() => predictWebcam(onGestureChange));
}

function recognizeGesture(landmarks) {
    // Simple logic:
    // Tips: Index(8), Middle(12), Ring(16), Pinky(20), Thumb(4)
    // Dips/Pips/Mcp logic is solid, but for simple "Open vs Index" checking Y position of tip vs Pip is usually enough for upright hand.
    
    // Check if fingers are extended
    // Tip y < Pip y (assuming hand is upright, coordinate system 0 at top)
    
    const isThumbExtended = landmarks[4].x < landmarks[3].x; // Simplified for right hand/mirror, usually distance based is better 
    // Let's use distance from Wrist(0) to Tip vs Wrist to PIP
    
    const isFingerExtended = (tipIdx, pipIdx) => {
        // Distance check is more robust for rotation
        const dTip = dist(landmarks[0], landmarks[tipIdx]);
        const dPip = dist(landmarks[0], landmarks[pipIdx]);
        return dTip > dPip * 1.1; // Tip significantly further from wrist
    };
    
    const indexExt = isFingerExtended(8, 6);
    const middleExt = isFingerExtended(12, 10);
    const ringExt = isFingerExtended(16, 14);
    const pinkyExt = isFingerExtended(20, 18);
    // Thumb is tricky, let's use a simpler heuristic for open palm: 4+ fingers
    
    let extendedCount = 0;
    if (indexExt) extendedCount++;
    if (middleExt) extendedCount++;
    if (ringExt) extendedCount++;
    if (pinkyExt) extendedCount++;
    
    // Check 5 fingers (Palm)
    if (extendedCount >= 3) { // Lenient
        return 'OPEN_PALM';
    }
    
    // Check 1 Finger (Index)
    if (indexExt && !middleExt && !ringExt && !pinkyExt) {
        return 'INDEX_POINT';
    }
    
    return 'IDLE';
}

function dist(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
}
