const express = require('express');
const router = express.Router();

const ctrlUser = require('../controllers/user.controller');
const jwtHelper = require('../configurations/jwtHelper');

router.post('/register', ctrlUser.register);
router.post('/authenticate', ctrlUser.authenticate);
router.get('/userprofile',jwtHelper.verifyJwtToken, ctrlUser.userProfile);
router.post('/changeuserprofile',jwtHelper.verifyJwtToken, ctrlUser.updateUserProfile);
router.post('/uploadprofilepicture',jwtHelper.verifyJwtToken, ctrlUser.uploadPicture);

module.exports = router;
