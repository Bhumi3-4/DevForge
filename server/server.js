require('dotenv').config();
require('express-async-errors');

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./utils/socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Wrap the Express app in a raw HTTP server so Socket.io can attach to it.
  // Express alone (app.listen()) creates this same server internally, but
  // hides it — Socket.io needs direct access to it, hence the explicit wrap.
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

startServer();