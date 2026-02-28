import { Router } from "express";
import {
    uploadVideo,
    getVideoById,
    getAllVideos,
    updateVideo,
    deleteVideo,
    getVideosByOwner,
    addVideoToWatchHistory,
} from "../controllers/video.controller.js";
import upload from "../middlewares/multer.middlewares.js";
import verifyJwt from "../middlewares/auth.middlewares.js";

const router = Router();

// More specific routes first
router.route("/upload").post(
    verifyJwt,
    upload.fields([
        { name: "video", maxCount: 1 },
        { name: "thumbnail", maxCount: 1 },
    ]),
    uploadVideo
);

router.route("/watch-history/:videoId").post(verifyJwt, addVideoToWatchHistory);
router.route("/by-owner/:ownerId").get(getVideosByOwner);

// GET / must be before /:videoId so "/" is not matched as videoId
router.route("/").get(getAllVideos);

router.route("/:videoId")
    .get(getVideoById)
    .patch(verifyJwt, updateVideo)
    .delete(verifyJwt, deleteVideo);

export default router;
