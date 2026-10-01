import { users } from "../lib/schema.js";
import { db } from "../lib/db.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/util.js";
import cloudinary from "../lib/cloudinary.js";

export async function signup(req, res) {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "The password must be longer than 6 characters" });
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "The email address already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertedUsers = await db
      .insert(users)
      .values({
        fullName,
        email,
        password: hashedPassword,
      })
      .returning();

    const newUser = insertedUsers[0];

    generateToken(newUser.id, res);

    res.status(201).json({
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    console.error("Error in the registration controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  try {
    const user = await db.select().from(users).where(eq(users.email, email));

    const existingUser = user[0];

    if (!existingUser) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    generateToken(existingUser.id, res);

    res.status(200).json({
      id: existingUser.id,
      fullName: existingUser.fullName,
      email: existingUser.email,
      profilePic: existingUser.profilePic,
    });
  } catch (error) {
    console.error("Error in the login controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "The exit was successful" });
  } catch (error) {
    console.error("Error in the output controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const { profilePic } = req.body;
    const userId = req.user.id;

    if (!profilePic) {
      return res
        .status(400)
        .json({ message: "A profile picture is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const result = await db
      .update(users)
      .set({
        profilePic: uploadResponse.secure_url,
      })
      .where(eq(users.id, userId))
      .returning();

    const updatedUser = result[0];

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function checkAuth(req, res) {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error("Error during authentication check:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
