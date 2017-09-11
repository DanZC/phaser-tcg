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
        this.index = 0;
        this.role = null; //Role applied to card, if applicable
    }

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
    constructor(slot, card, op) {
        var d = card.index;
        var game = Client.game;
        this.isOpponents = op;
        this.obj = game.add.button(
            slot.obj.x, 
            slot.obj.y, 
            'cards',
            this.click,
            this
        );
        this.obj.anchor.setTo(0.5, 0.5);
        this.obj.height = 140;
        this.obj.width = 104;
        this.obj.angle = 90;
        if(op) { this.obj.angle *= -1; }
        this.card = card;
        this.game = game;
        this.ls = Client;
        this.slot = slot;
        this.state = game.state.getCurrentState();
        this.tween = game.add.tween(this.obj);
    }

    click() {
        var local = this.ls.cardsys.duel.local;
        if(this.isOpponents) {
            this.state.obj.pv.x = this.game.world.centerX;
            this.state.obj.pv.y = this.game.world.centerY;
            this.state.obj.pv.key = 'cards';
            if(this.card.index !== 0 || this.card.index > CardIndex.length) {
                this.state.obj.pv.frame = this.card.index - 1;
            } else {
                this.state.obj.pv.frame = UNDEFINED_CARD_INDEX;
            }
            return;
        }
        if(local.selected === this.card) {
            this.state.obj.pv.x = this.game.world.centerX;
            this.state.obj.pv.y = this.game.world.centerY;
            this.state.obj.pv.key = 'cards';
            if(this.card.index !== 0 || this.card.index > CardIndex.length) {
                this.state.obj.pv.frame = this.card.index - 1;
            } else {
                this.state.obj.pv.frame = UNDEFINED_CARD_INDEX;
            }
        } else {
            local.selected = this.card;
        }
        Client.sendMove("SELECT DECK");
    }

    move(dest) {
        var distance = Phaser.Math.distance(this.obj.x, this.obj.y, dest.x, dest.y);
        var duration = distance*10;
        this.obj.input.enabled = false;
        this.tween.onComplete.add(function(obj, tween) {
            obj.input.enabled = true;
        });
        this.tween.to(dest, duration, Phaser.Easing.Quadratic.InOut);
        this.tween.start();
    }

    update() {
        if(this.card.index !== 0 || this.card.index > CardIndex.length) {
            this.obj.frame = this.card.index - 1;
        } else {
            this.obj.frame = UNDEFINED_CARD_INDEX;
        }
        if(this.ls.cardsys.duel.local.selected === this.card) {
            this.obj.tint = 0x7F7FFF;
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

    shuffle() {
        var len = this.card.length;
        for(i = len-1; i > 1; i--) {
            j = getRandomInt(0, i+1);
            var c = this.card[j]; //Move reference into c
            this.card[j] = this.card[i]; //J references I
            this.card[i] = c;   //I references C
        }
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

const SlotFrame = {
    UNDEFINED : 0,
    DISABLED : 1,
    OPEN : 2
}

class Slot {
    constructor(pos, type, op) {
        this.type = type;
        this.isOpponents = op;
        this.card = null;
        var game = Client.game;
        this.obj = game.add.image(
            game.world.centerX + pos.x, 
            game.world.centerY + pos.y, 
            'cardmask'
        );
        this.obj.anchor.setTo(0.5, 0.5);
        this.obj.height = 140;
        this.obj.width = 104;
        this.obj.angle = 90;
        this.obj.frame = SlotFrame.UNDEFINED;
        this.name = "";
        this.ls = Client;
    }

    empty() {
        return (this.card === null);
    }

    click() {
        var duel = this.ls.cardsys.duel;
        var player = duel.player;
        if(!duel.myTurn) return;
        if(duel.local.selected !== null) {
            var local = duel.local;
            local.selected.move({x: this.obj.x, y: this.obj.y});
            this.card = local.selected;
        }
    }

    update() {
        var duel = this.ls.cardsys.duel;
        var player = duel.player;
        if(!duel.myTurn) {
            
        }
        if(duel.local.selected !== null) {
            var local = duel.local;
            local.selected.move({x: this.obj.x, y: this.obj.y});
            this.card = local.selected;
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