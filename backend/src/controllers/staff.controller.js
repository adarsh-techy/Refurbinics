const bcrypt = require('bcryptjs');
const staffModel = require('../models/staff.model');

async function list(req, res, next) {
  try {
    res.json(await staffModel.findAll());
  } catch (err) {
    next(err);
  }
}

// loginEmail/tempPassword are optional — supplying both also grants this
// staff member a technician login account, which must set its own password
// on first login (see must_change_password).
async function create(req, res, next) {
  try {
    const { name, phone, salary, role, loginEmail, tempPassword } = req.body;
    const passwordHash =
      loginEmail && tempPassword ? await bcrypt.hash(tempPassword, 10) : undefined;
    const staff = await staffModel.create({
      name,
      phone,
      salary,
      role,
      email: loginEmail,
      passwordHash,
    });
    res.status(201).json(staff);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name, phone, active, salary, role } = req.body;
    const staff = await staffModel.update(req.params.id, {
      name,
      phone,
      active: active !== undefined ? active : true,
      salary,
      role,
    });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(staff);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await staffModel.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    // FK violation: this staff member has repair history.
    if (err.code === '23503') {
      return res.status(409).json({
        message:
          'Cannot delete a staff member with repair history. Mark them inactive instead.',
      });
    }
    next(err);
  }
}

// Staff detail page: profile plus every repair they've logged, for the
// "how many jobs, when" view.
async function getById(req, res, next) {
  try {
    const staff = await staffModel.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    const repairs = await staffModel.findRepairs(req.params.id);
    res.json({ staff, repairs });
  } catch (err) {
    next(err);
  }
}

// The logged-in technician's own staff record plus their repair history —
// resolved from the linked login account rather than trusting an id from
// the request, same pattern as client.controller.js's myDashboard.
async function myProfile(req, res, next) {
  try {
    const staff = await staffModel.findByUserId(req.user.id);
    if (!staff) {
      return res.status(409).json({ message: 'Your account is not linked to a staff record.' });
    }
    const repairs = await staffModel.findRepairs(staff.id);
    res.json({ staff, repairs });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, remove, getById, myProfile };
