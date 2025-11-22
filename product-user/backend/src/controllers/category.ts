import { Request, Response } from "express";
import prisma from "../config/prisma-client";

export const getAllCategories = async (req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
        orderBy: {
            createdAt: "desc"
        }
    });
    
    if (!categories) {
        return res.status(404).json({ message: "Categories not found" });
    }
    res.status(200).json(categories);
};

export const getSingleCategory = async (req: Request, res: Response) => {
    const category = await prisma.category.findUnique({
        where: {
            id: Number(req.params.id)
        }
    });
    
    if (!category) {
        return res.status(404).json({ message: "Category with given ID not found" });
    }
    res.status(200).json(category);
};

export const createCategory = async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Invalid category name' });
    }
    try {
        const created = await prisma.category.create({
            data: { name }
        });
        res.status(201).json(created);
    } catch (err: any) {
        // handle unique constraint or other DB errors
        console.error('createCategory error', err?.message || err);
        res.status(500).json({ message: 'Unable to create category', error: err?.message || err });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: 'Invalid category name' });
    }
    try {
        const updated = await prisma.category.update({
            where: { id: Number(id) },
            data: { name }
        });
        res.status(200).json(updated);
    } catch (err: any) {
        console.error('updateCategory error', err?.message || err);
        res.status(500).json({ message: 'Unable to update category', error: err?.message || err });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const deleted = await prisma.category.delete({ where: { id: Number(id) } });
        res.status(200).json(deleted);
    } catch (err: any) {
        console.error('deleteCategory error', err?.message || err);
        res.status(500).json({ message: 'Unable to delete category', error: err?.message || err });
    }
};
