import { Response, NextFunction, Request } from "express";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

export const processImageUpload = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // multer.fields puts files in req.files as an object of arrays
        const files = (req as any).files as Record<string, Express.Multer.File[]> | undefined;
        let file: Express.Multer.File | undefined;
        if (files) {
            if (files['image'] && files['image'].length > 0) {
                file = files['image'][0];
            } else if (files['avatar'] && files['avatar'].length > 0) {
                file = files['avatar'][0];
            }
        } else if ((req as any).file) {
            file = (req as any).file;
        }

        if (file) {
            // eslint-disable-next-line no-console
            console.info('[processImageUpload] uploading file', file.originalname, file.path, file.mimetype, file.size);
            try {
                const imageUpload = await cloudinary.uploader.upload(file.path);
                req.image = imageUpload.secure_url;
            } catch (err: any) {
                // If Cloudinary isn't configured or upload fails, attempt to save the file locally
                // so products still get an image URL. This is a fallback for local development.
                console.warn('[processImageUpload] cloudinary upload failed, falling back to local upload:', err?.message || err);
                try {
                    const uploadsDir = path.join(process.cwd(), 'uploads');
                    await fs.promises.mkdir(uploadsDir, { recursive: true });
                    const destFilename = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '_');
                    const dest = path.join(uploadsDir, destFilename);
                    // Use copy + unlink to avoid cross-device EXDEV errors
                    await fs.promises.copyFile(file.path, dest);
                    try {
                        await fs.promises.unlink(file.path);
                    } catch (unlinkErr) {
                        // non-fatal
                        console.warn('[processImageUpload] failed to unlink temp file', unlinkErr);
                    }
                    // Serve via /uploads route
                    req.image = `/uploads/${destFilename}`;
                    console.info('[processImageUpload] saved fallback image to', dest);
                } catch (fsErr) {
                    console.error('[processImageUpload] local fallback failed', fsErr);
                }
            }
        }
        next();
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[processImageUpload] error uploading image', error);
        res.status(500).json({ message: "Unable to upload image", error: (error as any)?.message || error });
    }
};
