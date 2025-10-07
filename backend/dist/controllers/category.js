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
exports.getSingleCategory = exports.getAllCategories = void 0;
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
