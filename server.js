const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// Masaları tertemiz başlat
const masalar = {
    'Acemiler': { koltuklar: [null, null, null, null], oyunBasladi: false },
    'Usta': { koltuklar: [null, null, null, null], oyunBasladi: false }
};

// Bot isimleri listesi
const botIsimleri = ['Bot-Ahmet', 'Bot-Ayşe', 'Bot-Cem', 'Bot-Deniz'];

// Boş koltukları botlarla dolduran fonksiyon
function botlariMasayaOtur(masaAdi) {
    const masa = masalar[masaAdi];
    let botIndex = 0;
    
    for (let i = 0; i < 4; i++) {
        if (masa.koltuklar[i] === null && botIndex < botIsimleri.length) {
            masa.koltuklar[i] = botIsimleri[botIndex];
            botIndex++;
        }
    }
    console.log(`${masaAdi} masasına botlar eklendi.`);
    io.emit('masalari_guncelle', masalar);
}

io.on('connection', (socket) => {
    
    socket.on('masaya_otur', (data) => {
        const masa = masalar[data.masaAdi];
        if (masa && !masa.oyunBasladi) {
            let index = masa.koltuklar.indexOf(null);
            if (index !== -1) {
                masa.koltuklar[index] = data.isim;
                socket.kullaniciAdi = data.isim;
                socket.masaAdi = data.masaAdi; // Hangi masada olduğunu kaydediyoruz
                io.emit('masalari_guncelle', masalar);
            }
        }
    });

    // Oyunu başlatma ve botları dahil etme
    socket.on('oyunu_baslat', (data) => {
        const masa = masalar[data.masaAdi];
        if (masa && !masa.oyunBasladi) {
            botlariMasayaOtur(data.masaAdi); // Eksik yerleri botla doldur
            masa.oyunBasladi = true;
            console.log(`${data.masaAdi} masasında oyun başladı.`);
            io.emit('oyun_basladi', { masaAdi: data.masaAdi });
        }
    });

    socket.on('disconnect', () => {
        if(socket.kullaniciAdi && socket.masaAdi) {
            const masa = masalar[socket.masaAdi];
            if(masa) {
                let idx = masa.koltuklar.indexOf(socket.kullaniciAdi);
                if(idx !== -1) {
                    masa.koltuklar[idx] = null;
                    
                    // Eğer masada hiç gerçek oyuncu kalmadıysa masayı sıfırla
                    let gercekOyuncuVarMi = masa.koltuklar.some(k => k !== null && !k.startsWith('Bot-'));
                    if (!gercekOyuncuVarMi) {
                        masa.oyunBasladi = false;
                        masa.koltuklar = [null, null, null, null];
                        console.log(`${socket.masaAdi} masası boşaldı ve sıfırlandı.`);
                    }
                }
            }
            io.emit('masalari_guncelle', masalar);
        }
    });

    socket.emit('masalari_guncelle', masalar);
});

http.listen(3000, () => console.log('Sunucu 3000 portunda hazır.'));
