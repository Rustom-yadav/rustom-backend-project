import asyncHandler from "../utils/asyncHandler.js";
import Video from "../models/video.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
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
        title,
        description,
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
    const { id } = req.params;
    const video = await Video.findById(id).populate(
        "owner",
        "userName fullName avatar"
    );
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    return res.status(200).json(new ApiResponse(200, "OK", video));
});