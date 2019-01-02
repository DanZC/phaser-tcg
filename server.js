var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

//require('./scripts/card.js');

//Setup static directories.
app.use('/css',express.static(__dirname + '/css'));
app.use('/scripts',express.static(__dirname + '/scripts'));
app.use('/assets',express.static(__dirname + '/assets'));

//Set root domain as index.html
app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

var cp = require('child_process');
var ai = cp.fork('./ai.js', [], {
    stdio: 'pipe'
});

CardIndex = require('./assets/cards');
DummyDeck = require('./assets/dummy_deck');

var fs = require('fs');
/*fs.readFile( __dirname + '/assets/cards.json', function (err, data) {
    if (err) {
        throw err; 
    }
    CardIndex = data.toJSON();
});*/
/*fs.readFile( __dirname + '/assets/dummy_deck.json', function (err, data) {
    if (err) {
        throw err; 
    }
    DummyDeck = data.toJSON();
});*/

usedMatchIDs = [];

Client = {
    chat: {
        write: function(str) {
            Console.log(str);
        }
    }
};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function isMatchIDUsed(id) {
    for(i in usedMatchIDs) {
        if(usedMatchIDs[id] === i) return true;
    }
    return false;
}

function copy(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function rcopy(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = {};
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

//Damage calculation function
function calcDamage(atk, def) {
    var dmg = Math.round((atk * 1.5) - (def * 1.5));
    if(dmg < 1) dmg = 1;
    return dmg;
}

const DuelPhase = {
    WAIT : 0,
    DRAW : 1,
    EFFECT : 2,
    ACTION : 3,
    BATTLE : 4,
    DAMAGE : 5,
    END : 6
};

const ChannelType = {
    NON : 0,
    SRS : 1,
    GMG : 2,
    MDA : 3,
    MTR : 4,
    MEM : 5
};

//Bad "enum", because Javascript doesn't have bultin enums.
const CardType = {
    UNDEFINED : 0,
    MEMBER : 1,
    ROLE : 2,
    CHANNEL : 3,
    MEME : 4
};

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

//The bottom left-most card in cards.png. It is the same texture rect used for facedown cards.
const UNDEFINED_CARD_INDEX = 159;

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

const MemeCategory = {
	NML : 0,
	CTN : 1,
    RSP : 2,
    VRT : 3
}

//Unused
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
        this.currentHP = this.currentHP - dmg; 
        if(this.currentHP <= 0) {
            this.currentHP = 0;
            return true;
        }
        return false;
    }

    resetAttacks() { this.attacks = 1; }
}

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
        for(var i in raw) {
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

function make_deck(rawDeck) {
    var deck = new Deck();
    for(i in rawDeck) {
        var card = new Card();
        card.set_index(rawDeck[i]);
        deck.add(card);
    }
    return deck;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

const SlotType = {
    UNDEFINED : 0,
    MEMROLE : 1,
    CHANNEL : 2,
    MEME : 3,
    DECK : 4,
    OFFLINE : 5
}

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

//Parses a move command from a move command string.
function parseMove(movestr) {
    var pmove = {};
    var parts = movestr.split(' ');
    if(parts[0] == "DRAW") {
        pmove.type = MoveType.DRAW;
        if(parts.length > 1) {
            pmove.value = parseInt(parts[1]);
        } else {
            pmove.value = 1;
        }
        return pmove;
    }
    if(parts[0] == "PLAY") {
        pmove.type = MoveType.PLAY;
        pmove.handid = parseInt(parts[1]);
        if(parts[2].indexOf("MBR") == 0) {
            pmove.slotty = SlotType.MEMROLE;
        } else if(parts[2].indexOf("MEM") == 0) {
            pmove.slotty = SlotType.MEME;
        } else if(parts[2].indexOf("CH") == 0) {
            pmove.slotty = SlotType.CHANNEL;
        } else {
            pmove.slotty = SlotType.MEME;
        }
        pmove.slotid = parts[2];
        return pmove;
    }
    if(parts[0] == "PHASE") {
        pmove.type = MoveType.PHASE;
        if(parts[1].indexOf("BATTLE") == 0) {
            pmove.value = DuelPhase.BATTLE;
        } else if(parts[1].indexOf("END") == 0) {
            pmove.value = DuelPhase.END;
        } else if(parts[1].indexOf("EFFECT") == 0) {
            pmove.value = DuelPhase.EFFECT;
        } else if(parts[1].indexOf("ACTION") == 0) {
            pmove.value = DuelPhase.ACTION;
        } else {
            pmove.value = DuelPhase.END;
        }
        return pmove;
    }
    if(parts[0] == "DISCARD") {
        pmove.type = MoveType.DISCARD;
        pmove.handid = parseInt(parts[1]);
        return pmove;
    }
    if(parts[0] == "ATTACK") {
        pmove.type = MoveType.ATTACK;
        pmove.slotid = parts[1];
        if(parts[1].indexOf("MBR") == 0) {
            pmove.slotty = SlotType.MEMROLE;
        } else if(parts[1].indexOf("MEM") == 0) {
            pmove.slotty = SlotType.MEME;
        } else {
            pmove.slotty = SlotType.MEME;
        }
        pmove.slot2id = parts[2];
        if(parts[2].indexOf("MBR") == 0) {
            pmove.slot2ty = SlotType.MEMROLE;
        } else if(parts[2].indexOf("MEM") == 0) {
            pmove.slot2ty = SlotType.MEME;
        } else if(parts[2].indexOf("CH") == 0) {
            pmove.slot2ty = SlotType.CHANNEL;
        } else {
            pmove.slot2ty = SlotType.MEME;
        }
        return pmove;
    }
}

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
        this.index = c.index;
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
        this.index = -1;
    }
}

class MatchState {
    constructor() {
        this.turn = 'a';
        this.phase = DuelPhase.DRAW;
        this.draws = 0;
        this.a = {
            prizeToken: 0,
            deck: new Deck(),
            hand: [],
            memes: [
                new Slot(SlotType.MEME, 0, 'a'),
                new Slot(SlotType.MEME, 1, 'a'),
                new Slot(SlotType.MEME, 2, 'a'),
                new Slot(SlotType.MEME, 3, 'a'),
                new Slot(SlotType.MEME, 4, 'a'),
                new Slot(SlotType.MEME, 5, 'a')
            ],
            members: [
                new Slot(SlotType.MEMROLE, 0, 'a'),
                new Slot(SlotType.MEMROLE, 1, 'a'),
                new Slot(SlotType.MEMROLE, 2, 'a'),
                new Slot(SlotType.MEMROLE, 3, 'a'),
                new Slot(SlotType.MEMROLE, 4, 'a'),
                new Slot(SlotType.MEMROLE, 5, 'a')
            ],
            channels: [
                new Slot(SlotType.CHANNEL, 0, 'a'),
                new Slot(SlotType.CHANNEL, 1, 'a')
            ],
            offline: []
        }
        this.b = {
            prizeToken: 0,
            deck: new Deck(),
            hand: [],
            memes: [
                new Slot(SlotType.MEME, 0, 'a'),
                new Slot(SlotType.MEME, 1, 'a'),
                new Slot(SlotType.MEME, 2, 'a'),
                new Slot(SlotType.MEME, 3, 'a'),
                new Slot(SlotType.MEME, 4, 'a'),
                new Slot(SlotType.MEME, 5, 'a')
            ],
            members: [
                new Slot(SlotType.MEMROLE, 0, 'b'),
                new Slot(SlotType.MEMROLE, 1, 'b'),
                new Slot(SlotType.MEMROLE, 2, 'b'),
                new Slot(SlotType.MEMROLE, 3, 'b'),
                new Slot(SlotType.MEMROLE, 4, 'b'),
                new Slot(SlotType.MEMROLE, 5, 'b')
            ],
            channels: [
                new Slot(SlotType.CHANNEL, 0, 'b'),
                new Slot(SlotType.CHANNEL, 1, 'b')
            ],
            offline: []
        }
    }

    drawCard(side, n=1) {
        for(var i = 0; i < n; i++) {
            var c = side.deck.draw();
            side.hand.push(c);
        }
    }

    print() {
        var str = '';
        str += "A's HAND:\n"
        Console.log(str);
    }

    playCard(side, handid, slotty, slotid) {
        var sid = this.getIdFromSlotId(slotid);
        var c = side.hand[handid];
        if(slotty === SlotType.MEMROLE) {
            side.members[sid].set_card(c);
        } else if(slotty === SlotType.CHANNEL) {
            side.channels[sid].set_card(c);
        } else if(slotty === SlotType.MEME) {
            side.memes[sid].set_card(c);
        }
        side.hand.splice(handid, 1);
    }

    changePhase(side, value) {
        this.phase = value;
    }

    getIdFromSlotId(id) {
        id.trim();
        if(id.indexOf("MBR") == 0) {
            var nid = parseInt(id.substr(3, 1));
            if(nid !== null) {
                return nid;
            }
        } else if(id.indexOf("MEM") == 0) {
            var nid = parseInt(id.substr(3, 1));
            if(nid !== null) {
                return nid;
            }
        } else if(id.indexOf("CH") == 0) {
            var nid = parseInt(id.substr(2, 1));
            if(nid !== null) {
                return nid;
            }
        } else {
            var nid = parseInt(id.substr(3, 1));
            if(nid !== null) {
                return nid;
            }
        }
        return 0;
    }

    sendToGrave(side, slotty, slotid) {
        var sid = this.getIdFromSlotId(slotid);
        if(slotty === SlotType.MEMROLE) {
            var s = side.members[sid];
            var c = s.get_card();
            side.offline.push(c);
            s.remove_card(c);
            //side.members.splice(sid, 1);
        } else if(slotty === SlotType.CHANNEL) {
            var s = side.channels[sid];
            var c = s.get_card();
            side.offline.push(c);
            s.remove_card(c);
            //side.channels.splice(sid, 1);
        } else if(slotty === SlotType.MEME) {
            var s = side.memes[sid];
            var c = s.get_card();
            side.offline.push(c);
            s.remove_card(c);
            //side.memes.splice(sid, 1);
        }
    }

    attack(side, op, slotty, slotid, slot2ty, slot2id) {
        var sid = this.getIdFromSlotId(slotid);
        var s2id = this.getIdFromSlotId(slot2id);
        var atk = side.members[sid].get_card();
        var def = op.members[s2id].get_card();
        if(slotty === SlotType.MEME) {
            atk = side.memes[sid].get_card();
        }
        if(slot2ty === SlotType.CHANNEL) {
            def = op.memes[s2id].get_card();
        }
        var dmg = calcDamage(atk.getAttack(), def.getDefense());
        var isDestroyed = def.damage(dmg);
        if(def.isChannel()) isDestroyed = true;
        if(isDestroyed) {
            this.sendToGrave(op, slot2ty, slot2id);
            side.prizeToken++;
            console.log(`Prize token awarded. ${side.prizeToken}`);
        }
    }
}

const AIDifficulty = {
    EASY : 0,
    NORMAL : 1,
    HARD : 2
}

class AI {
    constructor(bot) {
        this.difficulty = AIDifficulty.NORMAL;
        this.bot = bot;
    }

    calcMove(state, id) {
        var oid = 'b';
        if(id === 'b') oid = 'a';
        console.log("ID = " + this.bot.match.id);
        ai.send({
            type: 'ai',
            match: {
                id: this.bot.match.id
            },
            state: {
                self: copy(state[id]),
                opponent: copy(state[oid]),
                phase: state.phase,
                turn: state.turn
            },
            id: id
        }, function(error) {
            console.error(error);
        });
    }
}

const MatchType = {
    AI: 0,
    RandomMatch: 1,
    Spectate: 2,
    MutualMatch: 3
}

class Match {
    constructor(a, b) {
        this.a = a;
        this.b = b;
        this.state = new MatchState();
        this.spectators = [];
        this.readya = false;
        this.readyb = false;
        this.matchtype = MatchType.AI;
        var x = 0;
        do {
            x = getRandomInt(0, 2147483647);
        } while(isMatchIDUsed(x));
        usedMatchIDs.push(x);
        this.id = x;
        this.roomid = "M" + this.id.toString();
        this.dead = false;
    }

    isReady() {
        return this.readya && this.readyb;
        /*if(this.a.deck.length !== 0 && this.b.deck.length !== 0) {
            return true;
        }
        return false;*/
    }

    start() {
        console.log("Starting match between " + this.a.name + " and " + this.b.name + "!");
        this.state.a.deck = new Deck();
        this.state.a.deck.fromRaw(this.a.deck);
        this.state.a.deck.update();
        this.state.b.deck = new Deck();
        this.state.b.deck.fromRaw(this.b.deck);
        this.state.b.deck.update();
        this.state.turn = 'b';
        //io.to(this.roomid).emit('matchmake end', this.state);
        if(this.a.bot !== true) {
            let opdeck = this.state.b.deck.rawcopy();
            io.sockets.connected[this.a.socketID].emit('matchmake end', {opponent:{deck:opdeck}, name: this.b.name, ty:this.matchtype, turn:false});
            io.sockets.connected[this.a.socketID].emit('end turn');
        }
        if(this.b.bot !== true) {
            let opdeck = this.state.a.deck.rawcopy();
            io.sockets.connected[this.b.socketID].emit('matchmake end', {opponent:{deck:opdeck}, name: this.a.name, ty:this.matchtype, turn:true});
        }
        this.state.drawCard(this.state.a, 5);
        this.state.drawCard(this.state.b, 5);
        if(this.b.bot) {
            this.b.ai.calcMove(this.state, "b");
        }
    }

    emit(moves) {
        for(m in moves) {
            io.to(this.roomid).emit('move get', moves[m]);
        }
    }

    doMove(p, move) {
        var m = parseMove(move);
        var op = (p === 'a'? 'b' : 'a');
        if(true) {
            switch(m.type) {
            case MoveType.DRAW:
                this.state.drawCard(this.state[p], m.value);
                break;
            case MoveType.PLAY:
                this.state.playCard(this.state[p], m.handid, m.slotty, m.slotid);
                break;
            case MoveType.ATTACK:
                this.state.attack(this.state[p], this.state[op], m.slotty, m.slotid, m.slot2ty, m.slot2id);
                if(this.state[p].prizeToken >= 3) {
                    var ap = this[this.state.turn];
                    console.log(`Player, ${this[p].name}, won.`);
                    if(ap.bot !== true) {
                        io.sockets.connected[ap.socketID].emit('match end', {won: true});
                    }
                    var dp = this[op];
                    if(dp.bot !== true) {
                        io.sockets.connected[dp.socketID].emit('match end', {won: false, winner:this[p].name});
                    }
                }
                break;
            case MoveType.PHASE:
                this.state.changePhase(this.state[p], m.value);
                if(this.state.phase == DuelPhase.END) {
                    this.state.phase = DuelPhase.DRAW;
                    console.log("TURN:" + this.state.turn);
                    var tp = this[this.state.turn];
                    if(tp.bot !== true) {
                        io.sockets.connected[tp.socketID].emit('end turn');
                    }
                    if(this.state.turn.startsWith('a')) {
                        this.state.turn = 'b';
                        var tp = this[this.state.turn];
                        if(tp.bot !== true)
                            io.sockets.connected[tp.socketID].emit('begin turn');
                        else
                            this.b.ai.calcMove(this.state, "b");
                    } else {
                        this.state.turn = 'a';
                        var tp = this[this.state.turn];
                        if(tp.bot !== true)
                            io.sockets.connected[tp.socketID].emit('begin turn');
                        else
                            this.a.ai.calcMove(this.state, "a");
                    }
                }
                break;
            default:
                break;
            }
        }
    }

    sync() {
        io.emit('sync', a);
    }

    disconnect(socket) {
        //io.to(this.roomid).emit('player left match', socket);
        if(socket.id === this.a.socketID) {
            if(this.b.bot !== true) {
                io.sockets.connected[this.b.socketID].emit('match disconnect', {reason:"Disconnect"});
            }
        }
        if(socket.id === this.b.socketID) {
            if(this.a.bot !== true) {
                io.sockets.connected[this.a.socketID].emit('match disconnect', {reason:"Disconnect"});
            }
        }
        this.a.leave_match();
        this.b.leave_match();
        this.dead = true;
    }
}

function randomDeck() {
    var cards = 40;
    var deck = [];
    for(i = 0; i < cards; i++) {
        var n = getRandomInt(1, CardIndex.length);
        deck.push(n);
    }
    return deck;
}

function dummyDeck() {
    var cards = 40;
    var deck = [];
    for(i = 0; i < cards; i++) {
        var n = DummyDeck[i];
        //var n = 1;
        //var c = new Card();
        //c.set_index(n);
        //c.update();
        deck.push(n);
    }
    return deck;
}

function newMatch(a, b) {
    var match = new Match(a, b);
    match.id = server.lastMatchID++;
    return match;
}

class Player {
    constructor(socket) {
        this.id = server.lastPlayerID++,
        this.name = "ANON",
        this.inMatch = false,
        this.waitingForMatch = false,
        this.spectating = false,
        this.match = null,
        this.bot = false,
        this.socket = socket;
    }

    leave_match() { this.match = null; }
}

class Bot {
    constructor() {
        this.id = server.lastBotID++,
        this.name = "BOT" + this.id.toString(),
        this.inMatch = false,
        this.waitingForMatch = false,
        this.spectating = false,
        this.match = null,
        this.bot = true,
        this.socketID = -1;
        this.deck = dummyDeck();
        this.ready = true;
        this.ai = new AI(this);
        server.bots.push(this);
    }

    leave_match() { this.match = null; }
}

function FindFirstIdleBot() {
    for(i in server.bots) {
        if(server.bots[i].match !== null) continue;
        return server.bots[i];
    }
    return null;
}

server.lastPlayerID = 0; // Keep track of the last id assigned to a new player
server.lastMatchID = 0;
server.lastBotID = 0;
server.bots = [];
server.ai = null;
server.matches = [];
server.players = [];

ai.on('message', function(data){
    if(data.type === 'handshake') {
        console.log('Handshake with ai server.');
    } else if(data.type === 'ai callback') {
        //console.log(data);
        //console.log(server.matches);
        var match = server.matches[data.data.match];
        var moves = data.data.moves;
        console.log('AI Callback.');
        for(m in moves) {
            console.log("P" + data.data.id + " " + moves[m]);
            match.doMove(data.data.id, moves[m]);
        }
        match.emit(moves);
        if(match.state.turn.startsWith(data.data.id)) {
            match[data.data.id].ai.calcMove(match.state, data.data.id);
        }
    }
});

ai.on('close', (code) => {
    console.log('ai module closed with a code of ' + code);
    ai = cp.fork('./ai.js', [], {
        stdio: 'pipe'
    });
});

ai.stdout.on('data', (data) => {
    console.log(`ai stdout: ${data}`);
    //ai = cp.fork('./ai.js', [], {
    //    stdio: 'pipe'
    //});
});

ai.stderr.on('data', (data) => {
    console.error(`ai stderr: ${data}`);
});

io.on('connection',function(socket){

    socket.on('newplayer',function(){
        socket.player = {
            id: server.lastPlayerID++,
            name: "ANON",
            inMatch: false,
            waitingForMatch: false,
            spectating: false,
            match: null,
            socketID: socket.id,
            ready: false,
            muted: false,
            leave_match: function() { this.match = null; this.inMatch = false; }
        };
        server.players.push(socket.player);
        socket.emit('allplayers',getAllPlayers());
        socket.broadcast.emit('newplayer',socket.player);
        console.log("New player connected!");
    });

    socket.on('oldplayer',function(name){
        for(i in socket.players) {
            if(name === server.players[i].name) {
                socket.emit('cred callback', false);
                return;
            }
        }
        socket.player = {
            id: server.lastPlayerID++,
            name: name,
            inMatch: false,
            waitingForMatch: false,
            spectating: false,
            match: null,
            socketID: socket.id,
            ready: false,
            muted: false,
            leave_match: function() { this.match = null; this.inMatch = false; }
        };
        server.players.push(socket.player);
        socket.emit('allplayers',getAllPlayers());
        socket.emit('cred callback', true);
        socket.broadcast.emit('chat message', socket.player.name + " joined the chat.");
        console.log("Returning player, " + name + ", connected!");
    });

    socket.on('cred',function(name){
        for(i in socket.players) {
            if(name === server.players[i].name) {
                socket.emit('cred callback', false);
                return;
            }
        }
        socket.player.name = name;
        console.log("Player, " + socket.player.id + ", updated their credentials.");
        socket.emit('cred callback',true);
        socket.broadcast.emit('chat message', socket.player.name + " joined the chat.");
    });

    socket.on('chat message',function(msg){
        var fmsg = socket.player.name + ': ' + msg;
        console.log(fmsg);
        if(socket.rooms.length > 0) {
            for(room in socket.rooms) {
                var r = socket.rooms[room];
                io.to(r).emit('chat message', socket.player.name, msg);
            }
        } else {
            io.emit('chat message', socket.player.name, msg);
        }
    });

    socket.on('newaigame',function(){
        var bot = FindFirstIdleBot();
        if(bot === null) {
            bot = new Bot();
        }
        var match = new Match(bot, socket.player);
        match.id = server.lastMatchID++;
        server.matches[match.id] = match;
        socket.player.match = match;
        bot.match = match;
        var roomid = match.roomid;
        socket.join(roomid);
        var dummy = new Deck();
        dummy.fromRaw(dummyDeck());
        dummy.shuffle();
        bot.deck = dummy.rawcopy();
        socket.emit('request info', (info) => {
            console.log('Received info from ' + socket.player.id + ".");
            //socket.player.deck = new Deck();
            socket.player.deck = info.deck;
            console.log('Deck length: ' + socket.player.deck.length);
            socket.player.match.readyb = true;
            socket.player.match.readya = true;
            socket.player.match.matchtype = MatchType.AI;
            if(socket.player.match.isReady()) {
                socket.player.match.start();
            }
        });
        console.log("Player, " + socket.player.id + ", joined a match vs the AI.");
    });

    socket.on('leavegame',function(){
        if(socket.player.match !== null) {
            var match = socket.player.match;
            match.disconnect(socket);
        }
        console.log("Player, " + socket.player.id + ", left a match.");
    });

    socket.on('matchmake enter',function(){
        socket.player.waitingForMatch = true;
        var p = getAllWaitingPlayers();
        var n = getRandomInt(0, p.length);
        //We need more than 1 waiting player to matchmake.
        console.log(p.length);
        if(p.length > 1) {
            do {
                n = getRandomInt(0, p.length);
                if(p[n] === socket.player) {
                    continue;
                } else break;
            } while(true);
            var op = p[n];
            op.waitingForMatch = false;
            socket.player.waitingForMatch = false;
            console.log("Match found! Match #" + socket.player.id + " vs #" + op.id + " created.");
            var match = new Match(op, socket.player);
            match.id = server.lastMatchID++;
            match.matchtype = MatchType.RandomMatch;
            server.matches[match.id] = match;
            socket.player.match = match;
            op.match = match;
            var roomid = "M" + match.id.toString();
            match.roomid = roomid;
            var osocket = io.sockets.connected[op.socketID];
            osocket.join(roomid);
            socket.join(roomid);
            socket.emit('matchmake made', {id:op.id, name:op.name});
            osocket.emit('matchmake made', {id:socket.player.id, name:socket.player.name});
            socket.emit('request info', (info) => {
                console.log('Received info from ' + socket.player.id + ".");
                socket.player.deck = info.deck;
                console.log('Deck length: ' + socket.player.deck.length);
                match.readyb = true;
                if(match.isReady()) {
                    match.start();
                }
            });
            osocket.emit('request info', (info) => {
                console.log('Received info from ' + osocket.player.id + ".");
                osocket.player.deck = info.deck;
                console.log('Deck length: ' + osocket.player.deck.length);
                match.readya = true;
                if(match.isReady()) {
                    match.start();
                }
            });
            //io.to(roomid).emit('matchmake made', {id:op.id});
        } else {
            socket.emit('matchmake wait');
            console.log("Player, " + socket.player.id + ", is waiting to be matched.");
        }
    });

    socket.on('matchmake exit',function(){
        if(socket.player.match === null) {
            socket.player.waitingForMatch = false;
            socket.emit('matchmake end');
            console.log("Player, " + socket.player.id + ", has stopped waiting to be matched.");
        } else {
            socket.player.match.disconnect(socket);
        }
    });

    socket.on('move send',function(move){
        console.log("Player, " + socket.player.id + ", did move, '" + move + "'");
        //Since verifying moves is yet to be implemented, the move will be automatically assumed to be valid.
        //var data = verifyMove(socket.player.match, move);
        var data = { good:true };
        var match = socket.player.match;
        var p = 'a'
        if(match.b.bot != true) {
            if(socket.id == match.b.socketID)
                p = 'b'
        }
        if(data.good) {
            socket.to(socket.player.match.roomid).broadcast.emit('move get',move);
            socket.player.match.doMove(p, move);
            socket.emit('move callback', move);
        } else {
            socket.emit('move callback', null);
        }
    });

    socket.on('disconnect',function(){
        var isPlayer = false;
        var isValidPlayer = false;
        for(i in socket) {
            if(i === "player") {
                isPlayer = true;
                break;
            } else continue;
        }
        if(!isPlayer) return;
        for(i in socket.players) {
            if(socket.player === server.players[i]) {
                isValidPlayer = true;
                break;
            } else continue;
        }
        if(!isValidPlayer) return;
        if(socket.player.match !== null) {
            socket.player.match.disconnect(socket);
        }
        for(room in socket.rooms) {
            var r = socket.rooms[room];
            socket.leave(r);
            io.to(r).emit('player disconnect', socket.player);
        }
        if(socket.player !== null) {
            io.emit('remove',socket.player.id);
        }
    });
});

//io.on('connection',function(socket){
//});

function getAllPlayers(){
    var players = [];
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var player = io.sockets.connected[socketID].player;
        if(player) players.push(player);
    });
    return players;
}

function getAllWaitingPlayers(){
    var players = [];
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var player = io.sockets.connected[socketID].player;
        if(player) {
            if(player.waitingForMatch) players.push(player);
        }
    });
    return players;
}

server.listen(8081,function(){ // Listens to port 8081
    console.log('Listening on '+server.address().port);
});