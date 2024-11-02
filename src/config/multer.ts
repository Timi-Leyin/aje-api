import multer, { FileFilterCallback, StorageEngine } from "multer";
import { IMAGES_FILESIZE_LIMIT, TEMP_DIR } from "../constants";
import path from "path";
import { Request } from "express";

const storage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fn = `${file.fieldname}-${uniqueSuffix}${path.extname(
      file.originalname
    )}`;
    cb(null, fn);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|mp4/;
  const isValidType =
    allowedTypes.test(path.extname(file.originalname).toLowerCase()) &&
    allowedTypes.test(file.mimetype);

  if (isValidType) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG files are allowed!"));
  }
};

export const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: IMAGES_FILESIZE_LIMIT },
});
