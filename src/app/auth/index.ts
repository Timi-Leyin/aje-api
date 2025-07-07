import { Hono } from "hono";
import {
  loginValidator,
  signUpValidator,
  forgotPasswordValidator,
} from "./validators";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import {
  comaprePassword,
  generateJWT,
  hashPassword,
  verify,
} from "../../helpers/secrets";
import { nanoid } from "nanoid";
import { html } from "hono/html";
import { sendEmail } from "../../helpers/email";
import { sendNotification } from "../../helpers/notification";
import { getConnInfo } from "@hono/node-server/conninfo";
import { decode, sign } from "hono/jwt";
import jwt from "jsonwebtoken";

const authRoutes = new Hono();

// Regular signup
authRoutes.post("/signup", signUpValidator, async (c) => {
  const { email, firstName, lastName, password, phone, userType } =
    c.req.valid("json");

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (user) {
    return c.json({ message: "User with email already exists" }, 400);
  }

  const id = nanoid();
  const hashed = await hashPassword(password);
  await db.insert(users).values({
    id,
    email,
    first_name: firstName,
    last_name: lastName,
    phone,
    user_type: userType,
    password: hashed,
  });

  const token = await generateJWT({
    id,
  });
  return c.json({ message: `${userType} registered successfully`, token });
});

// Regular login
authRoutes.post("/login", loginValidator, async (c) => {
  const { email, password } = c.req.valid("json");
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return c.json({ message: "Incorrect password or email" }, 404);
  }

  if (!user.password && user.auth_provider != "default") {
    return c.json({ message: `Login with ${user.auth_provider}` }, 400);
  }

  const isValid = await comaprePassword(password, user.password!);

  if (!isValid) {
    return c.json({ message: `Incorrect password or email` }, 400);
  }

  const token = await generateJWT({
    id: user.id,
  });
  return c.json({ message: `${user.user_type} logged in successfully`, token });
});

// Google OAuth routes
authRoutes.get("/google/login", async (c) => {
  const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.BACKEND_URL}/auth/google/callback`,
    response_type: "code",
    scope: "email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return c.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

authRoutes.get("/google/callback", async (c) => {
  try {
    const code = c.req.query("code");

    if (!code) {
      return c.json({ message: "Authorization code required" }, 400);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.BACKEND_URL}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    // Get user profile
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const googleUser = await userResponse.json();

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, googleUser.email),
    });

    if (existingUser) {
      // If user exists but not using Google auth
      // if (existingUser.auth_provider !== "google") {
      //   return c.json({
      //     message: `Please login with ${existingUser.auth_provider}`
      //   }, 400);
      // }

      // Update last login
      await db
        .update(users)
        .set({
          last_login: new Date(),
        })
        .where(eq(users.id, existingUser.id));

      const token = await generateJWT({
        id: existingUser.id,
      });

      // Redirect to frontend with token
      const REDIRECT = `${process.env.EXPO_APP_SCHEME}auth/login?token=${token}`;
      // console.log("> REDIRECT", REDIRECT)
      return c.redirect(REDIRECT);
    }

    // If user doesn't exist, redirect to signup with Google data
    const params = new URLSearchParams({
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      picture: googleUser.picture,
      auth_provider: "google",
    });

    const REDIRECT = `${
      process.env.EXPO_APP_SCHEME
    }auth/sign-up?${params.toString()}`;
    // console.log("> REDIRECT", REDIRECT)
    return c.redirect(REDIRECT);
  } catch (error) {
    console.error("Google auth error:", error);
    return c.json({ message: "Authentication failed" }, 500);
  }
});

// Apple OAuth routes
authRoutes.get("/apple/login", async (c) => {
  const APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize";
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: `${process.env.BACKEND_URL}/auth/apple/callback`,
    response_type: "code",
    scope: "email name",
    response_mode: "form_post",
  });
  return c.redirect(`${APPLE_AUTH_URL}?${params.toString()}`);
});

authRoutes.post("/apple/callback", async (c) => {
  try {
    const body = await c.req.parseBody();
    const code = body.code as string;
    const userInfo = body.user ? JSON.parse(body.user as string) : null;
    if (!code) {
      return c.json({ message: "Authorization code required" }, 400);
    }

    // Generate Apple client secret (JWT) using jsonwebtoken for ES256 with kid support
    function generateAppleClientSecret() {
      return jwt.sign(
        {
          iss: process.env.APPLE_TEAM_ID,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
          aud: "https://appleid.apple.com",
          sub: process.env.APPLE_CLIENT_ID,
        },
        process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        {
          algorithm: "ES256",
          keyid: process.env.APPLE_KEY_ID,
        }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.APPLE_CLIENT_ID!,
        client_secret: generateAppleClientSecret(),
        redirect_uri: `${process.env.BACKEND_URL}/auth/apple/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenResponse.json();
    if (!tokens.id_token) {
      return c.json({ message: "Failed to get Apple ID token" }, 400);
    }
    // Decode id_token to get user info using hono/jwt
    const appleUser: any = decode(tokens.id_token)?.payload;
    if (!appleUser || !appleUser.email) {
      return c.json({ message: "Failed to get Apple user info" }, 400);
    }
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, appleUser.email),
    });
    if (existingUser) {
      await db
        .update(users)
        .set({ last_login: new Date() })
        .where(eq(users.id, existingUser.id));
      const token = await generateJWT({ id: existingUser.id });
      const REDIRECT = `${process.env.EXPO_APP_SCHEME}auth/login?token=${token}`;
      return c.redirect(REDIRECT);
    }
    // If user doesn't exist, redirect to signup with Apple data
    const firstName = userInfo?.name?.firstName || "";
    const lastName = userInfo?.name?.lastName || "";
    
    const params = new URLSearchParams({
      email: appleUser.email,
      firstName: firstName || "Apple",
      lastName: lastName || "User",
      auth_provider: "apple",
    });
    const REDIRECT = `${
      process.env.EXPO_APP_SCHEME
    }auth/sign-up?${params.toString()}`;
    return c.redirect(REDIRECT);
  } catch (error) {
    console.error("Apple auth error:", error);
    return c.json({ message: "Authentication failed" }, 500);
  }
});

// Forgot Password - Only receives email and sends reset link
authRoutes.post("/forgot-password", forgotPasswordValidator, async (c) => {
  try {
    const { email } = c.req.valid("json");
    const info = getConnInfo(c);
    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      console.log("> User not found");
      // Don't reveal if email exists or not
      return c.json({
        message:
          "If your email is registered, you will receive a password reset link",
      });
    }

    // Generate reset token (using JWT with 1 hour expiry)
    const resetToken = await generateJWT({
      id: user.id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    });

    await sendNotification(user.id, {
      title: "Notice: Password Reset",
      type: "security",
      message: `A password reset request has been made for your account from this IP ${
        info.remote.address
      } on ${new Date().toLocaleString()}. If this was not you, please ignore this message.`,
    }).catch((error) => console.log("Failed to send notification"));

    // Send reset email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      body: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${process.env.BACKEND_URL}/auth/reset-password?token=${resetToken}">Reset Password</a>
      `,
    });

    return c.json({
      message:
        "If your email is registered, you will receive a password reset link",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return c.json({ message: "Failed to process password reset request" }, 500);
  }
});

// Reset Password Page - Shows the form
authRoutes.get("/reset-password", async (c) => {
  const token = c.req.query("token");

  if (!token) {
    return c.html(html`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invalid Reset Link</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                "Helvetica Neue", Arial, sans-serif;
              max-width: 500px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            .error {
              color: #dc3545;
              padding: 20px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>⚠️ Invalid Reset Link</h1>
            <p>The password reset link is invalid or has expired.</p>
          </div>
        </body>
      </html>
    `);
  }

  return c.html(html`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Reset Password</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
              "Helvetica Neue", Arial, sans-serif;
            max-width: 500px;
            margin: 50px auto;
            padding: 20px;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
          }
          input {
            display: block;
            width: 100%;
            padding: 0.375rem 0.75rem;
            font-size: 1rem;
            line-height: 1.5;
            border: 1px solid #ced4da;
            border-radius: 0.25rem;
            margin-bottom: 1rem;
          }
          button {
            color: #fff;
            background-color: #007b5d;
            border: none;
            padding: 0.5rem 1rem;
            font-size: 1rem;
            border-radius: 0.25rem;
            cursor: pointer;
            width: 100%;
          }
          button:hover {
            background-color: rgb(3, 151, 114);
          }
          .error {
            color: #dc3545;
            padding: 0.5rem;
            display: none;
          }
        </style>
      </head>
      <body>
        <h1>Reset Your Password</h1>
        <form id="resetForm" onsubmit="handleSubmit(event)">
          <input type="hidden" name="token" value="${token}" />
          <div class="form-group">
            <label for="password">New Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minlength="6"
            />
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
            />
          </div>
          <div id="error" class="error"></div>
          <button type="submit">Reset Password</button>
        </form>

        <script>
          async function handleSubmit(e) {
            e.preventDefault();
            const form = e.target;
            const error = document.getElementById("error");
            const password = form.password.value;
            const confirmPassword = form.confirmPassword.value;

            error.style.display = "none";

            if (password !== confirmPassword) {
              error.textContent = "Passwords do not match";
              error.style.display = "block";
              return;
            }

            try {
              const response = await fetch("/auth/reset-password", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  token: form.token.value,
                  password,
                  confirmPassword,
                }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.message || "Failed to reset password");
              }

              // Show success message
              document.body.innerHTML = \`
                <div style="text-align: center;">
                  <h1>✅ Password Reset Successful</h1>
                  <p>Your password has been successfully reset. You can now login with your new password.</p>
                </div>
              \`;
            } catch (err) {
              error.textContent = err.message;
              error.style.display = "block";
            }
          }
        </script>
      </body>
    </html>
  `);
});

// Reset Password API - Handles the form submission
authRoutes.post("/reset-password", async (c) => {
  try {
    const { token, password } = await c.req.json();

    if (!token || !password || password.length < 6) {
      return c.json({ message: "Invalid password" }, 400);
    }

    try {
      const payload = (await verify(token, process.env.JWT_SECRET)) as {
        id: string;
      };

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.id),
      });

      if (!user) {
        return c.json({ message: "User not found" }, 404);
      }

      // Update password
      const hashedPassword = await hashPassword(password);
      await db
        .update(users)
        .set({
          password: hashedPassword,
        })
        .where(eq(users.id, user.id));

      await sendNotification(user.id, {
        title: "Password Reset",
        type: "security",
        message: "Your password has been reset successfully.",
      }).catch((error) => console.log("Failed to send notification"));

      return c.json({ message: "Password reset successful" });
    } catch (error) {
      return c.json({ message: "Invalid or expired reset token" }, 400);
    }
  } catch (error) {
    console.error("Password reset error:", error);
    return c.json({ message: "Failed to reset password" }, 500);
  }
});

export default authRoutes;
