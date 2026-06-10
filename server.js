const express = require('express');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

// SUNUCU HAFIZASI: Her masada tam 4 koltuk var (null = Boş koltuk)
const masalar = {
    'Acemiler (20K Bahis)': [null, null, null, null],
    'Usta Masası (50K Bahis)': [null, null, null, null],
    'Hızlı Oyun (10K Bahis)': [null, null, null, null]
};

io.on('connection', (socket) => {
  console.log('Oyuncu bağlandı: ' + socket.id);

  // Yeni gelen oyuncuya mevcut masaların durumunu gönder
  socket.emit('masalari_guncelle', masalar);

  // Genel Sohbet
  socket.on('lobi_mesaji_gonder', (data) => {
    io.emit('lobi_mesaji_geldi', { isim: data.isim, mesaj: data.mesaj });
  });

  // Masaya Oturma Mantığı
  socket.on('masaya_otur', (data) => {
    const masa = masalar[data.masaAdi];
    if (masa) {
        // Oyuncu zaten bu masada bir yerde oturuyorsa işlem yapma
        if (masa.includes(data.isim)) return;

        // İlk boş koltuğu bul (null olan ilk index)
        const bosKoltukIndex = masa.findIndex(koltuk => koltuk === null);

        if (bosKoltukIndex !== -1) {
            masa[bosKoltukIndex] = data.isim; // Koltuğu rezerve et
            
            io.emit('masalari_guncelle', masalar);
            io.emit('sistem_mesaji', `${data.isim}, ${data.masaAdi} masasında ${bosKoltukIndex + 1}. koltuğa oturdu!`);
        }
    }
  });

  // Masadan Kalkma Mantığı
  socket.on('masadan_kalk', (data) => {
    const masa = masalar[data.masaAdi];
    if (masa) {
        const koltukIndex = masa.indexOf(data.isim);
        if (koltukIndex !== -1) {
            masa[koltukIndex] = null; // Koltuğu boşalt
            
            io.emit('masalari_guncelle', masalar);
            io.emit('sistem_mesaji', `${data.isim} masadan ayrıldı.`);
        }
    }
  });

  socket.on('disconnect', () => {
    console.log('Oyuncu ayrıldı: ' + socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif...`);
});
