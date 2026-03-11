import multer from "multer";

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "public/temp");
  },

  filename: function (_req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    cb(null, unique);
  },
});
 
const upload = multer({ storage: storage });
export default upload;

