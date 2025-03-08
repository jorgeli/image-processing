import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationType = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema<any>, type: ValidationType = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[type];
      const validatedData = schema.parse(data);
      req[type] = validatedData;
      next();
    } catch (error) {
      res.status(400).json({ error: (error as ZodError).errors });
    }
  };
};