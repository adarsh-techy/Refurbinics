const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { corsOrigin } = require('../config/cors-origin');
const userModel = require('../models/user.model');
const partModel = require('../models/part.model');
const batteryModel = require('../models/battery.model');

let io = null;

// Verifies the same JWT used for HTTP requests (see middlewares/auth.js) on
// the socket handshake. Both GET /parts and GET /batteries/repeat-intakes-
// this-month are open to any authenticated user (no permission gate — see
// part.routes.js / battery.routes.js), so a verified connection is all a
// socket needs; NotificationBell/RepeatIntakeAlert already gate whether they
// subscribe client-side on the user's permissions.
async function authenticate(socket, next) {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, env.jwt.secret);
    const user = await userModel.findById(decoded.id);
    if (!user || !user.active) return next(new Error('Invalid or expired token'));

    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}

// Attaches one Socket.IO instance to every underlying HTTP(S) server passed
// in — the app runs plain http and https servers side by side (see
// server.js), and both need to accept socket connections.
function init(servers) {
  io = new Server({ cors: { origin: corsOrigin, credentials: true } });
  io.use(authenticate);
  servers.forEach((server) => io.attach(server));
  return io;
}

// Recomputes the out-of-stock parts list and pushes it to every connected
// client — replaces NotificationBell/LowStockAlert's polling.
async function broadcastOutOfStockParts() {
  if (!io) return;
  const parts = await partModel.findAll();
  const outOfStock = parts.filter((p) => !p.in_stock);
  io.emit('parts:out-of-stock', outOfStock);
}

// Recomputes this month's repeat truck intakes and pushes them to every
// connected client — replaces RepeatIntakeAlert's polling.
async function broadcastRepeatIntakes() {
  if (!io) return;
  const repeats = await batteryModel.findRepeatIntakesThisMonth();
  io.emit('intakes:repeats', repeats);
}

// Recomputes how many batteries are marked unserviceable and pushes it to
// every connected client — powers UnserviceableBatteriesAlert's 100-battery
// popup.
async function broadcastUnserviceableCount() {
  if (!io) return;
  const count = await batteryModel.countByStatus('unserviceable');
  io.emit('batteries:unserviceable-count', count);
}

module.exports = {
  init,
  broadcastOutOfStockParts,
  broadcastRepeatIntakes,
  broadcastUnserviceableCount,
};
