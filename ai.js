var socket = require('socket.io-client')('http://localhost:8080/local');
socket.on('connect', () => {
    socket.emit('ai ready');
});

socket.on('ai',function(match){
    var moves = [];

    //Draw phase
    for(i=0;i<5;i++) {
        moves.append('DRAW');
    }
    socket.emit('ai callback', match, moves);

    //Effect phase
    

    socket.emit('ai callback', match, moves);
});