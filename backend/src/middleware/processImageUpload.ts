import { Response, NextFunction, Request } from "express";
import { v2 as cloudinary } from "cloudinary";

export const processImageUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req?.file) {
            // Support both disk storage (req.file.path) and memory storage (req.file.buffer)
            if ((req.file as any).path) {
                const imageUpload = await cloudinary.uploader.upload((req.file as any).path);
                req.image = imageUpload.secure_url;
            } else if ((req.file as any).buffer) {
                // Convert buffer to data URI and upload
                const file: any = req.file;
                const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
                const imageUpload = await cloudinary.uploader.upload(dataUri);
                req.image = imageUpload.secure_url;
            }
        }
        next();
    } catch (error) {
        console.error("processImageUpload error:", error);
        res.status(500).json({ message: "Unable to upload image" });
    }
};
