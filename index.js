require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
const compression = require('compression');
const morgan = require('morgan');
const authController = require('./controllers/authController');

const app = express();

// 1. Logging (To monitor attacks)
app.use(morgan('dev'));

// 2. Performance (Compression)
app.use(compression());

// 3. Security Headers
app.use(helmet());

// 4. Trust proxy
app.set('trust proxy', 1);

// 5. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Increased for development
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// 6. Data Sanitization
app.use((req, res, next) => {
    req.body = mongoSanitize(req.body);
    req.query = mongoSanitize(req.query);
    req.params = mongoSanitize(req.params);
    next();
});

// 7. CORS
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.ADMIN_URL || 'http://localhost:5173',
    'http://127.0.0.1:5173'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Public Routes (Anyone can see)
app.use('/api/journal', require('./routes/journalRoutes'));
app.use('/api/about', require('./routes/aboutRoutes'));
app.use('/api/editorial', require('./routes/editorialRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));

// Special Public Route for articles (index view)
// Note: We protect only the modification routes in the routes themselves, 
// or here if they are separate. Let's look at articleRoutes.

app.use('/api/articles', require('./routes/articleRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// --- PROTECT ADMIN ACTIONS ---
// (We should ideally protect the specific POST/PUT/DELETE methods in the routes files)
// For now, let's keep it simple. Any route after this needs a token.
// Actually, it's better to protect them in the route files to allow GETs to be public.


// Health check
app.get('/', (req, res) => {
    res.json({
        message: 'Spectra API is working',
        status: 'UP',
        timestamp: new Date()
    });
});

app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState === 1 ? 'OK' : 'DISCONNECTED';
    res.json({ 
        status: 'UP', 
        database: dbState,
        timestamp: new Date()
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
