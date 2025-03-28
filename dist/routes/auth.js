"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'fallbackSecret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallbackSecret';
router.post('/login', (req, res) => {
    const { login, password } = req.body;
    const users = req.app.locals.users;
    const user = users.find(u => u.login === login && u.password === password);
    if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }
    const payload = {
        userId: user.id,
        role: user.role,
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
    res.json({ accessToken, refreshToken });
});
router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        res.status(400).json({ message: 'No refresh token provided' });
        return;
    }
    jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).json({ message: 'Invalid refresh token' });
            return;
        }
        const { userId, role } = decoded;
        const newAccessToken = jsonwebtoken_1.default.sign({ userId, role }, JWT_SECRET, {
            expiresIn: '15m',
        });
        res.json({ accessToken: newAccessToken });
    });
});
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
        res.status(401).json({ message: 'No token' });
        return;
    }
    const token = authHeader.split(' ')[1];
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(401).json({ message: 'Invalid token' });
            return;
        }
        const { userId } = decoded;
        const users = req.app.locals.users;
        const user = users.find(u => u.id === userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const { password, ...rest } = user;
        res.json(rest);
    });
});
exports.default = router;
