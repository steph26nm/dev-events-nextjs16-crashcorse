import mongoose from 'mongoose';

const { Schema } = mongoose;

// Create a URL-friendly slug from a title. Keeps alphanumerics, replaces
// whitespace with dashes and collapses multiple dashes.
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Normalize time to HH:MM (24-hour). Accepts "9:00 AM", "09:00", "14:30", etc.
function normalizeTime(value) {
  if (!value || typeof value !== 'string') return value;
  const v = value.trim();

  const hhmm = v.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmm) {
    const h = Number(hhmm[1]);
    const m = Number(hhmm[2]);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  const ampm = v.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (ampm) {
    let h = Number(ampm[1]);
    const m = Number(ampm[2] || 0);
    const isPm = /pm/i.test(ampm[3]);
    if (h === 12) h = isPm ? 12 : 0;
    else if (isPm) h += 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const parsed = Date.parse(v);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  return v;
}

const EventSchema = new Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    overview: { type: String, required: [true, 'Overview is required'], trim: true },
    image: { type: String, required: [true, 'Image is required'], trim: true },
    venue: { type: String, required: [true, 'Venue is required'], trim: true },
    location: { type: String, required: [true, 'Location is required'], trim: true },
    date: { type: String, required: [true, 'Date is required'], trim: true },
    time: { type: String, required: [true, 'Time is required'], trim: true },
    mode: { type: String, required: [true, 'Mode is required'], trim: true },
    audience: { type: String, required: [true, 'Audience is required'], trim: true },
    agenda: { type: [String], required: [true, 'Agenda is required'], default: [] },
    organizer: { type: String, required: [true, 'Organizer is required'], trim: true },
    tags: { type: [String], required: [true, 'Tags are required'], default: [] },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Pre-save: generate slug when title changes, normalize date/time, and
// validate required values and non-empty arrays.
EventSchema.pre('save', function (next) {
  // Generate slug only when title changed or slug missing
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title || '');
  }

  // Normalize date to YYYY-MM-DD when possible
  if (this.isModified('date') && this.date) {
    try {
      const parsed = new Date(this.date);
      if (!Number.isNaN(parsed.getTime())) {
        this.date = parsed.toISOString().split('T')[0];
      }
    } catch (err) {
      // leave as-is; validation will catch empties
    }
  }

  // Normalize time into HH:MM
  if (this.isModified('time') && this.time) {
    this.time = normalizeTime(this.time);
  }

  const requiredStringFields = [
    'title',
    'description',
    'overview',
    'image',
    'venue',
    'location',
    'date',
    'time',
    'mode',
    'audience',
    'organizer',
  ];

  for (const f of requiredStringFields) {
    if (!this[f] || String(this[f]).trim() === '') {
      return next(new Error(`${f} is required and cannot be empty`));
    }
  }

  if (!Array.isArray(this.agenda) || this.agenda.length === 0) {
    return next(new Error('agenda must be a non-empty array of strings'));
  }
  if (!Array.isArray(this.tags) || this.tags.length === 0) {
    return next(new Error('tags must be a non-empty array of strings'));
  }

  next();
});

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

export { Event };
export default Event;
