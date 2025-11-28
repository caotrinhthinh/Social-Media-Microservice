import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
    logger.error('Error: %o', err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
};

export default errorHandler;
