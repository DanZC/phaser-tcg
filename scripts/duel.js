//The current phase
const DuelPhase = {
    WAIT : 0,
    DRAW : 1,
    EFFECT : 2,
    ACTION : 3,
    BATTLE : 4,
    DAMAGE : 5,
    END : 6
};

//Each half of the board is created in a side state. 
class SideState {
    constructor() {
		//Slots on the game board.
        this.slots = {};
		
		//List of meme cards in play.
        this.memes = [
            null,
            null,
            null,
            null,
            null,
            null
        ];
		
		//List of member cards in play.
        this.members = [
            null,
            null,
            null,
            null,
            null,
            null
        ];
		
		//List of channel cards in play (max of 2).
        this.channels = [
            null,
            null
        ];
		
		//List of cards in the player's hand.
        this.hand = [];
		
		//List of cards in the offline space.
        this.offline = [];
		
		//A reference to the currently selected card.
        this.selected = null;
    }

    getLevelOneMembers() {
        var mems = [];
        for(i in this.members) {
            if(this.members[i] !== null) {
                mems.push(this.members[i]);
            }
        }
        return mems;
    }
    
    //Returns a reference to the list of cards in the hand.
	getHand() {
		return this.hand;
	}
	
	//Returns the indexed channel.
	get_channel(index) {
		return this.channels[index];
    }
    
    getMembersinChannel(channel) {
        if(channel == this.channels[0]) {
            var mems = [mems[0], mems[1], mems[2]];
            return mems;
        } else {
            var mems = [mems[3], mems[4], mems[5]];
            return mems;
        }
    }
}

//Contains the data for a duel. This is usually created by the client when connecting to a game.
class DuelState {
    constructor(player, opponent) {
		//A reference to the local player.
        this.player = player;
		
		//A reference to the opposing player/bot.
        this.opponent = opponent;
		
		//Connection flag
        this.isConnected = false;
		
		//Local state.
        this.local = new SideState();
		
		//Remote state
        this.remote = new SideState();
		
		//A reference to the player whose turn it is. 
        this.turn = player;
		
		//Whether the client is waiting for the server. Used to prevent input.
		this.waiting = false;
		
		//The current phase
        this.phase = DuelPhase.WAIT;
		
		//The current turn number.
		this.turnNumber = 1;
		
		//The number of draws that have occurred this turn.
        this.draws = 0;

        //Moves that are queued up.
        this.moveQueue = [];

        //Whether the client is waiting for a move's animation to finish.
        this.awaitMove = false;

        //Callback function used when a move is done executing.
        //If the moveQueue is not empty, the function will immediately perform the next move in the queue.
        //Otherwise, the awaitMove flag will be set to false.
        //This callback can be overwritten with a different function.
        this.moveEndCallback = function(duel){
            if(duel.moveQueue.length > 0) {
                var nextMove = duel.moveQueue.shift();
                duel.doMove(nextMove);
            } else {
                duel.awaitMove = false;
            }
        };
    }

	//Checks if a particular card is in the player's deck.
    in_deck(card) {
        for(i in this.player.deck) {
            if(card === this.player.deck[i]) {
                return true;
            }
        }
        return false;
    }

    //Returns a list of cards on the field.
    getCardsOnField() {
        var cards = []
        for(i in this.local.slots) {
            if(!this.local.slots[i].empty()) {
                cards.push(this.local.slots[i].card);
            }
        }
        for(i in this.remote.slots) {
            if(!this.remote.slots[i].empty()) {
                cards.push(this.remote.slots[i].card);
            }
        }
        return cards;
    }

    nextTurn() {
        this.turnNumber++;
        var fcards = this.getCardsOnField();
        for(var c in fcards) {
            fcards[c].card.resetAttacks();
        }
    }

	//Moves a card to another slot.
    moveCard(card, slot, cb=function(duel){}) {
        card.move({x: slot.obj.x, y: slot.obj.y}, cb);
    }

    //Draws a card from the deck
    drawCard(op, n=1, cb=function(duel){}) {
        Game.drawCard(op, n, cb);
    }
    
    //Adds a card from the deck to the hand.
    addCardToHand(loc, op, index, cb=function(duel){}) {
        Game.addCardToHandI(loc, op, index, cb);
    }

    //Adds a card from the deck to the hand.
    attack(card, op, slot, cb=function(duel){}) {
        Game.attack(card, slot, cb);
    }

    //Plays card
    playCard(card, op, slot, cb=function(duel){}) {
        var cobj = card;
        if(op) {
            card.revealed = true;
        }
        card.move({x: slot.obj.x, y: slot.obj.y});
        slot.card = cobj;
        if(card.slot !== null) {
            card.slot.card = null;
        }
        card.slot = slot;
        var j = Game.removeFromHand(card, op);
        Game.updateHand();
        Game.playCard(card, op, cb);
    }

    //Adds a move to the move queue. If the move queue is empty, will perform the move instead.
    queueMove(move) {
        if(this.moveQueue.length <= 0) {
            if(this.awaitMove) {
                this.moveQueue.push(move);
                return;
            }
            this.doMove(move);
            return;
        } else {
            this.moveQueue.push(move);
        }
    }

	//Executes a move using a string. The string is formatted and sent by the server.
    doMove(move) {
        this.awaitMove = true;
        var parts = move.split(" ");
        if(parts[0] === "R") {
            if(parts[1] === "MOVE") {
                this.moveCard(this.remote.slots[parts[2]].card, this.remote.slots[parts[3]], this.moveEndCallback);
                return;
            } else if(parts[1] === "DRAW") {
                if(parts.length > 2) {
                    this.drawCard(true, 1, this.moveEndCallback);
                } else {
                    this.drawCard(true, parseInt(parts[2]), this.moveEndCallback);
                }
                return;
            } else if(parts[1] === "PLAY") {
                this.playCard(Game.getHand(parseInt(parts[2]), true), true, this.remote.slots[parts[3]], this.moveEndCallback);
                return;
            } else if(parts[1] === "PHASE") {
                if(parts[2] === "END") {
                    Client.chat.write("It's your turn.");
                    this.turn = this.player;
                    this.phase = DuelPhase.DRAW;
                    this.nextTurn();
                    this.draws = 0;
                }
                else if(parts[2] === "BATTLE") {
                    Client.chat.write("It's your opponent's battle phase.");
                    this.phase = DuelPhase.BATTLE;
                }
                this.moveEndCallback(this);
                return;
            } else if(parts[1] === "ATTACK") {
                this.attack(this.remote.slots[parts[2]].card, true, this.local.slots[parts[3]], this.moveEndCallback);
                return;
            }
        }
    }

    //Gets a list of cards with a specific filter
    getFilteredList(loc, filter, op) {
        var list = [];
        if(loc == CardLocation.DECK) {
            if(!op) {
                var fl = this.player.deck.getFilteredList(filter);
                return fl;
            } else {
                var fl = this.opponent.deck.getFilteredList(filter);
                return fl;
            }
        }
    }

	//Does the effect phase. Currently unimplemented.
    effectPhase() {
        Client.chat.write('DEBUG: Skipping effect phase...')
        this.phase = DuelPhase.ACTION;
    }

    //Battle phase
    battlePhase() {
        Client.chat.write('DEBUG: Entering battle phase...')
    }

    //End phase
    endPhase() {
        Client.chat.write('DEBUG: Ending turn...')
    }

	//Does a series of moves in a list.
    doMoves(moves) {
        for(i in moves) {
			this.doMove(moves[i]);
        }
    }

	//Returns a channel using the given index.
    get_channel(s, index) {
        if(s === "local") {
            return this.local.channels[index];
        }
        if(s === "remote") {
            return this.remote.channels[index]
        }
    }

	//Returns a list of offline cards.
    get_offline(s) {
        if(s === "local") {
            return this.local.offline;
        }
        if(s === "remote") {
            return this.remote.offline;
        }
    }
}