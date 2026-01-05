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
      case 2: return "Weapon";
      case 3: return "Unit";
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
      case 2: return "Quest";
      case 3: return "Campaign";
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
    return 'background: ' + bg + '; border: ' + border + '; display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; margin-right:2px; margin-bottom:6px; border-radius:4px; vertical-align:middle;';
  }
};