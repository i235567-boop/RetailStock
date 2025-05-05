const Category = require('../models/Category');
const { sendSuccess } = require('../utils/helpers');

exports.listCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { isActive: true };
    if (type) query.type = type;
    const categories = await Category.find(query).sort({ name: 1 });
    return sendSuccess(res, { categories });
  } catch (err) { next(err); }
};
