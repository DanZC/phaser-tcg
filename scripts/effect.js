const EffectFrequency = {
    NEVER: 0,
    TURN: 1,
    ONATTACK: 2,
    ONDEFEND: 3,
    ONDEFEAT: 4,
    ONSTREAM: 5
};

const EffectType = {
    AUTO : 0,
    ACTIVATE : 1,
    TRIGGER : 2,
    TRIGGER_F : 3,
    CHAIN : 4,
    CONTINUOUS : 5
}

const EffectRange = {
    NONE : 0b0,
    CHANNEL_ZONES : 0b1,
    MEMBER_ZONE_CURRENT : 0b10,
    MEMBER_ZONE_OPPOSITE : 0b100,
    MEMBER_ZONES: 0b110,
    MEME_ZONES : 0b1000,
    FIELD : 0b1111,
    OFFLINE : 0b10000,
    FIELD_OFFLINE : 0b11111,
    DECK : 0b100000,
    ALL : 0b111111
}

const EffectCode = {
    NONE : 0,
    UPDATE_ATK : 1,
    UPDATE_DEF : 2,
    UPDATE_MAX_HP : 4,
    UPDATE_LEVEL : 8,
    ADD_CARD_FROM_DECK : 16,
    ADD_CARD_FROM_OFFLINE : 32,
    ADD_CARD_FROM_FIELD : 64
}

const EffectSide = {
    SELF : 0,
    OPPONENT : 1,
    BOTH : 2
}

CardEffect = {};

class Effect {
    constructor() {
        this.duel = Game.getCurrentDuel();
        this.type = EffectType.ACTIVATE;
        this.range = EffectRange.FIELD;
        this.range_side = EffectSide.SELF;
        this.code = EffectCode.NONE;
        this.value = function(e,c){};
        this.action = function(e,c,val,filter){};
        this.afilter = function(e,c){};
    }

    setRange(rg, sides) {
        this.range = rg;
        this.range_side = sides;
    }

    setType(ty) {
        this.type = ty;
    }

    setValue(fn) {
        this.value = fn;
    }

    setAction(act, filter) {
        this.action = act;
        this.afilter = filter;
    }
}

class EffectChain {
    constructor() {
        this.link = [];
    }

    addToChain(effect) {
        this.link.push(effect);
    }

    resolve() {
        for(i in this.link) {
            this.link[i].resolve();
        }
    }
}