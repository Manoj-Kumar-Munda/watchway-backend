import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  page = (parseInt(page) && (page < 1 ? 1 : page)) || 1;
  limit = (parseInt(limit) && (limit < 1 ? 10 : limit)) || 10;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }


  const aggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
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
        foreignField: "comment",
        as: "likes",
      },
    },
    {
      $addFields: {
        totalLikes: {
          $size: "$likes",
        }
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        video: 1,
        createdAt: 1,
        owner: {
          username: 1,
          fullName: 1,
          avatar: 1,
        },
        totalLikes: 1,
      },
    },
  ]);

  const comments = await Comment.aggregatePaginate(aggregate, {
    page,
    limit,
  });

  return res.status(200).json(new ApiResponse(200, comments));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!content.trim()) {
    throw new ApiError(400, "Comment is required");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    video: videoId,
    content,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "Failed to add your comment");
  }

  return res.status(200).json(new ApiResponse(200, comment, "Comment added"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "commentId is not valid");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content,
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(500, "Failed to update comment");
  }

  return res.status(200).json(new ApiResponse(200, updatedComment));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(500, "Failed to delete comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
