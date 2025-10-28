import mongoose from 'mongoose';

const { Schema } = mongoose;

// Booking: references an Event by ObjectId and stores a validated email.
const BookingSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: [true, 'eventId is required'] },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i.test(v);
        },
        message: (props) => `${props.value} is not a valid email`,
      },
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Index eventId for faster event-scoped queries
BookingSchema.index({ eventId: 1 });

// Pre-save: ensure referenced Event exists to avoid orphaned bookings
BookingSchema.pre('save', async function (next) {
  if (!this.eventId) return next(new Error('eventId is required'));

  try {
    const EventModel = mongoose.models.Event;
    if (!EventModel) return next(new Error('Event model is not registered'));

    const exists = await EventModel.exists({ _id: this.eventId });
    if (!exists) return next(new Error('Referenced eventId does not exist'));

    next();
  } catch (err) {
    next(err);
  }
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

export { Booking };
export default Booking;
