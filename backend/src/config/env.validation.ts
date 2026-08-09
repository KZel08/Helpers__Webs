import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),

  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  JWT_EXPIRES_IN: Joi.string().default('15m'),

  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),

  // Optional — not required to start server
  SMTP_HOST: Joi.string().optional().allow(''),
  SMTP_PORT: Joi.number().optional(),
  SMTP_USER: Joi.string().optional().allow(''),
  SMTP_PASS: Joi.string().optional().allow(''),
  SMTP_FROM: Joi.string().optional().allow(''),

  GOOGLE_CLIENT_ID: Joi.string().optional().allow(''),
  GOOGLE_CLIENT_SECRET: Joi.string().optional().allow(''),

  RAZORPAY_KEY: Joi.string().optional().allow(''),
  RAZORPAY_SECRET: Joi.string().optional().allow(''),

  CLOUDINARY_URL: Joi.string().optional().allow(''),

  FIREBASE_CONFIG: Joi.string().optional().allow(''),

  MAX_FILE_SIZE: Joi.number().default(10485760),

  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
}).options({ allowUnknown: true });
