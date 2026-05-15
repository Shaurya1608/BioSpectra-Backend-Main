const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const UAParser = require('ua-parser-js');
const User = require('../models/User');
const Session = require('../models/Session');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    });
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Check if username and password exist
        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password' });
        }

        // 2. Check if user exists & password is correct
        const user = await User.findOne({ username }).select('+password');

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
        }

        // 3. Check if MFA is enabled
        if (user.isMfaEnabled) {
            return res.status(200).json({
                status: 'mfa_required',
                userId: user._id
            });
        }

        // 4. If everything ok, send token to client
        const token = signToken(user._id);

        // 5. Track Session
        const parser = new UAParser(req.headers['user-agent']);
        const ua = parser.getResult();
        
        await Session.create({
            userId: user._id,
            token,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            device: {
                browser: `${ua.browser.name || 'Unknown'} ${ua.browser.version || ''}`,
                os: `${ua.os.name || 'Unknown'} ${ua.os.version || ''}`,
                device: ua.device.model || 'Desktop'
            }
        });

        res.status(200).json({
            status: 'success',
            token,
            user: {
                id: user._id,
                username: user.username
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// MFA Setup - Generate QR Code
exports.setupMfa = async (req, res) => {
    try {
        console.log('Generating MFA for user:', req.user._id);
        const user = await User.findById(req.user._id);
        
        if (!user) {
            console.error('User not found for MFA setup');
            return res.status(404).json({ message: 'User not found' });
        }

        const secret = speakeasy.generateSecret({
            name: `Biospectra (${user.username})`
        });

        user.mfaSecret = secret.base32;
        await user.save();

        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        res.status(200).json({
            status: 'success',
            qrCode: qrCodeUrl,
            secret: secret.base32
        });
    } catch (error) {
        console.error('MFA Setup Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// MFA Verification - Enable after first success
exports.verifyMfaSetup = async (req, res) => {
    try {
        const { token } = req.body;
        const user = await User.findById(req.user.id).select('+mfaSecret');

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token
        });

        if (!verified) {
            return res.status(400).json({ message: 'Invalid token. Verification failed.' });
        }

        user.isMfaEnabled = true;
        await user.save();

        res.status(200).json({
            status: 'success',
            message: 'MFA enabled successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// MFA Login - Final Step
exports.loginMfa = async (req, res) => {
    try {
        const { userId, token } = req.body;
        const user = await User.findById(userId).select('+mfaSecret');

        if (!user || !user.isMfaEnabled) {
            return res.status(400).json({ message: 'MFA not enabled for this account' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token
        });

        if (!verified) {
            return res.status(401).json({ message: 'Invalid MFA token' });
        }

        const jwtToken = signToken(user._id);

        // Track Session
        const parser = new UAParser(req.headers['user-agent']);
        const ua = parser.getResult();
        
        await Session.create({
            userId: user._id,
            token: jwtToken,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            device: {
                browser: `${ua.browser.name || 'Unknown'} ${ua.browser.version || ''}`,
                os: `${ua.os.name || 'Unknown'} ${ua.os.version || ''}`,
                device: ua.device.model || 'Desktop'
            }
        });

        res.status(200).json({
            status: 'success',
            token: jwtToken,
            user: {
                id: user._id,
                username: user.username
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.protect = async (req, res, next) => {
    try {
        // 1. Getting token and check of it's there
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'You are not logged in. Please log in to get access.' });
        }

        // 2. Verification token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Check if session still exists and is active in database
        const session = await Session.findOne({ token, userId: decoded.id });
        
        if (!session) {
            return res.status(401).json({ message: 'Your session has been terminated. Please log in again.' });
        }

        // Update last active
        session.lastActive = Date.now();
        await session.save();

        // 4. Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        req.sessionId = session._id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }
};

exports.getSessions = async (req, res) => {
    try {
        console.log('Fetching sessions for user:', req.user._id);
        const sessions = await Session.find({ userId: req.user._id }).sort('-lastActive');
        console.log('Found sessions:', sessions.length);
        
        res.status(200).json({
            status: 'success',
            results: sessions.length,
            sessions: sessions.map(s => ({
                id: s._id,
                ipAddress: s.ipAddress,
                device: s.device,
                lastActive: s.lastActive,
                isCurrent: s.token === req.headers.authorization.split(' ')[1]
            }))
        });
    } catch (error) {
        console.error('getSessions Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.terminateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        await Session.findOneAndDelete({ _id: sessionId, userId: req.user._id });
        
        res.status(200).json({
            status: 'success',
            message: 'Session terminated successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.logout = async (req, res) => {
    try {
        // If protected route, we have sessionId
        if (req.sessionId) {
            await Session.findByIdAndDelete(req.sessionId);
        } else {
            // Fallback for non-protected logout if token provided
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                await Session.findOneAndDelete({ token });
            }
        }

        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.googleCallback = async (req, res) => {
    try {
        const user = req.user;

        // Strictly check for Admin role
        if (user.role !== 'admin') {
            console.warn(`Unauthorized login attempt by ${user.email}`);
            return res.redirect(`${process.env.ADMIN_URL || 'http://localhost:5173'}/login?error=unauthorized`);
        }

        const token = signToken(user._id);

        // Track Session
        const parser = new UAParser(req.headers['user-agent']);
        const ua = parser.getResult();
        
        await Session.create({
            userId: user._id,
            token,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            device: {
                browser: `${ua.browser.name || 'Unknown'} ${ua.browser.version || ''}`,
                os: `${ua.os.name || 'Unknown'} ${ua.os.version || ''}`,
                device: ua.device.model || 'Desktop'
            }
        });

        // Redirect back to admin frontend with token and user data
        // Using ADMIN_URL from env, stripping trailing slash if present
        const adminUrl = (process.env.ADMIN_URL || 'http://localhost:5173').replace(/\/$/, '');
        const userData = encodeURIComponent(JSON.stringify({ id: user._id, username: user.username }));
        
        res.redirect(`${adminUrl}?token=${token}&user=${userData}`);
    } catch (error) {
        console.error('Google Callback Error:', error);
        res.redirect(`${process.env.ADMIN_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
};
