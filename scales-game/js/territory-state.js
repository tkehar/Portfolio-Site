/**
 * Active territory selection and gameplay-readiness gate.
 * Territory data lives in VR_TERRITORIES (database.js).
 */
const TerritoryState = {
    IDS: ["big_tech", "the_state", "the_multitude"],

    /** @type {string|null} Territory id chosen on the card grid (pre-confirm). */
    pending: null,

    /** @type {string|null} Confirmed active territory. */
    active: null,

    onboardingComplete: false,

    getDisplayName(id) {
        return VR_TERRITORIES[id]?.displayName || id;
    },

    getConfig(id = this.active) {
        return id ? VR_TERRITORIES[id] : null;
    },

    getGoalText(id = this.active) {
        return this.getConfig(id)?.goalText || "";
    },

    getWinThresholds(id = this.active) {
        return this.getConfig(id)?.winThresholds || null;
    },

    /** True when every configured goal threshold is met for the active territory. */
    areGoalsMet(scores = ScoreSystem.scores) {
        const thresholds = this.getWinThresholds();
        if (!thresholds) return false;
        return Object.entries(thresholds).every(([axis, rule]) => {
            const value = scores[axis] ?? 0;
            if (typeof rule === "number") {
                return value >= rule;
            }
            if (rule?.min != null) return value >= rule.min;
            if (rule?.max != null) return value <= rule.max;
            return true;
        });
    },

    isGameplayReady() {
        return !!this.active && this.onboardingComplete && !GameState.over;
    },

    setPending(id) {
        this.pending = id;
        this._emit("territory-pending-changed", { id });
    },

    confirmPending() {
        if (!this.pending) return false;
        this.active = this.pending;
        this.onboardingComplete = false;
        this._emit("territory-confirmed", { id: this.active });
        return true;
    },

    completeOnboarding() {
        this.onboardingComplete = true;
        this._emit("territory-gameplay-ready", { id: this.active });
    },

    getMarkerConfig(objectId) {
        const territory = this.getConfig();
        if (territory?.markers?.[objectId]) {
            return territory.markers[objectId];
        }
        return VR_OBJECT_DECISIONS[objectId]?.marker || null;
    },

    /** Yes/no decision list for an object in the active (or given) territory. */
    getObjectDecisions(objectId, id = this.active) {
        return this.getConfig(id)?.decisions?.[objectId] ?? null;
    },

    applyView(sceneEl) {
        const view = this.getConfig()?.view;
        if (!view || !sceneEl) return;

        const sky = sceneEl.querySelector("a-sky");
        if (sky && view.sky && !sky.components["score-reactive-sky"]) {
            sky.setAttribute("src", view.sky);
        }

        const rig = sceneEl.querySelector("#rig");
        if (rig) {
            if (view.rigPosition) rig.setAttribute("position", view.rigPosition);
            if (view.rigRotation) rig.setAttribute("rotation", view.rigRotation);
        }

        if (view.objectPositions) {
            for (const [entityId, position] of Object.entries(view.objectPositions)) {
                const el = sceneEl.querySelector(`#${entityId}`);
                if (el && position) el.setAttribute("position", position);
            }
        }

        if (view.hiddenObjects) {
            view.hiddenObjects.forEach((entityId) => {
                const el = sceneEl.querySelector(`#${entityId}`);
                if (el) el.setAttribute("visible", false);
            });
        }

        if (view.visibleObjects) {
            view.visibleObjects.forEach((entityId) => {
                const el = sceneEl.querySelector(`#${entityId}`);
                if (el) el.setAttribute("visible", true);
            });
        }

        this._emit("territory-view-applied", { id: this.active, view });
    },

    reset() {
        this.pending = null;
        this.active = null;
        this.onboardingComplete = false;
        this._emit("territory-reset");
    },

    resetView(sceneEl) {
        const view = this.DEFAULT_VIEW;
        if (!view || !sceneEl) return;

        const sky = sceneEl.querySelector("a-sky");
        if (sky && view.sky && !sky.components["score-reactive-sky"]) {
            sky.setAttribute("src", view.sky);
        }

        const rig = sceneEl.querySelector("#rig");
        if (rig) {
            rig.setAttribute("position", view.rigPosition);
            rig.setAttribute("rotation", view.rigRotation);
        }

        for (const [entityId, position] of Object.entries(view.objectPositions || {})) {
            const el = sceneEl.querySelector(`#${entityId}`);
            if (el) {
                el.setAttribute("position", position);
                el.setAttribute("visible", true);
            }
        }
    },

    DEFAULT_VIEW: {
        rigPosition: "0 1.6 0",
        rigRotation: "0 0 0",
        objectPositions: {
            "obj-map": "16.06 2.4 -17.84",
            "obj-mirror": "-21.93 0.9 9.76",
            "obj-scale": "19.42 1.65 14.11",
            "obj-screen": "22.83 0.9 -7.42",
            "obj-compute-box": "-23.48 2.4 -4.99"
        }
    },

    _emit(name, detail = {}) {
        document.dispatchEvent(new CustomEvent(name, { detail }));
    }
};
