const Prediction = require("../models/Prediction");

// GET /api/history
exports.getHistory = async (req, res, next) => {
  try {
    const { type, crop, limit = 50, page = 1 } = req.query;
    const filter = { userId: req.user._id };
    if (type)  filter.type = type;
    if (crop)  filter.cropName = { $regex: crop, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      Prediction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Prediction.countDocuments(filter)
    ]);
    res.json({ records, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

// GET /api/history/:id
exports.getSingle = async (req, res, next) => {
  try {
    const record = await Prediction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!record) return res.status(404).json({ error: "Record not found." });
    res.json({ record });
  } catch (err) { next(err); }
};

// DELETE /api/history/:id
exports.deleteRecord = async (req, res, next) => {
  try {
    const record = await Prediction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!record) return res.status(404).json({ error: "Record not found." });
    res.json({ message: "Record deleted successfully." });
  } catch (err) { next(err); }
};

// POST /api/history/bulk-delete
exports.bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No IDs provided." });
    }
    const result = await Prediction.deleteMany({ _id: { $in: ids }, userId: req.user._id });
    res.json({ message: `${result.deletedCount} record(s) deleted.`, deletedCount: result.deletedCount });
  } catch (err) { next(err); }
};

// GET /api/history/stats
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [total, byType] = await Promise.all([
      Prediction.countDocuments({ userId }),
      Prediction.aggregate([
        { $match: { userId } },
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ])
    ]);
    res.json({ total, byType });
  } catch (err) { next(err); }
};
