import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '@uevent/utils';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      next(new ValidationError(messages));
      return;
    }
    next();
  };
};

export const registerSchema = Joi.object({
  login: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(2).max(100).required(),
});

export const loginSchema = Joi.object({
  login: Joi.string().required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const sendPasswordResetSchema = Joi.object({
  email: Joi.string().email().required(),
});
