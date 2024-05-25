const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const path = require("path");

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");

// Mongo URI
const mongoURI = "mongodb://root:root1234@localhost:27017/videos?authSource=admin";

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});


// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: "uploads"
      };
      resolve(fileInfo);
    });
  }
});
const upload = multer({ storage });

// @route GET /
// @desc Loads form
app.get("/", (req, res) => {
  res.render("index");
});


// @route POST /upload
// @desc Uploads file to DB
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: req.file });
});

// @route GET /files
// @desc Display all files in JSON
app.get("/files", async (req, res) => {
  try {
    const files = await gfs.files.find().toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ err: "No files exist" });
    }
    return res.json(files);
  } catch (error) {
    return res.status(500).json({ err: error.message });
  }
  // await gfs.files.find().toArray((err, files) => {
  //   console.log("Inside gfs");
  //   if (!files || files.length === 0) {
  //     return res.status(404).json({ err: "No files exist" });
  //   }
  //   return res.json(files);
  // });
});


const port = 3000;

app.listen(port, () => console.log(`Server running on port ${port}`));


