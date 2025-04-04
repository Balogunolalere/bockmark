import mongoose from 'mongoose';

export interface IBookmark {
  _id: string;
  url: string;
  title: string;
  content?: string;
  category: string;
  color?: string;
  readingTime?: number;
  progress?: number;
  isFavorite: boolean;
  userId: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const bookmarkSchema = new mongoose.Schema({
  url: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String },
  category: { type: String, required: true },
  color: { type: String, default: 'yellow-100' },
  readingTime: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  isFavorite: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

bookmarkSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Bookmark = mongoose.models.Bookmark || mongoose.model('Bookmark', bookmarkSchema);
export type BookmarkDocument = mongoose.Document & IBookmark;