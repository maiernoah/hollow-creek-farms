// ==========================================
// HOLLOW CREEK - A Cozy Mystery Game
// "The truth, like a body, always surfaces."
// ==========================================

// Game State
const gameState = {
    day: 1,
    timeOfDay: 'morning',
    actionsRemaining: 4,
    coins: 30,
    energy: 100,
    threatLevel: 0,
    selectedSeed: null,
    currentVillager: null,
    currentLocation: 'farm',
    accusationMade: false,
    gameOver: false,
    killer: null,
    accomplice: null, // The killer always has help

    // The victim - your uncle
    unclesName: 'Thomas Ashworth',

    // The deeper mystery - your grandfather
    grandfathersName: 'Ezekiel Ashworth',
    grandfatherDisappeared: 1987, // 39 years ago

    // Your character's motivation
    playerMotivation: 'find_truth', // What drives the investigation

    // Inventory
    inventory: {
        seeds: { turnip: 3, carrot: 2, flower: 2 },
        crops: { turnip: 0, carrot: 0, pumpkin: 0, flower: 0 },
        fish: { bass: 0, trout: 0, catfish: 0, eel: 0, ghost_carp: 0 },
        ore: { copper: 0, iron: 0, silver: 0, gold: 0, strange_ore: 0 },
        items: ['uncle_letter', 'grandfather_will'] // You start with your uncle's letter and grandfather's will
    },

    // Farm plots (9 plots)
    plots: [],

    // Villagers
    villagers: [],

    // Clues discovered - organized by what they reveal
    clues: [],

    // Key evidence pieces (special clues that point to the killer)
    keyEvidence: [],

    // Story events seen
    eventsTriggered: [],

    // Locations discovered
    locationsUnlocked: ['farm', 'village', 'shop'],

    // Your suspicions and notes
    suspicions: {},

    // Relationships between NPCs you've discovered
    discoveredRelationships: [],

    // Track choices made in story events (for branching)
    eventChoices: {},

    // Daily activity flags (reset each day, affect threat calculation)
    dailyFlags: {
        harvestedToday: false,
        giftedToday: false,
        soldToday: false,
        talkedToVillager: false,
        askedAboutMurder: false,      // Asked pointed questions about uncle's death
        visitedForbiddenLocation: false, // Went to northfield, ruins, or deep mine
        foundClueToday: false
    },

    // Track gift counts per villager (for relationship milestones)
    giftCounts: {}
};

// Crop definitions - balanced growth (time periods, not days)
const CROPS = {
    turnip: {
        name: 'Turnip',
        icon: '🥬',
        growthTime: 2, // Ready by next time period
        sellPrice: 10,
        giftValue: 8,
        seedCost: 5
    },
    carrot: {
        name: 'Carrot',
        icon: '🥕',
        growthTime: 4, // About 1 day
        sellPrice: 20,
        giftValue: 15,
        seedCost: 10
    },
    pumpkin: {
        name: 'Pumpkin',
        icon: '🎃',
        growthTime: 6, // About 2 days
        sellPrice: 40,
        giftValue: 25,
        seedCost: 20
    },
    flower: {
        name: 'Flower',
        icon: '🌸',
        growthTime: 3, // Quick but not instant
        sellPrice: 15,
        giftValue: 30, // Best for gifting!
        seedCost: 8,
        narrativeHint: "Marie Delacroix loved wildflowers..."
    }
};

// Narrative uses for crops - connects farming to the mystery
const CROP_USES = {
    flower: {
        storyEvent: 'marie_memorial',
        requiresLocation: 'northfield',
        description: "Place flowers on an unmarked grave",
        hint: "Marie Delacroix loved wildflowers. Her grave lies forgotten in the north field..."
    },
    pumpkin: {
        storyEvent: 'harvest_offering',
        requiresLocation: 'ruins',
        description: "Leave an offering at the old altar",
        hint: "The autumn rituals required a harvest offering. The old church altar still stands..."
    },
    carrot: {
        storyEvent: 'stable_bribe',
        requiresVillager: 'farmer',
        requiresTrust: 30,
        description: "Silas's old horse needs feeding",
        hint: "Silas mentioned his horse hasn't had fresh vegetables in weeks..."
    }
};

// Fish definitions - what you can catch
const FISH = {
    bass: {
        name: 'Largemouth Bass',
        icon: '🐟',
        sellPrice: 15,
        giftValue: 12,
        rarity: 0.35,
        timeOfDay: ['morning', 'afternoon', 'evening']
    },
    trout: {
        name: 'Rainbow Trout',
        icon: '🐠',
        sellPrice: 25,
        giftValue: 20,
        rarity: 0.25,
        timeOfDay: ['morning', 'evening']
    },
    catfish: {
        name: 'Channel Catfish',
        icon: '🐡',
        sellPrice: 30,
        giftValue: 15,
        rarity: 0.20,
        timeOfDay: ['evening'],
        clueFragment: {
            text: "The catfish was hiding near a submerged metal box. Something's buried in the pond.",
            requires: (gs) => gs.clues.length >= 2
        }
    },
    eel: {
        name: 'Mysterious Eel',
        icon: '🐍',
        sellPrice: 50,
        giftValue: 10,
        rarity: 0.12,
        timeOfDay: ['evening'],
        hint: "Old Barley says these eels only appeared after Ezekiel vanished.",
        clueFragment: {
            text: "The eel came from a drainage tunnel beneath the pond. It leads somewhere underground.",
            requires: (gs) => gs.clues.length >= 4
        }
    },
    ghost_carp: {
        name: 'Ghost Carp',
        icon: '👻',
        sellPrice: 100,
        giftValue: 40,
        rarity: 0.03,
        timeOfDay: ['evening'],
        special: true,
        hint: "A pale, translucent fish. The locals say it only surfaces when the dead are restless."
    }
};

// Ore definitions - what you can mine
const ORES = {
    copper: {
        name: 'Copper Ore',
        icon: '🟤',
        sellPrice: 10,
        giftValue: 5,
        rarity: 0.40,
        minLevel: 1
    },
    iron: {
        name: 'Iron Ore',
        icon: '⬛',
        sellPrice: 20,
        giftValue: 10,
        rarity: 0.30,
        minLevel: 1,
        clueFragment: {
            text: "This iron ore has tool marks on it. Someone was mining here recently.",
            requires: (gs) => gs.clues.length >= 3
        }
    },
    silver: {
        name: 'Silver Ore',
        icon: '⬜',
        sellPrice: 40,
        giftValue: 25,
        rarity: 0.15,
        minLevel: 3,
        clueFragment: {
            text: "The silver vein runs deeper than it should. Your grandfather's notes mentioned silver near 'the chamber.'",
            requires: (gs) => gs.clues.length >= 5 && gs.inventory.items.includes('grandfather_will')
        }
    },
    gold: {
        name: 'Gold Ore',
        icon: '🟡',
        sellPrice: 80,
        giftValue: 45,
        rarity: 0.08,
        minLevel: 5,
        clueFragment: {
            text: "Gold this pure shouldn't be here. The mine records say the gold vein was exhausted in 1985—two years before grandfather vanished.",
            requires: (gs) => gs.clues.length >= 6
        }
    },
    strange_ore: {
        name: 'Strange Ore',
        icon: '💎',
        sellPrice: 150,
        giftValue: 60,
        rarity: 0.02,
        minLevel: 7,
        special: true,
        hint: "This ore pulses with an unnatural warmth. It shouldn't exist this far from volcanic activity.",
        clueFragment: {
            text: "The strange ore throbs like a heartbeat. It's warm. Almost... alive. This is what grandfather found.",
            requires: (gs) => true // Always triggers
        }
    }
};

// ==========================================
// VILLAGERS - Each has a secret, a motive, and a connection to your uncle
// The killer is chosen randomly, but everyone has SOMETHING to hide
// ==========================================

const VILLAGER_TEMPLATES = [
    {
        id: 'mayor',
        name: 'Edmund Thornwood',
        role: 'Town Mayor',
        portrait: '👴',
        personality: 'authoritative',
        likes: ['pumpkin'],
        dislikes: ['flower'],
        // Connection to uncle
        uncleConnection: "Your uncle was investigating the Mayor's finances before he died.",
        // Their public secret (red herring)
        publicSecret: "Embezzling town funds",
        // Their real secret
        realSecret: "His son killed a girl 20 years ago. Your uncle found proof.",
        // Motive to kill uncle
        motive: "Your uncle threatened to expose the cover-up that built his career.",
        relationships: {
            doctor: 'owes_favor', // Doctor helped cover up the accident
            innkeeper: 'affair',
            librarian: 'fears' // She knows family history
        },
        dialogues: {
            greeting: "Ah, Thomas's nephew. My condolences. Your uncle was... a complicated man.",
            trust20: "He asked too many questions, your uncle. Some doors should stay closed.",
            trust50: "I tried to warn him. 'Leave the past alone,' I said. He wouldn't listen.",
            trust80: "There are things I've done to protect this town. Things I'm not proud of.",
            aboutUncle: "We had our disagreements. But I never wished him harm. You must believe that."
        },
        clues: {
            // If innocent, clue points away
            innocent: "The Mayor was in the city that week - hotel records confirm it. He couldn't have done it.",
            // If guilty, clue points toward (but subtly)
            guilty: "Your uncle's last letter mentioned 'Edmund's buried secret' and a meeting that never happened."
        },
        gossipAbout: {
            doctor: "Dr. Ashford and I go back decades. He's helped me with... sensitive matters.",
            innkeeper: "Molly and I are old friends. Just friends. Despite what people say.",
            librarian: "That woman knows more about my family than I do. It's unsettling."
        },
        // What they know that can help you
        helpfulInfo: "Your uncle came to see me the week before he died. He had a ledger - said it proved everything."
    },
    {
        id: 'doctor',
        name: 'Dr. Henry Ashford',
        role: 'Village Doctor',
        portrait: '👨‍⚕️',
        personality: 'calm',
        likes: ['flower', 'carrot'],
        dislikes: ['pumpkin'],
        uncleConnection: "He signed your uncle's death certificate. Ruled it 'natural causes.'",
        publicSecret: "Drinks too much since his wife died",
        realSecret: "He falsified the death certificate. Your uncle was murdered.",
        motive: "The Mayor has leverage over him from an old malpractice case.",
        relationships: {
            mayor: 'controlled_by',
            herbalist: 'professional_rivalry',
            baker: 'treats_secretly' // She has a condition
        },
        dialogues: {
            greeting: "You have your uncle's eyes. He was my patient, you know. For his heart.",
            trust20: "The death was sudden but not unexpected. His heart was weak.",
            trust50: "I've signed many death certificates. Some haunt me more than others.",
            trust80: "What would you do if telling the truth destroyed everything you'd built?",
            aboutUncle: "Thomas came to me with chest pains. I told him to rest. Perhaps I should have done more."
        },
        clues: {
            innocent: "The doctor's medical notes show genuine concern for your uncle's heart condition.",
            guilty: "The death certificate lists 'heart failure' but the symptoms described don't match."
        },
        gossipAbout: {
            mayor: "Edmund helped me once, long ago. A debt I can never repay. Or escape.",
            herbalist: "Sage Willowmere practices medicine without a license. But I can't stop her.",
            baker: "Rosa comes to me for medicine she doesn't want anyone to know about."
        },
        helpfulInfo: "Your uncle visited me three days before he died. He wasn't there about his heart - he wanted me to examine old autopsy reports."
    },
    {
        id: 'baker',
        name: 'Rosa Delacroix',
        role: 'Baker',
        portrait: '👩‍🍳',
        personality: 'warm',
        likes: ['turnip', 'pumpkin'],
        dislikes: ['carrot'],
        uncleConnection: "Your uncle bought bread from her every morning. They talked.",
        publicSecret: "Came to town five years ago with a false name",
        realSecret: "She's the sister of the girl the Mayor's son killed. She came here for revenge.",
        motive: "Your uncle discovered her true identity and purpose.",
        relationships: {
            blacksmith: 'loves',
            mayor: 'hates',
            herbalist: 'confidante'
        },
        dialogues: {
            greeting: "You look just like him. Thomas used to come here every morning. The pain au chocolat was his favorite.",
            trust20: "Everyone here has a past they'd rather forget. Even sweet old bakers.",
            trust50: "Your uncle understood that some things are worth more than safety.",
            trust80: "I came to this town for one reason. To watch a man suffer like he made my family suffer.",
            aboutUncle: "He knew what I was. What I planned. He was going to help me, I think. Or stop me. I never found out."
        },
        clues: {
            innocent: "Rosa's baking logs show she was working through the night. The ovens were never off.",
            guilty: "Your uncle's notes mention 'R.D. - sister? Verify Marseille records.'"
        },
        gossipAbout: {
            blacksmith: "Viktor is the only good man in this town. I won't let my past touch him.",
            mayor: "Edmund Thornwood smiles and waves. But his hands aren't clean.",
            herbalist: "Sage knows my secret. She's the only one I've told."
        },
        helpfulInfo: "The morning Thomas died, he told me: 'Tonight, I'll have proof.' He seemed almost excited."
    },
    {
        id: 'blacksmith',
        name: 'Viktor Holt',
        role: 'Blacksmith',
        portrait: '🧔',
        personality: 'gruff',
        likes: ['carrot', 'iron', 'copper', 'gold'],
        dislikes: ['flower', 'strange_ore'],
        uncleConnection: "Your uncle ordered a custom lockbox from him. It was never picked up.",
        publicSecret: "Has gambling debts to dangerous people",
        realSecret: "He made the weapon that killed the Mayor's son's victim - and has kept it hidden for 20 years.",
        motive: "Your uncle found the murder weapon in Viktor's forge.",
        relationships: {
            baker: 'loves',
            merchant: 'owes_money',
            mayor: 'serves' // Did a job he regrets
        },
        dialogues: {
            greeting: "Thomas's kin? He ordered a lockbox from me. Strong iron, hidden compartment. Never came to get it.",
            trust20: "I make things. Horseshoes, tools, gates. What people do with them isn't my concern.",
            trust50: "Twenty years ago, I made something for a boy. I didn't know what he'd use it for.",
            trust80: "I keep it under my forge. The thing I made. I couldn't destroy it. It felt like destroying the truth.",
            aboutUncle: "He came asking about old commissions. I lied to him. I wish I hadn't."
        },
        clues: {
            innocent: "Viktor was at the inn all evening - five people saw him drinking.",
            guilty: "Your uncle's notebook has a rough sketch of a weapon. Underneath: 'Viktor's mark?'"
        },
        gossipAbout: {
            baker: "Rosa has ghosts. I don't ask about them. Love doesn't require explanations.",
            merchant: "I owe Finnegan money. He says I can work it off. I don't ask how.",
            mayor: "Edmund paid me well, once. Blood money. I've never been able to wash it off."
        },
        helpfulInfo: "Your uncle asked to see my commission book from twenty years ago. I told him I'd burned it. That was a lie."
    },
    {
        id: 'librarian',
        name: 'Iris Ashworth',
        role: 'Librarian & Historian',
        portrait: '👩‍🏫',
        personality: 'mysterious',
        likes: ['flower'],
        dislikes: ['turnip'],
        uncleConnection: "She's your uncle's sister. Your aunt. She hasn't spoken to the family in decades.",
        publicSecret: "Obsessed with occult history and dark rituals",
        realSecret: "She and Thomas were investigating together. She knows who killed him.",
        motive: "None - she's the key to solving the mystery. But she won't speak until you've proven yourself.",
        relationships: {
            mayor: 'investigates',
            merchant: 'uses', // He finds rare books for her
            doctor: 'suspects'
        },
        dialogues: {
            greeting: "So. You've come. Thomas said you would, eventually. He was rarely wrong.",
            trust20: "I won't insult you with small talk. You want to know how your uncle really died.",
            trust50: "Thomas and I were close once. Before this town and its secrets drove us apart.",
            trust80: "I know who killed him. But knowing and proving are different things. I need evidence.",
            aboutUncle: "My brother was brilliant and stubborn. He came here to expose a twenty-year-old murder. And he died for it."
        },
        clues: {
            innocent: "Iris was the one who called you here. She WANTS you to find the truth.",
            guilty: null // She cannot be the killer
        },
        gossipAbout: {
            mayor: "Edmund has kept this town's worst secret for two decades. Your uncle found it.",
            merchant: "Finnegan brings me information. He doesn't ask why. I pay well.",
            doctor: "Henry Ashford knows Thomas was murdered. The guilt is eating him alive."
        },
        helpfulInfo: "Thomas hid his evidence. He didn't trust anyone - not even me. But he left me a clue: 'Where the hollow sleeps, the truth keeps.'"
    },
    {
        id: 'merchant',
        name: 'Finnegan Quick',
        role: 'Traveling Merchant',
        portrait: '🎩',
        personality: 'sly',
        likes: ['carrot', 'flower'],
        dislikes: ['pumpkin'],
        uncleConnection: "Your uncle hired him to find information. He's the one who found the crucial evidence.",
        publicSecret: "He's a fence and information broker",
        realSecret: "He sold the evidence your uncle found to the highest bidder - the killer.",
        motive: "He was paid to betray your uncle. Now he's afraid of being exposed.",
        relationships: {
            blacksmith: 'lender',
            librarian: 'business',
            mayor: 'fears'
        },
        dialogues: {
            greeting: "Ah, another Ashworth poking around. Your uncle was a customer of mine. Information, mostly.",
            trust20: "I sell things people need. Goods, secrets, silence. All have a price.",
            trust50: "Thomas paid me to dig up the Thornwood family's past. I found what he wanted. Too much, maybe.",
            trust80: "I made a mistake. Someone offered me more money than your uncle. I'm not proud of it.",
            aboutUncle: "He trusted me. That was his mistake. But I can give you what I gave him - for the right price."
        },
        clues: {
            innocent: "Finnegan was seen leaving town the day before Thomas died. He has receipts from three towns over.",
            guilty: "A large payment was made to 'F.Q.' from the Mayor's private account the day after Thomas died."
        },
        gossipAbout: {
            blacksmith: "Viktor's debts are to me. I could call them in any time. That's worth more than money.",
            librarian: "Iris pays well and asks hard questions. She's dangerous in a way Edmund doesn't understand.",
            mayor: "Edmund thinks he owns this town. But everyone has a ledger. Even mayors."
        },
        helpfulInfo: "I can tell you what I found for your uncle. For 200 coins. Or you can find it yourself - it's probably still where Thomas hid it."
    },
    {
        id: 'herbalist',
        name: 'Sage Willowmere',
        role: 'Herbalist & Healer',
        portrait: '🧙‍♀️',
        personality: 'ethereal',
        likes: ['flower', 'turnip', 'eel', 'ghost_carp'],
        dislikes: ['carrot', 'iron'],
        uncleConnection: "Your uncle came to her for remedies. But also to ask about poisons.",
        publicSecret: "Practices 'folk medicine' that borders on witchcraft",
        realSecret: "She's been slowly poisoning the Mayor for Rosa - at Rosa's request.",
        motive: "Your uncle discovered the poisoning plot.",
        relationships: {
            baker: 'conspiracy',
            doctor: 'rivals',
            farmer: 'heals'
        },
        dialogues: {
            greeting: "The dead speak to those who listen. Your uncle's voice is very loud.",
            trust20: "I prepare medicines. Some heal. Some don't. Intent matters more than ingredients.",
            trust50: "Thomas asked me about nightshade. Wolfsbane. Symptoms of slow poisoning.",
            trust80: "Rosa asked me to help her. The Mayor deserves what's coming. But Thomas was going to expose us both.",
            aboutUncle: "He was trying to do right. But doing right sometimes means letting the wrong people escape justice."
        },
        clues: {
            innocent: "Sage was tending to old Barley all night - he had one of his episodes.",
            guilty: "Your uncle's notes: 'S.W. supplying R.D. with something. Mayor's symptoms match slow poisoning.'"
        },
        gossipAbout: {
            baker: "Rosa and I share a cause. The Mayor's son took someone precious from her. He walks free.",
            doctor: "Henry Ashford practices medicine by the book. I practice medicine that works.",
            farmer: "Barley's the only honest soul in Hollow Creek. That's why I keep him alive."
        },
        helpfulInfo: "Thomas found where they buried the girl. The Mayor's son's victim. The north field. But he needed proof it was murder."
    },
    {
        id: 'farmer',
        name: 'Silas Barley',
        role: 'Retired Farmer',
        portrait: '👨‍🌾',
        personality: 'nostalgic',
        likes: ['turnip', 'carrot', 'bass', 'catfish'],
        dislikes: ['flower', 'strange_ore'],
        uncleConnection: "He sold your uncle this very farm. He knows what's buried in the north field.",
        publicSecret: "Drinks too much and rambles about 'the old days'",
        realSecret: "He buried the body for the Mayor twenty years ago. Threatened into silence.",
        motive: "Your uncle was going to dig up the north field. Silas couldn't let his shame be exposed.",
        relationships: {
            mayor: 'fears',
            herbalist: 'trusts',
            librarian: 'avoids'
        },
        dialogues: {
            greeting: "You came. Thomas said you would, if anything happened to him. Said you were stubborn like him.",
            trust20: "That field's been fallow for twenty years. Nothing grows there. Nothing should.",
            trust50: "I did something terrible once. A man told me to dig. I dug. I didn't ask what I was burying.",
            trust80: "A girl. That's what's in the north field. A girl who trusted the wrong boy. I've never slept well since.",
            aboutUncle: "Thomas knew. He was kind about it. Said I was just a pawn. But pawns still carry guilt."
        },
        clues: {
            innocent: "Barley's been bedridden with his hip for weeks. Sage can confirm - she tends to him nightly.",
            guilty: "Your uncle wrote: 'Silas buried her. He'll talk - he WANTS to confess.'"
        },
        gossipAbout: {
            mayor: "Edmund Thornwood made me a monster. I've hated him for twenty years.",
            herbalist: "Sage keeps me alive. Sometimes I wish she wouldn't.",
            librarian: "That woman's been digging in the past. She'll find what I buried. And then..."
        },
        helpfulInfo: "The night your uncle died, I heard someone walking toward the north field. It was late. I was too afraid to look."
    },
    {
        id: 'innkeeper',
        name: 'Molly Harte',
        role: 'Innkeeper',
        portrait: '👩‍🦰',
        personality: 'gossipy',
        likes: ['pumpkin', 'flower', 'trout', 'silver'],
        dislikes: ['turnip', 'eel'],
        uncleConnection: "Your uncle stayed at her inn. She was the last person to see him alive.",
        publicSecret: "Her husband left her under mysterious circumstances",
        realSecret: "She saw who entered your uncle's room that night. She's been paid to keep quiet.",
        motive: "She knows who the killer is. She's protecting them for money or fear.",
        relationships: {
            mayor: 'affair',
            blacksmith: 'friendly',
            doctor: 'uses' // Gets sleeping draughts
        },
        dialogues: {
            greeting: "Thomas's nephew! He spoke of you often. Said you were clever. Too clever to stay away.",
            trust20: "I see everyone who passes through. I hear everything. And I say nothing. That's the job.",
            trust50: "Your uncle was asking too many questions. I warned him. 'Some guests don't leave,' I said.",
            trust80: "I saw someone that night. Going to his room. I could tell you who. But there's a price for dangerous truth.",
            aboutUncle: "He was a good man. Kind. Tipped well. Asked me about the Mayor's late-night visits. I shouldn't have told him."
        },
        clues: {
            innocent: "Molly was behind the bar all evening. Twelve guests confirm it.",
            guilty: "Your uncle's final note: 'M.H. knows. She's scared. Pay her or frighten her?'"
        },
        gossipAbout: {
            mayor: "Edmund visits late. We talk. Just talk. His wife wouldn't understand.",
            blacksmith: "Viktor drinks here most nights. He's running from something. Aren't we all?",
            doctor: "Dr. Ashford gives me sleeping draughts. Without them, I'd never rest."
        },
        helpfulInfo: "The night your uncle died, someone came to the inn around midnight. Went straight to his room. I didn't see their face. But I heard them leave. Two hours later."
    }
];

// ==========================================
// STORY EVENTS - The narrative backbone
// These trigger based on day, time, and conditions
// ==========================================

const STORY_EVENTS = [
    // === FIRST MORNING - After prologue, you're at the farmhouse ===
    {
        id: 'farmhouse_arrival',
        trigger: { day: 1, timeOfDay: 'morning', once: true },
        icon: '🏚️',
        title: 'The Farmhouse',
        text: "The farmhouse is smaller than you imagined—cozy, even, with morning light streaming through dusty windows. But something's wrong.\n\nThe door was ajar when you arrived. Inside, drawers hang open, papers scattered across the floor. Someone's been searching for something.\n\nOn the kitchen table, a single photograph: your uncle with a woman who looks strikingly like him. On the back, handwritten: 'Iris - we were right. E.T. buried her himself.'\n\nE.T. Edmund Thornwood. The Mayor.",
        choices: [
            { text: "Someone ransacked this place. I should be careful.", effectId: 'arrival_secret' },
            { text: "I need to find this Iris. She's family.", effectId: 'arrival_iris' }
        ]
    },
    // === FIRST MEETING WITH SILAS ===
    // Changed from day-based to condition-based: triggers after first farm action
    {
        id: 'meet_barley',
        trigger: { condition: (gs) => gs.eventsTriggered.includes('farmhouse_arrival') &&
                                      (gs.dailyFlags.harvestedToday || gs.plots.some(p => p.state === 'growing')),
                   once: true },
        icon: '👨‍🌾',
        title: 'The Man Who Sold the Farm',
        text: "An old man appears at your door - weathered face, trembling hands. 'I'm Silas Barley. Sold your uncle this land. I need to tell you something.' He looks over his shoulder. 'Your uncle came to me asking about the north field. What's buried there. I told him... I told him things I shouldn't have. Three days later, he was dead.'\n\nHe grips your arm. 'Don't dig in the north field. Don't ask about twenty years ago. Don't trust the Mayor. And for God's sake...' His voice drops. '...don't trust me either.'",
        choices: [
            { text: "\"What's in the north field, Silas?\"", effectId: 'barley_demand' },
            { text: "\"Why shouldn't I trust you?\"", effectId: 'barley_confess' },
            { text: "\"Who killed my uncle?\"", effectId: 'barley_killer' }
        ]
    },
    // === THE INNKEEPER'S WITNESS ===
    {
        id: 'molly_witness',
        trigger: { condition: (gs) => gs.villagers.find(v => v.id === 'innkeeper')?.trust >= 30, once: true },
        icon: '👀',
        title: 'The Night He Died',
        text: "Molly corners you behind the inn, voice barely a whisper. 'I saw who went to your uncle's room that night. Around midnight. They were inside for two hours. When they left... they were carrying something. A lockbox, maybe.'\n\nShe glances around nervously. 'I can tell you who it was. But if I do, I'm next. They've already paid me to keep quiet. The question is - what are you willing to pay for the truth?'",
        choices: [
            { text: "\"I'll pay. Name your price.\"", effectId: 'molly_pay' },
            { text: "\"I'll protect you. Just tell me.\"", effectId: 'molly_protect' },
            { text: "\"You're an accessory to murder. Talk.\"", effectId: 'molly_threaten' }
        ]
    },
    // === THE DOCTOR'S GUILT ===
    {
        id: 'doctor_confession',
        trigger: { condition: (gs) => gs.villagers.find(v => v.id === 'doctor')?.trust >= 50, once: true },
        icon: '💊',
        title: 'The False Certificate',
        text: "Dr. Ashford finds you alone, his hands shaking. 'I have to tell someone. I'm a coward, and your uncle died because of it.'\n\nHe produces a crumpled paper - a death certificate. 'Heart failure. That's what I wrote. But there were marks on his neck. Bruising. Someone held him down and...' He can't continue.\n\n'The Mayor made me sign it. He has something on me from years ago. A mistake. I didn't see a choice. But your uncle deserved better than my cowardice.'",
        choices: [
            { text: "\"My uncle was murdered. Give me that certificate.\"", effectId: 'doctor_evidence' },
            { text: "\"Who held him down? Did you see?\"", effectId: 'doctor_who' },
            { text: "\"What does the Mayor have on you?\"", effectId: 'doctor_leverage' }
        ]
    },
    // === IRIS REVEALS THE TRUTH ===
    {
        id: 'iris_truth',
        trigger: { condition: (gs) => gs.villagers.find(v => v.id === 'librarian')?.trust >= 60, once: true },
        icon: '📚',
        title: 'A Sister\'s Story',
        text: "Iris closes the library door and locks it. 'Thomas was my brother. Your uncle. We hadn't spoken in years - my fault, old family arguments - but six months ago, he wrote to me. He'd found evidence of a murder. Twenty years old. A girl named Marie Delacroix.'\n\nShe pulls out a folder thick with documents. 'The Mayor's son killed her. Covered it up with daddy's help. Silas buried the body. The doctor falsified records. Half this town helped hide it.'\n\nShe meets your eyes. 'Thomas found proof. Someone killed him for it. The proof is still out there. And the killer knows you're looking.'",
        choices: [
            { text: "\"Where's the proof? I'll find it.\"", effectId: 'iris_proof' },
            { text: "\"Who killed Thomas? You must know.\"", effectId: 'iris_killer' },
            { text: "\"Why didn't you go to the police?\"", effectId: 'iris_police' }
        ]
    },
    // === THE POISONING REVEALED ===
    {
        id: 'poison_revealed',
        trigger: { condition: (gs) => gs.villagers.find(v => v.id === 'herbalist')?.trust >= 50 && gs.villagers.find(v => v.id === 'baker')?.trust >= 40, once: true },
        icon: '🧪',
        title: 'Rosa\'s Revenge',
        text: "You find Sage and Rosa together in the greenhouse, speaking in urgent whispers. When they see you, Rosa goes pale. Sage steps forward.\n\n'You should know the truth. Rosa is Marie Delacroix's sister. She came here five years ago to make the Mayor suffer like her family suffered. Slowly. Through his tea.'\n\nRosa's voice is hollow. 'Edmund Thornwood's son killed my sister. His father buried her. The doctor said it was an accident. Finnegan took money to lose evidence. This whole town helped murder her and erase her.'\n\nShe looks at you. 'Your uncle found out. He was going to expose everything - including me. I didn't kill him. But I know who did.'",
        choices: [
            { text: "\"Tell me who killed my uncle.\"", effectId: 'rosa_killer' },
            { text: "\"I understand your pain. I won't stop you.\"", effectId: 'rosa_support' },
            { text: "\"The poisoning stops now. Justice, not revenge.\"", effectId: 'rosa_stop' }
        ]
    },
    // === THE NORTH FIELD ===
    {
        id: 'north_field',
        trigger: { condition: (gs) => gs.clues.length >= 8, once: true },
        icon: '💀',
        title: 'What Lies Beneath',
        text: "Armed with everything you've learned, you go to the north field at dawn. Following your uncle's notes, you find the spot - a slight depression where nothing grows.\n\nYou dig. A foot down, two feet. Then your shovel hits something that isn't dirt.\n\nBones. A skull. And beside them, a rusted locket with the initials 'M.D.' Marie Delacroix.\n\nYou have evidence of the original crime. But your uncle's killer is still out there. And they know you've been digging.",
        choices: [
            { text: "Take the evidence to the authorities", effectId: 'field_authorities' },
            { text: "Photograph everything, then rebury it", effectId: 'field_hide' },
            { text: "Confront the Mayor with this", effectId: 'field_confront' }
        ]
    },
    // === WARNING ===
    // Now requires clues AND having done something threatening (visited dangerous location or asked too many questions)
    {
        id: 'warning',
        trigger: { condition: (gs) => gs.clues.length >= 5 &&
                                      (gs.locationsUnlocked.includes('ruins') ||
                                       gs.locationsUnlocked.includes('northfield') ||
                                       gs.threatLevel >= 25),
                   once: true },
        icon: '✉️',
        title: 'A Familiar Warning',
        text: "A note slides under your door, just as one must have slid under your uncle's:\n\n'You have until the next full moon to leave Hollow Creek. Your uncle ignored this warning. You see how that ended. The dead should stay buried. So should you.'\n\nThe handwriting is elegant. Educated. And at the bottom, a small symbol - the same one you saw in Iris's historical documents about the town's founding families.",
        choices: [
            { text: "Show this to Iris - she knows the symbol", effectId: 'warning_iris' },
            { text: "Keep investigating. They're scared.", effectId: 'warning_ignore' },
            { text: "Set a trap for whoever sent this", effectId: 'warning_trap' }
        ]
    },
    // === SOMEONE KNOWS ===
    // Changed from day-based to threat-based: triggers when you're making real progress
    {
        id: 'followed',
        trigger: { condition: (gs) => gs.threatLevel >= 35 && gs.clues.length >= 4, once: true },
        icon: '👁️',
        title: 'You\'re Being Watched',
        text: "Walking home from the inn, you notice a shadow following you. When you stop, it stops. When you turn, you catch a glimpse - someone ducking behind the smithy.\n\nYou're being followed. Watched. They know you're getting close.\n\nIn your farmhouse, you find another message, this one carved into your kitchen table: 'LAST WARNING'",
        choices: [
            { text: "Arm yourself. They're coming.", effectId: 'followed_arm' },
            { text: "Go to Iris. Safety in numbers.", effectId: 'followed_iris' },
            { text: "Good. Let them come. I'm ready.", effectId: 'followed_ready' }
        ]
    },
    // === MINE DISCOVERY ===
    // Changed from day-based to progress-based: requires pickaxe AND clues about grandfather
    {
        id: 'mine_opened',
        trigger: { condition: (gs) => gs.inventory.items.includes('pickaxe') &&
                                      gs.clues.length >= 4 &&
                                      gs.clues.some(c => c.text.toLowerCase().includes('grandfather') ||
                                                        c.text.toLowerCase().includes('ezekiel') ||
                                                        c.text.toLowerCase().includes('mine')),
                   once: true },
        icon: '⛏️',
        title: 'The Sealed Mine',
        text: "You find the entrance to your grandfather's mine - boarded up, chains rusted, warning signs faded. But the padlock is new. Someone's been here recently.\n\nAs you approach, you hear it: a low hum from deep underground. Not mechanical. Almost... organic.\n\nThe boards are old enough to pry loose. Behind them, darkness waits.",
        choices: [
            { text: "Break in. Whatever's down there, I need to know.", effectId: 'mine_break' },
            { text: "Come back with a lantern and supplies.", effectId: 'mine_prepare' },
            { text: "Ask around town about the mine first.", effectId: 'mine_investigate' }
        ]
    },
    // === THE GHOST CARP ===
    {
        id: 'ghost_carp_caught',
        trigger: { condition: (gs) => gs.inventory.fish.ghost_carp > 0, once: true },
        icon: '👻',
        title: 'The Ghost Carp',
        text: "You stare at the pale, translucent fish in your hands. Its scales seem to glow faintly, and through its flesh you can see... something. Shapes. Like memories trapped in glass.\n\nAs you watch, the shapes resolve: a man being held down, water filling his lungs. Your grandfather's face.\n\nThe fish dies in your hands, but the image remains burned in your mind. Ezekiel Ashworth didn't disappear. He was drowned in this very pond.",
        choices: [
            { text: "They drowned him. They'll pay.", effectId: 'ghost_carp_rage' },
            { text: "Who held him down? Who was there?", effectId: 'ghost_carp_question' },
            { text: "Show this memory to Iris somehow.", effectId: 'ghost_carp_iris' }
        ]
    },
    // === STRANGE ORE DISCOVERY ===
    {
        id: 'strange_ore_found',
        trigger: { condition: (gs) => gs.inventory.ore.strange_ore > 0, once: true },
        icon: '💎',
        title: 'The Pulsing Stone',
        text: "The ore throbs warmly in your palm, almost like a heartbeat. This shouldn't exist - not in this geology, not at this depth.\n\nYou remember your grandfather's journal mention: 'The ore calls to them. They've been using the mine for decades.'\n\nAs you hold it, you feel... drawn. Toward the deepest tunnels. Toward something waiting below.",
        choices: [
            { text: "Follow the pull. Find what's down there.", effectId: 'ore_follow' },
            { text: "Show this to the blacksmith. He knows metals.", effectId: 'ore_viktor' },
            { text: "Destroy it. Nothing good comes from this.", effectId: 'ore_destroy' }
        ]
    },
    // === GRANDFATHER'S FATE ===
    {
        id: 'grandfather_remains',
        trigger: { condition: (gs) => gs.clues.some(c => c.text.includes("grandfather's remains")), once: true },
        icon: '💀',
        title: 'The Third Ashworth',
        text: "You kneel beside the skeleton. Your grandfather. Ezekiel Ashworth. Missing for 39 years.\n\nThe bones tell a story: his skull is cracked, his fingers broken - defensive wounds. He fought back. And in his ribcage, lodged between the bones, a rusted blade with a maker's mark you recognize.\n\nViktor's mark. The blacksmith's grandfather made this blade. Perhaps Viktor himself.",
        choices: [
            { text: "Confront Viktor with this.", effectId: 'grandfather_viktor' },
            { text: "Document everything first. Build a case.", effectId: 'grandfather_document' },
            { text: "Tell Iris. She needs to see this.", effectId: 'grandfather_iris' }
        ]
    },

    // ==========================================
    // CROP-TRIGGERED STORY EVENTS
    // These connect farming to the mystery narrative
    // ==========================================

    // === MARIE'S MEMORIAL - Requires flowers + north field unlocked ===
    {
        id: 'marie_memorial',
        trigger: { condition: (gs) => gs.inventory.crops.flower >= 1 &&
                                      gs.locationsUnlocked.includes('northfield') &&
                                      gs.currentLocation === 'northfield',
                   once: true },
        icon: '🌸',
        title: 'Flowers for the Forgotten',
        text: "You kneel beside the depression in the earth—the place where nothing grows—and lay the wildflowers gently on the soil.\n\nThe wind stills. The birds go quiet.\n\nAnd then you hear it: a voice like rustling leaves. 'Thank you. No one has brought me flowers since... since he buried me here.'\n\nYou don't see her, but you feel her presence. Marie Delacroix. Twenty years dead, twenty years forgotten.\n\n'The Mayor's son strangled me in the old church. His father watched. The farmer buried me. The doctor wrote lies. They all knew. They all helped.'\n\nThe voice fades, but her words remain.",
        choices: [
            { text: "\"Who else was there that night?\"", effectId: 'marie_names' },
            { text: "\"I'll make them pay for what they did to you.\"", effectId: 'marie_vengeance' },
            { text: "\"Rest now. I'll find justice for you.\"", effectId: 'marie_peace' }
        ]
    },

    // === HARVEST OFFERING - Requires pumpkin + ruins unlocked ===
    {
        id: 'harvest_offering',
        trigger: { condition: (gs) => gs.inventory.crops.pumpkin >= 1 &&
                                      gs.locationsUnlocked.includes('ruins') &&
                                      gs.currentLocation === 'ruins',
                   once: true },
        icon: '🎃',
        title: 'The Autumn Ritual',
        text: "The old altar stands at the heart of the ruined church, its stone surface stained dark with age—or something else.\n\nYou place the pumpkin on the altar. It feels right, somehow. Like completing a circuit.\n\nThe stone beneath the pumpkin begins to glow faintly. Words appear, carved into the altar's surface—words that weren't visible before:\n\n'HARVEST MOON 1952. HARVEST MOON 1967. HARVEST MOON 1987. HARVEST MOON 2006.'\n\nDates. Twenty years apart. 1987—the year your grandfather vanished.\n\nBeneath the dates: 'THE HOLLOW FEEDS. THE HOLLOW GROWS. THE HOLLOW WAITS.'",
        choices: [
            { text: "Copy down the dates—they're evidence.", effectId: 'offering_evidence' },
            { text: "Smash the altar. End whatever this is.", effectId: 'offering_smash' },
            { text: "The next date would be 2026... this year.", effectId: 'offering_realization' }
        ]
    },

    // === THE BAKER'S TRUST - Requires gifting Rosa multiple times ===
    {
        id: 'baker_trust',
        trigger: { condition: (gs) => (gs.giftCounts?.baker || 0) >= 3 &&
                                      gs.villagers.find(v => v.id === 'baker')?.trust >= 50,
                   once: true },
        icon: '🥐',
        title: 'Rosa\'s Confession',
        text: "Rosa closes the bakery early. Her hands shake as she locks the door.\n\n'You've been kind to me. Kinder than anyone in this town has been in five years.' She turns to face you, eyes wet. 'My name isn't Rosa Delacroix. It's Rosa Moreau. Delacroix was my sister's name. Marie Delacroix.'\n\nShe sits heavily. 'The Mayor's son killed her. I came here to make Edmund Thornwood suffer—slowly, through his morning tea. Sage helps me with the herbs.'\n\nShe looks up at you. 'Your uncle found out. I thought he'd stop me, but... he understood. He said he'd help expose the truth first. Then he died, just like my sister did.'\n\n'I didn't kill him. I swear it. But I know who did. And I'll tell you—because you've earned it.'",
        choices: [
            { text: "\"Who killed my uncle, Rosa?\"", effectId: 'rosa_reveal_killer' },
            { text: "\"I understand why you did this. I won't stop you.\"", effectId: 'rosa_accept' },
            { text: "\"The poisoning has to stop. Help me find justice another way.\"", effectId: 'rosa_justice' }
        ]
    },

    // === SILAS'S GRATITUDE - Requires gifting Silas carrots ===
    {
        id: 'silas_gratitude',
        trigger: { condition: (gs) => (gs.giftCounts?.farmer || 0) >= 2 &&
                                      gs.villagers.find(v => v.id === 'farmer')?.trust >= 40 &&
                                      gs.inventory.crops.carrot >= 1,
                   once: true },
        icon: '🥕',
        title: 'The Old Farmer\'s Debt',
        text: "Silas's eyes light up when he sees the carrots. 'For Bessie? You remembered.' He feeds the ancient horse, who nuzzles his hand.\n\n'You're not like them,' he says quietly, not looking at you. 'Not like the others who came asking questions. They wanted to use what I know. You just... helped.'\n\nHe reaches into his coat and pulls out a folded paper, yellowed with age. 'I've kept this for twenty years. Waiting for someone I could trust.'\n\nIt's a hand-drawn map of the north field. X marks dot the soil. One is labeled 'Marie.' Others are numbered. One through seven.\n\n'I didn't bury just one body for Edmund Thornwood. I buried seven.'",
        choices: [
            { text: "\"Seven? Over how many years?\"", effectId: 'silas_seven' },
            { text: "\"Give me the shovel. Show me where.\"", effectId: 'silas_dig' },
            { text: "\"Why didn't you go to the police?\"", effectId: 'silas_coward' }
        ]
    }
];

// ==========================================
// EVENT EFFECTS - What happens when you make choices
// ==========================================

const EVENT_EFFECTS = {
    // === INTRO ===
    intro_vow: () => {
        addClue('Family Legacy', "Two Ashworths dead. Both found the same secret. Both were silenced. I'll be the one who survives.");
        addClue('Grandfather Ezekiel', "His will was hidden for 39 years. He discovered what lies beneath Hollow Creek.");
        gameState.playerMotivation = 'vengeance';
    },
    intro_mine: () => {
        addClue('Grandfather Ezekiel', "He owned the mine. He found something down there. Something worth killing for.");
        addClue('The Mine', "Both letters mention the mine. Whatever the secret is, it's connected to what's underground.");
        gameState.playerMotivation = 'curiosity';
    },
    intro_doubt: () => {
        addClue('Uncle Thomas', "His last letter warns of danger. He trusted only his sister Iris.");
        addClue('Grandfather Ezekiel', "His will was sealed for decades. Why did it surface now?");
        gameState.playerMotivation = 'caution';
    },

    // === ARRIVAL ===
    arrival_report: () => {
        addClue('Personal', "I reported the break-in to the Mayor. He seemed unsurprised. 'Thomas had many enemies,' he said.");
        modifyTrust('mayor', 5);
        gameState.threatLevel += 10; // They know you went to him
    },
    arrival_secret: () => {
        addClue('Evidence', "Someone ransacked the farmhouse looking for something. A photo references E.T. (Edmund Thornwood) and a burial.");
        gameState.inventory.items.push('iris_photo');
    },
    arrival_iris: () => {
        addClue('Iris', "The photo shows Thomas and Iris. They were investigating together. 'E.T. buried her himself.'");
        modifyTrust('librarian', 15);
        gameState.inventory.items.push('iris_photo');
    },

    // === MEETING BARLEY ===
    barley_demand: () => {
        addClue('Silas Barley', "There's a body in the north field. Silas helped bury it twenty years ago. He's terrified of it being found.");
        modifyTrust('farmer', 10);
    },
    barley_confess: () => {
        addClue('Silas Barley', "Silas was coerced into burying something - someone - by the Mayor. He's lived with the guilt for decades.");
        modifyTrust('farmer', 20);
    },
    barley_killer: () => {
        addClue('Silas Barley', "Silas claims he didn't kill Thomas, but he knows his death is connected to the secret in the north field.");
        modifyTrust('farmer', 5);
    },

    // === MOLLY WITNESS ===
    molly_pay: () => {
        if (gameState.coins >= 100) {
            gameState.coins -= 100;
            addClue('Molly (KEY)', "Molly saw someone enter Thomas's room at midnight. She'll tell me who for more money.");
            addKeyEvidence('witness', 'Molly knows the killer\'s identity');
        } else {
            addClue('Personal', "I can't afford Molly's price. I need 100 coins.");
        }
    },
    molly_protect: () => {
        addClue('Molly', "Molly is too scared to talk. Someone has paid her to stay silent. She needs to trust me more.");
        modifyTrust('innkeeper', 10);
    },
    molly_threaten: () => {
        addClue('Molly', "I threatened Molly. She called me a monster, just like the rest of them. I've lost her trust.");
        modifyTrust('innkeeper', -30);
        gameState.threatLevel += 10;
    },

    // === DOCTOR CONFESSION ===
    doctor_evidence: () => {
        addClue('Dr. Ashford (KEY)', "Thomas was strangled, not heart failure. The doctor falsified the death certificate under pressure from the Mayor.");
        addKeyEvidence('certificate', 'Falsified death certificate proves murder');
        gameState.inventory.items.push('death_certificate');
    },
    doctor_who: () => {
        addClue('Dr. Ashford', "The doctor didn't see the killer. He only saw Thomas's body - with strangulation marks the Mayor told him to ignore.");
        modifyTrust('doctor', 10);
    },
    doctor_leverage: () => {
        addClue('Dr. Ashford', "The Mayor has something on the doctor - an old malpractice case. He's been controlling him for years.");
        modifyTrust('doctor', 15);
    },

    // === IRIS REVEALS ===
    iris_proof: () => {
        addClue('Iris (KEY)', "Thomas hid the proof somewhere. His clue: 'Where the hollow sleeps, the truth keeps.' The hollow... Hollow Creek?");
        addKeyEvidence('location', 'The proof is hidden where the hollow sleeps');
        modifyTrust('librarian', 20);
    },
    iris_killer: () => {
        addClue('Iris', "Iris suspects the Mayor ordered Thomas killed. But she has no proof of who actually did it.");
        modifyTrust('librarian', 15);
    },
    iris_police: () => {
        addClue('Iris', "The local constable is the Mayor's cousin. The nearest real authority is three towns away. This village protects its own.");
        modifyTrust('librarian', 10);
    },

    // === POISONING ===
    rosa_killer: () => {
        addClue('Rosa (KEY)', "Rosa knows who killed Thomas but won't say yet. She wants the Mayor exposed first. Her revenge comes before justice.");
        addKeyEvidence('witness2', 'Rosa knows the killer but won\'t talk');
    },
    rosa_support: () => {
        addClue('Rosa', "I told Rosa I understood her need for revenge. She and Sage continue their slow poisoning of the Mayor.");
        modifyTrust('baker', 30);
        modifyTrust('herbalist', 20);
    },
    rosa_stop: () => {
        addClue('Rosa', "I convinced Rosa to stop the poisoning. Justice through truth, not poison. She's reluctantly agreed.");
        modifyTrust('baker', 10);
        modifyTrust('herbalist', -10);
    },

    // === NORTH FIELD ===
    field_authorities: () => {
        addClue('Evidence (KEY)', "I've documented Marie Delacroix's remains. The original crime is now provable.");
        addKeyEvidence('body', 'Marie Delacroix\'s remains found');
        gameState.threatLevel += 30; // Major escalation
    },
    field_hide: () => {
        addClue('Evidence (KEY)', "I photographed Marie's grave but left the remains. Insurance.");
        addKeyEvidence('photos', 'Photographs of the burial site');
        gameState.inventory.items.push('grave_photos');
    },
    field_confront: () => {
        addClue('Personal', "I confronted the Mayor with what I found. He laughed. 'You have nothing,' he said. 'Your uncle thought so too.'");
        gameState.threatLevel += 40;
        modifyTrust('mayor', -50);
    },

    // === WARNING ===
    warning_iris: () => {
        addClue('Iris', "The symbol on the warning is the Thornwood family crest. The Mayor or someone close to him sent this.");
        modifyTrust('librarian', 10);
    },
    warning_ignore: () => {
        addClue('Personal', "I received the same warning my uncle did. I will not run.");
        gameState.threatLevel += 15;
    },
    warning_trap: () => {
        addClue('Personal', "I set a trap for the note-sender. Tomorrow night, I'll know who's threatening me.");
        gameState.threatLevel += 10;
    },

    // === BEING FOLLOWED ===
    followed_arm: () => {
        addClue('Personal', "Someone carved 'LAST WARNING' into my table. They were in my home. I need to be ready.");
        gameState.inventory.items.push('weapon');
        gameState.threatLevel += 20;
    },
    followed_iris: () => {
        addClue('Personal', "I'm staying with Iris until this is resolved. There's safety in numbers.");
        modifyTrust('librarian', 15);
    },
    followed_ready: () => {
        addClue('Personal', "They want to scare me off. That means I'm close. Let them come.");
        gameState.threatLevel += 25;
    },

    // === MINE DISCOVERY ===
    mine_break: () => {
        addClue('The Mine (KEY)', "I broke into the mine. The humming is louder inside. Something is alive down there.");
        addKeyEvidence('mine_entry', 'Entered the sealed mine - heard organic humming from below');
        gameState.threatLevel += 15;
    },
    mine_prepare: () => {
        addClue('The Mine', "The mine is sealed but someone's been here. I need proper equipment before going in.");
        showToast('You should buy a lantern from the shop.');
    },
    mine_investigate: () => {
        addClue('The Mine', "I should ask around about grandfather's mine before exploring. Someone knows something.");
    },

    // === GHOST CARP ===
    ghost_carp_rage: () => {
        addClue('Grandfather Ezekiel (KEY)', "The ghost carp showed me his death. He was drowned in the pond. MURDERED.");
        addKeyEvidence('drowning_vision', 'Supernatural vision of grandfather being drowned');
        gameState.playerMotivation = 'vengeance';
        gameState.threatLevel += 20;
    },
    ghost_carp_question: () => {
        addClue('Grandfather Ezekiel (KEY)', "He was drowned by multiple people. This wasn't one killer - it was a conspiracy.");
        addKeyEvidence('drowning_vision', 'Vision showed multiple killers');
    },
    ghost_carp_iris: () => {
        addClue('Grandfather Ezekiel', "Iris needs to know what I saw. Her brother died the same way their father did.");
        modifyTrust('librarian', 25);
        addKeyEvidence('drowning_vision', 'Shared vision with Iris');
    },

    // === STRANGE ORE ===
    ore_follow: () => {
        addClue('The Mine (KEY)', "The strange ore pulls me deeper. There's a chamber down here... and something in it.");
        addKeyEvidence('ore_pull', 'The ore leads to a hidden chamber in the mine');
        gameState.threatLevel += 25;
    },
    ore_viktor: () => {
        addClue('Viktor', "Viktor recognized the ore immediately. His face went pale. 'Where did you find this? That level was supposed to be collapsed.'");
        modifyTrust('blacksmith', -10);
        addKeyEvidence('viktor_knows', 'Viktor knows about the strange ore and the deep levels');
    },
    ore_destroy: () => {
        addClue('Personal', "I crushed the strange ore. It screamed. I swear I heard it scream.");
        gameState.threatLevel -= 10;
    },

    // === GRANDFATHER'S REMAINS ===
    grandfather_viktor: () => {
        addClue('Viktor (KEY)', "I confronted Viktor with the blade. He broke down. 'My grandfather made it. The Mayor made him. Made all of us.'");
        addKeyEvidence('viktor_confession', 'Viktor\'s family was involved in grandfather\'s murder');
        modifyTrust('blacksmith', 20);
    },
    grandfather_document: () => {
        addClue('Evidence (KEY)', "I photographed grandfather's remains and the blade. Irrefutable proof of murder.");
        addKeyEvidence('grandfather_proof', 'Documented proof of Ezekiel Ashworth\'s murder');
        gameState.inventory.items.push('grandfather_photos');
    },
    grandfather_iris: () => {
        addClue('Iris (KEY)', "Iris wept when she saw the remains. 'Father... all these years, I thought you abandoned us. They killed you too.'");
        addKeyEvidence('iris_grief', 'Iris now knows her father was murdered like her brother');
        modifyTrust('librarian', 30);
    },

    // ==========================================
    // CROP-TRIGGERED EVENT EFFECTS
    // ==========================================

    // === MARIE'S MEMORIAL ===
    marie_names: () => {
        addClue('Marie Delacroix (KEY)', "Marie's spirit named them: the Mayor's son strangled her, Edmund watched, Silas buried her, the doctor lied. Four people. Four conspirators.");
        addKeyEvidence('marie_testimony', 'The victim herself named her killers');
        gameState.inventory.crops.flower--; // Flowers used
        gameState.threatLevel += 15; // The dead are stirring
    },
    marie_vengeance: () => {
        addClue('Marie Delacroix (KEY)', "I promised Marie vengeance. Her presence grew warmer, almost grateful. 'Make them remember me.'");
        addKeyEvidence('marie_pact', 'Made a pact with Marie\'s spirit');
        gameState.inventory.crops.flower--;
        gameState.playerMotivation = 'vengeance';
        gameState.threatLevel += 20;
    },
    marie_peace: () => {
        addClue('Marie Delacroix (KEY)', "I promised Marie justice, not revenge. 'Justice,' she whispered. 'I had forgotten that word.' The wind grew gentle.");
        addKeyEvidence('marie_peace', 'Promised to bring justice for Marie');
        gameState.inventory.crops.flower--;
        gameState.threatLevel += 10; // Less aggressive approach
    },

    // === HARVEST OFFERING ===
    offering_evidence: () => {
        addClue('The Ritual (KEY)', "Ritual dates: 1952, 1967, 1987, 2006. Every 20 years, something happens. 1987 was when grandfather vanished. 2026 is this year.");
        addKeyEvidence('ritual_dates', 'Discovered the 20-year ritual cycle');
        gameState.inventory.crops.pumpkin--;
        gameState.inventory.items.push('ritual_dates');
    },
    offering_smash: () => {
        addClue('The Ritual', "I smashed the altar. The ground trembled. From deep below, something SCREAMED. The whole village must have heard it.");
        gameState.inventory.crops.pumpkin--;
        gameState.threatLevel += 35; // You've angered something
        addClue('Personal', "The altar is destroyed, but I've made enemies. Something beneath the town knows I'm here.");
    },
    offering_realization: () => {
        addClue('The Ritual (KEY)', "2006... 2026. The next ritual is THIS YEAR. The Harvest Moon is coming. Whatever they've been feeding for seventy years is about to feed again.");
        addKeyEvidence('ritual_imminent', 'The next ritual is this year');
        gameState.inventory.crops.pumpkin--;
        gameState.threatLevel += 25;
        addClue('The Ritual', "I need to stop them before Harvest Moon. The pattern is clear: every 20 years, someone dies to feed the Hollow.");
    },

    // === BAKER'S TRUST ===
    rosa_reveal_killer: () => {
        addClue('Rosa (KEY)', "Rosa told me who killed my uncle. She saw them leaving the inn that night. The killer is someone I've already met.");
        addKeyEvidence('rosa_witness', 'Rosa witnessed the killer leaving the inn');
        // This is a major revelation - it points to the actual killer
        const killer = gameState.villagers.find(v => v.id === gameState.killer);
        if (killer) {
            addClue('The Killer', `Rosa whispered a name: "${killer.name}." She saw them leave uncle's room. She's been too scared to speak until now.`);
        }
        modifyTrust('baker', 25);
    },
    rosa_accept: () => {
        addClue('Rosa', "I told Rosa I understood her need for revenge. She wept. 'Thank you for not judging me. Your uncle said the same thing.'");
        modifyTrust('baker', 30);
        modifyTrust('herbalist', 15);
        addClue('Personal', "I've chosen to let Rosa continue poisoning the Mayor. Justice or revenge? The line is blurring.");
    },
    rosa_justice: () => {
        addClue('Rosa', "I convinced Rosa to stop the poisoning. 'If we expose the truth publicly, it will hurt Edmund more than any poison.' She agreed, reluctantly.");
        modifyTrust('baker', 15);
        modifyTrust('herbalist', -10); // Sage disagrees
        addClue('Personal', "Rosa will help me expose the conspiracy through evidence, not poison. The legal way.");
    },

    // === SILAS'S GRATITUDE ===
    silas_seven: () => {
        addClue('Silas (KEY)', "Seven bodies over seventy years. Every twenty years, three or four more. 'The Hollow must feed,' Edmund told Silas. 'It's always been this way.'");
        addKeyEvidence('mass_graves', 'Seven bodies buried in the north field over 70 years');
        gameState.inventory.items.push('burial_map');
        modifyTrust('farmer', 30);
    },
    silas_dig: () => {
        addClue('Silas (KEY)', "Silas led me to the graves. Seven mounds, carefully tended by guilt. 'Dig,' he said. 'Let them be found. I'm tired of carrying this alone.'");
        addKeyEvidence('burial_locations', 'Silas revealed all seven burial locations');
        gameState.inventory.items.push('burial_map');
        gameState.threatLevel += 20;
        modifyTrust('farmer', 35);
    },
    silas_coward: () => {
        addClue('Silas', "I asked why he never went to the police. He laughed bitterly. 'The sheriff in '87 was Edmund's uncle. The one in '52 was his grandfather. This town has always belonged to them.'");
        addClue('The Conspiracy', "The Thornwood family has controlled Hollow Creek for generations. Law, medicine, land. The conspiracy isn't new—it's ancient.");
        modifyTrust('farmer', 10);
    }
};

// Helper function to add key evidence
function addKeyEvidence(type, description) {
    if (!gameState.keyEvidence.some(e => e.type === type)) {
        gameState.keyEvidence.push({ type, description, day: gameState.day });
        showToast('KEY EVIDENCE FOUND!');
    }
}

// Exploration locations with discoveries
const LOCATIONS = {
    farm: { name: 'Your Farm', icon: '🏠', description: 'Your cozy farmhouse and fields.' },
    village: { name: 'Village Square', icon: '🏘️', description: 'The heart of Hollow Creek.' },
    shop: { name: 'General Store', icon: '🏪', description: 'Finnegan sells goods of all kinds.' },
    inn: {
        name: 'The Hollow Inn',
        icon: '🍺',
        description: "Molly's establishment. Great for gossip.",
        unlock: { day: 1 },
        discoveries: [
            { chance: 0.3, text: "You overhear two villagers whispering about 'the old ritual.'", clue: "Villagers speak of an 'old ritual' in hushed tones." },
            { chance: 0.2, text: "You notice strange scratches on the cellar door - from the INSIDE.", clue: "The inn's cellar has claw marks from inside." }
        ]
    },
    library: {
        name: 'Village Library',
        icon: '📚',
        description: 'Ancient books and older secrets.',
        unlock: { day: 2 },
        discoveries: [
            { chance: 0.4, text: "A book about Hollow Creek's founding mentions 'blood pacts' with something beneath the soil.", clue: "The town's founders made blood pacts with something underground." },
            { chance: 0.25, text: "You find a genealogy chart. Several major families are all connected.", clue: "The Mayor, Librarian, and Innkeeper are all distantly related." }
        ]
    },
    forest: {
        name: 'Whispering Woods',
        icon: '🌲',
        description: 'Dark paths lead to darker places.',
        unlock: { day: 2 },
        discoveries: [
            { chance: 0.35, text: "You find a clearing with a stone altar. Fresh candle wax and... blood stains.", clue: "There's a sacrificial altar in the forest with fresh blood." },
            { chance: 0.2, text: "Carved symbols on the trees match ones in the library's forbidden books.", clue: "Ritual symbols from old books are carved throughout the forest." }
        ]
    },
    ruins: {
        name: 'Old Church Ruins',
        icon: '⛪',
        description: 'Crumbling walls hide ancient secrets.',
        unlock: { cluesRequired: 6 },
        discoveries: [
            { chance: 0.5, text: "In the ruins, you find a list of names - past mayors, all died mysteriously.", clue: "Every Hollow Creek mayor has died under mysterious circumstances." },
            { chance: 0.3, text: "A hidden chamber contains robes and masks for eight people.", clue: "Eight cultist robes are hidden in the ruins. Who wears them?" }
        ]
    },
    northfield: {
        name: 'North Field',
        icon: '💀',
        description: 'The forbidden field. Barley said never to dig here.',
        unlock: { cluesRequired: 8 },
        discoveries: [
            { chance: 0.6, text: "Shallow graves. Dozens of them. How long has this been going on?", clue: "The north field is a mass grave. This has been happening for generations." },
            { chance: 0.4, text: "You find a locket with an old photo - it matches one in the Mayor's office.", clue: "A victim in the north field was connected to the Mayor's family." }
        ]
    },
    pond: {
        name: 'Hollow Creek Pond',
        icon: '🎣',
        description: 'A murky pond fed by underground springs. Your grandfather loved fishing here.',
        unlock: { day: 1 },
        canFish: true,
        discoveries: [
            { chance: 0.25, text: "You find an old tackle box wedged under a rock. The initials 'E.A.' are carved into it.", clue: "Your grandfather Ezekiel left his tackle box here. He never came back for it." },
            { chance: 0.20, text: "Strange bubbles rise from the pond's center. The water seems... deeper than it should be.", clue: "The pond connects to something underground. An old drainage tunnel, perhaps?" },
            { chance: 0.15, text: "You spot what looks like metal glinting deep in the water. A strongbox?", clue: "Something metal is submerged in the deepest part of the pond." }
        ]
    },
    mine: {
        name: 'Ashworth Mine',
        icon: '⛏️',
        description: 'Your grandfather\'s abandoned silver mine. Sealed after his disappearance.',
        unlock: { day: 3 },
        canMine: true,
        mineLevel: 1,
        discoveries: [
            { chance: 0.30, text: "Scratched into the tunnel wall: 'THEY MADE ME DIG. GOD FORGIVE ME.' - S.B.", clue: "Silas Barley was forced to dig here. But for what?" },
            { chance: 0.25, text: "You find a broken pickaxe with dried blood on it. Recent.", clue: "Someone was mining here recently - and got hurt." },
            { chance: 0.20, text: "The deeper tunnels are reinforced with newer timber. Someone's been maintaining them.", clue: "The mine isn't as abandoned as people claim." }
        ]
    },
    mineDeep: {
        name: 'Deep Tunnels',
        icon: '🕳️',
        description: 'The forbidden depths. Your grandfather\'s last project.',
        unlock: { cluesRequired: 10, item: 'lantern' },
        canMine: true,
        mineLevel: 5,
        discoveries: [
            { chance: 0.40, text: "The walls are covered in strange symbols - the same ones from the library's forbidden books.", clue: "The deep tunnels contain ritual markings. Your grandfather found something terrible." },
            { chance: 0.35, text: "You find a journal page: 'The ore calls to them. They've been using the mine for decades. I have to stop it.'", clue: "Ezekiel discovered the mine was being used for dark purposes. He tried to stop it." },
            { chance: 0.30, text: "A hidden chamber. Inside: robes, candles, and a list of dates going back to 1952.", clue: "The mine contains a ritual chamber. The dates match mysterious deaths in town records." },
            { chance: 0.20, text: "You find a skeleton in mining clothes. The name tag reads 'E. ASHWORTH'.", clue: "Your grandfather's remains are in the deep tunnels. He didn't run away - he was killed here." }
        ]
    }
};

const TIME_PERIODS = ['morning', 'afternoon', 'evening'];

const THREAT_LEVELS = [
    { max: 20, label: 'Quiet', color: '#4ade80', description: 'The village seems peaceful.' },
    { max: 40, label: 'Uneasy', color: '#fbbf24', description: 'People are nervous.' },
    { max: 60, label: 'Tense', color: '#fb923c', description: 'Fear grips the village.' },
    { max: 80, label: 'Dangerous', color: '#f87171', description: 'The killer grows bold.' },
    { max: 100, label: 'Critical', color: '#dc2626', description: 'Time is running out!' }
];

// ==========================================
// INITIALIZATION
// ==========================================

function initGame() {
    // Reset game state
    gameState.day = 1;
    gameState.timeOfDay = 'morning';
    gameState.actionsRemaining = 4;
    gameState.coins = 30;
    gameState.energy = 100;
    gameState.threatLevel = 0;
    gameState.selectedSeed = null;
    gameState.currentVillager = null;
    gameState.currentLocation = 'farm';
    gameState.accusationMade = false;
    gameState.gameOver = false;
    gameState.clues = [];
    gameState.keyEvidence = [];
    gameState.eventsTriggered = [];
    gameState.locationsUnlocked = ['farm', 'village', 'shop'];
    gameState.suspicions = {};
    gameState.discoveredRelationships = [];
    gameState.playerMotivation = 'find_truth';

    // Initialize new story integration systems
    gameState.eventChoices = {};
    gameState.giftCounts = {};
    gameState.dailyFlags = {
        harvestedToday: false,
        giftedToday: false,
        soldToday: false,
        talkedToVillager: false,
        askedAboutMurder: false,
        visitedForbiddenLocation: false,
        foundClueToday: false
    };

    // Reset inventory - you start with your uncle's letter and grandfather's will
    gameState.inventory = {
        seeds: { turnip: 3, carrot: 2, flower: 2 },
        crops: { turnip: 0, carrot: 0, pumpkin: 0, flower: 0 },
        fish: { bass: 0, trout: 0, catfish: 0, eel: 0, ghost_carp: 0 },
        ore: { copper: 0, iron: 0, silver: 0, gold: 0, strange_ore: 0 },
        items: ['uncle_letter', 'grandfather_will']
    };

    // Initialize 9 farm plots
    gameState.plots = Array(9).fill(null).map(() => ({
        state: 'empty',
        crop: null,
        growthProgress: 0
    }));

    // Initialize ALL villagers (this is a murder mystery - we need everyone)
    // But ensure Iris (the librarian/aunt) is always included since she's key to the plot
    const iris = VILLAGER_TEMPLATES.find(v => v.id === 'librarian');
    const others = VILLAGER_TEMPLATES.filter(v => v.id !== 'librarian');
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

    // Take 5 random others + Iris = 6 villagers
    const selectedVillagers = [iris, ...shuffledOthers.slice(0, 5)];

    gameState.villagers = selectedVillagers.map(template => ({
        ...template,
        trust: 15, // Start with low trust - you're a stranger investigating a murder
        alive: true,
        clueRevealed: false,
        talkedToday: false,
        giftedToday: false,
        gossipHeard: []
    }));

    // Randomly select killer from non-Iris villagers (she's your ally)
    const potentialKillers = gameState.villagers.filter(v => v.id !== 'librarian');
    const killerIndex = Math.floor(Math.random() * potentialKillers.length);
    gameState.killer = potentialKillers[killerIndex].id;

    // Select an accomplice (someone who helped cover it up or knows)
    const potentialAccomplices = potentialKillers.filter(v => v.id !== gameState.killer);
    if (potentialAccomplices.length > 0) {
        gameState.accomplice = potentialAccomplices[Math.floor(Math.random() * potentialAccomplices.length)].id;
    }

    console.log('🔪 Killer:', gameState.killer);
    console.log('🤝 Accomplice:', gameState.accomplice);

    // Add starting clues from the prologue
    gameState.clues = [
        {
            day: 0,
            source: 'Grandfather\'s Will',
            text: 'Ezekiel discovered "what lies beneath Hollow Creek" and was silenced for it. The proof is hidden somewhere.'
        },
        {
            day: 0,
            source: 'Uncle\'s Letter',
            text: 'Thomas was murdered—not heart failure. He trusted only Iris. The truth is in the mine.'
        },
        {
            day: 0,
            source: 'Your Investigation',
            text: 'Two Ashworths dead, 39 years apart. Same secret. Same village. Find the truth before you\'re next.'
        }
    ];

    // Render initial state
    renderAll();
    checkForEvents();
}

function renderAll() {
    renderFarmGrid();
    renderSeedInventory();
    renderVillagers();
    renderShop();
    renderClues();
    renderLocations();
    updateHUD();
}

// ==========================================
// RENDERING
// ==========================================

function renderFarmGrid() {
    const grid = document.getElementById('farm-grid');
    if (!grid) return;
    grid.innerHTML = '';

    gameState.plots.forEach((plot, index) => {
        const plotEl = document.createElement('div');
        plotEl.className = `farm-plot ${plot.state}`;
        plotEl.dataset.index = index;

        if (plot.state === 'empty') {
            plotEl.innerHTML = '<span class="plot-hint">Tap to plant</span>';
        } else if (plot.state === 'growing') {
            const crop = CROPS[plot.crop];
            const progress = Math.floor((plot.growthProgress / crop.growthTime) * 100);
            plotEl.innerHTML = `
                <span class="growing-icon">🌱</span>
                <div class="growth-bar"><div class="growth-fill" style="width: ${progress}%"></div></div>
            `;
        } else if (plot.state === 'ready') {
            plotEl.innerHTML = `<span class="ready-icon">${CROPS[plot.crop].icon}</span>`;
        }

        plotEl.addEventListener('click', () => handlePlotClick(index));
        grid.appendChild(plotEl);
    });
}

function renderSeedInventory() {
    const slotsEl = document.getElementById('seed-slots');
    if (!slotsEl) return;
    slotsEl.innerHTML = '';

    Object.entries(gameState.inventory.seeds).forEach(([type, count]) => {
        const crop = CROPS[type];
        const slot = document.createElement('div');
        slot.className = `seed-slot ${count === 0 ? 'empty' : ''} ${gameState.selectedSeed === type ? 'selected' : ''}`;
        slot.innerHTML = `<span class="seed-icon">${crop.icon}</span><span class="seed-count">${count}</span>`;
        slot.title = `${crop.name} - Grows in ${crop.growthTime} period(s)`;

        if (count > 0) {
            slot.addEventListener('click', () => {
                gameState.selectedSeed = gameState.selectedSeed === type ? null : type;
                renderSeedInventory();
            });
        }
        slotsEl.appendChild(slot);
    });

    // Harvested crops
    const harvestEl = document.getElementById('harvest-slots');
    if (!harvestEl) return;
    harvestEl.innerHTML = '';

    let hasHarvest = false;

    // Crops
    Object.entries(gameState.inventory.crops).forEach(([type, count]) => {
        if (count > 0) {
            hasHarvest = true;
            const crop = CROPS[type];
            const slot = document.createElement('div');
            slot.className = 'harvest-slot';
            slot.innerHTML = `<span>${crop.icon}</span><span>×${count}</span>`;
            slot.title = `Click to sell for ${crop.sellPrice}g each`;
            slot.addEventListener('click', () => sellCrop(type));
            harvestEl.appendChild(slot);
        }
    });

    // Fish
    Object.entries(gameState.inventory.fish).forEach(([type, count]) => {
        if (count > 0) {
            hasHarvest = true;
            const fish = FISH[type];
            const slot = document.createElement('div');
            slot.className = `harvest-slot ${fish.special ? 'special-item' : ''}`;
            slot.innerHTML = `<span>${fish.icon}</span><span>×${count}</span>`;
            slot.title = `${fish.name} - Click to sell for ${fish.sellPrice}g each`;
            slot.addEventListener('click', () => sellFish(type));
            harvestEl.appendChild(slot);
        }
    });

    // Ore
    Object.entries(gameState.inventory.ore).forEach(([type, count]) => {
        if (count > 0) {
            hasHarvest = true;
            const ore = ORES[type];
            const slot = document.createElement('div');
            slot.className = `harvest-slot ${ore.special ? 'special-item' : ''}`;
            slot.innerHTML = `<span>${ore.icon}</span><span>×${count}</span>`;
            slot.title = `${ore.name} - Click to sell for ${ore.sellPrice}g each`;
            slot.addEventListener('click', () => sellOre(type));
            harvestEl.appendChild(slot);
        }
    });

    if (!hasHarvest) {
        harvestEl.innerHTML = '<span class="no-harvest">No items yet</span>';
    }
}

function renderVillagers() {
    const listEl = document.getElementById('villager-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    // Sort by location relevance
    const sortedVillagers = [...gameState.villagers].sort((a, b) => {
        if (!a.alive && b.alive) return 1;
        if (a.alive && !b.alive) return -1;
        return b.trust - a.trust;
    });

    sortedVillagers.forEach(villager => {
        const card = document.createElement('div');
        card.className = `villager-card ${!villager.alive ? 'dead' : ''} ${getSuspicionClass(villager.id)}`;

        const trustColor = villager.trust >= 60 ? '#4ade80' : villager.trust >= 30 ? '#fbbf24' : '#f87171';

        // Short story hook for each villager
        const storyHooks = {
            mayor: "Mentioned in uncle's letter",
            doctor: "Signed death certificate",
            baker: "Uncle's morning routine",
            blacksmith: "Made uncle's lockbox",
            librarian: "Your aunt - uncle trusted her",
            merchant: "Sold info to uncle",
            herbalist: "Uncle asked about poisons",
            farmer: "Sold the farm to uncle",
            innkeeper: "Last to see uncle alive"
        };
        const hook = storyHooks[villager.id] || "May know something";

        card.innerHTML = `
            <div class="villager-portrait">${villager.portrait}</div>
            <div class="villager-info">
                <div class="villager-name">${villager.name.split(' ')[0]} ${villager.name.split(' ')[1] || ''}</div>
                <div class="villager-role">${villager.role}</div>
                <div class="villager-hook">${hook}</div>
                <div class="trust-bar">
                    <div class="trust-fill" style="width: ${villager.trust}%; background: ${trustColor}"></div>
                </div>
            </div>
            ${!villager.alive ? '<div class="dead-overlay">💀 DECEASED</div>' : ''}
        `;

        if (villager.alive) {
            card.addEventListener('click', () => openVillagerModal(villager));
        }

        listEl.appendChild(card);
    });
}

function getSuspicionClass(villagerId) {
    const suspicion = gameState.suspicions[villagerId];
    if (suspicion === 'suspect') return 'marked-suspect';
    if (suspicion === 'cleared') return 'marked-cleared';
    return '';
}

function renderShop() {
    const shopEl = document.getElementById('shop-items');
    if (!shopEl) return;
    shopEl.innerHTML = '';

    const items = [
        { type: 'seed', id: 'turnip', name: 'Turnip Seeds ×3', icon: '🌱', cost: 5, desc: 'Quick growth!' },
        { type: 'seed', id: 'carrot', name: 'Carrot Seeds ×3', icon: '🥕', cost: 10, desc: '2 periods' },
        { type: 'seed', id: 'flower', name: 'Flower Seeds ×3', icon: '🌸', cost: 8, desc: 'Best gifts!' },
        { type: 'seed', id: 'pumpkin', name: 'Pumpkin Seeds ×3', icon: '🎃', cost: 20, desc: 'High value' },
        { type: 'item', id: 'fishing_rod', name: 'Fishing Rod', icon: '🎣', cost: 30, desc: 'Catch fish at the pond', oneTime: true },
        { type: 'item', id: 'pickaxe', name: 'Pickaxe', icon: '⛏️', cost: 45, desc: 'Mine ore in the tunnels', oneTime: true },
        { type: 'item', id: 'lantern', name: 'Lantern', icon: '🔦', cost: 50, desc: 'Access deep tunnels', oneTime: true },
        { type: 'item', id: 'lockpick', name: 'Lockpick Set', icon: '🔑', cost: 75, desc: 'Open secrets', oneTime: true },
        { type: 'item', id: 'diving_mask', name: 'Diving Mask', icon: '🤿', cost: 100, desc: 'Search the pond depths', oneTime: true }
    ];

    items.forEach(item => {
        if (item.oneTime && gameState.inventory.items.includes(item.id)) return;

        const el = document.createElement('div');
        el.className = 'shop-item';
        el.innerHTML = `
            <div class="shop-item-left">
                <span class="shop-icon">${item.icon}</span>
                <div>
                    <div class="shop-name">${item.name}</div>
                    <div class="shop-desc">${item.desc}</div>
                </div>
            </div>
            <button class="buy-btn" ${gameState.coins < item.cost ? 'disabled' : ''}>
                💰${item.cost}
            </button>
        `;

        el.querySelector('.buy-btn').addEventListener('click', () => buyItem(item));
        shopEl.appendChild(el);
    });
}

function renderClues() {
    const listEl = document.getElementById('clues-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    if (gameState.clues.length === 0) {
        listEl.innerHTML = '<div class="no-clues">No clues yet. Talk to villagers and explore!</div>';
    } else {
        // Group by source
        const grouped = {};
        gameState.clues.forEach(clue => {
            if (!grouped[clue.source]) grouped[clue.source] = [];
            grouped[clue.source].push(clue);
        });

        Object.entries(grouped).forEach(([source, clues]) => {
            const group = document.createElement('div');
            group.className = 'clue-group';
            group.innerHTML = `<div class="clue-source">${source}</div>`;

            clues.forEach(clue => {
                const clueEl = document.createElement('div');
                clueEl.className = 'clue-item';
                clueEl.innerHTML = `
                    <span class="clue-day">Day ${clue.day}</span>
                    <p class="clue-text">${clue.text}</p>
                `;
                group.appendChild(clueEl);
            });

            listEl.appendChild(group);
        });
    }

    // Suspicion markers
    renderSuspicionPanel();
}

function renderSuspicionPanel() {
    const panelEl = document.getElementById('suspicion-panel');
    if (!panelEl) return;
    panelEl.innerHTML = '<h3>Your Suspicions</h3>';

    const grid = document.createElement('div');
    grid.className = 'suspicion-grid';

    gameState.villagers.forEach(v => {
        if (!v.alive) return;
        const btn = document.createElement('button');
        btn.className = `suspicion-btn ${getSuspicionClass(v.id)}`;
        btn.innerHTML = `${v.portrait}<span>${v.name.split(' ')[0]}</span>`;
        btn.addEventListener('click', () => cycleSuspicion(v.id));
        grid.appendChild(btn);
    });

    panelEl.appendChild(grid);

    // Accuse button
    const accuseSection = document.createElement('div');
    accuseSection.className = 'accuse-section';
    accuseSection.innerHTML = `
        <button id="accuse-btn" class="accuse-btn" ${!canAccuse() ? 'disabled' : ''}>
            ⚠️ Make Final Accusation
        </button>
        <p class="accuse-warning">Choose wisely - you only get one chance!</p>
    `;
    panelEl.appendChild(accuseSection);

    document.getElementById('accuse-btn')?.addEventListener('click', openAccuseModal);
}

function renderLocations() {
    const locEl = document.getElementById('location-list');
    if (!locEl) return;
    locEl.innerHTML = '';

    Object.entries(LOCATIONS).forEach(([id, loc]) => {
        const unlocked = isLocationUnlocked(id);
        const btn = document.createElement('button');
        btn.className = `location-btn ${unlocked ? '' : 'locked'} ${gameState.currentLocation === id ? 'current' : ''}`;

        if (unlocked) {
            btn.innerHTML = `
                <span class="loc-icon">${loc.icon}</span>
                <span class="loc-name">${loc.name}</span>
            `;
            btn.addEventListener('click', () => travelTo(id));
        } else {
            btn.innerHTML = `
                <span class="loc-icon">🔒</span>
                <span class="loc-name">???</span>
            `;
            btn.title = getUnlockHint(id);
        }

        locEl.appendChild(btn);
    });
}

function updateHUD() {
    const dayEl = document.getElementById('day-display');
    const timeEl = document.getElementById('time-display');
    const coinsEl = document.getElementById('coins-display');
    const actionsEl = document.getElementById('actions-display');
    const threatEl = document.getElementById('threat-display');

    if (dayEl) dayEl.textContent = `Day ${gameState.day}`;

    const timeIcons = { morning: '☀️', afternoon: '🌤️', evening: '🌙' };
    if (timeEl) timeEl.textContent = `${timeIcons[gameState.timeOfDay]} ${gameState.timeOfDay.charAt(0).toUpperCase() + gameState.timeOfDay.slice(1)}`;

    if (coinsEl) coinsEl.textContent = `💰 ${gameState.coins}`;
    if (actionsEl) actionsEl.textContent = `⚡ ${gameState.actionsRemaining}`;

    const threatInfo = THREAT_LEVELS.find(t => gameState.threatLevel <= t.max) || THREAT_LEVELS[THREAT_LEVELS.length - 1];
    if (threatEl) {
        threatEl.textContent = `⚠️ ${threatInfo.label}`;
        threatEl.style.color = threatInfo.color;
        threatEl.title = threatInfo.description;
    }
}

// ==========================================
// GAME MECHANICS
// ==========================================

function useAction() {
    gameState.actionsRemaining--;

    // Grow crops
    gameState.plots.forEach(plot => {
        if (plot.state === 'growing') {
            plot.growthProgress++;
            const crop = CROPS[plot.crop];
            if (plot.growthProgress >= crop.growthTime) {
                plot.state = 'ready';
            }
        }
    });

    if (gameState.actionsRemaining <= 0) {
        advanceTime();
    }

    updateHUD();
    renderFarmGrid();
}

function advanceTime() {
    const currentIndex = TIME_PERIODS.indexOf(gameState.timeOfDay);

    if (currentIndex < TIME_PERIODS.length - 1) {
        gameState.timeOfDay = TIME_PERIODS[currentIndex + 1];
        gameState.actionsRemaining = 4;
    } else {
        // End of day
        endDay();
    }

    // Reset daily flags
    gameState.villagers.forEach(v => {
        v.talkedToday = false;
        v.giftedToday = false;
    });

    updateHUD();
    checkForEvents();
}

function endDay() {
    gameState.day++;
    gameState.timeOfDay = 'morning';
    gameState.actionsRemaining = 4;

    // Calculate threat based on player actions, not just time
    const dailyThreat = calculateDailyThreat();
    gameState.threatLevel += dailyThreat;

    // Reset daily flags for new day
    resetDailyFlags();

    // Unlock new locations based on day
    checkLocationUnlocks();

    // Check for game over
    if (gameState.threatLevel >= 100) {
        endGame(false, 'The darkness consumed Hollow Creek. You were too late.');
        return;
    }

    // Possible murder - only when threat is high AND you've been aggressive
    if (gameState.day >= 4 && gameState.threatLevel >= 60 && Math.random() < 0.20) {
        triggerMurder();
    }

    // Day summary message varies based on threat
    const dayMessage = getDayMessage(dailyThreat);
    showEvent('🌅', `Day ${gameState.day}`, dayMessage, [
        { text: 'Continue', effectId: null }
    ]);

    renderAll();
    autoSave();
}

// Calculate threat based on player activities - cozy actions reduce threat
function calculateDailyThreat() {
    let threat = 2; // Small base increase (was 5 + day*2)

    // Investigation activities INCREASE threat (you're poking around)
    if (gameState.dailyFlags.askedAboutMurder) threat += 4;
    if (gameState.dailyFlags.visitedForbiddenLocation) threat += 6;
    if (gameState.dailyFlags.foundClueToday) threat += 2;

    // Cozy activities DECREASE threat (you seem harmless)
    if (gameState.dailyFlags.harvestedToday) threat -= 2;
    if (gameState.dailyFlags.giftedToday) threat -= 3;
    if (gameState.dailyFlags.soldToday) threat -= 1;
    if (gameState.dailyFlags.talkedToVillager) threat -= 1;

    // Clue milestones give small bonuses (you're making progress)
    if (gameState.clues.length >= 10 && !gameState.clueBonus10) {
        threat -= 3;
        gameState.clueBonus10 = true;
    }

    return Math.max(0, threat); // Never negative
}

// Reset daily activity flags
function resetDailyFlags() {
    gameState.dailyFlags = {
        harvestedToday: false,
        giftedToday: false,
        soldToday: false,
        talkedToVillager: false,
        askedAboutMurder: false,
        visitedForbiddenLocation: false,
        foundClueToday: false
    };
}

// Get a day message based on how the day went
function getDayMessage(threatChange) {
    if (threatChange <= 0) {
        return "A peaceful day on the farm. The village seems calm, almost idyllic. But you know better.";
    } else if (threatChange <= 3) {
        return "A new day dawns. The village stirs with its usual rhythms, but watchful eyes follow your movements.";
    } else if (threatChange <= 6) {
        return "You sense tension in the air. Conversations stop when you approach. Someone is watching.";
    } else {
        return "The village feels dangerous today. You've stirred something up. They know you're getting close.";
    }
}

function handlePlotClick(index) {
    const plot = gameState.plots[index];

    if (plot.state === 'ready') {
        // Harvest!
        const crop = plot.crop;
        gameState.inventory.crops[crop]++;
        plot.state = 'empty';
        plot.crop = null;
        plot.growthProgress = 0;
        gameState.dailyFlags.harvestedToday = true; // Track cozy activity
        showToast(`Harvested ${CROPS[crop].icon} ${CROPS[crop].name}!`);

        // Show narrative hint if this crop has a story use
        if (CROP_USES[crop] && Math.random() < 0.5) {
            setTimeout(() => showToast(CROP_USES[crop].hint, 3000), 1000);
        }

        renderFarmGrid();
        renderSeedInventory();
    } else if (plot.state === 'empty' && gameState.selectedSeed) {
        if (gameState.inventory.seeds[gameState.selectedSeed] > 0) {
            gameState.inventory.seeds[gameState.selectedSeed]--;
            plot.state = 'growing';
            plot.crop = gameState.selectedSeed;
            plot.growthProgress = 0;

            if (gameState.inventory.seeds[gameState.selectedSeed] === 0) {
                gameState.selectedSeed = null;
            }

            showToast(`Planted ${CROPS[plot.crop].name}!`);
            useAction();
            renderSeedInventory();
        }
    } else if (plot.state === 'empty') {
        showToast('Select seeds first!');
    }
}

function sellCrop(type) {
    const count = gameState.inventory.crops[type];
    if (count > 0) {
        const price = CROPS[type].sellPrice * count;
        gameState.coins += price;
        gameState.inventory.crops[type] = 0;
        gameState.dailyFlags.soldToday = true; // Track cozy activity
        showToast(`Sold ${count} ${CROPS[type].name}(s) for ${price}g!`);
        renderSeedInventory();
        renderShop();
        updateHUD();
    }
}

function sellFish(type) {
    const count = gameState.inventory.fish[type];
    if (count > 0) {
        const fish = FISH[type];
        const price = fish.sellPrice * count;
        gameState.coins += price;
        gameState.inventory.fish[type] = 0;
        gameState.dailyFlags.soldToday = true; // Track cozy activity
        showToast(`Sold ${count} ${fish.name}(s) for ${price}g!`);
        renderSeedInventory();
        renderShop();
        updateHUD();
    }
}

function sellOre(type) {
    const count = gameState.inventory.ore[type];
    if (count > 0) {
        const ore = ORES[type];
        const price = ore.sellPrice * count;
        gameState.coins += price;
        gameState.inventory.ore[type] = 0;
        gameState.dailyFlags.soldToday = true; // Track cozy activity
        showToast(`Sold ${count} ${ore.name}(s) for ${price}g!`);
        renderSeedInventory();
        renderShop();
        updateHUD();
    }
}

function buyItem(item) {
    if (gameState.coins < item.cost) return;

    gameState.coins -= item.cost;

    if (item.type === 'seed') {
        gameState.inventory.seeds[item.id] = (gameState.inventory.seeds[item.id] || 0) + 3;
    } else if (item.type === 'item') {
        gameState.inventory.items.push(item.id);
        showToast(`Acquired ${item.name}!`);
    }

    renderSeedInventory();
    renderShop();
    updateHUD();
}

// ==========================================
// VILLAGER INTERACTIONS
// ==========================================

function openVillagerModal(villager) {
    gameState.currentVillager = villager;

    document.getElementById('villager-portrait').textContent = villager.portrait;
    document.getElementById('villager-name').textContent = villager.name;
    document.getElementById('villager-role').textContent = villager.role;
    document.getElementById('trust-fill').style.width = `${villager.trust}%`;

    // Show why this person matters to your investigation
    const connectionEl = document.getElementById('villager-connection');
    if (connectionEl) {
        connectionEl.textContent = `📌 ${villager.uncleConnection}`;
    }

    // Dialogue based on trust - use the actual story dialogues
    let dialogue;
    if (villager.trust >= 80 && villager.dialogues.trust80) {
        dialogue = villager.dialogues.trust80;
    } else if (villager.trust >= 50 && villager.dialogues.trust50) {
        dialogue = villager.dialogues.trust50;
    } else if (villager.trust >= 20 && villager.dialogues.trust20) {
        dialogue = villager.dialogues.trust20;
    } else {
        dialogue = villager.dialogues.greeting;
    }
    document.getElementById('villager-dialogue').textContent = `"${dialogue}"`;

    // Update buttons
    updateVillagerButtons(villager);

    document.getElementById('villager-modal').classList.add('active');
}

function updateVillagerButtons(villager) {
    const talkBtn = document.getElementById('talk-btn');
    const giftBtn = document.getElementById('gift-btn');
    const gossipBtn = document.getElementById('gossip-btn');
    const secretBtn = document.getElementById('secret-btn');

    talkBtn.disabled = villager.talkedToday;
    talkBtn.textContent = villager.talkedToday ? '💬 Talked' : '💬 Talk';

    giftBtn.disabled = villager.giftedToday;

    gossipBtn.disabled = villager.trust < 40;
    gossipBtn.textContent = villager.trust < 40 ? `🗣️ Need ${40 - villager.trust}% trust` : '🗣️ Ask for Gossip';

    secretBtn.disabled = villager.trust < 70 || villager.clueRevealed;
    if (villager.clueRevealed) {
        secretBtn.textContent = '✓ Secret Known';
    } else if (villager.trust < 70) {
        secretBtn.textContent = `🔍 Need ${70 - villager.trust}% trust`;
    } else {
        secretBtn.textContent = '🔍 Learn Secret';
    }
}

// Contextual dialogue - villagers react to what you've discovered
function getContextualDialogue(villager) {
    const v = villager;
    const items = gameState.inventory.items;
    const clues = gameState.clues;

    // React to death certificate (major evidence)
    if (items.includes('death_certificate')) {
        if (v.id === 'doctor') {
            return "You found it. Now you know my shame. I falsified that certificate because Edmund made me. Your uncle deserved better.";
        }
        if (v.id === 'mayor') {
            return "Where did you get that? It means nothing. Heart failure. That's what the doctor wrote. That's the truth.";
        }
        if (v.id === 'librarian') {
            return "The death certificate? Thomas knew it was fake. He was so close to proving murder. Now you can finish what he started.";
        }
    }

    // React to burial map
    if (items.includes('burial_map')) {
        if (v.id === 'farmer') {
            return "You have my map. Good. I'm tired of carrying this alone. Dig them up. Let them rest properly.";
        }
        if (v.id === 'mayor') {
            gameState.dailyFlags.askedAboutMurder = true; // Confrontational
            return "What's that you're holding? A map? Of what? You're making dangerous accusations with your silence.";
        }
    }

    // React to ritual dates
    if (items.includes('ritual_dates')) {
        if (v.id === 'librarian') {
            return "You found the pattern. Every twenty years... 1952, 1967, 1987, 2006. And now 2026. We're running out of time.";
        }
        if (v.id === 'herbalist') {
            return "The ritual dates? I've seen those symbols in my grandmother's journals. She tried to stop it once. They silenced her too.";
        }
    }

    // React to having visited the north field
    if (gameState.locationsUnlocked.includes('northfield')) {
        if (v.id === 'farmer') {
            return "You went to the north field. I can see it in your eyes. Now you know what I've lived with for twenty years.";
        }
        if (v.id === 'baker' && v.trust >= 40) {
            return "You found the field where they buried her. My sister. Marie. I've never been able to go there myself.";
        }
    }

    // React to strange ore
    if (gameState.inventory.ore.strange_ore > 0) {
        if (v.id === 'blacksmith') {
            return "You found that ore? My grandfather warned me about those veins. 'Never dig too deep,' he said. He was right.";
        }
    }

    // React to ghost carp vision
    if (clues.some(c => c.text.includes('drowned in the pond'))) {
        if (v.id === 'librarian') {
            return "The ghost carp showed you, didn't it? How father died. Drowned in that pond. I always suspected, but now we know.";
        }
        if (v.id === 'farmer') {
            return "The pond... I was there that night, you know. When they drowned Ezekiel. I was too scared to stop them. God forgive me.";
        }
    }

    return null; // Fall back to standard dialogue
}

function talkToVillager() {
    const v = gameState.currentVillager;
    if (!v || v.talkedToday) return;

    v.talkedToday = true;
    v.trust = Math.min(100, v.trust + 8);
    gameState.dailyFlags.talkedToVillager = true; // Track cozy activity

    // First conversation should be about your uncle
    // Track if we've had the intro conversation
    if (!v.hadIntroConversation) {
        v.hadIntroConversation = true;
        gameState.dailyFlags.askedAboutMurder = true; // First conversations ask about uncle
        const introResponse = v.dialogues.aboutUncle || v.dialogues.greeting;
        document.getElementById('villager-dialogue').textContent = `"${introResponse}"`;

        // Add a clue about what they said
        if (v.helpfulInfo && Math.random() < 0.5) {
            addClue(v.name.split(' ')[0], v.helpfulInfo);
            gameState.dailyFlags.foundClueToday = true;
            showToast('New information learned!');
        }
    } else {
        // Subsequent conversations reveal more based on trust
        // Use contextual dialogue if available
        let response = getContextualDialogue(v);

        if (!response) {
            if (v.trust >= 60 && v.dialogues.trust50) {
                response = v.dialogues.trust50;
            } else if (v.trust >= 30 && v.dialogues.trust20) {
                response = v.dialogues.trust20;
            } else {
                // Mix of story hints and personality
                const storyHints = [
                    v.dialogues.aboutUncle,
                    `"Your grandfather... I remember him. He was asking questions too, before he vanished."`,
                    `"Thomas came to see me, you know. The week before he died. He seemed scared."`,
                    `"Be careful who you trust in Hollow Creek. Some secrets are buried deep."`
                ];
                response = storyHints[Math.floor(Math.random() * storyHints.length)];
            }
        }
        document.getElementById('villager-dialogue').textContent = `"${response}"`;
    }

    document.getElementById('trust-fill').style.width = `${v.trust}%`;

    useAction();
    updateVillagerButtons(v);
    renderVillagers();
}

function openGiftModal() {
    const v = gameState.currentVillager;
    if (!v || v.giftedToday) {
        showToast('Already gave a gift today!');
        return;
    }

    const giftEl = document.getElementById('gift-items');
    giftEl.innerHTML = '';

    let hasGifts = false;

    // Crops
    Object.entries(gameState.inventory.crops).forEach(([type, count]) => {
        if (count > 0) {
            hasGifts = true;
            const crop = CROPS[type];
            const isLiked = v.likes?.includes(type);
            const isDisliked = v.dislikes?.includes(type);

            const el = document.createElement('div');
            el.className = `gift-item ${isLiked ? 'liked' : ''} ${isDisliked ? 'disliked' : ''}`;
            el.innerHTML = `
                <span class="gift-icon">${crop.icon}</span>
                <span class="gift-count">×${count}</span>
                ${isLiked ? '<span class="gift-hint">❤️</span>' : ''}
                ${isDisliked ? '<span class="gift-hint">💔</span>' : ''}
            `;
            el.addEventListener('click', () => giveGift(type, 'crop'));
            giftEl.appendChild(el);
        }
    });

    // Fish
    Object.entries(gameState.inventory.fish).forEach(([type, count]) => {
        if (count > 0) {
            hasGifts = true;
            const fish = FISH[type];
            const isLiked = v.likes?.includes(type);
            const isDisliked = v.dislikes?.includes(type);

            const el = document.createElement('div');
            el.className = `gift-item ${fish.special ? 'special-item' : ''} ${isLiked ? 'liked' : ''} ${isDisliked ? 'disliked' : ''}`;
            el.innerHTML = `
                <span class="gift-icon">${fish.icon}</span>
                <span class="gift-count">×${count}</span>
                ${isLiked ? '<span class="gift-hint">❤️</span>' : ''}
                ${isDisliked ? '<span class="gift-hint">💔</span>' : ''}
            `;
            el.addEventListener('click', () => giveGift(type, 'fish'));
            giftEl.appendChild(el);
        }
    });

    // Ore (some villagers like ore, especially Viktor)
    Object.entries(gameState.inventory.ore).forEach(([type, count]) => {
        if (count > 0) {
            hasGifts = true;
            const ore = ORES[type];
            const isLiked = v.likes?.includes(type);
            const isDisliked = v.dislikes?.includes(type);

            const el = document.createElement('div');
            el.className = `gift-item ${ore.special ? 'special-item' : ''} ${isLiked ? 'liked' : ''} ${isDisliked ? 'disliked' : ''}`;
            el.innerHTML = `
                <span class="gift-icon">${ore.icon}</span>
                <span class="gift-count">×${count}</span>
                ${isLiked ? '<span class="gift-hint">❤️</span>' : ''}
                ${isDisliked ? '<span class="gift-hint">💔</span>' : ''}
            `;
            el.addEventListener('click', () => giveGift(type, 'ore'));
            giftEl.appendChild(el);
        }
    });

    if (!hasGifts) {
        giftEl.innerHTML = '<div class="no-gifts">No items to gift! Farm, fish, or mine first.</div>';
    }

    document.getElementById('gift-modal').classList.add('active');
}

function giveGift(itemType, category = 'crop') {
    const v = gameState.currentVillager;

    let inventory, itemData, itemName;
    if (category === 'crop') {
        inventory = gameState.inventory.crops;
        itemData = CROPS[itemType];
        itemName = itemData.name;
    } else if (category === 'fish') {
        inventory = gameState.inventory.fish;
        itemData = FISH[itemType];
        itemName = itemData.name;
    } else if (category === 'ore') {
        inventory = gameState.inventory.ore;
        itemData = ORES[itemType];
        itemName = itemData.name;
    }

    if (!v || inventory[itemType] <= 0) return;

    inventory[itemType]--;
    v.giftedToday = true;
    gameState.dailyFlags.giftedToday = true; // Track cozy activity

    // Track gift count per villager for relationship milestones
    if (!gameState.giftCounts) gameState.giftCounts = {};
    gameState.giftCounts[v.id] = (gameState.giftCounts[v.id] || 0) + 1;

    let trustGain = itemData.giftValue;
    let response;

    if (v.likes?.includes(itemType)) {
        trustGain = Math.floor(trustGain * 1.5);
        response = `${v.name.split(' ')[0]}'s eyes light up! "This is my favorite! Thank you!"`;
    } else if (v.dislikes?.includes(itemType)) {
        trustGain = Math.floor(trustGain * 0.3);
        response = `${v.name.split(' ')[0]} tries to hide their disappointment. "Oh... thanks."`;
    } else {
        response = `${v.name.split(' ')[0]} accepts the gift warmly. "How thoughtful of you!"`;
    }

    // Special responses for certain items
    if (itemType === 'strange_ore') {
        response = `${v.name.split(' ')[0]} recoils. "Where did you find this?! That ore... it shouldn't exist."`;
        trustGain = Math.floor(trustGain * 0.5);
        // But adds a clue
        addClue(v.name.split(' ')[0], `Reacted with fear to the strange ore. They know something about the mine.`);
    } else if (itemType === 'ghost_carp') {
        response = `${v.name.split(' ')[0]} stares at the translucent fish. "The ghost carp... my grandmother said these only appear when the dead are restless."`;
        trustGain = Math.floor(trustGain * 1.2);
    }

    v.trust = Math.min(100, v.trust + trustGain);
    showToast(`+${trustGain} trust!`);

    closeGiftModal();
    document.getElementById('villager-dialogue').textContent = response;
    document.getElementById('trust-fill').style.width = `${v.trust}%`;

    useAction();
    updateVillagerButtons(v);
    renderVillagers();
    renderSeedInventory();
}

function askForGossip() {
    const v = gameState.currentVillager;
    if (!v || v.trust < 40) return;

    // Pick someone to gossip about
    const others = gameState.villagers.filter(o => o.id !== v.id && o.alive && !v.gossipHeard.includes(o.id));

    if (others.length === 0) {
        document.getElementById('villager-dialogue').textContent = `"I've told you everything I know about everyone. My lips are sealed now."`;
        return;
    }

    const target = others[Math.floor(Math.random() * others.length)];
    v.gossipHeard.push(target.id);

    const gossip = v.gossipAbout?.[target.id] || `"${target.name}? They seem... normal enough, I suppose."`;

    addClue(v.name.split(' ')[0], gossip.replace(/"/g, ''));
    document.getElementById('villager-dialogue').textContent = gossip;

    useAction();
    updateVillagerButtons(v);
    renderClues();
}

function learnSecret() {
    const v = gameState.currentVillager;
    if (!v || v.trust < 70 || v.clueRevealed) return;

    v.clueRevealed = true;

    // Is this person the killer or accomplice?
    const isGuilty = v.id === gameState.killer || v.id === gameState.accomplice;
    const clueText = isGuilty ? v.clues.guilty : v.clues.innocent;

    addClue(v.name, clueText);

    document.getElementById('villager-dialogue').textContent = `"I trust you now. Here's something important: ${clueText}"`;

    useAction();
    updateVillagerButtons(v);
    renderClues();
    showToast('Major clue discovered!');
}

function closeVillagerModal() {
    document.getElementById('villager-modal').classList.remove('active');
    gameState.currentVillager = null;
}

function closeGiftModal() {
    document.getElementById('gift-modal').classList.remove('active');
}

// ==========================================
// EXPLORATION
// ==========================================

function isLocationUnlocked(locId) {
    if (gameState.locationsUnlocked.includes(locId)) return true;

    const loc = LOCATIONS[locId];
    if (!loc.unlock) return true;

    if (loc.unlock.day && gameState.day >= loc.unlock.day) {
        gameState.locationsUnlocked.push(locId);
        return true;
    }

    if (loc.unlock.cluesRequired && gameState.clues.length >= loc.unlock.cluesRequired) {
        gameState.locationsUnlocked.push(locId);
        return true;
    }

    return false;
}

function getUnlockHint(locId) {
    const loc = LOCATIONS[locId];
    if (!loc.unlock) return '';
    if (loc.unlock.day) return `Unlocks on Day ${loc.unlock.day}`;
    if (loc.unlock.cluesRequired) return `Need ${loc.unlock.cluesRequired} clues`;
    return 'Locked';
}

function checkLocationUnlocks() {
    Object.keys(LOCATIONS).forEach(id => {
        isLocationUnlocked(id);
    });
    renderLocations();
}

function travelTo(locId) {
    if (!isLocationUnlocked(locId)) return;

    gameState.currentLocation = locId;
    const loc = LOCATIONS[locId];

    // Track forbidden location visits (increases threat)
    const forbiddenLocations = ['northfield', 'ruins', 'mineDeep'];
    if (forbiddenLocations.includes(locId)) {
        gameState.dailyFlags.visitedForbiddenLocation = true;
    }

    // Check for special activities
    if (loc.canFish) {
        showFishingOption(locId);
        return;
    }

    if (loc.canMine) {
        showMiningOption(locId, loc.mineLevel || 1);
        return;
    }

    // Check for discoveries
    if (loc.discoveries) {
        for (const disc of loc.discoveries) {
            if (Math.random() < disc.chance && !gameState.clues.some(c => c.text === disc.clue)) {
                // Add clue directly and show a notification
                addClue('Exploration', disc.clue);
                showDiscoveryEvent(disc.text);
                break; // Only one discovery per visit
            }
        }
    }

    renderLocations();
    useAction();
}

// ==========================================
// FISHING SYSTEM
// ==========================================

function showFishingOption(locId) {
    if (!gameState.inventory.items.includes('fishing_rod')) {
        showEvent('🎣', 'No Fishing Rod',
            "The pond's surface ripples invitingly, but you have nothing to fish with. Finnegan sells fishing rods at the general store.",
            [{ text: 'Maybe later', effectId: null }]
        );
        return;
    }

    showEvent('🎣', 'Hollow Creek Pond',
        "Your grandfather's fishing spot. The water is murky, and strange things are said to live in its depths. The fish here have seen things...",
        [
            { text: 'Cast your line (1 action)', effectId: 'fish_cast' },
            { text: 'Search the shallows', effectId: 'fish_search' },
            { text: 'Leave', effectId: null }
        ]
    );
}

function goFishing() {
    if (!gameState.inventory.items.includes('fishing_rod')) {
        showToast('You need a fishing rod!');
        return;
    }

    useAction();

    // Check what can be caught based on time of day
    const availableFish = Object.entries(FISH).filter(([id, fish]) =>
        fish.timeOfDay.includes(gameState.timeOfDay)
    );

    // Roll for each fish type
    let caught = null;
    for (const [id, fish] of availableFish.sort((a, b) => a[1].rarity - b[1].rarity)) {
        if (Math.random() < fish.rarity) {
            caught = { id, ...fish };
            break;
        }
    }

    if (caught) {
        gameState.inventory.fish[caught.id]++;

        let message = `You caught a ${caught.name}!`;
        if (caught.special) {
            message += ` ${caught.hint}`;
        }

        // Check for clue fragment from this fish
        if (caught.clueFragment) {
            const fragment = caught.clueFragment;
            if (!fragment.requires || fragment.requires(gameState)) {
                if (!gameState.clues.some(c => c.text === fragment.text)) {
                    addClue('Fishing Discovery', fragment.text);
                    gameState.dailyFlags.foundClueToday = true;
                    message += `\n\n${fragment.text}`;
                }
            }
        }

        showEvent(caught.icon, 'Catch!', message, [
            { text: 'Nice!', effectId: caught.special ? `caught_${caught.id}` : null }
        ]);

        // Check for pond discoveries while fishing
        const loc = LOCATIONS.pond;
        if (loc.discoveries && Math.random() < 0.3) {
            for (const disc of loc.discoveries) {
                if (Math.random() < disc.chance && !gameState.clues.some(c => c.text === disc.clue)) {
                    addClue('Fishing', disc.clue);
                    gameState.dailyFlags.foundClueToday = true;
                    break;
                }
            }
        }
    } else {
        const misses = [
            "The fish aren't biting. You feel watched from below the surface.",
            "Something tugs your line, then lets go. Too strong to be a normal fish.",
            "You see a pale shape in the depths. It sees you too.",
            "The water ripples strangely. No fish, but you notice bubbles from a specific spot."
        ];
        showToast(misses[Math.floor(Math.random() * misses.length)]);
    }

    renderAll();
}

// ==========================================
// MINING SYSTEM
// ==========================================

function showMiningOption(locId, mineLevel) {
    if (!gameState.inventory.items.includes('pickaxe')) {
        showEvent('⛏️', 'No Pickaxe',
            "The mine entrance looms before you, dark and foreboding. But you can't mine without proper tools. The blacksmith or Finnegan might have a pickaxe.",
            [{ text: 'Come back with tools', effectId: null }]
        );
        return;
    }

    if (locId === 'mineDeep' && !gameState.inventory.items.includes('lantern')) {
        showEvent('🕳️', 'Too Dark',
            "The deep tunnels are pitch black. Your eyes play tricks - you see shapes moving in the darkness. You need a lantern to venture further.",
            [{ text: 'Retreat to safer tunnels', effectId: null }]
        );
        return;
    }

    const title = mineLevel >= 5 ? 'The Deep Tunnels' : 'Ashworth Mine';
    const desc = mineLevel >= 5
        ? "The air is thick and warm. The walls pulse with that strange ore. Something is very wrong down here."
        : "Your grandfather's mine. The timbers creak ominously. Fresh footprints in the dust - someone else has been here.";

    showEvent('⛏️', title, desc, [
        { text: 'Mine for ore (1 action)', effectId: 'mine_swing' },
        { text: 'Search for clues', effectId: 'mine_search' },
        { text: 'Leave', effectId: null }
    ]);
}

function goMining(mineLevel = 1) {
    if (!gameState.inventory.items.includes('pickaxe')) {
        showToast('You need a pickaxe!');
        return;
    }

    useAction();

    // Higher level = better ore
    const availableOres = Object.entries(ORES).filter(([id, ore]) =>
        ore.minLevel <= mineLevel
    );

    // Roll for ore
    let found = null;
    for (const [id, ore] of availableOres.sort((a, b) => a[1].rarity - b[1].rarity)) {
        const adjustedRarity = ore.rarity * (mineLevel >= ore.minLevel + 2 ? 1.5 : 1);
        if (Math.random() < adjustedRarity) {
            found = { id, ...ore };
            break;
        }
    }

    if (found) {
        gameState.inventory.ore[found.id]++;

        let message = `You found ${found.name}!`;
        if (found.special) {
            message += ` ${found.hint}`;
        }

        // Check for clue fragment from this ore
        if (found.clueFragment) {
            const fragment = found.clueFragment;
            if (!fragment.requires || fragment.requires(gameState)) {
                if (!gameState.clues.some(c => c.text === fragment.text)) {
                    addClue('Mining Discovery', fragment.text);
                    gameState.dailyFlags.foundClueToday = true;
                    message += `\n\n${fragment.text}`;
                }
            }
        }

        showEvent(found.icon, 'Strike!', message, [
            { text: 'Pocket it', effectId: found.special ? `found_${found.id}` : null }
        ]);

        // Check for mine discoveries
        const loc = mineLevel >= 5 ? LOCATIONS.mineDeep : LOCATIONS.mine;
        if (loc.discoveries && Math.random() < 0.35) {
            for (const disc of loc.discoveries) {
                if (Math.random() < disc.chance && !gameState.clues.some(c => c.text === disc.clue)) {
                    addClue('Mining', disc.clue);
                    gameState.dailyFlags.foundClueToday = true;
                    break;
                }
            }
        }
    } else {
        const misses = [
            "Just rock and dust. But you hear something deeper in the tunnels...",
            "Nothing valuable here. You notice scratch marks on the walls - claw marks?",
            "The ore veins are empty here. Someone's been mining recently.",
            "Your pickaxe rings against solid stone. The echo sounds... wrong."
        ];
        showToast(misses[Math.floor(Math.random() * misses.length)]);
    }

    renderAll();
}

// Add event effects for fishing/mining
EVENT_EFFECTS.fish_cast = () => { goFishing(); };
EVENT_EFFECTS.fish_search = () => {
    if (gameState.inventory.items.includes('diving_mask')) {
        addClue('Pond (KEY)', "With the diving mask, you find a waterlogged strongbox at the bottom. Inside: your grandfather's missing journal.");
        addKeyEvidence('grandfather_journal', 'Found Ezekiel\'s journal in the pond');
        gameState.inventory.items.push('grandfather_journal');
        showToast('Found grandfather\'s journal!');
    } else {
        addClue('Pond', "You search the shallows and find fishing weights, old bottles, and... a wedding ring engraved 'E & M'. Your grandparents.");
        showToast('You need a diving mask to search deeper.');
    }
    useAction();
};
EVENT_EFFECTS.mine_swing = () => { goMining(gameState.currentLocation === 'mineDeep' ? 7 : 3); };
EVENT_EFFECTS.mine_search = () => {
    const loc = gameState.currentLocation === 'mineDeep' ? LOCATIONS.mineDeep : LOCATIONS.mine;
    if (loc.discoveries) {
        for (const disc of loc.discoveries) {
            if (Math.random() < disc.chance * 1.5 && !gameState.clues.some(c => c.text === disc.clue)) {
                addClue('Mining', disc.clue);
                showDiscoveryEvent(disc.text);
                useAction();
                return;
            }
        }
    }
    showToast("Nothing new here. Keep digging deeper.");
    useAction();
};

// ==========================================
// SUSPICION & ACCUSATION
// ==========================================

function cycleSuspicion(villagerId) {
    const current = gameState.suspicions[villagerId];
    if (!current) {
        gameState.suspicions[villagerId] = 'suspect';
    } else if (current === 'suspect') {
        gameState.suspicions[villagerId] = 'cleared';
    } else {
        delete gameState.suspicions[villagerId];
    }
    renderClues();
    renderVillagers();
}

function canAccuse() {
    return gameState.clues.length >= 5 && !gameState.accusationMade;
}

function openAccuseModal() {
    if (!canAccuse()) return;

    const modal = document.getElementById('accuse-modal');
    const list = document.getElementById('accuse-list');
    list.innerHTML = '';

    gameState.villagers.filter(v => v.alive).forEach(v => {
        const btn = document.createElement('button');
        btn.className = 'accuse-target';
        btn.innerHTML = `${v.portrait} ${v.name}`;
        btn.addEventListener('click', () => makeAccusation(v));
        list.appendChild(btn);
    });

    modal.classList.add('active');
}

function closeAccuseModal() {
    document.getElementById('accuse-modal').classList.remove('active');
}

function makeAccusation(villager) {
    gameState.accusationMade = true;
    closeAccuseModal();

    const isCorrect = villager.id === gameState.killer;

    if (isCorrect) {
        endGame(true, `You correctly identified ${villager.name} as the killer! Justice for your grandfather and uncle. The village is saved thanks to your detective work.`);
    } else if (villager.id === gameState.accomplice) {
        endGame(true, `${villager.name} was the accomplice! Under pressure, they confessed and revealed the true killer. The conspiracy is exposed!`);
    } else {
        endGame(false, `${villager.name} was innocent! Your false accusation allowed the real killer to escape into the night...`);
    }
}

// ==========================================
// EVENTS & STORY
// ==========================================

function checkForEvents() {
    STORY_EVENTS.forEach(event => {
        if (gameState.eventsTriggered.includes(event.id)) return;

        let shouldTrigger = true;

        if (event.trigger.day && gameState.day !== event.trigger.day) shouldTrigger = false;
        if (event.trigger.timeOfDay && gameState.timeOfDay !== event.trigger.timeOfDay) shouldTrigger = false;
        if (event.trigger.condition && !event.trigger.condition(gameState)) shouldTrigger = false;

        if (shouldTrigger) {
            gameState.eventsTriggered.push(event.id);
            showEvent(event.icon, event.title, event.text, event.choices);
        }
    });
}

function showEvent(icon, title, text, choices = [{ text: 'Continue', effectId: null }]) {
    document.getElementById('event-icon').textContent = icon;
    document.getElementById('event-title').textContent = title;
    document.getElementById('event-text').textContent = text;

    const choicesEl = document.getElementById('event-choices');
    choicesEl.innerHTML = '';

    choices.forEach((choice) => {
        const btn = document.createElement('button');
        btn.className = 'event-choice';
        btn.textContent = choice.text;

        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Close modal
            document.getElementById('event-modal').classList.remove('active');

            // Run effect
            const effectId = choice.effectId;
            if (effectId && EVENT_EFFECTS[effectId]) {
                try {
                    EVENT_EFFECTS[effectId]();
                    showToast('Choice recorded!');
                } catch (err) {
                    console.error('Effect error:', err);
                }
            }

            // Update UI
            renderAll();
        };

        choicesEl.appendChild(btn);
    });

    document.getElementById('event-modal').classList.add('active');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.remove('active');
}

function showDiscoveryEvent(text) {
    showEvent('🔍', 'Discovery!', text, [
        { text: 'Interesting...', effectId: null }
    ]);
}

function addClue(source, text) {
    // Don't add duplicate clues
    if (gameState.clues.some(c => c.text === text)) return;

    gameState.clues.push({
        day: gameState.day,
        source: source,
        text: text
    });

    // Track that we found a clue today (affects threat calculation)
    if (gameState.dailyFlags) {
        gameState.dailyFlags.foundClueToday = true;
    }

    renderClues();
    checkLocationUnlocks();
    checkForEvents(); // Check if this clue triggers a new event
}

function modifyTrust(villagerId, amount) {
    const v = gameState.villagers.find(v => v.id === villagerId);
    if (v) {
        v.trust = Math.max(0, Math.min(100, v.trust + amount));
        renderVillagers();
    }
}

function triggerMurder() {
    const victims = gameState.villagers.filter(v =>
        v.alive &&
        v.id !== gameState.killer &&
        v.id !== gameState.accomplice
    );

    if (victims.length === 0) return;

    const victim = victims[Math.floor(Math.random() * victims.length)];
    victim.alive = false;

    gameState.clues.push({
        day: gameState.day,
        source: 'Murder',
        text: `${victim.name} was found dead. The killer is growing bolder.`
    });

    showEvent('💀', 'Murder!',
        `The village wakes to tragedy. ${victim.name} has been killed! Fear grips Hollow Creek. You must find the killer before they strike again!`,
        [{ text: 'This must stop...', effectId: null }]
    );

    renderVillagers();
    renderClues();
}

function endGame(won, message) {
    gameState.gameOver = true;

    const killer = gameState.villagers.find(v => v.id === gameState.killer);
    const accomplice = gameState.villagers.find(v => v.id === gameState.accomplice);

    document.getElementById('gameover-title').textContent = won ? '🎉 Victory!' : '💀 Game Over';
    document.getElementById('gameover-title').className = won ? 'win' : 'lose';
    document.getElementById('gameover-text').textContent = message;

    let revealHtml = `<h3>The Truth</h3>`;
    revealHtml += `<p>🔪 <strong>The Killer:</strong> ${killer?.name || 'Unknown'}</p>`;
    if (accomplice) {
        revealHtml += `<p>🤝 <strong>The Accomplice:</strong> ${accomplice.name}</p>`;
    }
    if (killer?.clues?.guilty) {
        revealHtml += `<p class="reveal-clue">"${killer.clues.guilty}"</p>`;
    }

    document.getElementById('gameover-reveal').innerHTML = revealHtml;

    // Clear save on game over
    localStorage.removeItem(SAVE_KEY);

    showScreen('gameover-screen');
}

// ==========================================
// UI HELPERS
// ==========================================

function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${viewName}-view`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });
}

// ==========================================
// SAVE/LOAD SYSTEM
// ==========================================

const SAVE_KEY = 'hollowCreekFarm_save_v2';

function saveGame() {
    if (gameState.gameOver) {
        showToast('Cannot save - game is over!');
        return;
    }

    const saveData = {
        version: 2,
        timestamp: Date.now(),
        day: gameState.day,
        timeOfDay: gameState.timeOfDay,
        actionsRemaining: gameState.actionsRemaining,
        coins: gameState.coins,
        threatLevel: gameState.threatLevel,
        killer: gameState.killer,
        accomplice: gameState.accomplice,
        accusationMade: gameState.accusationMade,
        inventory: gameState.inventory,
        plots: gameState.plots,
        clues: gameState.clues,
        eventsTriggered: gameState.eventsTriggered,
        locationsUnlocked: gameState.locationsUnlocked,
        suspicions: gameState.suspicions,
        villagers: gameState.villagers.map(v => ({
            id: v.id,
            trust: v.trust,
            alive: v.alive,
            clueRevealed: v.clueRevealed,
            talkedToday: v.talkedToday,
            giftedToday: v.giftedToday,
            gossipHeard: v.gossipHeard
        }))
    };

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        showToast('Game saved!');
        updateSaveSlotDisplay();
    } catch (e) {
        console.error('Save failed:', e);
        showToast('Save failed!');
    }
}

function loadGame() {
    const saveStr = localStorage.getItem(SAVE_KEY);
    if (!saveStr) {
        showToast('No save found!');
        return false;
    }

    try {
        const save = JSON.parse(saveStr);

        gameState.day = save.day;
        gameState.timeOfDay = save.timeOfDay;
        gameState.actionsRemaining = save.actionsRemaining;
        gameState.coins = save.coins;
        gameState.threatLevel = save.threatLevel;
        gameState.killer = save.killer;
        gameState.accomplice = save.accomplice || null;
        gameState.accusationMade = save.accusationMade;
        gameState.inventory = save.inventory;
        gameState.plots = save.plots;
        gameState.clues = save.clues;
        gameState.eventsTriggered = save.eventsTriggered;
        gameState.locationsUnlocked = save.locationsUnlocked;
        gameState.suspicions = save.suspicions || {};
        gameState.gameOver = false;
        gameState.selectedSeed = null;
        gameState.currentVillager = null;

        gameState.villagers = save.villagers.map(sv => {
            const template = VILLAGER_TEMPLATES.find(t => t.id === sv.id);
            return {
                ...template,
                trust: sv.trust,
                alive: sv.alive,
                clueRevealed: sv.clueRevealed,
                talkedToday: sv.talkedToday,
                giftedToday: sv.giftedToday,
                gossipHeard: sv.gossipHeard || []
            };
        });

        renderAll();
        showScreen('game-screen');
        showToast('Game loaded!');
        return true;
    } catch (e) {
        console.error('Load failed:', e);
        showToast('Save corrupted!');
        return false;
    }
}

function autoSave() {
    if (!gameState.gameOver && gameState.day > 0) {
        try {
            const saveData = {
                version: 2,
                timestamp: Date.now(),
                day: gameState.day,
                timeOfDay: gameState.timeOfDay,
                actionsRemaining: gameState.actionsRemaining,
                coins: gameState.coins,
                threatLevel: gameState.threatLevel,
                killer: gameState.killer,
                accomplice: gameState.accomplice,
                accusationMade: gameState.accusationMade,
                inventory: gameState.inventory,
                plots: gameState.plots,
                clues: gameState.clues,
                eventsTriggered: gameState.eventsTriggered,
                locationsUnlocked: gameState.locationsUnlocked,
                suspicions: gameState.suspicions,
                villagers: gameState.villagers.map(v => ({
                    id: v.id,
                    trust: v.trust,
                    alive: v.alive,
                    clueRevealed: v.clueRevealed,
                    talkedToday: v.talkedToday,
                    giftedToday: v.giftedToday,
                    gossipHeard: v.gossipHeard
                }))
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        } catch (e) {
            console.error('Auto-save failed:', e);
        }
    }
}

function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
    updateSaveSlotDisplay();
    showToast('Save deleted!');
}

function hasSaveData() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

function getSaveInfo() {
    const str = localStorage.getItem(SAVE_KEY);
    if (!str) return null;
    try {
        const save = JSON.parse(str);
        const date = new Date(save.timestamp);
        return {
            day: save.day,
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    } catch (e) {
        return null;
    }
}

function updateSaveSlotDisplay() {
    const continueBtn = document.getElementById('continue-btn');
    const deleteBtn = document.getElementById('delete-save-btn');
    const saveInfo = document.getElementById('save-info');

    if (hasSaveData()) {
        const info = getSaveInfo();
        continueBtn?.classList.remove('hidden');
        deleteBtn?.classList.remove('hidden');
        if (info && saveInfo) {
            saveInfo.textContent = `Day ${info.day} • ${info.date} ${info.time}`;
            saveInfo.classList.remove('hidden');
        }
    } else {
        continueBtn?.classList.add('hidden');
        deleteBtn?.classList.add('hidden');
        saveInfo?.classList.add('hidden');
    }
}

// ==========================================
// PROLOGUE SYSTEM
// ==========================================

const PROLOGUE_SCENES = [
    {
        html: `
            <div class="prologue-scene">
                <h2>39 Years Ago</h2>
                <span class="icon">⛏️</span>
                <p>Ezekiel Ashworth owned a silver mine in Hollow Creek. He was a good man—a family man—until he started digging too deep.</p>
                <p>One autumn night, he vanished. No body. No goodbye. Just whispers that he'd <span class="dramatic">run away with another woman</span>.</p>
                <p class="whisper">His family never believed it.</p>
            </div>
        `
    },
    {
        html: `
            <div class="prologue-scene">
                <h2>Three Months Ago</h2>
                <span class="icon">📜</span>
                <p>A forgotten law office discovered a sealed document: <span class="highlight">Ezekiel's will</span>, dated the day he disappeared.</p>
                <p>It left everything—the farm, the mine, the <em>burden of truth</em>—to a grandchild not yet born.</p>
                <p>That grandchild is <span class="highlight">you</span>.</p>
            </div>
        `
    },
    {
        html: `
            <div class="prologue-scene">
                <h2>Six Weeks Ago</h2>
                <span class="icon">💀</span>
                <p>Your uncle Thomas traveled to Hollow Creek to investigate your grandfather's disappearance.</p>
                <p>He called once: <em>"I found something. Something they've been hiding for decades."</em></p>
                <p>Three days later, he was <span class="dramatic">dead</span>. Heart failure, they said.</p>
                <p class="whisper">He was 42 and ran marathons.</p>
            </div>
        `
    },
    {
        html: `
            <div class="prologue-scene">
                <h2>Yesterday</h2>
                <span class="icon">✉️</span>
                <p>Two letters arrived together. The first, your uncle's last words:</p>
                <div class="letter">
                    "If you're reading this, I'm dead. Don't believe what they tell you. Come to Hollow Creek. Trust no one except Iris. The truth is in the mine."
                    <div class="signature">— Uncle Thomas</div>
                </div>
            </div>
        `
    },
    {
        html: `
            <div class="prologue-scene">
                <h2>Yesterday</h2>
                <span class="icon">📋</span>
                <p>The second letter was older—your grandfather's will, finally unsealed:</p>
                <div class="letter">
                    "To my grandchild: I leave you the farm, the mine, and the burden of truth. I discovered what lies beneath Hollow Creek. They silenced me for it. Don't let them win."
                    <div class="signature">— Grandfather Ezekiel, 1987</div>
                </div>
            </div>
        `
    },
    {
        html: `
            <div class="prologue-scene">
                <h2>Today</h2>
                <span class="icon">🚌</span>
                <p>The bus drops you at the edge of town. Hollow Creek looks peaceful—<em>quaint</em>, even. Autumn leaves drift across cobblestone streets.</p>
                <p>But you know better now.</p>
                <p><span class="dramatic">Two generations of your family died</span> for whatever secret this village keeps.</p>
                <p class="highlight">You intend to be the one who survives.</p>
            </div>
        `
    }
];

let currentPrologueScene = 0;

function startPrologue() {
    currentPrologueScene = 0;
    showScreen('prologue-screen');
    renderPrologueScene();
}

function renderPrologueScene() {
    const textEl = document.getElementById('prologue-text');
    const btnEl = document.getElementById('prologue-continue');

    if (currentPrologueScene < PROLOGUE_SCENES.length) {
        textEl.innerHTML = PROLOGUE_SCENES[currentPrologueScene].html;
        btnEl.textContent = currentPrologueScene === PROLOGUE_SCENES.length - 1 ? 'Begin' : 'Continue';
    }
}

function advancePrologue() {
    currentPrologueScene++;

    if (currentPrologueScene >= PROLOGUE_SCENES.length) {
        // Prologue complete, start the game
        showScreen('game-screen');
        initGame();
    } else {
        renderPrologueScene();
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    updateSaveSlotDisplay();

    // Title screen - New Game starts prologue
    document.getElementById('start-btn')?.addEventListener('click', () => {
        startPrologue();
    });

    // Prologue continue button
    document.getElementById('prologue-continue')?.addEventListener('click', () => {
        advancePrologue();
    });

    document.getElementById('continue-btn')?.addEventListener('click', loadGame);

    document.getElementById('delete-save-btn')?.addEventListener('click', () => {
        if (confirm('Delete your saved game?')) deleteSave();
    });

    document.getElementById('how-to-btn')?.addEventListener('click', () => {
        showScreen('how-to-screen');
    });

    document.getElementById('back-to-title')?.addEventListener('click', () => {
        showScreen('title-screen');
    });

    // Navigation
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    document.getElementById('save-btn')?.addEventListener('click', saveGame);

    document.getElementById('rest-btn')?.addEventListener('click', () => {
        if (gameState.actionsRemaining > 0) {
            advanceTime();
            showToast('Time passes...');
        }
    });

    // Modals
    document.getElementById('close-modal')?.addEventListener('click', closeVillagerModal);
    document.getElementById('close-gift-modal')?.addEventListener('click', closeGiftModal);
    document.getElementById('close-accuse-modal')?.addEventListener('click', closeAccuseModal);

    // Villager actions
    document.getElementById('talk-btn')?.addEventListener('click', talkToVillager);
    document.getElementById('gift-btn')?.addEventListener('click', openGiftModal);
    document.getElementById('gossip-btn')?.addEventListener('click', askForGossip);
    document.getElementById('secret-btn')?.addEventListener('click', learnSecret);

    // Play again
    document.getElementById('play-again-btn')?.addEventListener('click', () => {
        showScreen('game-screen');
        initGame();
    });

    // Close modals on backdrop
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
});
