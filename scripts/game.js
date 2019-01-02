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
Game.waitAnim = false;
Game.inputLayer = 0;
Game.animCB = null;
Game.animTargets = [];
Game.animQueue = [];

Game.init = function(game, data){
    this.game = game;
    this.game.stage.disableVisibilityChange = true;
    this.type = data.type;
};

//Preloads data from files.
Game.preload = function() {
    //this.game.load.spritesheet('cards', 'assets/cards.png',412,562);
    this.game.load.spritesheet('cardmask', 'assets/cardmask.png',412,562);
    this.game.load.spritesheet('buttons3', 'assets/buttons3.png',248,77);
    this.game.load.spritesheet('battlebtn', 'assets/battlebtns.png',128,128);
	this.game.load.spritesheet('targetmask', 'assets/targetmask.png',412,562);
    this.game.load.image('prompt1', 'assets/Prompt1.png');
    this.game.load.image('promptsc', 'assets/cardselectprompt.png');
    this.game.load.image('close', 'assets/close.png');
    this.game.load.image('logo', 'assets/back_test_new3.png');
    this.game.load.image('wait', 'assets/wait.png');
    this.game.load.image('viewmask', 'assets/viewmask.png');
	this.game.load.json('duel_layout','assets/duel_layout.json');
};

Game.create = function() {
    var game = this.game;
    var cardsys = Client.cardsys;
    var obj = this.obj;
    var ls = Client;
    DuelLayout = game.cache.getJSON('duel_layout');
    Game.inputLayer = 0;

    this.cardsys = cardsys;
    //cardsys.player.deck.shuffle();
    cardsys.player.deck.update();
    cardsys.duel.opponent.deck.update();
    var logo = game.add.sprite(game.world.centerX, game.world.centerY, 'logo');
    logo.anchor.setTo(0.5, 0.5);
    var d = cardsys.player.deck.get_top();
    var d2 = cardsys.duel.opponent.deck.get_top();

    //The following block of code instantiates the positions/coordinates of the objects from the values defined in assets/duel_layout.json
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

    var promptscpos = {
        x: DuelLayout.layers[3].objects[0].x,
        y: DuelLayout.layers[3].objects[0].y,
        width: DuelLayout.layers[3].objects[0].width,
        height: DuelLayout.layers[3].objects[0].height,
        text: {
            x: DuelLayout.layers[3].objects[1].x,
            y: DuelLayout.layers[3].objects[1].y,
            pxsize: DuelLayout.layers[3].objects[1].text.pixelsize
        },
        card: {
            x: DuelLayout.layers[3].objects[2].x,
            y: DuelLayout.layers[3].objects[2].y
        },
        button: {
            x: DuelLayout.layers[3].objects[3].x,
            y: DuelLayout.layers[3].objects[3].y
        }
    }
    //Client.chat.write("DEBUG: DECK PLACED AT X=" + deckpos[0].x);
    
    //The following chunk of code instantiates game objects with coordinates defined in the previous section.
    //This setup allows the objects to render and organizes them.
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
        new Slot(channelpos[1][0], SlotType.CHANNEL, true),
        new Slot(channelpos[1][1], SlotType.CHANNEL, true)
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
        new Slot(mbpos[0][0], SlotType.MEMROLE, false, scl[0]),
        new Slot(mbpos[0][1], SlotType.MEMROLE, false, scl[0]),
        new Slot(mbpos[0][2], SlotType.MEMROLE, false, scl[0]),
        new Slot(mbpos[0][3], SlotType.MEMROLE, false, scl[1]),
        new Slot(mbpos[0][4], SlotType.MEMROLE, false, scl[1]),
        new Slot(mbpos[0][5], SlotType.MEMROLE, false, scl[1])
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
	ui = game.add.group(game.world, "ui", false, false, false);

    obj.local = {};
    obj.local.deck = new DeckObject(sdl, d, false, cards);
	obj.lhand = new HandObject({x: 140, y: 560}, false, cards);
	obj.loffline = new OfflineObject(offlinepos[0], false, cards);
    sdl.card = obj.local.deck;
    obj.opponent = {};
    obj.opponent.deck = new DeckObject(sdo, d2, true, cards);
	obj.ohand = new HandObject({x: 1500 - 140, y: 560}, false, cards);
	obj.ooffline = new OfflineObject(offlinepos[1], true, cards);
    obj.hand = [[],[]];
    sdo.card = obj.opponent.deck;
	
	obj.targetmsk = game.add.tileSprite(-1000, 0, 140, 104, 'targetmask', 2, ui);
	obj.targetmsk.anchor.setTo(0.5, 0.5);
	obj.targetmsk.width = 104;
	obj.targetmsk.height = 140;
    obj.targetmsk.angle = 90;
    
    obj.promptsc = new SelectCardPrompt(promptscpos);

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

    this.waitico = game.add.sprite(15, 15, 'wait');

    obj.phasebtn = game.add.button(
        400, 
        64, 
        'buttons3',
        function() {
            var duel = Client.cardsys.duel;
            if(Game.inputLayer > 0) return;
            if(duel.turn !== Client.cardsys.player) return;
            if(duel.phase == DuelPhase.ACTION) {
                duel.phase = DuelPhase.BATTLE;
                Client.sendMove('PHASE BATTLE');
                duel.battlePhase();
                return;
            }
            if(duel.phase == DuelPhase.BATTLE) {
                duel.phase = DuelPhase.END;
                Client.sendMove('PHASE END');
                duel.endPhase();
                return;
            }
        },
        this
    );

    //var battle_button = game.add.sprite(32,0, 'battlebtn');

    var prompt = game.add.sprite(game.world.centerX, game.world.centerY, 'prompt1');
    prompt.anchor.setTo(0.5, 0.5);
    prompt.x = -900;
    prompt.yes = game.add.button(
        game.world.centerX - (248 / 2),
        game.world.centerY + 77,
        'buttons3',
        function() {
            Client.leaveGame();
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

    obj.turnnum = game.add.text(
        0, 
        64, 
        "Turn: \nPrize Tokens: \n", {
        font: "18px Courier New",
        fill: "#888888",
        stroke: '#ffffff',
        align: "left"
    });
    
    obj.viewmsk = game.add.sprite(0, 0, 'viewmask', 2, ui);
    obj.viewmsk.alpha = 0;
    
    obj.msgtext = game.add.text(
        game.world.centerX, 
        game.world.centerY, 
        "", {
        font: "24px Courier New",
        fill: "#bbbbbb",
        stroke: '#000000',
        align: "left"
    });
    obj.msgtext.alpha = 0;
    obj.msgtext.anchor.setTo(0.5, 0.5);

    //This section prints a message to the chat, informing the player of the successful connection to the game.
    if(Game.type === GameType.AI) {
        Client.chat.write("Joined an AI game.");
    } else if(Game.type === GameType.RandomMatch) {
        Client.chat.write("Joined random match vs @" + Client.cardsys.duel.opponent.name + ".")
    }

    //This plays the opening animation, in which, each players draws 5 cards.
    //tgts is merely a placeholder since there is no object being manipulated by the function.
    //Rather, the animation is a sequence of function calls that are spaced out over a period of a few hundred ms.
    var tgts = [obj.close];
    Game.playAnimation(AnimType.BEGIN, tgts, false, function(tg,op){
    });
};

//Gets the current duel.
Game.getCurrentDuel = function() {
    return this.cardsys.duel;
}

//Gets the player object representing the local client player.
Game.getLocalPlayer = function() {
    return this.cardsys.player;
}

//Draws a card from either player's deck.
//n specifies the number of cards to draw (default 1).
Game.drawCard = function(op, n=1, cb=function(duel){}) {
    if(!op) {
        Game.obj.local.deck.draw(cb);
    } else {
        Game.obj.opponent.deck.draw(cb);
    }
}

//Performs an update to the hand object.
//Usually done when an object is moved from the hand to another location.
Game.updateHand = function(cb=function(duel){}) {
	Game.obj.lhand.updateHandPositions(function(c){},cb);
	Game.obj.ohand.updateHandPositions(function(c){},cb);
}

Game.addToHand = function(card, op) {
	if(!op) {
		Game.obj.lhand.push(card);
	} else {
		Game.obj.ohand.push(card);
	}
}

Game.getHand = function(index, op) {
    if(!op) {
        return Game.obj.lhand.get(index);
    } else {
        return Game.obj.ohand.get(index);
    }
}

//Opens up a prompt for the user to select a card from the list.
Game.promptSelectCard = function(msg, loc, filter, callback) {
    var game = this.game;
    if(loc == CardLocation.DECK) {
        var cardList = Game.getCurrentDuel().getFilteredList(loc, filter, false);
        if(cardList.length <= 0) {
            callback(null);
            return;
        }
        var promptsc = Game.obj.promptsc;
        promptsc.clear();
        for(i in cardList) {
            //Client.chat.write(cardList[i].getName());
            promptsc.add(cardList[i]);
        }
        promptsc.setMsg(msg);
        promptsc.setConfirmCallback(callback);
        promptsc.show();
        Game.inputLayer = 1;
    }
}

//Adds a card to the hand, using a filter.
Game.addCardToHand = function(loc, op, filter) {
    if(loc == CardLocation.DECK) {
        if(!op) {
            Game.promptSelectCard("Select a card to add to your hand.", loc, filter, function(c){
                if(c === null) return;
                var next = new CardObject(Game.obj.local.deck, c, false, Game.obj.local.deck.parent);
                var i = Game.getCurrentDuel().player.deck.remove(c);
                next.revealed = false;
                Game.obj.local.deck.parent.bringToTop(next.obj);
                Client.sounds['card0'].play();
                next.slot = null;
                Game.addToHand(next, false);
                Game.obj.lhand.updateHandPositions(function(n){
                    var tgts = [n];
                    Game.playAnimation(AnimType.FLIPUP, tgts, false, function(card, op){
                    });
                    Game.queueAnimation(AnimType.TARGET, tgts, false, function(card, op){
                    });
                    //Game.queueAnimation(AnimType.FLIPDOWN, tgts, false, function(card, op){
                    //});
                });
                Client.sendMove('ADDTOHAND DECK ' + i);
            });
        }
    }
}

Game.addCardToHandI = function(loc, op, index, cb=function(duel){}) {
    if(loc == CardLocation.DECK) {
        if(op) {
            if(i == -1) return;
            var c = Game.getCurrentDuel().opponent.deck.removei(index);
            var next = new CardObject(Game.obj.remote.deck, c, true, Game.obj.remote.deck.parent);
            next.revealed = false;
            Game.obj.remote.deck.parent.bringToTop(next.obj);
            Client.sounds['card0'].play();
            next.slot = null;
            Game.addToHand(next, true);
            Game.obj.lhand.updateHandPositions(function(n){
                var tgts = [n];
                Game.playAnimation(AnimType.FLIPUP, tgts, true, function(card, op){
                });
                Game.queueAnimation(AnimType.TARGET, tgts, true, function(card, op){
                });
                Game.queueAnimation(AnimType.FLIPDOWN, tgts, true, function(card, op){
                    cb(Game.getCurrentDuel());
                });
            });
        }
    }
}

Game.removeFromHand = function(card, op) {
	if(!op) {
		return Game.obj.lhand.remove(card);
	} else {
		return Game.obj.ohand.remove(card);
	}
}

//Checks whether a given card is in either player's hand.
Game.isInHand = function(card, op) {
	if(!op) {
		return Game.obj.lhand.check(card);
	} else {
		return Game.obj.ohand.check(card);
	}
}

//Sends a message to the server and waits for the opponent to choose a card to activate in response.
Game.awaitCheckEffect = function(type, callback) {
    //Client.sendCheckEffect(type, callback);
    //Since the multiplayer is yet to be implemented, the effect/attack will go through without response from the opponent.
    callback();
}

//Sends a message to the server and waits for the opponent to choose a target for an effect activation.
//Returns with an object descibing the player's decision.
Game.awaitPlayerDecision = function(callback=function(data){}) {
    Client.awaitOpponentDecision(callback);
}

//Awards a prize token to a player
Game.awardPrizeToken = function(op) {
    if(!op) {
        Game.getCurrentDuel().player.prizeTokens++;
    } else {
        Game.getCurrentDuel().opponent.prizeTokens++;
    }
}

//Checks whether the card is on the field.
Game.isOnField = function(card, op) {
	if(!op) {
		return Game.obj.lhand.check(card);
	} else {
		return Game.obj.ohand.check(card);
	}
}

//Plays an animation given animation targets.
Game.playAnimation = function(animid, targets, op, callback=function(card, op){}, value = 0) {
	this.waitAnim = true;
	this.animCB = callback;
	if(typeof targets[0] !== 'undefined')
		this.animTargets = targets;
	var obj = Game.obj;
	var game = this.game;
    var cb = callback;
	if(animid == AnimType.EFFECT) {
		obj.pv.alpha = 0;
		obj.pv.inputEnabled = false;
		obj.pv.key = 'cards'
		obj.pv.frame = targets[0].card.index - 1;
		obj.pv.x = game.world.centerX;
		Client.sounds['effect'].play();
		var tween = game.add.tween(obj.pv).to( { alpha: 1 }, 100, Phaser.Easing.Linear.None, true, 0);
		var tween2 = game.add.tween(obj.pv).to( { alpha: 1 }, 1, Phaser.Easing.Linear.None, false, 499);
		var tween3 = game.add.tween(obj.pv).to( { alpha: 0 }, 400, Phaser.Easing.Linear.None, false, 0);
		tween.chain(tween2);
		tween2.chain(tween3);
		tween3.onComplete.addOnce(function(obj, tween){
			obj.alpha = 1; 
			obj.x = -1000;
			obj.inputEnabled = true;
			Game.waitAnim = false;
			if(cb !== undefined)
				cb(targets[0], op);
			if(Game.animQueue.length > 0) {
				var next = Game.animQueue.shift();
				Game.playAnimation(next['animid'], next['targets'], next['op'], next['callback']);
			}
		});
		tween.start();
	} else if(animid == AnimType.TARGET) {
		var mask = obj.targetmsk;
		mask.alpha = 0;
		mask.x = targets[0].obj.x;
		mask.y = targets[0].obj.y;
		Client.sounds['target'].play();
		var tween = game.add.tween(mask).to( { alpha: 1 }, 50, Phaser.Easing.Linear.None, true, 0);
		var tween2 = game.add.tween(mask).to( { alpha: 1 }, 1, Phaser.Easing.Linear.None, false, 999);
		var tween3 = game.add.tween(mask).to( { alpha: 0 }, 200, Phaser.Easing.Linear.None, false, 0);
		tween.chain(tween2);
		tween2.chain(tween3);
		tween3.onComplete.addOnce(function(obj, tween){
			obj.alpha = 1; 
			obj.x = -1000;
			Game.waitAnim = false;
			if(cb !== undefined)
				cb(Game.animTargets[0], op);
			if(Game.animQueue.length > 0) {
				var next = Game.animQueue.shift();
				Game.playAnimation(next['animid'], next['targets'], next['op'], next['callback']);
			}
		});
		tween.start();
	} else if(animid == AnimType.TOPGRAVE) {
	} else if(animid == AnimType.FLIPUP) {
        var obj = targets[0].obj;
        targets[0].revealed = false;
        var w = obj.width;
        Client.sounds['card3'].play();
        var tween = game.add.tween(obj).to( { width: 0 }, 100, Phaser.Easing.Linear.None, false, 0);
		var tween2 = game.add.tween(obj).to( { width: w }, 100, Phaser.Easing.Linear.None, false, 0);
        tween.onComplete.addOnce(function(obj, tween){
            targets[0].revealed = true;
        });
        tween2.onComplete.addOnce(function(obj, tween){
            Game.waitAnim = false;
            if(cb !== undefined)
				cb(Game.animTargets[0], op);
			if(Game.animQueue.length > 0) {
				var next = Game.animQueue.shift();
				Game.playAnimation(next['animid'], next['targets'], next['op'], next['callback']);
			}
        });
        tween.chain(tween2);
        tween.start();
	} else if(animid == AnimType.ATTACK) {
        var attacker = targets[0].obj;
        var attackertxt = targets[0].card.obj.text;
        var attacktg = targets[1].obj;
        var ox = attacker.x;
        var oy = attacker.y;
        Client.chat.write(`${attacker.x}, ${attacker.y} => ${attacktg.x}, ${attacktg.y}`);
        //Client.sounds['hit2'].play();
        var tween = null;
        var tween3 = null;
        if(op) {
            tween = game.add.tween(attacker).to( { x: attacktg.x + 101, y: attacktg.y }, 200, Phaser.Easing.Quadratic.In, false, 0);
            tween3 = game.add.tween(attackertxt).to( { x: attacktg.x + 101, y: attacktg.y }, 200, Phaser.Easing.Quadratic.In, false, 0);
        } else {
            tween = game.add.tween(attacker).to( { x: attacktg.x - 101, y: attacktg.y }, 200, Phaser.Easing.Quadratic.In, false, 0);
            tween3 = game.add.tween(attackertxt).to( { x: attacktg.x - 101, y: attacktg.y }, 200, Phaser.Easing.Quadratic.In, false, 0);
        }
        var tween2 = game.add.tween(attacker).to( { x: ox, y: oy }, 200, Phaser.Easing.Quadratic.Out, false, 0);
        var tween4 = game.add.tween(attackertxt).to( { x: ox, y: oy }, 200, Phaser.Easing.Quadratic.Out, false, 0);
		//var tween2 = game.add.tween(obj).to( { width: w }, 100, Phaser.Easing.Linear.None, false, 0);
        tween.onComplete.addOnce(function(obj, tween){
            Client.sounds['hit2'].play();
        });
        tween2.onComplete.addOnce(function(obj, tween){
            Game.waitAnim = false;
            if(cb !== undefined)
				cb(Game.animTargets[0], op);
			if(Game.animQueue.length > 0) {
				var next = Game.animQueue.shift();
				Game.playAnimation(next['animid'], next['targets'], next['op'], next['callback'], next['value']);
			}
        });
        tween.chain(tween2);
        tween.start();
        tween3.chain(tween4);
        tween3.start();
    } else if(animid == AnimType.TOGRAVE) {
        var obj = targets[0].obj;
        var objtxt = targets[0].card.obj.text;
        obj.inputEnabled = false;
        Client.sounds['tograve'].play();
        var tween = null;
        var tweentxt = null;
        if(op) {
            var dest = {
                x: Game.obj.ooffline.pos.x,
                y: Game.obj.ooffline.pos.y
            }
            tween = game.add.tween(obj).to( dest, 250, Phaser.Easing.Quadratic.InOut, false, 0);
            tweentxt = game.add.tween(objtxt).to( dest, 250, Phaser.Easing.Quadratic.InOut, false, 0);
        } else {
            var dest = {
                x: Game.obj.loffline.pos.x,
                y: Game.obj.loffline.pos.y
            }
            tween = game.add.tween(obj).to( dest, 250, Phaser.Easing.Quadratic.InOut, false, 0);
            tweentxt = game.add.tween(objtxt).to( dest, 250, Phaser.Easing.Quadratic.InOut, false, 0);
        }
        //var tween2 = game.add.tween(obj).to( { x: ox, y: oy }, 300, Phaser.Easing.Quadratic.Out, false, 0);
		//var tween2 = game.add.tween(obj).to( { width: w }, 100, Phaser.Easing.Linear.None, false, 0);
        tween.onComplete.addOnce(function(obj, tween){
            obj.inputEnabled = true;
            Game.waitAnim = false;
            Game.obj.loffline.updatePositions();
            if(cb !== undefined)
				cb(Game.animTargets[0], op);
			if(Game.animQueue.length > 0) {
				var next = Game.animQueue.shift();
				Game.playAnimation(next['animid'], next['targets'], next['op'], next['callback'], next['value']);
			}
        });
        tween.start();
        tweentxt.start();
    } else if(animid == AnimType.DAMAGE) {
        var tg = targets[0].obj;
        var obj = game.add.text(
            tg.x, 
            tg.y, 
            "-" + value, {
            font: "32px Courier New",
            fill: "#ff0000",
            stroke: '#000000',
            align: "left"
        });
        obj.strokeThickness = 4;
        var tween = game.add.tween(obj).to( { y: tg.y + 200 }, 1000, Phaser.Easing.Linear.None, false, 0);
        tween.onComplete.addOnce(function(obj, tween){
            obj.x = -1000;
            Game.waitAnim = false;
            if(cb !== undefined)
				cb(Game.animTargets[0], op);
			if(Game.animQueue.length > 0) {
				var next = Game.animQueue.shift();
				Game.playAnimation(next['animid'], next['targets'], next['op'], next['callback'], next['value']);
			}
        });
        tween.start();
    } else if(animid == AnimType.WIN) {
        var tg = targets[0];
        var txt = targets[1];
        var tween = game.add.tween(tg).to( { alpha: 1 }, 1000, Phaser.Easing.Linear.None, false, 0);
        var tween2 = game.add.tween(txt).to( { alpha: 1 }, 1000, Phaser.Easing.Linear.None, false, 0);
        tween.onComplete.addOnce(function(obj, tween){
            Game.waitAnim = false;
            if(cb !== undefined)
				cb(Game.animTargets[0], op);
			if(Game.animQueue.length > 0) {
				var next = Game.animQueue.shift();
				Game.playAnimation(next['animid'], next['targets'], next['op'], next['callback'], next['value']);
			}
        });
        tween.start();
        tween2.start();
	} else if(animid == AnimType.BEGIN) {
        var tg = targets[0];
        var tweens = [];
        tweens.push(game.add.tween(tg).to( { alpha: 1 }, 1, Phaser.Easing.Linear.None, false, 500));
        for(var ii = 1; ii < 10; ii++) {
            tweens.push(game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0));
        }
        for(var ii = 0; ii < 5; ii++) {
            tweens[ii].onComplete.addOnce(function(obj, tween){
                Game.drawCard(true);
            });
        }
        for(var ii = 5; ii < 9; ii++) {
            tweens[ii].onComplete.addOnce(function(obj, tween){
                Game.drawCard(false);
            });
        }
        tweens[9].onComplete.addOnce(function(obj, tween){
            Game.drawCard(false);
            Game.getCurrentDuel().draws = 0;
            Game.getCurrentDuel().phase = DuelPhase.ACTION;
            Game.waitAnim = false;
            if(cb !== undefined)
				cb(Game.animTargets[0], op);
			if(Game.animQueue.length > 0) {
				var next = Game.animQueue.shift();
				Game.playAnimation(next['animid'], next['targets'], next['op'], next['callback'], next['value']);
			}
        });
        /*var tween3 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween4 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween5 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween6 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween7 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween8 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween9 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween10 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);*/
        /*tween.onComplete.addOnce(function(obj, tween){
            Game.drawCard(true);
        });
        tween2.onComplete.addOnce(function(obj, tween){
            Game.drawCard(true);
        });
        tween3.onComplete.addOnce(function(obj, tween){
            Game.drawCard(true);
        });
        tween4.onComplete.addOnce(function(obj, tween){
            Game.drawCard(true);
        });
        tween5.onComplete.addOnce(function(obj, tween){
            Game.drawCard(true);
        });
        tween6.onComplete.addOnce(function(obj, tween){
            Game.drawCard(false);
        });
        tween7.onComplete.addOnce(function(obj, tween){
            Game.drawCard(false);
        });
        tween8.onComplete.addOnce(function(obj, tween){
            Game.drawCard(false);
        });
        tween9.onComplete.addOnce(function(obj, tween){
            Game.drawCard(false);
        });
        tween10.onComplete.addOnce(function(obj, tween){
            Game.drawCard(false);
            Game.getCurrentDuel().draws = 0;
            Game.getCurrentDuel().phase = 3;
            Game.waitAnim = false;
            if(cb !== undefined)
				cb(Game.animTargets[0], op);
			if(Game.animQueue.length > 0) {
				var next = Game.animQueue.shift();
				Game.playAnimation(next['animid'], next['targets'], next['op'], next['callback'], next['value']);
			}
        });
        tween.chain(tween2);
        tween2.chain(tween3);
        tween3.chain(tween4);
        tween4.chain(tween5);
        tween5.chain(tween6);
        tween6.chain(tween7);
        tween7.chain(tween8);
        tween8.chain(tween9);
        tween9.chain(tween10);
        */
        for(var jj = 0; jj < 9; jj++) {
            tweens[jj].chain(tweens[jj+1]);
        }
        tweens[0].start();
	}
}

//Adds an animation to the Animation queue
Game.queueAnimation = function(animid, targets, op, callback=function(card,op){}, value=0) {
    //if(this.animQueue.length < 1) {
    //    this.playAnimation(animid, targets, op, callback, value);
    //    return;
    //}
	this.animQueue.push({
		animid: animid, 
		targets: targets, 
		op: op, 
        callback: callback,
        value: value
    });
}

//Sends a card to the grave
Game.sendToGrave = function(card, op) {
	if(!op) {
        this.obj.loffline.push(card);
        if(card.slot !== null) {
		    card.slot.card = null;
            card.slot = null;
        }
        card.parent.bringToTop(card);
        var targets = [card];
        this.queueAnimation(AnimType.TOGRAVE, targets, op);
		//Client.sounds['tograve'].play();
		//this.obj.loffline.updatePositions();
	} else {
        this.obj.ooffline.push(card);
        if(card.slot !== null) {
		    card.slot.card = null;
            card.slot = null;
        }
        card.parent.bringToTop(card);
        var targets = [card];
        this.queueAnimation(AnimType.TOGRAVE, targets, op);
    }
	Client.chat.write("DEBUG: Sent to grave.");
}

//Attacks
Game.attack = function(c, s, cb=function(duel){}) {
    Client.chat.write("DEBUG: Attack.");
    Game.awaitCheckEffect(CheckEffectType.ATTACK, function() {
        var targets = [c, s.card];
        var targets2 = [s.card];
        var op = !s.isOpponents;
        var damage = 0;
        if(s.type === SlotType.MEMROLE) {
            damage = calcDamage(c.getAttack(), s.card.getDefense());
        }
        Game.playAnimation(AnimType.ATTACK, targets, op, function(card, op) {
            var local = Client.cardsys.duel.local;
            local.selected = null;
        });
        var hasBeenDestroyed = s.card.card.damage(damage);
        if(s.card.card.isChannel()) hasBeenDestroyed = true;
        if(hasBeenDestroyed) {
            Game.queueAnimation(AnimType.DAMAGE, targets2, op, function(card, op) {
            }, damage);
        } else {
            Game.queueAnimation(AnimType.DAMAGE, targets2, op, function(card, op) {
                cb(Client.cardsys.duel);
            }, damage);
        }
        if(hasBeenDestroyed) {
            s.card.parent.bringToTop(s.card);
            Game.queueAnimation(AnimType.TOGRAVE, targets2, !op, function(card, op){
                if(op)
                    Game.obj.ooffline.push(card);
                else
                    Game.obj.loffline.push(card);
                if(card.slot !== null) {
                    card.slot.card = null;
                    card.slot = null;
                }
                Game.awardPrizeToken(!op);
                cb(Client.cardsys.duel);
            });
        }
    });
}

Game.playCard = function(card, op, cb=function(duel){}) {
	if(card.card.type == CardType.MEME) {
        Client.chat.write("DEBUG: The effect of " + card.card.name + " activates.");
		this.playAnimation(AnimType.EFFECT, [card], op, function(card, op){
			if(card.card.category !== MemeCategory.CTN) {
                Game.sendToGrave(card, op);
                //Game.addCardToHand(CardLocation.DECK, false, function(c){return c.isMeme();});
            } else {
                //Game.addCardToHand(CardLocation.DECK, false, function(c){return c.isMeme();});
            }
		});
	}
	if(card.card.type == CardType.CHANNEL) {
		Client.chat.write("DEBUG: The effect of " + card.card.name + " activates.");
		var tgs = [card];
		this.playAnimation(AnimType.EFFECT, tgs, op, function(card, op){
		});
		this.queueAnimation(AnimType.TARGET, tgs, op, function(card, op){
            cb(Client.cardsys.duel);
		});
    }
    if(card.card.type == CardType.MEMBER) {
		//Client.chat.write("DEBUG: The effect of " + card.card.name + " activates.");
        var tgs = [card];
        this.playAnimation(AnimType.EFFECT, tgs, op, function(card, op){
            cb(Client.cardsys.duel);
		});
		//this.queueAnimation(AnimType.TARGET, tgs, op, function(card, op){
        //    
		//});
	}
    if(card.card.type == CardType.ROLE) {
		Client.chat.write("DEBUG: The effect of " + card.card.name + " activates.");
		var tgs = [card];
		this.playAnimation(AnimType.EFFECT, tgs, op, function(card, op){
            cb(Client.cardsys.duel);
		});
		//this.queueAnimation(AnimType.TARGET, tgs, op, function(card, op){
        //    
		//});
	}
}

Game.queueWin = function() {
    if(Game.waitAnim) {
        var msk = Game.obj.viewmsk;
        var msktxt = Game.obj.msgtext;
        msktxt.setText("You won the duel!");
        var tgts = [msk, msktxt];
        this.queueAnimation(AnimType.WIN, tgts, false, function(card, op){
            Game.inputLayer++;
        });
    } else {
        var msk = Game.obj.viewmsk;
        var msktxt = Game.obj.msgtext;
        msktxt.setText("You won the duel!");
        var tgts = [msk, msktxt];
        this.playAnimation(AnimType.WIN, tgts, false, function(card, op){
            Game.inputLayer++;
        });
    }
}

Game.queueLoss = function(name) {
    if(Game.waitAnim) {
        var msk = Game.obj.viewmsk;
        var msktxt = Game.obj.msgtext;
        msktxt.setText(`${name} won the duel...`);
        var tgts = [msk, msktxt];
        this.queueAnimation(AnimType.WIN, tgts, false, function(card, op){
            Game.inputLayer++;
        });
    } else {
        var msk = Game.obj.viewmsk;
        var msktxt = Game.obj.msgtext;
        msktxt.setText(`${name} won the duel...`);
        var tgts = [msk, msktxt];
        this.playAnimation(AnimType.WIN, tgts, false, function(card, op){
            Game.inputLayer++;
        });
    }
}

//Updates the state of all objects in the scene.
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
	this.obj.loffline.update();
	this.obj.ohand.update();
    this.obj.ooffline.update();
    this.obj.promptsc.update();
    if(Client.cardsys.duel.awaitMove == true || Game.waitAnim == true) {
        this.waitico.x = 25
    } else {
        this.waitico.x = -1000;
    }
    if(Game.getCurrentDuel().turn !== Game.getLocalPlayer()) {
        this.obj.phasebtn.frame = 3;
    }
    else {
        var duel = Client.cardsys.duel;
        if(duel.phase == DuelPhase.ACTION) {
            this.obj.phasebtn.frame = 5;
        }
        else if(duel.phase == DuelPhase.BATTLE) {
            this.obj.phasebtn.frame = 0;
        }
        else {
            this.obj.phasebtn.frame = 3;
        }
    }
    var turnnumber = Game.getCurrentDuel().turnNumber;
    var numPrizeTokens = Game.getLocalPlayer().prizeTokens;
    var numPrizeTokens2 = Game.getCurrentDuel().opponent.prizeTokens;
    this.obj.turnnum.setText(`Turn: ${turnnumber}\nPrize Tokens: ${numPrizeTokens}`);
    //for(i in duel.local.hand) {
    //    duel.local.hand[i].update();
    //}
    //for(i in duel.remote.hand) {
    //    duel.remote.hand[i].update();
    //}
};

/*Game.render = function() {
    
}*/