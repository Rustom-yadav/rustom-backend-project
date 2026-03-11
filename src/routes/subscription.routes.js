import { Router } from "express";
import {
    toggleSubscribe,
    getSubscribedChannels,
    getChannelSubscribers,
} from "../controllers/subscription.controller.js";
import verifyJwt from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/toggleSubscribe/:channelId").post(verifyJwt, toggleSubscribe);

router.route("/subscribed").get(verifyJwt, getSubscribedChannels);
router.route("/channel/:channelId/subscribers").get(getChannelSubscribers);

export default router;
