function checkEnvironmentVariables() {
    // Additional environment variable checks can be added here
    var errors = { count: 0, env: {} };
    if (!process.env.PORT) {
        errors.env.PORT = "[ERROR] PORT is not defined in .env file";
        errors.count++;
        console.error(errors.env.PORT);
    }
    if (!process.env.MONGODB_URI) {
        errors.env.MONGODB_URI = "[ERROR] MONGODB_URI is not defined in .env file";
        errors.count++;
        console.error(errors.env.MONGODB_URI);
    }

    if (errors.count > 0) {
        console.error("Exiting due to missing environment variables");
        process.exit(1);
    } else {
        console.log("[CHECK] All required environment variables are set");
    }
}

// Start server after DB connects
async function start(app) {
    const mongo = require('../database/mongo');
    const { close } = require('../database/db');
    const port = process.env.PORT || 3000;
    try {
        await mongo.connect();
        const server = app.listen(port, () => {
            console.log(`[START] Moreheim Vault API listening on port ${port}`);
        });

        process.on('SIGINT', async () => {
            console.log('Shutting down...');
            server.close(() => console.log('[SHUTDOWN] HTTP server closed'));
            try { await close(); console.log('[SHUTDOWN] DB connection closed'); } catch (e) { }
            process.exit(0);
        });
    } catch (err) {
        console.error('Failed to start application:', err);
        process.exit(1);
    }
}

module.exports = { checkEnvironmentVariables, start };