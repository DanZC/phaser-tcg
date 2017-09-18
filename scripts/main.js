window.onload = function() {

    var username = getCookie("username");

    var game = new Phaser.Game(1500, 960, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });
    game.state.add('Game',Game);
    game.state.add('Title',Title);
    game.state.add('Builder',Builder);

    if (username != "") {
        Client.askReturnPlayer(username);
    } else {
        Client.askNewPlayer();
    }

    var ls = Client;
    ls.game = game;
    ls.cardsys = new CardSystem();
    ls.obj = {};

    function preload () {
        game.load.json('card_data','assets/cards.json');
    }

    function create () {
        CardIndex = game.cache.getJSON('card_data');
        game.stage.disableVisibilityChange = true;
        game.state.start('Title',true,false,game);
    }

    function update(){}
};