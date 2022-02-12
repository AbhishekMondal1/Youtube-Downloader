const ytdl = require("ytdl-core");
const fs = require("fs");
const { chain } = require("lodash");
const { spawn } = require("child_process");
const ffmpegPath = require("ffmpeg-static");
const sanitize = require("sanitize-filename");
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
    ytdl
        .getInfo(id)
        .then(({ videoDetails, formats }) => {
            const { title } = videoDetails;
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

                console.log("vfmt", videoFormat);
                console.log("itag--", videoFormat[0].itag);
                if (videoFormat[0].itag) {
                    vid = ytdl(id, { format: "mp4", quality: videoFormat[0].itag }).pipe(
                        fs.createWriteStream(`./public/${title}-${Date()}.mp4`)
                    );
                    aud = ytdl(id, { quality: "140" }).pipe(
                        fs.createWriteStream(`./public/${title}-${Date()}.mp3`)
                    );
                }
            }
            if (format === "audio") {
                const audioQuality = parseInt(req.query.quality);
                formats.forEach((formatVal) => {
                    if (formatVal.audioBitrate === audioQuality) {
                        onlyaudio = ytdl(id, { quality: `${formatVal.itag}` }).pipe(
                            fs.createWriteStream(`./public/${title}-${Date()}.mp3`)
                        );
                    }
                });
            }

            const exts = {
                video: "mp4",
                audio: "mp3",
            };

            const contentTypes = {
                video: "video/mp4",
                audio: "audio/mpeg",
            };

            const ext = exts[format];
            const contentType = contentTypes[format];
            const filename = `${encodeURI(sanitize(title))}`; //.${ext}`;

            // res.setHeader("Content-Type", contentType);
            // res.setHeader(
            //     "Content-Disposition",
            //     `attachment; filename=${filename}; filename*=utf-8''${filename}`
            // );
            console.log(filename);
            vid &&
                vid.on("finish", function() {
                    let optfile = `${filename}_${Date.now()}.mp4`;
                    const ffmpegProcess = spawn(ffmpegPath, [
                        "-i",
                        `${vid.path}`,
                        "-i",
                        `${aud.path}`,
                        "-c:v",
                        "copy",
                        "-c:a",
                        "copy",
                        `./public/${optfile}`,
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
                            const outvid = fs.createReadStream(`./public/${optfile}`);
                            const stat = fs.statSync(`./public/${optfile}`);
                            const fileSize = stat.size;
                            res.writeHead(200, { "Content-Length": fileSize });
                            // outvid.pipe(res);
                            console.log("----------------.................---");
                            console.log(outvid);
                            res.pipe(outvid);
                            outvid.on("end", () => {
                                console.log("file send successfully 💯");
                            });
                        }
                    });

                    res.on("close", () => ffmpegProcess.kill());
                });

            onlyaudio &&
                onlyaudio.on("finish", function() {
                    console.log(filename);
                    let optfile = `${filename}_${Date.now()}.mp3`;
                    const ffmpegProcess = spawn(ffmpegPath, [
                        "-i",
                        `${onlyaudio.path}`,
                        "-ac",
                        "2",
                        `./public/${optfile}`,
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
                            res.send(optfile);
                            // const outaudio = fs.createReadStream(`./public/${optfile}`);
                            // const stat = fs.statSync(`./public/${optfile}`);
                            // const fileSize = stat.size;
                            // res.writeHead(200, { "Content-Length": fileSize });
                            // outaudio.pipe(res);
                            // outaudio.on("end", () => {
                            //     console.log("file send successfully 💯");
                            //     fs.unlink(`./public/${optfile}`, (err) => {
                            //         if (err) throw err;
                            //         console.log("output file was deleted");
                            //     });
                            //     console.log(onlyaudio.path);
                            //     fs.unlink(onlyaudio.path, (err) => {
                            //         if (err) throw err;
                            //         console.log("temp file was deleted");
                            //     });
                            // });
                        }
                    });

                    res.on("close", () => ffmpegProcess.kill());
                });
        })
        .catch((err) => console.log(err));
}

export default validator(querySchema, handler);