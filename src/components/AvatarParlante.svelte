<script lang="ts">
    import * as THREE from "three";
    import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
    import { onMount, onDestroy } from "svelte";
    import { userRole } from "../stores/notesStore";

    // --- Props ---
    export let speaking = false;
    export let isSpeaking = false;
    export let controlsOpen = false; // Expose control panel state to parent

    // --- Riferimenti Three.js ---
    let canvas: HTMLCanvasElement;
    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let clock = new THREE.Clock();
    let animationId: number;
    let model: THREE.Group | null = null;
    let mixer: THREE.AnimationMixer | null = null;

    // --- Gestione Morph Targets ---
    let mouthMeshes: Array<{
        mesh: THREE.Mesh;
        indices: Record<string, number>;
    }> = [];
    let eyeMeshes: Array<{ mesh: THREE.Mesh; index: number }> = [];
    let eyebrowIndices: Record<string, number> = { Joy: -1, Surprise: -1 };
    let smileIndex = -1;

    // --- Stato Animazione ---
    let blinkValue = 0;
    let blinkTimer = 0;
    let nextBlinkTime = 2 + Math.random() * 4;
    let headNoiseOffset = Math.random() * 100;
    let eyeSaccadeTimer = 0;
    let nextSaccadeTime = 0.5;
    let saccadeX = 0;
    let saccadeY = 0;

    // --- Profile Look State ---
    let lookTargetY = 0; // 0=front, 1.6=left, -1.6=right
    let currentHeadY = 0;
    let currentChestY = 0;
    let lookTimer = 0;
    let nextLookTime = 5 + Math.random() * 5;

    // --- 🛠️ PANNELLO DI CONTROLLO TOTALE ---
    let showControls = false;
    let activeTab = "clothing"; // 'clothing', 'bones', 'camera'

    // Mesh Management
    let allMeshes: Array<{ name: string; mesh: THREE.Mesh; visible: boolean }> =
        [];

    // Bone Management
    let allBones: Array<{ name: string; bone: THREE.Bone }> = [];
    let pose: Record<
        string,
        { x: number; y: number; z: number; [key: string]: number }
    > = {};
    let originalRotations: Record<string, { x: number; y: number; z: number }> =
        {};

    let cameraSettings = {
        y: 1.3,
        z: 2.1,
        targetY: 1.55,
    };

    // --- Luci ---
    let spotLight: THREE.SpotLight;
    let ambientLight: THREE.AmbientLight;

    const modelUrl = "/models/avatar.glb";

    function toggleControls() {
        showControls = !showControls;
        controlsOpen = showControls;
        if (showControls) {
            // Quando apriamo i controlli, catturiamo la posa ATTUALE (per non avere scatti)
            allBones.forEach((b) => {
                pose[b.name] = {
                    x: b.bone.rotation.x,
                    y: b.bone.rotation.y,
                    z: b.bone.rotation.z,
                };
            });
        }
    }

    function resetPose() {
        Object.keys(pose).forEach((boneName) => {
            const orig = originalRotations[boneName];
            if (orig) {
                pose[boneName] = { x: orig.x, y: orig.y, z: orig.z };
            } else {
                pose[boneName] = { x: 0, y: 0, z: 0 };
            }
        });
    }

    onMount(() => {
        if (!canvas) return;

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(30.0, 0.57, 0.1, 20.0);
        camera.position.set(0, cameraSettings.y, cameraSettings.z);
        camera.lookAt(0, cameraSettings.targetY, 0);

        renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(400, 700);
        renderer.setClearColor(0x000000, 0);

        ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);

        spotLight = new THREE.SpotLight(0xa2d2ff, 0.5, 10, Math.PI * 0.2);
        spotLight.position.set(0, 2, 2);
        spotLight.target.position.set(0, 1.4, 0);
        scene.add(spotLight);
        scene.add(spotLight.target);

        const loader = new GLTFLoader();
        loader.load(modelUrl, (gltf) => {
            model = gltf.scene;
            scene.add(model);

            if (gltf.animations?.length > 0) {
                mixer = new THREE.AnimationMixer(model);
            }

            const meshList: typeof allMeshes = [];
            const boneList: typeof allBones = [];

            model.traverse((child) => {
                // SkinnedMesh is a subclass of Mesh, so this catches both
                if (child instanceof THREE.Mesh) {
                    console.log(
                        "[Avatar] 📦 Mesh detected:",
                        child.name,
                        child.type,
                    );
                    const mName = child.name.toLowerCase();
                    const isJacket =
                        mName.includes("jacket") ||
                        mName.includes("outer") ||
                        mName.includes("giacca");

                    meshList.push({
                        name: child.name,
                        mesh: child,
                        visible: !isJacket,
                    });
                    if (isJacket) child.visible = false;

                    if (
                        child.morphTargetDictionary &&
                        child.morphTargetInfluences
                    ) {
                        const morphKeys = Object.keys(
                            child.morphTargetDictionary,
                        );
                        const vowels = ["A", "I", "U", "E", "O"];
                        let mIndices: Record<string, number> = {};
                        vowels.forEach((v) => {
                            const k = morphKeys.find(
                                (key) =>
                                    key.includes(`Fcl_MTH_${v}`) ||
                                    key === v ||
                                    key.toLowerCase() === v.toLowerCase(),
                            );
                            if (k !== undefined)
                                mIndices[v] = child.morphTargetDictionary![k];
                        });
                        if (Object.keys(mIndices).length > 0)
                            mouthMeshes.push({
                                mesh: child,
                                indices: mIndices,
                            });

                        const blinkKeys = morphKeys.filter((k) =>
                            [
                                "EyeClose",
                                "blink",
                                "Blink",
                                "Close_Eyes",
                                "Close_Eye",
                            ].some((p) => k.includes(p)),
                        );
                        blinkKeys.forEach((eyeK) => {
                            console.log(
                                "[Avatar] 👁️ Blink target found:",
                                eyeK,
                                "on mesh:",
                                child.name,
                            );
                            eyeMeshes.push({
                                mesh: child,
                                index: child.morphTargetDictionary![eyeK],
                            });
                        });
                    }
                }

                if (child instanceof THREE.Bone) {
                    boneList.push({ name: child.name, bone: child });

                    // Definiamo la posa "mani dietro la schiena" come originale/default
                    let defX = child.rotation.x;
                    let defY = child.rotation.y;
                    let defZ = child.rotation.z;

                    const name = child.name.toLowerCase();
                    if (
                        name.includes("upperarm") ||
                        name.includes("armupper")
                    ) {
                        if (
                            name.includes("left") ||
                            name.includes("_l") ||
                            name.includes(".l")
                        ) {
                            defY = 0.4;
                            defZ = 1.1;
                        } else {
                            defY = -0.4;
                            defZ = -1.1;
                        }
                    }
                    if (name.includes("hand")) {
                        if (
                            name.includes("left") ||
                            name.includes("_l") ||
                            name.includes(".l")
                        ) {
                            defY = 0.5;
                        } else {
                            defY = -0.5;
                        }
                    }

                    originalRotations[child.name] = {
                        x: defX,
                        y: defY,
                        z: defZ,
                    };
                    pose[child.name] = { x: defX, y: defY, z: defZ };

                    // Applichiamo subito la posa
                    child.rotation.set(defX, defY, defZ);
                }
            });

            allMeshes = meshList.sort((a, b) => a.name.localeCompare(b.name));
            allBones = boneList.sort((a, b) => a.name.localeCompare(b.name));

            // Scale & Center
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const scale = 1.7 / size.y;
            model.scale.setScalar(scale);
            // Centratura fissa (yesterday style)
            model.position.set(0, 1.4 - size.y * scale * 0.86, 1.15);
            model.rotation.set(0, Math.PI, 0);
        });

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            if (mixer) mixer.update(delta);
            const time = Date.now() * 0.001;

            // Sync Camera
            if (camera) {
                camera.position.y = cameraSettings.y;
                camera.position.z = cameraSettings.z;
                camera.lookAt(0, cameraSettings.targetY, 0);
            }

            // Sync Meshes
            allMeshes.forEach((m) => {
                m.mesh.visible = m.visible;
            });

            // --- 🦴 LOGICA OSSA (Idle vs Manual) ---
            if (showControls) {
                // MANUALE: L'utente ha il controllo totale
                allBones.forEach((b) => {
                    const p = pose[b.name];
                    if (p) b.bone.rotation.set(p.x, p.y, p.z);
                });
            } else {
                // NATURALE: L'avatar torna alla posa originale e si muove pigramente (Idle)
                const noise = Math.sin(time * 0.2 + headNoiseOffset);
                const breathe = Math.sin(time * 1.2) * 0.015;
                const sway = Math.sin(time * 0.5) * 0.02;

                // Gestione timer sguardo (Look Target) - Solo a sinistra per "leggere"
                lookTimer += delta;
                if (lookTimer >= nextLookTime) {
                    if (lookTargetY !== 0) {
                        // Se era girata a leggere, torna a guardare l'utente
                        lookTargetY = 0;
                        nextLookTime = 5 + Math.random() * 10; // Resta frontale più a lungo
                    } else {
                        // Gira la testa a sinistra per leggere i testi
                        lookTargetY = 1.6;
                        nextLookTime = 3 + Math.random() * 6; // Tempo di "lettura"
                    }
                    lookTimer = 0;
                }

                // La testa è più veloce (0.08) del corpo (0.03)
                currentHeadY = THREE.MathUtils.lerp(
                    currentHeadY,
                    lookTargetY,
                    0.08,
                );
                currentChestY = THREE.MathUtils.lerp(
                    currentChestY,
                    lookTargetY,
                    0.03,
                );

                allBones.forEach((b) => {
                    const orig = originalRotations[b.name];
                    if (!orig) return;

                    let targetX = orig.x;
                    let targetY = orig.y;
                    let targetZ = orig.z;

                    // Aggiungiamo micro-movimenti naturali e coordinamento sguardo
                    const name = b.name.toLowerCase();

                    // Coordinamento dello sguardo sequenziale (Head-Lead)
                    if (name.includes("chest") && !name.includes("upper")) {
                        targetY += currentChestY * 0.4;
                    }
                    if (name.includes("upperchest")) {
                        targetY += currentChestY * 0.2;
                    }
                    if (name.includes("head")) {
                        // Formula: HeadTarget = TargetTotale - BustoAttuale
                        targetY += currentHeadY - currentChestY * 0.6;

                        // Respiro e Noise
                        targetX += breathe + noise * 0.05;
                        targetZ += noise * 0.03;
                    }

                    if (name.includes("neck")) {
                        targetX += breathe;
                    }

                    if (name.includes("spine") && !name.includes("chest")) {
                        targetX += sway;
                    }

                    // Lerp per fluidità totale
                    b.bone.rotation.x = THREE.MathUtils.lerp(
                        b.bone.rotation.x,
                        targetX,
                        0.05,
                    );
                    b.bone.rotation.y = THREE.MathUtils.lerp(
                        b.bone.rotation.y,
                        targetY,
                        0.05,
                    );
                    b.bone.rotation.z = THREE.MathUtils.lerp(
                        b.bone.rotation.z,
                        targetZ,
                        0.05,
                    );
                });
            }

            // --- Lip Sync ---
            if (isSpeaking && mouthMeshes.length > 0) {
                const vol =
                    (Math.sin(time * 25) * 0.3 + 0.7) *
                    (Math.sin(time * 8) * 0.4 + 0.6);
                mouthMeshes.forEach(({ mesh, indices }) => {
                    Object.values(indices).forEach(
                        (idx) =>
                            (mesh.morphTargetInfluences![idx] =
                                Math.random() * vol * 0.5),
                    );
                });
                if (spotLight) spotLight.intensity = 1.0 + vol * 2.5;
            } else {
                mouthMeshes.forEach(({ mesh, indices }) => {
                    Object.values(indices).forEach(
                        (idx) =>
                            (mesh.morphTargetInfluences![idx] =
                                THREE.MathUtils.lerp(
                                    mesh.morphTargetInfluences![idx],
                                    0,
                                    0.1,
                                )),
                    );
                });
                if (spotLight)
                    spotLight.intensity = THREE.MathUtils.lerp(
                        spotLight.intensity,
                        0.4,
                        0.1,
                    );
            }

            // --- Eyes & Natural Movement ---
            eyeSaccadeTimer += delta;
            if (eyeSaccadeTimer >= nextSaccadeTime) {
                saccadeX = (Math.random() - 0.5) * 0.15;
                saccadeY = (Math.random() - 0.5) * 0.1;
                eyeSaccadeTimer = 0;
                nextSaccadeTime = 0.5 + Math.random() * 2.0;
            }

            // Blinking (Randomized)
            blinkTimer += delta;
            if (blinkTimer >= nextBlinkTime) {
                const p = (blinkTimer - nextBlinkTime) / 0.18; // Durata blink
                blinkValue = p <= 1.0 ? Math.sin(p * Math.PI) : 0;
                if (p > 1.0) {
                    blinkTimer = 0;
                    nextBlinkTime = 2 + Math.random() * 5;
                }
            }
            eyeMeshes.forEach(
                ({ mesh, index }) =>
                    (mesh.morphTargetInfluences![index] = blinkValue),
            );

            // Saccadi oculari (solo se non in manual override o se vogliamo tenerle comunque)
            allBones.forEach((b) => {
                const name = b.name.toLowerCase();
                if (name.includes("eye") && !name.includes("eyebrow")) {
                    b.bone.rotation.x = THREE.MathUtils.lerp(
                        b.bone.rotation.x,
                        saccadeY,
                        0.1,
                    );
                    b.bone.rotation.y = THREE.MathUtils.lerp(
                        b.bone.rotation.y,
                        saccadeX,
                        0.1,
                    );
                }
            });

            renderer.render(scene, camera);
        };
        animate();
    });

    onDestroy(() => {
        if (animationId) cancelAnimationFrame(animationId);
        if (renderer) renderer.dispose();
    });
</script>

<div
    class="main-wrapper"
    class:controls-open={showControls}
    on:click|stopPropagation
    on:mousedown|stopPropagation
>
    <div class="avatar-container">
        <canvas bind:this={canvas} class="avatar-canvas"></canvas>

        {#if $userRole === "admin"}
            <button class="toggle-btn" on:click={toggleControls}>
                {showControls ? "Close" : "⚙️ Avatar Controls"}
            </button>
        {/if}
    </div>

    {#if showControls}
        <div
            class="control-panel"
            on:click|stopPropagation
            on:mousedown|stopPropagation
        >
            <div class="tabs">
                <button
                    class:active={activeTab === "clothing"}
                    on:click={() => (activeTab = "clothing")}
                    >👗 Clothing</button
                >
                <button
                    class:active={activeTab === "bones"}
                    on:click={() => (activeTab = "bones")}>🦴 Skeleton</button
                >
                <button
                    class:active={activeTab === "camera"}
                    on:click={() => (activeTab = "camera")}>🎥 View</button
                >
            </div>

            <div class="tab-content">
                {#if activeTab === "clothing"}
                    <div class="clothing-list">
                        <h4>All Model Meshes ({allMeshes.length})</h4>
                        <div class="grid">
                            {#each allMeshes as item}
                                <label class="item">
                                    <input
                                        type="checkbox"
                                        bind:checked={item.visible}
                                    />
                                    <span>{item.name}</span>
                                </label>
                            {/each}
                        </div>
                    </div>
                {:else if activeTab === "bones"}
                    <div class="bones-list">
                        <div class="header">
                            <h4>Skeleton Bones ({allBones.length})</h4>
                            <button on:click={resetPose}
                                >Reset to Original</button
                            >
                        </div>
                        <div class="bones-scroll">
                            {#each allBones as item}
                                <div class="bone-group">
                                    <span class="bone-name">{item.name}</span>
                                    <div class="sliders">
                                        {#each ["x", "y", "z"] as axis}
                                            <div class="row">
                                                <label
                                                    >{axis.toUpperCase()}</label
                                                >
                                                <input
                                                    type="range"
                                                    min="-3.14"
                                                    max="3.14"
                                                    step="0.01"
                                                    bind:value={
                                                        pose[item.name][axis]
                                                    }
                                                />
                                                <span class="val"
                                                    >{pose[item.name][
                                                        axis
                                                    ].toFixed(2)}</span
                                                >
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {:else if activeTab === "camera"}
                    <div class="camera-settings">
                        <h4>Camera View</h4>
                        <div class="row">
                            <label>Zoom (Z)</label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                step="0.1"
                                bind:value={cameraSettings.z}
                            />
                            <span>{cameraSettings.z}</span>
                        </div>
                        <div class="row">
                            <label>Height (Y)</label>
                            <input
                                type="range"
                                min="0"
                                max="3"
                                step="0.05"
                                bind:value={cameraSettings.y}
                            />
                            <span>{cameraSettings.y}</span>
                        </div>
                        <div class="row">
                            <label>Look Target (Y)</label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.05"
                                bind:value={cameraSettings.targetY}
                            />
                            <span>{cameraSettings.targetY}</span>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    .main-wrapper {
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 20px;
        width: 100%;
        max-width: fit-content;
        margin: 0 auto;
        transition: all 0.3s ease;
    }
    .avatar-container {
        position: relative;
        flex: 0 0 400px;
        height: 750px;
    }
    .avatar-canvas {
        width: 100%;
        height: 700px;
        display: block;
        border-radius: 20px;
        background: rgba(0, 0, 0, 0.05);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .toggle-btn {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background: #4a90e2;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 30px;
        font-weight: bold;
        cursor: pointer;
        z-index: 2000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    .control-panel {
        flex: 0 0 450px;
        height: 700px;
        background: rgba(30, 30, 30, 0.95);
        border-radius: 20px;
        color: white;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 1500;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .tabs {
        display: flex;
        background: #222;
        border-bottom: 1px solid #444;
    }
    .tabs button {
        flex: 1;
        padding: 15px;
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
        font-size: 14px;
        transition: 0.3s;
    }
    .tabs button.active {
        color: white;
        background: #333;
        box-shadow: inset 0 -3px 0 #4a90e2;
    }
    .tab-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
    }
    h4 {
        margin: 0 0 15px 0;
        color: #4a90e2;
        text-transform: uppercase;
        letter-spacing: 1px;
        font-size: 12px;
    }
    .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
    }
    .item {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.05);
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
    }
    .item span {
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    .header button {
        padding: 5px 12px;
        border-radius: 5px;
        background: #666;
        color: white;
        border: none;
        font-size: 10px;
        cursor: pointer;
    }
    .bone-group {
        margin-bottom: 20px;
        background: rgba(0, 0, 0, 0.2);
        padding: 10px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .bone-name {
        font-weight: bold;
        color: #ffcc00;
        display: block;
        margin-bottom: 10px;
        font-size: 11px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 5px;
    }
    .row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
    }
    .row label {
        width: 15px;
        font-size: 10px;
        opacity: 0.6;
    }
    .row input {
        flex: 1;
        height: 4px;
    }
    .row .val {
        width: 40px;
        font-size: 10px;
        text-align: right;
        color: #4a90e2;
        font-family: monospace;
    }
</style>
