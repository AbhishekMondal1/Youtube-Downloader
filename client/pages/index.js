import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import axios from "axios";
import { nanoid } from "nanoid";
import formatBytes from "../utils/FormatBytes";
import msTimeFormat from "../utils/FormatTime";

export default function Home() {
  const [url, setUrl] = useState("");
  const [urlID, setUrlID] = useState("");
  const [videoDetails, setVideoDetails] = useState(null);
  const [isActive, setActive] = useState(1);
  const [left, setLeft] = useState(1);
  const [fileurl, setFileurl] = useState("");
  const downloadLink = useRef(null);

  const toggleClass = (index) => {
    setActive(index);
    setLeft(index);
  };

  useEffect(() => {
    let paramString = url.split("?")[1];
    let queryString = new URLSearchParams(paramString);
    for (let pair of queryString.entries()) {
      if (pair[0] == "v" && pair[1].length == 11) {
        setUrlID(pair[1]);
      }
    }
  }, [url, urlID]);

  const fetchData = async () => {
    const res = await axios.get(`/api/videodetails?id=${urlID}`);
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
      responseType: "json",
    }).then((res) => {
      setFileurl(res.data);
      downloadLink.current.click();
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
      responseType: "json",
    }).then((res) => {
      setFileurl(res.data);
      downloadLink.current.click();
    });
  };

  const downloadAudioHandle = async (e, quality) => {
    e.preventDefault();
    quality && downloadAudio(quality);
  };

  return (
    <>
      <Head>
        <title>Youtube Downloader</title>
      </Head>
      <div className={styles.d_flex}>
        <h1>Youtube Downloader</h1>
        <div className={styles.input_wrapper}>
          <input
            className={styles.input_btn}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className={styles.close_icon}
            type="reset"
            onClick={(e) => setUrl("")}
          ></button>
          <button
            className={styles.start_btn}
            onClick={(e) => fetchVideoInfo(e)}
          >
            Start
          </button>
        </div>
        <a
          ref={downloadLink}
          download
          href={`${process.env.NEXT_PUBLIC_VIDEO_HOST_SERVER_URL}/video/${fileurl}`}
          style={{ display: "none" }}
        >
          Download
        </a>
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
                      <div className={styles.format_flex} key={nanoid(5)}>
                        <p key={nanoid(5)}>{res.resolutions}p</p>
                        <p key={nanoid(5)}>{msTimeFormat(res.duration)}</p>
                        <p key={nanoid(5)}>{formatBytes(res.length)}</p>
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
                      <div className={styles.format_flex} key={nanoid(5)}>
                        <p key={nanoid(5)}>{res.quality}K</p>
                        <p key={nanoid(5)}>{msTimeFormat(res.duration)}</p>
                        <p key={nanoid(5)}>{formatBytes(res.length)}</p>
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
