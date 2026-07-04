import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createUser, findUserByEmail } from "../services/userService.js";
import { asyncHandler, sendError, sendSuccess } from "../utils/responseFormatter.js";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["customer", "admin", "agent"]).default("customer"),
  language: z.string().default("en")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || "dev_secret_change_me",
    { expiresIn: "7d" }
  );

export const register = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const existingUser = await findUserByEmail(payload.email);

  if (existingUser) {
    sendError(res, "An account with this email already exists", 409);
    return;
  }

  const user = await createUser(payload);
  sendSuccess(
    res,
    {
      message: "User registered successfully",
      token: signToken(user),
      user
    },
    201
  );
});

export const login = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const user = await findUserByEmail(payload.email, true);

  if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
    sendError(res, "Invalid email or password", 401);
    return;
  }

  const { passwordHash, ...publicUser } = user;
  sendSuccess(res, {
    message: "Login successful",
    token: signToken(publicUser),
    user: publicUser
  });
});

export const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: req.user });
});
