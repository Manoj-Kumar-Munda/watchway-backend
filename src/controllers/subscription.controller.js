import mongoose, { isValidObjectId, Mongoose } from "mongoose";
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
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberInfo",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subsList",
            },
          },
          {
            $addFields: {
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [
                      new mongoose.Types.ObjectId(channelId),
                      "$subsList.subscriber",
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              fullName: 1,
              totalSubs: 1,
              isSubscribed: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$subscriberInfo",
      },
    },
    {
      $project: {
        _id: 0,
        subscriberInfo: 1,
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
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriberId");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelInfo",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              totalSubs: {
                $size: "$subscribers",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [
                      new mongoose.Types.ObjectId(subscriberId),
                      "$subscribers.subscriber",
                    ],
                  },

                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              fullName: 1,
              totalSubs: 1,
              isSubscribed: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$channelInfo",
      },
    },
    {
      $project: {
        _id: 1,
        channelInfo: 1,
      },
    },
  ]);

  if (!subscribedChannels) {
    throw new ApiError(500, "error while fetching subscibed channel list");
  }

  return res.status(200).json(new ApiResponse(200, subscribedChannels));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
