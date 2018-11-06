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

//Preloads data from files.
Game.preload = function() {
    this.game.load.spritesheet('cards', 'assets/cards.png',412,562);
    this.game.load.spritesheet('cardmask', 'assets/cardmask.png',412,562);
    this.game.load.spritesheet('buttons3', 'assets/buttons3.png',248,77);
    this.game.load.spritesheet('battlebtn', 'assets/battlebtns.png',128,128);
    this.game.load.image('prompt1', 'assets/Prompt1.png');
    this.game.load.image('close', 'assets/close.png');
    this.game.load.image('logo', 'assets/back_test_new3.png');
	this.game.load.json('duel_layout','assets/duel_layout.json');
	this.game.load.audio('se_card0', 'assets/flip.wav');
};

Game.create = function() {
    var game = this.game;
    var cardsys = Client.cardsys;
    var obj = this.obj;
    var ls = Client;
	DuelLayout = game.cache.getJSON('duel_layout');

    cardsys.player.deck.update();
	cardsys.player.deck.shuffle();
    var logo = game.add.sprite(game.world.centerX, game.world.centerY, 'logo');
    logo.anchor.setTo(0.5, 0.5);
    var d = cardsys.player.deck.get_top();
    var d2 = cardsys.duel.opponent.deck.get_top();
/*  var deckpos = [{
        x : -438,
        y : 412
    },{
        x : 438,
        y : -364
    }];
    var channelpos = [
    [{
        x : -440,
        y : 193
    },{
        x : -440,
        y : -141
    }],[{
        x : -440,
        y : 194
    },{
        x : -420,
        y : 385
    }]
    ];

    //Woah that's a big list of coordinates!
    var mbpos = [
    [{
        x : -330,
        y : 304
    },{
        x : -288,
        y : 192
    },{
        x : -330,
        y : 80
    },{
        x : -330,
        y : -28
    },{
        x : -288,
        y : -140
    },{
        x : -330,
        y : -252
    }],[{
        x : -440,
        y : 193
    },{
        x : -440,
        y : -141
    },{
        x : -440,
        y : -141
    },{
        x : -440,
        y : -141
    },{
        x : -440,
        y : -141
    },{
        x : -440,
        y : -141
    }]
    ];

    var mempos = [
    [{
        x : -177,
        y : 302
    },{
        x : -135,
        y : 190
    },{
        x : -177,
        y : 78
    },{
        x : -177,
        y : -31
    },{
        x : -135,
        y : -143
    },{
        x : -177,
        y : -255
    }],[{
        x : -440,
        y : 193
    },{
        x : -440,
        y : -141
    },{
        x : -440,
        y : -141
    },{
        x : -440,
        y : -141
    },{
        x : -440,
        y : -141
    },{
        x : -440,
        y : -141
    }]
    ];

    var offlinepos = [{
        x : -440,
        y : -365
    },{
        x : 438,
        y : -364
    }];
    var handrect = {
        x: 0,
        y: 0,
        width: 140,
        height: 104
    }*/
	var deckpos = [{
        x : DuelLayout.layers[1].objects[1].x,
        y : DuelLayout.layers[1].objects[1].y
    },{
        x : DuelLayout.layers[2].objects[1].x,
        y : DuelLayout.layers[2].objects[1].y
    }];
    var channelpos = [
    [{
        x : DuelLayout.layers[1].objects[2].x,
        y : DuelLayout.layers[1].objects[2].y
    },{
        x : DuelLayout.layers[1].objects[3].x,
        y : DuelLayout.layers[1].objects[3].y
    }],[{
        x : DuelLayout.layers[2].objects[2].x,
        y : DuelLayout.layers[2].objects[2].y
    },{
        x : DuelLayout.layers[2].objects[3].x,
        y : DuelLayout.layers[2].objects[3].y
    }]
    ];

    //Woah that's a big list of coordinates!
    var mbpos = [
    [{
        x : DuelLayout.layers[1].objects[4].x,
        y : DuelLayout.layers[1].objects[4].y
    },{
        x : DuelLayout.layers[1].objects[5].x,
        y : DuelLayout.layers[1].objects[5].y
    },{
        x : DuelLayout.layers[1].objects[6].x,
        y : DuelLayout.layers[1].objects[6].y
    },{
        x : DuelLayout.layers[1].objects[7].x,
        y : DuelLayout.layers[1].objects[7].y
    },{
        x : DuelLayout.layers[1].objects[8].x,
        y : DuelLayout.layers[1].objects[8].y
    },{
        x : DuelLayout.layers[1].objects[9].x,
        y : DuelLayout.layers[1].objects[9].y
    }],[{
        x : DuelLayout.layers[2].objects[4].x,
        y : DuelLayout.layers[2].objects[4].y
    },{
        x : DuelLayout.layers[2].objects[5].x,
        y : DuelLayout.layers[2].objects[5].y
    },{
        x : DuelLayout.layers[2].objects[6].x,
        y : DuelLayout.layers[2].objects[6].y
    },{
        x : DuelLayout.layers[2].objects[7].x,
        y : DuelLayout.layers[2].objects[7].y
    },{
        x : DuelLayout.layers[2].objects[8].x,
        y : DuelLayout.layers[2].objects[8].y
    },{
        x : DuelLayout.layers[2].objects[9].x,
        y : DuelLayout.layers[2].objects[9].y
    }]
    ];

    var mempos = [
    [{
        x : DuelLayout.layers[1].objects[10].x,
        y : DuelLayout.layers[1].objects[10].y
    },{
        x : DuelLayout.layers[1].objects[11].x,
        y : DuelLayout.layers[1].objects[11].y
    },{
        x : DuelLayout.layers[1].objects[12].x,
        y : DuelLayout.layers[1].objects[12].y
    },{
        x : DuelLayout.layers[1].objects[13].x,
        y : DuelLayout.layers[1].objects[13].y
    },{
        x : DuelLayout.layers[1].objects[14].x,
        y : DuelLayout.layers[1].objects[14].y
    },{
        x : DuelLayout.layers[1].objects[15].x,
        y : DuelLayout.layers[1].objects[15].y
    }],[{
        x : DuelLayout.layers[2].objects[10].x,
        y : DuelLayout.layers[2].objects[10].y
    },{
        x : DuelLayout.layers[2].objects[11].x,
        y : DuelLayout.layers[2].objects[11].y
    },{
        x : DuelLayout.layers[2].objects[12].x,
        y : DuelLayout.layers[2].objects[12].y
    },{
        x : DuelLayout.layers[2].objects[13].x,
        y : DuelLayout.layers[2].objects[13].y
    },{
        x : DuelLayout.layers[2].objects[14].x,
        y : DuelLayout.layers[2].objects[14].y
    },{
        x : DuelLayout.layers[2].objects[15].x,
        y : DuelLayout.layers[2].objects[15].y
    }]
    ];

    var offlinepos = [{
        x : DuelLayout.layers[1].objects[0].x,
        y : DuelLayout.layers[1].objects[0].y
    },{
        x : DuelLayout.layers[2].objects[0].x,
        y : DuelLayout.layers[2].objects[0].y
    }];
    var handrect = {
        x: 0,
        y: 0,
        width: 140,
        height: 104
    }
	Client.chat.write("DEBUG: DECK PLACED AT X=" + deckpos[0].x);
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
    scl[0].name = 'CH0';
    cardsys.duel.local.slots['CH1'] = scl[1];
    scl[1].name = 'CH1';
    slots.add(scl[0].obj);
    slots.add(scl[1].obj);
	var sco = [
        new Slot(channelpos[1][0], SlotType.CHANNEL, false),
        new Slot(channelpos[1][1], SlotType.CHANNEL, false)
    ];
    cardsys.duel.remote.slots['CH0'] = sco[0];
    sco[0].name = 'CH0';
    cardsys.duel.remote.slots['CH1'] = sco[1];
    sco[1].name = 'CH1';
    slots.add(sco[0].obj);
    slots.add(sco[1].obj);

    var soll = new Slot(offlinepos[0], SlotType.OFFLINE, false);
    cardsys.duel.local.slots['OFFLINE'] = soll;
    soll.name = 'OFFLINE';
    slots.add(soll.obj);

    var smbl = [
        new Slot(mbpos[0][0], SlotType.MEMROLE, false),
        new Slot(mbpos[0][1], SlotType.MEMROLE, false),
        new Slot(mbpos[0][2], SlotType.MEMROLE, false),
        new Slot(mbpos[0][3], SlotType.MEMROLE, false),
        new Slot(mbpos[0][4], SlotType.MEMROLE, false),
        new Slot(mbpos[0][5], SlotType.MEMROLE, false)
    ];
    for( i in smbl ) {
        cardsys.duel.local.slots['MBR' + i] = smbl[i];
        smbl[i].name = 'MBR' + i;
        slots.add(smbl[i].obj);
    }
	
	var smbo = [
        new Slot(mbpos[1][0], SlotType.MEMROLE, true),
        new Slot(mbpos[1][1], SlotType.MEMROLE, true),
        new Slot(mbpos[1][2], SlotType.MEMROLE, true),
        new Slot(mbpos[1][3], SlotType.MEMROLE, true),
        new Slot(mbpos[1][4], SlotType.MEMROLE, true),
        new Slot(mbpos[1][5], SlotType.MEMROLE, true)
    ];
    for( i in smbo ) {
        cardsys.duel.remote.slots['MBR' + i] = smbo[i];
        smbo[i].name = 'MBR' + i;
        slots.add(smbo[i].obj);
    }

    var smml = [
        new Slot(mempos[0][0], SlotType.MEME, false),
        new Slot(mempos[0][1], SlotType.MEME, false),
        new Slot(mempos[0][2], SlotType.MEME, false),
        new Slot(mempos[0][3], SlotType.MEME, false),
        new Slot(mempos[0][4], SlotType.MEME, false),
        new Slot(mempos[0][5], SlotType.MEME, false)
    ];
    for( i in smml ) {
        cardsys.duel.local.slots['MEM' + i] = smml[i];
        smml[i].name = 'MEM' + i;
        slots.add(smml[i].obj);
    }
	
	var smmo = [
        new Slot(mempos[1][0], SlotType.MEME, true),
        new Slot(mempos[1][1], SlotType.MEME, true),
        new Slot(mempos[1][2], SlotType.MEME, true),
        new Slot(mempos[1][3], SlotType.MEME, true),
        new Slot(mempos[1][4], SlotType.MEME, true),
        new Slot(mempos[1][5], SlotType.MEME, true)
    ];
    for( i in smmo ) {
        cardsys.duel.remote.slots['MEM' + i] = smmo[i];
        smmo[i].name = 'MEM' + i;
        slots.add(smmo[i].obj);
    }

    cards = game.add.group(game.world, "cards", false, false, false);

    obj.local = {};
    obj.local.deck = new DeckObject(sdl, d, false, cards);
	obj.lhand = new HandObject({x: 140, y: 560}, false, cards);
    sdl.card = obj.local.deck;
    obj.opponent = {};
    obj.opponent.deck = new DeckObject(sdo, d2, true, cards);
	obj.ohand = new HandObject({x: 1500 - 140, y: 560}, false, cards);
    obj.hand = [[],[]];
    sdo.card = obj.opponent.deck;

    //var deckobj = new CardObject(game, deckpos, d);
    obj.pv = game.add.button(
        game.world.centerX, 
        game.world.centerY, 
        'cards',
        function() {
            obj.pv.x = -1000;
        },
        this
    );
    obj.pv.anchor.setTo(0.5, 0.5);
    obj.pv.x = -1000;
    obj.pv.frame = d.index;

    //var battle_button = game.add.sprite(32,0, 'battlebtn');

    var prompt = game.add.sprite(game.world.centerX, game.world.centerY, 'prompt1');
    prompt.anchor.setTo(0.5, 0.5);
    prompt.x = -900;
    prompt.yes = game.add.button(
        game.world.centerX - (248 / 2),
        game.world.centerY + 77,
        'buttons3',
        function() {
            Client.game.state.start('Title',true,false,game);
            Client.cardsys.reset();
        },
        prompt.yes
    )
    prompt.yes.anchor.setTo(0.5, 0.5);
    prompt.yes.x = -900;
    prompt.yes.frame = 1;
    prompt.no = game.add.button(
        game.world.centerX + (248 / 2),
        game.world.centerY + 77,
        'buttons3',
        function() {
            prompt.x = -900;
            prompt.yes.x = -900;
            prompt.no.x = -900;
        },
        this
    )
    prompt.no.anchor.setTo(0.5, 0.5);
    prompt.no.x = -900;
    prompt.no.frame = 2;

    obj.close = game.add.button(
        0, 
        0, 
        'close',
        function() {
            prompt.x = game.world.centerX;
            prompt.yes.x = game.world.centerX - (248 / 2);
            prompt.no.x = game.world.centerX + (248 / 2);
        },
        this
    );

    Client.chat.write("Joined an AI game.");
};

Game.updateHand = function() {
	Game.obj.lhand.updateHandPositions();
	Game.obj.ohand.updateHandPositions();
}

Game.addToHand = function(card, op) {
	if(!op) {
		Game.obj.lhand.push(card);
	} else {
		Game.obj.ohand.push(card);
	}
}

Game.removeFromHand = function(card, op) {
	if(!op) {
		Game.obj.lhand.remove(card);
	} else {
		Game.obj.ohand.remove(card);
	}
}

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
	this.obj.lhand.update();
	this.obj.ohand.update();
    //for(i in duel.local.hand) {
    //    duel.local.hand[i].update();
    //}
    //for(i in duel.remote.hand) {
    //    duel.remote.hand[i].update();
    //}
};

/*Game.render = function() {
	
}*/