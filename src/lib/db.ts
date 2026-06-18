import mongoose, { Schema, Document } from "mongoose";
import dns from "dns";

// Temporary fix for Node.js DNS resolution issues on Windows for SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// --- Connection Utility ---
let isConnected = false;

export const ensureDb = async () => {
  mongoose.set('strictQuery', true);

  if (isConnected) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

// --- Interfaces & Schemas ---

export interface IChat extends Document {
  title: string;
  personality: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>({
  title: { type: String, required: true },
  personality: { type: String, required: true },
}, { timestamps: true });

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
  content: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export interface ICompanion extends Document {
  name: string;
  description?: string;
  prompt: string;
  avatar?: string;
}

const companionSchema = new Schema<ICompanion>({
  name: { type: String, required: true },
  description: { type: String },
  prompt: { type: String, required: true },
  avatar: { type: String },
});

export interface IUser extends Document {
  email: string;
  name?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  name: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

// --- Models ---
// To avoid OverwriteModelError during hot reloading in Next.js
export const Chat = mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);
export const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);
export const Companion = mongoose.models.Companion || mongoose.model<ICompanion>("Companion", companionSchema);
export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
