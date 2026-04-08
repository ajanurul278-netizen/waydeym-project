// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAs1oJZ4j54b5ebis8HZwjppktLBzGQhhM",
    authDomain: "waydeym-project.firebaseapp.com",
    databaseURL: "https://waydeym-project-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "waydeym-project",
    storageBucket: "waydeym-project.firebasestorage.app",
    messagingSenderId: "529560163661",
    appId: "1:529560163661:web:bc534018a5933775151304"
};

// 1. Inisialisasi Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// 2. Setup Peta (Leaflet)
const map = L.map('map').setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const markers = {};

// 3. Fungsi Tombol Mulai Jejak (Kirim Data)
document.getElementById('btnStart').addEventListener('click', () => {
    const name = document.getElementById('username').value.trim();
    if (!name) return alert("Isi nama dulu!");

    if (navigator.geolocation) {
        document.getElementById('status').innerText = "Mencoba mengakses GPS...";
        
        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // Kirim data ke Firebase
            database.ref('locations/' + name).set({
                lat: lat,
                lng: lng,
                timestamp: Date.now()
            }).then(() => {
                document.getElementById('status').innerText = "Lokasi terkirim! Memantau...";
            }).catch((err) => {
                console.error("Gagal simpan ke Firebase:", err);
            });

            // Fokuskan peta ke lokasi pengirim
            map.setView([lat, lng], 15);
            
        }, (error) => {
            console.error("Kesalahan GPS:", error);
            document.getElementById('status').innerText = "Gagal GPS: " + error.message;
        }, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        });    
    } else {
        alert("Browser kamu tidak mendukung GPS.");
    }
});

// 4. Baca data dari Firebase (Tampilkan Marker Orang Lain)
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    for (let id in data) {
        const info = data[id];
        
        // Lewati jika data tidak memiliki koordinat lengkap
        if (!info.lat || !info.lng) continue;

        if (markers[id]) {
            // Jika marker sudah ada, update posisi
            markers[id].setLatLng([info.lat, info.lng]);
        } else {
            // Jika marker belum ada, buat baru
            const diamondIcon = L.divIcon({
                className: 'neon-marker',
                html: '◆', // Pastikan di CSS .neon-marker sudah diset ukurannya
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            markers[id] = L.marker([info.lat, info.lng], { icon: diamondIcon })
                .addTo(map)
                .bindPopup("Jejak: " + id);
            
            // Terbang ke lokasi marker baru
            map.flyTo([info.lat, info.lng], 15);
        }
    }
}, (error) => {
    console.error("Gagal baca database:", error);
});
