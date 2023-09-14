const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utiles/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
// hello
// SERVING STATIC FILES
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// 1)Global middlewares
// set security http headers
app.use(helmet());

// developmemt logging  ///  GET /api/v1/tours 200 3300.112 ms - 8768   like this in teminal it will show
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit request from same API, to avoid the too many request from the same ip address
// limiter is the middleware function
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many requests from this ip, please try again in an hour!',
});

app.use('/api', limiter);
// console.log(process.env.NODE_ENV, 'hello');

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(cookieParser());
// Data sanitization against NoSql query injection
app.use(mongoSanitize());

//data sanitiztion against XSS
//in white list what we have mentioned the keys ,the xss will allow the duplicates of sort
app.use(
  xss({
    whiteList: [
      'duration',
      'maxGroupSize',
      'difficulty',
      'ratingsAverage',
      'ratingsQuantity',
    ],
  })
);

// the below one will compress the text before sending to the client
app.use(compression());
// Prwevent parameter pollution

app.use(hpp());

// tEST MIDLEWARE
app.use((req, res, next) => {
  //  console.log('hello from the middleware !!!!');

  next();
});
//
// Test middleware
// app.use((req, res, next) => {
//   req.reqTime = new Date().toISOString();
//   // console.log(req.headers);
//   console.log(
//     req.cookies,
//     'Cookies from server--cookie-parser.  located in app.js file'
//   );
//   next();
// });

// 3)ROUTES

app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
// handling unhandled routes
// "*" stands for all the url's

app.all('*', (req, res, next) => {
  next(new AppError(`could not find ${req.originalUrl} on this server`, 404));
});

//-- ERROR HANDLING MIDDLEWARE-- the below middleware runs only if the error occurs----
app.use(globalErrorHandler);

// 4)START SERVER

module.exports = app;
