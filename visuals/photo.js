
import * as THREE from 'three';

export function createPhoto(scene, textures) {
    // Photo Frame Geometry
    // Use 1x1 geometry so scale corresponds directly to world size
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({ 
        map: textures && textures.length > 0 ? textures[0] : null, 
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
    });
    
    const photoMesh = new THREE.Mesh(geometry, material);
    photoMesh.position.set(0, 1, 3.2); // Align with camera Y=1, in front Z=3.2
    photoMesh.renderOrder = 999; // Force render on top
    photoMesh.material.depthTest = false; // Always visible on top of tree 
    
    // Attach textures array to the mesh for easy access
    photoMesh.userData.textures = textures;
    
    scene.add(photoMesh);
    return photoMesh;
}

export function updatePhoto(photoMesh, state) {
    if (!photoMesh || !photoMesh.material) return;

    if (state.showPhoto) {
        // Just starting to show? Swap texture!
        // We know we are starting if opacity is 0 (or very close)
        if (photoMesh.material.opacity < 0.01) {
            const textures = photoMesh.userData.textures;
            if (textures && textures.length > 0) {
                const randIndex = Math.floor(Math.random() * textures.length);
                const tex = textures[randIndex];
                photoMesh.material.map = tex;
                
                // Adjust scale to maintain aspect ratio
                if (tex && tex.image) {
                    const aspect = tex.image.width / tex.image.height;
                    const maxSize = 2.0; // Maximum size in either dimension
                    
                    if (aspect >= 1) {
                        // Landscape / Square
                        photoMesh.scale.set(maxSize, maxSize / aspect, 1);
                    } else {
                        // Portrait
                        photoMesh.scale.set(maxSize * aspect, maxSize, 1);
                    }
                } else {
                    // Fallback square
                    photoMesh.scale.set(1.8, 1.8, 1);
                }

                photoMesh.material.needsUpdate = true; // Ensure visual update
            }
        }
        
        // Fade in
        if (photoMesh.material.opacity < 1) {
            photoMesh.material.opacity += 0.08; // Faster fade in (Optimization)
        }
    } else {
        // Fade out
        if (photoMesh.material.opacity > 0) {
            photoMesh.material.opacity -= 0.08;
        }
    }
}
