/**
 * Builds an in-memory session record during play and persists it on game-over.
 */
const SessionRecorder = {
    /** @type {object|null} */
    active: null,

    /** @type {object|null} Last completed session (for differential report card). */
    lastCompleted: null,

    _freshEcologyExtremes() {
        const min = {};
        const max = {};
        for (const axis of ScoreSystem.ECOLOGY_AXES) {
            const v = ScoreSystem.ECOLOGY_PRESENT[axis];
            min[axis] = v;
            max[axis] = v;
        }
        return { min, max };
    },

    _trackEcology(scores) {
        if (!this.active) return;
        for (const axis of ScoreSystem.ECOLOGY_AXES) {
            const val = scores[axis];
            if (val == null) continue;
            if (val < this.active.ecologyMin[axis]) this.active.ecologyMin[axis] = val;
            if (val > this.active.ecologyMax[axis]) this.active.ecologyMax[axis] = val;
        }
    },

    start(territoryId) {
        const extremes = this._freshEcologyExtremes();
        this.active = {
            sessionId: crypto.randomUUID(),
            territoryId,
            outcome: null,
            loseReason: null,
            startedAt: new Date().toISOString(),
            endedAt: null,
            decisions: [],
            finalScores: null,
            ecologyMin: extremes.min,
            ecologyMax: extremes.max
        };
    },

    record({ objectId, decisionId, yes, effects }) {
        if (!this.active) return;

        this.active.decisions.push({
            objectId,
            decisionId,
            choice: yes,
            effects: { ...effects },
            scoresAfter: { ...ScoreSystem.scores },
            timestamp: new Date().toISOString()
        });
        this._trackEcology(ScoreSystem.scores);
    },

    finalize(outcome, loseReason = null) {
        if (!this.active || this.active.outcome) return null;

        this.active.outcome = outcome;
        this.active.loseReason = loseReason;
        this.active.endedAt = new Date().toISOString();
        this.active.finalScores = { ...ScoreSystem.scores };
        this._trackEcology(ScoreSystem.scores);

        this.lastCompleted = { ...this.active, decisions: [...this.active.decisions] };
        SessionStore.save(this.active);
        this.active = null;
        return this.lastCompleted;
    }
};

document.addEventListener("territory-gameplay-ready", (e) => {
    SessionRecorder.start(e.detail.id);
});
