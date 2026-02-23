import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";


export const registerUser = asyncHandler(async (req, res) => {
  
  const { userName, fullName, email, password } = req.body;

  if (!userName || !fullName || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }
  // using mongoose $or operator to check if email or username already exists
  // and User is the mongoose model for the user collection in the database
  const existingUser = await User.findOne({
    $or: [{ email }, { userName }]
  });

  if (existingUser) {
    throw new ApiError(400, "Email already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatarUrl = await uploadToCloudinary(avatarLocalPath);
  const coverImageUrl = await uploadToCloudinary(coverImageLocalPath);

  if (!avatarUrl) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    avatar: avatarUrl || null,
    coverImage: coverImageUrl || null
  });
  const createdUser = await User.findById(user._id).select("-password -refreshToken");
  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }
  return res.status(201).json(
    new ApiResponse(201, "User created successfully", createdUser);
  );
});