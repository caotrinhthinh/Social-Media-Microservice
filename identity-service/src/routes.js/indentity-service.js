import express from 'express';
const { registerUser, loginUser, refreshToken } = require('../controllers/identity-controller.js');

const router = express.Router();

router.post('/register', registerUser);

export default router;
