import { Router } from "express";
import {
    subscribe,
    unsubscribe,
    getSubscribedChannels,
    getChannelSubscribers,
} from "../controllers/subscription.controller.js";
import verifyJwt from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/subscribe/:channelId").post(verifyJwt, subscribe);
router.route("/unsubscribe/:channelId").post(verifyJwt, unsubscribe);
router.route("/subscribed").get(verifyJwt, getSubscribedChannels);
router.route("/channel/:channelId/subscribers").get(getChannelSubscribers);

export default router;
