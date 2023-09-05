const express = require('express');

const router = express.Router();
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/login', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//  PROTECT ALL THE ROUTES AFTER THIS MIDLEWARE
router.use(authController.protect); // this is the special midleware n easy way to protect all the routes

router.patch(
  '/updateMyPassword',

  authController.updatePassword
);

router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
// retrieving usrer data

router.get(
  '/me',

  userController.getMe,
  userController.getUser
);

// creating routes for users

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .patch(userController.updateUser)
  .get(userController.getUser)
  .delete(userController.deleteUser);

module.exports = router;
