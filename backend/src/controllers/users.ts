import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma-client";
import { auth } from "../config/firebase";

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        });
        if (existingUser) {
            return res.status(400).json({ message: "User with given email already exists" });
        }
    
        const newUser = await prisma.user.create({
            data: req.body
        });
    
        res.status(201).json(newUser);
    } catch (error) {
        next({ message: "Unable to create the user", error });
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.id;
        // security: only owner or ADMIN can update
        const requesterId = req.uid;
        const requesterRole = req.role;
        if (requesterId !== userId && requesterRole !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const foundUser = await prisma.user.findUnique({
            where: {
                firebaseId: userId
            }
        });
    
        if (!foundUser) {
            return res.status(404).json({ message: "User not found" });
        }
        // Compose fullName from firstName/lastName if provided (admin UI), otherwise fallback to provided fullName
        const firstName = (req.body.firstName || "").toString().trim();
        const lastName = (req.body.lastName || "").toString().trim();
        const fullNameFromNames = `${firstName} ${lastName}`.trim();
        const newFullName = fullNameFromNames || (req.body.fullName || foundUser.fullName);

        
        // Always ignore email updates via this endpoint for safety
        // Admin UI should not change email; if email provided, discard.

        const image = req.image || req.body.avatar;
        // Log incoming update for debugging
        console.log('[users] updateUser called:', { userId, requesterId, requesterRole, body: req.body, hasImage: !!req.image });
        // Build update payload dynamically to avoid touching unknown fields
        const updateData: any = {
            fullName: newFullName,
            avatar: image || foundUser.avatar
        };
        if (typeof req.body.address === 'string') {
            updateData.address = req.body.address;
        } 

        if (typeof req.body.phone == 'string') {
            updateData.phone = req.body.phone;
        }
        const updatedUser = await prisma.user.update({
            where: { firebaseId: userId },
            data: updateData
        });
        // Update Firebase displayName/photo only (do not modify email here)
        try {
            console.log('[users] updating firebase auth profile for', userId);
            await auth.updateUser(userId || "", {
                displayName: newFullName,
                photoURL: image || undefined
            });
        } catch (fbErr) {
            console.error('[users] firebase updateUser failed:', fbErr);
            // continue — we still return updatedUser, but surface error in non-prod
            const fbErrAny = fbErr as any;
            if (process.env.NODE_ENV !== 'production') {
                return res.status(500).json({ message: 'Firebase update failed', error: fbErrAny?.message || fbErrAny });
            }
        }
        const token = await auth.createCustomToken(userId);

        res.status(200).json({ user: updatedUser, token });
    } catch (error) {
        console.error('[users] updateUser error:', error);
        // If DEBUG_ERRORS=true in env, return the error details in the response for debugging.
        if (process.env.DEBUG_ERRORS === 'true') {
            return res.status(500).json({ message: "Unable to update the user", error: (error as any)?.message || error });
        }
        if (process.env.NODE_ENV !== 'production') {
            return res.status(500).json({ message: "Unable to update the user", error: (error as any)?.message || error });
        }
        next({ message: "Unable to update the user", error });
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Soft delete: set status to HIDDEN instead of removing (keep FKs intact)
        const updated = await prisma.user.update({
            where: { firebaseId: req.params.id },
            data: { status: "HIDDEN" as any }
        });
        if (!updated) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User hidden" });
    } catch (error) {
        next({ message: "Unable to delete the user", error });
    }
};

export const getUserByFirebaseId = async (req: Request, res: Response) => {
    const foundUser = await prisma.user.findUnique({
        where: {
            firebaseId: req.params.id
        }
    });
    if (!foundUser) {
        return res.status(404).json("User not found");
    }
    
    res.status(200).json(foundUser);
};

// Admin: list users with filters (includeHidden=true to include HIDDEN)
export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q, includeHidden } = req.query as { q?: string; includeHidden?: string };
        const where: any = {};
        if (q) {
            where.OR = [
                { email: { contains: q, mode: "insensitive" } },
                { fullName: { contains: q, mode: "insensitive" } }
            ];
        }
        if (!includeHidden) {
            where.status = "ACTIVE";
        }
        const users = await prisma.user.findMany({ where, orderBy: { fullName: "asc" } });
        res.json(users);
    } catch (error) {
        next({ message: "Unable to fetch users", error });
    }
};

// Admin: toggle status ACTIVE <-> HIDDEN
export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // firebaseId
        const user = await prisma.user.findUnique({ where: { firebaseId: id } });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role === 'ADMIN') {
            return res.status(400).json({ message: "Cannot lock/unlock an admin account" });
        }
        const nextStatus = user.status === "ACTIVE" ? "HIDDEN" : "ACTIVE";
        const updated = await prisma.user.update({ where: { firebaseId: id }, data: { status: nextStatus as any } });
        res.json(updated);
    } catch (error) {
        next({ message: "Unable to toggle user status", error });
    }
};

// Admin: update role (USER/ADMIN)
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // firebaseId
        const { role } = req.body as { role?: "USER" | "ADMIN" };
        if (!role || (role !== "USER" && role !== "ADMIN")) {
            return res.status(400).json({ message: "Invalid role" });
        }
        const updated = await prisma.user.update({ where: { firebaseId: id }, data: { role } });
        res.json(updated);
    } catch (error) {
        next({ message: "Unable to update user role", error });
    }
};