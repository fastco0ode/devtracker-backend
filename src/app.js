const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const cors = require("cors");
const jwt = require("jsonwebtoken"); // هنحتاج الـ JWT هنا للتفتيش
const dbConnection = require("./config/db");
const regRouter = require("./modules/auth/routes/auth.routes");
const errorMiddleware = require("./middlewares/error.middleware");
const { projectRouter } = require("./modules/auth/routes/project.routes");
const taskRouter = require("./modules/auth/routes/task.routes");
const TaskActivity = require("./modules/auth/routes/taskActivity.routes");
const { developerRouter } = require("./modules/auth/routes/developer.routes");
const { invitaionsRouter } = require("./modules/auth/routes/invitations.routes");
const subscriptionRouter = require("./modules/subscriptions/routes/subscription.routes");
require('./utils/taskQueue');

const app = express();
const port = 4200;

// 1. إنشاء Server يدعم WebSockets
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // في الإنتاج حط رابط الأنجولار بتاعك
    methods: ["GET", "POST"]
  }
});
// لازم ده يكون قبل أي حاجة عشان يفك شفرة الـ JSON في الريكويست العادي بس نستثني الاسترايب ميعملش فيه كده
app.use((req, res, next) => {
  if (req.originalUrl.includes('webhook')) {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use('/subscribe/webhook', express.raw({ type: 'application/json' }));

// 2. جعل الـ io متاح عالمياً
global.io = io;

// 3. تأمين الـ Socket باستخدام JWT (Middleware)
// ده بيشتغل قبل ما الـ Client يعمل Connect فعلياً
io.use((socket, next) => {
  const token = socket.handshake.auth.token; // استلام التوكن من الـ Client

  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }

  try {
    // فك التوكن والتأكد إنه سليم (JWT_SECRET لازم يكون نفس اللي في الـ login)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_here");

    // بنخزن بيانات اليوزر جوه الـ socket عشان نستخدمها بعدين
    // افترضنا إن التوكن جواه _id أو id
    socket.userId = decoded.id || decoded._id;
    next();
  } catch (err) {
    return next(new Error("Authentication error: Invalid token"));
  }
});



// 4. إدارة اتصالات السوكيت بعد التأكد من الهوية
io.on("connection", (socket) => {
  console.log(`User connected securely: ${socket.userId}`);

  // المستخدم بينضم فوراً لغرفة باسم الـ ID بتاعه المستخرج من التوكن
  socket.join(socket.userId.toString());
  console.log(`User ${socket.userId} joined their private room`);

  socket.on("disconnect", () => {
    console.log(`User ${socket.userId} disconnected`);
  });
});

app.set('trust proxy', 1);

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  })
);

app.use((req, res, next) => {
  if (req.originalUrl.includes('/webhooks/stripe')) {
    next();
  } else {
    express.json({ limit: "10kb" })(req, res, next);
  }
});

app.get("/", (req, res) => {
  res.json({ message: "Hello from secure socket server" });
});

app.use('/auth', regRouter);
app.use('/developer', projectRouter);
app.use('/project', taskRouter);
app.use('/activityproject', TaskActivity);
app.use('/developerSettings', developerRouter);
app.use('/invitations', invitaionsRouter);
app.use('/subscribe', subscriptionRouter);

app.use(errorMiddleware);

// 5. تشغيل الـ server (وليس الـ app)
server.listen(port, () => {
  console.log(`Server running on port ${port} with SECURE Socket.io support`);
});

dbConnection();