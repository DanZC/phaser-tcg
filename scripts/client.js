var Client = {};
Client.ls = {}

Client.socket = io.connect();
Client.load = false;
Client.game = null;
Client.cardsys = null;

Client.chat = {};

Client.chat.write = function(msg) {
    $('#messages').append(
        $('<li>').append(
            $('<i>').text(msg)
        )
    );
};

Client.chat.writeDebug = function(msg) {
    $('#messages').append(
        $('<li>').text(msg)
    );
};

Client.chat.clearAll = function() {
    $('#messages').children().remove();
};

Client.askNewPlayer = function(){
    Client.socket.emit('newplayer');
};

Client.askReturnPlayer = function(username){
    Client.socket.emit('oldplayer', username)
};

Client.sendMove = function(move){
    Client.chat.write('DEBUG:' + move);
    //Client.socket.emit('move send', move);
};

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
    Client.chat.write("Creating a new AI game...");
    Client.game.state.start("Game",true,false,Client.game,{type: GameType.RandomMatch});
});

Client.socket.on('move callback',function(x){
    if(x !== null) {
        //Client.cardsys.duel.remote.update(state.local);
    }
});

Client.socket.on('move get',function(state){
    Client.cardsys.duel.remote.update(state.local);
});

Client.socket.on('request info', (fn) => {
    fn({
        deck: Client.cardsys.duel.player.deck.rawcopy()
    });
});

Client.socket.on('disconnect',function(){
    Client.chat.write("Oops... There seems to be a connection issue.");
});