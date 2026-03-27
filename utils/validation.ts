import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Validation middleware for request body
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.body);
      req.body = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          error: 'Validation failed',
          details: errorMessages
        });
      }
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
};

// Validation middleware for query parameters
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.query);
      // Express 5.1.0: req.query is read-only, so we mutate the object properties directly
      const queryObj = req.query as Record<string, any>;
      const validated = validatedData as Record<string, any>;

      // Remove properties not in validated data
      Object.keys(queryObj).forEach(key => {
        if (!(key in validated)) {
          try {
            delete queryObj[key];
          } catch {
            // Property might be read-only, ignore
          }
        }
      });

      // Overwrite/assign validated properties
      Object.assign(queryObj, validated);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          error: 'Query validation failed',
          details: errorMessages
        });
      }
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
};

// Validation middleware for URL parameters
export const validateParams = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await schema.parseAsync(req.params);
      // Express 5.1.0: req.params is read-only, so we mutate the object properties directly
      const paramsObj = req.params as Record<string, any>;
      const validated = validatedData as Record<string, any>;

      // Remove properties not in validated data
      Object.keys(paramsObj).forEach(key => {
        if (!(key in validated)) {
          try {
            delete paramsObj[key];
          } catch {
            // Property might be read-only, ignore
          }
        }
      });

      // Overwrite/assign validated properties
      Object.assign(paramsObj, validated);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          error: 'Parameter validation failed',
          details: errorMessages
        });
      }
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
};

// Combined validation middleware for body, query, and params
export const validateRequest = <TBody = any, TQuery = any, TParams = any>(schemas: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body if schema provided
      if (schemas.body) {
        const validatedBody = await schemas.body.parseAsync(req.body);
        req.body = validatedBody as any;
      }

      // Validate query if schema provided
      if (schemas.query) {
        const validatedQuery = await schemas.query.parseAsync(req.query);
        // Express 5.1.0: req.query is read-only, so we mutate the object properties directly
        const queryObj = req.query as Record<string, any>;
        const validated = validatedQuery as Record<string, any>;

        // Remove properties not in validated data
        Object.keys(queryObj).forEach(key => {
          if (!(key in validated)) {
            try {
              delete queryObj[key];
            } catch {
              // Property might be read-only, ignore
            }
          }
        });

        // Overwrite/assign validated properties
        Object.assign(queryObj, validated);
      }

      // Validate params if schema provided
      if (schemas.params) {
        const validatedParams = await schemas.params.parseAsync(req.params);
        // Express 5.1.0: req.params is read-only, so we mutate the object properties directly
        const paramsObj = req.params as Record<string, any>;
        const validated = validatedParams as Record<string, any>;

        // Remove properties not in validated data
        Object.keys(paramsObj).forEach(key => {
          if (!(key in validated)) {
            try {
              delete paramsObj[key];
            } catch {
              // Property might be read-only, ignore
            }
          }
        });

        // Overwrite/assign validated properties
        Object.assign(paramsObj, validated);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          type: err.path[0] // body, query, or params
        }));
        return res.status(400).json({
          error: 'Request validation failed',
          details: errorMessages
        });
      }
      return res.status(500).json({
        error: 'Internal validation error'
      });
    }
  };
};

// Helper function to create validation error response
export const createValidationError = (errors: ZodError) => {
  return {
    error: 'Validation failed',
    details: errors.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
  };
};

// Type for validation schemas
export type ValidationSchemas = {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
};
