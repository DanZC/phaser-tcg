//Bad "enum", because Javascript doesn't have bultin enums.
const CardType = {
    UNDEFINED : 0,
    MEMBER : 1,
    ROLE : 2,
    CHANNEL : 3,
    MEME : 4
};

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

class CardSystem {
    constructor() {
        this.deck = [random_deck()]; //Plan on having multiple decks available
        this.player = new Player();
        this.player.deck = this.deck[0];
        this.duel = new DuelState(this.player, new Player()); //State
        this.player.duel = this.duel;
    }
}

class CardObject {
    constructor(pos, card, op) {
        var d = card.index;
        var game = Client.game;
        this.isOpponents = op;
        this.obj = game.add.button(
            game.world.centerX + pos.x, 
            game.world.centerY + pos.y, 
            'card_' + d.toString(),
            this.click,
            this
        );
        this.obj.anchor.setTo(0.5, 0.5);
        this.obj.height = 141;
        this.obj.width = 105;
        this.obj.angle = 90;
        if(op) { this.obj.angle *= -1; }
        this.card = card;
        this.game = game;
        this.ls = Client;
    }

    click() {
        var sel = this.ls.cardsys.duel.local.selected;
        if(this.isOpponents) return;
        if(sel === this.card) {
            this.ls.obj.pv.x = this.game.world.centerX;
            this.ls.obj.pv.y = this.game.world.centerY;
            this.ls.obj.pv.key = 'card_' + this.card.index.toString();
        } else {
            sel = this.card;
        }
        Client.updateState(this.ls.cardsys.duel)
    }

    move(dest) {
        var tween = game.add.tween(this.obj);
        var distance = Phaser.Math.distance(this.obj.x, this.obj.y, dest.x, dest.y);
        var duration = distance*10;
        this.tween = tween;
        this.obj.input.enabled = false;
        tween.onComplete.add(function(obj, tween) {
            obj.input.enabled = true;
        });
        tween.to(dest, duration);
        tween.start();
    }

    update() {
        if(this.ls.cardsys.duel.local.selected === this.card) {
            this.obj.tint = 0xFF7F7F;
        } else {
            this.obj.tint = 0xFFFFFF;
        }
    }
}

const ChannelType = {
    SRS : 1,
    GMG : 2,
    MDA : 3,
    MTR : 4,
    MEM : 5
}

class Deck {
    constructor() {
        this.card = [];
    }

    add(card) {
        this.card.push(card);
    }

    get_top() {
        return this.card[this.card.length - 1]
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

//Returns a random deck
function random_deck() {
    var cards = 40;
    var deck = new Deck();
    for(i = 0; i < cards; i++) {
        var n = getRandomInt(1, 3);
        var c = new Card();
        c.set_index(n);
        deck.add(c);
    }
    return deck;
}

function loadCardData(str) {
    CardIndex = JSON.parse(str);
}

const SlotType = {
    UNDEFINED : 0,
    MEMROLE : 1,
    CHANNEL : 2,
    MEME : 3,
    DECK : 4,
    OFFLINE : 5
}

class Slot {
    constructor(ls, type, pos) {
        this.type = type;
        this.card = null;
        var game = ls.game;
        this.obj = game.add.image(
            game.world.centerX + pos.x, 
            game.world.centerY + pos.y, 
            'empty',
            this.click,
            this
        );
        this.obj.anchor.setTo(0.5, 0.5);
        this.obj.height = 141;
        this.obj.width = 105;
        this.obj.angle = 90;
        this.ls = ls;
    }

    empty() {
        return (this.card === null);
    }

    click() {
        var duel = this.ls.cardsys.duel;
        var player = duel.player;
        if(!duel.myTurn) return;
        if(duel.local.selected !== null) {
            var sel = this.ls.cardsys.duel.local.selected;
            sel.move({x: 0,y: 0});
        }
    }
}

class Player {
    constructor() {
        this.deck = random_deck();
        this.duel = null;
        this.name = null;
    }
}