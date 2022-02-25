const ytdl = require("ytdl-core");
const { chain, last } = require("lodash");
import { idvalidator } from "../../middlewares/idvalidator";
import { idSchema } from "../../schema/idSchema";

const getResolutions = (formats) =>
  chain(formats)
    .filter("height")
    .map("height")
    .uniq()
    .orderBy(null, "desc")
    .value();

const handler = async (req, res) => {
  const { id } = req.query;
  console.log(id);

  try {
    const videoid = await ytdl.getURLVideoID(id);
    const videoInfo = await ytdl.getInfo(videoid);
    const { videoDetails, formats } = videoInfo;
    const { title, thumbnails, author } = videoDetails;
    const thumbnailURL = last(thumbnails).url;
    const resolutions = getResolutions(formats);
    console.log(title);
    let allFormats = [];
    let audioFormats = [];
    resolutions.forEach((resolutionVal) => {
      formats.forEach((formatVal) => {
        if (
          formatVal.height == resolutionVal &&
          (formatVal.codecs ? formatVal.codecs.startsWith("avc1") : false) &&
          formatVal.contentLength
        )
          allFormats.push({
            resolutions: `${resolutionVal}`,
            duration: `${formatVal.approxDurationMs}`,
            length: `${formatVal.contentLength}`,
          });
      });
    });

    const key = "resolutions";

    const videoFormats = [
      ...new Map(allFormats.map((item) => [item[key], item])).values(),
    ];

    formats.forEach((formatVal) => {
      if (formatVal.hasAudio === true && formatVal.hasVideo === false) {
        audioFormats.push({
          quality: `${formatVal.audioBitrate}`,
          duration: `${formatVal.approxDurationMs}`,
          length: `${formatVal.contentLength}`,
        });
      }
    });

    res.json({
      title,
      thumbnailURL,
      videoid,
      videoFormats,
      audioFormats,
      author,
    });
  } catch (err) {
    console.log(err);
    if (err) res.status(200).json({ validid: "false" });
  }
};

export default idvalidator(idSchema, handler);
