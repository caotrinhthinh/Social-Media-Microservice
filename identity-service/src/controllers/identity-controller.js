import User from '../models/User.js';
import logger from '../utils/logger.js';
import { validateLogin, validateRegistration } from '../utils/validation.js';
import generateTokens from '../utils/generateTokens.js';

const registerUser = async (req, res) => {
    logger.info('Registering new user: %s', req.body.username);
    try {
        // validate schema
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn('Validation error: %s', error.details[0].message);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const { email, username, password } = req.body;

        // check if user already exists
        let user = await User.findOne({ $or: [{ email }, { username }] });

        if (user) {
            logger.warn('User already exists with email: %s or username: %s', email, username);
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        user = new User({ email, username, password });
        await user.save();

        logger.info('User registered successfully: %s', username);

        const { accessToken, refreshToken } = await generateTokens(user);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        logger.error('Error registering user: %o', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
const loginUser = async (req, res) => {};
const refreshToken = async (req, res) => {};
const logoutUser = async (req, res) => {};

export { registerUser, loginUser, refreshToken };
