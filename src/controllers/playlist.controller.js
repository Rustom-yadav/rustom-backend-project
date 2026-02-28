import asyncHandler from "../utils/asyncHandler.js";
import Playlist from "../models/playlist.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";

// Create a new playlist (login required)
export const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user?._id;

    if (!name || typeof name !== "string" || !name.trim()) {
        throw new ApiError(400, "Playlist name is required");
    }
    if (!userId) {
        throw new ApiError(401, "You must be logged in to create a playlist");
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description?.trim() || "",
        videos: [],
        owner: userId,
    });

    if (!playlist) {
        throw new ApiError(500, "Failed to create playlist");
    }

    return res.status(201).json(
        new ApiResponse(201, "Playlist created successfully", playlist)
    );
});

// Get all playlists of the logged-in user
export const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "You must be logged in to view playlists");
    }

    const playlists = await Playlist.find({ owner: userId });

    return res.status(200).json(
        new ApiResponse(200, "Your playlists", playlists)
    );
});

// Get a single playlist by id (with video details + owner populated)
export const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { page = 1, limit: limitQuery = 20 } = req.query;
    const limit = Math.min(20, Math.max(1, Number(limitQuery) || 20));

    if (!playlistId) {  
        throw new ApiError(400, "Playlist id is required");
    }
    
    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            select: "title thumbnail duration videoFile",
            options: {
                skip: (page - 1) * limit,
                limit: limit,
                sort: { createdAt: -1 }
            }
        });
    

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, "OK", playlist)
    );
});

// Update playlist name or description (only owner)
export const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    const userId = req.user?._id;

    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only update your own playlist");
    }

    const updates = {};
    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            throw new ApiError(400, "Playlist name cannot be empty");
        }
        updates.name = name.trim();
    }
    if (description !== undefined) {
        updates.description = typeof description === "string" ? description.trim() : "";
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: updates
        },
        {
            new: true,
            runValidators: true,
        }
    );

    return res.status(200).json(
        new ApiResponse(200, "Playlist updated successfully", updatedPlaylist)
    );
});

// Delete a playlist (only owner)
export const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const userId = req.user?._id;

    if (!playlistId) {
        throw new ApiError(400, "Playlist id is required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlistFound = await Playlist.findById(playlistId);
    if (!playlistFound) {
        throw new ApiError(404, "Playlist not found");
    }
    if (playlistFound.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse(200, "Playlist deleted successfully")
    );
});

// Add a video to playlist (only owner)
export const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const userId = req.user?._id;

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist id and video id are required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only add to your own playlist");
    }

    if (playlist.videos.some((id) => id.toString() === videoId)) {
        return res.status(200).json(
            new ApiResponse(200, "Video already in playlist", playlist)
        );
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, "Video added to playlist", updatedPlaylist)
    );
});

// Remove a video from playlist (only owner)
export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const userId = req.user?._id;

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist id and video id are required");
    }
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only remove from your own playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, "Video removed from playlist", updatedPlaylist)
    );
});
