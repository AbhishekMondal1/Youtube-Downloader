const ytdl = require("ytdl-core");
const fs = require("fs");
const { chain } = require("lodash");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const sanitize = require("sanitize-filename");
const { nanoid } = require("nanoid");
const axios = require("axios");
const FormData = require("form-data");

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
    let videoStream, audioStream, onlyAudioStream;

    ytdl
        .getInfo(id)
        .then(({ videoDetails, formats }) => {
            const { title } = videoDetails;
            const filename = `${sanitize(title)}`;
            const streams = {};
            if (format === "video") {
                const resolution = parseInt(req.query.resolution);

                const availableResolutions = getResolutions(formats);

                if (!availableResolutions.includes(resolution)) {
                    return res
                        .status(400)
                        .end(new Error("Resolution is incorrect").toString());
                }
                const videoFormat = chain(formats)
                    .filter(function(formatItem) {
                        return formatItem.height === resolution && formatItem.codecs ?
                            formatItem.codecs.startsWith("avc1") :
                            false;
                    })
                    .orderBy("fps", "desc")
                    .value();

                if (videoFormat[0].itag) {
                    videoStream = ytdl(id, {
                        format: "mp4",
                        quality: videoFormat[0].itag,
                    }).pipe(
                        fs.createWriteStream(
                            `./video_audio_temp/${filename}-${nanoid(7)}.mp4`
                        )
                    );
                    audioStream = ytdl(id, { quality: "140" }).pipe(
                        fs.createWriteStream(
                            `./video_audio_temp/${filename}-${nanoid(7)}.mp3`
                        )
                    );
                }
            }
            if (format === "audio") {
                const audioQuality = parseInt(req.query.quality);
                formats.forEach((formatItem) => {
                    if (formatItem.audioBitrate === audioQuality) {
                        onlyAudioStream = ytdl(id, { quality: `${formatItem.itag}` }).pipe(
                            fs.createWriteStream(
                                `./video_audio_temp/${filename}-${nanoid(7)}.mp3`
                            )
                        );
                    }
                });
            }

            console.log(filename);
            videoStream &&
                videoStream.on("finish", function() {
                    let renderOutFile = `${filename}_${nanoid(7)}.mp4`;
                    const ffmpegProcess = spawn(ffmpegPath, [
                        "-i",
                        `${videoStream.path}`,
                        "-i",
                        `${audioStream.path}`,
                        "-c:v",
                        "copy",
                        "-c:a",
                        "copy",
                        `./video_audio_temp/${renderOutFile}`,
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
                            console.log(renderOutFile);
                            const form = new FormData();
                            form.append(
                                "singlefile",
                                fs.createReadStream(`./video_audio_temp/${renderOutFile}`),
                                `${renderOutFile}`
                            );

                            const response = axios.post(
                                `${process.env.VIDEO_HOST_SERVER_URL}/uploadfile`,
                                form, {
                                    headers: {
                                        ...form.getHeaders(),
                                    },
                                }
                            );

                            fs.unlink(videoStream.path, (err) => {
                                if (err) throw err;
                                console.log("temp file was deleted");
                            });

                            fs.unlink(audioStream.path, (err) => {
                                if (err) throw err;
                                console.log("temp file was deleted");
                            });

                            response.then((filenameResponse) => {
                                fs.unlink(`./video_audio_temp/${renderOutFile}`, (err) => {
                                    if (err) throw err;
                                    console.log("temp file was deleted");
                                });
                                res.send(filenameResponse.data);
                            });
                        }
                    });

                    res.on("close", () => ffmpegProcess.kill());
                });

            onlyAudioStream &&
                onlyAudioStream.on("finish", function() {
                    console.log(filename);
                    let renderOutFile = `${filename}_${nanoid(7)}.mp3`;
                    const ffmpegProcess = spawn(ffmpegPath, [
                        "-i",
                        `${onlyAudioStream.path}`,
                        "-ac",
                        "2",
                        `./video_audio_temp/${renderOutFile}`,
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
                            console.log(renderOutFile);
                            const form = new FormData();
                            form.append(
                                "singlefile",
                                fs.createReadStream(`./video_audio_temp/${renderOutFile}`),
                                `${renderOutFile}`
                            );

                            const response = axios.post(
                                `${process.env.VIDEO_HOST_SERVER_URL}/uploadfile`,
                                form, {
                                    headers: {
                                        ...form.getHeaders(),
                                    },
                                }
                            );

                            fs.unlink(onlyAudioStream.path, (err) => {
                                if (err) throw err;
                                console.log("temp file was deleted");
                            });

                            response.then((filenameResponse) => {
                                fs.unlink(`./video_audio_temp/${renderOutFile}`, (err) => {
                                    if (err) throw err;
                                    console.log("temp file was deleted");
                                });
                                res.send(filenameResponse.data);
                            });
                        }
                    });

                    res.on("close", () => ffmpegProcess.kill());
                });
        })
        .catch((err) => console.log(err));
}

export default validator(querySchema, handler);