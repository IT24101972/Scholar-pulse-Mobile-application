const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const vaultRoutes = require('./routes/vaultRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const eventRoutes = require('./routes/eventRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const clubRoutes = require('./routes/clubRoutes');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Set static folder for uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/lostfound', lostFoundRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/clubs', clubRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Welcome to ScholarPulse API', version: '1.0.0' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'ScholarPulse API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Trigger nodemon restart
