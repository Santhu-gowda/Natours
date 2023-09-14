const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../model/tourModel');
const User = require('../../model/userModel');
const Review = require('../../model/reviewModel');

dotenv.config({ path: './config.env' });

// replacing the password
const DB = process.env.DATABASE_TOURS.replace(
  '<PASSWORD>',
  process.env.DATABASE_TOURS_PASSWORD
);
mongoose
  .connect(
    DB
    //    {
    //   useNewUrlParser: true,
    //   useCreateIndex: true,
    //   useFindAndModify: false,
    // }
  )
  .then(() => {
    console.log('DB connections succesfull!');
  });

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// const toursLength = tours.length;

// IMPORT DATA IN TO THE DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data Successfully Loaded');
  } catch (err) {
    console.log(err, 'Errorr!!!!');
  }
  process.exit();
};

// Dalete Data from the DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data Successfully deleted!!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};
// this comand  is used to run in the terminal wn importing n deleting the data from db
//    ---    node ./dev-data/data/import-dev-data.js --import

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
// console.log(process.argv, 'hello argv');
