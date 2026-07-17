const bcrypt = require('bcryptjs');
const clientModel = require('../models/client.model');

async function list(req, res, next) {
  try {
    res.json(await clientModel.findAll());
  } catch (err) {
    next(err);
  }
}

// Admin-facing client detail page: profile, battery/status stats, and
// billing history — same data as the client's own "myDashboard"/
// "myTransactions" but looked up by id directly instead of the caller's
// own linked login.
async function getById(req, res, next) {
  try {
    const client = await clientModel.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    const [stats, transactions] = await Promise.all([
      clientModel.getDashboardStats(client.id, client.name),
      clientModel.findMyTransactions(client.id, client.name),
    ]);
    res.json({ client, stats, transactions });
  } catch (err) {
    next(err);
  }
}

// email/tempPassword are optional — supplying both also grants this client
// a login account (role 'client'), which must set its own password on
// first login (see must_change_password).
async function create(req, res, next) {
  try {
    const { name, email, tempPassword } = req.body;
    const passwordHash = email && tempPassword ? await bcrypt.hash(tempPassword, 10) : undefined;
    const client = await clientModel.create({ name, email, passwordHash });
    res.status(201).json(client);
  } catch (err) {
    // Unique violation: a client with this name already exists, or the
    // email is already used by another login account.
    if (err.code === '23505') {
      return res.status(409).json({
        message: err.constraint === 'users_email_key'
          ? 'An account with that email already exists.'
          : 'A client with this name already exists.',
      });
    }
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name } = req.body;
    const client = await clientModel.update(req.params.id, { name });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'A client with this name already exists.' });
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await clientModel.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    // FK violation: this client is tagged on a truck intake.
    if (err.code === '23503') {
      return res.status(409).json({
        message: 'Cannot delete a client tagged on an existing truck intake.',
      });
    }
    next(err);
  }
}

// The logged-in client's own dashboard — resolves their `clients` row from
// the linked login account rather than trusting any id from the request.
async function myDashboard(req, res, next) {
  try {
    const client = await clientModel.findByUserId(req.user.id);
    if (!client) {
      return res.status(409).json({ message: 'Your account is not linked to a client record.' });
    }
    const stats = await clientModel.getDashboardStats(client.id, client.name);
    res.json({ client, stats });
  } catch (err) {
    next(err);
  }
}

const VALID_BUCKETS = new Set(['packed', 'pending', 'received']);

// One of the client dashboard's 3 battery lists: ?bucket=packed|pending|received.
async function myBatteries(req, res, next) {
  try {
    const client = await clientModel.findByUserId(req.user.id);
    if (!client) {
      return res.status(409).json({ message: 'Your account is not linked to a client record.' });
    }
    const bucket = VALID_BUCKETS.has(req.query.bucket) ? req.query.bucket : 'packed';
    const data = await clientModel.findMyBatteries(client.id, client.name, bucket);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// The client's own billing history — every repair charge across every
// battery they've sent in.
async function myTransactions(req, res, next) {
  try {
    const client = await clientModel.findByUserId(req.user.id);
    if (!client) {
      return res.status(409).json({ message: 'Your account is not linked to a client record.' });
    }
    const data = await clientModel.findMyTransactions(client.id, client.name);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, myDashboard, myBatteries, myTransactions };
