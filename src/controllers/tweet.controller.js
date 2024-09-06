import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Failed to create tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$owner",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likesInfo",
      },
    },
    {
      $addFields: {
        likeCount: {
          $size: "$likesInfo",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [new mongoose.Types.ObjectId(req.user._id), "$likesInfo.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        content: 1,
        owner: 1,
        likeCount: 1,
        isLiked: 1,
        createdAt: 1,
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, userTweets));
});

const updateTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params;
  const { content } = req.body;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content,
    },
    {
      new: true,
    }
  );

  if (!updatedTweet) {
    throw new ApiError(500, "Failed to update tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid TweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  if (!deletedTweet) {
    throw new ApiError(500, "Failed to delete tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet Deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
