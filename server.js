const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');

// replacing the password
// if (process.env.DATABASE_TOURS) {
//   const DB = process.env.DATABASE_TOURS.replace(
//     '<PASSWORD>',
//     process.env.DATABASE_TOURS_PASSWORD
//   )
// } else {
//   console.error('DATABASE_TOURS environment variable is not defined.');
//   // Handle the error or exit the application gracefully.
// }

// const DB = process.env.DATABASE_TOURS.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_TOURS_PASSWORD
// );

const DB = process.env.DATABASE_TOURS;
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

// to check the env of the app either development or production
// console.log(app.get('env'));
// console.log(process.env);
// const port = 3000;
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening to the port ${port}`);
});
