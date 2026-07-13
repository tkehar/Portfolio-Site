/**
 * Scoring per Game Glossary (revised):
 * - Ecology axes track absolute present values toward 2030 projections (lose on reach)
 * - Goal / integrity axes: -6–6
 * - Starting ecology values are identical across territories (Score Allocation)
 */
const ScoreSystem = {
    ECOLOGY_AXES: ["co2", "water", "electricity", "datacenter"],
    GOAL_AXES: ["sovereignty", "power", "identity"],
    INTEGRITY_AXES: ["transparency"],
    ALL_AXES: [
        "co2", "water", "electricity", "datacenter",
        "sovereignty", "power", "identity", "transparency"
    ],

    ECOLOGY_PRESENT: {
        co2: 189000000,
        water: 4500000000000,
        electricity: 448,
        datacenter: 6900
    },

    ECOLOGY_PROJECTION_2030: {
        co2: 399000000,
        water: 9300000000000,
        electricity: 945,
        datacenter: 14500
    },

    MATRIX_AXIS_MAP: {
        Identity: "identity",
        Power: "power",
        Sovereignty: "sovereignty",
        Transparency: "transparency",
        "CO2 Emissions (tonnes)": "co2",
        "Water Usage (liters)": "water",
        "Electricity Usage (TWh)": "electricity",
        "Data Center Distribution (km2)": "datacenter",
        "Carbon Dioxide Emissions": "co2",
        "CO2 E": "co2",
        Minerals: "co2",
        "Mineral Usage": "co2"
    },

    GOAL_STATUS_LABELS: {
        sovereignty: ["Extractive", "Managed", "Balanced", "Participatory", "Self-Governed"],
        identity: ["Erased", "Assimilated", "Hybrid", "Self Determined", "Sovereign"],
        power: ["State-Corporate", "Corporate-Led", "Balanced", "Public Interest", "Community-Led"],
        transparency: ["Opaque 100%", "Mostly Opaque", "Mixed", "Mostly Open", "Fully Open"]
    },

    ECOLOGY_HUD_LABELS: {
        water: "Water Usage",
        co2: "CO2 Emissions",
        electricity: "Electricity Usage",
        datacenter: "Data Center Distribution"
    },

    GOAL_HUD_LABELS: {
        sovereignty: "Sovereignty",
        identity: "Identity",
        power: "Power",
        transparency: "Transparency"
    },

    ECOLOGY_HUD_ORDER: ["water", "co2", "electricity", "datacenter"],
    GOAL_HUD_ORDER: ["sovereignty", "identity", "power", "transparency"],

    GOAL_MIN: -6,
    GOAL_MAX: 6,

    scores: {},

    init() {
        this.scores = this._defaultScores();
    },

    _defaultScores() {
        const scores = {};
        for (const axis of this.ECOLOGY_AXES) {
            scores[axis] = this.ECOLOGY_PRESENT[axis];
        }
        for (const axis of [...this.GOAL_AXES, ...this.INTEGRITY_AXES]) {
            scores[axis] = 0;
        }
        return scores;
    },

    clamp(axis, value) {
        if (this.isEcologyAxis(axis)) {
            return Math.max(this.ECOLOGY_PRESENT[axis], value);
        }
        return Math.max(this.GOAL_MIN, Math.min(this.GOAL_MAX, value));
    },

    get(axis) {
        return this.scores[axis] ?? 0;
    },

    isEcologyAxis(axis) {
        return this.ECOLOGY_AXES.includes(axis);
    },

    isGoalAxis(axis) {
        return this.GOAL_AXES.includes(axis) || this.INTEGRITY_AXES.includes(axis);
    },

    isIntegrityAxis(axis) {
        return this.INTEGRITY_AXES.includes(axis);
    },

    getEcologyPercent(axis, value = this.scores[axis]) {
        const present = this.ECOLOGY_PRESENT[axis];
        const projection = this.ECOLOGY_PROJECTION_2030[axis];
        const span = projection - present;
        if (span <= 0) return 0;
        return Math.max(0, Math.min(100, ((value - present) / span) * 100));
    },

    getTotalEcologyPercent(scores = this.scores) {
        const values = this.ECOLOGY_AXES.map((axis) =>
            this.getEcologyPercent(axis, scores[axis] ?? this.ECOLOGY_PRESENT[axis])
        );
        return values.reduce((sum, pct) => sum + pct, 0) / values.length;
    },

    hasEcologyFailure(scores = this.scores) {
        return this.ECOLOGY_AXES.some(
            (axis) => (scores[axis] ?? 0) >= this.ECOLOGY_PROJECTION_2030[axis]
        );
    },

    formatEcologyValue(axis, value = this.get(axis)) {
        if (axis === "co2") return `${(value / 1e6).toFixed(1)}M t`;
        if (axis === "water") return `${(value / 1e12).toFixed(2)}T L`;
        if (axis === "electricity") return `${Math.round(value)} TWh`;
        if (axis === "datacenter") return `${Math.round(value).toLocaleString()} km²`;
        return String(value);
    },

    formatEcologyHudValue(axis, value = this.get(axis)) {
        if (axis === "water") return `${(value / 1e12).toFixed(1)} trillion liters`;
        if (axis === "co2") return `${Math.round(value / 1e6)} million tonnes`;
        if (axis === "electricity") return `${Math.round(value)} Terawatt hrs`;
        if (axis === "datacenter") return `${Math.round(value).toLocaleString()} km²`;
        return this.formatEcologyValue(axis, value);
    },

    goalLevel(score) {
        return Math.max(1, Math.min(5,
            Math.round(((score - this.GOAL_MIN) / (this.GOAL_MAX - this.GOAL_MIN)) * 4) + 1
        ));
    },

    formatGoalStatus(axis, score = this.get(axis)) {
        const level = this.goalLevel(score);
        return this.GOAL_STATUS_LABELS[axis]?.[level - 1] ?? String(score);
    },

    /** Peak-finder data label: "{Axis} is {glossary sprite state}" */
    formatPeakFinderLabel(objectId, score = null) {
        const config = VR_OBJECT_DECISIONS[objectId]?.marker;
        if (!config) return "";

        const axis = config.axis;
        const axisLabel = this.GOAL_HUD_LABELS[axis] || config.title;

        if (axis === "ecology" || objectId === "map") {
            const pct = this.getTotalEcologyPercent();
            let level = 1;
            if (pct >= 75) level = 4;
            else if (pct >= 50) level = 3;
            else if (pct >= 25) level = 2;
            const band = config.peakLabels?.[level - 1] || VR_SKY_STATE_LABELS[level] || "neutral";
            return `Ecology is ${band.toLowerCase()}`;
        }

        const value = score ?? this.get(axis);
        const level = this.goalLevel(value);
        const stateLabel = config.peakLabels?.[level - 1] || this.formatGoalStatus(axis, value);
        return `${axisLabel} is ${stateLabel.toLowerCase()}`;
    },

    formatEffectDelta(axis, delta) {
        if (!delta) return "0";
        if (this.isEcologyAxis(axis)) {
            const sign = delta > 0 ? "+" : "";
            if (axis === "co2") return `${sign}${(delta / 1e6).toFixed(1)}M t`;
            if (axis === "water") return `${sign}${(delta / 1e12).toFixed(2)}T L`;
            if (axis === "electricity") return `${sign}${delta} TWh`;
            if (axis === "datacenter") return `${sign}${delta.toLocaleString()} km²`;
        }
        const sign = delta > 0 ? "+" : "";
        return `${sign}${delta}`;
    },

    applyEffects(effects) {
        const changes = {};
        for (const [axis, delta] of Object.entries(effects || {})) {
            if (!(axis in this.scores)) continue;
            if (delta === 0) continue;
            const previous = this.scores[axis];
            this.scores[axis] = this.clamp(axis, previous + delta);
            if (previous !== this.scores[axis]) {
                changes[axis] = { from: previous, to: this.scores[axis] };
            }
        }
        this._emit(changes);
        return changes;
    },

    parseMatrixEffects(text) {
        const effects = {};
        if (!text) return effects;
        const pattern = /([A-Za-z0-9 ()]+?)\s*<\s*([+-]?[\d,]+)\s*>/g;
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const key = this.MATRIX_AXIS_MAP[match[1].trim()];
            const delta = parseInt(match[2].replace(/,/g, ""), 10);
            if (key && !Number.isNaN(delta) && delta !== 0) {
                effects[key] = (effects[key] || 0) + delta;
            }
        }
        return effects;
    },

    applyTerritoryAllocation() {
        const changes = {};
        for (const axis of this.ECOLOGY_AXES) {
            const previous = this.scores[axis];
            this.scores[axis] = this.ECOLOGY_PRESENT[axis];
            if (previous !== this.scores[axis]) {
                changes[axis] = { from: previous, to: this.scores[axis] };
            }
        }
        for (const axis of [...this.GOAL_AXES, ...this.INTEGRITY_AXES]) {
            const previous = this.scores[axis];
            this.scores[axis] = 0;
            if (previous !== this.scores[axis]) {
                changes[axis] = { from: previous, to: this.scores[axis] };
            }
        }
        this._emit(changes);
    },

    _listeners: [],

    onChange(callback) {
        this._listeners.push(callback);
    },

    _emit(changes) {
        const detail = { scores: { ...this.scores }, changes };
        this._listeners.forEach((cb) => cb(detail));
        document.dispatchEvent(new CustomEvent("score-changed", { detail }));
    },

    reset(territoryId = null) {
        this.scores = this._defaultScores();
        if (territoryId) this.applyTerritoryAllocation();
        const changes = {};
        for (const axis of this.ALL_AXES) {
            changes[axis] = { from: null, to: this.scores[axis] };
        }
        this._emit(changes);
    }
};

ScoreSystem.init();
