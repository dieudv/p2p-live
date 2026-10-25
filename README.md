# P2P11

**Demo: https://p2p11.pages.dev**

A 1-to-1 video calling app that runs entirely in the browser and connects peers directly using WebRTC. The app itself is a single static `index.html` with no backend, plus a few small files (manifest, service worker, icons) that make it installable. It can be deployed to Cloudflare Pages, GitHub Pages, or any static hosting service.

## Features

- Direct 1-to-1 video and audio calls between two browsers
- One-click room creation, shared via link or room code
- Optional room password: only people who know it can join, even if they have the link. The password is never sent over the network and is not part of the link
- Mute/unmute mic, turn camera on/off, hang up
- Switch camera, microphone and speaker during a call, even while connected
- Outgoing video quality: Auto, High (720p), Medium (480p), Low (360p) or Data saver (240p), chosen in the Devices panel; it caps the resolution, bitrate and frame rate you send, and the Info panel shows the effect
- Drag and drop and resizing: move your own video and the Watch together window anywhere on the screen, and resize them by dragging a corner (mouse, touch, or the arrow keys and +/- when focused); double-click to put them back. The YouTube window cannot go below 240px wide, because YouTube requires its player area to be at least 200x200px and forbids drawing anything over the player, so its resize grip sits in a strip below the video
- Quick front/back camera switch: a small button on your own video (shown when the device has more than one camera) flips between the front and rear cameras of a phone; the rear camera preview is never mirrored
- Flashlight: with the rear camera, a small button on your own video turns the phone's flash on as a continuous light. It appears only where the browser exposes it (mostly Chrome/Edge on Android); iPhones and iPads do not allow websites to use the flash. The light turns off when you switch camera, turn the camera off or start sharing your screen
- Installable as an app (PWA) on phones and desktops, with its own icon and window; the page opens fast, but calls still need an internet connection
- Invite card in the middle of the screen while you wait for the other person: it shows the room link with **Share** (system share sheet, where the Web Share API exists) and **Copy** buttons, and disappears as soon as they join
- Text chat over the same peer-to-peer connection: messages go straight between the two browsers and are not stored anywhere, so history is lost when the page closes
- Screen sharing on desktop browsers: your screen replaces your camera for the other person, who sees it unmirrored so shared text stays readable; stop from the button or the browser's own "Stop sharing" bar
- Watch together: paste a YouTube link and both of you watch the same video in sync (play, pause and seeking are shared). It uses YouTube's embedded player on each device, so no audio goes through the call, it works on phones, and there is no echo. The YouTube player is only loaded when someone uses this feature, from the privacy-enhanced `youtube-nocookie.com` domain. Limits: single videos only (no playlists), videos that disallow embedding cannot be played, and ads are played separately on each side so the two can drift for a moment
- Tab audio with screen sharing (Chrome/Edge desktop): when you share a browser tab you can include its sound, mixed with your microphone. System audio is deliberately not offered, because it contains the other person's voice and would be sent straight back to them as an echo; this tab cannot be shared for the same reason. The shared tab is muted on your own device by default (can be changed in the Devices panel), which avoids a second echo through your microphone, so use headphones if you want to hear it yourself
- Compact control bar: microphone, camera, chat, reactions and hang up stay in reach, while screen share, Picture-in-Picture, fullscreen, device selection and connection info live in a **More** (⋯) menu, which shows a red dot while you are sharing your screen
- Fullscreen and Picture-in-Picture (floating window) for the remote video, shown only where the browser supports them. On desktop Chrome/Edge the floating window uses the Document Picture-in-Picture API, so the mirror view carries over; other browsers use the standard video Picture-in-Picture, which cannot be mirrored
- Keeps the screen awake during a call (Screen Wake Lock), so phones and laptops don't dim or sleep mid-conversation
- Emoji reactions (👍 👎 ❤️ 😂 😮 😢 👏 🎉) that float up over the video, and a raise-hand button that shows a ✋ badge on your video for the other person; only emojis from a fixed list are accepted from the other side
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

- Without a password, anyone with the link or room code can join the room, so share it over a private channel. With a room password, the link alone is not enough.
- Room password: the host sends the joiner a random challenge, the joiner answers with a keyed hash (HMAC-SHA-256) made from the password stretched with PBKDF2 (150,000 rounds), and the host then proves it knows the password too, so a fake room cannot pass for the real one. Each joiner gets 3 tries per connection and 5 failures in total lock the room for 30 seconds, doubling each time up to 10 minutes. Choose a password that is hard to guess, because a short one can still be guessed by trying; send it separately from the link. It needs HTTPS (the Web Crypto API).
- Each room admits only one guest. The host rejects a third person, who sees a "room is full" message. Without a password, anyone who enters before the intended guest can still get in with the room code; a room password prevents that.
- The public PeerJS signaling server can see both parties' IP addresses and connection details, but not the video or audio.
- The two participants can learn each other's IP address. This is inherent to P2P unless TURN is used.

## Current limitations

- Only 2 participants per room
- Depends on PeerJS's free public signaling server, with no uptime guarantee
- Internet access is required to load the page and exchange signaling, even though the video itself may travel over the LAN

## Roadmap

- Longer room codes
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