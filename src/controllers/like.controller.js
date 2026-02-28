import asyncHandler from "../utils/asyncHandler.js";
import Like from "../models/like.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";

// Toggle like on a video: if already liked then remove like, else add like
export const toggleLikeOnVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }
    if (!userId) {
        throw new ApiError(401, "You must be logged in to like");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(200, "Like removed from video", { liked: false })
        );
    }

    const newLike = await Like.create({
        video: videoId,
        likedBy: userId,
    });

    if (!newLike) {
        throw new ApiError(500, "Failed to add like");
    }

    return res.status(201).json(
        new ApiResponse(201, "Video liked successfully", { liked: true, like: newLike })
    );
});

// Toggle like on a comment: if already liked then remove, else add
export const toggleLikeOnComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!commentId) {
        throw new ApiError(400, "Comment id is required");
    }
    if (!userId) {
        throw new ApiError(401, "You must be logged in to like");
    }

    const existingLike = await Like.findOne({
        Comment: commentId,
        likedBy: userId,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(
            new ApiResponse(200, "Like removed from comment", { liked: false })
        );
    }

    const newLike = await Like.create({
        Comment: commentId,
        likedBy: userId,
    });

    if (!newLike) {
        throw new ApiError(500, "Failed to add like");
    }

    return res.status(201).json(
        new ApiResponse(201, "Comment liked successfully", { liked: true, like: newLike })
    );
});
