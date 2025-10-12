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
exports.processImageUpload = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const processImageUpload = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // multer.fields puts files in req.files as an object of arrays
        const files = req.files;
        let file;
        if (files) {
            if (files['image'] && files['image'].length > 0) {
                file = files['image'][0];
            }
            else if (files['avatar'] && files['avatar'].length > 0) {
                file = files['avatar'][0];
            }
        }
        else if (req.file) {
            file = req.file;
        }
        if (file) {
            // eslint-disable-next-line no-console
            console.info('[processImageUpload] uploading file', file.originalname, file.path, file.mimetype, file.size);
            try {
                const imageUpload = yield cloudinary_1.v2.uploader.upload(file.path);
                req.image = imageUpload.secure_url;
            }
            catch (err) {
                // If Cloudinary isn't configured or upload fails, attempt to save the file locally
                // so products still get an image URL. This is a fallback for local development.
                console.warn('[processImageUpload] cloudinary upload failed, falling back to local upload:', (err === null || err === void 0 ? void 0 : err.message) || err);
                try {
                    const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
                    yield fs_1.default.promises.mkdir(uploadsDir, { recursive: true });
                    const destFilename = `${Date.now()}-${file.originalname}`.replace(/\s+/g, '_');
                    const dest = path_1.default.join(uploadsDir, destFilename);
                    // Use copy + unlink to avoid cross-device EXDEV errors
                    yield fs_1.default.promises.copyFile(file.path, dest);
                    try {
                        yield fs_1.default.promises.unlink(file.path);
                    }
                    catch (unlinkErr) {
                        // non-fatal
                        console.warn('[processImageUpload] failed to unlink temp file', unlinkErr);
                    }
                    // Serve via /uploads route
                    req.image = `/uploads/${destFilename}`;
                    console.info('[processImageUpload] saved fallback image to', dest);
                }
                catch (fsErr) {
                    console.error('[processImageUpload] local fallback failed', fsErr);
                }
            }
        }
        next();
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('[processImageUpload] error uploading image', error);
        res.status(500).json({ message: "Unable to upload image", error: (error === null || error === void 0 ? void 0 : error.message) || error });
    }
});
exports.processImageUpload = processImageUpload;
