import { Router } from "express";
import { authenticateToken } from "../middleware/auth-middleware.js";
import { getAllCourses, getCourseById, uploadCourses } from "../controllers/course-controller.js";
import multer from "multer";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log("Multer fileFilter called");
    console.log("File info:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      encoding: file.encoding
    });
    
    // More lenient file filter - accept CSV by extension or MIME type
    if (file.originalname.toLowerCase().endsWith(".csv") || 
        file.mimetype === "text/csv" || 
        file.mimetype === "application/vnd.ms-excel" ||
        file.mimetype === "text/plain") {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed!"), false);
    }
  },
});


// GET /api/courses - Get all courses (with Redis caching)
router.get("/", authenticateToken, getAllCourses);

// GET /api/courses/:id - Get course by ID (with Redis caching)
router.get("/:id", authenticateToken, getCourseById);

// Add middleware to handle multer errors and log request
router.post("/upload", authenticateToken,(req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: "File too large! Maximum size is 10MB",
          });
        }
        return res.status(400).json({
          message: `Upload error: ${err.message}`,
        });
      }
      return res.status(400).json({
        message: err.message || "File upload error",
      });
    }
    next();
  });
}, uploadCourses);

export default router;
