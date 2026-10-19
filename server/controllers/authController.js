const authService = require('../services/authService');
const { success, error } = require('../utils/response');
const { isProd } = require('../config/env');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = async (req, res, next) => {
  try {
    const result = await authService.register({
      ...req.body,
      req,
    });

    // Set refresh token in secure HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return success(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        verificationToken: result.verificationToken,
      },
      'Registration successful. Welcome to KhetiSetu!',
      201
    );
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login({
      email: req.body.email,
      password: req.body.password,
      req,
    });

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return success(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      'Login successful'
    );
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!rawRefreshToken) {
      return error(res, 'Refresh token required in cookie or body', 'TOKEN_REQUIRED', 401);
    }

    const result = await authService.refreshAccessToken({ rawRefreshToken, req });

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return success(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      'Token refreshed successfully'
    );
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    const userId = req.user ? req.user.id : null;

    await authService.logout({ rawRefreshToken, userId, req });
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return success(res, {}, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user.id);
  if (!user) {
    return error(res, 'User not found', 'NOT_FOUND', 404);
  }
  return success(res, { user: user.toPublicJSON() });
};

const verifyEmail = async (req, res, next) => {
  try {
    const result = await authService.verifyEmail({ token: req.params.token, req });
    return success(res, result, 'Email verified successfully');
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword({ email: req.body.email, req });
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword({
      token: req.body.token,
      newPassword: req.body.newPassword,
      req,
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
