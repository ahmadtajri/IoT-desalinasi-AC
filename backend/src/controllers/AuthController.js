// Authentication Controller
const prisma = require('../config/prisma');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');

/**
 * Register new user (Admin only)
 */
async function register(req, res) {
    try {
        const { username, email, password, role = 'USER' } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required.',
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.username === username
                    ? 'Username already exists.'
                    : 'Email already exists.',
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: role.toUpperCase(),
                createdById: req.user?.id, // Admin who created this user
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: user,
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to register user.',
            error: error.message,
        });
    }
}

/**
 * Login user (accepts username or email)
 */
async function login(req, res) {
    try {
        const { username, password } = req.body;

        // Validation - username field can contain either username or email
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username/Email and password are required.',
            });
        }

        // Check if input is email format
        const isEmail = username.includes('@');

        // Find user by username or email
        const user = await prisma.user.findFirst({
            where: isEmail
                ? { email: username }
                : { username: username },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username/email or password.',
            });
        }

        // Check if user is active
        if (!user.isActive) {
            console.log(`Login failed: User ${username} is inactive`);
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact admin.',
            });
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            console.log(`Login failed: Invalid password for user ${username}`);
            return res.status(401).json({
                success: false,
                message: 'Invalid username/email or password.',
            });
        }

        console.log(`Login successful for user ${username}`);

        // Generate tokens
        const tokens = generateTokens(user);

        // Return user data and tokens
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
                ...tokens,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to login.',
            error: error.message,
        });
    }
}

/**
 * Get current user info
 */
async function getCurrentUser(req, res) {
    try {
        // Updated to use activeInterval relation (global intervals)
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
                activeInterval: true, // Fetch the active global interval
            },
        });

        return res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get user info.',
            error: error.message,
        });
    }
}

/**
 * Refresh access token
 */
async function refreshToken(req, res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required.',
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token or user not found.',
            });
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully.',
            data: tokens,
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token.',
            error: error.message,
        });
    }
}

/**
 * Logout user (client-side token removal)
 */
function logout(req, res) {
    return res.status(200).json({
        success: true,
        message: 'Logout successful. Please remove tokens from client.',
    });
}

module.exports = {
    register,
    login,
    getCurrentUser,
    refreshToken,
    logout,
};
