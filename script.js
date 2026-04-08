// ... (Bagian Firebase Config tetap sama) ...

const map = L.map('map', { zoomControl: false }).setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};
let isUserInteracting = false; // Variabel baru untuk cek interaksi user

// Deteksi jika user sedang menggeser atau zoom peta secara manual
map.on('movestart', () => { isUserInteracting = true; });

// Jika peta diam selama 5 detik setelah digeser user, kita anggap user sudah selesai (opsional)
// Atau kamu bisa tambahkan tombol "Fokus Saya" nanti. 
// Untuk sekarang, kita buat: kalau user geser, auto-center mati.

document.getElementById('btnStart').addEventListener('click', function() {
    const name = document.getElementById('username').value.trim();
    if (!name) return alert("Masukkan nama Anda terlebih dahulu!");

    if (navigator.geolocation) {
        document.getElementById('status').innerText = "Menghubungkan ke satelit...";
        
        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            database.ref('locations/' + name).set({
                lat: lat,
                lng: lng,
                timestamp: Date.now()
            });

            // PERBAIKAN: Hanya setView jika user TIDAK sedang menggeser peta
            if (!isUserInteracting) {
                map.setView([lat, lng], 15);
            }
            
            document.getElementById('status').innerText = "Jejak aktif.";
        }, (err) => {
            document.getElementById('status').innerText = "Gagal GPS: " + err.message;
        }, { enableHighAccuracy: true });
    }
});

database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    if(!data) return;

    for (let id in data) {
        const info = data[id];
        if (markers[id]) {
            markers[id].setLatLng([info.lat, info.lng]);
        } else {
            const diamondIcon = L.divIcon({
                className: 'neon-marker',
                html: '◆',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
            markers[id] = L.marker([info.lat, info.lng], {icon: diamondIcon})
                .addTo(map)
                .bindPopup("ID: " + id);
            
            // PERBAIKAN: Hanya flyTo jika user TIDAK sedang menggeser peta
            if (!isUserInteracting) {
                map.flyTo([info.lat, info.lng], 15);
            }
        }
    }
});
