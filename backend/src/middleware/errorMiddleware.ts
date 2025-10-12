import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (error: Error & { message: string }, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error middleware', error);
    return res.status(500).json({ message: error.message, stack: (error as any).stack });
};
