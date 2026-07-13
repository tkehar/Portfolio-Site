/**
 * Shared scoreboard panels for enter screen and game-over (try again) screens.
 */
const ScoreboardUI = {
    ECOLOGY_PROJECTION_LABELS: {
        water: "Water Usage",
        co2: "CO² Emissions",
        electricity: "Electricity Usage",
        datacenter: "Data Center Distribution"
    },

    ECOLOGY_SIMULATION_LABELS: {
        water: "Highest Water Usage",
        co2: "Highest CO² Emissions",
        electricity: "Highest Electricity Usage",
        datacenter: "Highest Data Center Distribution"
    },

    _resultsSections(stats) {
        return [
            {
                label: "ALL RESULTS",
                wins: stats.totalWins,
                losses: stats.totalLosses
            },
            ...TerritoryState.IDS.map((id) => ({
                label: (VR_TERRITORIES[id]?.displayName || id).toUpperCase(),
                wins: stats.wins[id] || 0,
                losses: stats.losses[id] || 0
            }))
        ];
    },

    renderResultsPanel(container) {
        if (!container) return;
        const stats = typeof SessionStore !== "undefined"
            ? SessionStore.getStats()
            : { totalWins: 0, totalLosses: 0, wins: {}, losses: {} };

        container.innerHTML = this._resultsSections(stats).map((section) => `
            <div class="scoreboard-panel__block">
                <h3 class="scoreboard-panel__heading">${section.label}</h3>
                <div class="scoreboard-panel__row">
                    <span class="scoreboard-panel__row-label">WINS</span>
                    <span class="scoreboard-panel__row-value">${section.wins}</span>
                </div>
                <div class="scoreboard-panel__row">
                    <span class="scoreboard-panel__row-label">LOSSES</span>
                    <span class="scoreboard-panel__row-value">${section.losses}</span>
                </div>
            </div>
        `).join("");
    },

    renderProjectionsPanel(container) {
        if (!container) return;
        const stats = typeof SessionStore !== "undefined" ? SessionStore.getStats() : null;
        const hasSimData = stats?.totalSessions > 0;

        const projectionRows = ScoreSystem.ECOLOGY_HUD_ORDER.map((axis) => {
            const label = this.ECOLOGY_PROJECTION_LABELS[axis] || axis;
            const value = ScoreSystem.formatEcologyHudValue(
                axis,
                ScoreSystem.ECOLOGY_PROJECTION_2030[axis]
            );
            return `
                <div class="scoreboard-panel__row">
                    <span class="scoreboard-panel__row-label">${label}</span>
                    <span class="scoreboard-panel__row-value">${value}</span>
                </div>
            `;
        }).join("");

        const simulationRows = hasSimData
            ? ScoreSystem.ECOLOGY_HUD_ORDER.map((axis) => {
                const label = this.ECOLOGY_SIMULATION_LABELS[axis] || axis;
                const high = stats.ecologyHighs[axis];
                const value = high != null
                    ? ScoreSystem.formatEcologyHudValue(axis, high)
                    : "—";
                return `
                    <div class="scoreboard-panel__row">
                        <span class="scoreboard-panel__row-label">${label}</span>
                        <span class="scoreboard-panel__row-value">${value}</span>
                    </div>
                `;
            }).join("")
            : `<p class="scoreboard-panel__empty">Simulation highs appear after your first session.</p>`;

        container.innerHTML = `
            <div class="scoreboard-panel__block">
                <h3 class="scoreboard-panel__heading">2030 Projections</h3>
                ${projectionRows}
            </div>
            <div class="scoreboard-panel__block">
                <h3 class="scoreboard-panel__heading">Simulation Projections</h3>
                ${simulationRows}
            </div>
        `;
    },

    renderSimulationResultsPanel(container, scores = ScoreSystem.scores) {
        if (!container) return;

        const ecologyRows = ScoreSystem.ECOLOGY_HUD_ORDER.map((axis) => {
            const label = ScoreSystem.ECOLOGY_HUD_LABELS[axis] || axis;
            const value = ScoreSystem.formatEcologyHudValue(axis, scores[axis]);
            return `
                <div class="scoreboard-panel__row">
                    <span class="scoreboard-panel__row-label">${label}</span>
                    <span class="scoreboard-panel__row-value">${value}</span>
                </div>
            `;
        }).join("");

        const thresholds = TerritoryState.getWinThresholds() || {};
        const goalRows = ScoreSystem.GOAL_HUD_ORDER
            .filter((axis) => axis !== "transparency" || thresholds.transparency != null)
            .map((axis) => {
                const label = ScoreSystem.GOAL_HUD_LABELS[axis] || axis;
                const badge = ScoreSystem.formatGoalStatus(axis, scores[axis]);
                return `
                    <div class="scoreboard-panel__row">
                        <span class="scoreboard-panel__row-label">${label}</span>
                        <span class="scoreboard-panel__badge">${badge}</span>
                    </div>
                `;
            }).join("");

        container.innerHTML = `
            <div class="scoreboard-panel__block">
                <h3 class="scoreboard-panel__heading">Simulation Results</h3>
                ${ecologyRows}
                ${goalRows}
            </div>
        `;
    },

    renderDualBoards(root, { includeSimulation = false, scores = null } = {}) {
        if (!root) return;
        const results = root.querySelector("[data-scoreboard-results]");
        const projections = root.querySelector("[data-scoreboard-projections]");
        const simulation = root.querySelector("[data-scoreboard-simulation]");

        if (simulation) {
            this.renderSimulationResultsPanel(simulation, scores || ScoreSystem.scores);
            if (projections) projections.innerHTML = "";
            if (results) this.renderResultsPanel(results);
            return;
        }

        this.renderResultsPanel(results);
        this.renderProjectionsPanel(projections);
    },

    /** @deprecated use renderDualBoards */
    renderInto(root) {
        this.renderDualBoards(root);
    }
};
