//Creates a client object.
var Client = {};
Client.ls = {}

//Connects to the server.
Client.socket = io.connect();
Client.load = false;
Client.game = null;
Client.cardsys = null;

Client.checkEffectCallback = function(){};

const CheckEffectType = {
    ATTACK : 0,
    ACTIVATEEFFECT : 1,
    DISCARD : 2,
    BATTLEPHASE : 3,
    DAMAGESTEP : 4,
    ENDTURN : 5
};

Client.chat = {};

//Appends a message to the chat.
Client.chat.write = function(msg) {
    $('#messages').append(
        $('<li>').append(
            $('<i>').text(escapeHtml(msg))
        )
    );
};

Client.chat.writeDebug = function(msg) {
    $('#messages').append(
        $('<li>').text(escapeHtml(msg))
    );
};

//Clears all the messages in the chat.
Client.chat.clearAll = function() {
    $('#messages').children().remove();
};

//Contacts the server and tells them that the client is a new player.
Client.askNewPlayer = function(){
    Client.socket.emit('newplayer');
};

//Contacts the server and tells them that the client is a returning player.
Client.askReturnPlayer = function(username){
    Client.socket.emit('oldplayer', username)
};

Client.sendMove = function(move){
    Client.chat.write('DEBUG:' + move);
    //Client.socket.emit('move send', move);
};

Client.sendCheckEffect = function(type, callback){
    Client.socket.emit('checkeffect', type);
    Client.checkEffectCallback = callback;
    //Client.socket.emit('move send', move);
};

//Contacts the server, requesting that they be matched up with another player, a bot, or a random match.
Client.newGame = function(type, data) {
    if(type === GameType.AI) {
        Client.socket.emit('newaigame');
        return;
    }
    if(type === GameType.RandomMatch) {
        Client.socket.emit('matchmake enter');
        return;
    }
    if(type === GameType.Spectate) {
        Client.socket.emit('spectate', data);
        return;
    }

};

//Contacts the server, informing that they have left the game.
Client.leaveGame = function() {
    Client.socket.emit('leavegame');
}

Client.socket.on('allplayers',function(data){
    console.log(data);
});

Client.socket.on('matchmake wait',function(){
    Client.chat.write("Waiting for a match...");
});

Client.socket.on('matchmake callback',function(data){
    if(data.name !== "ANON") {
        Client.chat.write("Match found! Starting match vs @" + data.name + "...");
    } else {
        Client.chat.write("Match found! Starting match vs Player#" + data.id + "...");
    }
});

Client.socket.on('matchmake end',function(data){
    Client.chat.clearAll();
    var opponent = new Player();
    opponent.name = data.opponent.name;
    opponent.deck = make_deck(data.opponent.deck);
    Client.cardsys.duel = new DuelState(Client.cardsys.player, opponent);
    if(!data.turn) {
        Client.cardsys.duel.turn = opponent;
        Client.cardsys.duel.waiting = true;
        Client.chat.write("It's your opponent's turn.");
    }
    if(data.ty == GameType.AI) {
        Client.chat.write("Creating a new AI game...");
        Client.game.state.start("Game",true,false,Client.game,{type: GameType.AI});
    } else {
        Client.chat.write("Starting match...");
        Client.game.state.start("Game",true,false,Client.game,{type: GameType.RandomMatch});
    }
});

Client.socket.on('matchmake made',function(data){
    if(data.name !== "ANON")
        Client.chat.write("Match found! Starting match vs @" + data.name + "...");
    else
        Client.chat.write("Match found! Starting match vs Player#" + data.id + "...");
    /*var opponent = new Player();
    opponent.name = data.name;
    //opponent.deck = make_deck(data.deck);
    Client.cardsys.duel = new DuelState(Client.cardsys.player, opponent);
    Client.game.state.start("Game",true,false,Client.game,{type: GameType.RandomMatch});*/
});

Client.socket.on('move callback',function(x){
    if(x !== null) {
        //Client.cardsys.duel.remote.update(state.local);
    }
});

Client.socket.on('checkeffect none',function(){
    Client.checkEffectCallback();
});

Client.socket.on('move get',function(move){
    var m = "P1 " + move;
    Client.cardsys.duel.queueMove(m);
});

Client.socket.on('request info', (fn) => {
    fn({
        deck: Client.cardsys.player.deck.rawcopy()
    });
});

Client.socket.on('match disconnect',function(data){
    Client.chat.write("The match was terminated. Reason: " + data.reason);
    Client.game.state.start('Title',true,false,Client.game.game);
    Client.cardsys.reset();
});

//When the client disconnects with the server.
Client.socket.on('disconnect',function(){
    Client.chat.write("Oops... There seems to be a connection issue.");
});