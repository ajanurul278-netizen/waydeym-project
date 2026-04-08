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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// --- PENGATURAN PANJANG JEJAK ---
const MAX_TRAIL_POINTS = 20; // Ubah angka ini sesuai keinginanmu (misal: 5, 20, atau 50)
// --------------------------------

// 2. Setup Peta
const map = L.map('map', { zoomControl: false }).setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};
const trails = {};
let myCurrentPos = null;
let isUserInteracting = false;

// Deteksi interaksi user
map.on('movestart', () => { isUserInteracting = true; });

// 3. Tombol Fokus ke Lokasi Saya (Floating Button)
const focusBtn = document.createElement('div');
focusBtn.innerHTML = '🎯';
focusBtn.className = 'focus-button'; // Tambahkan gaya di CSS nanti
focusBtn.style = "position:fixed; top:20px; right:20px; z-index:1001; background:rgba(15,23,42,0.8); padding:12px; border-radius:50%; cursor:pointer; font-size:20px; border:1px solid #00f2fe; display:none;";
document.body.appendChild(focusBtn);

focusBtn.onclick = () => {
    if (myCurrentPos) {
        isUserInteracting = false;
        map.flyTo([myCurrentPos.lat, myCurrentPos.lng], 17);
    }
};

// 4. Fungsi Mulai Jejak
document.getElementById('btnStart').addEventListener('click', function() {
    const name = document.getElementById('username').value.trim();
    if (!name) return alert("Isi nama dulu!");

    if (navigator.geolocation) {
        document.getElementById('status').innerText = "Menghubungkan...";
        
        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            myCurrentPos = { lat, lng };

            // Tampilkan tombol fokus setelah mulai
            focusBtn.style.display = "block";

            // OTOMATIS TUTUP MENU (Sembunyikan elemen input)
            document.querySelector('.input-group').style.display = "none";
            document.getElementById('btnStart').style.display = "none";
            document.querySelector('.panel-header .subtitle').innerText = "JEJAK AKTIF: " + name;

            database.ref('locations/' + name).once('value').then((snapshot) => {
                let history = [];
                if (snapshot.exists() && snapshot.val().history) {
                    history = snapshot.val().history;
                }

                history.push({ lat, lng, time: Date.now() });

                // GUNAKAN VARIABEL MAX_TRAIL_POINTS
                if (history.length > MAX_TRAIL_POINTS) {
                    history.shift();
                }

                database.ref('locations/' + name).set({
                    lat: lat,
                    lng: lng,
                    history: history,
                    lastActive: Date.now()
                });
            });

            if (!isUserInteracting) {
                map.setView([lat, lng], 16);
            }
            document.getElementById('status').innerText = "Memantau pergerakan...";
        }, (err) => {
            document.getElementById('status').innerText = "GPS Error";
        }, { enableHighAccuracy: true });
    }
});

// 5. Pantau Semua User & Jejak
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const currentTime = Date.now();

    for (let id in data) {
        const info = data[id];

        // Cleanup jika offline > 15 detik
        if (currentTime - info.lastActive > 15000) {
            if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
            if (trails[id]) { map.removeLayer(trails[id]); delete trails[id]; }
            continue;
        }

        // Update Marker
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

        // Update Polyline Jejak
        if (info.history && info.history.length > 1) {
            const points = info.history.map(p => [p.lat, p.lng]);
            if (trails[id]) {
                trails[id].setLatLngs(points);
            } else {
                trails[id] = L.polyline(points, {
                    color: '#00f2fe',
                    weight: 3,
                    opacity: 0.5,
                    dashArray: '5, 8'
                }).addTo(map);
            }
        }
    }
});
