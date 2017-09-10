Game = {};

const GameType = {
    AI: 0,
    RandomMatch: 1,
    Spectate: 2,
    MutualMatch: 3
}

Game.type = GameType.AI;

Game.Client = Client;
Client.game = Game;

Game.cardsys = Client.cardsys;
Game.obj = {};

Game.init = function(game, data){
    this.game = game;
    this.game.stage.disableVisibilityChange = true;
    this.type = data.type;
    this.obj = {};
};

Game.preload = function() {
    this.game.load.spritesheet('cards', 'assets/cards.png',412,562);
    this.game.load.image('logo', 'assets/back_test_new.png');
    for(var i = 0; i < 3; i++) {
        this.game.load.image('card_' + i.toString(), 'assets/card_' + i.toString() + '.png');
    }
};

Game.create = function() {
    var game = this.game;
    var cardsys = Client.cardsys;
    var obj = this.obj;
    var ls = Client;

    cardsys.player.deck.update();
    var logo = game.add.sprite(game.world.centerX, game.world.centerY, 'logo');
    logo.anchor.setTo(0.5, 0.5);
    var d = cardsys.player.deck.get_top();
    var d2 = cardsys.duel.opponent.deck.get_top();
    var deckpos = [{
        x : -420,
        y : 385
    },{
        x : 457,
        y : -392
    }];
    var channelpos = [{
        x : -420,
        y : 385
    },{
        x : -420,
        y : 385
    }]
    obj.local = {};
    obj.local.deck = new CardObject(deckpos[0], d, false);
    obj.opponent = {};
    obj.opponent.deck = new CardObject(deckpos[1], d2, true);
    //var deckobj = new CardObject(game, deckpos, d);
    obj.pv = game.add.button(
        game.world.centerX, 
        game.world.centerY, 
        'cards',
        function() {
            this.x = -1000;
        },
        obj.pv
    );
    obj.pv.anchor.setTo(0.5, 0.5);
    obj.pv.x = -1000;
    obj.pv.frame = d.index;
};

Game.update = function() {
    var ls = Client;
    for(i in this.obj.local) {
        this.obj.local[i].update();
    }
    for(i in ls.obj.opponent) {
        this.obj.opponent[i].update();
    }
};