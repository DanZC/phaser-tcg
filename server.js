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
        while(isMatchIDUsed(id)) {
            x = getRandomInt(0, 2147483647);
        }
        this.id = x;
    }

    sync() {
        io.emit('sync', a);
    }

    destroy() {

    }
}

function newMatch(a, b) {
    var match = new Match(a, b);
    match.id = lastMatchID++;
    return match;
}

function newPlayer(socket) {
    return {
        id: server.lastPlayerID++,
        name: "ANON",
        inMatch: false,
        waitingForMatch: false,
        spectating: false,
        match: null,
        bot: false,
        socketID: socket.id
    }
}

function newBot() {
    return {
        id: server.lastPlayerID++,
        name: "B",
        inMatch: false,
        waitingForMatch: false,
        spectating: false,
        match: null,
        bot: false,
        socketID: socket.id
    }
}

server.lastPlayerID = 0; // Keep track of the last id assigned to a new player
server.lastMatchID = 0;
server.matches = {};

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
        socket.emit('allplayers',getAllPlayers());
        socket.broadcast.emit('newplayer',socket.player);
        console.log("New player connected!");
    });

    socket.on('applycred',function(data){
        socket.player.name = data.name;
        console.log("Player, " + socket.player.id + ", updated their credentials.");
    });

    socket.on('newaigame',function(){
        socket.player.name = data.name;
        var AI = {};
        var match = newMatch(newBot(), player);
        server.matches[match.id] = match;
        socket.player.match = match;
        op.match = match;
        var roomid = "M" + match.id.toString();
        io.sockets.connected[op.socketID].join(roomid)
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
            var match = newMatch(op, player);
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
        //socket.emit('allplayers',getAllPlayers());
        socket.broadcast.emit('updatestate',state);
        console.log("New player connected!");
    });

    socket.on('disconnect',function(){
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