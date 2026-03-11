import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadToCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateTokens = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { userName, fullName, email, password } = req.body;

  if (!userName || !fullName || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }
  // using mongoose $or operator to check if email or username already exists
  // and User is the mongoose model for the user collection in the database
  const existingUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existingUser) {
    throw new ApiError(400, "Email or userName already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const [avatarResult, coverImageResult] = await Promise.all([
    uploadToCloudinary(avatarLocalPath),
    coverImageLocalPath ? uploadToCloudinary(coverImageLocalPath) : null,
  ]);

  if (!avatarResult) {
    throw new ApiError(400, "Error while uploading avatar, try again.");
  }

  const avatarUrl = avatarResult?.secure_url;
  const coverImageUrl = coverImageResult?.secure_url || null;

  const user = await User.create({
    userName,
    fullName,
    email,
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl,
  });

  if (!user) {
    throw new ApiError(500, "Failed to create user");
  }

  const createdUser = user.toObject();
  delete createdUser.password;
  delete createdUser.refreshToken;

  return res
    .status(201)
    .json(new ApiResponse(201, "User created successfully", createdUser));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { userName, password, email } = req.body;

  if (!userName && !email) {
    throw new ApiError(400, "email or userName required");
  }

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };
  const { accessToken, refreshToken } = await generateTokens(user);

  const loggedInUser = user.toObject();
  delete loggedInUser.password;
  delete loggedInUser.refreshToken;

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const authHeader = req.get("Authorization");

  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null) ||
    req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decodedToken?._id);

  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  const { accessToken, refreshToken } = await generateTokens(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "Access token refreshed successfully", {
        accessToken,
        refreshToken,
      })
    );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCurrentPasswordValid = await user.isPasswordCorrect(currentPassword);

  if (!isCurrentPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", req.user));
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName && !email) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User profile updated successfully", user));
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatarResult = await uploadToCloudinary(avatarLocalPath);
  const avatarUrl = avatarResult?.secure_url;

  if (!avatarUrl) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatarUrl,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, "User avatar updated successfully", user));
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is required");
  }

  const coverImageResult = await uploadToCloudinary(coverImageLocalPath);
  const coverImageUrl = coverImageResult?.secure_url;

  if (!coverImageUrl) {
    throw new ApiError(500, "Failed to upload cover image");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImageUrl,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, "User cover image updated successfully", user));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const userName = req.params?.username?.trim().toLowerCase() || "";

  if (!userName) {
    throw new ApiError(400, "userName is missing or empty");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        subscriptionCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        subscriberCount: 1,
        subscriptionCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        fullName: 1,
        userName: 1,
        email: 1,
      },
    },
  ]);

  if (!channel || channel.length === 0) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Channel profile fetched successfully", channel[0])
    );
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: parseInt(limit) },
        
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
        ],
      },
    },
  ]);

  if (!user || user.length === 0) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Watch history fetched successfully",
        user[0].watchHistory
      )
    );
});
