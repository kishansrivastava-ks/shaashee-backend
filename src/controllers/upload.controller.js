// src/controllers/upload.controller.js
const cloudinary = require("../utils/cloudinary");

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

exports.uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const folder =
      process.env.CLOUDINARY_PRODUCTS_FOLDER || "shaashee-products";

    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, folder)
    );

    const results = await Promise.all(uploadPromises);

    // map Cloudinary results to what your product model expects
    const images = results.map((result, index) => ({
      url: result.secure_url,
      publicId: result.public_id,
      alt: req.body.alt || req.files[index]?.originalname || "",
      isPrimary: index === 0, // first image as primary by default
    }));

    res.status(201).json({
      message: "Images uploaded successfully",
      images,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    res
      .status(500)
      .json({ message: "Failed to upload images", error: error.message });
  }
};

const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};
