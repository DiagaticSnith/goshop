import { Router } from "express";
import { register, registerWithGoogle } from "../controllers/auth";
import prisma from "../config/prisma-client";
import { auth } from "../config/firebase";
const router = Router();

router.post("/session-login", async (req, res) => {
    const { idToken } = req.body;
    console.log("Received idToken:", idToken); // Thêm log này
    try {
        const decoded = await auth.verifyIdToken(idToken);
        console.log("Decoded UID:", decoded.uid); // Thêm log này
        const user = await prisma.user.findUnique({
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
    } catch (error) {
        console.log("Error in session-login:", error); // Thêm log này
        return res.status(401).json({ message: "Invalid token" });
    }
});

router.post("/register/google", registerWithGoogle);
router.post("/register", register);

export default router;