import { Router } from "express";
import {
  addCommentToTweet,
  createTweet,
  deleteTweet,
  getCommentsOnTweet,
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

export default router;
