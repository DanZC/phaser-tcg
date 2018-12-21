window.onload = function() {

    var username = getCookie("username");

	var osize = { x:1500, y:960 }
	var oscale = { x:1500 / window.innerWidth, y:960 / window.innerHeight }
	
    var game = new Phaser.Game(osize.x, osize.y, Phaser.AUTO, 'game', { preload: preload, create: create, update: update });
    game.state.add('Game',Game);
    game.state.add('Title',Title);
    game.state.add('Builder',Builder);
	game.state.add('Rulebook',Rulebook);

    if (username != "") {
        Client.askReturnPlayer(username);
    } else {
        Client.askNewPlayer();
    }

    var ls = Client;
    ls.game = game;
    ls.cardsys = new CardSystem();
	ls.sounds = {};
    ls.obj = {};

    function preload () {
        game.load.json('card_data','assets/cards.json');
        game.load.json('dummy_deck','assets/dummy_deck.json');
        game.load.spritesheet('cards', 'assets/cards.png',412,562);
		game.load.audio('se_card0', 'assets/flip.wav');
		game.load.audio('se_card1', 'assets/card1.wav');
		game.load.audio('se_card2', 'assets/card2.wav');
		game.load.audio('se_card3', 'assets/card3.wav');
		game.load.audio('se_target', 'assets/target.wav');
		game.load.audio('se_tograve', 'assets/tograve.wav');
        game.load.audio('se_effect', 'assets/effect.wav');
        game.load.audio('se_hit2', 'assets/hit2.wav');
    }

    function create () {
		ls.sounds['card0'] = new Phaser.Sound(game, 'se_card0', 0.7);
		ls.sounds['card1'] = new Phaser.Sound(game, 'se_card1', 0.7);
		ls.sounds['card2'] = new Phaser.Sound(game, 'se_card2', 0.7);
		ls.sounds['card3'] = new Phaser.Sound(game, 'se_card3', 0.7);
        ls.sounds['effect'] = new Phaser.Sound(game, 'se_effect', 0.4);
		ls.sounds['tograve'] = new Phaser.Sound(game, 'se_tograve', 0.7);
        ls.sounds['target'] = new Phaser.Sound(game, 'se_target', 0.7);
        ls.sounds['hit2'] = new Phaser.Sound(game, 'se_hit2', 0.4);
        CardIndex = game.cache.getJSON('card_data');
        for(i in CardIndex) {
            var c = CardIndex[i];
            c.type = CardType[c.type];
            if(c.type === CardType.MEMBER || c.type === CardType.ROLE) {
                c.color = CardColor[c.color];
            }
			if(c.type === CardType.MEME) {
				c.category = MemeCategory[c.category];
			}
        }
		DummyDeck = game.cache.getJSON('dummy_deck');
		ls.cardsys.player.deck = dummy_deck();
        game.stage.disableVisibilityChange = true;
        game.state.start('Title',true,false,game);
    }

    function update(){}
};