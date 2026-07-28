# vue-leaflet
# Thời gian hoàn thành dự kiến: 22/07/2026 (Thứ 4 tuần sau)


## Giới thiệu project

Project xây dựng bản đồ dựa trên framework Vue để thể hiện map một cách trực quan, app được build trên công cụ Vite. Các dependency chính được sử dụng bao gồm:

* **Leaflet**: Để xây dựng / hiển thị bản đồ.
* **MapTiler**: Cung cấp tile bản đồ và công cụ geocoding (mã hoá tên địa điểm thành toạ độ) cho Leaflet.

## Hướng dẫn xây dựng dự án

### Bước 1/ Thiết lập dự án

* Chạy lệnh: `npm create vite@latest <tên project>`
* Cài đặt các dependency có sẵn của npm, chạy lệnh: `npm install`

### Bước 2/ Những dependency cần cài đặt

* Cài đặt leaflet:
  ```bash
  npm install leaflet
  npm install -D @types/leaflet
  ```
* Cài đặt các dependency còn lại:
  ```bash
  npm install "@maptiler/geocoding-control" "@maptiler/sdk" "@vue-leaflet/vue-leaflet"
  ```

### Bước 3/ Thiết lập map

Import CSS của Leaflet ở entry point (`src/main.ts`) — thiếu bước này bản đồ sẽ render bị vỡ tile:
```ts
import 'leaflet/dist/leaflet.css'
```

Khởi tạo bản đồ và gắn tile layer của MapTiler trong component (`onMounted` để đảm bảo phần tử `#map` đã có trong DOM):
```ts
map = L.map('map').setView([startLat, startLng], 18);
L.tileLayer(`https://api.maptiler.com/maps/streets-v4/{z}/{x}/{y}.png?key=${maptilerKey}`, {
  tileSize: 512,
  zoomOffset: -1,
  minZoom: 1,
  attribution: '&copy; MapTiler &copy; OpenStreetMap contributors',
  crossOrigin: true
}).addTo(map);
```

### Bước 4/ Thiết lập geocoding để mã hoá dữ liệu từ tên địa điểm thành toạ độ trên bản đồ

Cấu hình API Key của MapTiler (lấy từ biến môi trường `VITE_MAPTILER_API_KEY` trong file `.env`, biến phải có tiền tố `VITE_` để Vite expose ra client):
```ts
const maptilerKey = import.meta.env.VITE_MAPTILER_API_KEY;
config.apiKey = maptilerKey;
```

Gọi geocoding để chuyển tên địa điểm thành toạ độ `[lng, lat]`:
```ts
const center = await geocoding.forward("273 Điện Biên Phủ, Phường Xuân Hòa, Thành phố Hồ Chí Minh.");
const [centerLng, centerLat] = center.features[0].center;
```

### Bước 5/ Thêm marker icon cho điểm center, thêm các hiệu ứng flyTo,...

Định nghĩa icon tuỳ chỉnh cho marker (ảnh icon cần được `import` để Vite resolve đúng đường dẫn):
```ts
import officeIcon from '../assets/office-building.png'

var marker = L.icon({
  iconUrl: officeIcon,
  iconSize: [25, 40],
  shadowSize: [50, 64],
  iconAnchor: [22, 94],
  shadowAnchor: [4, 62],
  popupAnchor: [-3, -76]
});
```

Áp dụng hiệu ứng `flyTo` để bản đồ tự động bay/zoom tới toạ độ trung tâm, và gắn marker tại toạ độ đó:
```ts
map.flyTo([centerLat, centerLng]);
L.marker([centerLat, centerLng], { icon: marker }).addTo(map).bindPopup("Sở Khoa học Công nghệ");
```
