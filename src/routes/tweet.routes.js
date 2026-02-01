import { Router } from "express";
import {
  addCommentToTweet,
  createTweet,
  deleteTweet,
  getCommentsOnTweet,
  getLikeStatus,
  getTweetById,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { authStatus, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, createTweet);
router.route("/user/:userId").get(authStatus, getUserTweets);
router
  .route("/:tweetId")
  .get(getTweetById)
  .patch(verifyJWT, updateTweet)
  .delete(verifyJWT, deleteTweet);
router
  .route("/:tweetId/comments")
  .post(verifyJWT, addCommentToTweet)
  .get(getCommentsOnTweet);

router.route("/:tweetId/likes").get(authStatus, getLikeStatus);

export default router;
