import { Router } from "express";
import {
  toggleVideoLike,
  toggleTweetLike,
  getLikeStatus,
  getLikedVideos,
  toggleCommentLike,
  getBatchLikeStatus,
} from "../controllers/like.controller.js";
import { verifyJWT, authStatus } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/status/batch").post(authStatus, getBatchLikeStatus);

router.use(verifyJWT);
router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

router.route("/status").get(getLikeStatus);

export default router;
