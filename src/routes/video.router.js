import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { deleteVideo, getVideoById, publishAVideo, togglePublishStatus } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const videoRouter = express.Router();


videoRouter.route("/").post(verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
)
videoRouter.route("/toggle-status/:videoId").patch(verifyJWT, togglePublishStatus);

videoRouter.route("/:videoId")
    .get(verifyJWT, getVideoById)
    .delete(verifyJWT, deleteVideo);


export default videoRouter;