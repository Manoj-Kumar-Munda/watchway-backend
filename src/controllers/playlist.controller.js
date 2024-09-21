import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }

  if (!description) {
    throw new ApiError(400, "Description is required");
  }

  const createdPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!createPlaylist) {
    throw new ApiError(500, "Failed to create playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdPlaylist, "Playlist created!!"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const userPlaylist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        totalDuration: {
          $sum: "$videos.duration",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        totalVideos: 1,
        totalViews: 1,
        coverImage: 1,
        totalDuration: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!userPlaylist) {
    throw new ApiError(500, "Couldn't find the playlist");
  }

  return res.status(200).json(new ApiResponse(200, userPlaylist, ""));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(new ApiResponse(200, playlist, ""));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !playlistId) {
    throw new ApiError(400, "Invalid playlistId");
  }
  if (!isValidObjectId(videoId) || !videoId) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);
  const playlist = await Playlist.findById(playlistId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(400, "Only owner can make changes to playlist");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(playlistId) },
    {
      $addToSet: {
        videos: videoId,
      },
      $set: {
        coverImage: video.thumbnail,
      },
    },
    { new: true }
  );
  if (!updatedPlaylist) {
    throw new ApiError(500, "Error while adding the video to the playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to the playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId) {
    throw new ApiError("PlaylistId is required");
  }

  if (!videoId) {
    throw new ApiError("VideoId is required");
  }

  const video = await Video.findById(videoId);
  const playlist = await Playlist.findById(playlistId);

  if (
    !(playlist.owner.equals(req.user?._id) && video.owner.equals(req.user._id))
  ) {
    throw new ApiError(400, "Only owner can make changes to othe playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "Error while removing the video from the playlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video removed from the playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Error while deleting playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name,
      description,
    },
    {
      new: true,
    }
  );

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated."));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
