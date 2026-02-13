<script lang="ts">
    import * as THREE from "three";
    import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
    import { onMount, onDestroy } from "svelte";

    // --- Props ---
    export let speaking = false;
    export let isSpeaking = false; // Stato di parlato in tempo reale (dai boundary events)

    // --- Riferimenti Three.js ---
    let canvas: HTMLCanvasElement;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let clock = new THREE.Clock();
    let animationId: number;
    let model: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;

    // --- Gestione Morph Targets (Espressioni Facciali) ---
    // mouthMeshes: Array di mesh (pelle, denti, ecc.) con i loro indici per le vocali
    let mouthMeshes: Array<{
        mesh: THREE.Mesh;
        indices: Record<string, number>;
    }> = [];
    // eyeMeshes: Mesh che possiedono il morph per chiudere gli occhi (blink)
    let eyeMeshes: Array<{
        mesh: THREE.Mesh;
        index: number;
    }> = [];

    // --- Stato Animazione Oculare ---
    let blinkValue = 0; // Intensità del battito di ciglia (0-1)
    let blinkTimer = 0;
    let nextBlinkTime = 2 + Math.random() * 4;
    let eyeSaccadeTimer = 0; // Timer per micro-movimenti pupille
    let nextSaccadeTime = 0.5;

    // --- Riferimenti Ossa (Scheletro) ---
    // Usati per le rotazioni procedurali (collo, testa, spalle)
    let headBone: THREE.Bone | null = null;
    let neckBone: THREE.Bone | null = null;
    let spineBone: THREE.Bone | null = null;
    let chestBone: THREE.Bone | null = null;
    let shoulderL: THREE.Bone | null = null;
    let shoulderR: THREE.Bone | null = null;
    let eyeL: THREE.Bone | null = null;
    let eyeR: THREE.Bone | null = null;

    let headNoiseOffset = Math.random() * 100; // Offset per movimenti idle naturali

    // --- Indici Morph Addizionali ---
    let eyebrowIndices: Record<string, number> = { Joy: -1, Surprise: -1 };
    let smileIndex = -1; // Indice per il sorriso di base

    // --- Luci ---
    let spotLight: THREE.SpotLight; // Luce dinamica che pulsa con la voce
    let ambientLight: THREE.AmbientLight;

    const modelUrl = "/models/avatar.glb";
    let lastLogTime = 0;

    onMount(() => {
        // Verifica disponibilità canvas per evitare errori di inizializzazione
        if (!canvas) {
            console.error("[Avatar] ❌ Canvas not found!");
            return;
        }
        console.log("[Avatar] 🚀 Loading GLB model from:", modelUrl);

        // --- Configurazione Scena 3D ---
        scene = new THREE.Scene();

        // --- Configurazione Camera (talking head shot) ---
        camera = new THREE.PerspectiveCamera(30.0, 0.57, 0.1, 20.0);
        camera.position.set(0.0, 1.5, 2.0);
        camera.lookAt(0, 1.4, 0);

        // --- Inizializzazione WebGL Renderer ---
        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true, // Sfondo trasparente
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(400, 700); // Altezza ulteriormente aumentata (v2)
        renderer.setClearColor(0x000000, 0);

        // --- Illuminazione ---
        ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight1.position.set(2, 3, 2);
        scene.add(directionalLight1);

        // Luce spot che useremo per l'effetto "aura" durante il parlato
        spotLight = new THREE.SpotLight(0xa2d2ff, 0, 10, Math.PI * 0.2);
        spotLight.position.set(0, 2, 2);
        spotLight.target.position.set(0, 1.4, 0);
        scene.add(spotLight);
        scene.add(spotLight.target);

        // --- Caricamento Modello GLB ---
        const loader = new GLTFLoader();
        loader.load(
            modelUrl,
            (gltf) => {
                console.log("[Avatar] ✅ GLB loaded successfully");
                model = gltf.scene;
                scene.add(model);

                // Setup Mixer per eventuali animazioni pre-bakeate nel modello
                if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(model);
                }

                // --- Analisi Gerarchia Modello (Ossa e Mesh) ---
                model.traverse((child) => {
                    // 1. Identificazione Ossa principali
                    if (child instanceof THREE.Bone) {
                        const name = child.name.toLowerCase();

                        const isHead =
                            name === "head" ||
                            (name.includes("head") && !name.includes("hair"));
                        const isNeck = name === "neck" || name.includes("neck");
                        const isSpine = name.includes("spine");
                        const isChest = name.includes("chest");
                        const isEye =
                            name.includes("eye") &&
                            (name.includes("_l") ||
                                name.includes("_r") ||
                                name.includes(".l") ||
                                name.includes(".r"));
                        const isShoulder = name.includes("shoulder");

                        if (isHead) headBone = child;
                        if (isNeck) neckBone = child;
                        if (isSpine) spineBone = child;
                        if (isChest) chestBone = child;

                        if (isEye) {
                            if (
                                name.includes("left") ||
                                name.includes("_l") ||
                                name.includes(".l")
                            )
                                eyeL = child;
                            else eyeR = child;
                        }

                        if (isShoulder) {
                            if (
                                name.includes("left") ||
                                name.includes("_l") ||
                                name.includes(".l")
                            )
                                shoulderL = child;
                            else shoulderR = child;
                        }

                        // Escludiamo le ossa centrali dalla rotazione delle braccia per evitare deformazioni mesh
                        if (
                            isNeck ||
                            isHead ||
                            isSpine ||
                            isChest ||
                            isShoulder
                        )
                            return;

                        // Posa braccia: Abbassiamo le braccia dalla T-pose predefinita
                        if (
                            name.includes("upperarm") ||
                            name.includes("armupper")
                        ) {
                            if (
                                name.includes("left") ||
                                name.includes("_l") ||
                                name.includes(".l")
                            ) {
                                child.rotation.z = Math.PI * 0.35;
                            } else if (
                                name.includes("right") ||
                                name.includes("_r") ||
                                name.includes(".r")
                            ) {
                                child.rotation.z = -Math.PI * 0.35;
                            }
                        }
                    }

                    // 2. Analisi Morph Targets per animazioni facciali
                    if (
                        child instanceof THREE.Mesh &&
                        child.morphTargetDictionary &&
                        child.morphTargetInfluences
                    ) {
                        const morphKeys = Object.keys(
                            child.morphTargetDictionary,
                        );

                        // Rilevamento vocali (A, I, U, E, O) per Lip-Sync
                        const vowelNames = ["A", "I", "U", "E", "O"];
                        let meshVowelMapping: Record<string, number> = {};
                        let foundAnyVowel = false;

                        vowelNames.forEach((v) => {
                            const targetPattern = `Fcl_MTH_${v}`;
                            const actualKey = morphKeys.find(
                                (k) =>
                                    k.includes(targetPattern) ||
                                    k === v ||
                                    k.toLowerCase() === v.toLowerCase(),
                            );

                            if (
                                actualKey !== undefined &&
                                child.morphTargetDictionary
                            ) {
                                meshVowelMapping[v] =
                                    child.morphTargetDictionary[actualKey];
                                foundAnyVowel = true;
                            }
                        });

                        if (foundAnyVowel) {
                            mouthMeshes.push({
                                mesh: child,
                                indices: meshVowelMapping,
                            });
                        }

                        // Rilevamento battito di ciglia (Blink)
                        const eyePatterns = [
                            "Fcl_EYE_Close",
                            "EyeClose",
                            "blink",
                            "Blink",
                            "EYE_CLOSE",
                        ];
                        const eyeKey = morphKeys.find((k) =>
                            eyePatterns.some((p) => k.includes(p)),
                        );

                        if (eyeKey !== undefined) {
                            eyeMeshes.push({
                                mesh: child,
                                index: child.morphTargetDictionary[eyeKey],
                            });
                        }

                        // Rilevamento sopracciglia e sorriso
                        const brwSurKey = morphKeys.find(
                            (k) =>
                                k.includes("Fcl_BRW_Surprise") ||
                                k.includes("EyebrowUp"),
                        );
                        const smileKey = morphKeys.find(
                            (k) =>
                                k.includes("Fcl_MTH_Joy") ||
                                k.includes("MouthJoy") ||
                                k.includes("Smile"),
                        );

                        if (brwSurKey !== undefined)
                            eyebrowIndices.Surprise =
                                child.morphTargetDictionary[brwSurKey];
                        if (smileKey !== undefined) {
                            smileIndex = child.morphTargetDictionary[smileKey];
                            // Inizializziamo un sorriso leggero di base (25%) per un look amichevole
                            child.morphTargetInfluences[smileIndex] = 0.25;
                        }
                    }
                });

                // --- Inquadratura e Scala ---
                const box = new THREE.Box3().setFromObject(gltf.scene);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const scale = 1.7 / size.y; // Scaliamo a altezza umana standard
                gltf.scene.scale.setScalar(scale);

                // Posizionamento per inquadratura "Talking Head"
                gltf.scene.position.x = -center.x;
                gltf.scene.position.z = 1.15;
                gltf.scene.position.y = 1.4 - size.y * scale * 0.86;
                gltf.scene.rotation.set(0, Math.PI, 0); // Ruotiamo verso la camera
            },
            (progress) => {
                /* Log progress loading */
            },
            (error) => {
                console.error("[Avatar] ❌ Error loading GLB:", error);
            },
        );

        // --- Loop di Animazione Principale ---
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            if (mixer) mixer.update(delta);

            const time = Date.now() * 0.001;

            // --- 🗣️ LOGICA LIP-SYNC E ESPRESSIONI ---
            if (isSpeaking && mouthMeshes.length > 0) {
                // Generiamo un "volume" procedurale dinamico
                const fastJitter = Math.sin(time * 25) * 0.3 + 0.7; // Micro-tremolii
                const mediumWave = Math.sin(time * 8) * 0.4 + 0.6; // Ritmo parlato
                const volume = fastJitter * mediumWave;

                // Ciclo vocali veloce per simulare l'articolazione realistica
                const vowelCycle = (time * 12) % 5;
                const vowelWeights: Record<string, number> = {
                    A: Math.max(0, 1 - Math.abs(vowelCycle - 0)),
                    I: Math.max(0, 1 - Math.abs(vowelCycle - 1)),
                    U: Math.max(0, 1 - Math.abs(vowelCycle - 2)),
                    E: Math.max(0, 1 - Math.abs(vowelCycle - 3)),
                    O: Math.max(0, 1 - Math.abs(vowelCycle - 4)),
                };

                // Applichiamo i pesi a tutte le mesh della bocca
                mouthMeshes.forEach(({ mesh, indices }) => {
                    if (mesh.morphTargetInfluences) {
                        Object.entries(indices).forEach(([v, idx]) => {
                            if (idx >= 0)
                                mesh.morphTargetInfluences![idx] =
                                    vowelWeights[v] * volume * 0.8;
                        });

                        // 1. Sopracciglia: Si alzano con il volume (enfasi)
                        if (eyebrowIndices.Surprise >= 0) {
                            mesh.morphTargetInfluences![
                                eyebrowIndices.Surprise
                            ] = volume * 0.4;
                        }
                        // 2. Sorriso: Si intensifica leggermente durante il parlato
                        if (smileIndex >= 0) {
                            mesh.morphTargetInfluences![smileIndex] =
                                0.25 + volume * 0.1;
                        }
                    }
                });

                // Illuminazione dinamica sincronizzata
                if (spotLight) spotLight.intensity = 1.0 + volume * 2.5;
            } else {
                // Ritorno graduale alla posa idle (chiusura bocca e abbassamento sopracciglia)
                mouthMeshes.forEach(({ mesh, indices }) => {
                    if (mesh.morphTargetInfluences) {
                        Object.values(indices).forEach((idx) => {
                            if (idx >= 0)
                                mesh.morphTargetInfluences![idx] = Math.max(
                                    0,
                                    mesh.morphTargetInfluences![idx] -
                                        delta * 4,
                                );
                        });
                        if (eyebrowIndices.Surprise >= 0) {
                            mesh.morphTargetInfluences[
                                eyebrowIndices.Surprise
                            ] = Math.max(
                                0,
                                mesh.morphTargetInfluences[
                                    eyebrowIndices.Surprise
                                ] -
                                    delta * 2,
                            );
                        }
                    }
                });
                if (spotLight)
                    spotLight.intensity = THREE.MathUtils.lerp(
                        spotLight.intensity,
                        0.4,
                        0.1,
                    );
            }

            // --- 👀 SACCADI OCULARI (Micro-movimenti sguardo) ---
            eyeSaccadeTimer += delta;
            if (eyeSaccadeTimer >= nextSaccadeTime) {
                const angleX = (Math.random() - 0.5) * 0.08;
                const angleY = (Math.random() - 0.5) * 0.08;
                if (eyeL) eyeL.rotation.set(angleX, angleY, 0);
                if (eyeR) eyeR.rotation.set(angleX, angleY, 0);
                eyeSaccadeTimer = 0;
                nextSaccadeTime = 0.2 + Math.random() * 2;
            }

            // --- 😴 BATTITO DELLE CIGLIA (Blink) ---
            blinkTimer += delta;
            if (blinkTimer >= nextBlinkTime) {
                const progress = (blinkTimer - nextBlinkTime) / 0.15; // Blink fisso a 150ms
                if (progress <= 1.0) blinkValue = Math.sin(progress * Math.PI);
                else {
                    blinkValue = 0;
                    blinkTimer = 0;
                    nextBlinkTime = 3 + Math.random() * 5;
                }
            }
            eyeMeshes.forEach(({ mesh, index }) => {
                if (mesh.morphTargetInfluences)
                    mesh.morphTargetInfluences[index] = blinkValue;
            });

            // --- 🧘 MOVIMENTI DEL CORPO E TESTA ---
            const noise = Math.sin(time * 0.2 + headNoiseOffset);

            if (isSpeaking) {
                // Movimenti dinamici durante il parlato: nod, tilt, sway
                const nod = Math.sin(time * 6) * 0.05;
                const tilt = Math.sin(time * 1.5) * 0.08;
                const sway = Math.sin(time * 0.8) * 0.04;
                const torsoSway = Math.sin(time * 1.2) * 0.03;
                const shoulderLift = Math.sin(time * 10) * 0.02; // Sussulto spalle (shrug)

                if (neckBone) {
                    neckBone.rotation.x = THREE.MathUtils.lerp(
                        neckBone.rotation.x,
                        nod + 0.05,
                        0.1,
                    );
                    neckBone.rotation.z = THREE.MathUtils.lerp(
                        neckBone.rotation.z,
                        tilt,
                        0.1,
                    );
                    neckBone.rotation.y = THREE.MathUtils.lerp(
                        neckBone.rotation.y,
                        sway,
                        0.1,
                    );
                }
                if (headBone) {
                    headBone.rotation.x = THREE.MathUtils.lerp(
                        headBone.rotation.x,
                        nod * 0.5,
                        0.1,
                    );
                    headBone.rotation.z = THREE.MathUtils.lerp(
                        headBone.rotation.z,
                        tilt * 0.3,
                        0.1,
                    );
                }
                if (spineBone)
                    spineBone.rotation.z = THREE.MathUtils.lerp(
                        spineBone.rotation.z,
                        torsoSway,
                        0.1,
                    );
                if (chestBone)
                    chestBone.rotation.x = THREE.MathUtils.lerp(
                        chestBone.rotation.x,
                        nod * 0.1,
                        0.1,
                    );
                if (shoulderL)
                    shoulderL.rotation.z = THREE.MathUtils.lerp(
                        shoulderL.rotation.z,
                        -shoulderLift,
                        0.1,
                    );
                if (shoulderR)
                    shoulderR.rotation.z = THREE.MathUtils.lerp(
                        shoulderR.rotation.z,
                        shoulderLift,
                        0.1,
                    );
            } else {
                // Movimenti lenti di "respiro" e micro-variazioni (Idle)
                const breathe = Math.sin(time * 0.5) * 0.02;
                const naturalTilt = noise * 0.05;

                if (neckBone) {
                    neckBone.rotation.x = THREE.MathUtils.lerp(
                        neckBone.rotation.x,
                        breathe,
                        0.05,
                    );
                    neckBone.rotation.z = THREE.MathUtils.lerp(
                        neckBone.rotation.z,
                        naturalTilt,
                        0.05,
                    );
                    neckBone.rotation.y = THREE.MathUtils.lerp(
                        neckBone.rotation.y,
                        0,
                        0.05,
                    );
                }
                if (headBone) {
                    headBone.rotation.x = THREE.MathUtils.lerp(
                        headBone.rotation.x,
                        breathe * 0.5,
                        0.05,
                    );
                }
                if (spineBone) {
                    spineBone.rotation.y = THREE.MathUtils.lerp(
                        spineBone.rotation.y,
                        naturalTilt * 0.2,
                        0.05,
                    );
                    spineBone.rotation.z = THREE.MathUtils.lerp(
                        spineBone.rotation.z,
                        0,
                        0.05,
                    );
                }
                if (shoulderL)
                    shoulderL.rotation.z = THREE.MathUtils.lerp(
                        shoulderL.rotation.z,
                        0,
                        0.1,
                    );
                if (shoulderR)
                    shoulderR.rotation.z = THREE.MathUtils.lerp(
                        shoulderR.rotation.z,
                        0,
                        0.1,
                    );
            }

            renderer.render(scene, camera);
        };
        animate();
    });

    onDestroy(() => {
        // Pulizia risorse WebGL all'unmount del componente
        if (animationId) cancelAnimationFrame(animationId);
        if (renderer) renderer.dispose();
    });
</script>

<canvas bind:this={canvas} class="avatar-canvas"></canvas>

<style>
    .avatar-canvas {
        width: 100%;
        max-width: 400px;
        height: 700px; /* Altezza aumentata (v2) */
        display: block;
        margin: 0 auto;
        /* Effetto Glassmorphism rettangolare */
        background: linear-gradient(
            135deg,
            rgba(74, 144, 226, 0.1) 0%,
            rgba(142, 84, 233, 0.1) 100%
        );
        border-radius: 20px; /* Angoli leggermente arrotondati invece di cerchio */
        border: 2px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(8px);
    }
</style>
