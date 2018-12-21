function emit(m, data) {
    process.send({type: m, data: data});
} 

function copy(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}
/*
//Bad "enum", because Javascript doesn't have bultin enums.
const CardType = {
    UNDEFINED : 0,
    MEMBER : 1,
    ROLE : 2,
    CHANNEL : 3,
    MEME : 4
};

const AnimType = {
	NONE: 0,
	TARGET: 1,
	EFFECT: 2,
	SHUFFLE: 3,
	DESTROY: 4,
	BOUNCE: 5,
	ATTACK: 6,
    TOPGRAVE: 7,
    FLIPUP: 8,
    FLIPDOWN: 9,
    REVEAL: 10
};

const CardLocation = {
    NONE : 0b0,
    CHANNEL_ZONES : 0b1,
    MEMBER_ZONE_CURRENT : 0b10,
    MEMBER_ZONE_OPPOSITE : 0b100,
    MEMBER_ZONES: 0b110,
    MEME_ZONES : 0b1000,
    FIELD : 0b1111,
    OFFLINE : 0b10000,
    FIELD_OFFLINE : 0b11111,
    DECK : 0b100000,
    ALL : 0b111111
};

//The bottom left-most card in cards.png. It is the same texture rect used for facedown cards.
const UNDEFINED_CARD_INDEX = 159;

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

const DuelPhase = {
    WAIT : 0,
    DRAW : 1,
    EFFECT : 2,
    ACTION : 3,
    BATTLE : 4,
    DAMAGE : 5,
    END : 6
};

*/
var { CardType, CardLocation, CardColor, DuelPhase, Card, Slot, UNDEFINED_CARD_INDEX } = require('./Card');

CardIndex = require('./assets/cards.json');

/*var fs = require('fs');
fs.readFile( __dirname + '/assets/cards.json', function (err, data) {
    if (err) {
        throw err; 
    }
    CardIndex = data.toJSON();
});*/

//Damage calculation function
function calcDamage(atk, def) {
    var dmg = Math.round((atk * 1.5) - (def * 1.5));
    if(dmg < 1) dmg = 1;
    return dmg;
}

function isValid(index) {
    if(index < 0 || index > CardIndex.length) return false;
    return true;
}

function getInfo(index) {
    if(!isValid(index)) return {};
    var info = copy(CardIndex[index]);
    info.type = CardType[info.type];
    return info;
}

function isEmpty(slot) {
    return (slot.index == -1);
}

function getEmptySlot(arr) {
    for(s in arr) {
        var slot = arr[s];
        if(isEmpty(slot)) {
            return s;
        }
    }
    return -1;
}

function getAvailableMemberSlot(sstate) {
    if(!isEmpty(sstate.channels[0])) {
        return getEmptySlot([sstate.members[0], sstate.members[1], sstate.members[2]]);
    }
    if(!isEmpty(sstate.channels[1])) {
        return getEmptySlot([sstate.members[0], sstate.members[1], sstate.members[2]]);
    }
    return -1;
}

function getActiveMembers(sstate) {
    var activeMembers = [];
    for(n in sstate.members) {
        var c = sstate.members[n];
        var cinfo = getInfo(c);
        if(cinfo.type === CardType.MEMBER) {
            activeMembers.push(n);
        }
    }
}

function hasActiveChannelCard(sstate) {
    if(isEmpty(sstate.channels[0]) && isEmpty(sstate.channels[1])) {
        return false;
    }
    return true;
}

function hasActiveMemberCard(sstate) {
    for(var i = 0; i < 8; i++)
    if(!isEmpty(sstate.members[i])) {
        if(getInfo(sstate.members[i]).type === CardType.MEMBER)
            return true;
    }
    return false;
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
            moves.push('DRAW 1');
            moves.push('PHASE EFFECT');
            break;
        case DuelPhase.EFFECT:
            moves.push('PHASE ACTION');
            break;
        case DuelPhase.ACTION:
            //Do I have any channel cards in play?
            if(!hasActiveChannelCard(state.self)) {
                //Do I have a channel card in my hand to play?
                for(n in state.self.hand) {
                    var card = state.self.hand[n];
                    var cinfo = getInfo(card.index);
                    console.log(`${cinfo.name} : ${cinfo.type}`);
                    if(cinfo.type == CardType.CHANNEL) {
                        var c = getEmptySlot(state.self.channels);
                        moves.push(`PLAY ${n} CH${c}`);
                        return moves;
                    }
                }
            }
            //Can I play any cards in my hand?
            for(n in state.self.hand) {
                var card = state.self.hand[n];
                if(!isValid(card.index)) continue;
                var cinfo = getInfo(card.index);
                if(cinfo.type === CardType.MEMBER) {
                    if(cinfo.lvl <= 1 || !flags.playedHighLVLCard) {
                        var c = getAvailableMemberSlot(state.self);
                        if(c != -1) {
                            moves.push(`PLAY ${n} MBR${c}`);
                            if(cinfo.lvl > 1) {
                                flags.playedHighLVLCard = true;
                            }
                            return moves;
                        }
                    }
                }
            }
            moves.push('PHASE BATTLE');
            break;
        case DuelPhase.BATTLE:
            //Do I have any active members on the field?
            /*var members = getActiveMembers(state.self);
            for(m in members) {
                var n = members[m];
                var c = state.self.members[n];
                var cinfo = getInfo(c.index);
                var atk = cinfo.atk;
                //Can I attack directly?
                if(!hasActiveMemberCard(state.opponent)) {
                    moves.append('ATTACK MBR${n} DIRECTLY');
                    continue;
                }
                //Can I destroy a member card with my attack?
                var opps = getActiveMembers(state.opponent);
                var tgt = null;
                for(mm in opps) {
                    var nn = opps[mm];
                    var cc = state.opponent.members[nn];
                    var ccinfo = getInfo(cc.index);
                    if(calcDamage(atk, ccinfo.def) > ccinfo.hp) {
                        moves.append('ATTACK MBR${n} MBR{nn}');
                        tgt = nn;
                        break;
                    }
                }
                if(tgt !== null) {
                    continue;
                }
                //Can I attack another member?
                var pref = -1;
                var prefV = 0;
                for(mm in opps) {
                    var nn = opps[mm];
                    var cc = state.opponent.members[nn];
                    var ccinfo = getInfo(cc.index);
                    var prefc = calcDamage(atk, ccinfo.def);
                    if(prefc > prefV) {
                        pref = nn;
                        prefc = prefV;
                    }
                }
                if(pref !== -1) {
                    moves.append('ATTACK MBR${n} MBR{prefV}');
                }
            }*/
            moves.push('PHASE END');
            break;
        case DuelPhase.END:
            moves.push('END TURN');
            break;
        }
        return moves;
    }
    var moves = doAI(m.state);
    emit('ai callback', { 
        match: m.match.id, 
        moves: copy(moves),
        id: m.id
    });
}});

process.send({type: 'handshake'});

process.stdin.resume();