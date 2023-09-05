const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

// replacing the password
const DB = process.env.DATABASE_TOURS.replace(
  '<PASSWORD>',
  process.env.DATABASE_TOURS_PASSWORD
);
mongoose
  .connect(
    DB
    //   {
    //   useNewUrlParser: true,
    //   useCreateIndex: true,
    //   useFindAndModify: false,
    // }
  )
  .then((con) => {
    // console.log(con.connections);
    console.log('DB connections succesfull!');
  });

// const testTour = new Tour({
//   name: 'The Park Center_2',
//   price: 401,
//   rating: 4.4,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc, 'document saved sucessfully!');
//   })
//   .catch((err) => {
//     console.log('ERROR', err.message);
//   });

// to check the env of the app either development or production
// console.log(app.get('env'));
// console.log(process.env);
// const port = 3000;
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening to the port ${port}`);
});
