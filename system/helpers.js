// Common Handlebars helpers for the app

const { link } = require("../app");

// Require this file where you configure your view engine (ex: in app.js)
module.exports = {
  ifEq: function(a, b, options) {
    return (a == b) ? options.fn(this) : options.inverse(this);
  },

  formatDate: function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
  },

  formatDateTime: function(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString();
  },

  truncate: function(str, len) {
    if (!str || typeof str !== 'string') return '';
    if (str.length <= len) return str;
    return str.substring(0, len) + '...';
  },

  json: function(obj) {
    return JSON.stringify(obj);
  },

  multiply: function(a, b) {
    return Number(a) * Number(b);
  },

  divide: function(a, b) {
    if (Number(b) === 0) return 0;
    return Math.floor(Number(a) / Number(b));
  },

  add: function(a, b) {
    return Number(a) + Number(b);
  },

  subtract: function(a, b) {
    return Number(a) - Number(b);
  },

  link: function(text, url) {
    const safeText = text || url;
    return `<a href="${url}">${safeText}</a>`;
  },

  concat: function(...args) {
    return args.slice(0, -1).join('');
  },
  
  ifCond: function(v1, operator, v2, options) {
    switch (operator) {
      case '==':
        return (String(v1) == String(v2)) ? options.fn(this) : options.inverse(this);
      case '===':
        return (String(v1) === String(v2)) ? options.fn(this) : options.inverse(this);
      case '!=':
        return (String(v1) != String(v2)) ? options.fn(this) : options.inverse(this);
      case '!==':
        return (String(v1) !== String(v2)) ? options.fn(this) : options.inverse(this);
      case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  },

  formatItemType: function(type) {
    switch(type) {
      case 1: return "Combat Weapon";
      case 2: return "Missile Weapon";
      case 3: return "Armour";
      case 4: return "Miscellaneous";
      default: return "Unknown";
    }
  },

  formatTraitType: function(type) {
    switch(type) {
      case 1: return "General";
      case 2: return "Item";
      case 3: return "Unit";
      case 4: return "Skill: Combat";
      case 5: return "Skill: Shooting";
      case 6: return "Skill: Academic";
      case 7: return "Skill: Strength";
      case 8: return "Skill: Speed";
      case 9: return "Skill: Special";
      default: return "Unknown";
    }
  },

  formatUnitType: function(type) {
    switch(type) {
      case 1: return "Hero";
      case 2: return "Henchman";
      default: return "Unknown";
    }
  },

  formatEventType: function(type) {
    switch(type) {
      case 1: return "Level Up";
      case 2: return "Injury";
      case 3: return "Gain Experience";
      case 4: return "Purchase Item";
      case 5: return "Other";
      default: return "Unknown";
    }
  },

  formatItemSlot: function(slot) {
    switch(slot) {
      case 0: return "";
      case 1: return '<div class="tooltipped" data-tooltip="One handed weapon, usable in either hand. Can wield in either hand."><i class="fas fa-hand-fist"></i></div>';
      case 2: return '<div class="tooltipped" data-tooltip="Two handed weapon, requires both hands to wield."><i class="fas fa-hand-fist"></i><i class="fas fa-hand-back-fist"></i></div>';
      case 3: return '<div class="tooltipped" data-tooltip="Off hand item, can only use one at once."><i class="ra ra-round-shield"></i></div>';
      case 4: return '<div class="tooltipped" data-tooltip="Head gear, can only wear one."><i class="ra ra-knight-helmet"></i></div>';
      case 5: return '<div class="tooltipped" data-tooltip="Chest gear, can only wear one."><i class="ra ra-vest"></i></div>';
      case 6: return '<div class="tooltipped" data-tooltip="Consumable"><i class="ra ra-round-bottom-flask"></i></div>';
      default: return '<div class="tooltipped" data-tooltip="Unknown Item Type, configuration error. Tell Matt please."><i class="fas fa-question"></i></div>';
    }
  },

  formatStatus: function(status) {
    switch(status) {
      case 0: return "Active";
      case 1: return "Inactive";
      case 2: return "Retired";
      case 3: return "Killed";
      default: return "Unknown";
    }
  },

  formatStrength: function(strength, base) {
    if (!strength) return '';
    if (strength.slice(0,1) === '+') {
      strength = (base || 0) + Number(strength);
    }
    return strength;
  },

  formatInjury: function(injury) {
    switch(injury) {
      case 1: return { label: "Dead!", description: "The member has died." };
      case 2: return { label: "Multiple Injuries", description: "The member has multiple injuries." };
      case 3: return { label: "Leg Wound", description: "The member has a leg wound." };
      case 4: return { label: "Arm Wound", description: "The member has an arm wound." };
      case 5: return { label: "Madness", description: "The member is suffering from madness." };
      case 6: return { label: "Smashed Leg", description: "The member has a smashed leg." };
      case 7: return { label: "Chest Wound", description: "The member has a chest wound." };
      case 8: return { label: "Blinded in One Eye", description: "The member is blinded in one eye." };
      case 9: return { label: "Old Battle Wound", description: "The member has an old battle wound." };
      case 10: return { label: "Nervous Condition", description: "The member has a nervous condition." };
      case 11: return { label: "Hand Injury", description: "The member has a hand injury." };
      case 12: return { label: "Deep Wound", description: "The member has a deep wound." };
      case 13: return { label: "Robbed", description: "The member has been robbed." };
      case 14: return { label: "Full Recovery", description: "The member has made a full recovery." };
      case 15: return { label: "Bitter Enmity", description: "The member has bitter enmity." };
      case 16: return { label: "Captured", description: "The member has been captured." };
      case 17: return { label: "Hardened", description: "The member has become hardened." };
      case 18: return { label: "Horrible Scars", description: "The member has horrible scars." };
      case 19: return { label: "Sold to the Pits", description: "The member has been sold to the pits." };
      case 20: return { label: "Survives Against The Odds", description: "The member survives against the odds." };
      default: return "Unknown";
    }
  },

  expBoxStyle: function(box) {
    if (!box || typeof box !== 'object') return '';
    var bg;

    if (box.earned) {
      if (box.level) {
        if (!box.spent) {
          bg = '#0094E6'; // earned, level up, not spent
        } else {
          bg = '#7FBFEF'; // earned, level up, spent
        }
      } else {
        bg = '#DDD'; // earned, no level up
      }
    }

    var border = box.level ? '3px solid #5E5E5E' : '1px solid #7A7A7A';
    return 'background: ' + bg + '; border: ' + border + '; display:inline-flex; align-items:center; justify-content:center; width:42px; height:42px; margin-right:1px; margin-bottom:6px; border-radius:4px; vertical-align:middle;';
  }
};