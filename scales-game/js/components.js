/**
 * A-Frame custom components for browser-based decision game.
 */

/* --- Visual state mapping: score 1–6 → color, scale, emissive --- */
const STATE_VISUALS = {
    1: { color: "#555566", scale: 0.7, emissive: "#000000", emissiveIntensity: 0 },
    2: { color: "#777788", scale: 0.85, emissive: "#111122", emissiveIntensity: 0.05 },
    3: { color: "#9999aa", scale: 1.0, emissive: "#222233", emissiveIntensity: 0.1 },
    4: { color: "#bbccdd", scale: 1.1, emissive: "#334466", emissiveIntensity: 0.2 },
    5: { color: "#ddeeff", scale: 1.2, emissive: "#446688", emissiveIntensity: 0.35 },
    6: { color: "#ffffff", scale: 1.35, emissive: "#88aaff", emissiveIntensity: 0.6 }
};

const SCORE_COLORS = {
    co2: "#ff9966",
    water: "#66ccff",
    electricity: "#ffdd66",
    datacenter: "#66ffcc",
    ecology: "#88ddaa",
    sovereignty: "#88ffaa",
    power: "#ffaa66",
    identity: "#aa88ff",
    transparency: "#aaddff"
};

const SCORE_LABELS = {
    co2: "CO2",
    water: "Water",
    electricity: "Electricity",
    datacenter: "Datacenters",
    ecology: "Ecology",
    sovereignty: "Sovereignty",
    power: "Power",
    identity: "Identity",
    transparency: "Transparency"
};

/** Map live score to sprite/marker band (ecology: 4 levels, goals: 5 levels). */
function scoreToSpriteLevel(axis, score, scores = ScoreSystem.scores) {
    if (axis === "ecology") {
        const pct = ScoreSystem.getTotalEcologyPercent(scores);
        if (pct <= 25) return 1;
        if (pct <= 50) return 2;
        if (pct <= 75) return 3;
        return 4;
    }
    if (ScoreSystem.isEcologyAxis(axis)) {
        const pct = ScoreSystem.getEcologyPercent(axis, score);
        if (pct <= 25) return 1;
        if (pct <= 50) return 2;
        if (pct <= 75) return 3;
        return 4;
    }
    return Math.max(1, Math.min(5,
        Math.round(((score - ScoreSystem.GOAL_MIN) / (ScoreSystem.GOAL_MAX - ScoreSystem.GOAL_MIN)) * 4) + 1
    ));
}

/** Total ecology % toward 2030 → sky visual level 1–4. */
function ecologyToSkyLevel(scores) {
    const pct = ScoreSystem.getTotalEcologyPercent(scores);
    if (pct < 25) return 1;
    if (pct < 50) return 2;
    if (pct < 75) return 3;
    return 4;
}

function syncTerritoryObjectVisibility() {
    const scene = document.querySelector("a-scene");
    if (!scene) return;
    for (const objectId of Object.keys(VR_OBJECT_DECISIONS)) {
        const el = scene.querySelector(`#obj-${objectId.replace(/_/g, "-")}`);
        if (el) el.setAttribute("visible", true);
    }
}

function getEntityObjectId(el) {
    const dataObj = el.getAttribute("data-object");
    if (dataObj?.objectId) return dataObj.objectId;
    const decisionObj = el.getAttribute("decision-object");
    if (decisionObj?.objectId) return decisionObj.objectId;
    const reactive = el.components["score-reactive-object"];
    if (reactive?.data?.objectId) return reactive.data.objectId;
    return null;
}

/* --- Global game flags. Interaction components check these and bail early
 * when the game is over or territory onboarding has not finished. --- */
const GameState = {
    over: false,
    victory: false,
    loseReason: null,

    interactionsEnabled() {
        return !this.over
            && typeof GameStage !== "undefined"
            && GameStage.isManagerial()
            && typeof TerritoryState !== "undefined"
            && TerritoryState.isGameplayReady();
    },

    resetSession() {
        this.over = false;
        this.victory = false;
        this.loseReason = null;
    }
};

const GameOutcome = {
    evaluate() {
        if (GameState.over || !TerritoryState.isGameplayReady()) return;

        const scene = document.querySelector("a-scene");
        const gameOver = scene?.components["game-over"];
        if (!gameOver || gameOver.triggered) return;

        const scores = ScoreSystem.scores;

        if (ScoreSystem.hasEcologyFailure(scores)) {
            const sky = scene?.querySelector("a-sky");
            sky?.components["score-reactive-sky"]?.forceLevel(4);
            gameOver.trigger("lose", "ecology");
            return;
        }

        if (TerritoryState.areGoalsMet(scores)) {
            gameOver.trigger("win");
            return;
        }

        if (DecisionState.allResolved() && !TerritoryState.areGoalsMet(scores)) {
            gameOver.trigger("lose", "zero_point");
        }
    }
};

function setGameUIVisible(visible) {
    /* VR build: no desktop HUD overlays */
}

/* --- Score HUD: HTML score card (styled via css/score-card.css) --- */
AFRAME.registerComponent("score-hud", {
    init() {
        this.values = {};
        this.items = {};

        ScoreSystem.ALL_AXES.forEach((axis) => {
            this.values[axis] = document.getElementById(`score-${axis}`);
            this.items[axis] = this.values[axis]?.closest(".impact-panel__row");
        });

        this.goalPanel = document.getElementById("territory-goal");
        this.goalTextEl = this.goalPanel?.querySelector(".territory-goal__text");

        this._onScoreChange = (e) => this.update(e.detail.scores, e.detail.changes);
        this._onGameplayReady = () => this.refreshGoalPanel();
        this._onTerritoryReset = () => this.refreshGoalPanel();

        document.addEventListener("score-changed", this._onScoreChange);
        document.addEventListener("territory-gameplay-ready", this._onGameplayReady);
        document.addEventListener("territory-confirmed", this._onGameplayReady);
        document.addEventListener("territory-reset", this._onTerritoryReset);

        this.update(ScoreSystem.scores);
        this.refreshGoalPanel();
    },

    refreshGoalPanel() {
        const thresholds = TerritoryState.getWinThresholds() || {};
        const transparencyRow = this.items.transparency;
        if (transparencyRow) {
            transparencyRow.classList.toggle("is-goal-inactive", thresholds?.transparency == null);
        }
    },

    update(scores, changes = {}) {
        const thresholds = TerritoryState.getWinThresholds();

        for (const axis of ScoreSystem.ECOLOGY_HUD_ORDER) {
            const el = this.values[axis];
            const item = this.items[axis];
            if (!el) continue;
            el.textContent = ScoreSystem.formatEcologyHudValue(axis, scores[axis]);
            if (item && changes[axis]) {
                item.classList.add("is-updated");
                clearTimeout(item._scoreFlashTimer);
                item._scoreFlashTimer = setTimeout(() => item.classList.remove("is-updated"), 300);
            }
        }

        for (const axis of ScoreSystem.GOAL_HUD_ORDER) {
            const el = this.values[axis];
            const item = this.items[axis];
            if (!el) continue;
            el.textContent = ScoreSystem.formatGoalStatus(axis, scores[axis]);

            if (item) {
                const rule = thresholds?.[axis];
                let met = false;
                const value = scores[axis];
                if (rule != null) {
                    if (typeof rule === "number") met = value >= rule;
                    else if (rule.min != null) met = value >= rule.min;
                    else if (rule.max != null) met = value <= rule.max;
                }
                item.classList.toggle("is-threshold-met", met);

                if (changes[axis]) {
                    item.classList.add("is-updated");
                    clearTimeout(item._scoreFlashTimer);
                    item._scoreFlashTimer = setTimeout(() => item.classList.remove("is-updated"), 300);
                }
            }
        }
    },

    remove() {
        document.removeEventListener("score-changed", this._onScoreChange);
        document.removeEventListener("territory-gameplay-ready", this._onGameplayReady);
        document.removeEventListener("territory-confirmed", this._onGameplayReady);
        document.removeEventListener("territory-reset", this._onTerritoryReset);
    }
});

/* --- Interaction indicator: pulsing icon above objects that need attention --- */
AFRAME.registerComponent("interaction-indicator", {
    schema: {
        active: { type: "boolean", default: true }
    },

    init() {
        const marker = document.createElement("a-entity");
        marker.setAttribute("position", "0 0.6 0");
        marker.setAttribute("look-at", "[camera]");
        marker.innerHTML = `
            <a-ring color="#ffdd44" radius-inner="0.08" radius-outer="0.14"
                    material="shader: flat; transparent: true; opacity: 0.9"
                    animation="property: scale; from: 0.8 0.8 0.8; to: 1.2 1.2 1.2;
                               dur: 900; dir: alternate; loop: true; easing: easeInOutSine"></a-ring>
            <a-text value="?" align="center" width="3" position="0 0 0.01"
                    color="#ffdd44" scale="0.15 0.15 0.15"></a-text>
        `;
        marker.setAttribute("id", "interaction-marker");
        this.el.appendChild(marker);
        this.marker = marker;
    },

    update() {
        if (this.marker) {
            this.marker.setAttribute("visible", this.data.active);
        }
    }
});

/* --- Data object metadata (visual-only; decisions run through the panel queue). --- */
AFRAME.registerComponent("data-object", {
    schema: {
        objectId: { type: "string" }
    }
});

/* --- Object reacts visually to its linked score axis.
 * For sprites, each score level (1–6) maps to an image defined in
 * VR_OBJECT_DECISIONS[objectId].states (see database.js). When the level
 * changes the sprite fades out, swaps its texture, and fades back in. --- */
AFRAME.registerComponent("score-reactive-object", {
    schema: {
        scoreAxis: { type: "string", default: "co2" },
        objectId: { type: "string", default: "" },
        baseColor: { type: "color", default: "#888899" },
        fadeDur: { type: "number", default: 350 }
    },

    init() {
        this.mesh = this.el.querySelector(".object-mesh") || this.el;
        this.isSprite = this.mesh.tagName.toLowerCase() === "a-image";
        this.currentLevel = null;
        this.transitioning = false;
        this._fadeRaf = null;

        const objectId = this.data.objectId || getEntityObjectId(this.el);
        this.stateImages = (typeof VR_OBJECT_DECISIONS !== "undefined" &&
            VR_OBJECT_DECISIONS[objectId]?.states) || null;

        this._onScoreChange = (e) => this.applyState(e.detail.scores);
        document.addEventListener("score-changed", this._onScoreChange);
        if (this.isSprite) this._applySpriteMaterial();
        this.applyState(ScoreSystem.scores);
    },

    /* Prefer a preloaded <a-assets> img over a raw path so swaps don't flash. */
    _resolveSrc(path) {
        this._srcCache = this._srcCache || {};
        if (this._srcCache[path]) return this._srcCache[path];

        const assets = this.el.sceneEl.querySelector("a-assets");
        let resolved = path;
        if (assets) {
            const img = Array.from(assets.querySelectorAll("img"))
                .find((i) => i.getAttribute("src") === path && i.id);
            if (img) resolved = `#${img.id}`;
        }
        this._srcCache[path] = resolved;
        return resolved;
    },

    _fadeTo(target, done) {
        cancelAnimationFrame(this._fadeRaf);
        const mesh = this.mesh;
        const from = mesh.components.material?.data.opacity ?? 1;
        const dur = Math.max(1, this.data.fadeDur);
        const start = performance.now();

        const step = (now) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = t * (2 - t); // easeOutQuad
            mesh.setAttribute("material", "opacity", from + (target - from) * eased);
            if (t < 1) {
                this._fadeRaf = requestAnimationFrame(step);
            } else if (done) {
                done();
            }
        };
        this._fadeRaf = requestAnimationFrame(step);
    },

    _transitionToImage(src) {
        this.transitioning = true;
        this._fadeTo(0, () => {
            this.mesh.setAttribute("src", src);
            this._applySpriteMaterial();
            this._fadeTo(this.levelOpacity, () => {
                this.transitioning = false;
            });
        });
    },

    _applySpriteMaterial() {
        this.mesh.setAttribute("material", {
            shader: "flat",
            transparent: true,
            opacity: 1,
            alphaTest: 0.05,
            side: "double"
        });
    },

    applyState(scores) {
        const axis = this.data.scoreAxis;
        const raw = axis === "ecology"
            ? ScoreSystem.getTotalEcologyPercent(scores)
            : (scores[axis] ?? 0);
        const level = scoreToSpriteLevel(axis, raw, scores);
        const visual = STATE_VISUALS[level];
        const tint = SCORE_COLORS[axis];

        this.mesh.setAttribute("scale", `${visual.scale} ${visual.scale} ${visual.scale}`);

        if (this.isSprite) {
            this.levelOpacity = 1;
            this._applySpriteMaterial();
            const stateSrc = this.stateImages?.[level];

            if (stateSrc && this.currentLevel === null) {
                // First run: show the starting state instantly, no fade.
                this.mesh.setAttribute("src", this._resolveSrc(stateSrc));
                this.mesh.setAttribute("material", "opacity", this.levelOpacity);
            } else if (stateSrc && level !== this.currentLevel) {
                this._transitionToImage(this._resolveSrc(stateSrc));
            } else if (!this.transitioning) {
                // Same state (e.g. hover-end restore): just reset opacity.
                this.mesh.setAttribute("material", "opacity", this.levelOpacity);
            }
            this.currentLevel = level;
        } else {
            this.mesh.setAttribute("material", {
                color: visual.color,
                emissive: visual.emissiveIntensity > 0 ? tint : visual.emissive,
                emissiveIntensity: visual.emissiveIntensity,
                shader: "standard"
            });
        }

        if (level >= 5) {
            this.mesh.setAttribute("animation__pulse", {
                property: "rotation",
                to: "0 360 0",
                dur: 8000,
                loop: true,
                easing: "linear"
            });
        } else {
            this.mesh.removeAttribute("animation__pulse");
        }
    },

    remove() {
        document.removeEventListener("score-changed", this._onScoreChange);
        cancelAnimationFrame(this._fadeRaf);
    }
});

/* --- Sky reacts to peak ecology score across all ecology axes. --- */
AFRAME.registerComponent("score-reactive-sky", {
    schema: {
        fadeDur: { type: "number", default: 600 }
    },

    init() {
        this.currentLevel = null;
        this.forcedLevel = null;
        this.transitioning = false;
        this._fadeRaf = null;
        this.stateImages = (typeof VR_SKY_STATE_IMAGES !== "undefined" && VR_SKY_STATE_IMAGES) || {};

        this._onScoreChange = (e) => this.applyState(e.detail.scores);
        document.addEventListener("score-changed", this._onScoreChange);
        this.applyState(ScoreSystem.scores);
    },

    _resolveSrc(path) {
        this._srcCache = this._srcCache || {};
        if (this._srcCache[path]) return this._srcCache[path];

        const assets = this.el.sceneEl.querySelector("a-assets");
        let resolved = path;
        if (assets) {
            const img = Array.from(assets.querySelectorAll("img"))
                .find((i) => i.getAttribute("src") === path && i.id);
            if (img) resolved = `#${img.id}`;
        }
        this._srcCache[path] = resolved;
        return resolved;
    },

    _fadeTo(target, done) {
        cancelAnimationFrame(this._fadeRaf);
        const from = this.el.components.material?.data.opacity ?? 1;
        const dur = Math.max(1, this.data.fadeDur);
        const start = performance.now();

        const step = (now) => {
            const t = Math.min(1, (now - start) / dur);
            const eased = t * (2 - t);
            this.el.setAttribute("material", "opacity", from + (target - from) * eased);
            if (t < 1) {
                this._fadeRaf = requestAnimationFrame(step);
            } else if (done) {
                done();
            }
        };
        this._fadeRaf = requestAnimationFrame(step);
    },

    _transitionToImage(src) {
        this.transitioning = true;
        this._fadeTo(0, () => {
            this.el.setAttribute("src", src);
            this.el.setAttribute("material", {
                shader: "flat",
                transparent: true,
                opacity: 0
            });
            this._fadeTo(1, () => {
                this.transitioning = false;
            });
        });
    },

    applyState(scores) {
        if (this.forcedLevel != null) {
            this._applyLevel(this.forcedLevel);
            return;
        }
        const level = ecologyToSkyLevel(scores);
        this._applyLevel(level);
    },

    forceLevel(level) {
        this.forcedLevel = level;
        this._applyLevel(level);
    },

    clearForcedLevel() {
        this.forcedLevel = null;
        this.applyState(ScoreSystem.scores);
    },

    _applyLevel(level) {
        const stateSrc = this.stateImages[level];
        if (!stateSrc) return;

        const resolved = this._resolveSrc(stateSrc);

        if (this.currentLevel === null) {
            this.el.setAttribute("src", resolved);
            this.el.setAttribute("material", {
                shader: "flat",
                transparent: true,
                opacity: 1
            });
        } else if (level !== this.currentLevel && !this.transitioning) {
            this._transitionToImage(resolved);
        }

        this.currentLevel = level;
    },

    remove() {
        document.removeEventListener("score-changed", this._onScoreChange);
        cancelAnimationFrame(this._fadeRaf);
    }
});

/* --- Looping video sky: ensures playback after load and user interaction --- */
AFRAME.registerComponent("sky-video", {
    schema: {
        video: { type: "selector", default: "#sky-video" }
    },

    init() {
        const video = this.data.video;
        if (!video) return;

        video.loop = true;
        video.muted = true;
        video.playsInline = true;

        const play = () => {
            if (video.paused) video.play().catch(() => {});
        };

        video.addEventListener("ended", () => {
            video.currentTime = 0;
            play();
        });

        this.el.addEventListener("loaded", play);
        document.addEventListener("click", play);
        document.addEventListener("mousedown", play);
    }
});

/* --- Keep entity facing the camera every frame --- */
AFRAME.registerComponent("billboard", {
    init() {
        this._target = new THREE.Vector3();
    },

    tick() {
        const camera = this.el.sceneEl.camera?.el;
        if (!camera) return;
        camera.object3D.getWorldPosition(this._target);
        this.el.object3D.lookAt(this._target);
    }
});

/* --- Click-and-drag look (replaces WASD / look-controls) --- */
AFRAME.registerComponent("mouse-drag-look", {
    schema: {
        sensitivity: { type: "number", default: 0.25 },
        minPitch: { type: "number", default: -85 },
        maxPitch: { type: "number", default: 85 }
    },

    init() {
        this.camera = this.el.querySelector("#camera");
        this.yaw = 0;
        this.pitch = 0;
        this.dragging = false;
        this.dragged = false;
        this.suppressClick = false;
        this.lastX = 0;
        this.lastY = 0;
        this.dragThreshold = 4;

        this.el.sceneEl.dragLook = this;
        const canvas = this.el.sceneEl.canvas;

        this._onDown = (e) => {
            if (e.button !== 0) return;
            if (!GameState.interactionsEnabled()) return;
            this.dragging = true;
            this.dragged = false;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.el.sceneEl.classList.add("is-dragging");
        };

        this._onMove = (e) => {
            if (!this.dragging) return;
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            if (Math.abs(dx) > this.dragThreshold || Math.abs(dy) > this.dragThreshold) {
                this.dragged = true;
            }
            this.yaw -= dx * this.data.sensitivity;
            this.pitch -= dy * this.data.sensitivity;
            this.pitch = Math.max(this.data.minPitch, Math.min(this.data.maxPitch, this.pitch));
            this.el.object3D.rotation.y = THREE.MathUtils.degToRad(this.yaw);
            this.camera.object3D.rotation.x = THREE.MathUtils.degToRad(this.pitch);
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        };

        this._onUp = () => {
            if (this.dragging && this.dragged) {
                this.suppressClick = true;
                setTimeout(() => { this.suppressClick = false; }, 50);
            }
            this.dragging = false;
            this.dragged = false;
            this.el.sceneEl.classList.remove("is-dragging");
        };

        canvas.addEventListener("mousedown", this._onDown);
        window.addEventListener("mousemove", this._onMove);
        window.addEventListener("mouseup", this._onUp);
    },

    shouldSuppressClick() {
        return !!this.suppressClick;
    },

    remove() {
        const canvas = this.el.sceneEl.canvas;
        canvas.removeEventListener("mousedown", this._onDown);
        window.removeEventListener("mousemove", this._onMove);
        window.removeEventListener("mouseup", this._onUp);
    }
});

/* --- Decision panel: appears in front of the clicked data object --- */
AFRAME.registerComponent("decision-panel-host", {
    schema: {
        panelDistance: { type: "number", default: 2.8 },
        panelHeight: { type: "number", default: 0.3 }
    },

    init() {
        this.el.sceneEl.decisionPanel = this;
        this.currentItem = null;
        this.buttonsReady = false;
        this.resolving = false;
        this.sessionActive = false;
        this.activeObjectEl = null;
        this.activeObjectId = null;
        this.activeDecisionId = null;
        this._worldPos = new THREE.Vector3();
        this._camPos = new THREE.Vector3();
        this._offset = new THREE.Vector3();

        this.root = this.el;
        this.root.setAttribute("visible", false);
        this.root.setAttribute("look-at", "[camera]");

        const bg = document.createElement("a-plane");
        bg.setAttribute("width", 2.64);
        bg.setAttribute("height", 1.54);
        bg.setAttribute("color", "#b4b4be");
        bg.setAttribute("material", "shader: flat");
        bg.setAttribute("position", "0 0 -0.002");
        this.root.appendChild(bg);

        const panel = document.createElement("a-plane");
        panel.setAttribute("width", 2.6);
        panel.setAttribute("height", 1.5);
        panel.setAttribute("color", "#000000");
        panel.setAttribute("material", "shader: flat");
        panel.classList.add("panel-blocker");
        panel.addEventListener("click", (e) => e.stopPropagation());
        this.root.appendChild(panel);

        this.progressEl = document.createElement("a-text");
        this.progressEl.setAttribute("align", "center");
        this.progressEl.setAttribute("width", 2);
        this.progressEl.setAttribute("position", "0 0.58 0.01");
        this.progressEl.setAttribute("color", "#666666");
        this.progressEl.setAttribute("scale", "0.45 0.45 0.45");
        this.progressEl.setAttribute("visible", false);
        this.root.appendChild(this.progressEl);

        this.questionEl = document.createElement("a-text");
        this.questionEl.setAttribute("align", "center");
        this.questionEl.setAttribute("width", 2.1);
        this.questionEl.setAttribute("wrap-count", 34);
        this.questionEl.setAttribute("position", "0 0.22 0.01");
        this.questionEl.setAttribute("color", "#ffffff");
        this.root.appendChild(this.questionEl);

        this.waitingEl = document.createElement("a-text");
        this.waitingEl.setAttribute("value", "Listen…");
        this.waitingEl.setAttribute("align", "center");
        this.waitingEl.setAttribute("width", 1.5);
        this.waitingEl.setAttribute("position", "0 -0.05 0.01");
        this.waitingEl.setAttribute("color", "#888888");
        this.waitingEl.setAttribute("scale", "0.5 0.5 0.5");
        this.root.appendChild(this.waitingEl);

        this.btnYes = this._createButton("Yes", -0.58);
        this.btnNo = this._createButton("No", 0.58);
        this.root.appendChild(this.btnYes);
        this.root.appendChild(this.btnNo);

        this.yesFill = this.btnYes.fill;
        this.noFill = this.btnNo.fill;

        const onYes = (e) => { e.stopPropagation(); this.onChoice(true); };
        const onNo = (e) => { e.stopPropagation(); this.onChoice(false); };
        this.yesFill.addEventListener("click", onYes);
        this.noFill.addEventListener("click", onNo);

        this._onTerritoryReady = () => this.hide();
        document.addEventListener("territory-reset", this._onTerritoryReady);
    },

    tick() {
        if (!this.isPanelOpen()) return;
        if (this.activeObjectEl) {
            this._positionInFrontOf(this.activeObjectEl);
        } else {
            this._positionInFrontOfCamera();
        }
    },

    remove() {
        document.removeEventListener("territory-reset", this._onTerritoryReady);
    },

    isPanelOpen() {
        return !!(this.root?.object3D?.visible);
    },

    isOpenFor(objectEl) {
        return this.isPanelOpen() && this.activeObjectEl === objectEl;
    },

    _positionInFrontOf(objectEl) {
        const camera = this.el.sceneEl.camera?.el;
        if (!camera) return;

        objectEl.object3D.getWorldPosition(this._worldPos);
        camera.object3D.getWorldPosition(this._camPos);
        // Place panel between the object and the camera (toward the viewer).
        this._offset.copy(this._camPos).sub(this._worldPos);
        const dist = this._offset.length();
        if (dist < 0.001) return;

        this._offset.normalize().multiplyScalar(Math.min(this.data.panelDistance, dist * 0.45));
        const panelPos = this._worldPos.clone().add(this._offset);
        panelPos.y += this.data.panelHeight;

        const parent = this.root.object3D.parent;
        if (parent) {
            parent.updateMatrixWorld(true);
            parent.worldToLocal(panelPos);
        }
        this.root.setAttribute(
            "position",
            `${panelPos.x.toFixed(3)} ${panelPos.y.toFixed(3)} ${panelPos.z.toFixed(3)}`
        );
    },

    _positionInFrontOfCamera() {
        const camera = this.el.sceneEl.camera?.el;
        if (!camera) return;

        camera.object3D.getWorldPosition(this._camPos);
        const dir = new THREE.Vector3(0, 0, -1);
        dir.applyQuaternion(camera.object3D.quaternion);
        const panelPos = this._camPos.clone().add(dir.multiplyScalar(2.6));
        panelPos.y += 0.05;

        const parent = this.root.object3D.parent;
        if (parent) {
            parent.updateMatrixWorld(true);
            parent.worldToLocal(panelPos);
        }
        this.root.setAttribute(
            "position",
            `${panelPos.x.toFixed(3)} ${panelPos.y.toFixed(3)} ${panelPos.z.toFixed(3)}`
        );
    },

    async openForObject(objectEl, objectId) {
        if (!GameState.interactionsEnabled()) return;
        this.sessionActive = false;
        this.activeObjectEl = objectEl;
        this.activeObjectId = objectId;
        this._positionInFrontOf(objectEl);
        this.root.setAttribute("visible", true);
        await this.presentForObject(objectId);
    },

    async openForDecision(objectId, decisionId) {
        if (!GameState.interactionsEnabled()) return;
        if (DecisionState.isDecided(objectId, decisionId)) return;

        this.activeObjectEl = null;
        this.activeObjectId = objectId;
        this.activeDecisionId = decisionId;
        this._positionInFrontOfCamera();
        this.root.setAttribute("visible", true);
        await this.presentDecision(objectId, decisionId);
    },

    hide() {
        this.activeObjectEl = null;
        this.activeObjectId = null;
        this.activeDecisionId = null;
        this.currentItem = null;
        this.buttonsReady = false;
        this.resolving = false;
        this.root.setAttribute("visible", false);
    },

    startSession() {
        if (!GameState.interactionsEnabled()) return;
        this.sessionActive = true;
        this.activeObjectEl = null;
        this._positionInFrontOfCamera();
        this.root.setAttribute("visible", true);
        this.presentCurrent();
    },

    stopSession() {
        this.sessionActive = false;
        this.hide();
    },

    async presentCurrent() {
        if (!this.sessionActive || GameState.over) {
            this.stopSession();
            return;
        }

        const item = DecisionState.getCurrentQueued();
        if (!item) {
            this.showCompleteMessage();
            GameOutcome.evaluate();
            return;
        }

        this.activeObjectId = item.objectId;
        this.activeDecisionId = item.id;
        await this.presentDecision(item.objectId, item.id);
    },

    showCompleteMessage() {
        this.currentItem = null;
        this.buttonsReady = false;
        this.progressEl.setAttribute("value", "All decisions complete");
        this.progressEl.setAttribute("visible", true);
        this.questionEl.setAttribute("value", DecisionState.allResolved()
            ? "No more decisions for this territory."
            : "Waiting…");
        this.waitingEl.setAttribute("visible", false);
        this.setButtonsEnabled(false);
    },

    async presentForObject(objectId) {
        if (GameState.over) {
            this.hide();
            return;
        }

        const item = DecisionState.getNextUndecided(objectId);
        if (!item) {
            this.hide();
            return;
        }

        this.activeDecisionId = item.id;
        await this.presentDecision(objectId, item.id);
    },

    async presentDecision(objectId, decisionId) {
        if (GameState.over) {
            this.hide();
            return;
        }

        const item = DecisionState.getDecision(objectId, decisionId);
        if (!item || DecisionState.isDecided(objectId, decisionId)) {
            this.hide();
            return;
        }

        this.currentItem = item;
        this.buttonsReady = false;
        if (this.activeObjectEl) {
            this._positionInFrontOf(this.activeObjectEl);
        } else {
            this._positionInFrontOfCamera();
        }
        this.root.setAttribute("visible", true);

        const decided = DecisionState.countDecidedTotal();
        const total = DecisionState.countTotalAll();
        const objectLabel = VR_OBJECT_DECISIONS[objectId]?.marker?.title || objectId;
        this.progressEl.setAttribute(
            "value",
            `Decision ${decided + 1} / ${total} · ${objectLabel}`
        );
        this.progressEl.setAttribute("visible", true);
        this.questionEl.setAttribute("value", item.question);
        this.setButtonsEnabled(false);

        const objectData = VR_OBJECT_DECISIONS[objectId];
        const audioId = item.audioId || objectData?.audioOnResolve;
        if (audioId) {
            this.waitingEl.setAttribute("visible", true);
            await AudioManager.playAndWait(audioId);
        } else {
            this.waitingEl.setAttribute("visible", false);
        }

        if (
            this.currentItem !== item ||
            GameState.over ||
            this.activeObjectId !== objectId ||
            this.activeDecisionId !== decisionId
        ) return;

        this.waitingEl.setAttribute("visible", false);
        this.setButtonsEnabled(true);
        this.buttonsReady = true;
    },

    _createButton(label, x) {
        const btn = document.createElement("a-entity");
        btn.setAttribute("position", `${x} -0.42 0.02`);
        btn.classList.add("decision-btn");

        const border = document.createElement("a-plane");
        border.setAttribute("width", 0.76);
        border.setAttribute("height", 0.38);
        border.setAttribute("color", "#ffffff");
        border.setAttribute("material", "shader: flat");
        btn.appendChild(border);

        const fill = document.createElement("a-plane");
        fill.setAttribute("width", 0.72);
        fill.setAttribute("height", 0.34);
        fill.setAttribute("position", "0 0 0.001");
        fill.setAttribute("color", "#000000");
        fill.setAttribute("material", "shader: flat");
        btn.appendChild(fill);

        const text = document.createElement("a-text");
        text.setAttribute("value", label);
        text.setAttribute("align", "center");
        text.setAttribute("width", 2.5);
        text.setAttribute("position", "0 0 0.01");
        text.setAttribute("color", "#ffffff");
        text.setAttribute("scale", "0.55 0.55 0.55");
        btn.appendChild(text);

        btn.border = border;
        btn.fill = fill;
        btn.label = text;
        return btn;
    },

    setButtonsEnabled(enabled) {
        for (const btn of [this.btnYes, this.btnNo]) {
            const borderColor = enabled ? "#ffffff" : "#444444";
            const textColor = enabled ? "#ffffff" : "#666666";
            btn.border.setAttribute("color", borderColor);
            btn.label.setAttribute("color", textColor);
            btn.fill.classList.toggle("clickable", enabled);
        }
    },

    async onChoice(yes) {
        if (!this.buttonsReady || !this.currentItem || this.resolving) return;
        if (!GameState.interactionsEnabled()) return;

        const item = this.currentItem;
        const objectId = this.activeObjectId;
        const { id, yesEffect, noEffect } = item;

        this.resolving = true;
        this.buttonsReady = false;

        if (!DecisionState.markDecided(objectId, id, yes)) {
            this.resolving = false;
            return;
        }

        DecisionState.advanceQueue();

        const effects = yes ? yesEffect : noEffect;
        ScoreSystem.applyEffects(effects);
        GameOutcome.evaluate();

        if (typeof SessionRecorder !== "undefined") {
            SessionRecorder.record({ objectId, decisionId: id, yes, effects });
        }

        if (!GameState.over) AudioManager.playDecisionResponse(yes);

        this.currentItem = null;
        this.resolving = false;

        if (GameState.over) {
            this.stopSession();
            return;
        }

        if (this.activeObjectEl) {
            await this.presentForObject(objectId);
        } else if (this.sessionActive) {
            await this.presentCurrent();
        } else {
            this.hide();
        }
    }
});

/* --- Decision object: presents yes/no for each pending decision --- */
AFRAME.registerComponent("decision-object", {
    schema: {
        objectId: { type: "string" }
    },

    init() {
        this.objectData = VR_OBJECT_DECISIONS[this.data.objectId];
        if (!this.objectData) {
            console.warn(`decision-object: missing object "${this.data.objectId}"`);
            return;
        }

        this.resolving = false;
        this.el.classList.add("interactable");
        this.el.setAttribute("interaction-indicator", "active: false");
        this.updateIndicator();

        this._onInteract = () => this.onInteract();
        this._onDecisionStateChange = (e) => {
            if (e.detail.objectId === this.data.objectId) this.updateIndicator();
        };

        this.el.addEventListener("decision-interact", this._onInteract);
        document.addEventListener("decision-decided", this._onDecisionStateChange);
        // Fired by DecisionState.init() on reset — brings the "?" indicator back.
        document.addEventListener("decision-undecided", this._onDecisionStateChange);
    },

    getPanelHost() {
        return this.el.sceneEl.decisionPanel;
    },

    getPendingDecision() {
        return DecisionState.getNextUndecided(this.data.objectId);
    },

    hasPendingDecisions() {
        return DecisionState.hasUndecided(this.data.objectId);
    },

    updateIndicator() {
        const active = this.hasPendingDecisions();
        if (this.el.components["interaction-indicator"]) {
            this.el.setAttribute("interaction-indicator", { active });
        }
    },

    onInteract() {
        if (!GameState.interactionsEnabled()) return;
        const panel = this.getPanelHost();
        if (!panel || this.resolving) return;

        if (panel.isPanelOpen() && !panel.isOpenFor(this.el)) return;
        if (panel.isOpenFor(this.el)) return;

        if (this.hasPendingDecisions()) {
            this.openPanel();
        } else {
            AudioManager.playNoMoreDecisions();
        }
    },

    async openPanel() {
        if (!this.hasPendingDecisions()) return;

        const panel = this.getPanelHost();
        if (!panel) return;

        await panel.openForObject(this.el, this.data.objectId);
        this.isOpen = panel.isOpenFor(this.el);
    },

    resolve(yes) {
        if (!GameState.interactionsEnabled() || this.resolving) return;

        const decision = this.getPendingDecision();
        if (!decision || DecisionState.isDecided(this.data.objectId, decision.id)) return;

        this.resolving = true;

        if (!DecisionState.markDecided(this.data.objectId, decision.id, yes)) {
            this.resolving = false;
            return;
        }

        const effects = yes ? decision.yesEffect : decision.noEffect;
        ScoreSystem.applyEffects(effects);
        GameOutcome.evaluate();
        if (typeof SessionRecorder !== "undefined") {
            SessionRecorder.record({
                objectId: this.data.objectId,
                decisionId: decision.id,
                yes,
                effects
            });
        }
        // Outcome check may have ended the run; don't talk over ending audio.
        if (!GameState.over) AudioManager.playDecisionResponse(yes);

        this.isOpen = false;
        this.getPanelHost()?.hide();
        this.updateIndicator();

        this.el.emit("decision-resolved", {
            objectId: this.data.objectId,
            decisionId: decision.id,
            yes,
            effects,
            remaining: DecisionState.countTotal(this.data.objectId) - DecisionState.countDecided(this.data.objectId)
        });

        this.resolving = false;
    },

    remove() {
        this.el.removeEventListener("decision-interact", this._onInteract);
        document.removeEventListener("decision-decided", this._onDecisionStateChange);
        document.removeEventListener("decision-undecided", this._onDecisionStateChange);
    }
});

/* --- Hand pinch proximity interaction for VR --- */
AFRAME.registerComponent("hand-interaction", {
    schema: {
        pinchDistance: { type: "number", default: 0.15 },
        hoverDistance: { type: "number", default: 0.35 }
    },

    init() {
        this.hands = [];
        this.interactables = [];
        this.clickables = [];
        this.hovered = null;
        this.pinchCooldown = false;

        this.el.sceneEl.addEventListener("loaded", () => {
            this.hands = [
                document.querySelector("#leftHand"),
                document.querySelector("#rightHand")
            ].filter(Boolean);

            this.hands.forEach((hand) => {
                hand.addEventListener("pinchstarted", (e) => this.onPinch(e, hand));
            });

            this.interactables = this.el.sceneEl.querySelectorAll(".interactable");
            this.clickables = this.el.sceneEl.querySelectorAll(".clickable");
        });
    },

    tick() {
        const handPositions = this.hands
            .map((h) => h?.object3D?.getWorldPosition(new THREE.Vector3()))
            .filter(Boolean);

        if (!handPositions.length) return;

        let closest = null;
        let closestDist = Infinity;

        const targets = [...this.interactables, ...this.clickables];
        targets.forEach((obj) => {
            const pos = obj.object3D.getWorldPosition(new THREE.Vector3());
            handPositions.forEach((hp) => {
                const dist = hp.distanceTo(pos);
                if (dist < this.data.hoverDistance && dist < closestDist) {
                    closestDist = dist;
                    closest = obj;
                }
            });
        });

        if (this.hovered !== closest) {
            if (this.hovered) this.hovered.emit("hover-end");
            this.hovered = closest;
            if (this.hovered) this.hovered.emit("hover-start");
        }
    },

    onPinch(event, hand) {
        if (this.pinchCooldown) return;

        const pinchPos = new THREE.Vector3(
            event.detail.position.x,
            event.detail.position.y,
            event.detail.position.z
        );

        const btns = this.el.sceneEl.querySelectorAll(".decision-btn");
        for (const btn of btns) {
            const pos = btn.object3D.getWorldPosition(new THREE.Vector3());
            if (pinchPos.distanceTo(pos) < 0.12) {
                btn.emit("click");
                this._cooldown();
                return;
            }
        }

        let hit = null;
        let hitDist = Infinity;

        this.interactables.forEach((obj) => {
            const pos = obj.object3D.getWorldPosition(new THREE.Vector3());
            const dist = pinchPos.distanceTo(pos);
            if (dist < this.data.pinchDistance && dist < hitDist) {
                hitDist = dist;
                hit = obj;
            }
        });

        if (hit) {
            hit.emit("decision-interact");
            this._cooldown();
            return;
        }

        for (const obj of this.clickables) {
            const pos = obj.object3D.getWorldPosition(new THREE.Vector3());
            if (pinchPos.distanceTo(pos) < this.data.pinchDistance) {
                obj.emit("click");
                this._cooldown();
                return;
            }
        }
    },

    _cooldown() {
        this.pinchCooldown = true;
        setTimeout(() => { this.pinchCooldown = false; }, 600);
    }
});

/* --- Forward hand-pinch to clickable decision buttons --- */
AFRAME.registerComponent("hand-clickable", {
    init() {
        this.el.classList.add("clickable");
        const hand = document.querySelector("#rightHand") || document.querySelector("#leftHand");
        if (hand) {
            hand.addEventListener("pinchstarted", (e) => {
                const pos = new THREE.Vector3(
                    e.detail.position.x,
                    e.detail.position.y,
                    e.detail.position.z
                );
                const objPos = this.el.object3D.getWorldPosition(new THREE.Vector3());
                if (pos.distanceTo(objPos) < 0.12) {
                    this.el.emit("hand-pinch");
                    this.el.emit("click");
                }
            });
        }
    }
});

/* --- Browser keyboard shortcuts (Y/N for decision panel) --- */
AFRAME.registerComponent("browser-input", {
    init() {
        document.addEventListener("keydown", (e) => {
            if (!GameState.interactionsEnabled()) return;
            const panel = this.el.sceneEl.decisionPanel;
            if (!panel?.buttonsReady) return;
            if (e.key === "y" || e.key === "Y") panel.onChoice(true);
            if (e.key === "n" || e.key === "N") panel.onChoice(false);
        });
    }
});

/* --- Play tier audio when score crosses key thresholds --- */
AFRAME.registerComponent("score-audio-watcher", {
    init() {
        this.lastTiers = {};
        for (const axis of ScoreSystem.ECOLOGY_AXES) {
            this.lastTiers[axis] = ScoreSystem.get(axis);
        }

        document.addEventListener("score-changed", (e) => {
            for (const axis of ScoreSystem.ECOLOGY_AXES) {
                const newVal = e.detail.scores[axis];
                const oldVal = this.lastTiers[axis];
                if (newVal !== oldVal) {
                    const oldPct = ScoreSystem.getEcologyPercent(axis, oldVal);
                    const newPct = ScoreSystem.getEcologyPercent(axis, newVal);
                    const crossed = [25, 50, 75].find(
                        (t) => oldPct < t && newPct >= t
                    );
                    if (crossed) {
                        AudioManager.playForScoreAxis(axis, crossed === 25 ? 1 : crossed === 50 ? 3 : 6);
                    }
                    this.lastTiers[axis] = newVal;
                }
            }
        });
    }
});

/* --- Desktop mouse interaction --- */
AFRAME.registerComponent("mouse-interactable", {
    init() {
        this.mesh = this.el.querySelector(".object-mesh");
        this.el.classList.add("clickable");
        if (this.mesh) this.mesh.classList.add("clickable");

        const interact = (evt) => {
            if (!GameState.interactionsEnabled()) return;
            const dragLook = this.el.sceneEl.dragLook;
            if (dragLook?.shouldSuppressClick?.()) return;

            const panel = this.el.sceneEl.decisionPanel;
            if (panel?.isPanelOpen?.() && !panel.isOpenFor(this.el)) return;

            evt.stopPropagation();
            this.el.emit("decision-interact");
        };

        this.el.addEventListener("click", interact);
        if (this.mesh) {
            this.mesh.addEventListener("click", interact);
            this.mesh.addEventListener("mouseenter", () => this.el.emit("hover-start"));
            this.mesh.addEventListener("mouseleave", () => this.el.emit("hover-end"));
        }
    }
});

/* --- Peak finder frame: visible border around the focus zone in which
 * data markers appear. Keep zoneX/zoneY in sync with data-marker. --- */
AFRAME.registerComponent("peak-finder-frame", {
    schema: {
        zoneX: { type: "number", default: 0.45 },
        zoneY: { type: "number", default: 0.7 }
    },

    init() {
        this.frame = document.createElement("div");
        this.frame.className = "peak-finder-frame";
        this.frame.innerHTML = `
            <span class="peak-finder-frame__corner peak-finder-frame__corner--tl"></span>
            <span class="peak-finder-frame__corner peak-finder-frame__corner--tr"></span>
            <span class="peak-finder-frame__corner peak-finder-frame__corner--bl"></span>
            <span class="peak-finder-frame__corner peak-finder-frame__corner--br"></span>
            <span class="peak-finder-frame__label">PEAK FINDER</span>
        `;
        this.el.sceneEl.appendChild(this.frame);

        if (!TerritoryState.isGameplayReady()) {
            this.frame.style.display = "none";
        }
        this._onGameplayReady = () => { this.frame.style.display = ""; };
        this._onTerritoryReset = () => { this.frame.style.display = "none"; };
        document.addEventListener("territory-gameplay-ready", this._onGameplayReady);
        document.addEventListener("territory-reset", this._onTerritoryReset);
    },

    update() {
        // NDC spans -1..1, so a zone of ±zoneX covers zoneX of the full width.
        this.frame.style.width = `${this.data.zoneX * 100}%`;
        this.frame.style.height = `${this.data.zoneY * 100}%`;
    },

    remove() {
        document.removeEventListener("territory-gameplay-ready", this._onGameplayReady);
        document.removeEventListener("territory-reset", this._onTerritoryReset);
        this.frame?.remove();
    }
});

/* --- Peak-finder style data marker (styled via css/data-marker.css).
 * Projects the object into screen space each frame. The label is shown
 * only while the object sits inside the HUD focus zone, and its value
 * is fed from VR_OBJECT_DECISIONS[objectId].marker based on the current
 * score level of the marker's axis. --- */
AFRAME.registerComponent("data-marker", {
    schema: {
        zoneX: { type: "number", default: 0.45 },  // focus zone half-width  (0–1, NDC)
        zoneY: { type: "number", default: 0.7 },   // focus zone half-height (0–1, NDC)
        yOffset: { type: "number", default: 0.85 } // world units above object origin
    },

    init() {
        const objectId = getEntityObjectId(this.el);
        this.objectId = objectId;
        this.config = null;

        this.marker = document.createElement("div");
        this.marker.className = "data-marker";

        this.titleEl = document.createElement("span");
        this.titleEl.className = "data-marker__label";
        this.marker.appendChild(this.titleEl);

        this.stemEl = document.createElement("span");
        this.stemEl.className = "data-marker__stem";
        this.stemEl.setAttribute("aria-hidden", "true");
        this.marker.appendChild(this.stemEl);

        this.dotEl = document.createElement("span");
        this.dotEl.className = "data-marker__dot";
        this.dotEl.setAttribute("aria-hidden", "true");
        this.marker.appendChild(this.dotEl);

        this.el.sceneEl.appendChild(this.marker);

        this._worldPos = new THREE.Vector3();
        this._camPos = new THREE.Vector3();
        this._camDir = new THREE.Vector3();
        this._toObj = new THREE.Vector3();
        this._ndc = new THREE.Vector3();

        this._onScoreChange = () => this.updateValue();
        this._onTerritoryView = () => this.refreshConfig();
        document.addEventListener("score-changed", this._onScoreChange);
        document.addEventListener("territory-view-applied", this._onTerritoryView);
        this.refreshConfig();
    },

    refreshConfig() {
        this.config = TerritoryState.getMarkerConfig(this.objectId);
        if (!this.config) {
            this.marker.classList.remove("is-visible");
            return;
        }
        this.titleEl.textContent = this.config.title;
        this.marker.className = `data-marker data-marker--${this.config.axis}`;
        this.updateValue(true);
    },

    updateValue(initial = false) {
        if (!this.config || !this.objectId) return;
        const axis = this.config.axis;
        const raw = axis === "ecology"
            ? ScoreSystem.getTotalEcologyPercent()
            : ScoreSystem.get(axis);

        this.titleEl.textContent = ScoreSystem.formatPeakFinderLabel(this.objectId, raw);

        if (!initial) {
            this.marker.classList.add("is-updated");
            clearTimeout(this._flashTimer);
            this._flashTimer = setTimeout(() => {
                this.marker.classList.remove("is-updated");
            }, 400);
        }
    },

    tick() {
        if (!this.config || !TerritoryState.isGameplayReady() || !this.el.getAttribute("visible")) {
            this.marker?.classList.remove("is-visible");
            return;
        }
        const scene = this.el.sceneEl;
        const camera = scene.camera;
        const canvas = scene.canvas;
        if (!camera || !canvas) return;

        this.el.object3D.getWorldPosition(this._worldPos);
        this._worldPos.y += this.data.yOffset;

        // Ignore objects behind the camera (projection would wrap around).
        camera.getWorldPosition(this._camPos);
        camera.getWorldDirection(this._camDir);
        this._toObj.copy(this._worldPos).sub(this._camPos);
        if (this._toObj.dot(this._camDir) <= 0) {
            this.marker.classList.remove("is-visible");
            return;
        }

        this._ndc.copy(this._worldPos).project(camera);

        const inZone =
            Math.abs(this._ndc.x) <= this.data.zoneX &&
            Math.abs(this._ndc.y) <= this.data.zoneY;

        if (!inZone) {
            this.marker.classList.remove("is-visible");
            return;
        }

        const x = (this._ndc.x + 1) / 2 * canvas.clientWidth;
        const y = (1 - this._ndc.y) / 2 * canvas.clientHeight;
        this.marker.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
        this.marker.classList.add("is-visible");
    },

    remove() {
        document.removeEventListener("score-changed", this._onScoreChange);
        document.removeEventListener("territory-view-applied", this._onTerritoryView);
        clearTimeout(this._flashTimer);
        this.marker?.remove();
    }
});

/* --- Territory selection: legacy HTML card grid (replaced by territory-vr-select) --- */
AFRAME.registerComponent("territory-select", {
    init() {
        this.el.sceneEl.territorySelect = this;
        this._buildOverlay();
        this.hide();
    },

    _buildOverlay() {
        this.overlay = document.createElement("div");
        this.overlay.id = "territory-select-overlay";
        this.overlay.className = "territory-select";
        this.overlay.innerHTML = `
            <div class="territory-select__panel">
                <span class="territory-select__tag">// SELECT TERRITORY</span>
                <h1 class="territory-select__title">Choose Your Lens</h1>
                <p class="territory-select__subtitle">
                    Each territory reframes the world — different data labels,
                    views, and onboarding. Pick one to begin.
                </p>
                <div class="territory-select__scoreboard" aria-label="Session scoreboard">
                    <span class="territory-select__scoreboard-label">// SESSION RECORD</span>
                    <div class="territory-select__scoreboard-grid"></div>
                    <div class="territory-select__scoreboard-totals"></div>
                </div>
                <div class="territory-select__grid"></div>
                <button class="territory-select__confirm" type="button" disabled>Confirm</button>
            </div>
        `;

        const grid = this.overlay.querySelector(".territory-select__grid");
        TerritoryState.IDS.forEach((id) => {
            const cfg = VR_TERRITORIES[id];
            const card = document.createElement("button");
            card.type = "button";
            card.className = "territory-select__card";
            card.dataset.territoryId = id;
            card.style.setProperty("--territory-accent", cfg.accent || "#eeeeff");
            card.innerHTML = `
                <span class="territory-select__card-id">// ${id.replace(/_/g, " ")}</span>
                <span class="territory-select__card-name">${cfg.displayName}</span>
                <span class="territory-select__card-tagline">${cfg.tagline || ""}</span>
            `;
            card.addEventListener("click", () => this.selectCard(id, card));
            grid.appendChild(card);
        });

        this.confirmBtn = this.overlay.querySelector(".territory-select__confirm");
        this.confirmBtn.addEventListener("click", () => this.onConfirm());
        this.cards = this.overlay.querySelectorAll(".territory-select__card");
        this.scoreboardGrid = this.overlay.querySelector(".territory-select__scoreboard-grid");
        this.scoreboardTotals = this.overlay.querySelector(".territory-select__scoreboard-totals");

        this._onReset = () => this.show();
        document.addEventListener("territory-reset", this._onReset);
        this._onSessionSaved = () => this._renderScoreboard();
        document.addEventListener("session-saved", this._onSessionSaved);

        this._renderScoreboard();
        this.el.sceneEl.appendChild(this.overlay);
    },

    _renderScoreboard() {
        if (!this.scoreboardGrid || !this.scoreboardTotals || typeof SessionStore === "undefined") return;

        const stats = SessionStore.getStats();
        const hasSessions = stats.totalSessions > 0;

        this.scoreboardGrid.innerHTML = TerritoryState.IDS.map((id) => {
            const cfg = VR_TERRITORIES[id];
            const count = stats.wins[id] || 0;
            const label = count === 1 ? "win" : "wins";
            return `
                <div class="territory-select__scoreboard-stat">
                    <span class="territory-select__scoreboard-name" style="--territory-accent: ${cfg.accent || "#eeeeff"}">
                        ${cfg.displayName}
                    </span>
                    <span class="territory-select__scoreboard-value">${count} ${label}</span>
                </div>
            `;
        }).join("");

        if (!hasSessions) {
            this.scoreboardTotals.innerHTML = `<span class="territory-select__scoreboard-empty">No completed sessions yet</span>`;
            return;
        }

        const winLabel = stats.totalWins === 1 ? "win" : "wins";
        const lossLabel = stats.totalLosses === 1 ? "loss" : "losses";
        this.scoreboardTotals.innerHTML = `
            <span class="territory-select__scoreboard-total territory-select__scoreboard-total--wins">
                ${stats.totalWins} ${winLabel}
            </span>
            <span class="territory-select__scoreboard-sep" aria-hidden="true">·</span>
            <span class="territory-select__scoreboard-total territory-select__scoreboard-total--losses">
                ${stats.totalLosses} ${lossLabel}
            </span>
        `;
    },

    selectCard(id, cardEl) {
        TerritoryState.setPending(id);
        this.cards.forEach((c) => c.classList.toggle("is-selected", c === cardEl));
        this.confirmBtn.disabled = false;
    },

    onConfirm() {
        if (!TerritoryState.pending) return;
        if (!TerritoryState.confirmPending()) return;
        this.hide();
        TerritoryState.applyView(this.el.sceneEl);
        this.el.sceneEl.territoryOnboarding?.start();
    },

    show() {
        TerritoryState.resetView(this.el.sceneEl);
        this.overlay?.classList.remove("is-hidden");
        this.confirmBtn.disabled = !TerritoryState.pending;
        this.cards?.forEach((c) => {
            c.classList.toggle("is-selected", c.dataset.territoryId === TerritoryState.pending);
        });
        this._renderScoreboard();
        setGameUIVisible(false);
    },

    hide() {
        this.overlay?.classList.add("is-hidden");
    },

    remove() {
        document.removeEventListener("territory-reset", this._onReset);
        document.removeEventListener("session-saved", this._onSessionSaved);
        this.overlay?.remove();
    }
});

/* --- Territory onboarding: multi-step modal after confirm --- */
AFRAME.registerComponent("territory-onboarding", {
    init() {
        this.el.sceneEl.territoryOnboarding = this;
        this.stepIndex = 0;
        this._buildOverlay();
    },

    _buildOverlay() {
        this.overlay = document.createElement("div");
        this.overlay.id = "territory-onboarding-overlay";
        this.overlay.className = "territory-onboarding";
        this.overlay.innerHTML = `
            <div class="territory-onboarding__panel">
                <span class="territory-onboarding__territory"></span>
                <span class="territory-onboarding__progress"></span>
                <h2 class="territory-onboarding__title"></h2>
                <p class="territory-onboarding__body"></p>
                <button class="territory-onboarding__btn" type="button">Continue</button>
            </div>
        `;

        this.territoryEl = this.overlay.querySelector(".territory-onboarding__territory");
        this.progressEl = this.overlay.querySelector(".territory-onboarding__progress");
        this.titleEl = this.overlay.querySelector(".territory-onboarding__title");
        this.bodyEl = this.overlay.querySelector(".territory-onboarding__body");
        this.btn = this.overlay.querySelector(".territory-onboarding__btn");
        this.btn.addEventListener("click", () => this.onContinue());

        this.el.sceneEl.appendChild(this.overlay);
    },

    async start() {
        const cfg = TerritoryState.getConfig();
        if (!cfg?.onboarding?.steps?.length) {
            TerritoryState.completeOnboarding();
            setGameUIVisible(true);
            return;
        }

        this.stepIndex = 0;
        this.overlay.style.setProperty("--territory-accent", cfg.accent || "#eeeeff");
        this.territoryEl.textContent = cfg.displayName;
        await this.showStep();
        this.overlay.classList.add("is-visible");
    },

    async showStep() {
        const steps = TerritoryState.getConfig()?.onboarding?.steps || [];
        const step = steps[this.stepIndex];
        if (!step) return;

        this.progressEl.textContent = `STEP ${this.stepIndex + 1} / ${steps.length}`;
        this.titleEl.textContent = step.title;
        this.bodyEl.textContent = step.body;
        this.btn.textContent = this.stepIndex < steps.length - 1 ? "Continue" : "Enter World";

        if (step.audioId) {
            await AudioManager.playAndWait(step.audioId);
        }
    },

    async onContinue() {
        const steps = TerritoryState.getConfig()?.onboarding?.steps || [];
        if (this.stepIndex < steps.length - 1) {
            this.stepIndex += 1;
            await this.showStep();
            return;
        }

        this.overlay.classList.remove("is-visible");
        TerritoryState.completeOnboarding();
        setGameUIVisible(true);
    },

    remove() {
        this.overlay?.remove();
    }
});

/* --- Game over / victory: ecology max = lose; territory goals met = win.
 * Plays ending audio, freezes interactions via GameState.over, then shows a
 * fullscreen HTML overlay with final scores and a Try Again button. --- */
AFRAME.registerComponent("game-over", {
    init() {
        this.triggered = false;
        this._buildOverlay();

        this._onScoreChange = () => GameOutcome.evaluate();
        document.addEventListener("score-changed", this._onScoreChange);
    },

    async trigger(outcome, reason = null) {
        if (this.triggered) return;
        this.triggered = true;
        GameState.over = true;
        GameState.victory = outcome === "win";
        GameState.loseReason = outcome === "lose" ? reason : null;

        const territoryId = TerritoryState.active;
        const session = typeof SessionRecorder !== "undefined"
            ? SessionRecorder.finalize(outcome, reason)
            : null;

        this.el.sceneEl.decisionPanel?.stopSession();
        GameStage.hideDataObjects();
        GameStage.enter(GameStage.DIFFERENTIAL);

        const audioId = GameStage.pickDifferentialAudio(outcome, reason, territoryId);
        try {
            await AudioManager.playAndWait(audioId);
        } catch { /* fallback tone */ }

        await GameStage.fadeToBlack(1200);
        this.showOverlay(outcome, session);
        await GameStage.fadeFromBlack(500);
    },

    _buildOverlay() {
        this.overlay = document.createElement("div");
        this.overlay.id = "game-over-overlay";
        this.overlay.className = "game-over";
        this.overlay.innerHTML = `
            <div class="game-over__content">
                <img class="game-over__logo" src="assets/placeholders/Scales Logo.gif" alt="Scales" width="72" height="72"
                     onerror="this.src='assets/placeholders/SCALES_SETTING.png'; this.onerror=null;">
                <span class="game-over__tag"></span>
                <h1 class="game-over__title"></h1>
                <p class="game-over__subtitle"></p>
                <button class="game-over__btn" type="button">Try Again</button>
            </div>
        `;
        this.tagEl = this.overlay.querySelector(".game-over__tag");
        this.titleEl = this.overlay.querySelector(".game-over__title");
        this.subtitleEl = this.overlay.querySelector(".game-over__subtitle");
        this.overlay.querySelector(".game-over__btn")
            .addEventListener("click", () => this.reset());
        this.el.sceneEl.appendChild(this.overlay);
    },

    showOverlay(outcome, session = null) {
        const isWin = outcome === "win";
        const territory = TerritoryState.getConfig();
        const reportSession = session || SessionRecorder.lastCompleted;

        this.overlay.classList.toggle("game-over--victory", isWin);
        this.tagEl.textContent = isWin ? "// OBJECTIVE COMPLETE" : "// SIMULATION HALTED";
        const loseCopy = {
            ecology: {
                title: "2030 Projection Reached",
                subtitle: "An ecological impact crossed its 2030 projection. The environment can no longer sustain your decisions."
            },
            zero_point: {
                title: "Zero Point",
                subtitle: "Every decision is made, but the territory goals are still out of reach. No path forward remains from here."
            }
        };
        const lose = loseCopy[GameState.loseReason] || loseCopy.ecology;

        this.titleEl.textContent = isWin
            ? "Victory, All Goals Achieved"
            : lose.title;
        this.subtitleEl.textContent = isWin
            ? "You achieved all goals before 2030 Projections were reached."
            : lose.subtitle;

        this.overlay.classList.add("is-visible");
    },

    reset() {
        AudioManager.stop();
        this.overlay.classList.remove("is-visible", "game-over--victory");

        this.triggered = false;
        GameState.resetSession();
        TerritoryState.reset();
        GameStage.enter(GameStage.INCLUSIVE);
    },

    remove() {
        document.removeEventListener("score-changed", this._onScoreChange);
        this.overlay?.remove();
    }
});

/* --- Hover highlight on interactable objects --- */
AFRAME.registerComponent("hover-highlight", {
    init() {
        this.mesh = this.el.querySelector(".object-mesh") || this.el;
        this.isSprite = this.mesh.tagName.toLowerCase() === "a-image";

        this.el.addEventListener("hover-start", () => {
            if (this.isSprite) {
                const reactive = this.el.components["score-reactive-object"];
                if (reactive?.transitioning) return;
                const s = this.mesh.object3D.scale;
                const bump = `${(s.x * 1.06).toFixed(3)} ${(s.y * 1.06).toFixed(3)} ${(s.z * 1.06).toFixed(3)}`;
                this.mesh.setAttribute("animation__hover", {
                    property: "scale",
                    to: bump,
                    dur: 200,
                    easing: "easeOutQuad"
                });
            } else {
                this.mesh.setAttribute("animation__hover", {
                    property: "position",
                    to: "0 0.08 0",
                    dur: 300,
                    easing: "easeOutQuad"
                });
            }
        });
        this.el.addEventListener("hover-end", () => {
            if (this.isSprite) {
                this.el.components["score-reactive-object"]?.applyState(ScoreSystem.scores);
            } else {
                this.mesh.setAttribute("animation__hover", {
                    property: "position",
                    to: "0 0 0",
                    dur: 300,
                    easing: "easeOutQuad"
                });
            }
        });
    }
});
