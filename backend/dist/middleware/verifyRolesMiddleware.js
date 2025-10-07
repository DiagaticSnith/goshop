"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRolesMiddleware = void 0;
const verifyRolesMiddleware = (roles) => (req, res, next) => {
    if (req.role && roles.includes(req.role)) {
        next();
    }
    else {
        return res.status(401).json({ message: "Unauthorized" });
    }
};
exports.verifyRolesMiddleware = verifyRolesMiddleware;
