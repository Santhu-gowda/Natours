// const fs = require('fs');

const AppError = require('./../utiles/appError');
console.log(AppError, 'APP ERRORRRRRR');
const Tour = require('./../model/tourModel');

const catchAsync = require('./../utiles/catchAsync');
const factory = require('./handlerFactory');
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '4';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'ratingsAverage,price,name,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },

    {
      $group: {
        // _id: null,
        // _id: '$ratingsAverage',
        _id: '$difficulty',
        numRatings: { $sum: '$ratingsQuantity' },
        numTours: { $sum: 1 },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTOurStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlan, unit } = req.params;

  const [lat, lan] = latlan.split(',');
  // console.log(distance, lat, lan, unit);
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lan) {
    next(
      new AppError(
        'Please provide the lattitude and longitude tn the format lat, lan',
        400
      )
    );
  }

  // Geo special query to find the location   startLocation: { $geoWithin: { $centerShpere: [[lan, lat, radius]] } },
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lan, lat], radius] } },
  });
  res.status(200).json({
    status: 'Succsess',
    results: tours.length,

    data: { data: tours },
  });
});

exports.getDistaces = catchAsync(async (req, res, next) => {
  const { latlan, unit } = req.params;

  const [lat, lan] = latlan.split(',');
  // console.log(lat, lan, unit);

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lan) {
    next(
      new AppError(
        'Please provide the lattitude and longitude tn the format lat, lan',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lan * 1, lat * 1] },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'Succsess',

    data: { data: distances },
  });
});
