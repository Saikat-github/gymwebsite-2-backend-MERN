import multer from 'multer';

// Memory storage for Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 500 * 1024 // 500KB file size limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, JPG, and WEBP are allowed.'));
        }
    }
});

// Custom multi-upload middleware
const uploadUserFiles = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'aadhar', maxCount: 1 }
]);


export default uploadUserFiles; 