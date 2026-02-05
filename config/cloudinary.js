import { v2 as cloudinary } from 'cloudinary';

// No need to configure cloudinary with api key, api secret, in v2 cloudinary auto configures from env variables

// Utility function to upload file to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};



//Delete files from cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
      return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
      console.error(`Error deleting Cloudinary file: ${err.message}`);
  }
};



export { uploadToCloudinary, deleteFromCloudinary };