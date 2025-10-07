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
exports.getUserByFirebaseId = exports.deleteUser = exports.updateUser = exports.createUser = void 0;
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
        const foundUser = yield prisma_client_1.default.user.findUnique({
            where: {
                firebaseId: userId
            }
        });
        if (!foundUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (req.body.email && req.body.email !== foundUser.email) {
            const existingUser = yield prisma_client_1.default.user.findUnique({
                where: {
                    email: req.body.email
                }
            });
            if (existingUser) {
                return res.status(400).json({ message: "User with given email already exists" });
            }
        }
        const image = req.image || req.body.avatar;
        const updatedUser = yield prisma_client_1.default.user.update({
            where: {
                firebaseId: userId
            },
            data: Object.assign(Object.assign({}, req.body), { avatar: image })
        });
        yield firebase_1.auth.updateUser(userId || "", {
            email: req.body.email,
            displayName: req.body.fullName,
            photoURL: image
        });
        const token = yield firebase_1.auth.createCustomToken(userId);
        res.status(200).json({ user: updatedUser, token });
    }
    catch (error) {
        next({ message: "Unable to update the user", error });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const foundUser = yield prisma_client_1.default.user.delete({
            where: {
                firebaseId: req.params.id
            }
        });
        if (!foundUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted" });
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
