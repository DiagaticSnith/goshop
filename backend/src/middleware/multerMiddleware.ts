import multer, { diskStorage } from "multer";
import os from "os";
import path from "path";

const storage = diskStorage({
	destination: (req, file, cb) => {
		cb(null, os.tmpdir());
	},
	filename: (req, file, cb) => {
		const filename = `${Date.now()}-${file.originalname}`.replace(/\s+/g, "_");
		cb(null, filename);
	}
});

export const multerUpload = multer({ storage });