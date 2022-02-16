const express = require("express");
const cors = require("cors");
const multer = require("multer");
const app = express();
const PORT = process.env.PORT || 8000;

require("dotenv").config();
app.use(cors());
app.use("/video", express.static("video"));

const fileStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.STORAGE_PATH);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage: fileStorageEngine });

app.get("/", (req, res) => {
    res.send("Hello");
});

app.post("/uploadfile", upload.single("singlefile"), (req, res) => {
    res.send(req.file.filename);
});

app.listen(PORT, () => {
    console.log(`server running at ${PORT}`);
});