const express = require('express');
const viewscController = require('../controllers/viewsController');

const router = express.Router();

router.get('/', viewscController.getOverview);

router.get('/tour/:slug', viewscController.getTour);
router.get('/login', viewscController.getLoginForm);
module.exports = router;
