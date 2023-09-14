const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../model/userModel');
const catchAsync = require('./../utiles/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utiles/appError');
const sendEmail = require('../utiles/email');

const signInTOken = (id) => {
  // console.log(jwt, 'json Web TOKEN');
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  // console.log(user, 'user');
  const token = signInTOken(user._id);
  // console.log(token, 'Token from signIn');
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),

    httpOnly: true,
  };
  // console
  // .log(cookieOptions, 'cookiesOpttions!!!!!!!!', token, 'Token');
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // remove the pasword from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // console.log(req.body, 'body meassge');
  const newUser = await User.create(req.body);
  createSendToken(newUser, 201, res);
  // console.log(newUser, 'NEWUSER!!!!');
});

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if email and password exist
  if (!email || !password) {
    return next(new AppError('please provide valid email and password', 400));
  }

  // 2) check if user exist and password is correct

  const user = await User.findOne({ email: email }).select('+password');
  // const correct=await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('INCORRECT EMAIL OR  PASSWORD!', 401));
  }

  // 3)if everything is correct send jws token to the client

  createSendToken(user, 200, res);
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'Success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  //  1) Greetings token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token, 'token');

  if (!token) {
    return next(
      new AppError('you are not loged in ! please login to get access!', 401)
    );
  }

  // 2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded, 'decoded!');
  // 3)check if user still exists

  const currentUser = await User.findById(decoded.id);

  if (currentUser === null) {
    return next(
      new AppError('The user belongs to this token does no longer exist', 401)
    );
  }

  // 4) check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'the ser recently changed the password.. please login again!',
        401
      )
    );
  } /* "iat " means issued at */

  // GRANT ACCESS TO PROTECTED DATA
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});
//
// Only For Rendered pages, when No errors
exports.isLoggedIn = async (req, res, next) => {
  //  1) Greetings token and check if its there

  if (req.cookies.jwt) {
    // 2) verify the token
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // console.log(decoded, 'decoded');
      // 3)check if user still exists

      const currentUser = await User.findById(decoded.id);
      // console.log(currentUser, 'current user from auth file');
      if (!currentUser) {
        return next();
      }

      // 4) check if user changed password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      } /* "iat " means issued at */

      // There is a loggedIn User
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

//
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']  role= 'user
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action!', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //  1) Get user based on posted email adress
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address!', 404));
  }

  // 2)generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to :${resetURL}./n if you didn't forget your password, please ignore this email`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'your password reset token valid for 10 min',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    // console.log(err, 'error for send mail!');
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. try again later', 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get the user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('Token is invalid or expired!', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordRsetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) update the changed passwordAt property for the user
  // 4)log the user in send jwt token

  const token = signInTOken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get the user from collection
  const user = await User.findById(req.user._id).select('+password');

  // 2) check if posted current paasowrd  is currect
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    next(new AppError('Current password is incorrect', 401));
  }

  // 3)if so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // user.findByIdAndUpdate will not work as indent

  // 4) log the user in send token
  createSendToken(user, 201, res);
});
