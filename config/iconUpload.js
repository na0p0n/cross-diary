// minioにアイコン画像をアップロードしリンクを受信する
require('dotenv').config();
const multer = require('multer');
const messages = require('./message');
const {v4 : uuidv4} = require('uuid');
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');
const path = require('path');

const s3 = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT,
    forcePathStyle: true,
    region: 'ap-northeast-1',
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY_ID,
        secretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY,
    },
});
const fileLimits = { fileSize: 5 * 1024 * 1024 };
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: fileLimits,
    fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('image/')) {
            callback(null, true);
        } else {
            callback(new Error(messages.ICON_UPLOAD.FILE_TYPE_VIOLATION), false);
        }
    }    
});

const uploadIconToMinio = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const file = req.file;
    const bucketName = "xdiary-icon";
    const minio_public_url = `${process.env.MINIO_ENDPOINT}/${bucketName}`;

    try {
        const fileExtension = path.extname(file.originalname);
        const objectName = `${uuidv4()}${fileExtension}`;
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: objectName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        });
        await s3.send(command);
        const imageUrl = `${minio_public_url}/${objectName}`;

        req.body.iconUrl = imageUrl;

        next();
    } catch (err) {
        console.error(messages.ICON_UPLOAD.UPLOAD_ERROR, ":", err);
        err.message = messages.ICON_UPLOAD.UPLOAD_ERROR;
        next(err);
    }
};

module.exports = {
    upload,
    uploadIconToMinio
};
