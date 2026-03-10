import asyncHandler from "../utils/asyncHandler.js";
import Video from "../models/video.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose"; 


export const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!req.files || !req.files.video[0]) {
        throw new ApiError(400, "Video file is required");
    }
    if (!req.files.thumbnail || !req.files.thumbnail[0]) {
        throw new ApiError(400, "Thumbnail file is required");
    }
    const videoLocalPath = req.files.video[0].path;
    const thumbnailLocalPath = req.files.thumbnail[0].path;

    const videoResult = await uploadToCloudinary(videoLocalPath);
    const thumbnailResult = await uploadToCloudinary(thumbnailLocalPath);

    if (!videoResult?.secure_url) {
        throw new ApiError(500, "Failed to upload video to Cloudinary");
    }
    if (!thumbnailResult?.secure_url) {
        throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
    }

    const newVideo = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile: videoResult.secure_url,
        thumbnail: thumbnailResult.secure_url,
        duration: videoResult.duration ?? 0,
        owner: req.user._id
    });

    if (!newVideo) {
        throw new ApiError(500, "Failed to upload video");
    }

    return res.status(201).json(
        new ApiResponse(201, "Video uploaded successfully", newVideo)
    );
});

export const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId).populate(
        "owner",
        "userName fullName avatar"
    );
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res.status(200).json(new ApiResponse(200, "OK", video));
});

export const getAllVideos = asyncHandler(async (req, res) => {

    const { page: pageQuery = 1, limit: limitQuery = 10 } = req.query;
    const page = Math.max(1, parseInt(pageQuery) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(limitQuery) || 10));

    const pipeline = [
        {
            $match: {
                isPublished: true
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            userName: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }
    ];

    const videos = await Video.aggregatePaginate(
        Video.aggregate(pipeline),
        { page, limit }
    );
    if (!videos.docs || videos.docs.length === 0) {
        throw new ApiError(404, "No videos found");
    }

    return res.status(200).json(new ApiResponse(200, "videos page", videos));
});

export const updateVideo = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId;
    const userId = req.user?._id;

    if (!videoId) {
        throw new ApiError(404, "Video not found");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const videoFound = await Video.findById(videoId);
    if (!videoFound) {
        throw new ApiError(404, "Video not found");
    }
    if (videoFound.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only update your own video");
    }

    const allowedUpdates = ["title", "description", "isPublished"];
    const updates = {};
    for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
            updates[key] = req.body[key];
        }
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        { $set: updates },
        { new: true }
    );

    if (!video) {
        throw new ApiError(404, "update faild");
    }

   return res.status(200).json(new ApiResponse(200, "Video updated successfully", video));
});

export const deleteVideo = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId;
    const userId = req.user?._id;

    if (!videoId) {
        throw new ApiError(404, "Video not found");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const videoFound = await Video.findById(videoId);
    if (!videoFound) {
        throw new ApiError(404, "Video not found");
    }
    if (videoFound.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own video");
    }

    await Video.findByIdAndDelete(videoId);

    return res.status(200).json(new ApiResponse(200, "Video deleted successfully", null));
});

export const getVideosByOwner = asyncHandler(async (req, res) => {
    const ownerId = req.params.ownerId;
    const { page: pageQuery = 1, limit: limitQuery = 10 } = req.query;
    const page = Math.max(1, Number(pageQuery) || 1);
    const limit = Math.min(20, Math.max(1, Number(limitQuery) || 10));

    if (!ownerId) {
        throw new ApiError(404, "Owner not found");
    }

    const videos = await Video.aggregatePaginate(
        Video.aggregate([
            {
                $match: { owner: new mongoose.Types.ObjectId(ownerId) }
            }
        ]),
        { page, limit }
    );

    if (!videos) {
        throw new ApiError(404, "No videos found");
    }

    return res.status(200).json(new ApiResponse(200, "Videos by owner", videos));
});

export const addVideoToWatchHistory = asyncHandler(async (req, res) => {
    const videoId = req.params?.videoId;
    if (!videoId) {
        throw new ApiError(404, "Video not found");
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: {
                watchHistory: videoId
            }
        }
    );
    return res.status(200).json(new ApiResponse(200, "Video added to watch history", null));
});
