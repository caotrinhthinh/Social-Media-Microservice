import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(), // Add timestamps to logs
        winston.format.errors({ stack: true }), // Include stack trace in error logs
        winston.format.splat(), // Support string interpolation
        winston.format.json(), // Log in JSON format
    ),
    defaultMeta: { service: 'identity-service' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(), // Colorize logs for console
                winston.format.simple(), // Simple format for console
            ),
        }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

export default logger;
