function emit(m, data) {
    process.send({type: m, data: data});
} 

const CardType = {
    UNDEFINED : 0,
    MEMBER : 1,
    ROLE : 2,
    CHANNEL : 3,
    MEME : 4
};

const UNDEFINED_CARD_INDEX = 159;

CardIndex = [];

var fs = require('fs');
fs.readFile( __dirname + '/assets/cards.json', function (err, data) {
    if (err) {
        throw err; 
    }
    CardIndex = data.toJSON();
});

const CardColor = {
    NONE : 0,
    RED : 1,
    ORN : 2,
    YLW : 3,
    GRN : 4,
    BLU : 5,
    PPL : 6,
    PNK : 7,
    GRY : 8
}

const CardStatus = {
    OFFLINE : 0,
    ONLINE : 1,
    IDLE : 2,
    DONOTDISTURB : 3,
    STREAMING : 4
}

const DuelPhase = {
    WAIT : 0,
    DRAW : 1,
    EFFECT : 2,
    ACTION : 3,
    BATTLE : 4
};

function isValid(index) {
    if(index < 0 || index > CardIndex.length) return false;
    return true;
}

function getInfo(index) {
    if(!isValid(index)) return {};
    return CardIndex[index];
}

function getEmptySlot(arr) {
    function isEmpty(slot) {
        return (slot.index != -1);
    }
    for(s in arr) {
        var slot = arr[s];
        if(isEmpty(slot)) {
            return s;
        }
    }
    return -1;
}

process.on('message',(m) => {
if(m.type === 'ai'){
    function doAI(state) {
        var moves = [];
        var flags = {
            playedHighLVLCard:false
        }
        switch(state.phase) {
        case DuelPhase.DRAW:
            for(i=0;i<5;i++) {
                moves.append('DRAW');
            }
            break;
        case DuelPhase.ACTION:
            //Can I play any cards in my hand?
            for(n in state.self.hand) {
                var card = state.self.hand[n];
                if(!isValid(card.index)) continue;
                var cinfo = getInfo(card.index);
                if(cinfo.type === CardType.MEMBER) {
                    if(cinfo.lvl <= 1 || !flags.playedHighLVLCard) {
                        var c = getEmptySlot(state.self.members);
                        if(c != -1) {
                            moves.append('PLAY HAND${n} MEM${c}');
                            if(cinfo.lvl > 1) {
                                flags.playedHighLVLCard = true;
                            }
                        }
                    }
                }
            }
            break;
        case DuelPhase.BATTLE:
            break;
        }
        return moves;
    }
    var moves = doAI(m.state);
    emit('ai callback', { match:m.match, moves:moves });
}});

process.send({type: 'handshake'});