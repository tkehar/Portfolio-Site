/* --- database.js ---
 * Central lookup for audio clips and per-object metadata.
 * Yes/no decision sets live under each entry in VR_TERRITORIES.decisions.
 *
 * `marker` = peak-finder style data label shown when the object enters
 * the HUD focus zone. `values` is indexed by score level of `axis`.
 *
 * `states` = sprite artwork per score band derived from the object's `scoreAxis`.
 * New image paths must also be preloaded in <a-assets> in index.html.
 *
 * Data Objects follow the Game Glossary (5 interactable types).
 * Decisions are imported from docs/Decision_Matrix_v10.csv via
 * scripts/import-decision-matrix-v10.py — grouped by territory and object.
 */

/** Map sprite — driven by total ecology % toward 2030 (4 states). */
const VR_MAP_STATE_IMAGES = {
    1: "assets/placeholders/Map_Visualization-1.png",
    2: "assets/placeholders/Map_Visualization-2.png",
    3: "assets/placeholders/Map_Visualization-3.png",
    4: "assets/placeholders/Map_Visualization-4-.png"
};

/** Identity sprite (Mirror) — 5 states per Game Glossary. */
const VR_MIRROR_STATE_IMAGES = {
    1: "assets/placeholders/Mirror_1.png",
    2: "assets/placeholders/Mirror_2.png",
    3: "assets/placeholders/Mirror_3.png",
    4: "assets/placeholders/Mirror_4.png",
    5: "assets/placeholders/Mirror_5.png"
};

/** Power sprite (Scale) — 5 states per Game Glossary. */
const VR_POWER_STATE_IMAGES = {
    1: "assets/placeholders/Power-1.png",
    2: "assets/placeholders/Power-2.png",
    3: "assets/placeholders/Power-3.png",
    4: "assets/placeholders/Power-4.png",
    5: "assets/placeholders/Power-5.png"
};

/** Sovereignty sprite (Screen) — 5 states per Game Glossary. */
const VR_SCREEN_STATE_IMAGES = {
    1: "assets/placeholders/Surveillance-1.png",
    2: "assets/placeholders/Surveillance-2.png",
    3: "assets/placeholders/Surveillance-3.png",
    4: "assets/placeholders/Surveillance-4.png",
    5: "assets/placeholders/Surveillance-5.png"
};

/** Transparency sprite (Compute box) — 5 states per Game Glossary. */
const VR_TRANSPARENCY_STATE_IMAGES = {
    1: "assets/placeholders/Black_Box-1.png",
    2: "assets/placeholders/Black_Box-2.png",
    3: "assets/placeholders/Black_Box-3.png",
    4: "assets/placeholders/Black_Box-4.png",
    5: "assets/placeholders/Black_Box-5.png"
};

/** Sky background — static territory grid for all ecology levels. */
const VR_SKY_STATE_IMAGES = {
    1: "assets/placeholders/Territory Grid.png",
    2: "assets/placeholders/Territory Grid.png",
    3: "assets/placeholders/Territory Grid.png",
    4: "assets/placeholders/Territory Grid.png"
};

const VR_OBJECT_DECISIONS = {

    map: {
        objectId: "map",
        scoreAxis: "ecology",
        audioOnResolve: "obj_map",
        states: VR_MAP_STATE_IMAGES,
        marker: {
            title: "Map",
            axis: "ecology",
            unit: "% to 2030",
            values: [0, 25, 50, 75]
        }
    },

    mirror: {
        objectId: "mirror",
        scoreAxis: "identity",
        audioOnResolve: "obj_mirror",
        states: VR_MIRROR_STATE_IMAGES,
        marker: {
            title: "Mirror",
            axis: "identity",
            unit: "identity index",
            values: [-6, -3, 0, 3, 6]
        }
    },

    scale: {
        objectId: "scale",
        scoreAxis: "power",
        audioOnResolve: "obj_scale",
        states: VR_POWER_STATE_IMAGES,
        marker: {
            title: "Scale",
            axis: "power",
            unit: "leverage index",
            values: [-6, -3, 0, 3, 6]
        }
    },

    screen: {
        objectId: "screen",
        scoreAxis: "sovereignty",
        audioOnResolve: "obj_screen",
        states: VR_SCREEN_STATE_IMAGES,
        marker: {
            title: "Screen",
            axis: "sovereignty",
            unit: "autonomy index",
            values: [-6, -3, 0, 3, 6]
        }
    },

    compute_box: {
        objectId: "compute_box",
        scoreAxis: "transparency",
        audioOnResolve: "obj_compute_box",
        states: VR_TRANSPARENCY_STATE_IMAGES,
        marker: {
            title: "Compute box",
            axis: "transparency",
            unit: "opacity index",
            values: [-6, -3, 0, 3, 6]
        }
    }
};

const VR_DATABASE = {

    /* --- Score-tier ambient audio (plays when a score crosses a threshold) --- */
    score_co2_1: {
        type: "audio",
        category: "score-tier",
        scoreAxis: "co2",
        tier: 1,
        title: "CO2 Emissions — Lowest",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder — ambient tone when CO2 nears 2030 projection." }
    },
    score_co2_3: {
        type: "audio",
        category: "score-tier",
        scoreAxis: "co2",
        tier: 3,
        title: "CO2 Emissions — Balanced",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder — ambient tone when CO2 nears 2030 projection." }
    },
    score_co2_6: {
        type: "audio",
        category: "score-tier",
        scoreAxis: "co2",
        tier: 6,
        title: "CO2 Emissions — Peak",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder — ambient tone when CO2 nears 2030 projection." }
    },
    score_water_1: {
        type: "audio",
        category: "score-tier",
        scoreAxis: "water",
        tier: 1,
        title: "Water Usage — Lowest",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder — ambient tone when Water nears 2030 projection." }
    },
    score_water_3: {
        type: "audio",
        category: "score-tier",
        scoreAxis: "water",
        tier: 3,
        title: "Water Usage — Balanced",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder — ambient tone when Water nears 2030 projection." }
    },
    score_water_6: {
        type: "audio",
        category: "score-tier",
        scoreAxis: "water",
        tier: 6,
        title: "Water Usage — Peak",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder — ambient tone when Water nears 2030 projection." }
    },

    /* --- Decision response audio (plays after yes/no choice) --- */
    decision_yes_chime: {
        type: "audio",
        category: "decision",
        title: "Affirmative",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Plays when the viewer chooses Yes." }
    },
    decision_no_chime: {
        type: "audio",
        category: "decision",
        title: "Declined",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Plays when the viewer chooses No." }
    },
    decision_no_more: {
        type: "audio",
        category: "decision",
        title: "No More Decisions",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Plays when all decisions for an object have been made." }
    },

    /* --- Game end audio (plays once when any ecology axis reaches 2030 projection) --- */
    game_end: {
        type: "audio",
        category: "game",
        title: "Game End",
        src: "assets/audio/Alarm Clock.mp3",
        meta: { description: "Placeholder — plays when any ecology axis reaches 2030 projection." }
    },

    /* --- Victory audio (plays when territory goal thresholds are all met) --- */
    game_win: {
        type: "audio",
        category: "game",
        title: "Victory",
        src: "assets/audio/Small Bell Jingle.mp3",
        meta: { description: "Plays once when all territory goal thresholds are met." }
    },

    /* --- Looping background music --- */
    background_music: {
        type: "audio",
        category: "ambient",
        title: "Outer Space",
        src: "assets/audio/Outer Space .mp3",
        meta: { description: "Standard looping background music." }
    },

    /* --- Stage audio (Game Glossary) --- */
    stage_inclusive: {
        type: "audio",
        category: "stage",
        title: "Inclusive Stage",
        src: "assets/audio/Inclusive Stage.mp3",
        meta: { description: "Plays when the player enters the environment (Inclusive Stage)." }
    },
    stage_decision: {
        type: "audio",
        category: "stage",
        title: "Decision Audio",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder — decision-stage ambient audio." }
    },
    territory_big_tech: {
        type: "audio",
        category: "territory",
        territoryId: "big_tech",
        title: "Big Tech Territory",
        src: "assets/audio/Big Tech Intro.mp3",
        meta: { description: "Placeholder — territory intro audio for Big Tech." }
    },
    territory_the_state: {
        type: "audio",
        category: "territory",
        territoryId: "the_state",
        title: "The State Territory",
        src: "assets/audio/The State Intro.mp3",
        meta: { description: "Placeholder — territory intro audio for The State." }
    },
    territory_the_multitude: {
        type: "audio",
        category: "territory",
        territoryId: "the_multitude",
        title: "The Multitude Territory",
        src: "assets/audio/The Multitude Intro.mp3",
        meta: { description: "Placeholder — territory intro audio for The Multitude." }
    },
    diff_big_tech_win: {
        type: "audio",
        category: "differential",
        title: "Big Tech Win",
        src: "assets/audio/Small Bell Jingle.mp3",
        meta: { description: "Placeholder — differential stage audio for Big Tech win." }
    },
    diff_the_state_win: {
        type: "audio",
        category: "differential",
        title: "The State Win",
        src: "assets/audio/Small Bell Jingle.mp3",
        meta: { description: "Placeholder — differential stage audio for The State win." }
    },
    diff_the_multitude_win: {
        type: "audio",
        category: "differential",
        title: "The Multitude Win",
        src: "assets/audio/Small Bell Jingle.mp3",
        meta: { description: "Placeholder — differential stage audio for The Multitude win." }
    },
    diff_ecology_loss: {
        type: "audio",
        category: "differential",
        title: "Ecology Loss",
        src: "assets/audio/Alarm Clock.mp3",
        meta: { description: "Placeholder — differential stage audio for ecology loss." }
    },
    diff_zero_point: {
        type: "audio",
        category: "differential",
        title: "Zero Point",
        src: "assets/audio/Alarm Clock.mp3",
        meta: { description: "Placeholder — differential stage audio for zero point." }
    },

    /* --- Placeholder object narration audio --- */
    audio_cat_purr: {
        type: "audio",
        category: "object",
        title: "Cat Purr",
        src: "assets/audio/Cat Purr.mp3",
        meta: { description: "Placeholder narration — cat purr." }
    },
    audio_bell_jingle: {
        type: "audio",
        category: "object",
        title: "Small Bell Jingle",
        src: "assets/audio/Small Bell Jingle.mp3",
        meta: { description: "Placeholder narration — bell jingle." }
    },

    /* --- Object-specific audio (linked to interactable data objects) --- */
    obj_map: {
        type: "audio",
        category: "object",
        objectId: "map",
        title: "Map",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder narration — Map object." }
    },
    obj_screen: {
        type: "audio",
        category: "object",
        objectId: "screen",
        title: "Screen",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder narration — Screen object." }
    },
    obj_scale: {
        type: "audio",
        category: "object",
        objectId: "scale",
        title: "Scale",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder narration — Scale object." }
    },
    obj_compute_box: {
        type: "audio",
        category: "object",
        objectId: "compute_box",
        title: "Compute box",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder narration — Compute box object." }
    },
    obj_mirror: {
        type: "audio",
        category: "object",
        objectId: "mirror",
        title: "Mirror",
        src: "assets/audio/Decision Audio.mp3",
        meta: { description: "Placeholder narration — Mirror object." }
    }
};

/* --- Territory definitions ---
 * Customize per-territory marker labels, decision prompts, view setup, and onboarding.
 * `markers[objectId]` overrides VR_OBJECT_DECISIONS[objectId].marker when active.
 * `decisions[objectId]` supplies territory-specific yes/no prompts and score impacts.
 * `view` is applied on confirm (before onboarding).
 * `onboarding.steps` is a multi-step modal shown after confirm. */

/** Per-territory yes/no decision sets (5–6 per object). */
const VR_TERRITORY_OBJECT_DECISIONS = {

    big_tech: {
        map: [
            {
                id: "map_1",
                question: "Buy up a huge stockpile of computer chips before competitors can get them?",
                yesEffect: { co2: 29000000, electricity: 60, water: 900000000000 },
                noEffect: { co2: 21000000 }
            },
            {
                id: "map_2",
                question: "Buy all your chips from just one supplier?",
                yesEffect: { co2: 29000000, electricity: 60, water: 900000000000 },
                noEffect: { co2: 21000000 }
            },
            {
                id: "map_3",
                question: "Take over more land in mineral-rich regions to build data centers?",
                yesEffect: { co2: 21000000, datacenter: 2400 },
                noEffect: { co2: 21000000 }
            },
            {
                id: "map_4",
                question: "Skip recycling rules to get the next AI model out faster?",
                yesEffect: { co2: 29000000, electricity: 60, water: 900000000000 },
                noEffect: { co2: 21000000 }
            },
            {
                id: "map_5",
                question: "Hoard rare materials before new export laws take effect?",
                yesEffect: { co2: 29000000, electricity: 60, water: 900000000000 },
                noEffect: { co2: 21000000 }
            },
            {
                id: "map_6",
                question: "Fund research into chips that need fewer rare-earth materials?",
                yesEffect: { co2: 21000000 },
                noEffect: { co2: 29000000, electricity: 60, water: 900000000000 }
            }
        ],
        screen: [
            {
                id: "screen_1",
                question: "Design your product to make it hard for users to leave for a rival?",
                yesEffect: { co2: 21000000, power: -1, sovereignty: -1 },
                noEffect: { co2: 21000000, sovereignty: 1 }
            },
            {
                id: "screen_2",
                question: "Launch a flashy new AI feature before safety checks are finished?",
                yesEffect: { co2: 21000000, sovereignty: -2 },
                noEffect: { co2: 21000000, sovereignty: 1 }
            },
            {
                id: "screen_3",
                question: "Delay a big launch if the test results look shaky?",
                yesEffect: { co2: 21000000, sovereignty: 1 },
                noEffect: { co2: 21000000, sovereignty: -1 }
            },
            {
                id: "screen_4",
                question: "Push out an update without checking reports of harm it could cause?",
                yesEffect: { co2: 21000000, sovereignty: -2 },
                noEffect: { co2: 21000000, sovereignty: 1 }
            }
        ],
        mirror: [
            {
                id: "mirror_1",
                question: "Wait to reveal how much pollution your AI created until after launch?",
                yesEffect: { co2: 21000000, identity: -1 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_2",
                question: "Use AI to make feeds more addictive so people scroll longer?",
                yesEffect: { co2: 21000000, identity: -2 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_3",
                question: "Have voice assistants secretly listen for brand names?",
                yesEffect: { co2: 21000000, identity: -1 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_4",
                question: "Hide AI mistakes if admitting them might make users leave?",
                yesEffect: { co2: 21000000, identity: -1 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_5",
                question: "Slow down every launch just to dodge bad press?",
                yesEffect: { co2: 21000000, identity: -1 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_6",
                question: "Use people's personal data to personalize AI, without asking first?",
                yesEffect: { co2: 21000000, identity: -2 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_7",
                question: "Publish a truthful report on your AI's biases?",
                yesEffect: { co2: 21000000, identity: 1 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_8",
                question: "Hide bad performance numbers from the public?",
                yesEffect: { co2: 21000000, identity: -1 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_9",
                question: "Show users a flattering AI-generated version of themselves to keep them hooked?",
                yesEffect: { co2: 21000000, identity: -2 },
                noEffect: { co2: 21000000, identity: 1 }
            }
        ],
        compute_box: [
            {
                id: "compute_box_1",
                question: "Use people's phones and laptops overnight to train your AI, without asking?",
                yesEffect: { co2: 33000000, electricity: 40, transparency: -2, water: 700000000000 },
                noEffect: { co2: 21000000, transparency: 1 }
            },
            {
                id: "compute_box_2",
                question: "Give spare computing power to smaller AI startups?",
                yesEffect: { co2: 21000000, transparency: 1 },
                noEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 }
            },
            {
                id: "compute_box_3",
                question: "Publish an honest report on whether your materials come from conflict zones?",
                yesEffect: { co2: 21000000, transparency: 1 },
                noEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 }
            },
            {
                id: "compute_box_4",
                question: "Tell regulators when you notice your AI being misused in new ways?",
                yesEffect: { co2: 21000000, transparency: 1 },
                noEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 }
            }
        ],
        scale: [
            {
                id: "scale_1",
                question: "Make your own AI better, even if it can't work with other companies' systems?",
                yesEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 },
                noEffect: { co2: 21000000, power: 1 }
            },
            {
                id: "scale_2",
                question: "Lock the best AI models behind a paid subscription?",
                yesEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 },
                noEffect: { co2: 21000000, power: 1 }
            },
            {
                id: "scale_3",
                question: "Require outside developers to get your approval before building add-ons?",
                yesEffect: { co2: 33000000, electricity: 40, power: -1, sovereignty: -1, water: 700000000000 },
                noEffect: { co2: 21000000, power: 1 }
            },
            {
                id: "scale_4",
                question: "Keep your tools open so outside developers can easily build on them?",
                yesEffect: { co2: 21000000, power: 1 },
                noEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 }
            },
            {
                id: "scale_5",
                question: "Only compare your AI to rivals' closed systems, ignoring open ones?",
                yesEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 },
                noEffect: { co2: 21000000, power: 1 }
            }
        ]
    },

    the_state: {
        map: [
            {
                id: "map_1",
                question: "Mandate renewable energy for all government AI datacenters?",
                yesEffect: { co2: 21000000 },
                noEffect: { co2: 21000000, electricity: 180 }
            },
            {
                id: "map_2",
                question: "Forgive a defense contractor that exceeded AI emissions limits?",
                yesEffect: { co2: 21000000, datacenter: 1200 },
                noEffect: { co2: 21000000 }
            },
            {
                id: "map_3",
                question: "Approve new mining permits to secure critical mineral supply?",
                yesEffect: { co2: 29000000, electricity: 60, water: 900000000000 },
                noEffect: { co2: 21000000 }
            },
            {
                id: "map_4",
                question: "Waive environmental reviews when intelligence models are at stake?",
                yesEffect: { co2: 21000000, datacenter: 2400 },
                noEffect: { co2: 21000000 }
            },
            {
                id: "map_5",
                question: "Declare strategic mineral stockpiles for national AI reserves?",
                yesEffect: { co2: 29000000, electricity: 60, water: 900000000000 },
                noEffect: { co2: 21000000 }
            },
            {
                id: "map_6",
                question: "Commission a study on land use before the datacenter era?",
                yesEffect: { co2: 21000000 },
                noEffect: { co2: 21000000, datacenter: 1200 }
            }
        ],
        screen: [
            {
                id: "screen_1",
                question: "Prioritize national compute sovereignty over climate targets?",
                yesEffect: { co2: 21000000, sovereignty: -2 },
                noEffect: { co2: 21000000, sovereignty: 1 }
            },
            {
                id: "screen_2",
                question: "Investigate foreign-owned cloud hardware operating in our borders?",
                yesEffect: { co2: 21000000, sovereignty: -1 },
                noEffect: { co2: 21000000, sovereignty: 1 }
            },
            {
                id: "screen_3",
                question: "Deploy autonomous surveillance over protest zones?",
                yesEffect: { co2: 21000000, power: -1, sovereignty: -2 },
                noEffect: { co2: 21000000, sovereignty: 1 }
            },
            {
                id: "screen_4",
                question: "Require judicial warrants before model access to citizen data?",
                yesEffect: { co2: 21000000, sovereignty: 1 },
                noEffect: { co2: 21000000, sovereignty: -1 }
            },
            {
                id: "screen_5",
                question: "Turn back when civil-liberty impact looks too severe?",
                yesEffect: { co2: 21000000, sovereignty: 1 },
                noEffect: { co2: 21000000, sovereignty: -1 }
            }
        ],
        mirror: [
            {
                id: "mirror_1",
                question: "Stay silent on AI energy costs to avoid public panic?",
                yesEffect: { co2: 21000000, identity: -1 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_2",
                question: "Stay quiet to avoid conflict with intelligence agencies?",
                yesEffect: { co2: 21000000, identity: -1 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_3",
                question: "Compare our civic AI readiness to rival nations?",
                yesEffect: { co2: 21000000, identity: -1 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_4",
                question: "Acknowledge algorithmic flaws in public benefits systems?",
                yesEffect: { co2: 21000000, identity: 1 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_5",
                question: "Avoid publishing how surveillance models reflect on citizens?",
                yesEffect: { co2: 21000000, identity: -1 },
                noEffect: { co2: 21000000, identity: 1 }
            },
            {
                id: "mirror_6",
                question: "Show a reassuring public face on AI governance progress?",
                yesEffect: { co2: 21000000, identity: -1 },
                noEffect: { co2: 21000000, identity: 1 }
            }
        ],
        compute_box: [
            {
                id: "compute_box_1",
                question: "Fund public compute pools for accredited researchers?",
                yesEffect: { co2: 21000000, transparency: 1 },
                noEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 }
            },
            {
                id: "compute_box_2",
                question: "Broadcast AI safety alerts even when the public isn't listening?",
                yesEffect: { co2: 21000000, transparency: 1 },
                noEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 }
            },
            {
                id: "compute_box_3",
                question: "Warn citizens when foreign models show election interference risk?",
                yesEffect: { co2: 21000000, transparency: 1 },
                noEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 }
            },
            {
                id: "compute_box_4",
                question: "Enact a new AI mandate without reviewing dissenting briefs?",
                yesEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 },
                noEffect: { co2: 21000000, transparency: 1 }
            },
            {
                id: "compute_box_5",
                question: "Accept full transparency in public AI impact assessments?",
                yesEffect: { co2: 21000000, transparency: 1 },
                noEffect: { co2: 33000000, electricity: 40, transparency: -2, water: 700000000000 }
            }
        ],
        scale: [
            {
                id: "scale_1",
                question: "Share excess training capacity with allied nations?",
                yesEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 },
                noEffect: { co2: 21000000, power: 1 }
            },
            {
                id: "scale_2",
                question: "Require domestic chip fabrication for sensitive AI workloads?",
                yesEffect: { co2: 33000000, electricity: 40, power: -1, sovereignty: -1, water: 700000000000 },
                noEffect: { co2: 21000000, power: 1 }
            },
            {
                id: "scale_3",
                question: "Require licensing before public-facing generative AI can launch?",
                yesEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 },
                noEffect: { co2: 21000000, power: 1 }
            },
            {
                id: "scale_4",
                question: "Deploy classified AI systems without public consultation?",
                yesEffect: { co2: 45000000, electricity: 80, power: -2, water: 1400000000000 },
                noEffect: { co2: 21000000, power: 1 }
            },
            {
                id: "scale_5",
                question: "Limit procurement doors to vetted domestic AI vendors?",
                yesEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 },
                noEffect: { co2: 21000000, power: 1 }
            },
            {
                id: "scale_6",
                question: "Hesitate at every regulatory threshold before signing off?",
                yesEffect: { co2: 21000000, power: 1 },
                noEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 }
            }
        ]
    },

    the_multitude: {
        map: [
            {
                id: "map_1",
                question: "Stay silent on energy overuse to keep the collective at peace?",
                yesEffect: { co2: 21000000, electricity: 90 },
                noEffect: { co2: 21000000, electricity: 27 }
            },
            {
                id: "map_2",
                question: "Prioritize our comfort over the commons' shared energy budget?",
                yesEffect: { co2: 21000000, electricity: 90 },
                noEffect: { co2: 21000000, electricity: 27 }
            },
            {
                id: "map_3",
                question: "Federate our models across co-op nodes instead of one central server?",
                yesEffect: { co2: 21000000, datacenter: 720, sovereignty: 1 },
                noEffect: { co2: 21000000, datacenter: 2400 }
            },
            {
                id: "map_4",
                question: "Ignore e-waste from donated GPUs when build velocity matters?",
                yesEffect: { co2: 29000000, electricity: 60, water: 900000000000 },
                noEffect: { co2: 23400000, electricity: 18, water: 270000000000 }
            }
        ],
        screen: [
            {
                id: "screen_1",
                question: "Stock spare GPUs and boards as communal hardware reserves?",
                yesEffect: { co2: 21000000, sovereignty: 1 },
                noEffect: { co2: 21000000, sovereignty: -1 }
            },
            {
                id: "screen_2",
                question: "Change course if you're heading toward one company controlling everything?",
                yesEffect: { co2: 21000000, sovereignty: 2 },
                noEffect: { co2: 21000000, sovereignty: -1 }
            }
        ],
        mirror: [
            {
                id: "mirror_1",
                question: "Forgive a member who leaked proprietary training logs to the collective?",
                yesEffect: { co2: 21000000, identity: 1 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_2",
                question: "Reach out to isolated contributors who stopped their training runs?",
                yesEffect: { co2: 21000000, identity: 1 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_3",
                question: "Speak up when a model harms a marginalized group in our network?",
                yesEffect: { co2: 21000000, identity: 2 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_4",
                question: "Ask consent before adding community data to the training corpus?",
                yesEffect: { co2: 21000000, identity: 1 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_5",
                question: "Fully commit to a strike or boycott against harmful AI companies?",
                yesEffect: { co2: 21000000, identity: 2 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_6",
                question: "Admit that your own community-trained AI has biases too?",
                yesEffect: { co2: 21000000, identity: 1 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_7",
                question: "Compare your project to AI funded by billionaires and kept closed?",
                yesEffect: { co2: 21000000, identity: 1 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_8",
                question: "Admit when your AI reflects the majority's prejudices?",
                yesEffect: { co2: 21000000, identity: 1 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_9",
                question: "Examine whether your training data was built on exploited labor?",
                yesEffect: { co2: 21000000, identity: 1 },
                noEffect: { co2: 21000000, identity: -1 }
            },
            {
                id: "mirror_10",
                question: "Publicly celebrate and credit the people who contributed?",
                yesEffect: { co2: 21000000, identity: 1 },
                noEffect: { co2: 21000000, identity: -1 }
            }
        ],
        compute_box: [
            {
                id: "compute_box_1",
                question: "Open our community GPU pool to neighbors who can't afford compute?",
                yesEffect: { co2: 24600000, electricity: 12, transparency: 2, water: 210000000000 },
                noEffect: { co2: 33000000, electricity: 40, transparency: -1, water: 700000000000 }
            },
            {
                id: "compute_box_2",
                question: "Offer mutual-aid compute to struggling contributors without being asked?",
                yesEffect: { co2: 22800000, electricity: 6, transparency: 1, water: 105000000000 },
                noEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 }
            },
            {
                id: "compute_box_3",
                question: "Document how local hardware supply chains actually work?",
                yesEffect: { co2: 22800000, electricity: 6, transparency: 1, water: 105000000000 },
                noEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 }
            },
            {
                id: "compute_box_4",
                question: "Ask how scraped data became training material we don't control?",
                yesEffect: { co2: 22800000, electricity: 6, transparency: 1, water: 105000000000 },
                noEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 }
            },
            {
                id: "compute_box_5",
                question: "Stay quiet to avoid conflict with platform moderators?",
                yesEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 },
                noEffect: { co2: 22800000, electricity: 6, transparency: 1, water: 105000000000 }
            },
            {
                id: "compute_box_6",
                question: "Broadcast our values even when megacorp feeds bury the message?",
                yesEffect: { co2: 22800000, electricity: 6, transparency: 1, water: 105000000000 },
                noEffect: { co2: 27000000, electricity: 20, transparency: -1, water: 350000000000 }
            }
        ],
        scale: [
            {
                id: "scale_1",
                question: "Imagine what shared knowledge looked like before closed models?",
                yesEffect: { co2: 24600000, electricity: 12, power: 1, water: 210000000000 },
                noEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 }
            },
            {
                id: "scale_2",
                question: "Take flight toward an unproven open-weight architecture?",
                yesEffect: { co2: 24600000, electricity: 12, power: 1, water: 210000000000 },
                noEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 }
            },
            {
                id: "scale_3",
                question: "Warn the network when corporate models show union-busting patterns?",
                yesEffect: { co2: 24600000, electricity: 12, power: 1, water: 210000000000 },
                noEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 }
            },
            {
                id: "scale_4",
                question: "Commit fully to releasing an open AI model?",
                yesEffect: { co2: 28200000, electricity: 24, power: 2, water: 420000000000 },
                noEffect: { co2: 45000000, electricity: 80, power: -1, water: 1400000000000 }
            },
            {
                id: "scale_5",
                question: "Keep your code open for anyone to copy and remix?",
                yesEffect: { co2: 28200000, electricity: 24, power: 2, water: 420000000000 },
                noEffect: { co2: 45000000, electricity: 80, power: -1, water: 1400000000000 }
            },
            {
                id: "scale_6",
                question: "Hesitate at every collective vote on deployment?",
                yesEffect: { co2: 33000000, electricity: 40, power: -1, water: 700000000000 },
                noEffect: { co2: 24600000, electricity: 12, power: 1, water: 210000000000 }
            }
        ]
    }
};

const VR_TERRITORIES = {

    big_tech: {
        id: "big_tech",
        displayName: "Big Tech",
        tagline: "Develop. Optimize. Scale.",
        accent: "#66aaff",
        goalText: "Win by driving sovereignty, power, identity, and transparency to extractive lows (≤ −4 / −4 / −3 / −4) before any ecology axis reaches its 2030 projection.",
        winThresholds: {
            sovereignty: { max: -4 },
            power: { max: -4 },
            identity: { max: -3 },
            transparency: { max: -4 }
        },
        decisions: VR_TERRITORY_OBJECT_DECISIONS.big_tech,
        view: {
            sky: "assets/placeholders/Territory Grid.png",
            rigPosition: "0 1.6 0",
            rigRotation: "0 -15 0"
        },
        onboarding: {
            steps: [
                {
                    title: "Welcome, Operator",
                    body: "You see the world through engagement metrics and growth curves. Every object is a data point waiting to be optimized.",
                    audioId: null
                },
                {
                    title: "Peak Finder Active",
                    body: "Center objects in the focus frame to read live KPIs. Your decisions will shift conversion, retention, and resource burn.",
                    audioId: null
                }
            ]
        },
        markers: {}
    },

    the_state: {
        id: "the_state",
        displayName: "The State",
        tagline: "Regulate. Race. Scale.",
        accent: "#88cc88",
        goalText: "Win by driving sovereignty, power, identity, and transparency to state-corporate lows (≤ −5 / −5 / −4 / −1) before any ecology axis reaches its 2030 projection.",
        winThresholds: {
            sovereignty: { max: -5 },
            power: { max: -5 },
            identity: { max: -4 },
            transparency: { max: -1 }
        },
        decisions: VR_TERRITORY_OBJECT_DECISIONS.the_state,
        view: {
            sky: "assets/placeholders/Territory Grid.png",
            rigPosition: "0 1.6 2",
            rigRotation: "0 0 0"
        },
        onboarding: {
            steps: [
                {
                    title: "Public Mandate",
                    body: "You assess the environment through regulation, compliance thresholds, and civic impact. Every reading carries legal weight.",
                    audioId: null
                },
                {
                    title: "Oversight Protocol",
                    body: "Use the Peak Finder to inspect permitted resource levels. Decisions are logged and may trigger public consequence.",
                    audioId: null
                }
            ]
        },
        markers: {}
    },

    the_multitude: {
        id: "the_multitude",
        displayName: "The Multitude",
        tagline: "Resist. Share. Organize.",
        accent: "#ff8866",
        goalText: "Win by raising sovereignty, power, identity, and transparency to community-led highs (≥ 4 / 3 / 3 / 4) before any ecology axis reaches its 2030 projection.",
        winThresholds: {
            sovereignty: { min: 4 },
            power: { min: 3 },
            identity: { min: 3 },
            transparency: { min: 4 }
        },
        decisions: VR_TERRITORY_OBJECT_DECISIONS.the_multitude,
        view: {
            sky: "assets/placeholders/Territory Grid.png",
            rigPosition: "0 1.6 -1",
            rigRotation: "0 20 0"
        },
        onboarding: {
            steps: [
                {
                    title: "Collective Lens",
                    body: "You see shared struggle and community power. Objects reveal how collective action shifts the commons.",
                    audioId: null
                },
                {
                    title: "Common Ground",
                    body: "Drag to look around. Click sprites to make choices together. The Peak Finder shows what the crowd is measuring.",
                    audioId: null
                }
            ]
        },
        markers: {}
    }
};
