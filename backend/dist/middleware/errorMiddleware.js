"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const errorMiddleware = (error, req, res, next) => {
    console.error('Unhandled error middleware', error);
    return res.status(500).json({ message: error.message, stack: error.stack });
};
exports.errorMiddleware = errorMiddleware;
