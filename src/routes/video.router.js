import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { getVideoById, publishAVideo } from "../controllers/video.controller.js";
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

videoRouter.route("/:videoId").get(verifyJWT, getVideoById);

export default videoRouter;