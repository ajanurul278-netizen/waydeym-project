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

// Inisialisasi Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// Inisialisasi Peta (Default Jakarta)
const map = L.map('map', { zoomControl: false }).setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const markers = {};

// 1. Fungsi Mengirim Lokasi (Mulai Jejak)
document.getElementById('btnStart').addEventListener('click', function() {
    const name = document.getElementById('username').value.trim();
    if (!name) return alert("Masukkan nama Anda terlebih dahulu!");

    if (navigator.geolocation) {
        document.getElementById('status').innerText = "Menghubungkan ke satelit...";
        
        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // Simpan ke Firebase
            database.ref('locations/' + name).set({
                lat: lat,
                lng: lng,
                timestamp: Date.now()
            });

            // Fokuskan peta ke lokasi kita sendiri
            map.setView([lat, lng], 15);
            document.getElementById('status').innerText = "Jejak aktif. Memantau lokasi...";
        }, (err) => {
            console.error(err);
            document.getElementById('status').innerText = "Gagal GPS: " + err.message;
        }, { 
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000 
        });
    } else {
        alert("Browser tidak mendukung GPS.");
    }
});

// 2. Fungsi Membaca Lokasi Semua User
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    if(!data) return;

    for (let id in data) {
        const info = data[id];
        
        // Lewati jika data koordinat tidak valid
        if (!info.lat || !info.lng) continue;

        if (markers[id]) {
            // Update posisi jika marker sudah ada
            markers[id].setLatLng([info.lat, info.lng]);
        } else {
            // Buat marker baru jika belum ada
            const diamondIcon = L.divIcon({
                className: 'neon-marker',
                html: '◆',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            markers[id] = L.marker([info.lat, info.lng], {icon: diamondIcon})
                .addTo(map)
                .bindPopup("<b>" + id + "</b><br>Aktif");
            
            // Geser peta ke marker baru yang muncul
            map.flyTo([info.lat, info.lng], 15);
        }
    }
});
