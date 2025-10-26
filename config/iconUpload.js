// minioにアイコン画像をアップロードしリンクを受信する
require('dotenv').config();
const multer = require('multer');
const messages = require('./message')
const {v4 : uuidv4} = require('uuid');
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');


const s3 = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT,
    forcePathStyle: true,
    region: 'ap-northeast-1',
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY_ID,
        secretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY,
    },
});

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('image/')) {
            callback(null, true);
        } else {
            callback(new Error(messages.ICON_UPLOAD.FILE_TYPE_VIOLATION), false);
        }
        if (file.fileSize < limits.fileSize) {
            callback(null, true);
        } else {
            callback(new Error(messages.ICON_UPLOAD.FILE_SIZE_VIOLATION), false)
        }
    }    
});

const uploadIconToMinio = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const file = req.file;
    const bucketName = "xdiary-icon";
    const minio_public_url = `${s3.endpoint}/${bucketName}`;

    try {
        const fileExtension = path.extname(iconFile.originalname);
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
        next(messages.ICON_UPLOAD.UPLOAD_ERROR, ":", err);
    }
};

module.exports = {
    upload,
    uploadIconToMinio
};






