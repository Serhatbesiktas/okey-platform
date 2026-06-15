const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statik dosyaları sunmak için
app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log(`Yeni oyuncu bağlandı. Socket ID: ${socket.id}`);

    // --- VIP PROFİL VE MESAJLAŞMA SİSTEMİ ---
    
    // Arkadaşlık isteği
    socket.on('arkadaslik_istegi_gonder', (data) => {
        if(data && data.hedefOyuncuId) {
            console.log(`${socket.id}, ${data.hedefOyuncuId} kullanıcısına istek attı.`);
            io.to(data.hedefOyuncuId).emit('yeni_arkadaslik_istegi', {
                gonderenId: socket.id
            });
        }
    });

    // Özel mesaj
    socket.on('ozel_mesaj_gonder', (data) => {
        if(data && data.hedefOyuncuId && data.mesajMetni) {
            console.log(`Mesaj: ${socket.id} -> ${data.hedefOyuncuId}: ${data.mesajMetni}`);
            io.to(data.hedefOyuncuId).emit('yeni_ozel_mesaj', {
                gonderenId: socket.id,
                mesajMetni: data.mesajMetni
            });
        }
    });

    // --- OKEY OYUNU DİĞER FONKSİYONLARIN BURAYA GELEBİLİR ---
    // (Taş dağıtma, ıstaka işlemleri vb.)

    socket.on('disconnect', () => {
        console.log(`Oyuncu ayrıldı: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`VIP Okey Sunucusu http://localhost:${PORT} adresinde aktif.`);
});
