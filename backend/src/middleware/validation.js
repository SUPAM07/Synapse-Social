import { ValidationError } from '../utils/errors.js';

export function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const message = error.details.map(d => d.message).join(', ');
      return next(new ValidationError(message));
    }
    next();
  };
}
