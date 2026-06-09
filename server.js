const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Oyun dosyaları 'public' klasöründe yer alacak
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('Bir oyuncu bağlandı: ' + socket.id);

  // Burada ileride lobi ve masa mesajlaşma/taş atma kodları yer alacak
  socket.on('disconnect', () => {
    console.log('Oyuncu ayrıldı: ' + socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda başarıyla çalışıyor...`);
});