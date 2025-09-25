import { NextFunction, Request, Response } from "express";
import { auth } from "../config/firebase";
import prisma from "../config/prisma-client";

export const register = async (req: Request, res: Response, next: NextFunction) => {
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
        const userFirebase = await auth.createUser({ email, password });
    

        // Bước 2: Cập nhật displayName
        await auth.updateUser(userFirebase.uid, {
            displayName: fullName,
        });

        // Bước 3: Tạo user record trong Prisma
        const role = isAdmin ? "ADMIN" : "USER";
        await prisma.user.create({
            data: {
                firebaseId: userFirebase.uid,
                email,
                fullName,
                role,
            },
        });

        // Bước 4: Tạo custom token và set claims
        const token = await auth.createCustomToken(userFirebase.uid);
        await auth.setCustomUserClaims(userFirebase.uid, { role });

        res.status(200).json({ token });

    } catch (error: any) {
        console.error("Register error:", error.code, error.message); // Log chi tiết lỗi
        let message = "Unable to sign up the user with given credentials";
        if (error.code === 'auth/email-already-exists') {
            message = "Email already in use";
        } else if (error.code === 'auth/weak-password') {
            message = "Password too weak (min 6 characters)";
        } else if (error.code === 'auth/invalid-email') {
            message = "Invalid email format";
        } else if (error.code === 'auth/configuration-not-found') {
            message = "Firebase configuration error. Check serviceAccountKey.json or firebase.js";
        }
        next({ message, error });
    }
};

export const registerWithGoogle = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firebaseId, email, fullName } = req.body;
        const user = await prisma.user.create({
            data: {
                firebaseId,
                email,
                fullName,
            },
        });
        res.status(201).json(user);
    } catch (error) {
        next({ message: "Unable to sign up the user via Google", error });
    }
};