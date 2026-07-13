/**
 * Stage UI: enter screen (Inclusive), in-VR territory selection (Managerial),
 * and stage visibility orchestration.
 */

function setSceneGameplayVisible(visible) {
    const scoreCard = document.getElementById("score-card");
    const goalPanel = document.getElementById("territory-goal");
    const hint = document.getElementById("overlay-hint");
    const peakFrame = document.querySelector(".peak-finder-frame");
    if (scoreCard) scoreCard.style.display = visible ? "" : "none";
    if (goalPanel) goalPanel.style.display = visible ? "" : "none";
    if (hint) hint.style.display = visible ? "" : "none";
    if (peakFrame) peakFrame.style.display = visible ? "" : "none";
}

/* --- Inclusive stage: Launch Scales enter screen --- */
AFRAME.registerComponent("enter-screen", {
    init() {
        this.el.sceneEl.enterScreen = this;
        this._buildOverlay();
    },

    _buildOverlay() {
        this.overlay = document.createElement("div");
        this.overlay.id = "enter-screen-overlay";
        this.overlay.className = "enter-screen";
        this.overlay.innerHTML = `
            <div class="enter-screen__content">
                <img class="enter-screen__logo" src="assets/placeholders/Scales Logo.gif" alt="Scales" width="96" height="96"
                     onerror="this.src='assets/placeholders/SCALES_SETTING.png'; this.onerror=null;">
                <h1 class="enter-screen__title">SCALES</h1>
                <p class="enter-screen__subtitle">Weighing the cost AI development</p>
                <div class="scoreboard-boards enter-screen__boards">
                    <div class="scoreboard-panel" data-scoreboard-results></div>
                    <div class="scoreboard-panel" data-scoreboard-projections></div>
                </div>
                <button class="enter-screen__launch" type="button">Launch Scales</button>
            </div>
        `;

        this.launchBtn = this.overlay.querySelector(".enter-screen__launch");
        this.launchBtn.addEventListener("click", () => this.onLaunch());
        this.el.sceneEl.appendChild(this.overlay);
        this._onSessionSaved = () => this.refresh();
        document.addEventListener("session-saved", this._onSessionSaved);
        this.refresh();
    },

    refresh() {
        ScoreboardUI.renderDualBoards(this.overlay);
    },

    show() {
        this.refresh();
        this.overlay?.classList.remove("is-hidden");
    },

    hide() {
        this.overlay?.classList.add("is-hidden");
    },

    async onLaunch() {
        if (this._launching) return;
        this._launching = true;
        this.launchBtn.disabled = true;
        this.launchBtn.textContent = "Entering…";

        this.hide();

        try {
            await this._playIntroVideo();
        } catch { /* proceed even if video fails */ }

        GameStage.enter(GameStage.MANAGERIAL);
        this._launching = false;
        this.launchBtn.disabled = false;
        this.launchBtn.textContent = "Launch Scales";
    },

    _ensureIntroOverlay() {
        let overlay = document.getElementById("intro-video-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "intro-video-overlay";
            overlay.className = "intro-video is-hidden";
            document.body.appendChild(overlay);
        }
        return overlay;
    },

    _closeIntroOverlay(overlay) {
        overlay.classList.add("is-hidden");
        overlay.innerHTML = "";
        if (this._intro360Cleanup) {
            this._intro360Cleanup();
            this._intro360Cleanup = null;
        }
        if (this._ytPlayer?.destroy) {
            try { this._ytPlayer.destroy(); } catch { /* ok */ }
        }
        this._ytPlayer = null;
    },

    _playIntroVideo() {
        const youtubeId = "SxM0yV_4jFI";
        const localSrc = "assets/Intro 360 video/Scales 360 Trailer.mp4";
        return this._playYouTube360Intro(youtubeId).catch(() => this._playLocalIntroVideo(localSrc));
    },

    _bindYouTube360Controls(overlay, player) {
        if (typeof player.setSphericalProperties !== "function") return () => {};

        const dragSurface = overlay.querySelector(".intro-video__drag-surface");
        if (!dragSurface) return () => {};

        const isTouch = window.matchMedia("(pointer: coarse)").matches;
        if (isTouch) {
            dragSurface.style.pointerEvents = "none";
            player.setSphericalProperties({
                yaw: 0,
                pitch: 0,
                fov: 100,
                enableOrientationSensor: true
            });
            return () => {};
        }

        const spherical = { yaw: 0, pitch: 0, fov: 100 };

        if (typeof player.getSphericalProperties === "function") {
            try {
                const props = player.getSphericalProperties();
                spherical.yaw = props.yaw ?? 0;
                spherical.pitch = props.pitch ?? 0;
                spherical.fov = props.fov ?? 100;
            } catch { /* ok */ }
        }

        const apply = () => {
            player.setSphericalProperties({
                yaw: spherical.yaw,
                pitch: Math.max(-90, Math.min(90, spherical.pitch)),
                fov: Math.max(30, Math.min(120, spherical.fov)),
                enableOrientationSensor: false
            });
        };

        apply();

        let dragging = false;
        let lastX = 0;
        let lastY = 0;

        const onPointerDown = (e) => {
            if (e.target.closest(".intro-video__skip")) return;
            dragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            dragSurface.setPointerCapture(e.pointerId);
            dragSurface.classList.add("is-dragging");
        };

        const onPointerMove = (e) => {
            if (!dragging) return;
            spherical.yaw -= (e.clientX - lastX) * 0.35;
            spherical.pitch -= (e.clientY - lastY) * 0.25;
            lastX = e.clientX;
            lastY = e.clientY;
            apply();
        };

        const onPointerUp = (e) => {
            dragging = false;
            dragSurface.classList.remove("is-dragging");
            try { dragSurface.releasePointerCapture(e.pointerId); } catch { /* ok */ }
        };

        const onWheel = (e) => {
            e.preventDefault();
            spherical.fov = Math.max(30, Math.min(120, spherical.fov + e.deltaY * 0.08));
            apply();
        };

        dragSurface.addEventListener("pointerdown", onPointerDown);
        dragSurface.addEventListener("pointermove", onPointerMove);
        dragSurface.addEventListener("pointerup", onPointerUp);
        dragSurface.addEventListener("pointercancel", onPointerUp);
        dragSurface.addEventListener("wheel", onWheel, { passive: false });

        return () => {
            dragSurface.removeEventListener("pointerdown", onPointerDown);
            dragSurface.removeEventListener("pointermove", onPointerMove);
            dragSurface.removeEventListener("pointerup", onPointerUp);
            dragSurface.removeEventListener("pointercancel", onPointerUp);
            dragSurface.removeEventListener("wheel", onWheel);
        };
    },

    _playLocalIntroVideo(src) {
        return new Promise((resolve, reject) => {
            const overlay = this._ensureIntroOverlay();
            overlay.innerHTML = `<video class="intro-video__player" playsinline></video>`;
            const video = overlay.querySelector("video");
            let settled = false;

            const finish = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                this._closeIntroOverlay(overlay);
                resolve();
            };

            const fail = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                this._closeIntroOverlay(overlay);
                reject(new Error("local intro video failed"));
            };

            const timeoutId = setTimeout(fail, 10000);

            overlay.classList.remove("is-hidden");
            video.preload = "auto";
            video.playsInline = true;
            video.src = src.split("/").map(encodeURIComponent).join("/");
            video.onended = finish;
            video.onerror = fail;

            const tryPlay = () => {
                video.play().catch(fail);
            };

            video.addEventListener("canplay", tryPlay, { once: true });
            video.load();
        });
    },

    _loadYouTubeApi() {
        if (window.YT?.Player) return Promise.resolve();
        if (this._ytApiPromise) return this._ytApiPromise;

        this._ytApiPromise = new Promise((resolve) => {
            const existing = document.getElementById("yt-iframe-api");
            if (existing) {
                if (window.YT?.Player) resolve();
                else window.onYouTubeIframeAPIReady = () => resolve();
                return;
            }

            window.onYouTubeIframeAPIReady = () => resolve();
            const tag = document.createElement("script");
            tag.id = "yt-iframe-api";
            tag.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(tag);
        });

        return this._ytApiPromise;
    },

    _playYouTube360Intro(videoId) {
        return this._loadYouTubeApi().then(() => new Promise((resolve, reject) => {
            const overlay = this._ensureIntroOverlay();
            overlay.className = "intro-video intro-video--360";
            overlay.innerHTML = `
                <div class="intro-video__viewport">
                    <div id="intro-yt-player" class="intro-video__yt"></div>
                    <div class="intro-video__drag-surface" aria-hidden="true"></div>
                </div>
                <p class="intro-video__hint">Drag to look around · Scroll to zoom</p>
                <button type="button" class="intro-video__skip">Skip</button>
            `;
            overlay.classList.remove("is-hidden");

            const skipBtn = overlay.querySelector(".intro-video__skip");
            let settled = false;
            let loadTimeoutId = null;

            const finish = () => {
                if (settled) return;
                settled = true;
                clearTimeout(loadTimeoutId);
                this._closeIntroOverlay(overlay);
                resolve();
            };

            const fail = (err) => {
                if (settled) return;
                settled = true;
                clearTimeout(loadTimeoutId);
                this._closeIntroOverlay(overlay);
                reject(err || new Error("YouTube intro failed"));
            };

            skipBtn.addEventListener("click", finish);
            loadTimeoutId = setTimeout(() => fail(new Error("YouTube intro timeout")), 20000);

            this._ytPlayer = new YT.Player("intro-yt-player", {
                videoId,
                width: "100%",
                height: "100%",
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    enablejsapi: 1,
                    fs: 1,
                    iv_load_policy: 3,
                    origin: window.location.origin
                },
                events: {
                    onReady: (event) => {
                        clearTimeout(loadTimeoutId);
                        const player = event.target;
                        player.playVideo();
                        this._intro360Cleanup = this._bindYouTube360Controls(overlay, player);
                    },
                    onStateChange: (event) => {
                        if (event.data === YT.PlayerState.ENDED) finish();
                    },
                    onError: () => fail(new Error("YouTube player error"))
                }
            });
        }));
    },

    remove() {
        document.removeEventListener("session-saved", this._onSessionSaved);
        this.overlay?.remove();
    }
});
AFRAME.registerComponent("territory-vr-select", {
    schema: {
        panelSpacing: { type: "number", default: 2.2 },
        panelDistance: { type: "number", default: 3.5 }
    },

    init() {
        this.el.sceneEl.territoryVrSelect = this;
        this.selectedId = null;
        this.confirmEnabled = false;
        this._confirming = false;

        this.root = document.createElement("a-entity");
        this.root.setAttribute("id", "territory-vr-root");
        this.root.setAttribute("visible", false);
        this.el.appendChild(this.root);

        this._buildPrompt();
        this._buildPanels();

        this._onStage = (e) => {
            if (e.detail.stage === GameStage.MANAGERIAL && !TerritoryState.active) {
                this.show();
            } else {
                this.hide();
            }
        };
        document.addEventListener("stage-changed", this._onStage);
    },

    _buildPrompt() {
        const prompt = document.createElement("a-entity");
        prompt.setAttribute("position", `0 2.1 -${this.data.panelDistance}`);
        prompt.setAttribute("look-at", "[camera]");
        prompt.innerHTML = `
            <a-text value="Select territory" align="center" width="4"
                    color="#ffffff" scale="0.55 0.55 0.55"></a-text>
        `;
        this.root.appendChild(prompt);
    },

    _createBorderedButton(label, width, height) {
        const btn = document.createElement("a-entity");
        const border = document.createElement("a-plane");
        border.setAttribute("width", width + 0.04);
        border.setAttribute("height", height + 0.04);
        border.setAttribute("color", "#ffffff");
        border.setAttribute("material", "shader: flat");
        btn.appendChild(border);

        const fill = document.createElement("a-plane");
        fill.setAttribute("width", width);
        fill.setAttribute("height", height);
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

    _setBorderedButtonState(btn, enabled) {
        const borderColor = enabled ? "#ffffff" : "#555555";
        const textColor = enabled ? "#ffffff" : "#666666";
        btn.border.setAttribute("color", borderColor);
        btn.label.setAttribute("color", textColor);
        btn.fill.classList.toggle("clickable", enabled);
    },

    _buildPanels() {
        this.panels = [];
        const offsets = [-this.data.panelSpacing, 0, this.data.panelSpacing];

        TerritoryState.IDS.forEach((id, index) => {
            const cfg = VR_TERRITORIES[id];
            const panel = document.createElement("a-entity");
            panel.setAttribute("position", `${offsets[index]} 1.55 -${this.data.panelDistance}`);
            panel.setAttribute("look-at", "[camera]");
            panel.dataset.territoryId = id;

            const stroke = document.createElement("a-plane");
            stroke.setAttribute("width", 1.39);
            stroke.setAttribute("height", 1.59);
            stroke.setAttribute("position", "0 0 -0.002");
            stroke.setAttribute("color", "#b4b4be");
            stroke.setAttribute("material", "shader: flat");
            panel.appendChild(stroke);

            const frame = document.createElement("a-plane");
            frame.setAttribute("width", 1.39);
            frame.setAttribute("height", 1.59);
            frame.setAttribute("position", "0 0 -0.001");
            frame.setAttribute("color", "#ffffff");
            frame.setAttribute("material", "shader: flat");
            frame.setAttribute("visible", false);
            panel.appendChild(frame);

            const bg = document.createElement("a-plane");
            bg.setAttribute("width", 1.35);
            bg.setAttribute("height", 1.55);
            bg.setAttribute("color", "#000000");
            bg.setAttribute("material", "shader: flat");
            bg.classList.add("clickable", "territory-vr-panel");
            panel.appendChild(bg);

            const name = document.createElement("a-text");
            name.setAttribute("value", cfg.displayName);
            name.setAttribute("align", "center");
            name.setAttribute("width", 2.2);
            name.setAttribute("position", "0 0.2 0.02");
            name.setAttribute("color", "#ffffff");
            name.setAttribute("scale", "1.04 1.04 1.04");
            panel.appendChild(name);

            const confirmBtn = this._createBorderedButton("Confirm", 0.9, 0.28);
            confirmBtn.setAttribute("position", "0 -0.48 0.02");
            panel.appendChild(confirmBtn);
            this._setBorderedButtonState(confirmBtn, false);

            bg.addEventListener("click", (e) => {
                e.stopPropagation();
                this.selectTerritory(id);
            });

            confirmBtn.fill.addEventListener("click", (e) => {
                e.stopPropagation();
                if (this.selectedId === id && this.confirmEnabled) {
                    this.confirmTerritory();
                }
            });

            this.root.appendChild(panel);
            this.panels.push({ id, panel, bg, frame, confirmBtn });
        });
    },

    async selectTerritory(id) {
        if (this._confirming || this._playingTerritoryAudio) return;
        if (this.selectedId === id && this.confirmEnabled) return;

        const isNewSelection = this.selectedId !== id;
        this.selectedId = id;
        this.confirmEnabled = false;
        TerritoryState.setPending(id);

        for (const p of this.panels) {
            const selected = p.id === id;
            p.frame.setAttribute("visible", selected);
            p.bg.setAttribute("color", "#000000");
            this._setBorderedButtonState(p.confirmBtn, false);
        }

        if (!isNewSelection) return;

        const audioId = `territory_${id}`;
        this._playingTerritoryAudio = true;
        try {
            await AudioManager.playAndWait(audioId);
        } catch { /* ok */ }
        this._playingTerritoryAudio = false;

        if (this.selectedId !== id) return;

        const p = this.panels.find((x) => x.id === id);
        if (p) {
            this.confirmEnabled = true;
            this._setBorderedButtonState(p.confirmBtn, true);
        }
    },

    async confirmTerritory() {
        if (this._confirming || !TerritoryState.pending) return;
        this._confirming = true;

        if (!TerritoryState.confirmPending()) {
            this._confirming = false;
            return;
        }

        this.hide();
        TerritoryState.applyView(this.el.sceneEl);
        TerritoryState.completeOnboarding();

        this._confirming = false;
    },

    show() {
        this.selectedId = null;
        this.confirmEnabled = false;
        this._playingTerritoryAudio = false;
        TerritoryState.reset();
        GameStage.hideDataObjects();
        setSceneGameplayVisible(false);
        this.el.sceneEl.decisionPanel?.stopSession();
        this.root.setAttribute("visible", true);

        for (const p of this.panels) {
            p.frame.setAttribute("visible", false);
            p.bg.setAttribute("color", "#000000");
            this._setBorderedButtonState(p.confirmBtn, false);
        }
    },

    hide() {
        this.root.setAttribute("visible", false);
    },

    remove() {
        document.removeEventListener("stage-changed", this._onStage);
    }
});

/* --- Orchestrates stage visibility on the scene --- */
AFRAME.registerComponent("stage-controller", {
    init() {
        GameStage.init(this.el);
        setSceneGameplayVisible(false);
        GameStage.hideDataObjects();

        this._onStage = (e) => this.applyStage(e.detail.stage);
        this._onGameplayReady = () => {
            GameStage.showDataObjects();
            setSceneGameplayVisible(true);
        };
        document.addEventListener("stage-changed", this._onStage);
        document.addEventListener("territory-gameplay-ready", this._onGameplayReady);

        this.el.addEventListener("loaded", () => {
            this.el.enterScreen?.show();
            this.applyStage(GameStage.current);
        });
    },

    applyStage(stage) {
        const canvas = this.el.canvas;

        if (stage === GameStage.INCLUSIVE) {
            if (canvas) canvas.style.visibility = "hidden";
            this.el.enterScreen?.show();
            this.el.territoryVrSelect?.hide();
            setSceneGameplayVisible(false);
            GameStage.hideDataObjects();
            TerritoryState.reset();
            this.el.decisionPanel?.stopSession();
        } else if (stage === GameStage.MANAGERIAL) {
            if (canvas) canvas.style.visibility = "visible";
            this.el.enterScreen?.hide();
            if (!TerritoryState.isGameplayReady()) {
                this.el.territoryVrSelect?.show();
            }
        } else if (stage === GameStage.DIFFERENTIAL) {
            if (canvas) canvas.style.visibility = "visible";
            this.el.enterScreen?.hide();
            this.el.territoryVrSelect?.hide();
            setSceneGameplayVisible(false);
            GameStage.hideDataObjects();
        }
    },

    remove() {
        document.removeEventListener("stage-changed", this._onStage);
        document.removeEventListener("territory-gameplay-ready", this._onGameplayReady);
    }
});
