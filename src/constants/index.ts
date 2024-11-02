import path from "path";

export const CWD = process.cwd();
export const DATA_LIMIT = 10;

export const TEMP_DIR = path.join(CWD, "temp");

export const IMAGES_FILESIZE_LIMIT = 5 * 1024 * 1024; // 5mb

export const FRONTEND_SUCCESS_REDIRECT = "/api/auth/google/callback/success";
export const FRONTEND_FAILURE_REDIRECT = "/api/auth/google/callback/failure";


export const UPLOAD_LOCAL = true