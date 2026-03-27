import axios from "axios";
import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

export const sendEmail = async ({ to, subject, body }: SendEmailParams) => {
  await axios.post(
    "https://next-api.useplunk.com/v1/send",
    {
      to,
      subject,
      from: "noreply@illumiacityempire.com",
      body,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PLUNK_API_KEY}`,
      },
    }
  );
};
