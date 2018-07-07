class CardSystem {
    constructor() {
        this.deck = [random_deck()]; //Plan on having multiple decks available
        this.player = new Player();
        this.player.deck = this.deck[0].copy();
        this.duel = null;
        this.player.duel = this.duel;
    }

    reset() {
        this.player.deck = this.deck[0].copy();
        this.duel = null;
        this.player.duel = this.duel;
    }
}

class CardObject {
    constructor(slot, card, op, parent) {
        var d = card.index;
        var game = Client.game;
        this.parent = parent;
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
        
        this.text = game.add.text(
            slot.obj.x, 
            slot.obj.y, 
            "HP   0/ 0\nATK  0\nDEF  0", {
            font: "16px Courier New",
            fill: "#ffffff",
            stroke: '#000000',
            align: "left"
        });
        this.text.strokeThickness = 4;
        this.text.anchor.setTo(0.5, 0.5);

        this.card = card;
        if(this.card.type != CardType.MEMBER) {
            this.text.text = "";
        }
        this.revealed = !this.isOpponents;
        card.obj = this;
        this.game = game;
        this.ls = Client;
        this.slot = slot;
        this.channel = null;
        this.state = game.state.getCurrentState();
        this.parent.add(this.obj);
    }

    click() {
        var local = this.ls.cardsys.duel.local;
        var duel = this.ls.cardsys.duel;
        if(this.isOpponents) {
            if(!this.revealed) return;
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
        if(duel.phase === DuelPhase.DRAW) {
            if(this.slot.type === SlotType.DECK) {
                if(duel.draws < 5) {
                    this.draw();
                }
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
        if(this.slot !== null) {
            Client.sendMove("SELECT " + this.slot.name);
        }
    }

    draw() {
        var duel = this.ls.cardsys.duel;
        if(this.isOpponents) {
            duel.opponent.deck.draw();
        } else {
            duel.player.deck.draw();
            var next = new CardObject(this.slot, duel.player.deck.get_top(), this.isOpponents, this.parent);
            this.parent.bringToTop(this.obj);
            this.state.obj.local.deck = next;
            this.move({
                x: 104,
                y: (duel.local.hand.length * 104) + 132
            });
            duel.local.hand.push(this);
            this.slot = null;
            duel.draws++;
            if(duel.draws >= 5) {
                duel.phase++;
                duel.effectPhase();
            }
        }
        Client.sendMove("DRAW");
    }

    move(dest) {
        //var distance = Phaser.Math.distance(this.obj.x, this.obj.y, dest.x, dest.y);
        var duration = 250;
        var local = this.ls.cardsys.duel.local;
        local.selected = null;
        this.obj.input.enabled = false;
        var tween = this.game.add.tween(this.obj).to(dest, duration, Phaser.Easing.Quadratic.InOut);
        tween.onComplete.addOnce(function(obj, tween) {
            obj.input.enabled = true;
        });
        tween.start();

        var tween2 = this.game.add.tween(this.text).to(dest, duration, Phaser.Easing.Quadratic.InOut);
        tween2.onComplete.addOnce(function(obj, tween2) {
        });
        tween2.start();
    }

    update() {
        if(this.revealed !== true) {
            this.obj.frame = UNDEFINED_CARD_INDEX;
            this.text.text = "";
            return;
        }
        if(this.card.index > 0 && this.card.index < CardIndex.length) {
            this.obj.frame = this.card.index - 1;
        } else {
            this.obj.frame = UNDEFINED_CARD_INDEX;
        }
        if(this.ls.cardsys.duel.local.selected === this.card) {
            this.obj.tint = 0x7F7FFF;
        } else {
            this.obj.tint = 0xFFFFFF;
        }
        if(this.card.type == CardType.MEMBER) {
            this.text.text = "HP  " + this.card.hp + "/ " + this.card.hp + "\nATK " + this.card.atk + "\nDEF " + this.card.def;
        }
    }
}

const ChannelType = {
    NON : 0,
    SRS : 1,
    GMG : 2,
    MDA : 3,
    MTR : 4,
    MEM : 5
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

//Damage calculation function
function calcDamage(atk, def) {
    var dmg = Math.round((atk * 1.5) - (def * 1.5));
    if(dmg < 1) dmg = 1;
    return dmg;
}

//Returns a random deck
function random_deck() {
    var cards = 40;
    var deck = new Deck();
    for(i = 0; i < cards; i++) {
        var n = getRandomInt(1, 152);
        var c = new Card();
        c.set_index(n);
        deck.add(c);
    }
    return deck;
}

function loadCardData(str) {
    CardIndex = JSON.parse(str);
}

//Returns whether a card can be moved to a slot.
function validSlot(card, slot, duel) {
    if(!slot.empty()) return false;
    if(card.type === CardType.CHANNEL && slot.type === SlotType.CHANNEL) {
        return true;
    }
    if((card.type === CardType.ROLE || card.type === CardType.MEMBER) && 
        slot.type === SlotType.MEMROLE
    ) {
        if(card.type === CardType.MEMBER && 
            card.lvl > 1) return (
                duel.local.getLevelOneMembers().length > card.lvl - 2
            );
        return true; 
    }
    return false;
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

//Card slot object.
class Slot {
    constructor(pos, type, op) {
        this.type = type;
		
		//Whether the slot is controlled by the opponent.
        this.isOpponents = op;
		
		//The card that is in this slot.
        this.card = null;
        var game = Client.game;
		
		//The button object.
        this.obj = game.add.button(
            game.world.centerX + pos.x, 
            game.world.centerY + pos.y, 
            'cardmask',
            this.click,
            this
        );

        this.obj.anchor.setTo(0.5, 0.5);
        this.obj.height = 140;
        this.obj.width = 104;
        this.obj.angle = 90;
        this.obj.frame = SlotFrame.UNDEFINED;
		
		//The name of the slot.
        this.name = "";
        this.ls = Client;
    }

	//Returns true if a card is not in this slot. False otherwise.
    empty() {
        return (this.card === null);
    }

	//Called when the user clicks the card slot.
    click() {
        var duel = this.ls.cardsys.duel;
        var player = duel.player;
        if(duel.turn !== player) return;
        if(duel.local.selected !== null) {
            var local = duel.local;
            var cobj = local.selected.obj;
            var c = local.selected;
            if(validSlot(c, this, duel)) {
                cobj.move({x: this.obj.x, y: this.obj.y});
                this.card = cobj;
                if(cobj.slot !== null) {
                    cobj.slot.card = null;
                }
                cobj.slot = this;
                local.selected = null;
            }
        }
    }

    update() {
        var duel = this.ls.cardsys.duel;
        var player = duel.player;
        if(duel.turn !== player) {
            this.obj.frame = 1;
        }
        if(duel.local.selected !== null) {
            if(duel.local.selected === this.card) {
                this.obj.frame = 0;
                return;
            }
            if(validSlot(duel.local.selected, this, duel)) {
                this.obj.frame = 2;
            } else {
                this.obj.frame = 1;
            }
        } else {
            this.obj.frame = 0;
        }
    }
}

//Player data object.
class Player {
    constructor() {
		//The player's active deck.
        this.deck = random_deck();
		
		//The player's current active duel.
        this.duel = null;
		
		//The player's registered name.
        this.name = null;
    }
}