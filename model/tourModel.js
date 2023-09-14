const mongoose = require('mongoose');
const slugify = require('slugify');

// const validator = require('validator');
// shema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [false, 'a tour name must have name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A Tour name must have less or equal then 40 characters'],
      minlength: [10, 'A Tour name must have more or equal then 40 characters'],
      // validate: [validator.isAlpha, 'A tour name must only contain characters'],
    },
    // get name() {
    //   return this._name;
    // },
    // set name(value) {
    //   this._name = value;
    // },
    slug: String,
    price: {
      type: Number,
      required: [true, 'a price must have price'],
    },
    duration: {
      type: Number,
      required: [true, 'a duration must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'a max group size must have max group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'a tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, miedium, difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.7,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return this.price > val ? true : false;
        },
        message: 'The discount price must be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'a tour must have description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'a tour must have cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false /*need to hide the createdAt from the Db */,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// virtual properties

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Vitual Populate

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Mongoose middlewares 1)document middlewares 2) query middlewares 3)Aggregation midlewares
// DOCUMENT MIDDLEWARE runs before .save() and .create()
tourSchema.pre('save', function (next) {
  // console.log('save', this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

// 2) QUERY MIDDLEWARE

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v',
  });
  next();
});

// tourSchema.post(/^find/, function (doc, next) {
//   // console.log(doc, 'DOCPOST QUEry');

//   // /*to find how much time it takes to execute the query use below logic*\

//   console.log(`QUERY TOOK ${Date.now() - this.start} MilliSeconds!`);
//   next();
// });
//AGGREAGTION MIDDLEWARE

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

// create model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
