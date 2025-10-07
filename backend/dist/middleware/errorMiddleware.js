"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const errorMiddleware = (error, req, res, next) => {
    return res.status(500).json({ message: error.message });
};
exports.errorMiddleware = errorMiddleware;
