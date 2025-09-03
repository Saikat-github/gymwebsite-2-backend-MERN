import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import userAuthModel from '../models/user/userAuth.js';
import adminAuthModel from '../models/admin/adminAuth.js';


// Update findUserById helper
const findUserById = async (id, userType) => {
  try {
    if (userType === 'user') {
      return await userAuthModel.findById(id);
    } else if (userType === 'admin' || userType === "super_admin") {
      return await adminAuthModel.findById(id);
    }
  } catch (err) {
    return null;
  }
};



// Serialize with user type information
passport.serializeUser((user, done) => {
  done(null, { id: user._id, userType: user.userType });
});

// Deserialize using the appropriate model based on user type
passport.deserializeUser(async (data, done) => {
  try {
    const user = await findUserById(data.id, data.userType);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});



// Local Strategy for users
passport.use('user-local', new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await userAuthModel.findOne({ email });

      if (!user) {
        return done(null, false, { message: 'Email does not exist!' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      // Add user type for serialization
      user.userType = 'user';
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));



// Google Strategy for users
passport.use('user-google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/user/google/callback`,
  proxy: true
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already registered with email and password
      const registeredUser = await userAuthModel.findOne({ email: profile.emails[0].value });
      if (registeredUser && registeredUser.password) {
        return done(null, false, { message: 'Email already registered with password!' });
      }
      // Check if user already exists
      const existingUser = await userAuthModel.findOne({ googleId: profile.id });

      if (existingUser) {
        existingUser.userType = 'user';
        return done(null, existingUser);
      }

      // If not, create new user
      const newUser = await new userAuthModel({
        googleId: profile.id,
        email: profile.emails[0].value,
        profileCompleted: false
      }).save();

      newUser.userType = 'user';
      done(null, newUser);
    } catch (err) {
      done(err, null);
    }
  }
));




// Admin Local Strategy
passport.use('admin-local', new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const admin = await adminAuthModel.findOne({ email });
      if (!admin) {
        return done(null, false, { message: 'Admin not found!' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, admin);
    } catch (err) {
      return done(err);
    }
  }
));


export default passport;


















