import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.js';

const generateTokens = async (user) => {
    const accessToken = jwt.sign(
        {
            userId: user._id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '15m',
        },
    );

    // Generate a secure random refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Set expiration to 7 days

    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt,
    });

    return { accessToken, refreshToken };
};

export default generateTokens;
