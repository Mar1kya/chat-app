import jwt from "jsonwebtoken";
import { users } from "../lib/schema.js";
import { db } from "../lib/db.js";
import { eq } from "drizzle-orm";

export async function protectRoute(req, res, next) {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authorized, no token" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res
        .status(401)
        .json({ message: "Not authorized, invalid token" });
    }
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));

    const existingUser = result[0];
    if (!existingUser) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password, ...userWithoutPassword } = existingUser;

    req.user = userWithoutPassword;
    next();
  } catch (error) {
    console.error("Error in protectRoute:", error.message);
    res.status(500).json({ message: "Authorization error" });
  }
}
