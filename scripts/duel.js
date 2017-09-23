const DuelPhase = {
    WAIT : 0,
    DRAW : 1,
    EFFECT : 2,
    ACTION : 3,
    BATTLE : 4
};

class SideState {
    constructor() {
        this.slots = {};
        this.memes = [
            null,
            null,
            null,
            null,
            null,
            null
        ];
        this.members = [
            null,
            null,
            null,
            null,
            null,
            null
        ];
        this.channels = [
            null,
            null
        ];
        this.hand = [];
        this.offline = [];
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
}

class DuelState {
    constructor(player, opponent) {
        this.player = player;
        this.opponent = opponent;
        this.isConnected = false;
        this.local = new SideState();
        this.remote = new SideState();
        this.turn = player;
        this.phase = DuelPhase.DRAW;
        this.draws = 0;
    }

    in_deck(card) {
        for(i in this.player.deck) {
            if(card === this.player.deck[i]) {
                return true;
            }
        }
        return false;
    }

    moveCard(card, slot) {
        card.move({x: slot.obj.x, y: slot.obj.y});
    }

    doMove(move) {
        var parts = move.split(" ");
        if(parts[0] === "MOVE") {
            this.moveCard(this.local.slots[parts[1]].card, this.local.slots[parts[2]])
            return;
        }
    }

    effectPhase() {
        Client.chat.write('DEBUG: Skipping effect phase...')
        this.phase = DuelPhase.ACTION;
    }

    doMoves(moves) {
        for(i in moves) {

        }
    }

    get_channel(s, index) {
        if(s === "local") {
            return this.local.channels[index];
        }
        if(s === "remote") {
            return this.remote.channels[index]
        }
    }

    get_offline(s) {
        if(s === "local") {
            return this.local.offline;
        }
        if(s === "remote") {
            return this.remote.offline;
        }
    }
}