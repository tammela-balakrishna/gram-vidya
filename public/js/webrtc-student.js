document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startViewing");
  const remoteVideo = document.getElementById("remoteVideo");
  const socket = io("http://localhost:5000");
  let pc;

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
      pc = new RTCPeerConnection({ iceServers });

      pc.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
      };

      pc.onicecandidate = event => {
        if (event.candidate) {
          socket.emit("webrtcIceCandidate", { target: "broadcaster", candidate: event.candidate });
        }
      };

      socket.on("webrtcOffer", async ({ offer }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtcAnswer", { answer });
      });

      socket.on("webrtcIceCandidate", async ({ candidate }) => {
        if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.emit("joinBroadcast");
      console.log("👀 Joined broadcast!");

    } catch (err) {
      console.error("❌ Viewer error:", err);
      alert("Cannot join broadcast. Check console for details.");
    }
  });
});
