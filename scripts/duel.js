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

//Contains the data for a duel. This usually created by the client when connecting to a game.
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

	//Moves a card to another slot.
    moveCard(card, slot) {
        card.move({x: slot.obj.x, y: slot.obj.y});
    }

    //Draws a card from the deck
    drawCard(op, n=1) {
        Game.drawCard(op, n);
    }

	//Executes a move using a string. The string is formatted and sent by the server.
    doMove(move) {
        var parts = move.split(" ");
        if(parts[0] === "P0") {
            if(parts[1] === "MOVE") {
                this.moveCard(this.local.slots[parts[1]].card, this.local.slots[parts[2]])
                return;
            } else if(parts[1] === "DRAW") {
                if(parts.length > 2) {
                    this.drawCard(false);
                } else {
                    this.drawCard(false, parseInt(parts[2]));
                }
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