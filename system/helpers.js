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
  }
};
