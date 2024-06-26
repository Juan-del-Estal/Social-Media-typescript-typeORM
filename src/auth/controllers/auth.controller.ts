import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { UserEntity } from '../../user/entities/user.entity';
import { userLogin } from '../services/auth.service';
import { JWT_SECRET } from '../../config/config';

// Define DoneFunction type manually to prevent errors
type DoneFunction = (error: any, user?: UserEntity | false, info?: any) => void;
const secretJWT: string | null = String(JWT_SECRET);

// Local strategy for username/password authentication
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email: string, password: string, done: DoneFunction) => { // Remove req parameter
  try {
    const { user, token } = await userLogin(email, password);
    console.log(`Token auth service = ${token}`);

    if (!user || !token) {
      return done(null, false, { message: 'Incorrect email or password' });
    }

    // Asigna el token al objeto user
    user.token = JSON.stringify(token);
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// JWT strategy for token-based authentication
passport.use(new JwtStrategy({
  secretOrKey: secretJWT, // Replace with your actual secret key
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
}, async (payload, done) => {
  try {
    const userId = payload.userId;
    const user = await UserEntity.findById(userId);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Serialization
passport.serializeUser((user: UserEntity | any, done) => {
  // Aquí guardamos solo el ID del usuario en la sesión del usuario
  done(null, user.id);
});

// Deserialization of user
passport.deserializeUser<UserEntity>(async (id, done) => {
  try {
    const userId = String(id); // Ensure id is treated as a string
    const user = await UserEntity.findById(userId);
    if (!user) {
      return done(new Error('User not found'));
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});

export default passport;