function membersInRoster(rosterId, allMembers) {
  return allMembers.filter(m => String(m.roster) === String(rosterId));
}

async function wealth(members, items = []) {
  const wealth = { gold: 0, rating: 0, experience: 0, members: members.length };
  members.forEach(m => {
    if (m.unit && m.unit.gold && m.cost === undefined) {
      wealth.gold       += (m.gold + m.unit.gold) * m.qty;
      wealth.experience += (m.experience + m.unit.experience) * m.qty;
      wealth.rating     += wealth.experience + (5 * m.qty);
      if (Array.isArray(items)) {
        items.forEach(i => {
          if (i && i.gold) {
            wealth.gold += (i.gold * (m.qty || 1));
          }
        });
      }
    }
  });

  return wealth;
}

function fetchEventTypes(type) {
  const eventTypes = {
    1: { value: 1, label:'Level Up' },
    2: { value: 2, label:'Injury' },
    3: { value: 3, label:'Gain Experience' },
    4: { value: 4, label:'Purchase Item' },
    5: { value: 5, label:'Other' }
  }
  return type ? [eventTypes[type]] : eventTypes;
}

function fetchInjuries(injuryId) {
  var injuries = {
    1: { value: '11-15', label: 'Dead!', description: 'The member has died as a result of their injuries.' },
    2: { value: '16-21', label: 'Multiple Injuries', description: 'The member has sustained multiple injuries and will require extensive care.' },
    3: { value: '22', label: 'Leg Wound', description: 'The member has a serious leg wound that will impair movement until healed.' },
    4: { value: '23', label: 'Arm Wound', description: 'The member has a serious arm wound that will impair movement until healed.' },
    5: { value: '24', label: 'Madness', description: 'The member has gone mad as a result of their injuries.' },
    6: { value: '25', label: 'Smashed Leg', description: 'The member has a smashed leg that will impair movement until healed.' },
    7: { value: '26', label: 'Chest Wound', description: 'The member has a serious chest wound that will impair movement until healed.' },
    8: { value: '31', label: 'Blinded in One Eye', description: 'The member has been blinded in one eye.' },
    9: { value: '32', label: 'Old Battle Wound', description: 'The member has an old battle wound that still causes pain and discomfort.' },
    10: { value: '33', label: 'Nervous Condition', description: 'The member has developed a nervous condition as a result of their injuries.' },
    11: { value: '34', label: 'Hand Injury', description: 'The member has a serious hand injury that will impair their ability to fight until healed.' },
    12: { value: '35', label: 'Deep Wound', description: 'The member has a deep wound that will take time to heal properly.' },
    13: { value: '36', label: 'Robbed', description: 'The member has been robbed of their possessions during their injury.' },
    14: { value: '41-55', label: 'Full Recovery', description: 'The member has made a full recovery from their injuries.' },
    15: { value: '56', label: 'Bitter Enmity', description: 'The member has developed bitter enmity towards those responsible for their injuries.' },
    16: { value: '61', label: 'Captured', description: 'The member has been captured by enemy forces.' },
    17: { value: '62-63', label: 'Hardened', description: 'The member has become hardened as a result of their injuries.' },
    18: { value: '64', label: 'Horrible Scars', description: 'The member has been left with horrible scars from their injuries.' },
    19: { value: '65', label: 'Sold to the Pits', description: 'The member has been sold to the pits as a result of their injuries.' },
    20: { value: '66', label: 'Survives Against The Odds', description: 'The member has survived against all odds despite their injuries.' }
  }

  if (injuryId) {
    return injuries[injuryId] || null;
  }
  return injuries;
}

const levelBands = {
  2: { level: 1, exp: 2 },
  4: { level: 2, exp: 4 },
  6: { level: 3, exp: 6 },
  8: { level: 4, exp: 8 },
  11: { level: 5, exp: 11 },
  14: { level: 6, exp: 14 },
  17: { level: 7, exp: 17 },
  20: { level: 8, exp: 20 },
  24: { level: 9, exp: 24 },
  28: { level: 10, exp: 28 },
  32: { level: 11, exp: 32 },
  36: { level: 12, exp: 36 },
  41: { level: 13, exp: 41 },
  46: { level: 14, exp: 46 },
  51: { level: 15, exp: 51 }
}

function levelUp(level) {
  switch(level) {
    case 2:
    case 4:
    case 6:
    case 8:

    case 11:
    case 14:
    case 17:
    case 20:

    case 24:
    case 28:
    case 32:
    case 36:
      
    case 41:
    case 46:
    case 51:

    case 56:
    case 62:
    case 68:

    case 74:
    case 83:
    case 90:
      return true;
    default:
      return false;
  }
}

function spentExp(exp, spent) {
  if (exp <= spent) return true;
  return false;
}

const advanceTypes = {
  1: {
    '2-5': { value: '2-5', label: 'New Skill', subType: 'skillList' },
    '6': { value: '6', label: 'Characteristic Increase: Roll 1-3 = +1 Strength; 4-6 = +1 Attack', subType: { '1-3': { label: '+1 Strength', stat: { s: 1 } }, '4-6': { label: '+1 Attack', stat: { a: 1 } } } },
    '7': { value: '7', label: 'Characteristic Increase: Roll 1-3 = +1 WS; 4-6 = +1 BS', subType: { '1-3': { label: '+1 WS', stat: { ws: 1 } }, '4-6': { label: '+1 BS', stat: { bs: 1 } } } },
    '8': { value: '8', label: 'Characteristic Increase: Roll 1-3 = +1 Initiative; 4-6 = +1 Leadership', subType: { '1-3': { label: '+1 Initiative', stat: { i: 1 } }, '4-6': { label: '+1 Leadership', stat: { ld: 1 } } } },
    '9': { value: '9', label: 'Characteristic Increase: Roll 1-3 = +1 Wound; 4-6 = +1 Toughness', subType: { '1-3': { label: '+1 Wound', stat: { w: 1 } }, '4-6': { label: '+1 Toughness', stat: { t: 1 } } } },
    '10-12': { value: '10-12', label: 'New Skill', subType: 'skillList' },
  },
  2: {
    '2-4': { value: '2-4', label: 'Characteristic Increase: +1 Initiative' },
    '5': { value: '5', label: 'Characteristic Increase: +1 Strength' },
    '6': { value: '6', label: 'Characteristic Increase: +1 WS or +1 BS' },
    '7': { value: '7', label: 'Characteristic Increase: +1 WS or +1 BS' },
    '8': { value: '8', label: 'Characteristic Increase: +1 Attack' },
    '9': { value: '9', label: 'Characteristic Increase: +1 Leadership' },
    '10-12': { value: '10-12', label: 'The lads got talent' }
  }
};

const traitTypes = {
  1: 'General',
  2: 'Item',
  3: 'Unit',
  4: 'Combat',
  5: 'Shooting',
  6: 'Academic',
  7: 'Strength',
  8: 'Speed',
  9: 'Special'
}

function calcCurrentExp(starting, events) {
  let totalExp = starting || 0;
  for (const ev of events) {
    if (ev.type === 3 && ev.wealth && ev.wealth.experience) {
      totalExp += ev.wealth.experience;
    }
  }
  return totalExp;
}

async function buildExpLevels(unit, expCurrent) {
  let levels = [];
  let cap = 14;
  let earnedExp = 0;
  
  if (unit.type === 1) cap = 90;
  for (let i = 1; i <= cap; i++) {
    if (i <= expCurrent) {
      levels[i] = { earned: true, spent: spentExp(i, unit.experience), level: levelUp(i)};
      if (i <= unit.experience) levels[i].initial = true;
      earnedExp = i;
    } else {
      levels[i] = { earned: false, spent: false, level: levelUp(i), gain: (i - earnedExp)};
    }
  }
  return levels;
}

async function processLevelUpEvent(result, ev) {
  const trait = require('../database/models/trait');
  if (result.unit.type == 1) {
    if (ev.advance === '2-5' || ev.advance === '10-12') {
      var tr = await trait.getTraitById(ev.advance_linked);
      result.traits.push(tr);
    } else {
      let advance = advanceTypes[result.unit.type][ev.advance].subType[ev.advance_linked];
      let stat = advance.stat ? advance.stat : undefined;
      Object.keys(stat).forEach(s => {
        result.unit[s] += stat[s];
        result.unit.advance[s] = true; 
      });
    }
  } else if (result.unit.type == 2) {
  };
}

async function checkEvents(result, events) {
  result.unit.advance = { s: false, a: false, ws: false, bs: false, i: false, ld: false, w: false, t: false };
  result.traits = [];
  for (const ev of events) {
    if (ev.type === 1 && ev.wealth && ev.wealth.experience) {
      if (result.expLevels[ev.wealth.experience]) {
        console.log('Marking level as spent:', ev.wealth.experience);
        result.expLevels[ev.wealth.experience].spent = true;
      }

      if (ev.advance && ev.advance_linked) {
        await processLevelUpEvent(result, ev);
      }
    }
    if (ev.type === 3 && ev.wealth) {
      result.wealth.experience += ev.wealth.experience || 0;
      result.wealth.gold       += ev.wealth.gold || 0;
      result.wealth.rating     += (ev.wealth.experience * result.qty) || 0;
    }
  }
  return result;
};

exports.wealth = wealth;
exports.fetchEventTypes = fetchEventTypes;
exports.levelUp = levelUp;
exports.spentExp = spentExp;
exports.levelBands = levelBands;
exports.advanceTypes = advanceTypes;
exports.membersInRoster = membersInRoster;
exports.traitTypes = traitTypes;
exports.calcCurrentExp = calcCurrentExp;
exports.buildExpLevels = buildExpLevels;
exports.processLevelUpEvent = processLevelUpEvent;
exports.checkEvents = checkEvents;
exports.fetchInjuries = fetchInjuries;