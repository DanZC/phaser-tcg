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

var fs = require('fs');
fs.readFile( __dirname + '/assets/cards.json', function (err, data) {
    if (err) {
        throw err; 
    }
    CardIndex = data.toJSON();
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

const DuelPhase = {
    WAIT : 0,
    DRAW : 1,
    EFFECT : 2,
    ACTION : 3,
    BATTLE : 4
};

class MatchState {
    constructor() {
        this.turn = null;
        this.phase = DuelPhase.DRAW;
        this.draws = 0;
        this.a = {
            deck: [],
            hand: [],
            memes: [
                {index: -1},
                {index: -1},
                {index: -1},
                {index: -1},
                {index: -1},
                {index: -1}
            ],
            members: [
                {index: -1, role: -1},
                {index: -1, role: -1},
                {index: -1, role: -1},
                {index: -1, role: -1},
                {index: -1, role: -1},
                {index: -1, role: -1}
            ],
            channels: [
                {index: -1, member: 0},
                {index: -1, member: 0}
            ],
            offline: []
        }
        this.b = {
            deck: [],
            hand: [],
            memes: [
                {index: -1},
                {index: -1},
                {index: -1},
                {index: -1},
                {index: -1},
                {index: -1}
            ],
            members: [
                {index: -1, role: -1},
                {index: -1, role: -1},
                {index: -1, role: -1},
                {index: -1, role: -1},
                {index: -1, role: -1},
                {index: -1, role: -1}
            ],
            channels: [
                {index: -1, member: 0},
                {index: -1, member: 0}
            ],
            offline: []
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

    doTurn(state, id) {
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
            }
        })
    }
}

class Match {
    constructor(a, b) {
        this.a = a;
        this.b = b;
        this.state = new MatchState();
        this.spectators = [];
        var x = 0;
        do {
            x = getRandomInt(0, 2147483647);
        } while(isMatchIDUsed(x));
        usedMatchIDs.push(x);
        this.id = x;
        this.roomid = "M" + this.id.toString();
    }

    isReady() {
        return true;
        if(this.a.deck.length !== 0 && this.b.deck.length !== 0) {
            return true;
        }
        return false;
    }

    start() {
        console.log("Starting match between " + this.a.name + " and " + this.b.name + "!");
        this.state.a.deck = this.a.deck;
        this.state.b.deck = this.b.deck;
        this.state.turn = this.b;
        io.to(this.roomid).emit('matchmake end');
        if(this.a.bot !== true) {
            this.a.socket.emit('end turn');
        }
        if(this.b.bot === true) {
            this.b.ai.doTurn(this.state, "b");
        }
    }

    doMove() {

    }

    sync() {
        io.emit('sync', a);
    }

    disconnect(socket) {
        io.to(this.roomid).emit('player left match', socket);
        a.leave_match();
        b.leave_match();
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

    leave_match() {}
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
        this.deck = randomDeck();
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
    console.log('AI Callback.')
}
});

ai.on('close', (code) => {
    console.log('ai module closed with a code of ' + code);
    ai = fork('./ai.js', [], {
        stdio: 'pipe'
    });
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
            muted: false
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
            muted: false
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
        var match = newMatch(bot, socket.player);
        server.matches[match.id] = match;
        socket.player.match = match;
        bot.match = match;
        var roomid = match.roomid;
        socket.join(roomid);
        socket.emit('request info', (info) => {
            console.log('Received info from ' + socket.player.id + ".");
            socket.player.deck = info.deck;
            console.log('Deck length: ' + socket.player.deck.length);
            if(socket.player.match.isReady()) {
                socket.player.match.start();
            }
        });
        console.log("Player, " + socket.player.id + ", joined a match vs the AI.");
    });

    socket.on('matchmake enter',function(){
        socket.player.waitingForMatch = true;
        var p = getAllWaitingPlayers();
        var n = getRandomInt(0, p.length);
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
            var match = newMatch(op, socket.player);
            server.matches[match.id] = match;
            socket.player.match = match;
            op.match = match;
            var roomid = "M" + match.id.toString();
            io.sockets.connected[op.socketID].join(roomid)
            socket.join(roomid);
            io.to(roomid).emit('matchmake made');
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