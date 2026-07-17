const partModel = require('../models/part.model');

async function list(req, res, next) {
  try {
    res.json(await partModel.findAll());
  } catch (err) {
    next(err);
  }
}

// Part detail page: the part's own info plus every repair that's used it,
// for the "how often, on what, by whom" view.
async function getById(req, res, next) {
  try {
    const part = await partModel.findById(req.params.id);
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }
    const usageHistory = await partModel.findUsageHistory(req.params.id);
    res.json({ part, usageHistory });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, sku, quantity, repairCost } = req.body;
    const part = await partModel.create({
      name,
      sku,
      quantity: quantity || 0,
      repairCost: repairCost || 0,
    });
    res.status(201).json(part);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { name, sku, quantity, repairCost } = req.body;
    const part = await partModel.update(req.params.id, {
      name,
      sku,
      quantity: quantity || 0,
      repairCost: repairCost || 0,
    });
    if (!part) {
      return res.status(404).json({ message: 'Part not found' });
    }
    res.json(part);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await partModel.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    // FK violation: this part has been used in a repair.
    if (err.code === '23503') {
      return res.status(409).json({
        message: 'Cannot delete a part that has been used in a repair.',
      });
    }
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
