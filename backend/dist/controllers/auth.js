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
exports.registerWithGoogle = exports.register = void 0;
const firebase_1 = require("../config/firebase");
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
const register = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, fullName, isAdmin } = req.body;
        // Validation cơ bản
        if (!email || !password || !fullName) {
            return res.status(400).json({ message: "Missing required fields: email, password, fullName" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        // Debug: Log thông tin đầu vào
        // Bước 1: Tạo user trong Firebase (chỉ email và password)
        const userFirebase = yield firebase_1.auth.createUser({ email, password });
        // Bước 2: Cập nhật displayName
        yield firebase_1.auth.updateUser(userFirebase.uid, {
            displayName: fullName,
        });
        // Bước 3: Tạo user record trong Prisma
        const role = isAdmin ? "ADMIN" : "USER";
        yield prisma_client_1.default.user.create({
            data: {
                firebaseId: userFirebase.uid,
                email,
                fullName,
                role,
            },
        });
        // Bước 4: Tạo custom token và set claims
        const token = yield firebase_1.auth.createCustomToken(userFirebase.uid);
        yield firebase_1.auth.setCustomUserClaims(userFirebase.uid, { role });
        res.status(200).json({ token });
    }
    catch (error) {
        console.error("Register error:", error.code, error.message); // Log chi tiết lỗi
        let message = "Unable to sign up the user with given credentials";
        if (error.code === 'auth/email-already-exists') {
            message = "Email already in use";
        }
        else if (error.code === 'auth/weak-password') {
            message = "Password too weak (min 6 characters)";
        }
        else if (error.code === 'auth/invalid-email') {
            message = "Invalid email format";
        }
        else if (error.code === 'auth/configuration-not-found') {
            message = "Firebase configuration error. Check serviceAccountKey.json or firebase.js";
        }
        next({ message, error });
    }
});
exports.register = register;
const registerWithGoogle = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firebaseId, email, fullName } = req.body;
        const user = yield prisma_client_1.default.user.create({
            data: {
                firebaseId,
                email,
                fullName,
            },
        });
        res.status(201).json(user);
    }
    catch (error) {
        next({ message: "Unable to sign up the user via Google", error });
    }
});
exports.registerWithGoogle = registerWithGoogle;
