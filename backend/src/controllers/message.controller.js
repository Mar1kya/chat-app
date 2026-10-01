import { ne, and, or, eq } from "drizzle-orm";
import { db } from "../lib/db.js";
import { users, messages } from "../lib/schema.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketIds, io } from "../lib/socket.js";

export async function getUsersForSidebar(req, res) {
  try {
    const loggedInUserId = req.user.id;

    const filteredUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        profilePic: users.profilePic,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(ne(users.id, loggedInUserId));

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function getMessages(req, res) {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user.id;

    const result = await db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, senderId),
            eq(messages.receiverId, userToChatId),
          ),
          and(
            eq(messages.senderId, userToChatId),
            eq(messages.receiverId, senderId),
          ),
        ),
      )
      .orderBy(messages.createdAt);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in the getMessages controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
export async function sendMessage(req, res) {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user.id;

    if (!text?.trim() && !image) {
      return res.status(400).json({ message: "The message is empty" });
    }

    let imageUrl;
    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "chat",
          resource_type: "image",
        });
        imageUrl = uploadResponse.secure_url;
      } catch (err) {
        console.error("Cloudinary:", err.message);
        return res.status(400).json({ message: "Failed to upload the image" });
      }
    }

    const [message] = await db
      .insert(messages)
      .values({ senderId, receiverId, text, image: imageUrl })
      .returning();

    const receiverSocketIds = getReceiverSocketIds(receiverId);
    if (receiverSocketIds.length > 0) {
      io.to(receiverSocketIds).emit("newMessage", message);
    }
    res.status(201).json(message);
  } catch (error) {
    console.error("Error in sendMessage controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
