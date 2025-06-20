// backend/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: 'dzpfmcm55',
  api_key: '853729643472296',
  api_secret: process.env.CLOUDINARY_SECRET,
});

export default cloudinary;
