import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import identityRoutes from './routes.js/indentity-service.js';
import logger from './utils/logger.js';
import helmet from 'helmet';
import cors from 'cors';
import { log } from 'winston';
import ratelimiterRedis from 'rate-limiter-flexible';
import redisClient from 'redis';

dotenv.config();

const app = express();

mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true, // eslint-disable-line no-undef
        useUnifiedTopology: true, // eslint-disable-line no-undef
    })
    .then(() => logger.info('Connected to MongoDB'))
    .catch((err) => logger.error('MongoDB connection error: %o', err));

const redisClient = require('redis').createClient({
    url: process.env.REDIS_URL,
});

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
