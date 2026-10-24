# P2P11

**Demo: https://p2p11.pages.dev**

A 1-to-1 video calling app that runs entirely in the browser and connects peers directly using WebRTC. The app itself is a single static `index.html` with no backend, plus a few small files (manifest, service worker, icons) that make it installable. It can be deployed to Cloudflare Pages, GitHub Pages, or any static hosting service.

## Features

- Direct 1-to-1 video and audio calls between two browsers
- One-click room creation, shared via link or room code
- Mute/unmute mic, turn camera on/off, hang up
- Switch camera, microphone and speaker during a call, even while connected
- Installable as an app (PWA) on phones and desktops, with its own icon and window; the page opens fast, but calls still need an internet connection
- Invite card in the middle of the screen while you wait for the other person: it shows the room link with **Share** (system share sheet, where the Web Share API exists) and **Copy** buttons, and disappears as soon as they join
- Text chat over the same peer-to-peer connection: messages go straight between the two browsers and are not stored anywhere, so history is lost when the page closes
- Screen sharing on desktop browsers: your screen replaces your camera for the other person, who sees it unmirrored so shared text stays readable; stop from the button or the browser's own "Stop sharing" bar
- Compact control bar: microphone, camera, chat, reactions and hang up stay in reach, while screen share, Picture-in-Picture, fullscreen, device selection and connection info live in a **More** (⋯) menu, which shows a red dot while you are sharing your screen
- Fullscreen and Picture-in-Picture (floating window) for the remote video, shown only where the browser supports them. On desktop Chrome/Edge the floating window uses the Document Picture-in-Picture API, so the mirror view carries over; other browsers use the standard video Picture-in-Picture, which cannot be mirrored
- Keeps the screen awake during a call (Screen Wake Lock), so phones and laptops don't dim or sleep mid-conversation
- Emoji reactions (👍 ❤️ 😂 😮 👏 🎉) that float up over the video, and a raise-hand button that shows a ✋ badge on your video for the other person; only emojis from a fixed list are accepted from the other side
- Speaking indicator and mic level: a small animated three-bar icon appears inside the video of whoever is talking (like Google Meet), and a level bar on the mic button shows your own volume (both are computed locally, nothing is sent)
- Call timer, plus a short chime when the other person joins and a lower one when they leave (can be turned off in the Devices panel)
- Mirror view for both your own video and the other person's video (display only, can be turned off in the Devices panel); your own preview shows the full camera frame without cropping
- Built-in connection info panel: connection path (LAN / direct / TURN), latency, resolution, frame rate, bitrate and packet loss
- Light/dark theme that follows the system setting, works on mobile
- Bilingual Vietnamese/English interface, chosen from the browser language with a language switch button
- No installation, no account, no build step

## How it works

1. The first person to enter a room registers the ID `p2p11-<room code>` on the [PeerJS](https://peerjs.com/) signaling server and waits.
2. If that ID is already taken, the later arrival becomes the guest and calls that ID.
3. Both sides exchange connection details (SDP, ICE) through the signaling server, then video and audio flow **directly** between the two browsers.

Media streams are always encrypted by WebRTC (DTLS-SRTP) and never pass through your own server. When both devices are on the same LAN, WebRTC will usually pick the direct LAN path automatically.

## Run locally

Browsers only allow camera/mic access on HTTPS or `localhost`, so serve the files with a local static server:

```bash
git clone https://github.com/dieudv/p2p11.git
cd p2p11
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
2. Go to Workers & Pages → Create → Pages → Connect to Git and select the `p2p11` repo.
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
- No room password yet
- Internet access is required to load the page and exchange signaling, even though the video itself may travel over the LAN

## Roadmap

- Longer room codes and optional room passwords
- Self-hosted signaling with Cloudflare Durable Objects (WebSocket)

## Checking which path a call uses

During a call, click **Info** in the control bar. The panel shows the connection path, latency, and the resolution, frame rate and bitrate of the video in both directions, refreshed every second. For deeper debugging you can still open `chrome://webrtc-internals` and look at the selected ICE candidate pair: `host` is a direct path on the same network, `srflx` goes through the public IP, and `relay` goes through TURN.

## License

Released under the [MIT License](LICENSE). You are free to use, copy, modify, merge, publish, distribute, sublicense and sell this project, for commercial or non-commercial purposes, as long as the copyright notice and license text are kept in copies or substantial portions of it.

The code is provided as is, without warranty. PeerJS is loaded from a CDN and is not part of this repository, it has its own license (also MIT).

## Install as an app (PWA)

Once the site is served over HTTPS, browsers that support installation offer it automatically:

- **Chrome / Edge (desktop and Android):** click the **Install as an app** button on the start screen, or use the install icon in the address bar.
- **iPhone / iPad:** open the site in Safari, tap Share, then **Add to Home Screen** (iOS has no install button, the start screen shows these steps).

Project files that make this work:

| File | Purpose |
| --- | --- |
| `manifest.webmanifest` | App name, colors, icons and display mode |
| `sw.js` | Service worker that caches the app shell (pages load network-first, so updates show up right away) |
| `icons/`, `icon.svg` | App icons, including a maskable icon for Android |
| `_headers` | Cloudflare Pages headers so the service worker is always revalidated |

The service worker never caches signaling traffic, so an installed app still needs internet to start a call. When you change the list of cached files in `sw.js`, bump `CACHE_VERSION`.

## Tech stack

- WebRTC (`getUserMedia`, `RTCPeerConnection`)
- [PeerJS](https://peerjs.com/) 1.5.4, loaded from jsDelivr
- Plain HTML, CSS and JavaScript, no framework