import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import axios from "axios";
import JsFileDownloader from "js-file-download";

export default function Home() {
  const [url, setUrl] = useState("");
  const [urlID, setUrlID] = useState("");
  const [videoDetails, setVideoDetails] = useState(null);
  const [isActive, setActive] = useState(1);
  const [left, setLeft] = useState(1);
  const [progress, setProgress] = useState(0);

  const toggleClass = (index) => {
    setActive(index);
    setLeft(index);
  };

  useEffect(() => {
    console.log("ueleff-", url);
    let paramString = url.split("?")[1];
    let queryString = new URLSearchParams(paramString);
    for (let pair of queryString.entries()) {
      if (pair[0] == "v" && pair[1].length == 11) {
        setUrlID(pair[1]);
      }
      console.log(urlID);
    }
  }, [url, urlID]);
  const fetchData = async () => {
    const res = await axios.get(`/api/videodetails?id=${urlID}`);
    console.log("res--", res.data);
    setVideoDetails(res.data);
  };

  const fetchVideoInfo = async (e) => {
    e.preventDefault();
    urlID && fetchData();
  };

  const downloadVideo = async (resolution) => {
    axios({
      url: `/api/download?id=${urlID}&format=video&resolution=${resolution}`,
      method: "GET",
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        let percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(percentCompleted);
      },
    }).then((res) => {
      console.log(res);
      for (const h in res.headers) {
        if (h == "content-disposition") {
          let filename = res.headers[h].split(" ")[1];
          console.log(filename);
        }
      }
      filename = decodeURI(filename.split("filename=")[1]);
      JsFileDownloader(res.data, filename);
    });
  };

  const downloadVideoHandle = async (e, resolution) => {
    e.preventDefault();
    resolution && downloadVideo(resolution);
  };

  const downloadAudio = async (quality) => {
    axios({
      url: `/api/download?id=${urlID}&format=audio&quality=${quality}`,
      method: "GET",
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        let percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(percentCompleted);
      },
    }).then((res) => {
      console.log(res);
      for (const h in res.headers) {
        if (h == "content-disposition") {
          let filename = res.headers[h].split(" ")[1];
          console.log(filename);
        }
      }
      filename = decodeURI(filename.split("filename=")[1]);
      filename = filename.slice(0, filename.length - 1);
      JsFileDownloader(res.data, filename);
    });
  };

  const downloadAudioHandle = async (e, quality) => {
    e.preventDefault();
    quality && downloadAudio(quality);
  };
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return "Unknown size";

    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

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

  return (
    <>
      <Head>
        <title>Youtube Downloader</title>
      </Head>
      <div className={styles.d_flex}>
        <h1>Youtube Downloader</h1>
        <input
          className={styles.input_btn}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button className={styles.start_btn} onClick={(e) => fetchVideoInfo(e)}>
          Start
        </button>
        {progress > 1 ? <Progress done={progress} /> : ""}
      </div>
      <div className={styles.video_main_section}>
        {videoDetails && (
          <div className={styles.videoDetails_container}>
            <Image
              src={videoDetails.thumbnailURL}
              alt="thumbnail"
              width={200}
              height={100}
            />
            <h2>{videoDetails.title}</h2>
            <h3>by {videoDetails.author.name}</h3>
          </div>
        )}
        {videoDetails && (
          <div className={styles.tabs}>
            <div className={styles.tab_header}>
              <div
                className={isActive === 1 ? `${styles.active}` : null}
                onClick={() => toggleClass(1)}
              >
                <i></i> Video
              </div>
              <div
                className={isActive === 2 ? `${styles.active}` : null}
                onClick={() => toggleClass(2)}
              >
                <i></i> Audio
              </div>
            </div>
            <div
              className={
                left === 1
                  ? `${styles.tab_indicator} ${styles.left25}`
                  : `${styles.tab_indicator} ${styles.left50}`
              }
            ></div>
            <div className={styles.tab_body}>
              <div
                className={isActive === 1 ? `${styles.active}` : null}
                onClick={() => toggleClass(1)}
              >
                {videoDetails && (
                  <div className={styles.d_flex}>
                    {videoDetails.videoFormats.map((res, i) => (
                      <div className={styles.format_flex} key={i}>
                        <p key={i * 20}>{res.resolutions}p</p>
                        <p key={i * 40}>{msTimeFormat(res.duration)}</p>
                        <p key={i * 60}>{formatBytes(res.length)}</p>
                        <button
                          className={styles.convert_btn}
                          onClick={(e) =>
                            downloadVideoHandle(e, res.resolutions)
                          }
                        >
                          Convert
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div
                className={isActive === 2 ? `${styles.active}` : null}
                onClick={() => toggleClass(2)}
              >
                {videoDetails && (
                  <div className={styles.d_flex}>
                    {videoDetails.audioFormats.map((res, i) => (
                      <div className={styles.format_flex} key={i}>
                        <p key={i * 20}>{res.quality}K</p>
                        <p key={i * 40}>{msTimeFormat(res.duration)}</p>
                        <p key={i * 60}>{formatBytes(res.length)}</p>
                        <button
                          className={styles.convert_btn}
                          onClick={(e) => downloadAudioHandle(e, res.quality)}
                        >
                          Convert
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const Progress = ({ done }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    const newStyle = {
      opacity: 1,
      width: `${done}%`,
    };
    setStyle(newStyle);
  }, [done]);
  console.log(done);

  return (
    <div className={styles.progress}>
      <div className={styles.progress_done} style={style}>
        {done}%
      </div>
    </div>
  );
};
