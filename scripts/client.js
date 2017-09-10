var Client = {};
Client.ls = {}
Client.socket = io.connect();
Client.load = false;
Client.game = null;
Client.cardsys = null;

Client.askNewPlayer = function(){
    Client.socket.emit('newplayer');
};

Client.sendSelectCard = function(state){
    Client.socket.emit('select card', state);
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
    console.log(data);
});

Client.socket.on('matchmake end',function(data){
    Client.load = true;
});

Client.socket.on('updatestate',function(state){
    ls.cardsys.duel.remote.update(state);
});