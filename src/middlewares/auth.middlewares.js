import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const verifyJwt = asyncHandler(async (req, _res, next) => {
  try {
    const token =
      req.cookies?.accessToken || req.get("Authorization")?.split(" ")[1];

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    req.user = user;
    next();
    
  } catch (error) {
    throw new ApiError(401, error.message || "Unauthorized request");
  }
});

export default verifyJwt;
