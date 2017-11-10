//Bad "enum", because Javascript doesn't have bultin enums.
const CardType = {
    UNDEFINED : 0,
    MEMBER : 1,
    ROLE : 2,
    CHANNEL : 3,
    MEME : 4
};

const UNDEFINED_CARD_INDEX = 159;

CardIndex = []

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

const CardStatus = {
    OFFLINE : 0,
    ONLINE : 1,
    IDLE : 2,
    DONOTDISTURB : 3,
    STREAMING : 4
}

class Card {
    constructor() {
        this.type = CardType.UNDEFINED;
        this.status = CardStatus.ONLINE;
        this.index = 0;
        this.role = null; //Role applied to card, if applicable
        this.obj = null;
        this.mod = {
            hp: 0,
            atk: 0,
            def: 0
        };
    }

    set_index(index) {
        this.index = index;
        this.update();
        this.currentHP = this.hp;
    }

    boost(stat, amt) {
        this.mod[stat] += amt;
    }

    //Makes the instance card a copy of a card defined in CardIndex, giving the instance
    //card the CardIndex's property values.
    update() {
        var protocard = CardIndex[this.index];
        for(var prop in protocard) {
            this[prop] = protocard[prop]; //Copies over the properties from the protocard
        }
    }
}

class Deck {
    constructor() {
        this.card = [];
    }

    copy() {
        var d = new Deck();
        for(i in this.card) {
            var c = new Card();
            c.set_index(this.card[i].index);
            d.add(c);
        }
        return d;
    }

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
            add(c);
        }
    }

    add(card) {
        this.card.push(card);
    }

    get_top() {
        return this.card[this.card.length - 1]
    }

    shuffle() {
        var len = this.card.length;
        for(i = len-1; i > 1; i--) {
            j = getRandomInt(0, i+1);
            var c = this.card[j]; //Move reference into c
            this.card[j] = this.card[i]; //J references I
            this.card[i] = c;   //I references C
        }
    }

    draw() {
        return this.card.pop();
    }

    update() {
        for(var i in this.card) {
            this.card[i].update();
        }
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}