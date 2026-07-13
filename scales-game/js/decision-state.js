/**
 * Tracks decided / undecided status for every decision on every object.
 * Presents territory decisions in a shuffled queue (panel-driven flow).
 */
const DecisionState = {
    /** @type {Record<string, Record<string, { decided: boolean, choice: boolean|null }>>} */
    states: {},

    /** @type {{ objectId: string, id: string, question: string, yesEffect: object, noEffect: object }[]} */
    queue: [],

    queueIndex: 0,

    init() {
        this.states = {};
        this.queue = [];
        this.queueIndex = 0;
        if (!TerritoryState.active) return;

        for (const objectId of Object.keys(VR_OBJECT_DECISIONS)) {
            const decisions = TerritoryState.getObjectDecisions(objectId);
            if (!decisions?.length) continue;

            this.states[objectId] = {};
            for (const decision of decisions) {
                this.states[objectId][decision.id] = { decided: false, choice: null };
                this.queue.push({ objectId, ...decision });
                this._emit("decision-undecided", { objectId, decisionId: decision.id });
            }
        }

        this._shuffleQueue();
    },

    _shuffleQueue() {
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
    },

    getCurrentQueued() {
        while (this.queueIndex < this.queue.length) {
            const item = this.queue[this.queueIndex];
            if (!this.isDecided(item.objectId, item.id)) return item;
            this.queueIndex++;
        }
        return null;
    },

    advanceQueue() {
        this.queueIndex++;
    },

    countDecidedTotal() {
        let n = 0;
        for (const objectId of Object.keys(this.states)) {
            n += this.countDecided(objectId);
        }
        return n;
    },

    countTotalAll() {
        return this.queue.length;
    },

    isDecided(objectId, decisionId) {
        return this.states[objectId]?.[decisionId]?.decided ?? false;
    },

    getNextUndecided(objectId) {
        const decisions = TerritoryState.getObjectDecisions(objectId);
        if (!decisions) return null;
        return decisions.find((d) => !this.isDecided(objectId, d.id)) || null;
    },

    hasUndecided(objectId) {
        return !!this.getNextUndecided(objectId);
    },

    countDecided(objectId) {
        return Object.values(this.states[objectId] || {}).filter((s) => s.decided).length;
    },

    countTotal(objectId) {
        return TerritoryState.getObjectDecisions(objectId)?.length ?? 0;
    },

    allResolved() {
        return this.countTotalAll() > 0 && this.countDecidedTotal() >= this.countTotalAll();
    },

    markDecided(objectId, decisionId, yes) {
        const entry = this.states[objectId]?.[decisionId];
        if (!entry || entry.decided) return false;

        entry.decided = true;
        entry.choice = yes;
        this._emit("decision-decided", { objectId, decisionId, yes });
        return true;
    },

    markUndecided(objectId, decisionId) {
        const entry = this.states[objectId]?.[decisionId];
        if (!entry || !entry.decided) return false;

        entry.decided = false;
        entry.choice = null;
        this._emit("decision-undecided", { objectId, decisionId });
        return true;
    },

    _emit(name, detail) {
        document.dispatchEvent(new CustomEvent(name, { detail }));
    }
};

document.addEventListener("territory-gameplay-ready", () => {
    GameState.resetSession();
    ScoreSystem.reset(TerritoryState.active);
    DecisionState.init();
    if (typeof syncTerritoryObjectVisibility === "function") {
        syncTerritoryObjectVisibility();
    }
    const panel = document.querySelector("a-scene")?.decisionPanel;
    if (panel?.startSession) panel.startSession();
});

document.addEventListener("territory-reset", () => {
    const panel = document.querySelector("a-scene")?.decisionPanel;
    if (panel?.stopSession) panel.stopSession();
});
