import "./main.css";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CameraIcon from "./icons/camera.png";
import MicIcon from "./icons/mic.png";
import LeaveIcon from "./icons/phone.png";

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};

const constraints = {
  video: {
    width: {
      min: 300,
      ideal: 1000,
      max: 1000,
    },
    height: {
      min: 480,
      ideal: 520,
      max: 520,
    },
  },
  audio: true,
};

const uid = String(Math.floor(Math.random() * 10000));

function App() {
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const peerConnection = useRef(null);

  const userOneVideo = useRef(null);
  const userTwoVideo = useRef(null);

  const client = useRef(null);
  const channel = useRef(null);

  const cameraBtnRef = useRef(null);
  const micBtnRef = useRef(null);

  const navigate = useNavigate();

  const createPeerConnection = async (memberId) => {
    peerConnection.current = new RTCPeerConnection(servers);

    remoteStream.current = new MediaStream();
    userTwoVideo.current.srcObject = remoteStream.current;
    userTwoVideo.current.style.display = "block";

    userOneVideo.current.classList.add("smallFrame");

    if (!localStream.current) {
      localStream.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      userOneVideo.current.srcObject = localStream.current;
    }

    // we're getting our tracks (video & audio), and setting them for the remote peer
    localStream.current.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream.current);
    });

    // Listening for remote peer to add tracks and add those tracks to remoteStream object
    peerConnection.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.current.addTrack(track);
      });
    };

    // setLocalDescription triggers generating ice candidates
    peerConnection.current.onicecandidate = async (event) => {
      if (event.candidate) {
        client.current.sendMessageToPeer(
          {
            text: JSON.stringify({
              type: "candidate",
              candidate: event.candidate,
            }),
          },
          memberId
        );
      }
    };
  };

  const createOffer = async (memberId) => {
    await createPeerConnection(memberId);

    //  actually creating offer
    let offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    client.current.sendMessageToPeer(
      { text: JSON.stringify({ type: "offer", offer: offer }) },
      memberId
    );
  };
  const createAnswer = async (memberId, offer) => {
    await createPeerConnection(memberId);

    await peerConnection.current.setRemoteDescription(offer);

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    client.current.sendMessageToPeer(
      { text: JSON.stringify({ type: "answer", answer: answer }) },
      memberId
    );
  };

  const addAnswer = async (answer) => {
    if (!peerConnection.current.currentRemoteDescription) {
      await peerConnection.current.setRemoteDescription(answer);
    }
  };

  const handleUserJoined = async (memberId) => {
    console.log("A new user joined the channel", memberId);
    createOffer(memberId);
  };

  const handleMessageFromPeer = async (message, memberId) => {
    const messageObj = JSON.parse(message.text);

    if (messageObj.type === "offer") {
      createAnswer(memberId, messageObj.offer);
    }

    if (messageObj.type === "answer") {
      addAnswer(messageObj.answer);
    }

    if (messageObj.type === "candidate") {
      if (peerConnection.current) {
        peerConnection.current.addIceCandidate(messageObj.candidate);
      }
    }
  };

  const leaveChannel = async () => {
    await channel.current.leave();
    await channel.current.logout();
  };

  const handleUserLeft = (memberId) => {
    if (userTwoVideo.current) {
      userTwoVideo.current.style.display = "none";
    }
    userOneVideo.current.classList.remove("smallFrame");
  };

  useEffect(() => {
    window.addEventListener("beforeunload", leaveChannel);
  }, []);

  useEffect(() => {
    const init = async () => {
      client.current = await window.AgoraRTM.createInstance(
        process.env.REACT_APP_AGORA_APP_ID
      );

      await client.current.login({ uid });

      const channelName = new URLSearchParams(window.location.search).get(
        "room"
      );

      if (!channelName) {
        return navigate("/");
      }

      channel.current = await client.current.createChannel(channelName);

      await channel.current.join();

      channel.current.on("MemberJoined", handleUserJoined);
      channel.current.on("MemberLeft", handleUserLeft);
      client.current.on("MessageFromPeer", handleMessageFromPeer);

      localStream.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      userOneVideo.current.srcObject = localStream.current;
    };

    init();
  }, []);

  const navigateToLobby = () => {
    leaveChannel();
    navigate("/");
  };

  const toggleCamera = async () => {
    let videoTrack = localStream.current
      .getTracks()
      .find((track) => track.kind === "video");

    if (videoTrack.enabled) {
      videoTrack.enabled = false;
      cameraBtnRef.current.style.backgroundColor = "rgb(255, 80, 80)";
    } else {
      videoTrack.enabled = true;
      cameraBtnRef.current.style.backgroundColor = "rgb(179, 102, 249, .9)";
    }
  };

  const toggleMic = async () => {
    let audioTrack = localStream.current
      .getTracks()
      .find((track) => track.kind === "audio");

    if (audioTrack.enabled) {
      audioTrack.enabled = false;
      micBtnRef.current.style.backgroundColor = "rgb(255, 80, 80)";
    } else {
      audioTrack.enabled = true;
      micBtnRef.current.style.backgroundColor = "rgb(179, 102, 249, .9)";
    }
  };

  return (
    <>
      <div id="videos">
        <video
          className="video-player"
          ref={userOneVideo}
          id="user-1"
          autoPlay
          playsInline
        ></video>
        <video
          className="video-player"
          ref={userTwoVideo}
          id="user-2"
          autoPlay
          playsInline
        ></video>
      </div>
      <div id="controls">
        <div
          className="control-container"
          onClick={toggleCamera}
          id="camera-btn"
          ref={cameraBtnRef}
        >
          <img src={CameraIcon} alt="Camera" />
        </div>

        <div
          className="control-container"
          id="mic-btn"
          ref={micBtnRef}
          onClick={toggleMic}
        >
          <img src={MicIcon} alt="Mic" />
        </div>

        <div
          className="control-container"
          id="leave-btn"
          onClick={navigateToLobby}
        >
          <img src={LeaveIcon} alt="Leave" />
        </div>
      </div>
    </>
  );
}

export default App;
