window.onload = function() {
    var game = new Phaser.Game(1850, 1080, Phaser.AUTO, '', { preload: preload, create: create, update: update });
    game.state.add('Game',Game);
    game.state.add('Title',Title);
    Client.askNewPlayer();
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