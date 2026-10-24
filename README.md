# p2p-live

**Demo: https://p2p-live.pages.dev**

A 1-to-1 video calling app that runs entirely in the browser and connects peers directly using WebRTC. The whole app is a single static `index.html` file with no backend, so it can be deployed to Cloudflare Pages, GitHub Pages, or any static hosting service.

## Features

- Direct 1-to-1 video and audio calls between two browsers
- One-click room creation, shared via link or room code
- Mute/unmute mic, turn camera on/off, hang up
- Switch camera, microphone and speaker during a call, even while connected
- Fullscreen and Picture-in-Picture (floating window) for the remote video, shown only where the browser supports them
- Built-in connection info panel: connection path (LAN / direct / TURN), latency, resolution, frame rate, bitrate and packet loss
- Light/dark theme that follows the system setting, works on mobile
- Bilingual Vietnamese/English interface, chosen from the browser language with a language switch button
- No installation, no account, no build step

## How it works

1. The first person to enter a room registers the ID `vcall-<room code>` on the [PeerJS](https://peerjs.com/) signaling server and waits.
2. If that ID is already taken, the later arrival becomes the guest and calls that ID.
3. Both sides exchange connection details (SDP, ICE) through the signaling server, then video and audio flow **directly** between the two browsers.

Media streams are always encrypted by WebRTC (DTLS-SRTP) and never pass through your own server. When both devices are on the same LAN, WebRTC will usually pick the direct LAN path automatically.

## Run locally

Browsers only allow camera/mic access on HTTPS or `localhost`, so serve the files with a local static server:

```bash
git clone https://github.com/<your-username>/p2p-live.git
cd p2p-live
python3 -m http.server 8080
```

Open `http://localhost:8080` in two tabs (or two browsers) to try it.

> To test between two different devices you need HTTPS. The easiest way is to deploy to Cloudflare Pages as described below.

## Deploy to Cloudflare Pages

**Option 1: Direct upload**

1. Go to Cloudflare Dashboard → Workers & Pages → Create → Pages → Upload assets.
2. Drag and drop the project folder (containing `index.html`) and click Deploy.

**Option 2: Connect GitHub**

1. Push the source code to GitHub.
2. Go to Workers & Pages → Create → Pages → Connect to Git and select the `p2p-live` repo.
3. Leave Build command empty, set Build output directory to `/`, then Save and Deploy.

After deploying, open the `*.pages.dev` link that Cloudflare gives you.

## TURN configuration (optional)

By default the app uses public STUN servers. When both users are on restrictive networks (mobile data, corporate networks, symmetric NAT), a direct P2P connection may fail. In that case, add a TURN server to `PEER_OPTS` in `index.html`:

```js
const PEER_OPTS = { config: { iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'turn:turn.example.com:3478', username: 'user', credential: 'pass' }
] } };
```

Note: TURN credentials placed in a static file are publicly visible. For a serious service, issue short-lived TURN credentials from a server-side API.

## Security and privacy

- Anyone with the link or room code can join the room. The room code is the only secret, so share it over a private channel.
- Each room admits only one guest. The host rejects a third person, who sees a "room is full" message. Anyone who enters before the intended guest can still get in with the room code, so keep the code private.
- The public PeerJS signaling server can see both parties' IP addresses and connection details, but not the video or audio.
- The two participants can learn each other's IP address. This is inherent to P2P unless TURN is used.

## Current limitations

- Only 2 participants per room
- Depends on PeerJS's free public signaling server, with no uptime guarantee
- No text chat, screen sharing, or room password yet
- Internet access is required to load the page and exchange signaling, even though the video itself may travel over the LAN

## Roadmap

- Longer room codes and optional room passwords
- Self-hosted signaling with Cloudflare Durable Objects (WebSocket)
- Text chat and screen sharing

## Checking which path a call uses

During a call, click **Info** in the control bar. The panel shows the connection path, latency, and the resolution, frame rate and bitrate of the video in both directions, refreshed every second. For deeper debugging you can still open `chrome://webrtc-internals` and look at the selected ICE candidate pair: `host` is a direct path on the same network, `srflx` goes through the public IP, and `relay` goes through TURN.

## Tech stack

- WebRTC (`getUserMedia`, `RTCPeerConnection`)
- [PeerJS](https://peerjs.com/) 1.5.4, loaded from jsDelivr
- Plain HTML, CSS and JavaScript, no framework