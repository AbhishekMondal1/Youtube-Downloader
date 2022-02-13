const ytdl = require("ytdl-core");
const fs = require("fs");
const { chain } = require("lodash");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const sanitize = require("sanitize-filename");
const { nanoid } = require("nanoid");
import { validator } from "../../middlewares/validator";
import { querySchema } from "../../schema/querySchema";

const getResolutions = (formats) =>
    chain(formats)
    .filter("height")
    .map("height")
    .uniq()
    .orderBy(null, "desc")
    .value();

async function handler(req, res) {
    console.log("-req", req.query);
    const { id, format } = req.query;
    let vid, aud, onlyaudio;

    if (fs.existsSync("./public/video") === false) {
        fs.mkdirSync("./public/video");
    }

    ytdl
        .getInfo(id)
        .then(({ videoDetails, formats }) => {
            const { title } = videoDetails;
            const filename = `${sanitize(title)}`;
            const streams = {};
            if (format === "video") {
                const resolution = parseInt(req.query.resolution);

                const resolutions = getResolutions(formats);

                if (!resolutions.includes(resolution)) {
                    return res
                        .status(400)
                        .end(new Error("Resolution is incorrect").toString());
                }
                const videoFormat = chain(formats)
                    .filter(function(val) {
                        return val.height === resolution && val.codecs ?
                            val.codecs.startsWith("avc1") :
                            false;
                    })
                    .orderBy("fps", "desc")
                    .value();

                if (videoFormat[0].itag) {
                    vid = ytdl(id, { format: "mp4", quality: videoFormat[0].itag }).pipe(
                        fs.createWriteStream(`./public/video/${filename}-${nanoid(7)}.mp4`)
                    );
                    aud = ytdl(id, { quality: "140" }).pipe(
                        fs.createWriteStream(`./public/video/${filename}-${nanoid(7)}.mp3`)
                    );
                }
            }
            if (format === "audio") {
                const audioQuality = parseInt(req.query.quality);
                formats.forEach((formatVal) => {
                    if (formatVal.audioBitrate === audioQuality) {
                        onlyaudio = ytdl(id, { quality: `${formatVal.itag}` }).pipe(
                            fs.createWriteStream(
                                `./public/video/${filename}-${nanoid(7)}.mp3`
                            )
                        );
                    }
                });
            }

            console.log(filename);
            vid &&
                vid.on("finish", function() {
                    let optfile = `${filename}_${nanoid(7)}.mp4`;
                    const ffmpegProcess = spawn(ffmpegPath, [
                        "-i",
                        `${vid.path}`,
                        "-i",
                        `${aud.path}`,
                        "-c:v",
                        "copy",
                        "-c:a",
                        "copy",
                        `./public/video/${optfile}`,
                    ]);

                    ffmpegProcess.stdout.on("data", (data) => {
                        console.log(`stdout: ${data}`);
                    });

                    ffmpegProcess.stderr.on("data", (data) => {
                        console.log(`stderr: ${data}`);
                    });

                    ffmpegProcess.on("error", (error) => {
                        console.log(`error: ${error.message}`);
                    });

                    ffmpegProcess.on("close", (code) => {
                        console.log(`child process exited with code ${code}`);
                        if (code == 0) {
                            console.log(optfile);
                            fs.unlink(vid.path, (err) => {
                                if (err) throw err;
                                console.log("temp file was deleted");
                            });
                            fs.unlink(aud.path, (err) => {
                                if (err) throw err;
                                console.log("temp file was deleted");
                            });

                            res.send(optfile);
                        }
                    });

                    res.on("close", () => ffmpegProcess.kill());
                });

            onlyaudio &&
                onlyaudio.on("finish", function() {
                    console.log(filename);
                    let optfile = `${filename}_${nanoid(7)}.mp3`;
                    const ffmpegProcess = spawn(ffmpegPath, [
                        "-i",
                        `${onlyaudio.path}`,
                        "-ac",
                        "2",
                        `./public/video/${optfile}`,
                    ]);

                    ffmpegProcess.stdout.on("data", (data) => {
                        console.log(`stdout: ${data}`);
                    });

                    ffmpegProcess.stderr.on("data", (data) => {
                        console.log(`stderr: ${data}`);
                    });

                    ffmpegProcess.on("error", (error) => {
                        console.log(`error: ${error.message}`);
                    });

                    ffmpegProcess.on("close", (code) => {
                        console.log(`child process exited with code ${code}`);
                        if (code == 0) {
                            console.log(optfile);
                            fs.unlink(onlyaudio.path, (err) => {
                                if (err) throw err;
                                console.log("temp file was deleted");
                            });
                            res.send(optfile);
                        }
                    });

                    res.on("close", () => ffmpegProcess.kill());
                });
        })
        .catch((err) => console.log(err));
}

export default validator(querySchema, handler);