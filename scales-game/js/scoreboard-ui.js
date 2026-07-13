/**
 * Shared scoreboard + impact panel rendering for enter screen and differential stage.
 */
const ScoreboardUI = {
    ECOLOGY_LABELS: {
        co2: "CO₂ emissions",
        water: "Water usage",
        electricity: "Electricity",
        datacenter: "Data center land"
    },

    renderWinsGrid(container) {
        if (!container || typeof SessionStore === "undefined") return;
        const stats = SessionStore.getStats();

        container.innerHTML = TerritoryState.IDS.map((id) => {
            const cfg = VR_TERRITORIES[id];
            const wins = stats.wins[id] || 0;
            const losses = stats.losses[id] || 0;
            return `
                <div class="scoreboard-ui__territory-stat">
                    <span class="scoreboard-ui__territory-name" style="--territory-accent: ${cfg.accent || "#eeeeff"}">
                        ${cfg.displayName}
                    </span>
                    <span class="scoreboard-ui__territory-value">${wins}W · ${losses}L</span>
                </div>
            `;
        }).join("");
    },

    renderTotals(container) {
        if (!container || typeof SessionStore === "undefined") return;
        const stats = SessionStore.getStats();

        if (stats.totalSessions === 0) {
            container.innerHTML = `<span class="scoreboard-ui__empty">No completed sessions yet</span>`;
            return;
        }

        const winLabel = stats.totalWins === 1 ? "win" : "wins";
        const lossLabel = stats.totalLosses === 1 ? "loss" : "losses";
        container.innerHTML = `
            <span class="scoreboard-ui__total scoreboard-ui__total--wins">${stats.totalWins} ${winLabel}</span>
            <span class="scoreboard-ui__sep" aria-hidden="true">·</span>
            <span class="scoreboard-ui__total scoreboard-ui__total--losses">${stats.totalLosses} ${lossLabel}</span>
        `;
    },

    renderEcologyExtremes(container) {
        if (!container || typeof SessionStore === "undefined") return;
        const stats = SessionStore.getStats();
        const hasData = stats.totalSessions > 0;

        if (!hasData) {
            container.innerHTML = `<span class="scoreboard-ui__empty">Ecology highs/lows appear after your first session</span>`;
            return;
        }

        container.innerHTML = ScoreSystem.ECOLOGY_AXES.map((axis) => {
            const high = stats.ecologyHighs[axis];
            const low = stats.ecologyLows[axis];
            const label = this.ECOLOGY_LABELS[axis] || axis;
            return `
                <div class="scoreboard-ui__ecology-row">
                    <span class="scoreboard-ui__ecology-label">${label}</span>
                    <span class="scoreboard-ui__ecology-values">
                        <span class="scoreboard-ui__ecology-low">↓ ${ScoreSystem.formatEcologyValue(axis, low)}</span>
                        <span class="scoreboard-ui__ecology-high">↑ ${ScoreSystem.formatEcologyValue(axis, high)}</span>
                    </span>
                </div>
            `;
        }).join("");
    },

    renderImpactPanel(container, { showBaselines = false } = {}) {
        if (!container) return;

        const rows = ScoreSystem.ECOLOGY_AXES.map((axis) => {
            const label = this.ECOLOGY_LABELS[axis] || axis;
            const present = ScoreSystem.formatEcologyValue(axis, ScoreSystem.ECOLOGY_PRESENT[axis]);
            const projection = ScoreSystem.formatEcologyValue(axis, ScoreSystem.ECOLOGY_PROJECTION_2030[axis]);
            return `
                <div class="scoreboard-ui__impact-row">
                    <span class="scoreboard-ui__impact-label">${label}</span>
                    <span class="scoreboard-ui__impact-present">${present}</span>
                    <span class="scoreboard-ui__impact-projection">${projection}</span>
                </div>
            `;
        }).join("");

        container.innerHTML = `
            <span class="scoreboard-ui__impact-title">${showBaselines ? "// PRESENT & 2030 BASELINES" : "// ECOLOGY BASELINES"}</span>
            <div class="scoreboard-ui__impact-header">
                <span></span><span>Present</span><span>2030</span>
            </div>
            ${rows}
        `;
    },

    renderInto(root) {
        if (!root) return;
        const grid = root.querySelector("[data-scoreboard-wins]");
        const totals = root.querySelector("[data-scoreboard-totals]");
        const ecology = root.querySelector("[data-scoreboard-ecology]");
        const impact = root.querySelector("[data-scoreboard-impact]");

        this.renderWinsGrid(grid);
        this.renderTotals(totals);
        this.renderEcologyExtremes(ecology);
        if (impact) {
            const showBaselines = typeof SessionStore !== "undefined" && !SessionStore.hasVisited();
            this.renderImpactPanel(impact, { showBaselines });
        }
    }
};
