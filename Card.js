const DuelPhase = {
    WAIT : 0,
    DRAW : 1,
    EFFECT : 2,
    ACTION : 3,
    BATTLE : 4,
    DAMAGE : 5,
    END : 6
};
exports.DuelPhase = DuelPhase;

const ChannelType = {
    NON : 0,
    SRS : 1,
    GMG : 2,
    MDA : 3,
    MTR : 4,
    MEM : 5
};
exports.ChannelType = ChannelType;

//Bad "enum", because Javascript doesn't have bultin enums.
const CardType = {
    UNDEFINED : 0,
    MEMBER : 1,
    ROLE : 2,
    CHANNEL : 3,
    MEME : 4
};
exports.CardType = CardType;

const AnimType = {
	NONE: 0,
	TARGET: 1,
	EFFECT: 2,
	SHUFFLE: 3,
	DESTROY: 4,
	BOUNCE: 5,
	ATTACK: 6,
    TOPGRAVE: 7,
    FLIPUP: 8,
    FLIPDOWN: 9,
    REVEAL: 10
};
exports.AnimType = AnimType;

const CardLocation = {
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
};
exports.CardLocation = CardLocation;

//The bottom left-most card in cards.png. It is the same texture rect used for facedown cards.
const UNDEFINED_CARD_INDEX = 159;
exports.UNDEFINED_CARD_INDEX = UNDEFINED_CARD_INDEX;

const CardColor = {
    NONE : 0,
    RED : 1,
    ORN : 2,
    YLW : 3,
    GRN : 4,
    BLU : 5,
    PPL : 6,
    PNK : 7,
    GRY : 8
}
exports.CardColor = CardColor;

const MemeCategory = {
	NML : 0,
	CTN : 1,
    RSP : 2,
    VRT : 3
}
exports.MemeCategory = MemeCategory;

//Unused
const CardStatus = {
    OFFLINE : 0,
    ONLINE : 1,
    IDLE : 2,
    DONOTDISTURB : 3,
    STREAMING : 4
}
exports.CardStatus = CardStatus;

class Card {
    constructor() {
        this.type = CardType.UNDEFINED;
		this.category = MemeCategory.CTN;
        this.status = CardStatus.ONLINE;
        this.index = 0;
        this.role = null; //Role applied to card, if applicable
        this.obj = null;
        this.attacks = 1;
        this.currentHP = 0;
        this.currentHPCTR = this.currentHP;
        this.name = "";
        this.original_name = "";
        this.mod = {
            hp: 0,
            atk: 0,
            def: 0
        };
    }

	//Sets the card index.
    set_index(index) {
        this.index = index;
        this.update();
        this.currentHP = this.hp;
        this.currentHPCTR = this.currentHP;
    }

    boost(stat, amt) {
        this.mod[stat] += amt;
    }

    nerf(stat, amt) {
        this.mod[stat] -= amt;
    }

    //Makes the instance card a copy of a card defined in CardIndex, giving the instance
    //card the CardIndex's property values.
    update() {
        var protocard = CardIndex[this.index];
        for(var prop in protocard) {
            if('prop' !== 'name') {
                this[prop] = protocard[prop]; //Copies over the properties from the protocard
            }
        }
        if(protocard !== undefined)
            this.original_name = protocard['name'];
    }

    isMember() { return this.type == CardType.MEMBER; }
    isChannel() { return this.type == CardType.CHANNEL; }
    isMeme() { return this.type == CardType.MEME; }
    isRole() { return this.type == CardType.ROLE; }

    getName() { return this.name; }
    getOriginalName() { return this.original_name; }
    hasOriginalName() { return this.name == this.card.original_name; }

    getAttack() { return this.atk; }
    getDefense() { return this.def; }
    getLevel() { return this.lvl; }

    getMemeCategory() { return this.category; }
    
    getChannelSubject() { return this.subject; }

    damage(dmg) { 
        this.currentHP = this.hp - dmg; 
        if(this.currentHP <= 0) {
            this.currentHP = 0;
            return true;
        }
        return false;
    }

    resetAttacks() { this.attacks = 1; }
}
exports.Card = Card;

class Deck {
    constructor() {
        this.card = [];
    }

	//Creates a copy of the deck.
    copy() {
        var d = new Deck();
        for(i in this.card) {
            var c = new Card();
            c.set_index(this.card[i].index);
            d.add(c);
        }
        return d;
    }

	//Create a raw copy of a list of cards in the deck.
    rawcopy() {
        var d = [];
        for(i in this.card) {
            d.push(this.card[i].index);
        }
        return d;
    }

    fromJSON(json) {
        for(i in json) {
            var c = new Card();
            c.set_index(json[i]);
            this.add(c);
        }
    }

    fromRaw(raw) {
        for(i in raw) {
            var c = new Card();
            c.set_index(raw[i]);
            this.add(c);
        }
    }

	//Pushes a card into the deck.
    add(card) {
        this.card.push(card);
    }

	//Returns the top of the deck.
    get_top() {
        return this.card[this.card.length - 1]
    }

    //Returns a filtered list of cards in the deck
    getFilteredList(filter) {
        var fl = [];
        for(i in this.card) {
            var c = this.card[i];
            if(filter(c))
                fl.push(c);
        }
        return fl;
    }

    //Removes a card from the deck.
    remove(card) {
        for(i in this.card) {
            var c = this.card[i];
            if(c === card)
                this.card.splice(i, 1);
        }
    }

	//Shuffles the deck.
    shuffle() {
        var len = this.card.length;
        for(i = len-1; i > 1; i--) {
            var j = getRandomInt(0, i+1);
            var c = this.card[j]; //Move reference into c
            this.card[j] = this.card[i]; //J references I
            this.card[i] = c;   //I references C
        }
    }
	
    //Sorts deck
    sort() {
        this.card.sort(function(a,b){ return a.index - b.index; });
    }

	//Removes the card at the top of the deck and returns it.
    draw() {
        return this.card.pop();
    }

	//Updates the cards.
    update() {
        for(var i in this.card) {
            this.card[i].update();
        }
    }
}
exports.Deck = Deck;

function make_deck(rawDeck) {
    var deck = new Deck();
    for(i in rawDeck) {
        var card = new Card();
        card.set_index(rawDeck[i]);
        deck.add(card);
    }
    return deck;
}
exports.make_deck = make_deck;

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
exports.getRandomInt = getRandomInt;

const SlotType = {
    UNDEFINED : 0,
    MEMROLE : 1,
    CHANNEL : 2,
    MEME : 3,
    DECK : 4,
    OFFLINE : 5
}
exports.SlotType = SlotType;

const MoveType = {
    SURRENDER : 0,
    DRAW : 1,
    PLAY : 2,
    DISCARD : 3,
    SENDTOGRAVE : 4,
    PHASE : 5,
    ATTACK : 6,
    ACTIVATE : 7
}
exports.MoveType = MoveType;

class Slot {
    constructor(type, id, owner) {
        this.card = null;
        this.id = id;
        this.index = -1;
        this.type = type;
        this.owner = owner;
        this.role = -1;
        this.hp = 0;
    }

    set_card(c) {
        this.card = c;
        this.id = c.index
        this.hp = c.currentHP;
    }

    get_card() {
        return this.card;
    }

    is_empty() {
        return this.card == null;
    }

    remove_card() {
        this.card = null;
        this.id = -1;
    }
}
exports.Slot = Slot;