var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/scripts',express.static(__dirname + '/scripts'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

usedMatchIDs = [];

function isMatchIDUsed(id) {
    for(i in usedMatchIDs) {
        if(usedMatchIDs[id] === i) return true;
    }
    return false;
}

class Match {
    constructor(a, b) {
        this.a = a;
        this.b = b;
        this.spectators = [];
        var x = 0;
        do {
            x = getRandomInt(0, 2147483647);
        } while(isMatchIDUsed(x));
        this.id = x;
        this.roomid = "M" + this.id.toString();
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
        this.socketID = -1
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
server.matches = [];
server.players = [];

io.on('connection',function(socket){
    socket.on('newplayer',function(){
        socket.player = {
            id: server.lastPlayerID++,
            name: "ANON",
            inMatch: false,
            waitingForMatch: false,
            spectating: false,
            match: null,
            socketID: socket.id
        };
        server.players.push(socket.player);
        socket.emit('allplayers',getAllPlayers());
        socket.broadcast.emit('newplayer',socket.player);
        console.log("New player connected!");
    });

    socket.on('applycred',function(data){
        socket.player.name = data.name;
        console.log("Player, " + socket.player.id + ", updated their credentials.");
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
        var roomid = "M" + match.id.toString();
        socket.join(roomid);
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

    socket.on('select card',function(state){
        console.log("Player, " + socket.player.id + ", has selected a card.");
        socket.to(socket.player.match.roomid).broadcast.emit('update state',state);
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