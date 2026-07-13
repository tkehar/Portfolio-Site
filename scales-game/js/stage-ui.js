/**
 * Stage UI: enter screen (Inclusive), in-VR territory selection (Managerial),
 * and stage visibility orchestration.
 */

function setSceneGameplayVisible(visible) {
    const scoreCard = document.getElementById("score-card");
    const goalPanel = document.getElementById("territory-goal");
    const hint = document.getElementById("overlay-hint");
    const peakFrame = document.querySelector(".peak-finder-frame");
    const panel = document.querySelector("[decision-panel-host]");
    if (scoreCard) scoreCard.style.display = visible ? "" : "none";
    if (goalPanel) goalPanel.style.display = visible ? "" : "none";
    if (hint) hint.style.display = visible ? "" : "none";
    if (peakFrame) peakFrame.style.display = visible ? "" : "none";
    if (panel) panel.setAttribute("visible", visible);
}

/* --- Inclusive stage: Launch Scales enter screen --- */
AFRAME.registerComponent("enter-screen", {
    init() {
        this.el.sceneEl.enterScreen = this;
        this._buildOverlay();
        this._onSessionSaved = () => this.refresh();
        document.addEventListener("session-saved", this._onSessionSaved);
    },

    _buildOverlay() {
        this.overlay = document.createElement("div");
        this.overlay.id = "enter-screen-overlay";
        this.overlay.className = "enter-screen";
        this.overlay.innerHTML = `
            <div class="enter-screen__panel">
                <img class="enter-screen__logo" src="assets/placeholders/Scales Logo.gif" alt="Scales" width="120" height="120"
                     onerror="this.src='assets/placeholders/SCALES_SETTING.png'; this.onerror=null;">
                <span class="enter-screen__tag">// DATA COLONIALISM SIMULATION</span>
                <h1 class="enter-screen__title">Scales</h1>
                <div class="scoreboard-ui enter-screen__scoreboard" aria-label="Session record">
                    <span class="scoreboard-ui__label">// SESSION RECORD</span>
                    <div class="scoreboard-ui__grid" data-scoreboard-wins></div>
                    <div class="scoreboard-ui__totals" data-scoreboard-totals></div>
                    <span class="scoreboard-ui__label scoreboard-ui__label--secondary">// ECOLOGY EXTREMES</span>
                    <div class="scoreboard-ui__ecology" data-scoreboard-ecology></div>
                    <div class="scoreboard-ui__impact" data-scoreboard-impact></div>
                </div>
                <button class="enter-screen__launch" type="button">Launch Scales</button>
            </div>
        `;

        this.launchBtn = this.overlay.querySelector(".enter-screen__launch");
        this.launchBtn.addEventListener("click", () => this.onLaunch());
        this.el.sceneEl.appendChild(this.overlay);
        this.refresh();
    },

    refresh() {
        ScoreboardUI.renderInto(this.overlay);
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
        if (this._ytPlayer?.destroy) {
            try { this._ytPlayer.destroy(); } catch { /* ok */ }
        }
        this._ytPlayer = null;
    },

    _playIntroVideo() {
        const localSrc = "assets/Intro 360 video/Scales 360 Trailer.mp4";
        const youtubeId = "SxM0yV_4jFI";
        return this._playLocalIntroVideo(localSrc).catch(() => this._playYouTubeIntroVideo(youtubeId));
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

    _playYouTubeIntroVideo(videoId) {
        return this._loadYouTubeApi().then(() => new Promise((resolve) => {
            const overlay = this._ensureIntroOverlay();
            overlay.innerHTML = `<div id="intro-yt-player" class="intro-video__yt"></div>`;
            overlay.classList.remove("is-hidden");

            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                this._closeIntroOverlay(overlay);
                resolve();
            };

            this._ytPlayer = new YT.Player("intro-yt-player", {
                videoId,
                width: "100%",
                height: "100%",
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    rel: 0,
                    modestbranding: 1,
                    playsinline: 1
                },
                events: {
                    onReady: (event) => {
                        event.target.playVideo();
                    },
                    onStateChange: (event) => {
                        if (event.data === YT.PlayerState.ENDED) finish();
                    },
                    onError: () => finish()
                }
            });
        }));
    },

    remove() {
        document.removeEventListener("session-saved", this._onSessionSaved);
        this.overlay?.remove();
    }
});

/* --- Managerial stage: in-VR territory selection --- */
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
