import mongoose, { Schema, Document } from "mongoose";

// --- Connection Utility ---
export const ensureDb = async () => {
  mongoose.set('strictQuery', true);
  if (mongoose.connection.readyState === 1) return;
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined.");
  try {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

// --- Person ---
export interface IPerson extends Document {
  userId: string;
  id: string; // nanoid
  name: string;
  emoji: string;
  gender: 'she' | 'he' | 'they';
  personality: 'nova' | 'scholar' | 'sage' | 'spark';
  relationship: 'girlfriend' | 'bestfriend' | 'classmate' | 'crush' | 'situationship';
  language: 'english' | 'hinglish';
  createdAt: Date;
}

const personSchema = new Schema<IPerson>({
  userId: { type: String, required: true, index: true },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, maxlength: 20 },
  emoji: { type: String, required: true },
  gender: { type: String, required: true, enum: ['she', 'he', 'they'] },
  personality: { type: String, required: true, enum: ['nova', 'scholar', 'sage', 'spark'] },
  relationship: { type: String, required: true, enum: ['girlfriend', 'bestfriend', 'classmate', 'crush', 'situationship'] },
  language: { type: String, required: true, enum: ['english', 'hinglish'] },
}, { timestamps: { createdAt: true, updatedAt: false } });

personSchema.index({ userId: 1, id: 1 });

// --- Chat ---
export interface IChat extends Document {
  title: string;
  personId?: string;   // new: links chat to a Person
  personality?: string; // legacy compat
  userId: string;
  deleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>({
  title: { type: String, required: true },
  personId: { type: String, index: true },  // new field
  personality: { type: String },            // kept for legacy
  userId: { type: String, required: true, index: true },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { timestamps: true });

chatSchema.index({ userId: 1, deleted: 1 });
chatSchema.index({ userId: 1, personId: 1 }, { unique: true, sparse: true });

// --- Message ---
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

// --- User ---
export interface IUser extends Document {
  username: string;
  passwordHash: string;
  name?: string;
  gender?: 'male' | 'female';
  onboardingCompleted?: boolean;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 30 },
  passwordHash: { type: String, required: true },
  name: { type: String, trim: true },
  gender: { type: String, enum: ['male', 'female'] },
  onboardingCompleted: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

// --- Models ---
export const Person = mongoose.models.Person || mongoose.model<IPerson>("Person", personSchema);
export const Chat = mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);
export const Message = mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);
export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
