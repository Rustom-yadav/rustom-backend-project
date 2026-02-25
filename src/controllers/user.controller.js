import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiErrors.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateTokens = async(user) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
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
    throw new ApiError(400, "Email already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatarUrl = await uploadToCloudinary(avatarLocalPath);
  const coverImageUrl = await uploadToCloudinary(coverImageLocalPath);

  if (!avatarUrl) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  const user = await User.create({
    userName,
    fullName,
    email,
    password,
    avatar: avatarUrl,
    coverImage: coverImageUrl,
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

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
  
  // Send cookies with the tokens
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          coverImage: user.coverImage,
        },
        accessToken,
        refreshToken,
      })
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
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
    (authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null) ||
    req.body?.refreshToken;
    
  
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  let decodedToken; 
  try {
    decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
  
  const user = await User.findById(decodedToken?._id);

  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const options = {
    httpOnly: true,
    secure: true
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