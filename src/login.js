import passport from 'passport';
import { Strategy } from 'passport-local';

// Hægt að útfæra passport virkni hér til að létta á app.js
passport.use(new Strategy(userStrategy)); // eslint-disable-line
passport.serializeUser(serializeUser); // eslint-disable-line
passport.deserializeUser(deserializeUser); // eslint-disable-line

export default passport;
