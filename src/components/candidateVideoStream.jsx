import React, { useEffect, useRef } from "react";

const CandidateVideoStream = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      console.log("WebSocket connection established.");
      ws.send(JSON.stringify({ type: "candidate-video" }));
    };

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(videoTrack);

        // Send video frames to the server every 100ms
        setInterval(async () => {
          try {
            const imageBitmap = await imageCapture.grabFrame();
            const canvas = document.createElement("canvas");
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(imageBitmap, 0, 0);

            canvas.toBlob((blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onload = () => {
                  const frameData = reader.result;
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(
                      JSON.stringify({ type: "video-frame", frame: frameData })
                    );
                  }
                };
                reader.readAsDataURL(blob);
              }
            }, "image/jpeg");
          } catch (error) {
            console.error("Error capturing frame:", error);
          }
        }, 100);
      })
      .catch((error) => {
        console.error("Error accessing video stream:", error);
      });

    return () => {
      ws.close();
    };
  }, []);

  return <video ref={videoRef} autoPlay muted playsInline />;
};

export default CandidateVideoStream;
