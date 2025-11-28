import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import identityRoutes from './routes.js/indentity-service.js';
import logger from './utils/logger.js';
import helmet from 'helmet';
import cors from 'cors';
import ratelimiterRedis from 'rate-limiter-flexible';
import Redis from 'ioredis';
import rateLimit from 'express-rate-limit';
import redisStore from 'rate-limit-redis';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => logger.info('Connected to MongoDB'))
    .catch((err) => logger.error('MongoDB connection error: %o', err));

const redisClient = new Redis({
    url: process.env.REDIS_URL,
});

redisClient
    .connect()
    .then(() => console.log('Connected to Redis'))
    .catch((err) => console.error('Redis connection error:', err));

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

app.use((req, res, next) => {
    logger.info('Received %s request for %s', req.method, req.url);
    logger.info('Request body: %o', req.body);
    next();
});

// DDos protection and rate limiting
const rateLimiter = new ratelimiterRedis.RateLimiterRedis({
    storeClient: redisClient, // Redis client
    points: 100, // Number of points
    duration: 60, // Per second(s)
});

app.use((req, res, next) => {
    rateLimiter
        .consume(req.ip) // consume 1 point per request from IP
        .then(() => {
            next();
        })
        .catch(() => {
            logger.warn('Rate limit exceeded for IP: %s', req.ip);
            res.status(429).json({ success: false, message: 'Too Many Requests' });
        });
});

// Sensitive endpoint rate limiting
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn('Sensitive endpoint rate limit exceeded for IP: %s', req.ip);
        res.status(429).json({ success: false, message: 'Too Many Requests' });
    },
    store: new redisStore({ sendCommand: (...args) => redisClient.call(args) }), // Use Redis store
});

// Apply rate limiting to sensitive endpoints
app.use('/api/auth/register', sensitiveEndpointsLimiter);

// Routes
app.use('/api/auth', identityRoutes);

// Global error handler
app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => {
    logger.info(`Identity Service running on port ${process.env.PORT || 3000}`);
});

// unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at: %o, reason: %o', promise, reason);
});

// uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception: %o', err);
    process.exit(1); // exit the process
});

export default app;
