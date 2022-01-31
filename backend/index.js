const ytdl = require("ytdl-core");
const express = require("express");
const fs = require("fs");
const PORT = 5000;

const app = express();

app.get("/", (req, res) => {
    res.send("Welcome to Youtube downloader. 📁");
})

const info = async(url) => {
    const videoInfo = await ytdl.getBasicInfo(url);
    console.log('data');
    return videoInfo;
}

app.get("/download-video", (req, res) => {
    try {
        const url = req.query.url;
        if (!ytdl.validateURL(url)) {
            return res.sendStatus(400);
        }
        info(url);
        ytdl(url, { format: 'mp4', }).pipe(res);
    } catch (error) {
        console.log(`🚫 ${error}`);
    }

})
app.listen(PORT, () => { console.log(`🚀 server running at port: ${PORT} ✅`) })