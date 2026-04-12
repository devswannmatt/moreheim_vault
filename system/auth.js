const player = require('../database/models/player');

function getAuthEnv() {
  return {
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    clientSecret: process.env.AUTH0_CLIENT_SECRET
  };
}

function hasRealValue(value) {
  if (!value) return false;
  const normalized = String(value).trim();
  if (!normalized) return false;
  if (normalized.includes('replace-with-')) return false;
  if (normalized.includes('your-tenant-region')) return false;
  return true;
}

function isAuthConfigured() {
  const env = getAuthEnv();
  return [env.secret, env.baseURL, env.clientID, env.issuerBaseURL, env.clientSecret].every(hasRealValue);
}

function buildPlayerName(profile) {
  if (!profile) return 'New Player';
  if (profile.nickname) return profile.nickname;
  if (profile.name) return profile.name;
  if (profile.email) return String(profile.email).split('@')[0];
  return 'New Player';
}

async function ensurePlayerAccount(profile) {
  if (!profile || !profile.sub) return null;

  const existing = await player.findPlayerByAuthSubject(profile.sub);
  const account = {
    provider: 'auth0',
    subject: profile.sub,
    email: profile.email || '',
    name: profile.name || '',
    nickname: profile.nickname || '',
    picture: profile.picture || ''
  };

  if (existing) {
    const needsUpdate =
      (existing.account && existing.account.email) !== account.email ||
      (existing.account && existing.account.name) !== account.name ||
      (existing.account && existing.account.nickname) !== account.nickname ||
      (existing.account && existing.account.picture) !== account.picture;

    if (!needsUpdate) return existing;
    return player.updatePlayer(existing._id, { account });
  }

  const playerId = await player.createPlayer({
    name: buildPlayerName(profile),
    meta: {
      email: profile.email || '',
      authProvider: 'auth0'
    },
    account
  });

  return player.getPlayerById(playerId);
}

function isAuthEnabledForRequest(req) {
  return Boolean(req && req.app && req.app.locals && req.app.locals.authEnabled);
}

function requireAuthenticated(req, res, next) {
  if (!isAuthEnabledForRequest(req)) return next();
  if (req.currentPlayer) return next();
  return res.status(401).json({ error: 'Authentication required' });
}

function applyAuth(app) {
  if (!isAuthConfigured()) {
    app.locals.authEnabled = false;
    console.log('[AUTH] Auth0 not configured. Login routes disabled.');
    app.use((req, res, next) => {
      res.locals.authEnabled = false;
      res.locals.isAuthenticated = false;
      res.locals.currentPlayer = null;
      res.locals.currentUser = null;
      next();
    });
    return;
  }

  const { auth } = require('express-openid-connect');
  const env = getAuthEnv();
  app.locals.authEnabled = true;

  app.use(auth({
    authRequired: false,
    auth0Logout: true,
    secret: env.secret,
    baseURL: env.baseURL,
    clientID: env.clientID,
    clientSecret: env.clientSecret,
    issuerBaseURL: env.issuerBaseURL,
    idpLogout: true,
    routes: {
      login: '/login',
      logout: '/logout',
      callback: '/callback'
    },
    authorizationParams: {
      response_type: 'code',
      scope: 'openid profile email'
    }
  }));

  app.use(async (req, res, next) => {
    res.locals.authEnabled = true;
    res.locals.isAuthenticated = Boolean(req.oidc && req.oidc.isAuthenticated());
    res.locals.currentPlayer = null;
    res.locals.currentUser = req.oidc ? req.oidc.user : null;

    if (!res.locals.isAuthenticated || !req.oidc.user) return next();

    try {
      const linkedPlayer = await ensurePlayerAccount(req.oidc.user);
      req.currentPlayer = linkedPlayer;
      res.locals.currentPlayer = linkedPlayer;
    } catch (err) {
      console.error('[AUTH] Unable to provision player account:', err.message);
    }

    next();
  });
}

module.exports = { applyAuth, isAuthConfigured, ensurePlayerAccount, requireAuthenticated, isAuthEnabledForRequest };