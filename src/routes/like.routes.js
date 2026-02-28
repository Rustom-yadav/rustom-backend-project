import { Router } from "express";
import { toggleLikeOnVideo, toggleLikeOnComment } from "../controllers/like.controller.js";
import verifyJwt from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/video/:videoId").post(verifyJwt, toggleLikeOnVideo);
router.route("/comment/:commentId").post(verifyJwt, toggleLikeOnComment);

export default router;
