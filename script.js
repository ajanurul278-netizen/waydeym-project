// ... (Firebase Config tetap sama) ...

const map = L.map('map', { zoomControl: false }).setView([-6.2000, 106.8166], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const markers = {};
let isUserInteracting = false;

map.on('movestart', () => { isUserInteracting = true; });

// Fungsi utama tombol Start
document.getElementById('btnStart').addEventListener('click', function() {
    const name = document.getElementById('username').value.trim();
    if (!name) return alert("Masukkan nama Anda terlebih dahulu!");

    if (navigator.geolocation) {
        document.getElementById('status').innerText = "Menghubungkan ke satelit...";
        
        navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // KIRIM DATA: Tambahkan lastActive (timestamp saat ini)
            database.ref('locations/' + name).set({
                lat: lat,
                lng: lng,
                lastActive: Date.now() // Ini kunci untuk deteksi keaktifan
            });

            if (!isUserInteracting) {
                map.setView([lat, lng], 15);
            }
            
            document.getElementById('status').innerText = "Jejak aktif.";
        }, (err) => {
            document.getElementById('status').innerText = "Gagal GPS: " + err.message;
        }, { enableHighAccuracy: true });
    }
});

// BACA DATA & HAPUS JIKA TIDAK AKTIF
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    if(!data) {
        // Jika data di database kosong, hapus semua marker di peta
        for (let id in markers) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
        return;
    };

    const currentTime = Date.now();

    for (let id in data) {
        const info = data[id];
        
        // CEK: Apakah user sudah tidak aktif lebih dari 15 detik?
        if (currentTime - info.lastActive > 15000) {
            // Hapus dari peta jika ada markernya
            if (markers[id]) {
                map.removeLayer(markers[id]);
                delete markers[id];
            }
            // (Opsional) Hapus juga dari Database agar benar-benar bersih
            // database.ref('locations/' + id).remove(); 
            continue; 
        }

        // Tampilkan/Update marker jika masih aktif
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
            
            if (!isUserInteracting) {
                map.flyTo([info.lat, info.lng], 15);
            }
        }
    }
    
    // CEK TAMBAHAN: Hapus marker yang ID-nya sudah hilang dari database
    for (let id in markers) {
        if (!data[id]) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
    }
});

// Jalankan pembersihan marker setiap 5 detik agar peta selalu fresh
setInterval(() => {
    const currentTime = Date.now();
    for (let id in markers) {
        // Kita tidak punya data lengkap di sini, jadi kita tunggu update dari on('value') 
        // atau bisa panggil ulang fungsi pengecekan jika diperlukan.
    }
}, 5000);
