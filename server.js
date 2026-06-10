const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Oyunun arayüz dosyalarını 'public' klasöründen çalıştırır
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Bir oyuncu bağlandı: ' + socket.id);

  // Lobiden gelen mesajları dinle ve herkese anında yay
  socket.on('lobi_mesaji_gonder', (data) => {
    io.emit('lobi_mesaji_geldi', {
      isim: data.isim,
      mesaj: data.mesaj
    });
  });

  socket.on('disconnect', () => {
    console.log('Oyuncu ayrıldı: ' + socket.id);
  });
});

// Render'ın vereceği dinamik porta veya yerel 3000 portuna bağlanır
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif...`);
});
