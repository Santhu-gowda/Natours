const express = require('express');
const viewscController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const router = express.Router();

// router.use(authController.isLoggedIn); // this midleWare apply for all the below routes ,if the user loggedIn then the user will get access to the below routes

router.get('/', viewscController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewscController.getTour); // tour detail Page
router.get('/login', authController.isLoggedIn, viewscController.getLoginForm);
router.get('/me', authController.protect, viewscController.getAccount);
router.get(
  '/submit-user-data',
  authController.protect
  // viewscController.updateUserData
);

module.exports = router;
