import mongoose, { Schema, Document } from "mongoose";

// --- Connection Utility ---
// Use mongoose.connection.readyState instead of a module-level flag so we
// correctly handle dropped connections and hot-reload in Next.js dev mode.
export const ensureDb = async () => {
  mongoose.set('strictQuery', true);

  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not defined. Create a .env.local file with MONGODB_URI=<your Atlas connection string>."
    );
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
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
  companionName?: string;
  companionPhoto?: string;
  relationshipType?: string;
  language?: string;
  deleted?: boolean;
  deletedAt?: Date;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>({
  title: { type: String, required: true },
  personality: { type: String, required: true },
  companionName: { type: String },
  companionPhoto: { type: String },
  relationshipType: { type: String },
  language: { type: String },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  userId: { type: String, required: true, index: true },
}, { timestamps: true });

chatSchema.index({ userId: 1, deleted: 1 });

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
  content: { type: String, required: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

messageSchema.index({ chatId: 1, createdAt: 1 });

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
  username: string;
  passwordHash: string;
  email?: string;
  name?: string;
  gender?: 'male' | 'female';
  onboardingCompleted?: boolean;
  // Companion settings — persisted so they restore on any device
  companionName?: string;
  companionPhoto?: string;
  personality?: string;
  language?: string;
  relationship?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 30 },
  passwordHash: { type: String, required: true },
  // sparse: true allows multiple docs with no email (null/undefined) while still enforcing uniqueness among those that do have one
  email: { type: String, sparse: true, unique: true, lowercase: true, trim: true },
  name: { type: String, trim: true },
  gender: { type: String, enum: ['male', 'female'] },
  onboardingCompleted: { type: Boolean, default: false },
  // Companion settings
  companionName: { type: String, trim: true },
  companionPhoto: { type: String },
  personality: { type: String, default: 'nova' },
  language: { type: String, default: 'english' },
  relationship: { type: String, default: 'girlfriend' },
}, { timestamps: { createdAt: true, updatedAt: false } });

// --- Models ---
// Guard against OverwriteModelError during Next.js hot reload
export const Chat = mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);
export const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);
export const Companion = mongoose.models.Companion || mongoose.model<ICompanion>("Companion", companionSchema);
export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
