Builder = {};

Builder.Client = Client;
Builder.game = null;
Builder.selected = 0;

Builder.init = function(game){
    this.game = game;
    this.game.stage.disableVisibilityChange = true;
    //Sets the deck to a copy of the deck defined in Cardsys.
	this.deck = Client.cardsys.deck[0].copy();
};

Builder.preload = function() {
    this.game.load.image('newcard', 'assets/new_card.png');
    this.game.load.image('back', 'assets/builderback.png');
    this.game.load.image('buttons2', 'assets/buttons2.png');
    //this.game.load.spritesheet('cards', 'assets/cards.png',412,562);
    this.game.load.spritesheet('harrows', 'assets/harrows.png',32,32);
};

Builder.create = function() {
    var game = this.game;
    page = 0;
    pageMax = 0;

    var logo = game.add.sprite(game.world.centerX, game.world.centerY, 'back');
    logo.anchor.setTo(0.5, 0.5);

    Builder.menu = game.add.group(game.world, "menu", false, false, false);
    Builder.cards = game.add.group(game.world, "cards", false, false, false);
    obj = [];
    
    //Sorts the deck used by the deckbuilder such that cards with lower index numbers appear before cards with higher index numbers.
	this.deck.sort();
    //var deck = Client.cardsys.deck[0];
    if(this.deck.card.length >= 40) {
        pageMax = 1;
    } else {
        pageMax = Math.floor((this.deck.card.length+(1)) / 40);
    }
    Builder.selected = 0;

    {
        var o = {
            x: 54,
            y: 104,
        }
        for(i = 0; i < 40; i++) {
            var c = {
                index: i,
                update: function(deck) {
                    //var deck = Client.cardsys.player.deck;
                    if(Builder.selected == this.index) {
                        this.obj.tint = 0xFFFF00;
                    } else {
                        this.obj.tint = 0xFFFFFF;
                    }
                    if(page * 40 + this.index < deck.card.length) {
                        this.obj.visible = true;
                        this.obj.frame = deck.card[(page * 40) + this.index].index - 1;
                    } else {
                        this.obj.visible = false;
                    }
                }
            }
            c.obj = game.add.button(
                o.x + (((206 / 2) + 1) * (i % 10)),
                o.y + (((281 / 2) + 1) * Math.floor(i / 10)),
                'cards',
                function() { 
                    console.log(this);
                    Builder.selected = this.index; 
                },
                //},
                c
            );
            c.obj.width /= 4;
            c.obj.height /= 4;
            c.obj.frame = this.deck.card[i].index - 1;
            Builder.cards.add(c.obj);
            obj.push(c);
        }
        var nc = {
            origin: {
                x: o.x,
                y: o.y
            },
            obj: game.add.button(
                o.x + ((206 / 2) * (0 % 10)),
                o.y + ((281 / 2) * Math.floor(0 / 10)),
                'newcard',
                function() {},
                this
            ),
            update: function(deck) {
                //var deck = Client.cardsys.player.deck;
                if(page === pageMax && deck.card.length % 40 !== 0) {
                    this.obj.inputEnabled = true;
                    this.obj.visible = true;
                    var i = deck.card.length % 40;
                    this.obj.x = this.origin.x + ((206/2) * (i % 10));
                    this.obj.y = this.origin.y + ((281/2) * Math.floor(i / 10));
                } else {
                    this.obj.inputEnabled = false;
                    this.obj.visible = false;
                }
            }
        };
        nc.obj.width /= 4;
        nc.obj.height /= 4;
        obj.push(nc);
    }
    {
        var o = {
            x: 1100,
            y: 100,
        }
        var c = {
            obj: game.add.image(
                o.x + 35,
                o.y,
                'cards'
            ),
			txt: game.add.text(o.x, o.y + 458, "???", {
				font: "24px Impact",
				fill: "#ffff44",
				align: "center"
			}),
			txteff: game.add.text(o.x, o.y + 486, "Effect:", {
				font: "16px Impact",
				fill: "#ffff44",
				align: "left",
				wordWrap: true,
				wordWrapWidth: 400
			}),
            update: function(deck) {
                //var deck = Client.cardsys.player.deck;
                if(deck.card[Builder.selected] !== undefined) {
                    this.obj.visible = true;
                    this.obj.frame = deck.card[Builder.selected].index - 1;
					this.txt.setText(CardIndex[deck.card[Builder.selected].index].name);
					if(CardIndex[deck.card[Builder.selected].index].type == CardType.MEMBER) {
						this.txteff.setText("Effect: " + CardIndex[deck.card[Builder.selected].index].effect.desc + "\n\nCM Effect: " + CardIndex[deck.card[Builder.selected].index].cmeffect.desc);
					} else if(CardIndex[deck.card[Builder.selected].index].type == CardType.CHANNEL) {
						this.txteff.setText("Effect: " + CardIndex[deck.card[Builder.selected].index].effect.desc
						+ "\n\n+Effect: " + CardIndex[deck.card[Builder.selected].index].adv.desc
						+ "\n\n-Effect: " + CardIndex[deck.card[Builder.selected].index].disadv.desc);
					} else {
						this.txteff.setText("Effect: " + CardIndex[deck.card[Builder.selected].index].effect.desc);
					}
                } else {
                    this.obj.visible = false;
                }
            }
        }
        c.obj.width /= 1.25;
        c.obj.height /= 1.25;
        c.obj.frame = this.deck.card[Builder.selected].index - 1;
		c.txt.setText(CardIndex[this.deck.card[Builder.selected].index].name);
		c.txteff.setText("Effect: " + CardIndex[this.deck.card[Builder.selected].index].effect.desc);
        obj.push(c);
    }

    /*var backpage = {
        obj:game.add.button(
            395,695,
            'harrows',
            function() { page--; },
            this
        ),
        update:function(){
            if(page > 0) {
                this.obj.inputEnabled = true;
                this.obj.frame = 0;
            } else {
                this.obj.inputEnabled = false;
                this.obj.frame = 1;
            }
        }
    }
    obj.push(backpage);

    pagecntr = game.add.text(430, 695, "1/1", {
        font: "32px Impact",
        fill: "#ffff44",
        align: "left"
    });

    var nextpage = {
        obj:game.add.button(
            495,695,
            'harrows',
            function() { page++; },
            this
        ),
        update:function(){
            if(page < pageMax) {
                this.obj.inputEnabled = true;
                this.obj.frame = 2;
            } else {
                this.obj.inputEnabled = false;
                this.obj.frame = 3;
            }
        }
    }
    obj.push(nextpage);*/

    var backbutton = game.add.button(
        43,874,
        'buttons2',
        function() { this.game.state.start('Title',true,false,game); },
        this
    );
};

Builder.update = function() {
    for(i in obj) {
        obj[i].update(this.deck);
    }
    //pagecntr.setText((page+1) + ' / ' + (pageMax+1));
}

Builder.addCard = function(index) {
    pageMax = Math.floor((deck.card.length+1) / 40);
}