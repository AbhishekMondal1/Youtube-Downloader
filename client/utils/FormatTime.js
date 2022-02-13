const msTimeFormat = (duration) => {
    duration = duration / 1000;
    let hrs = ~~(duration / 3600);
    let mins = ~~((duration % 3600) / 60);
    let secs = ~~duration % 60;
    let hmsTime = "";

    if (hrs > 0) {
        hmsTime += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }
    hmsTime += "" + mins + ":" + (secs < 10 ? "0" : "");
    hmsTime += "" + secs;

    return hmsTime;
};

export default msTimeFormat;