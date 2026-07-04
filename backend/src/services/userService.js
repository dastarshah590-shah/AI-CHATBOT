import bcrypt from "bcryptjs";
import { isMongoConnected } from "../config/db.js";
import { memoryStore } from "../data/memoryStore.js";
import { User } from "../models/User.js";
import { normalizeDoc } from "../utils/responseFormatter.js";

export const findUserByEmail = async (email, includePassword = false) => {
  const normalizedEmail = email.toLowerCase();

  if (isMongoConnected()) {
    const query = User.findOne({ email: normalizedEmail });
    if (includePassword) {
      query.select("+passwordHash");
    }
    const user = await query;
    return user ? normalizeDoc(user) : null;
  }

  const user = memoryStore.users.findByEmail(normalizedEmail);
  if (!user) {
    return null;
  }

  if (includePassword) {
    return user;
  }

  return memoryStore.users.publicUser(user);
};

export const createUser = async ({ name, email, password, role = "customer", phone, language = "en" }) => {
  const passwordHash = await bcrypt.hash(password, 10);
  const normalizedEmail = email.toLowerCase();

  if (isMongoConnected()) {
    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      role,
      language,
      passwordHash
    });
    return normalizeDoc(user);
  }

  return memoryStore.users.create({
    name,
    email: normalizedEmail,
    phone,
    role,
    language,
    passwordHash
  });
};
