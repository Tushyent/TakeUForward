import express from 'express';
import passport from 'passport';

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: (process.env.CLIENT_URL || 'http://localhost:5173') + '/login?error=domain',
  }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  }
);

router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    // Since we are using express-session, we might also want to destroy it
    req.session && req.session.destroy();
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

export default router;
