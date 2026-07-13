/**
 * Three-stage game flow per Game Glossary:
 * inclusive → managerial → differential → inclusive
 */
const GameStage = {
    INCLUSIVE: "inclusive",
    MANAGERIAL: "managerial",
    DIFFERENTIAL: "differential",

    /** @type {"inclusive"|"managerial"|"differential"} */
    current: "inclusive",

    /** @type {HTMLElement|null} */
    sceneEl: null,

    init(sceneEl) {
        this.sceneEl = sceneEl || document.querySelector("a-scene");
        this.enter(this.INCLUSIVE, { silent: true });
    },

    is(stage) {
        return this.current === stage;
    },

    isManagerial() {
        return this.current === this.MANAGERIAL;
    },

    enter(stage, options = {}) {
        if (![this.INCLUSIVE, this.MANAGERIAL, this.DIFFERENTIAL].includes(stage)) return;
        const previous = this.current;
        this.current = stage;

        if (this.sceneEl) {
            this.sceneEl.setAttribute("data-stage", stage);
        }

        if (!options.silent) {
            document.dispatchEvent(new CustomEvent("stage-changed", {
                detail: { stage, previous }
            }));
        }
    },

    /** Hide all data-object entities in the scene. */
    hideDataObjects() {
        const scene = this.sceneEl || document.querySelector("a-scene");
        if (!scene) return;
        for (const objectId of Object.keys(VR_OBJECT_DECISIONS)) {
            const el = scene.querySelector(`#obj-${objectId.replace(/_/g, "-")}`);
            if (el) el.setAttribute("visible", false);
        }
    },

    /** Show all data-object entities. */
    showDataObjects() {
        const scene = this.sceneEl || document.querySelector("a-scene");
        if (!scene) return;
        for (const objectId of Object.keys(VR_OBJECT_DECISIONS)) {
            const el = scene.querySelector(`#obj-${objectId.replace(/_/g, "-")}`);
            if (el) el.setAttribute("visible", true);
        }
    },

    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },

    async fadeToBlack(duration = 1400) {
        const fade = document.getElementById("stage-fade");
        if (!fade) return;
        fade.classList.add("is-visible");
        await this.sleep(duration);
    },

    async fadeFromBlack(duration = 600) {
        const fade = document.getElementById("stage-fade");
        if (!fade) return;
        fade.classList.remove("is-visible");
        await this.sleep(duration);
    },

    pickDifferentialAudio(outcome, loseReason, territoryId) {
        if (outcome === "win") {
            const map = {
                big_tech: "diff_big_tech_win",
                the_state: "diff_the_state_win",
                the_multitude: "diff_the_multitude_win"
            };
            return map[territoryId] || "game_win";
        }
        if (loseReason === "zero_point") return "diff_zero_point";
        return "diff_ecology_loss";
    }
};
