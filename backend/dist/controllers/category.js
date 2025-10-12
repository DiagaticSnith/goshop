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
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getSingleCategory = exports.getAllCategories = void 0;
const prisma_client_1 = __importDefault(require("../config/prisma-client"));
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const categories = yield prisma_client_1.default.category.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });
    if (!categories) {
        return res.status(404).json({ message: "Categories not found" });
    }
    res.status(200).json(categories);
});
exports.getAllCategories = getAllCategories;
const getSingleCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const category = yield prisma_client_1.default.category.findUnique({
        where: {
            id: Number(req.params.id)
        }
    });
    if (!category) {
        return res.status(404).json({ message: "Category with given ID not found" });
    }
    res.status(200).json(category);
});
exports.getSingleCategory = getSingleCategory;
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Invalid category name' });
    }
    try {
        const created = yield prisma_client_1.default.category.create({
            data: { name }
        });
        res.status(201).json(created);
    }
    catch (err) {
        // handle unique constraint or other DB errors
        console.error('createCategory error', (err === null || err === void 0 ? void 0 : err.message) || err);
        res.status(500).json({ message: 'Unable to create category', error: (err === null || err === void 0 ? void 0 : err.message) || err });
    }
});
exports.createCategory = createCategory;
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Invalid category name' });
    }
    try {
        const updated = yield prisma_client_1.default.category.update({
            where: { id: Number(id) },
            data: { name }
        });
        res.status(200).json(updated);
    }
    catch (err) {
        console.error('updateCategory error', (err === null || err === void 0 ? void 0 : err.message) || err);
        res.status(500).json({ message: 'Unable to update category', error: (err === null || err === void 0 ? void 0 : err.message) || err });
    }
});
exports.updateCategory = updateCategory;
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deleted = yield prisma_client_1.default.category.delete({ where: { id: Number(id) } });
        res.status(200).json(deleted);
    }
    catch (err) {
        console.error('deleteCategory error', (err === null || err === void 0 ? void 0 : err.message) || err);
        res.status(500).json({ message: 'Unable to delete category', error: (err === null || err === void 0 ? void 0 : err.message) || err });
    }
});
exports.deleteCategory = deleteCategory;
