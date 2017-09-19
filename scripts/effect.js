const EffectFrequency = {
    NEVER: 0,
    TURN: 1,
    ONATTACK: 2,
    ONDEFEND: 3,
    ONDEFEAT: 4,
    ONSTREAM: 5
};

CardEffect = {};

CardEffect.none = function(state, card) {
    Client.chat.write("DEBUG: No effect.");
}

CardEffect[0] = {
    effect: function(state, card) {
        Client.chat.write("DEBUG: Bikdip Glory.");
        var local = state.local;
        if(card.flags.hasTakenDamage !== true) {
            var n = getRandomInt(0, local.members.length - 1);
            for(i=0;i<2;i++) {
                var stat = getRandomInt(0, 2);
                switch(stat) {
                    case 0:
                        card.boost('hp', 1);
                        card.currentHP += 1;
                        break;
                    case 1:
                        card.boost('atk', 1);
                        break;
                    case 2:
                        card.boost('def', 1);
                        break;
                }
            }
        }
    },
    cmeffect: function(state, card) {
        Client.chat.write("DEBUG: No effect.");
    }
}

CardEffect[2] = function(state, card) {
    Client.chat.write("DEBUG: No effect.");
}