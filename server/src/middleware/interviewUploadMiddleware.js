import fs from "fs";
import path from "path";
import multer from "multer";

const tempDir = path.resolve(process.cwd(), "interviews", "tmp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`)
});

export const interviewUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("audio/") && !file.mimetype.startsWith("video/")) {
      return cb(new Error("Only audio or video recordings are allowed"));
    }
    return cb(null, true);
  }
});
