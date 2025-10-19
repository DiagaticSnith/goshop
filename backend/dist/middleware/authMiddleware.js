"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
const firebase_1 = require("../config/firebase");
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization is required" });
    }
    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json({ message: "Authorization is required" });
    }
    try {
        const decodedToken = yield firebase_1.auth.verifyIdToken(accessToken);
        req.uid = decodedToken.uid;
        // Truy vấn user từ MySQL bằng uid
        const user = yield prisma_client_1.default.user.findUnique({
            where: { firebaseId: decodedToken.uid }
        });
        if (!user || !user.role) {
            return res.status(401).json({ message: "Unauthorized: No user or role found" });
        }
        // Block hidden users from accessing any protected endpoint
        if (user.status === 'HIDDEN') {
            return res.status(403).json({ message: 'Account is locked' });
        }
        req.role = user.role;
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
});
exports.authMiddleware = authMiddleware;
