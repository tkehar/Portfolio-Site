/**
 * Persists completed game sessions in localStorage.
 * Data stays in the browser — nothing is sent to a server.
 */
const SessionStore = {
    STORAGE_KEY: "vr-decision-sessions",
    VISITED_KEY: "vr-decision-has-visited",
    SCHEMA_VERSION: 2,
    MAX_SESSIONS: 100,

    list() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return [];
            const data = JSON.parse(raw);
            return Array.isArray(data.sessions) ? data.sessions : [];
        } catch {
            return [];
        }
    },

    hasVisited() {
        try {
            return localStorage.getItem(this.VISITED_KEY) === "1";
        } catch {
            return false;
        }
    },

    markVisited() {
        try {
            localStorage.setItem(this.VISITED_KEY, "1");
        } catch { /* ignore */ }
    },

    _emptyEcologyMap() {
        return Object.fromEntries(ScoreSystem.ECOLOGY_AXES.map((a) => [a, null]));
    },

    save(session) {
        if (!session?.sessionId || !session?.territoryId || !session?.outcome) return false;

        const sessions = this.list().filter((s) => s.sessionId !== session.sessionId);
        sessions.unshift({
            schemaVersion: this.SCHEMA_VERSION,
            sessionId: session.sessionId,
            territoryId: session.territoryId,
            outcome: session.outcome,
            loseReason: session.loseReason ?? null,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            decisions: session.decisions || [],
            finalScores: session.finalScores || null,
            ecologyMin: session.ecologyMin || null,
            ecologyMax: session.ecologyMax || null
        });

        if (sessions.length > this.MAX_SESSIONS) {
            sessions.length = this.MAX_SESSIONS;
        }

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                schemaVersion: this.SCHEMA_VERSION,
                sessions
            }));
            this.markVisited();
            document.dispatchEvent(new CustomEvent("session-saved", { detail: { sessionId: session.sessionId } }));
            return true;
        } catch {
            return false;
        }
    },

    getStats() {
        const wins = Object.fromEntries(TerritoryState.IDS.map((id) => [id, 0]));
        const losses = Object.fromEntries(TerritoryState.IDS.map((id) => [id, 0]));
        let totalWins = 0;
        let totalLosses = 0;

        const ecologyHighs = this._emptyEcologyMap();
        const ecologyLows = this._emptyEcologyMap();

        for (const session of this.list()) {
            if (session.outcome === "win") {
                if (wins[session.territoryId] != null) wins[session.territoryId]++;
                totalWins++;
            } else if (session.outcome === "lose") {
                if (losses[session.territoryId] != null) losses[session.territoryId]++;
                totalLosses++;
            }

            const maxScores = session.ecologyMax || session.finalScores;
            const minScores = session.ecologyMin || session.finalScores;
            if (maxScores) {
                for (const axis of ScoreSystem.ECOLOGY_AXES) {
                    const val = maxScores[axis];
                    if (val == null) continue;
                    if (ecologyHighs[axis] == null || val > ecologyHighs[axis]) {
                        ecologyHighs[axis] = val;
                    }
                }
            }
            if (minScores) {
                for (const axis of ScoreSystem.ECOLOGY_AXES) {
                    const val = minScores[axis];
                    if (val == null) continue;
                    if (ecologyLows[axis] == null || val < ecologyLows[axis]) {
                        ecologyLows[axis] = val;
                    }
                }
            }
        }

        return {
            wins,
            losses,
            totalWins,
            totalLosses,
            totalSessions: totalWins + totalLosses,
            ecologyHighs,
            ecologyLows
        };
    }
};
