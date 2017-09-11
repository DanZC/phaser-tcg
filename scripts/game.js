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
};

Game.preload = function() {
    this.game.load.spritesheet('cards', 'assets/cards.png',412,562);
    this.game.load.spritesheet('cardmask', 'assets/cardmask.png',412,562);
    this.game.load.image('logo', 'assets/back_test_new3.png');
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
        x : -438,
        y : 412
    },{
        x : 438,
        y : -364
    }];
    var channelpos = [{
        x : -440,
        y : 194
    },{
        x : -420,
        y : 385
    }]
    obj.local = {};
    var sdl = new Slot(deckpos[0], SlotType.DECK, false);
    cardsys.duel.local.slots['DECK'] = sdl;
    sdl.name = 'DECK';
    obj.local.deck = new CardObject(sdl, d, false);
    sdl.card = obj.local.deck;
    obj.opponent = {};
    var sdo = new Slot(deckpos[1], SlotType.DECK, true);
    cardsys.duel.remote.slots['DECK'] = sdo;
    sdo.name = 'DECK';
    obj.opponent.deck = new CardObject(sdo, d2, true);
    sdo.card = obj.opponent.deck;
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
    Client.chat.write("Joined an AI game.");
};

Game.update = function() {
    var ls = Client;
    for(i in this.obj.local) {
        this.obj.local[i].update();
    }
    for(i in this.obj.opponent) {
        this.obj.opponent[i].update();
    }
};