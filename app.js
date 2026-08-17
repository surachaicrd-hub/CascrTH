/**
 * Application Entry Point Forwarder for Plesk / cPanel Node.js Hosting
 */
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

require('./api/index.js');
