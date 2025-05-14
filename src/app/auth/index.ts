import { Hono } from "hono";
import { loginValidator, signUpValidator } from "./validators";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import {
  comaprePassword,
  generateJWT,
  hashPassword,
} from "../../helpers/secrets";
import { nanoid } from "nanoid";

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
    return c.json({ message: "Incorrect password or username" }, 404);
  }

  if (!user.password && user.auth_provider != "default") {
    return c.json({ message: `Login with ${user.auth_provider}` }, 400);
  }

  const isValid = await comaprePassword(password, user.password!);

  if (!isValid) {
    return c.json({ message: `Incorrect password or username` }, 400);
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
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

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
      return c.redirect(`${process.env.EXPO_APP_SCHEME}/auth/login?token=${token}`);
    }

    // If user doesn't exist, redirect to signup with Google data
    const params = new URLSearchParams({
      email: googleUser.email,
      firstName: googleUser.given_name,
      lastName: googleUser.family_name,
      picture: googleUser.picture,
      auth_provider: "google"
    });

    return c.redirect(`${process.env.EXPO_APP_SCHEME}/auth/signup?${params.toString()}`);

  } catch (error) {
    console.error("Google auth error:", error);
    return c.json({ message: "Authentication failed" }, 500);
  }
});

export default authRoutes;
