const express = require('express');

const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');
const router = express.Router();
// get all reviews on tour
router.use('/:tourId/reviews', reviewRouter);

// router.param('id', tourController.checkId);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
// Aggregation pipeline for  matching and grouping
router
  .route('/tour-stats')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getTourStats
  );
// Aggregation pipeline for unwinding and projecting
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/tours-withIn/:distance/center/:latlan/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlan/unit/:unit').get(tourController.getDistaces);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
router
  .route('/:id')
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .get(tourController.getTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );
// // Nested Routes
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

module.exports = router;
