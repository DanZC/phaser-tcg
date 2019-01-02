//A container for data pertaining to the local card game state. Defines the decks stored locally as well as the local player data.
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
        this.player.prizeTokens = 0;
    }
}

//An object representing a card. Clickable.
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
        this.obj.p = this;
        
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
        
        this.hpCTR = 0;

        this.revealed = !this.isOpponents;
        card.obj = this;
        this.game = game;
        this.ls = Client;
        this.slot = slot;
        this.channel = null;
        this.state = game.state.getCurrentState();
        this.parent.add(this.obj);
    }

    isMember() { return this.card.type == CardType.MEMBER; }
    isChannel() { return this.card.type == CardType.CHANNEL; }
    isMeme() { return this.card.type == CardType.MEME; }
    isRole() { return this.card.type == CardType.ROLE; }

    getName() { return this.card.name; }
    getOriginalName() { return this.card.original_name; }
    hasOriginalName() { return this.card.name == this.card.original_name; }

    getAttack() { return this.card.atk; }
    getDefense() { return this.card.def; }
    getLevel() { return this.card.lvl; }

    getMemeCategory() { return this.card.category; }

    getChannelSubject() { return this.card.subject; }

    click() {
        var local = this.ls.cardsys.duel.local;
        var duel = this.ls.cardsys.duel;
		if(Game.waitAnim || Game.inputLayer > 0) return;
        if(this.isOpponents) {
            if(!this.revealed) return;
            if(duel.phase == DuelPhase.BATTLE) {
                var local = duel.local;
                var cobj = local.selected.obj;
                var c = local.selected;
                if(local.selected == null) return;
                var b = validAttackTarget(c, this.slot, duel)
                Client.chat.write(`Valid: ${b}`);
                if(b) {
                    if(c.attacks > 0) {
                        Client.sendMove("ATTACK " + cobj.slot.name + " " + this.slot.name);
                        c.attacks--;
                        Game.attack(cobj, this.slot);
                    }
                }
                return;
            }
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
            //Client.sendMove("SELECT " + this.slot.name);
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

    move(dest, cb=function(duel){}) {
        //var distance = Phaser.Math.distance(this.obj.x, this.obj.y, dest.x, dest.y);
        var duration = 250;
        var local = this.ls.cardsys.duel.local;
        local.selected = null;
        this.obj.input.enabled = false;
		this.parent.bringToTop(this.obj);
        var tween = this.game.add.tween(this.obj).to(dest, duration, Phaser.Easing.Quadratic.InOut);
        tween.onComplete.addOnce(function(obj, tween) {
            obj.input.enabled = true;
        });
        tween.start();

        var tween2 = this.game.add.tween(this.text).to(dest, duration, Phaser.Easing.Quadratic.InOut);
        tween2.onComplete.addOnce(function(obj, tween2) {
            cb(Client.cardsys.duel);
        });
        tween2.start();
    }

    update() {
        if(!this.revealed) {
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
            if(this.hpCTR > this.card.currentHP) {
                this.hpCTR--;
            } else if(this.hpCTR < this.card.currentHP) {
                this.hpCTR++;
            }
            if(this.slot == null) {
                this.text.text = "";
            } else {
                this.text.text = "HP  " + this.hpCTR + "/ " + this.card.hp + "\nATK " + this.card.atk + "\nDEF " + this.card.def;
            }
        }
    }
}

//An object representing the deck. 
class DeckObject {
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
            "0", {
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
		if(Game.waitAnim || Game.inputLayer > 0) return;
        if(this.isOpponents) {
            //this.draw();
			return;
        }
        if(duel.phase === DuelPhase.DRAW) {
            if(this.slot.type === SlotType.DECK) {
                if(duel.draws < 1) {
                    this.draw();
                }
            }
            return;
        }
        if(this.slot !== null) {
            //Client.sendMove("SURRENDER");
        }
    }

    draw(cb=function(duel){}) {
        var duel = this.ls.cardsys.duel;
		var game = this.ls.game;
        var sounds = this.ls.sounds;
        if(duel.phase == DuelPhase.DRAW) {
            Client.sendMove("DRAW 1");
        }
        if(this.isOpponents) {
			var next = new CardObject(this.slot, duel.opponent.deck.get_top(), this.isOpponents, this.parent);
		    next.revealed = true;
			this.parent.bringToTop(next.obj);
			//obj.remote.hand.push(next);
			//obj.remote.hand.updateHandPositions();
			duel.remote.hand.push(next);
			Game.addToHand(next, this.isOpponents);
			Game.updateHand(cb);
			var n = getRandomInt(1, 3);
			if(n == 1) {
				sounds['card1'].play();
			} else if(n == 2) {
				sounds['card0'].play();
			} else {
				sounds['card3'].play();
			}
			//duel.remote.hand.updateHandPositions();
            next.slot = null;
            duel.opponent.deck.draw();
        } else {
            var next = new CardObject(this.slot, duel.player.deck.get_top(), this.isOpponents, this.parent);
            this.parent.bringToTop(next.obj);
            //this.state.obj.local.deck = next;
            //next.move({
            //    x: 104,
            //    y: (duel.local.hand.length * 104) + 132
            //});
			//obj.local.hand.push(next);
			//obj.local.hand.updateHandPositions();
            duel.local.hand.push(next);
			Game.addToHand(next, this.isOpponents);
			Game.updateHand(cb);
			var n = getRandomInt(1, 3);
			if(n == 1) {
				sounds['card1'].play();
			} else if(n == 2) {
				sounds['card0'].play();
			} else {
				sounds['card3'].play();
			}
			//duel.local.hand.updateHandPositions();
            next.slot = null;
			duel.player.deck.draw();
            duel.draws++;
            if(duel.draws >= 1) {
                duel.phase = DuelPhase.EFFECT;
                duel.effectPhase();
            }
        }
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
        this.obj.frame = UNDEFINED_CARD_INDEX;
        if(this.isOpponents) {
            this.text.setText(`${Client.cardsys.duel.opponent.deck.card.length}`);
        }
        else {
            this.text.setText(`${Client.cardsys.duel.player.deck.card.length}`);
        }
    }
}

//An object that controls the hand. Automatically spaces out cards and handles animation.
class HandObject {
    constructor(p, op, parent) {
        var game = Client.game;
        this.parent = parent;
        this.isOpponents = op;
        this.objs = [];
        
        this.pos = {
            x: p.x, 
            y: p.y, 
        };
        this.revealed = !this.isOpponents;
        this.game = game;
        this.ls = Client;
        this.state = game.state.getCurrentState();
    }

    get(index) {
        return this.objs[index];
    }
	
	updateHandPositions(fn, fcb=function(duel){}) {
		var duration = 250;
        var local = this.ls.cardsys.duel.local;
        local.selected = null;
		var tweens = [];
		for(i in this.objs) {
			var dest = {x: this.pos.x, y: (this.pos.y + (104 * (i - this.objs.length / 2)))};
			//Client.chat.write("X=" + dest.x + ",Y=" + dest.y);
			this.objs[i].obj.input.enabled = false;
            var tween = this.game.add.tween(this.objs[i].obj).to(dest, duration, Phaser.Easing.Quadratic.InOut);
            if(i >= this.objs.length - 1) {
                tween.onComplete.addOnce(function(obj, tween) {
                    fn(obj.p);
                    fcb(Client.cardsys.duel);
                    obj.input.enabled = true;
                });
            } else {
                tween.onComplete.addOnce(function(obj, tween) {
                    obj.input.enabled = true;
                });
            }
			tween.start();
			tweens.push(tween);

			var tween2 = this.game.add.tween(this.objs[i].text).to(dest, duration, Phaser.Easing.Quadratic.InOut);
			tween2.onComplete.addOnce(function(obj, tween2) {
			});
			tween2.start();
			tweens.push(tween2);
		}
	}
	
	push(o) {
		this.objs.push(o);
		this.parent.add(o.obj);
	}
	
	remove(o) {
		var j = -1;
		for(i in this.objs) {
			if(this.objs[i] === o) 
				j = i;
		}
		if(j !== -1) {
            this.objs.splice(j, 1);
        }
        return j;
		//this.parent.add(o.obj);
	}
	
	check(o) {
		for(i in this.objs) {
			if(this.objs[i] === o) 
				return true;
		}
		return false;
	}

    /*click() {}

    draw() {
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
    }*/

    update() {
		for(i in this.objs) {
			this.objs[i].update();
		}
    }
}

//An object that represents the Offline Space. Automatically controls animations.
class OfflineObject {
    constructor(p, op, parent) {
        var game = Client.game;
        this.parent = parent;
        this.isOpponents = op;
        this.objs = [];
        
        this.pos = {
            x: p.x + 70, 
            y: p.y + 50, 
        };
        this.revealed = true;
        this.game = game;
        this.ls = Client;
        this.state = game.state.getCurrentState();
    }
	
	updatePositions() {
		var duration = 250;
        var local = this.ls.cardsys.duel.local;
        local.selected = null;
		var tweens = [];
		for(i in this.objs) {
			var dest = {x: this.pos.x, y: this.pos.y };
			//Client.chat.write("X=" + dest.x + ",Y=" + dest.y);
			this.objs[i].obj.input.enabled = false;
			var tween = this.game.add.tween(this.objs[i].obj).to(dest, duration, Phaser.Easing.Quadratic.InOut);
			tween.onComplete.addOnce(function(obj, tween) {
				obj.input.enabled = true;
			});
			tween.start();
			tweens.push(tween);

			var tween2 = this.game.add.tween(this.objs[i].text).to(dest, duration, Phaser.Easing.Quadratic.InOut);
			tween2.onComplete.addOnce(function(obj, tween2) {
			});
			tween2.start();
			tweens.push(tween2);
		}
	}
	
	push(o) {
		this.objs.push(o);
		this.parent.add(o.obj);
	}
	
	remove(o) {
		var j = -1;
		for(i in this.objs) {
			if(this.objs[i] === o) 
				j = i;
		}
		if(j !== -1) {
			this.objs.splice(j, 1);
		}
		//this.parent.add(o.obj);
	}
	
	check(o) {
		for(i in this.objs) {
			if(this.objs[i] === o) 
				return true;
		}
		return false;
	}

    /*click() {}

    draw() {
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
    }*/

    update() {
		for(i in this.objs) {
			this.objs[i].update();
		}
    }
}

//An object that represents a card selector button. Used in prompts.
class CardSelectObject {
    constructor() {
        var game = Client.game;
        this.obj = game.add.button(
            -1000, 
            500, 
            'cards',
            this.click,
            this
        );
        this.obj.height = 281;
        this.obj.width = 201;
        this.obj.angle = 0;
    }

    init(c, op, parent) {
        var game = Client.game;
        this.parent = parent;
        this.isOpponents = op;
        //this.obj = game.add.button(
        //    -1000, 
        //    500, 
        //    'cards',
        //    this.click,
        //    this
        //);
        //this.obj.anchor.setTo(0.5, 0.5);
        this.card = c;
    }

    setSelected(b) {
        this.selected = b;
    }

    click() {
        this.parent.selected = this;
    }

    update() {
        this.obj.frame = this.card.index - 1;
        if(this.parent.selected === this) {
            this.obj.tint = 0x7F7FFF;
        } else {
            this.obj.tint = 0xFFFFFF;
        }
    }
}

//An object that represents the select card prompt that allows the user to select a card. Handles the layout of the prompt and animations.
class SelectCardPrompt {
    constructor(pos) {
        var game = Client.game;
        this.pos = pos;
        this.onConfirm = function(c){};
        this.selected = null;
        this.objs = [];
        this.dobjs = [];
        this.back = game.add.tileSprite(pos.x, pos.y, pos.width, pos.height, 'promptsc', 2, ui);
        this.back.y += pos.height;

        this.text = game.add.text(pos.text.x, pos.text.y, "", {
            font: pos.text.pxsize + "px Impact",
            fill: "#FFFFFF",
            align: "center"
        });
        this.text.y += pos.height;

        this.confirmButton = game.add.button(
            this.pos.button.x,
            this.pos.button.y,
            'buttons3',
            function() {
                if(this.selected !== null) {
                    this.hide(function(pr){
                        pr.p.hidden = true;
                        Game.inputLayer = 0;
                        pr.p.onConfirm(pr.p.selected.card);
                    });
                }
            },
            this
        );
        this.confirmButton.p = this;
        this.confirmButton.frame = 4;
        this.confirmButton.y += pos.height;
        this.scroll = 0;
        this.hidden = true;

        for(var i = 0; i < 40; i++) {
            this.dobjs.push(new CardSelectObject());
        }
        this.dobjsid = 0;
    }

    setMsg(msg) {
        this.text.setText(msg);
    }

    clear() {
        this.objs = [];
        this.dobjsid = 0;
        this.selected = null;
    }

    add(c) {
        var nb = this.dobjs[this.dobjsid];
        nb.init(c, false, this);
        this.objs.push(nb);
        this.dobjsid++;
    }

    getSelected() { 
        return this.selected; 
    }

    setConfirmCallback(onConfirm) {
        this.onConfirm = onConfirm;
    }

    show() {
        var game = Client.game;
        var tween = game.add.tween(this.back).to( { y: this.pos.y }, 100, Phaser.Easing.Linear.None, true, 0);
        var tween2 = game.add.tween(this.text).to( { y: this.pos.text.y }, 100, Phaser.Easing.Linear.None, true, 0);
        var tween3 = game.add.tween(this.confirmButton).to( { y: this.pos.button.y }, 100, Phaser.Easing.Linear.None, true, 0);
        tween.start();
        tween2.start();
        tween3.start();
        this.hidden = false;
    }

    hide(onFinish) {
        var game = Client.game;
        var tween = game.add.tween(this.back).to( { y: this.pos.y + this.pos.height }, 100, Phaser.Easing.Linear.None, true, 0);
        var tween2 = game.add.tween(this.text).to( { y: this.pos.text.y + this.pos.height }, 100, Phaser.Easing.Linear.None, true, 0);
        var tween3 = game.add.tween(this.confirmButton).to( { y: this.pos.button.y + this.pos.height }, 100, Phaser.Easing.Linear.None, true, 0);
        tween.start();
        tween2.start();
        tween3.onComplete.addOnce(function(obj, tween){
            onFinish(obj);
        });
        tween3.start();
    }

    calcButtonPosition(index) {
        //var xx = this.pos.card.x + (this.pos.card.width * index) - (this.scroll * this.pos.card.width);
        var xx = this.pos.card.x + (this.pos.card.width * index) - (this.scroll * this.pos.card.width * this.objs.length);
        var pos = {
            //x: xx + 230,
            x: 10 + (202 * index),
            y: (this.pos.card.y - 141) + (this.back.y - this.pos.y)
        }
        return pos;
    }

    update() {
        if(this.hidden) return;
        for(i in this.objs) {
            var pos = this.calcButtonPosition(i);
            this.objs[i].obj.x = pos.x;
            this.objs[i].obj.y = pos.y;
            this.objs[i].update();
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

//Returns a random number between min and max - 1 inclusive
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

//Converts a raw array of numbers into a deck.
function make_deck(rawDeck) {
    var deck = new Deck();
    for(i in rawDeck) {
        var card = new Card();
        card.set_index(rawDeck[i]);
        deck.add(card);
    }
    return deck;
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

//Returns true if a deck is playable
function check_deck(deck) {
	var cards = 40;
	var numChannels = 0;
	var numMembers = 0;
	for(i = 0; i < cards; i++) {
		var c = deck.card[i];
		if(c.type == CardType.MEMBER)
			numMembers++;
		if(c.type == CardType.CHANNEL)
			numChannels++;
	}
	return (numChannels >= 1 && numMembers >= 1);
}

//Returns a random deck that is guarenteed to be playable
function random_playable_deck() {
	var cards = 40;
    var deck = null;
	do {
		deck = new Deck();
		for(i = 0; i < cards; i++) {
			var n = getRandomInt(1, 152);
			var c = new Card();
			c.set_index(n);
			deck.add(c);
		}
	} while(!check_deck(deck));
    return deck;
}

//Returns a dummy deck used for testing
function dummy_deck() {
	var cards = 40;
    var deck = new Deck();
    for(i = 0; i < cards; i++) {
        var n = DummyDeck[i];
        var c = new Card();
        c.set_index(n);
        deck.add(c);
    }
    return deck;
}

//Initializes CardIndex with the JSON string str.
function loadCardData(str) {
    CardIndex = JSON.parse(str);
}

//Returns whether a card can be moved to a slot.
function validSlot(card, slot, duel) {
    if(!slot.empty()) return false;
	if(slot.isOpponents) return false;
    if(card.type === CardType.CHANNEL && slot.type === SlotType.CHANNEL) {
        return true;
    }
    if((card.type === CardType.ROLE || card.type === CardType.MEMBER) && 
        slot.type === SlotType.MEMROLE
    ) {
		if(slot.channel.empty()) return false;
        if(card.type === CardType.MEMBER && 
            card.lvl > 1) return (
                duel.local.getLevelOneMembers().length > card.lvl - 2
            );
        return true; 
    }
	if(card.type === CardType.MEME && slot.type === SlotType.MEME) {
        return true; 
    }
    return false;
}

//Returns whether a slot is a valid attack target
function validAttackTarget(card, slot, duel) {
    if(slot.empty()) return false;
    if(!slot.isOpponents) return false;
    if(card.type !== CardType.MEMBER && (card.type !== CardType.MEME || card.category !== MemeCategory.VRT)) {
        return false;
    }
    if(slot.type === SlotType.CHANNEL) {
        return true;
    }
    if(slot.type === SlotType.MEMROLE && slot.card.card.type === CardType.MEMBER) {
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

//An object representing a slot on the game board.
class Slot {
    constructor(pos, type, op, channel) {
        this.type = type;
		
		//Whether the slot is controlled by the opponent.
        this.isOpponents = op;
		
		//The card that is in this slot.
        this.card = null;
        this.hpCTR = 0;
		
		//Channel slot connected to this one.
		this.channel = channel;
		
        var game = Client.game;
		
		//The button object.
        this.obj = game.add.button(
            pos.x + 70, 
            pos.y + 51, 
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

    refresh() {
        if(!this.empty())
            this.card.resetAttacks();
    }

	//Called when the user clicks the card slot.
    click() {
        var duel = this.ls.cardsys.duel;
        var player = duel.player;
        if(duel.turn !== player) return;
        if(duel.local.selected !== null) {
            if(duel.phase === DuelPhase.ACTION) {
                if(Game.isInHand(duel.local.selected.obj, false)) {
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
                        var j = Game.removeFromHand(cobj, false);
                        var n = this.name;
                        Game.updateHand();
                        Client.sendMove("PLAY " + j + " " + n);
                        Game.playCard(cobj, false);
                    }
                }
            } else if(duel.phase === DuelPhase.BATTLE) {
                //if(Game.isOnField(duel.local.selected.obj, false)) {
                    var local = duel.local;
                    var cobj = local.selected.obj;
                    var c = local.selected;
                    if(validAttackTarget(c, this, duel)) {
                        if(cobj.attacks > 0) {
                            Game.attack(c, this);
                            this.card = cobj;
                            //if(cobj.slot !== null) {
                            //    cobj.slot.card = null;
                            //}
                            //cobj.slot = this;
                            local.selected = null;
                        }
                    }
                //}
            }
        }
    }

    update() {
        var duel = this.ls.cardsys.duel;
		var game = this.ls.game;
        var player = duel.player;
        if(duel.turn !== player) {
            this.obj.frame = 1;
        }
        if(duel.local.selected !== null) {
			if(duel.local.selected === this.card) {
				this.obj.frame = 0;
				return;
			}
			if(Game.isInHand(duel.local.selected.obj, false)) {
				if(validSlot(duel.local.selected, this, duel)) {
					this.obj.frame = 2;
				} else {
					this.obj.frame = 1;
				}
			}
        } else {
            this.obj.frame = 0;
        }
		if(this.card !== null) {
			this.card.update();
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

        //The player's current prize token count.
        this.prizeTokens = 0;
		
		//The player's registered name.
        this.name = null;
		
		//The player's rank.
		this.rank = 0;
    }
}