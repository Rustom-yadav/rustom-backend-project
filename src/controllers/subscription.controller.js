import asyncHandler from "../utils/asyncHandler.js";
import Subscription from "../models/subscription.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";

// Subscribe to a channel (login required)
export const toggleSubscribe = asyncHandler(async (req, res) => {
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

    const { deletedCount } = await Subscription.deleteOne({
        subscriber: userId,
        channel: channelId,
    });
    if (deletedCount === 1) {
        return res.status(200).json(
            new ApiResponse(200, "unsubscribed successfully", null)
        );
    }

    const isValidChannel = await User.findById(channelId);

    if (!isValidChannel) {
        throw new ApiError(404, "Channel not found");
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
