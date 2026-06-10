const express = require('express');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

// SUNUCUNUN HAFIZASI: Masaların anlık durumu
const masalar = {
    'Acemiler (20K Bahis)': { kapasite: 4, oyuncular: [] },
    'Usta Masası (50K Bahis)': { kapasite: 4, oyuncular: [] },
    'Hızlı Oyun (10K Bahis)': { kapasite: 4, oyuncular: [] }
};

io.on('connection', (socket) => {
  console.log('Oyuncu bağlandı: ' + socket.id);

  // Biri bağlandığı an, masaların GÜNCEL durumunu ona gönder
  socket.emit('masalari_guncelle', masalar);

  socket.on('lobi_mesaji_gonder', (data) => {
    io.emit('lobi_mesaji_geldi', { isim: data.isim, mesaj: data.mesaj });
  });

  // Biri masaya oturduğunda çalışacak mantık
  socket.on('masaya_otur', (data) => {
    const masa = masalar[data.masaAdi];
    
    // Masa varsa ve boş yer varsa oyuncuyu ekle
    if (masa && masa.oyuncular.length < masa.kapasite) {
        // Aynı oyuncu iki kere oturmasın diye kontrol
        if (!masa.oyuncular.includes(data.isim)) {
            masa.oyuncular.push(data.isim);
            
            // Masaların YENİ durumunu herkese (lobiye) gönder
            io.emit('masalari_guncelle', masalar);
            io.emit('sistem_mesaji', `${data.isim}, ${data.masaAdi} masasına oturdu!`);
        }
    }
  });

  socket.on('masadan_kalk', (data) => {
    const masa = masalar[data.masaAdi];
    if(masa) {
        // Oyuncuyu masadan sil
        masa.oyuncular = masa.oyuncular.filter(oyuncu => oyuncu !== data.isim);
        io.emit('masalari_guncelle', masalar);
        io.emit('sistem_mesaji', `${data.isim}, masadan ayrıldı.`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Oyuncu ayrıldı: ' + socket.id);
    // İleride oyuncu internetten kopunca masadan otomatik kalkmasını buraya ekleyeceğiz.
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif...`);
});
