import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const signUpValidator = zValidator(
  "json",
  z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      phone: z.string().optional(),
      email: z.string(),
      userType: z.enum(["buyer", "agent", "vendor", "artisan"]),
      auth_provider: z.enum(["google", "apple"]).optional(),
      password: z.string().optional(),
    })
    .refine(
      (data) => {
        // If not using OAuth, password is required
        if (!data.auth_provider) return !!data.password;
        // If using OAuth, password must not be required
        if (["google", "apple"].includes(data.auth_provider)) return true;
        return !!data.password;
      },
      {
        message: "Password is required unless signing up with Google or Apple",
        path: ["password"],
      }
    )
    .refine(
      (data) => {
        // Phone is required for all user types except buyer
        if (data.userType !== "buyer") {
          return !!data.phone;
        }
        return true; // Phone is optional for buyers
      },
      {
        message: "Phone number is required for agents, vendors, and artisans",
        path: ["phone"],
      }
    )
);

export const loginValidator = zValidator(
  "json",
  z.object({
    email: z.string(),
    password: z.string(),
  })
);

export const forgotPasswordValidator = zValidator(
  "json",
  z.object({
    email: z.string().email("Invalid email address"),
  })
);

export const resetPasswordValidator = zValidator(
  "json",
  z.object({
    token: z.string(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
);
