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

// LOGIN
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

export default authRoutes;
