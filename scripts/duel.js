class SideState {
    constructor() {
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
        this.offline = [];
        this.selected = null;
    }

    update(state) {
        for(i in state) {
            this[i] = state[i];
        }
    }
}

class DuelState {
    constructor(player, opponent) {
        this.player = player;
        this.opponent = opponent;
        this.isConnected = false;
        this.local = new SideState();
        this.remote = new SideState();
        this.myTurn = true;
    }

    in_deck(card) {
        for(i in this.player.deck) {
            if(card === this.player.deck[i]) {
                return true;
            }
        }
        return false;
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