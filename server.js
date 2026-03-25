const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

let videos = [];

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: "video" },
      (error, result) => {
        if (error) return res.status(500).json(error);

        const video = {
          id: Date.now(),
          title: req.body.title,
          url: result.secure_url,
          likes: 0,
          dislikes: 0,
          comments: []
        };

        videos.push(video);
        res.json(video);
      }
    );

    result.end(req.file.buffer);

  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/videos", (req, res) => {
  res.json(videos);
});

app.post("/react/:id", (req, res) => {
  const video = videos.find(v => v.id == req.params.id);
  if (!video) return res.sendStatus(404);

  if (req.body.type === "like") video.likes++;
  if (req.body.type === "dislike") video.dislikes++;

  res.json(video);
});

app.post("/comment/:id", (req, res) => {
  const video = videos.find(v => v.id == req.params.id);
  if (!video) return res.sendStatus(404);

  video.comments.push(req.body.text);
  res.json(video);
});

app.use(express.static("public"));

app.listen(3000, () => console.log("Server running"));
