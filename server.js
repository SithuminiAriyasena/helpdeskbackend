const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const passport = require('./config/passport');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const emailController = require('./controllers/emailController');
const authMiddleware = require('./middleware/auth');

const rateLimit = require('express-rate-limit');

const app = express();
app.use(passport.initialize());

// Middleware
const allowedOrigins = [
  'https://helpdesk-tracker-seven.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const sanitizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.some(o => o.replace(/\/$/, "") === sanitizedOrigin)) {
      return callback(null, true);
    }
    return callback(null, true); // keep permissive; change to callback(new Error('Not allowed by CORS')) to restrict
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware globally (handles preflight automatically)
app.use(cors(corsOptions));

// Use regex wildcard for OPTIONS preflight route to be compatible across Express versions
app.options(/(.*)/, cors(corsOptions));
app.use(express.json());

// Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' }
});

// Routes
app.use('/api/auth', googleAuthRoutes);
app.use('/auth', googleAuthRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// Ensure direct route exists for replying to tickets (also available under /api/tickets/reply via router)
app.post('/api/tickets/reply', authMiddleware, emailController.reply);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
