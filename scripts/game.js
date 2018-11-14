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
    this.game.load.spritesheet('cards', 'assets/cards.png',412,562);
    this.game.load.spritesheet('cardmask', 'assets/cardmask.png',412,562);
    this.game.load.spritesheet('buttons3', 'assets/buttons3.png',248,77);
    this.game.load.spritesheet('battlebtn', 'assets/battlebtns.png',128,128);
	this.game.load.spritesheet('targetmask', 'assets/targetmask.png',412,562);
    this.game.load.image('prompt1', 'assets/Prompt1.png');
    this.game.load.image('promptsc', 'assets/cardselectprompt.png');
    this.game.load.image('close', 'assets/close.png');
    this.game.load.image('logo', 'assets/back_test_new3.png');
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
    cardsys.player.deck.update();
	cardsys.player.deck.shuffle();
    var logo = game.add.sprite(game.world.centerX, game.world.centerY, 'logo');
    logo.anchor.setTo(0.5, 0.5);
    var d = cardsys.player.deck.get_top();
    var d2 = cardsys.duel.opponent.deck.get_top();
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

    Client.chat.write("Joined an AI game.");
    var tgts = [obj.close];
    Game.playAnimation(AnimType.BEGIN, tgts, false, function(tg,op){

    });
};

Game.getCurrentDuel = function() {
    return this.cardsys.duel;
}

Game.getLocalPlayer = function() {
    return this.cardsys.player;
}

Game.drawCard = function(op, n=1) {
    if(!op) {
        Game.obj.local.deck.draw();
    } else {
        Game.obj.opponent.deck.draw();
    }
}

Game.updateHand = function() {
	Game.obj.lhand.updateHandPositions(function(c){});
	Game.obj.ohand.updateHandPositions(function(c){});
}

Game.addToHand = function(card, op) {
	if(!op) {
		Game.obj.lhand.push(card);
	} else {
		Game.obj.ohand.push(card);
	}
}

//Opens up a prompt for the user to select a card from the list.
Game.promptSelectCard = function(msg, loc, filter, callback) {
    var game = this.game;
    if(loc == CardLocation.DECK) {
        var cardList = Game.getCurrentDuel().getFilteredList(loc, filter, false);
        var promptsc = Game.obj.promptsc;
        promptsc.clear();
        for(i in cardList) {
            Client.chat.write(cardList[i].getName());
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
                var next = new CardObject(Game.obj.local.deck, c, false, Game.obj.local.deck.parent);
                Game.getCurrentDuel().player.deck.remove(c);
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
            });
        }
    }
}

Game.removeFromHand = function(card, op) {
	if(!op) {
		Game.obj.lhand.remove(card);
	} else {
		Game.obj.ohand.remove(card);
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

//Sends a message to the server and waits for the opponent to chose a card to activate in response.
Game.awaitCheckEffect = function(type, callback) {
    //Client.sendCheckEffect(type, callback);
    //Since the multiplayer is yet to be implemented, the effect/attack will go through without response from the opponent.
    callback();
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
        var attacktg = targets[1].obj;
        var ox = attacker.x;
        var oy = attacker.y;
        //Client.sounds['hit2'].play();
        var tween = null;
        if(op) {
            tween = game.add.tween(attacker).to( { x: attacktg.x - 201, y: attacktg.y }, 300, Phaser.Easing.Quadratic.In, false, 0);
        } else {
            tween = game.add.tween(attacker).to( { x: attacktg.x + 201, y: attacktg.y }, 300, Phaser.Easing.Quadratic.In, false, 0);
        }
        var tween2 = game.add.tween(attacker).to( { x: ox, y: oy }, 300, Phaser.Easing.Quadratic.Out, false, 0);
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
    } else if(animid == AnimType.TOGRAVE) {
        var obj = targets[0].obj;
        obj.inputEnabled = false;
        Client.sounds['tograve'].play();
        var tween = null;
        if(op) {
            var dest = {
                x: Game.obj.ooffline.pos.x,
                y: Game.obj.ooffline.pos.y
            }
            tween = game.add.tween(obj).to( dest, 250, Phaser.Easing.Quadratic.InOut, false, 0);
        } else {
            var dest = {
                x: Game.obj.loffline.pos.x,
                y: Game.obj.loffline.pos.y
            }
            tween = game.add.tween(obj).to( dest, 250, Phaser.Easing.Quadratic.InOut, false, 0);
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
    } else if(animid == AnimType.DAMAGE) {
        var tg = targets[0].obj;
        var obj = game.add.text(
            tg.x, 
            tg.y, 
            "-" + value, {
            font: "16px Courier New",
            fill: "#ff0000",
            stroke: '#000000',
            align: "left"
        });
        var tween = game.add.tween(obj).to( { y: tg.y + 180 }, 1000, Phaser.Easing.Linear.None, false, 0);
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
	} else if(animid == AnimType.BEGIN) {
        var tg = targets[0];
        var tween = game.add.tween(tg).to( { alpha: 1 }, 1, Phaser.Easing.Linear.None, false, 500);
        var tween2 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween3 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween4 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween5 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween6 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween7 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween8 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween9 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        var tween10 = game.add.tween(tg).to( { alpha: 1 }, 200, Phaser.Easing.Linear.None, false, 0);
        tween.onComplete.addOnce(function(obj, tween){
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
        tween.start();
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
	}
	Client.chat.write("DEBUG: Sent to grave.");
}

//Attacks
Game.attack = function(c, s) {
    Game.awaitCheckEffect(CheckEffectType.ATTACK, function() {
        var targets = [c.slot, s];
        var targets2 = [s];
        var op = !s.isOpponents();
        var damage = 0;
        if(s.type === SlotType.MEMROLE) {
            damage = calcDamage(c.getAttack(), s.card.getDefense());
        }
        Game.playAnimation(AnimType.ATTACK, targets, op, function(card, op) {
        });
        var hasBeenDestroyed = s.card.damage(damage);
        Game.queueAnimation(AnimType.DAMAGE, targets2, op, function(card, op) {
        }, damage);
        if(hasBeenDestroyed) {
            Game.queueAnimation(AnimType.TOGRAVE, targets2, !op, function(card, op){
                Game.awardPrizeToken(op);
            });
        }
    });
}

Game.playCard = function(card, op) {
	if(card.card.type == CardType.MEME) {
		Client.chat.write("DEBUG: The effect of " + card.card.name + " activates.");
		this.playAnimation(AnimType.EFFECT, [card], op, function(card, op){
			if(card.card.category !== MemeCategory.CTN) {
                Game.sendToGrave(card, op);
                Game.addCardToHand(CardLocation.DECK, false, function(c){return c.isMeme();});
            } else {
                Game.addCardToHand(CardLocation.DECK, false, function(c){return c.isMeme();});
            }
		});
	}
	if(card.card.type == CardType.CHANNEL) {
		Client.chat.write("DEBUG: The effect of " + card.card.name + " activates.");
		var tgs = [card];
		this.playAnimation(AnimType.EFFECT, tgs, op, function(card, op){
		});
		this.queueAnimation(AnimType.TARGET, tgs, op, function(card, op){
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
    //for(i in duel.local.hand) {
    //    duel.local.hand[i].update();
    //}
    //for(i in duel.remote.hand) {
    //    duel.remote.hand[i].update();
    //}
};

/*Game.render = function() {
	
}*/