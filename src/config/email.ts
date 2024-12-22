import nodemailer from "nodemailer";
import { ENV } from "../constants/env";

export const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
});
