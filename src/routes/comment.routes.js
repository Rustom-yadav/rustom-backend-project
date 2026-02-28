import { Router } from "express";
import {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments,
} from "../controllers/comment.controller.js";
import verifyJwt from "../middlewares/auth.middlewares.js";

const router = Router();

// More specific first: /video/:videoId so that "video" is not taken as commentId
router.route("/video/:videoId").get(getVideoComments);
router.route("/video/:videoId/add").post(verifyJwt, addComment);

router.route("/:commentId").patch(verifyJwt, updateComment).delete(verifyJwt, deleteComment);

export default router;
