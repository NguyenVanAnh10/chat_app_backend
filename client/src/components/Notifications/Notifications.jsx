import React, { useContext } from "react";

import { SocketContext } from "contexts/SocketContext";

const Notifications = () => {
  const { call, callAccepted, answerCall } = useContext(SocketContext);
  return (
    <div>
      a
      {call.isReceivedCall && !callAccepted && (
        <div>
          <h2>{call.name} is calling,</h2>
          <button onClick={answerCall}>Anwser</button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
