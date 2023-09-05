const crypto = require('crypto'); /* ne need to install its built by nodejs*/
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//name, email, password, photo,passwordConfirmation
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us you name!'],

    trim: true,
    validate: [validator.isAlpha, 'A tour name must only contain characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    lowerCase: true,
    validate: [validator.isEmail, 'Please provide a valid email!'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'please provide a password!'],
    minlength: 8,
    select: false /* to hide the password to the client side */,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Plase confirm your password!'],
    validate: {
      // this only works on CREATE AND SAVE!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'passwords are not same',
    },
  },

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// To save the password of the user
// using Document midleware-- pre Save

userSchema.pre('save', async function (next) {
  // this function only run if the password is modified
  if (!this.isModified('password'))
    return next(); /* if the password not modified return nothing*/
  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  /* the below line code is used for--if the user enters the password wrong no need to store to the DB need delete the entered confirm password*/
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query

  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatepassword /*Original paasword coming from the user  */,
  userPassword /*encrypted paasword from the db  */
) {
  console.log(candidatepassword, userPassword, 'candidate', 'user');
  return await bcrypt.compare(candidatepassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimesStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp, JWTTimesStamp, 'password', 'TimeStamp');
    return JWTTimesStamp < changedTimeStamp; // 100 <200
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log(
    { resetToken },
    this.passwordResetToken,
    'userModelPassword reset token'
  );

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
