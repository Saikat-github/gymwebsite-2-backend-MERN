import express from 'express';
import dotenv from 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/mongodb.js';
import passport from './config/passportConfig.js'
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { globalRateLimiter } from './middlewares/rateLimit.js';
import userRouter from './routes/userRoute.js';
import adminRouter from './routes/adminRoute.js';
import { razorpayWebhookHandler } from './controllers/user/userPayment.js';





//App config
const app = express();
const port = process.env.PORT || 4000
const isProduction = process.env.NODE_ENV === 'production';


// Trust proxy in production (for correct IP addresses behind load balancers)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Webhook route FIRST, raw body
app.post(
  "/api/user/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhookHandler
);


// Middleware
app.use(express.json({ limit: '10mb' })); // Add request size limit
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"]
}));
app.use(helmet({
  // Allow sessions and cross-origin cookies to work properly
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));




app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 30 * 24 * 60 * 60, // 30 days
      touchAfter: 24 * 3600, 
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: isProduction, // Use secure cookies in production (HTTPS required)
      sameSite: isProduction ? "none" : "lax", // "none" for cross-origin in production with HTTPS
    },
    rolling: true,
    proxy: isProduction, // Trust proxy in production
    name: 'sessionId' // Don't use default session name for security
  })
);



// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());


connectDB()


//Global rateLimiter
app.use(globalRateLimiter)




//API endpoints
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});


// Health check endpoint for production monitoring
app.get("/health", (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

//Basic hello world route
app.get("/", (req, res) => res.status(200).send('Hello World!'));


// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Don't leak error details in production
  const message = isProduction ? 'Something went wrong!' : err.message;
  
  res.status(err.status || 500).json({
    error: message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});


// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});



app.listen(port, () => {
  console.log("server is listening on port", port)
})





