// app/lib/models/Trip.ts
import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  time: String,
  name: String,
  type: {
    type: String,
    enum: ['dining', 'sightseeing', 'activity', 'transport', 'accommodation', 'leisure', 'shopping', 'cultural', 'wellness'],
  },
  description: String,
  location: String,
  cost: Number,
  duration: String,
  image: String,
  bookingInfo: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['planned', 'booked', 'completed', 'cancelled'],
    default: 'planned',
  },
});

const DaySchema = new mongoose.Schema({
  dayNumber: Number,
  title: String,
  date: Date,
  activities: [ActivitySchema],
});

const PlaceSchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  geoCoordinates: {
    lat: Number,
    lng: Number,
  },
});

const HotelSchema = new mongoose.Schema({
  name: String,
  price: String,
  rating: Number,
  image: String,
  geoCoordinates: {
    lat: Number,
    lng: Number,
  },
});

const TripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clerkUserId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  destination: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  budget: {
    type: Number,
    default: 0,
  },
  travelers: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ['draft', 'planned', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
  },
  preferences: mongoose.Schema.Types.Mixed,
  images: [String],
  highlights: [String],
  places: [PlaceSchema],
  hotels: [HotelSchema],
  days: [DaySchema],
  totalCost: {
    type: Number,
    default: 0,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
TripSchema.index({ userId: 1, createdAt: -1 });
TripSchema.index({ destination: 1 });
TripSchema.index({ startDate: 1 });
TripSchema.index({ status: 1 });

export default mongoose.models.Trip || mongoose.model('Trip', TripSchema);
