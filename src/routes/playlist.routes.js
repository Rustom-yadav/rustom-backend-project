import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
} from "../controllers/playlist.controller.js";
import verifyJwt from "../middlewares/auth.middlewares.js";

const router = Router();

// All playlist routes need auth except get by id (if you want public playlists)
router.route("/").post(verifyJwt, createPlaylist).get(verifyJwt, getUserPlaylists);

router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(verifyJwt, updatePlaylist)
    .delete(verifyJwt, deletePlaylist);

router.route("/:playlistId/video/:videoId")
    .post(verifyJwt, addVideoToPlaylist)
    .delete(verifyJwt, removeVideoFromPlaylist);

export default router;
