/**
 * Audio playback via VR_DATABASE (database.js).
 * Falls back to synthesized tones when audio files are missing.
 * Background music loops independently from one-shot SFX.
 */
const AudioManager = {
    currentAudio: null,
    backgroundAudio: null,
    backgroundMusicId: "background_music",
    backgroundVolume: 0.35,

    _fallbackDurations: {
        decision_no_more: 2000,
        game_end: 3000,
        game_win: 2500,
        audio_alarm_clock: 2000,
        decision_yes_chime: 600,
        decision_no_chime: 600,
        audio_cat_purr: 3000,
        audio_bell_jingle: 2500,
        obj_map: 3000,
        obj_screen: 2500,
        obj_scale: 3000,
        obj_compute_box: 2500,
        obj_mirror: 3000,
        stage_inclusive: 5000,
        stage_decision: 4000,
        territory_big_tech: 4000,
        territory_the_state: 4000,
        territory_the_multitude: 4000,
        diff_big_tech_win: 2500,
        diff_the_state_win: 2500,
        diff_the_multitude_win: 2500,
        diff_ecology_loss: 3000,
        diff_zero_point: 2000
    },

    play(id) {
        this.playAndWait(id).catch(() => {});
    },

    playAndWait(id) {
        return new Promise((resolve) => {
            if (typeof VR_DATABASE === "undefined" || !VR_DATABASE[id]) {
                console.warn(`AudioManager: unknown id "${id}"`);
                resolve();
                return;
            }
            const entry = VR_DATABASE[id];
            if (entry.type !== "audio") {
                resolve();
                return;
            }

            this.stop();

            const audio = new Audio(entry.src);
            audio.volume = 0.8;
            this.currentAudio = audio;

            const finish = () => {
                if (this.currentAudio === audio) this.currentAudio = null;
                if (this._currentFinish === finish) this._currentFinish = null;
                resolve();
            };
            this._currentFinish = finish;

            audio.addEventListener("ended", finish);
            audio.play().catch(() => {
                this._playFallbackTone(id, entry);
                setTimeout(finish, this._fallbackDurations[id] || 800);
            });
        });
    },

    startBackgroundMusic(id = this.backgroundMusicId) {
        const entry = VR_DATABASE?.[id];
        if (!entry || entry.type !== "audio") {
            console.warn(`AudioManager: unknown background id "${id}"`);
            return;
        }

        if (this.backgroundAudio && !this.backgroundAudio.paused) return;

        if (!this.backgroundAudio) {
            this.backgroundAudio = new Audio(entry.src);
            this.backgroundAudio.loop = true;
            this.backgroundAudio.volume = this.backgroundVolume;
        }

        this.backgroundAudio.play().catch(() => {
            this._bindBackgroundUnlock();
        });
    },

    stopBackgroundMusic() {
        if (!this.backgroundAudio) return;
        this.backgroundAudio.pause();
        this.backgroundAudio.currentTime = 0;
    },

    _bindBackgroundUnlock() {
        if (this._backgroundUnlockBound) return;
        this._backgroundUnlockBound = true;

        const unlock = () => {
            if (this.backgroundAudio?.paused) {
                this.backgroundAudio.play().catch(() => {});
            }
            document.removeEventListener("click", unlock);
            document.removeEventListener("keydown", unlock);
            this._backgroundUnlockBound = false;
        };

        document.addEventListener("click", unlock, { once: true });
        document.addEventListener("keydown", unlock, { once: true });
    },

    playForScoreAxis(axis, tier) {
        const key = `score_${axis}_${tier}`;
        if (VR_DATABASE[key]) {
            this.play(key);
        }
    },

    playDecisionResponse(yes) {
        this.play(yes ? "decision_yes_chime" : "decision_no_chime");
    },

    playNoMoreDecisions() {
        this.play("decision_no_more");
    },

    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        if (this._currentFinish) {
            const finish = this._currentFinish;
            this._currentFinish = null;
            finish();
        }
    },

    _playFallbackTone(id, entry) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const freqs = {
                decision_yes_chime: 660,
                decision_no_chime: 330,
                decision_no_more: 280,
                game_end: 196,
                audio_alarm_clock: 330,
                obj_map: 360,
                obj_screen: 370,
                obj_scale: 330,
                obj_compute_box: 420,
                obj_mirror: 415,
                audio_cat_purr: 392,
                audio_bell_jingle: 523,
                score_co2_1: 220,
                score_co2_3: 330,
                score_co2_6: 440,
                score_water_1: 247,
                score_water_3: 370,
                score_water_6: 494
            };

            const duration = (this._fallbackDurations[id] || 800) / 1000;
            osc.frequency.value = freqs[id] || 440;
            if (id === "decision_no_more") {
                osc.type = "triangle";
            } else if (id.startsWith("obj_")) {
                osc.type = "sine";
            } else {
                osc.type = id.includes("decision_no") ? "sawtooth" : "sine";
            }
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn("AudioManager fallback failed:", entry.title);
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    AudioManager.startBackgroundMusic();
});
