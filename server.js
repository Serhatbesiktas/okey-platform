const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// Her şeyden önce masaları tertemiz başlat
const masalar = {
    'Acemiler': { koltuklar: [null, null, null, null], oyunBasladi: false },
    'Usta': { koltuklar: [null, null, null, null], oyunBasladi: false }
};

io.on('connection', (socket) => {
    socket.on('masaya_otur', (data) => {
        const masa = masalar[data.masaAdi];
        if (masa) {
            let index = masa.koltuklar.indexOf(null);
            if (index !== -1) {
                masa.koltuklar[index] = data.isim;
                socket.kullaniciAdi = data.isim;
                io.emit('masalari_guncelle', masalar);
            }
        }
    });

    socket.on('disconnect', () => {
        if(socket.kullaniciAdi) {
            for(let m in masalar) {
                let idx = masalar[m].koltuklar.indexOf(socket.kullaniciAdi);
                if(idx !== -1) {
                    masalar[m].koltuklar[idx] = null;
                    masalar[m].oyunBasladi = false;
                }
            }
            io.emit('masalari_guncelle', masalar);
        }
    });

    socket.emit('masalari_guncelle', masalar);
});

http.listen(3000, () => console.log('Sunucu 3000 portunda hazır.'));
