class Deck {
    constructor() {
        this.card = [];
    }

    add(card) {
        this.card.push(card);
    }

    get_top() {
        return this.card[this.card.length - 1]
    }

    update() {
        for(var i in this.card) {
            this.card[i].update();
        }
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }

//Returns a random deck
function random_deck() {
    var cards = 40;
    var deck = new Deck();
    for(i = 0; i < cards; i++) {
        var n = getRandomInt(1, 3);
        var c = new Card();
        c.set_index(n);
        deck.add(c);
    }
    return deck;
}