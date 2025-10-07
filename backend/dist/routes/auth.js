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
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
const firebase_1 = require("../config/firebase");
const router = (0, express_1.Router)();
router.post("/session-login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idToken } = req.body;
    console.log("Received idToken:", idToken); // Thêm log này
    try {
        const decoded = yield firebase_1.auth.verifyIdToken(idToken);
        console.log("Decoded UID:", decoded.uid); // Thêm log này
        const user = yield prisma_client_1.default.user.findUnique({
            where: { firebaseId: decoded.uid }
        });
        if (!user) {
            console.log("User not found in DB for UID:", decoded.uid); // Thêm log này
            return res.status(404).json({ message: "User not found" });
        }
        console.log("[LOGIN] User role:", user.role, "email:", user.email);
        return res.json({
            email: user.email,
            role: user.role,
            fullName: user.fullName
        });
    }
    catch (error) {
        console.log("Error in session-login:", error); // Thêm log này
        return res.status(401).json({ message: "Invalid token" });
    }
}));
router.post("/register/google", auth_1.registerWithGoogle);
router.post("/register", auth_1.register);
exports.default = router;
