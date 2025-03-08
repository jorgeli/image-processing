import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  // Handle tsoa validation errors (typically have status property)
  if ('status' in err && typeof (err as any).status === 'number') {
    res.status((err as any).status).json({
      message: err.message
    });
  } 
  // Handle zod validation errors
  else if (err.name === 'ZodError') {
    res.status(400).json({
      message: 'Validation Error',
      errors: (err as any).errors
    });
  }
  // Generic error handler
  else {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
}; 