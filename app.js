require('dotenv').config();
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const app = express();

const system = require('./system/functions');
const auth = require('./system/auth');
const warbandModel = require('./database/models/warband');

const hbsHelpers = require('./system/helpers');
const hbsPartials = [
    path.join(__dirname, 'views', 'partials'),
    path.join(__dirname, 'views', 'layouts')
];
app.engine('hbs', engine({
    defaultLayout: 'main',
    extname: 'hbs',
    helpers: hbsHelpers,
    partialsDir: hbsPartials,
    layoutsDir: path.join(__dirname, 'views', 'layouts')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ type: ['application/json', 'application/*+json'], limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: 'text/*', limit: '1mb' }));

app.use(express.static(path.join(__dirname, 'public')));
auth.applyAuth(app);

app.use(async (req, res, next) => {
    res.locals.navWarbands = [];

    // Only load nav data for HTML requests to avoid extra DB queries on JSON/API calls.
    if (!req.accepts('html')) {
        return next();
    }

    try {
        const warbands = await warbandModel.findWarbands({}, { select: 'name', sort: { name: 1 } });
        res.locals.navWarbands = warbands.map(w => ({ _id: w._id, name: w.name }));
    } catch (err) {
        console.error('Unable to load warband nav links:', err.message);
    }

    next();
});

system.checkEnvironmentVariables();
system.start(app);

app.get('/', (req, res) => {
    if (req.accepts('html')) {
        return res.render('home', {
            online: true,
            message: 'Moreheim Vault API',
            uptime: process.uptime()
        });
    }
    res.json({
        online: true,
        message: 'Moreheim Vault API',
        uptime: process.uptime()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/dashboard', (req, res) => {
    return res.render('dashboard', { title: 'Dashboard' });
});

app.use('/items', require('./routes/items'));
app.use('/rosters', require('./routes/rosters'));
app.use('/campaigns', require('./routes/campaigns'));
app.use('/players', require('./routes/players'));
app.use('/members', require('./routes/members'));
app.use('/units', require('./routes/units'));
app.use('/warbands', require('./routes/warbands'));
app.use('/traits', require('./routes/traits'));
app.use('/events', require('./routes/events'));

app.use((req, res) => {
    res.status(404).json({ error: '404 Not Found' });
});

module.exports = app;