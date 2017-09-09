class CardSystem {
    constructor() {
        this.deck = [random_deck()]; //Plan on having multiple decks available
        this.player = new Player();
        this.player.deck = this.deck[0];
        this.duel = new DuelState(this.player, new Player()); //State
    }
}