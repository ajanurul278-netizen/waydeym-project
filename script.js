// 1. Konfigurasi Firebase
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

// 2. Setup Map
const map = L.map('map', { zoomControl: false }).setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};
const trails = {};
let myName = "";
let myPos = null;
let isInteracting = false;
let myHistory = [];

// Deteksi jika user sedang geser peta manual
map.on('movestart', () => { isInteracting = true; });

// Fungsi Tombol Fokus
const btnFocus = document.getElementById('btnFocus');
btnFocus.onclick = () => {
    isInteracting = false; // Aktifkan auto-center lagi
    if (myPos) {
        map.flyTo([myPos.lat, myPos.lng], 17);
    }
};

// 3. Logika Klik Tombol Start
document.getElementById('btnStart').onclick = function() {
    myName = document.getElementById('username').value.trim();
    const maxPoints = parseInt(document.getElementById('trailLimit').value) || 20;

    if (!myName) {
        alert("Masukkan nama terlebih dahulu!");
        return;
    }

    // --- PAKSA UI HILANG (POINT UTAMA) ---
    document.getElementById('inputArea').style.setProperty('display', 'none', 'important');
    document.getElementById('subTitle').innerText = "TRACKING: " + myName;
    document.getElementById('status').innerText = "Menunggu Sinyal GPS...";
    btnFocus.style.display = "block"; // Munculkan tombol 🎯

    // 4. Jalankan Tracking GPS
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            myPos = { lat, lng };

            document.getElementById('status').innerText = "Jejak Aktif ◆";

            // Update Jejak Lokal
            myHistory.push({ lat, lng });
            if (myHistory.length > maxPoints) {
                myHistory.shift(); // Hapus jejak paling lama (fitur hilang otomatis)
            }

            // Kirim ke Firebase
            database.ref('locations/' + myName).set({
                lat: lat,
                lng: lng,
                history: myHistory,
                lastActive: Date.now()
            });

            // Auto-center jika user tidak sedang geser peta
            if (!isInteracting) {
                map.setView([lat, lng], 17);
            }
            
        }, (err) => {
            document.getElementById('status').innerText = "GPS Bermasalah!";
        }, { 
            enableHighAccuracy: true,
            maximumAge: 1000 
        });
    } else {
        alert("Browser tidak mendukung GPS.");
    }
};

// 5. Pantau Semua Pengguna di Database
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const now = Date.now();

    for (let id in data) {
        const info = data[id];

        // Hapus marker jika user tidak aktif lebih dari 15 detik
        if (now - info.lastActive > 15000) {
            if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
            if (trails[id]) { map.removeLayer(trails[id]); delete trails[id]; }
            continue;
        }

        // Tampilkan/Update Marker Diamond
        if (markers[id]) {
            markers[id].setLatLng([info.lat, info.lng]);
        } else {
            const diamondIcon = L.divIcon({ 
                className: 'neon-marker', 
                html: '◆', 
                iconSize: [40, 40], 
                iconAnchor: [20, 20] 
            });
            markers[id] = L.marker([info.lat, info.lng], { icon: diamondIcon }).addTo(map).bindPopup(id);
        }

        // Tampilkan/Update Garis Jejak Biru
        if (info.history && info.history.length > 1) {
            const latlngs = info.history.map(p => [p.lat, p.lng]);
            if (trails[id]) {
                trails[id].setLatLngs(latlngs);
            } else {
                trails[id] = L.polyline(latlngs, {
                    color: '#00f2fe',
                    weight: 5,
                    opacity: 0.7,
                    lineJoin: 'round'
                }).addTo(map);
            }
        }
    }
});
