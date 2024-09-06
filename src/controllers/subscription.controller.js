import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const isSubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user?._id,
  });
  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isSubscribed: false }, "Channel unsubscribed")
      );
  }

  const newSubscription = await Subscription.create({
    channel: channelId,
    subscriber: req.user._id,
  });

  if (!newSubscription) {
    throw new ApiError(500, "Error while subscribing to the channel");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { isSubscribed: true }, "Channel subscribed"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscibers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: "$channel",
        subscribers: {
          $push: "$subscriber",
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscribers",
        foreignField: "_id",
        as: "subscribers",
        pipeline: [
          {
            $project: {
              username: 1,
              email: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subsCount: {
          $size: "$subscribers",
        },
      },
    },
  ]);

  if (!subscibers) {
    throw new ApiError(500, "Error while fetching subsribers list");
  }
  return res.status(200).json(new ApiResponse(200, subscibers));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if(!isValidObjectId(subscriberId)){
    throw new ApiError(400, "Invalid subscriberId");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $group: {
        _id: "$subscriber",
        channelSubscribed: {
          $push: "$channel",
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channelSubscribed",
        foreignField: "_id",
        as: "channelSubscribed",
      },
    },
    {
      $addFields: {
        subscribedChannelCount: {
          $size: "$channelSubscribed",
        },
      },
    },
    {
      $project: {
        channelSubscribed: {
          fullName: 1,
          username: 1,
          avatar: 1,
          email: 1
        },
        subscribedChannelCount: 1,
      },
    },
  ]);

  if(!subscribedChannels){
    throw new ApiError(500, "error while fetching subscibed channel list");
  }

  return res.status(200).json(new ApiResponse(200, subscribedChannels));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
