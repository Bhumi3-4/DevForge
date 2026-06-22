const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');

const app = express();

//  Security & Utility Middleware ─
app.use(helmet());

// Supports multiple comma-separated origins via CLIENT_URL, e.g.
// CLIENT_URL=https://devforge.vercel.app,https://devforge.com
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// HTTP request logger — only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//  Body Parsers ─
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//  Health Check ─
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'DevForge API is running' });
});

//  API Routes 
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/recruitment', require('./routes/recruitmentRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));

//  Error Handling (must be last) 
app.use(notFound);
app.use(errorHandler);

module.exports = app;