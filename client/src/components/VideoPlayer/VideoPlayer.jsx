import React, { useContext } from "react";

import { SocketContext } from "contexts/SocketContext";

const VideoPlayer = () => {
  const {
    call,
    callAccepted,
    callEnded,
    myVideo,
    userVideo,
    stream,
    name,
    callUser,
    setName,
    leaveCall,
    answerCall,
  } = useContext(SocketContext);
  return (
    <div style={{ display: "flex" }}>
      {stream && (
        <div>
          <h3>{name || "Name"}</h3>
          <video
            ref={myVideo}
            playsInline
            // muted
            autoPlay
            style={{ width: 400 }}
          />
        </div>
      )}
      {callAccepted && !callEnded && (
        <div>
          <h3>{call.name || "Call Name"}</h3>
          <video
            ref={userVideo}
            playsInline
            // muted
            autoPlay
            style={{ width: 400 }}
          />
        </div>
      )}
    </div>
  );
};
export default VideoPlayer;
