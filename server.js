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

var ai = require('child_process').fork('./ai.js', [], {
    stdio: 'pipe'
});

CardIndex = [];
DummyDeck = [];

var fs = require('fs');
fs.readFile( __dirname + '/assets/cards.json', function (err, data) {
    if (err) {
        throw err; 
    }
    CardIndex = data.toJSON();
});
fs.readFile( __dirname + '/assets/dummy_deck.json', function (err, data) {
    if (err) {
        throw err; 
    }
    DummyDeck = data.toJSON();
});

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
        this.currentHP = this.hp - dmg; 
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
        pmove.slotid = parseInt(parts[3]);
        return pmove;
    }
    if(parts[0] == "DISCARD") {
        pmove.type = MoveType.DISCARD;
        pmove.handid = parseInt(parts[1]);
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

class MatchState {
    constructor() {
        this.turn = null;
        this.phase = DuelPhase.DRAW;
        this.draws = 0;
        this.a = {
            deck: [],
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
            deck: [],
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
        side.hand.push(side.deck.pop());
    }

    playCard(side, handid, slotty, slotid) {
        var c = side.hand[handid]
        if(slotty === SlotType.MEMROLE) {
            side.members[slotid].set_card(c);
        } else if(slotty === SlotType.CHANNEL) {
            side.channels[slotid].set_card(c);
        } else if(slotty === SlotType.MEME) {
            side.memes[slotid].set_card(c);
        }
        side.hand.splice(handid, 1);
    }

    sendToGrave(side, slotty, slotid) {
        if(slotty === SlotType.MEMROLE) {
            var s = side.members[slotid];
            var c = s.get_card();
            side.offline.push(c);
            s.remove_card(c);
            side.members.splice(slotid, 1);
        } else if(slotty === SlotType.CHANNEL) {
            var s = side.channels[slotid];
            var c = s.get_card();
            side.offline.push(c);
            s.remove_card(c);
            side.channels.splice(slotid, 1);
        } else if(slotty === SlotType.MEME) {
            var s = side.memes[slotid];
            var c = s.get_card();
            side.offline.push(c);
            s.remove_card(c);
            side.memes.splice(slotid, 1);
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
        ai.send({
            type: 'ai',
            match: {
                id: this.bot.match.id
            },
            state: {
                self: copy(state[id]),
                opponent: copy(state[oid]),
                phase: state.phase
            },
            id: id
        })
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
        this.state.a.deck = this.a.deck;
        this.state.b.deck = this.b.deck;
        this.state.turn = this.b;
        //io.to(this.roomid).emit('matchmake end', this.state);
        if(this.a.bot !== true) {
            io.sockets.connected[this.a.socketID].emit('matchmake end', {opponent:copy(this.state.b), ty:this.matchtype, turn:false});
            io.sockets.connected[this.a.socketID].emit('end turn');
        }
        if(this.b.bot !== true) {
            io.sockets.connected[this.b.socketID].emit('matchmake end', {opponent:copy(this.state.b), ty:this.matchtype, turn:true});
        } else {
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
        if(p === 'a') {
            switch(m.type) {
            case MoveType.DRAW:
                this.state.drawCard(this.state.a, m.value);
                break;
            case MoveType.PLAY:
                this.state.playCard(this.state.a, m.handid, m.slotty, m.slotid);
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
            io.sockets.connected[this.b.socketID].emit('match disconnect', {reason:"Disconnect"});
        }
        if(socket.id === this.b.socketID) {
            io.sockets.connected[this.a.socketID].emit('match disconnect', {reason:"Disconnect"});
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
        //var c = new Card();
        //c.set_index(n);
        //c.update();
        deck.push(n);
    }
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
        this.ai = new AI();
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
        var match = data.match;
        var moves = data.moves;
        console.log('AI Callback.');
        for(m in moves) {
            match.doMove(data.id, moves[m]);
        }
        match.emit(moves);
    }
});

ai.on('close', (code) => {
    console.log('ai module closed with a code of ' + code);
    //ai = fork('./ai.js', [], {
    //    stdio: 'pipe'
    //});
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
        socket.emit('request info', (info) => {
            console.log('Received info from ' + socket.player.id + ".");
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
        var n = getRandomInt(0, p.length - 1);
        //We need more than 1 waiting player to matchmake.
        console.log(p.length);
        if(p.length > 1) {
            do {
                n = getRandomInt(0, p.length - 1);
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
        //var data = verifyMove(socket.player.match, move);
        var data = { good:true };
        if(data.good) {
            socket.to(socket.player.match.roomid).broadcast.emit('move get',move);
            socket.player.match.doMove(move);
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