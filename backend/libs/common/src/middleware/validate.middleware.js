const { validationResult } = require('express-validator');
const { ValidationError } = require('../errors/app.error');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(', ');
    return next(new ValidationError(messages));
  }
  next();
};

module.exports = { validate };
