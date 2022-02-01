const ytdl = require("ytdl-core");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
const PORT = 5000;

const app = express();

app.use(cors());

app.get("/", (req, res) => {
    res.send("Welcome to Youtube downloader. 📁");
})

const info = async(url) => {
    const videoInfo = await ytdl.getBasicInfo(url);
    console.log(videoInfo);
    console.log('fetched info 🗒️');
    return videoInfo;
}

app.get("/download-audio", async(req, res) => {
    try {
        const url = req.query.url;
        if (!ytdl.validateURL(url)) {
            return res.sendStatus(400);
        }
        let title = 'audio';
        const videoInfo = await info(url);
        if (videoInfo) {
            title = videoInfo.videoDetails.title;
            console.log(title);
        }
        res.header("Content-Disposition", `attachment; filename="${title}.mp3`);
        const file = ytdl(url, { format: 'mp3', filter: 'audioonly' }).pipe(res);
        file.on('finish', () => {
            console.log('file send successfully 💯');
        })
    } catch (error) {
        console.log(`🚫 ${error}`);
    }
})

app.get("/download-video", async(req, res) => {
    try {
        const url = req.query.url;
        if (!ytdl.validateURL(url)) {
            return res.sendStatus(400);
        }
        let title = 'video';
        const videoInfo = await info(url);
        if (videoInfo) {
            title = videoInfo.videoDetails.title;
            console.log(title);
        }
        res.header("Content-Disposition", `attachment; filename="${title}.mp4"`)
        const file = ytdl(url, { format: 'mp4', quality: '22', }).pipe(res);
        file.on('finish', () => {
            console.log('file send successfully 💯');
        })
    } catch (error) {
        console.log(`🚫 ${error}`);
    }

})
app.listen(PORT, () => { console.log(`🚀 server running at port: ${PORT} ✅`) })