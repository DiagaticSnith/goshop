import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error middleware', error && (error.stack || error.message || error));

    // busboy / multer truncated form error
    if (error && typeof error.message === 'string' && error.message.includes('Unexpected end of form')) {
        return res.status(400).json({ message: 'Upload failed: request body truncated or connection aborted (Unexpected end of form).' });
    }

    // multer limits errors
    if (error && error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large' });
    }
    if (error && error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Unexpected file field' });
    }

    return res.status(500).json({ message: error?.message || 'Internal Server Error', stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack });
};
