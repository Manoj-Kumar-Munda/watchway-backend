import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

const app = express();
const allowedOrigins = ["https://watchway.vercel.app", "http://localhost:3000", "https://watchway.manojk.online"];

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongo db connection failed!!! ", err);
  });

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("/public"));
app.use(cookieParser());
app.use(express.json());

//routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.router.js";
import playlistRouter from "./routes/playlist.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import likeRouter from "./routes/like.routes.js";
import commentRouter from "./routes/comment.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthRouter from "./routes/healthcheck.routes.js";
//routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/health", healthRouter);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

export default app;
