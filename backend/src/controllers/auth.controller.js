const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');
const env = require('../config/env');
const { PERMISSIONS } = require('../config/permissions');

function signToken(user) {
  // Only the id is embedded — requireAuth re-fetches role/permissions fresh
  // from the DB on every request, so nothing else here is ever trusted.
  return jwt.sign({ id: user.id }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await userModel.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.active) {
      return res.status(401).json({ message: 'This account has been deactivated' });
    }

    res.json({
      token: signToken(user),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        must_change_password: user.must_change_password,
      },
    });
  } catch (err) {
    next(err);
  }
}

// TEMPORARY: open self-registration for initial setup, before any admin
// accounts exist. Remove this endpoint (and the frontend register page)
// once the real admin-management flow (POST /api/users, super_admin only)
// is in use. Grants full permissions since it's just a bootstrap tool, not
// the real permission-assignment UI.
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      name,
      email,
      passwordHash,
      role: role === 'super_admin' ? 'super_admin' : 'admin',
      permissions: PERMISSIONS,
    });

    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: req.user });
}

// Sets the caller's own password — used by the forced first-login change
// screen for technician/client accounts created with an admin-issued temp
// password (see must_change_password), but works for anyone.
async function changePassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await userModel.updatePassword(req.user.id, passwordHash);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, register, me, changePassword };
