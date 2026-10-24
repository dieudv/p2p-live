# p2p-live

**Tiếng Việt** | [English](README.md)

**Demo: https://p2p-live.pages.dev**

Ứng dụng gọi video 1–1 chạy ngay trên trình duyệt, kết nối ngang hàng (peer-to-peer) bằng WebRTC. Toàn bộ ứng dụng là một file `index.html` tĩnh, không cần backend, deploy được lên Cloudflare Pages, GitHub Pages hoặc bất kỳ dịch vụ hosting tĩnh nào.

## Tính năng

- Gọi video và âm thanh 1–1 trực tiếp giữa hai trình duyệt
- Tạo phòng bằng một cú nhấp, chia sẻ qua link hoặc mã phòng
- Tắt/bật mic, tắt/bật camera, kết thúc cuộc gọi
- Giao diện tự chuyển sáng/tối theo hệ thống, dùng được trên điện thoại
- Không cần cài đặt, không cần tài khoản, không có bước build

## Cách hoạt động

1. Người đầu tiên vào một phòng sẽ đăng ký ID `vcall-<mã phòng>` trên máy chủ báo hiệu của [PeerJS](https://peerjs.com/) và chờ.
2. Nếu ID đã có người dùng, người vào sau trở thành khách và gọi tới ID đó.
3. Hai bên trao đổi thông tin kết nối (SDP, ICE) qua máy chủ báo hiệu, sau đó video và âm thanh đi **trực tiếp** giữa hai trình duyệt.

Luồng media được WebRTC mã hóa bắt buộc (DTLS-SRTP) và không đi qua máy chủ của bạn. Khi hai máy cùng mạng LAN, WebRTC thường tự chọn đường LAN trực tiếp.

## Chạy thử trên máy

Vì trình duyệt chỉ cho phép truy cập camera/mic trên HTTPS hoặc `localhost`, hãy chạy một server tĩnh cục bộ:

```bash
git clone https://github.com/<tai-khoan-cua-ban>/p2p-live.git
cd p2p-live
python3 -m http.server 8080
```

Mở `http://localhost:8080` ở hai tab (hoặc hai trình duyệt) để thử.

> Muốn thử giữa hai thiết bị khác nhau thì cần HTTPS, cách đơn giản nhất là deploy lên Cloudflare Pages như bên dưới.

## Deploy lên Cloudflare Pages

**Cách 1: Upload trực tiếp**

1. Vào Cloudflare Dashboard → Workers & Pages → Create → Pages → Upload assets.
2. Kéo thả thư mục dự án (chứa `index.html`) rồi bấm Deploy.

**Cách 2: Kết nối GitHub**

1. Đẩy mã nguồn lên GitHub.
2. Vào Workers & Pages → Create → Pages → Connect to Git, chọn repo `p2p-live`.
3. Để trống Build command, đặt Build output directory là `/`, rồi Save and Deploy.

Sau khi deploy, mở link `*.pages.dev` mà Cloudflare cấp.

## Cấu hình TURN (tùy chọn)

Mặc định ứng dụng dùng STUN công cộng. Khi hai người ở mạng khắt khe (4G, mạng công ty, NAT đối xứng), kết nối P2P có thể thất bại. Khi đó hãy thêm máy chủ TURN vào `PEER_OPTS` trong `index.html`:

```js
const PEER_OPTS = { config: { iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'turn:turn.example.com:3478', username: 'user', credential: 'pass' }
] } };
```

Lưu ý: thông tin đăng nhập TURN đặt trong file tĩnh sẽ lộ công khai. Với dịch vụ nghiêm túc, hãy cấp thông tin TURN tạm thời từ một API phía máy chủ.

## Bảo mật và quyền riêng tư

- Ai có link hoặc mã phòng đều có thể vào phòng. Mã phòng là bí mật duy nhất, hãy chia sẻ qua kênh riêng tư.
- Người chủ phòng hiện tự động nhận mọi cuộc gọi đến, chưa giới hạn ở một người.
- Máy chủ báo hiệu công cộng của PeerJS thấy được địa chỉ IP và thông tin kết nối của hai bên, nhưng không thấy video hay âm thanh.
- Hai người trong cuộc gọi có thể biết IP của nhau, đây là bản chất của P2P (trừ khi dùng TURN).

## Giới hạn hiện tại

- Chỉ hỗ trợ 2 người mỗi phòng
- Phụ thuộc máy chủ báo hiệu miễn phí của PeerJS, không có cam kết về độ ổn định
- Chưa có chat văn bản, chia sẻ màn hình hay mật khẩu phòng
- Cần internet để tải trang và trao đổi báo hiệu, dù luồng video có thể đi qua LAN

## Hướng phát triển

- Chủ phòng chỉ nhận một cuộc gọi, từ chối người thứ ba
- Mã phòng dài hơn và mật khẩu phòng tùy chọn
- Tự dựng signaling bằng Cloudflare Durable Objects (WebSocket)
- Chat văn bản và chia sẻ màn hình

## Kiểm tra kết nối đang đi đường nào

Trong lúc gọi, mở `chrome://webrtc-internals` và xem cặp ICE candidate được chọn: `host` là đường LAN trực tiếp, `srflx` là qua IP công cộng, `relay` là qua TURN.

## Công nghệ

- WebRTC (`getUserMedia`, `RTCPeerConnection`)
- [PeerJS](https://peerjs.com/) 1.5.4, tải qua jsDelivr
- HTML, CSS và JavaScript thuần, không framework
