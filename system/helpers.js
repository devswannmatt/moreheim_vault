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
  }
};
