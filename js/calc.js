function membersInRoster(rosterId, allMembers) {
  return allMembers.filter(m => String(m.roster) === String(rosterId));
}

function wealth(members, items = []) {
  const wealth = { gold: 0, rating: 0, members: members.length };
  members.forEach(m => {
    if (m.unit && m.unit.gold && m.cost === undefined) {
      wealth.gold += (m.gold + m.unit.gold) * m.qty;
      wealth.rating += (m.experience + m.unit.experience) + (m.qty * 5);

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

exports.wealth = wealth;
exports.fetchEventTypes = fetchEventTypes;
exports.levelUp = levelUp;
exports.spentExp = spentExp;
exports.levelBands = levelBands;
exports.advanceTypes = advanceTypes;
exports.membersInRoster = membersInRoster;
exports.traitTypes = traitTypes;