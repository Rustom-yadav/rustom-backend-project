import asyncHandler from "../utils/asyncHandler.js";
import Comment from "../models/comment.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

// Add a comment on a video (login required)
export const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }
    if (!content || typeof content !== "string" || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }
    if (!userId) {
        throw new ApiError(401, "You must be logged in to comment");
    }

    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: userId,
    });

    if (!comment) {
        throw new ApiError(500, "Failed to add comment");
    }

    const commentWithOwner = await Comment.findById(comment._id).populate(
        "owner",
        "userName fullName avatar"
    );

    return res.status(201).json(
        new ApiResponse(201, "Comment added successfully", commentWithOwner)
    );
});

// Update own comment
export const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body || {};
    const userId = req.user?._id;

    if (!commentId) {
        throw new ApiError(400, "Comment id is required");
    }
    if (!content || typeof content !== "string" || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only edit your own comment");
    }

    await Comment.findByIdAndUpdate(
        commentId,
        { $set: { content: content.trim() } },
        { new: true }
    );

    const updatedComment = await Comment.findById(commentId).populate(
        "owner",
        "userName fullName avatar"
    );

    return res.status(200).json(
        new ApiResponse(200, "Comment updated successfully", updatedComment)
    );
});

// Delete a comment (only owner can delete)
export const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!commentId) {
        throw new ApiError(400, "Comment id is required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(200, "Comment deleted successfully")
    );
});

// Get all comments of a video with pagination
export const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!videoId) {
        throw new ApiError(400, "Video id is required");
    }

    const result = await Comment.aggregatePaginate(
        Comment.aggregate([
            { $match: { video: new mongoose.Types.ObjectId(videoId) } },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDoc",
                },
            },
            { $unwind: "$ownerDoc" },
            {
                $project: {
                    content: 1,
                    video: 1,
                    createdAt: 1,
                    owner: {
                        userName: "$ownerDoc.userName",
                        fullName: "$ownerDoc.fullName",
                        avatar: "$ownerDoc.avatar",
                    },
                },
            },
        ]),
        { page: Number(page), limit: Math.min(Number(limit) || 10, 20) }
    );

    return res.status(200).json(
        new ApiResponse(200, "Video comments", result)
    );
});
