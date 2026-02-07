import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, //cloudinary-url
    },
    thumbnail: {
      type: String, //cloudinary-url
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    uploadStatus: {
      type: String,
      enum: ["uploading", "published", "failed"],
      default: "uploading",
    },
    uploadError: {
      type: String, // Stores error message if upload fails
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregatePaginate);

videoSchema.index({
  title: "text",
  description: "text",
});

export const Video = mongoose.model("Video", videoSchema);

export const sortingOptons = ["views", "createdAt", "duration"];
