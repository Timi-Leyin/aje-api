import { USER_TYPE } from "@prisma/client";
import { db } from "../config/database";
import { emailTransporter } from "../config/email";
import { MailOptions } from "../types/helpers";
import nodemailer from "nodemailer";

// FOR TEST ENV ONLY
export default async (mailOptions: MailOptions) => {
  emailTransporter.sendMail(
    {
      from: "noreply@aje-home-properties",
      ...mailOptions,
    },
    (error, info) => {
      if (error) {
        return console.log("[ERROR] Email not sent ❌");
      }
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  );
};
export const sendEmailToAdmin = async (mailOptions: Omit<MailOptions, "to">) => {
  const admins = await db.user.findMany({
    where: {
      type: USER_TYPE.ADMIN,
    },
    select: {
      email: true,
    },
  });

  const emails = admins.map((admin) => admin.email);

  emailTransporter.sendMail(
    {
      from: "noreply@aje-home-properties",
      ...mailOptions,
      to: emails,
    },
    (error, info) => {
      if (error) {
        return console.log("[ERROR] Email not sent ❌");
      }
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  );
};
