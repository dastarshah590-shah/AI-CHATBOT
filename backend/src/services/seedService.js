import bcrypt from "bcryptjs";
import { isMongoConnected } from "../config/db.js";
import { defaultFAQs, demoUsers } from "../data/defaultData.js";
import { memoryStore } from "../data/memoryStore.js";
import { FAQ } from "../models/FAQ.js";
import { User } from "../models/User.js";

export const seedDefaultData = async () => {
  if (!isMongoConnected()) {
    await memoryStore.seed();
    return;
  }

  const faqCount = await FAQ.countDocuments();
  if (faqCount === 0) {
    await FAQ.insertMany(defaultFAQs);
  }

  for (const demoUser of demoUsers) {
    const exists = await User.exists({ email: demoUser.email });
    if (!exists) {
      await User.create({
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        language: "en",
        passwordHash: await bcrypt.hash(demoUser.password, 10)
      });
    }
  }
};
