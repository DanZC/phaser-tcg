//Bad "enum", because Javascript doesn't have bultin enums.
const CardType = {
    UNDEFINED : 0,
    MEMBER : 1,
    ROLE : 2,
    CHANNEL : 3,
    MEME : 4
};

CardIndex = [] //This will be defined in felfdip.js

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

class Card {
    constructor() {
        this.type = CardType.UNDEFINED;
        this.index = 0;
    }

    onActivate(ds) {};
    onDiscard(ds) {};
    passiveEffect(ds) {};

    set_index(index) {
        this.index = index;
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

class MemberCard extends Card {
    constructor(index) {
        this.type = CardType.MEMBER;
        this.index = index;
        this.color = index.color;
    }
}