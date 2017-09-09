window.onload = function() {

    var game = new Phaser.Game(1850, 1080, Phaser.AUTO, '', { preload: preload, create: create });
    var cardsys = new CardSystem();

    function preload () {
        game.load.json('card_data','assets/cards.json');
        game.load.image('logo', 'assets/back_test_new.png');
        for(var i = 0; i < 3; i++) {
            game.load.image('card_' + i.toString(), 'assets/card_' + i.toString() + '.png');
        }
    }

    function create () {
        CardIndex = game.cache.getJSON('card_data');
        cardsys.player.deck.update();
        var logo = game.add.sprite(game.world.centerX, game.world.centerY, 'logo');
        logo.anchor.setTo(0.5, 0.5);
        var d = cardsys.player.deck.get_top().index;
        var n = game.add.sprite(game.world.centerX - 420, game.world.centerY + 385, 'card_' + d.toString());
        n.anchor.setTo(0.5, 0.5);
        n.height = 133;
        n.width = 97;
        n.angle = 90;
        game.stage.disableVisibilityChange = true;
        Client.askNewPlayer();
    }

};