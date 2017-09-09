var Client = {};
Client.socket = io.connect();

Client.askNewPlayer = function(){
    Client.socket.emit('newplayer');
};

Client.socket.on('allplayers',function(data){
    console.log(data);
});