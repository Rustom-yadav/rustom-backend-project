import asyncHandler from "../utils/asyncHandler.js";
import Subscription from "../models/subscription.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";

// Subscribe to a channel (login required)
export const subscribe = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;

    if (!channelId) {
        throw new ApiError(400, "Channel id is required");
    }
    if (!userId) {
        throw new ApiError(401, "You must be logged in to subscribe");
    }
    if (channelId === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const existing = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });
    if (existing) {
        return res.status(200).json(
            new ApiResponse(200, "Already subscribed", existing)
        );
    }

    const subscription = await Subscription.create({
        subscriber: userId,
        channel: channelId,
    });

    if (!subscription) {
        throw new ApiError(500, "Failed to subscribe");
    }

    return res.status(201).json(
        new ApiResponse(201, "Subscribed successfully", subscription)
    );
});

// Unsubscribe from a channel
export const unsubscribe = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user?._id;

    if (!channelId) {
        throw new ApiError(400, "Channel id is required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const deleted = await Subscription.findOneAndDelete({
        subscriber: userId,
        channel: channelId,
    });

    if (!deleted) {
        throw new ApiError(404, "Subscription not found");
    }

    return res.status(200).json(
        new ApiResponse(200, "Unsubscribed successfully")
    );
});

// Get list of channels the user is subscribed to
export const getSubscribedChannels = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "You must be logged in");
    }

    const subscriptions = await Subscription.find({ subscriber: userId })
        .populate("channel", "userName fullName avatar");

    return res.status(200).json(
        new ApiResponse(200, "Subscribed channels", subscriptions)
    );
});

// Get subscribers of a channel
export const getChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "Channel id is required");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "userName fullName avatar");

    return res.status(200).json(
        new ApiResponse(200, "Channel subscribers", subscribers)
    );
});
