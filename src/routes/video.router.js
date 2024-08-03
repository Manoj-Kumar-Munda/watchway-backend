import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  changeThumbnail,
  deleteVideo,
  getAllVideos,
  getSearchResults,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const videoRouter = express.Router();

videoRouter.route("/")
  .get(
    getAllVideos
  )
  .post(
  verifyJWT,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);
videoRouter.route("/status/:videoId").patch(verifyJWT, togglePublishStatus);

videoRouter.route("/update/:videoId").patch(verifyJWT, updateVideo);

videoRouter
  .route("/change-thumbnail/:videoId")
  .patch(verifyJWT, upload.single("thumbnail"), changeThumbnail);

videoRouter.route("/search").get(getSearchResults);

videoRouter
  .route("/:videoId")
  .get(verifyJWT, getVideoById)
  .delete(verifyJWT, deleteVideo);

export default videoRouter;
