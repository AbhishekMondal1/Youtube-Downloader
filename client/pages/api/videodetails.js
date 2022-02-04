const ytdl = require("ytdl-core");
const { chain, last } = require('lodash');
import { idvalidator } from '../middlewares/idvalidator';
import { idSchema } from '../schema/idSchema';


const getResolutions = formats =>
    chain(formats)
    .filter('height')
    .map('height')
    .uniq()
    .orderBy(null, 'desc')
    .value();

const handler = (req, res) => {
    const { id } = req.query;
    console.log(id);

    ytdl.getInfo(id)
        .then(({ videoDetails, formats }) => {
            const { title, thumbnails } = videoDetails
            const thumbnailURL = last(thumbnails).url;
            const resolutions = getResolutions(formats)
            console.log(title);
            res.json({ title, thumbnailURL, resolutions });
        })
        .catch(err => console.log(err));
}

export default idvalidator(idSchema, handler);