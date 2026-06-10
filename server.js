const express = require('express');
const app = express();
const http = require('http').createServer(app);

// CORS ayarını ekliyoruz ki farklı tarayıcılar (Safari, Chrome) birbirini engellemesin
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Bir oyuncu bağlandı: ' + socket.id);

  // Lobi sohbeti
  socket.on('lobi_mesaji_gonder', (data) => {
    io.emit('lobi_mesaji_geldi', { isim: data.isim, mesaj: data.mesaj });
  });

  // Masaya oturma eylemi
  socket.on('masaya_otur', (data) => {
    io.emit('sistem_mesaji', `${data.isim}, ${data.masaAdi} masasına oturdu!`);
  });

  socket.on('disconnect', () => {
    console.log('Oyuncu ayrıldı: ' + socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif...`);
});
