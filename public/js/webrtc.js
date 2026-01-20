document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBroadcast");
  const localVideo = document.getElementById("localVideo");
  const API_BASE = window.API_BASE || "";
  const socket = API_BASE ? io(API_BASE) : io();
  const peers = {};

  // ICE servers (STUN + Metered TURN)
  const iceServers = [
    { urls: "stun:stun.relay.metered.ca:80" },
    {
      urls: "turn:in.relay.metered.ca:80",
      username: "6340b2707570761567534298",
      credential: "ohJ94FeNH43pZv8a",
    },
    {
      urls: "turn:in.relay.metered.ca:80?transport=tcp",
      username: "6340b2707570761567534298",
      credential: "ohJ94FeNH43pZv8a",
    },
    {
      urls: "turn:in.relay.metered.ca:443",
      username: "6340b2707570761567534298",
      credential: "ohJ94FeNH43pZv8a",
    },
    {
      urls: "turns:in.relay.metered.ca:443?transport=tcp",
      username: "6340b2707570761567534298",
      credential: "ohJ94FeNH43pZv8a",
    },
  ];

  startBtn.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = stream;

      socket.emit("startBroadcast");
      console.log("🎬 Broadcast started!");

      socket.on("viewerJoined", async ({ viewerId }) => {
        console.log("👀 Viewer joined:", viewerId);

        const pc = new RTCPeerConnection({ iceServers });
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = event => {
          if (event.candidate) {
            socket.emit("webrtcIceCandidate", { target: viewerId, candidate: event.candidate });
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtcOffer", { target: viewerId, offer });

        peers[viewerId] = pc;
      });

      socket.on("webrtcAnswer", async ({ viewerId, answer }) => {
        const pc = peers[viewerId];
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on("webrtcIceCandidate", async ({ viewerId, candidate }) => {
        const pc = peers[viewerId];
        if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.on("viewerDisconnected", ({ viewerId }) => {
        if (peers[viewerId]) {
          peers[viewerId].close();
          delete peers[viewerId];
          console.log("❌ Viewer disconnected:", viewerId);
        }
      });

    } catch (err) {
      console.error("❌ getUserMedia error:", err);
      alert("Cannot access camera/mic. Check permissions!");
    }
  });
});
