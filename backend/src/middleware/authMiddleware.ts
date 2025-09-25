import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma-client";
import { auth } from "../config/firebase";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization is required" });
    }
    const accessToken = authHeader.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json({ message: "Authorization is required" });
    }

    try {
        const decodedToken = await auth.verifyIdToken(accessToken);
        req.uid = decodedToken.uid;
        // Truy vấn user từ MySQL bằng uid
        const user = await prisma.user.findUnique({
            where: { firebaseId: decodedToken.uid }
        });
        if (!user || !user.role) {
            return res.status(401).json({ message: "Unauthorized: No user or role found" });
        }
        req.role = user.role;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized"});
    }
};