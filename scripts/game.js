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
    var channelpos = [
    [{
        x : -440,
        y : 194
    },{
        x : -440,
        y : 0
    }],[{
        x : -440,
        y : 194
    },{
        x : -420,
        y : 385
    }]
    ];
    var handrect = {
        x: 0,
        y: 0,
        width: 140,
        height: 104
    }
    slots = game.add.group(game.world, "slots", false, false, false);
    var sdl = new Slot(deckpos[0], SlotType.DECK, false);
    cardsys.duel.local.slots['DECK'] = sdl;
    sdl.name = 'DECK';
    slots.add(sdl.obj);
    var sdo = new Slot(deckpos[1], SlotType.DECK, true);
    cardsys.duel.remote.slots['DECK'] = sdo;
    sdo.name = 'DECK';
    slots.add(sdo.obj);
    var scl = [
        new Slot(channelpos[0][0], SlotType.CHANNEL, false),
        new Slot(channelpos[0][1], SlotType.CHANNEL, false)
    ];
    cardsys.duel.local.slots['CH0'] = scl[0];
    scl.name = 'CH0';
    slots.add(scl[0].obj);
    slots.add(scl[1].obj);

    cards = game.add.group(game.world, "cards", false, false, false);

    obj.local = {};
    obj.local.deck = new CardObject(sdl, d, false, cards);
    sdl.card = obj.local.deck;
    obj.opponent = {};
    obj.opponent.deck = new CardObject(sdo, d2, true, cards);
    obj.hand = [[],[]];
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
    var duel = ls.cardsys.duel;
    for(i in this.obj.local) {
        this.obj.local[i].update();
    }
    for(i in this.obj.opponent) {
        this.obj.opponent[i].update();
    }
    for(i in duel.local.slots) {
        duel.local.slots[i].update();
    }
    for(i in duel.remote.slots) {
        duel.remote.slots[i].update();
    }
    for(i in duel.local.hand) {
        duel.local.hand[i].update();
    }
    for(i in duel.remote.hand) {
        duel.local.hand[i].update();
    }
};