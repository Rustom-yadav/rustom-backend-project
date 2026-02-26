import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getUserChannelProfile,
    changePassword,
    getCurrentUser,
    updateUserProfile,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middlewares.js";
import verifyJwt from "../middlewares/auth.middlewares.js";


const router = Router();
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt, changePassword);
router.route("/get-current-user").get(verifyJwt, getCurrentUser);
router.route("/update-profile").put(verifyJwt, updateUserProfile);
router.route("/update-avatar").put(verifyJwt, upload.single("avatar"), updateUserAvatar);
router.route("/update-cover-image").put(verifyJwt, upload.single("coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJwt, getUserChannelProfile);
router.route("/watch-history").get(verifyJwt, getWatchHistory);

export default router;