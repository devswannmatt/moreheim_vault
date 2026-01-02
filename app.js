require('dotenv').config();
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const app = express();

const system = require('./system/functions');

const hbsHelpers = require('./system/helpers');
app.engine('hbs', engine({ defaultLayout: 'main', extname: 'hbs', helpers: hbsHelpers }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ type: ['application/json', 'application/*+json'], limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.text({ type: 'text/*', limit: '1mb' }));

app.use(express.static(path.join(__dirname, 'public')));

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
app.use('/warbands', require('./routes/warbands'));
app.use('/campaigns', require('./routes/campaigns'));
app.use('/players', require('./routes/players'));

app.use((req, res) => {
    res.status(404).json({ error: '404 Not Found' });
});

module.exports = app;