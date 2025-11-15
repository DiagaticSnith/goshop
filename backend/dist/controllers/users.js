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
exports.updateUserRole = exports.toggleUserStatus = exports.listUsers = exports.getUserByFirebaseId = exports.deleteUser = exports.updateUser = exports.createUser = void 0;
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
const firebase_1 = require("../config/firebase");
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        const existingUser = yield prisma_client_1.default.user.findUnique({
            where: {
                email: email
            }
        });
        if (existingUser) {
            return res.status(400).json({ message: "User with given email already exists" });
        }
        const newUser = yield prisma_client_1.default.user.create({
            data: req.body
        });
        res.status(201).json(newUser);
    }
    catch (error) {
        next({ message: "Unable to create the user", error });
    }
});
exports.createUser = createUser;
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        // security: only owner or ADMIN can update
        const requesterId = req.uid;
        const requesterRole = req.role;
        if (requesterId !== userId && requesterRole !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const foundUser = yield prisma_client_1.default.user.findUnique({
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
        const updateData = {
            fullName: newFullName,
            avatar: image || foundUser.avatar
        };
        if (typeof req.body.address === 'string') {
            updateData.address = req.body.address;
        }
        if (typeof req.body.phone == 'string') {
            updateData.phone = req.body.phone;
        }
        const updatedUser = yield prisma_client_1.default.user.update({
            where: { firebaseId: userId },
            data: updateData
        });
        // Update Firebase displayName/photo only (do not modify email here)
        try {
            console.log('[users] updating firebase auth profile for', userId);
            yield firebase_1.auth.updateUser(userId || "", {
                displayName: newFullName,
                photoURL: image || undefined
            });
        }
        catch (fbErr) {
            console.error('[users] firebase updateUser failed:', fbErr);
            // continue — we still return updatedUser, but surface error in non-prod
            const fbErrAny = fbErr;
            if (process.env.NODE_ENV !== 'production') {
                return res.status(500).json({ message: 'Firebase update failed', error: (fbErrAny === null || fbErrAny === void 0 ? void 0 : fbErrAny.message) || fbErrAny });
            }
        }
        const token = yield firebase_1.auth.createCustomToken(userId);
        res.status(200).json({ user: updatedUser, token });
    }
    catch (error) {
        console.error('[users] updateUser error:', error);
        // If DEBUG_ERRORS=true in env, return the error details in the response for debugging.
        if (process.env.DEBUG_ERRORS === 'true') {
            return res.status(500).json({ message: "Unable to update the user", error: (error === null || error === void 0 ? void 0 : error.message) || error });
        }
        if (process.env.NODE_ENV !== 'production') {
            return res.status(500).json({ message: "Unable to update the user", error: (error === null || error === void 0 ? void 0 : error.message) || error });
        }
        next({ message: "Unable to update the user", error });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Soft delete: set status to HIDDEN instead of removing (keep FKs intact)
        const updated = yield prisma_client_1.default.user.update({
            where: { firebaseId: req.params.id },
            data: { status: "HIDDEN" }
        });
        if (!updated) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User hidden" });
    }
    catch (error) {
        next({ message: "Unable to delete the user", error });
    }
});
exports.deleteUser = deleteUser;
const getUserByFirebaseId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const foundUser = yield prisma_client_1.default.user.findUnique({
        where: {
            firebaseId: req.params.id
        }
    });
    if (!foundUser) {
        return res.status(404).json("User not found");
    }
    res.status(200).json(foundUser);
});
exports.getUserByFirebaseId = getUserByFirebaseId;
// Admin: list users with filters (includeHidden=true to include HIDDEN)
const listUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { q, includeHidden } = req.query;
        const where = {};
        if (q) {
            where.OR = [
                { email: { contains: q, mode: "insensitive" } },
                { fullName: { contains: q, mode: "insensitive" } }
            ];
        }
        if (!includeHidden) {
            where.status = "ACTIVE";
        }
        const users = yield prisma_client_1.default.user.findMany({ where, orderBy: { fullName: "asc" } });
        res.json(users);
    }
    catch (error) {
        next({ message: "Unable to fetch users", error });
    }
});
exports.listUsers = listUsers;
// Admin: toggle status ACTIVE <-> HIDDEN
const toggleUserStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // firebaseId
        const user = yield prisma_client_1.default.user.findUnique({ where: { firebaseId: id } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        if (user.role === 'ADMIN') {
            return res.status(400).json({ message: "Cannot lock/unlock an admin account" });
        }
        const nextStatus = user.status === "ACTIVE" ? "HIDDEN" : "ACTIVE";
        const updated = yield prisma_client_1.default.user.update({ where: { firebaseId: id }, data: { status: nextStatus } });
        res.json(updated);
    }
    catch (error) {
        next({ message: "Unable to toggle user status", error });
    }
});
exports.toggleUserStatus = toggleUserStatus;
// Admin: update role (USER/ADMIN)
const updateUserRole = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // firebaseId
        const { role } = req.body;
        if (!role || (role !== "USER" && role !== "ADMIN")) {
            return res.status(400).json({ message: "Invalid role" });
        }
        const updated = yield prisma_client_1.default.user.update({ where: { firebaseId: id }, data: { role } });
        res.json(updated);
    }
    catch (error) {
        next({ message: "Unable to update user role", error });
    }
});
exports.updateUserRole = updateUserRole;
