const mongoose = require('mongoose');
const passport = require('passport');
const format = require('util').format;
const _ = require('lodash');

const User = mongoose.model('User');

// require multer for the file uploads
const Multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

const storage = new Storage({
    projectId: 'examapp-mean17',
    keyFilename: './configurations/serviceAccountKey.json'
});
const bucket = storage.bucket(process.env.GCLOUD_STORAGE_BUCKET);  
const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
      fileSize: 3 * 1024 * 1024
    }
});

module.exports.register = (req, res, next) => {
    var user = new User();
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.phoneNo = req.body.phoneNo;
    user.email = req.body.email;
    user.password = req.body.password;    
    user.save((err, doc) => {
        if (!err)
            res.send(doc);
        else {
            if (err.code == 11000)
                res.status(422).send(['Duplicate email adrress found']);
            else
                return next(err);
        }

    });
}

module.exports.authenticate = (req, res, next) => {
    // call for passport authentication
    passport.authenticate('local', (err, user, info) => {       
        // error from passport middleware
        if (err) return res.status(400).json(err);
        // registered user
        else if (user) return res.status(200).json({ "token": user.generateJwt() });
        // unknown user or wrong password
        else return res.status(404).json(info);
    })(req, res);
}

module.exports.userProfile = (req, res, next) => {
    User.findOne({ _id: req._id },
        (err, user) => {
            if (!user)
                return res.status(404).json({ status: false, message: 'User record not found' });
            else {
                createImageUrl(user.imagePath).then((url) => {
                if(url){
                    const imgUrl = url;                                  
                    res.status(200).json({ status: true, user : _.pick(user,['firstName','lastName','phoneNo','email']), imgUrl: imgUrl });
                }else {                
                    return res.status(422).json({ status: false, message: 'Something is wrong! Unable to load the data' });
                }
              }).catch((error) => {
                console.error(error);
              });
            }  
        }
    );
}

module.exports.updateUserProfile = (req, res, next) => {
    User.findOne({ _id: req._id },
        (err, user) => {
            if (!user)
                return res.status(404).json({ status: false, message: 'User record not found' });
            else{
                var usr = {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    phoneNo: req.body.phoneNo,
                    email: req.body.email,
                };
                User.findByIdAndUpdate(req._id, { $set: usr }, {new: true, useFindAndModify: false}, (err, doc) => {
                    if (!err) { res.send(doc); }
                    else { console.log('Error in User Update :' + JSON.stringify(err, undefined, 2)); }
                });
            }                
        }
    );  
}

module.exports.uploadPicture = (req, res, next) => {
    const upload = multer.single('profile');
    upload(req, res, function (err) {      
        let file = req.file;
        if (file) {
          uploadImageToStorage(file).then((url) => {
            if(url){
                User.findOne({ _id: req._id },
                    (err, user) => {
                        if (!user)
                            return res.status(404).json({ status: false, message: 'User record not found' });
                        else{                    
                            User.findByIdAndUpdate(req._id, { $set: {imageUrl: url} }, {new: true, useFindAndModify: false}, (err, doc) => {
                                if (!err) {  
                                    return res.status(200).json({ status: true, message: 'Uploaded Successfully'});
                                } else { 
                                    console.log('Error in Update Url :' + JSON.stringify(err, undefined, 2)); 
                                    return res.status(422).send("Error in Update Image Url");
                                }
                            });
                        }                
                    }
                ); 
            }else {                
                return res.status(422).json({ status: false, message: 'Something is wrong! Unable to upload at the moment' });
            }
          }).catch((error) => {
            console.error(error);
          });
        }        
    });  
}
/**
 * Upload the image file to Google Storage
 * @param {File} file object that will be uploaded to Google Storage
 */
const uploadImageToStorage = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject('No image file');
      }
      const newFileName = `${file.originalname}_${Date.now()}`;  
      const fileUpload = bucket.file('profile-pictures' + '/' + newFileName);
 
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype
        },
        // resumable: false
      });
  
      blobStream.on('error', (error) => {
       // reject('Something is wrong! Unable to upload at the moment');
       const url = null;
       resolve(url);
      });
  
      blobStream.on('finish', () => {
        // The public URL can be used to directly access the file via HTTP.
        // const url = format(`https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`);
        const url = format(`${fileUpload.name}`);
        resolve(url);
      });
  
      blobStream.end(file.buffer);
    });
}

// Get a signed URL to allow limited time access to the picture
const createImageUrl = (path) => {
    return new Promise((resolve, reject) => {
      if (!path) {
        reject('No image path');
        } 
        var file = bucket.file(path);       
        const options = {
            action: 'read',
            expires: '03-02-2025',
          };
        file.getSignedUrl(options)
          .then(results => {
            const url = results[0];
            resolve(url);
          })
          .catch(err => {
              console.error('ERROR:', err);
              const url = null;
              resolve(url);
          });
    });
}

/**
module.exports.uploadPicture = (req, res, next) => {
    const DIR = './uploads/img/profile/';
    const upload = multer({dest: DIR}).single('profile');
    var path = '';
    const usrID = req._id;
    upload(req, res, function (err) {        
        if (err instanceof multer.MulterError) {
            console.log(err);
            return res.status(422).send("A Multer error occurred when uploading")
        } else if (err) {
            console.log(err);
            return res.status(422).send("an Error occured")
        }
        path = req.file.path;  
        User.findOne({ _id: usrID },
            (err, user) => {
                if (!user)
                    return res.status(404).json({ status: false, message: 'User record not found' });
                else{                    
                    User.findByIdAndUpdate(usrID, { $set: {imagePath: path} }, {new: true, useFindAndModify: false}, (err, doc) => {
                        if (!err) { 
                            // res.send(doc); 
                            return res.status(200).json({ status: true, message: 'Uploaded Successfully', path });
                        } else { 
                            console.log('Error in Update Path :' + JSON.stringify(err, undefined, 2)); 
                            return res.status(422).send("Error in Update Image Path");
                        }
                    });
                }                
            }
        );  
    }); 
}
*/


