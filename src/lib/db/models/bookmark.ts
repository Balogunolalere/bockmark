import mongoose from 'mongoose';

export interface IHighlight {
  text: string;
  startOffset: number;
  endOffset: number;
  color: string;
  createdAt: Date;
}

export interface IBookmark {
  _id: string;
  url: string;
  title: string;
  category: string;
  tags: string[];
  content?: string;
  isFavorite: boolean;
  progress: number;
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  highlights?: IHighlight[];
}

const highlightSchema = new mongoose.Schema<IHighlight>({
  text: { type: String, required: true },
  startOffset: { type: Number, required: true },
  endOffset: { type: Number, required: true },
  color: { type: String, default: '#ffeb3b' }, // Default yellow color
  createdAt: { type: Date, default: Date.now }
});

const bookmarkSchema = new mongoose.Schema<IBookmark>({
  url: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  content: String,
  isFavorite: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  color: String,
  userId: { type: String, required: true },
  highlights: [highlightSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

bookmarkSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Bookmark = mongoose.models.Bookmark || mongoose.model<IBookmark>('Bookmark', bookmarkSchema);
export type BookmarkDocument = mongoose.Document & IBookmark;