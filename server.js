const express = require('express');
const app = express();
const http = require('http').createServer(app);
const mongoose = require('mongoose');

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

const dbURI = process.env.MONGODB_URI || "mongodb+srv://admin:Okey123456@cluster0.e9ntzng.mongodb.net/okeydb?retryWrites=true&w=majority&appName=Cluster0";
let dbAktif = false;

mongoose.connect(dbURI, { serverSelectionTimeoutMS: 4000 })
  .then(() => { console.log('✅ Veritabanı bağlandı.'); dbAktif = true; })
  .catch((err) => { console.log('⚠️ Local hafıza modu aktif.'); dbAktif = false; });

const oyuncuSchema = new mongoose.Schema({
    isim: { type: String, unique: true },
    cip: { type: Number, default: 250000 },
    vip: { type: Boolean, default: false }
});
const Oyuncu = mongoose.model('Oyuncu', oyuncuSchema);

const oyuncuCipleri = {};
const oyuncuVipDurumu = {}; 

const masalar = {
    'Acemiler (20K Bahis)': { bahis: 20000, koltuklar: [null, null, null, null] },
    'Orta Seviye (50K Bahis)': { bahis: 50000, koltuklar: [null, null, null, null] },
    'Ustalar VIP (100K Bahis)': { bahis: 100000, koltuklar: [null, null, null, null] }
};

io.on('connection', (socket) => {
  
  socket.on('kullanici_girisi', async (isim) => {
      socket.kullaniciAdi = isim;
      
      if (!isim.startsWith('Bot_')) {
          if (dbAktif) {
              try {
                  let dbKullanici = await Oyuncu.findOne({ isim: isim });
                  if (!dbKullanici) dbKullanici = await Oyuncu.create({ isim: isim, cip: 250000, vip: false });
                  oyuncuCipleri[isim] = dbKullanici.cip;
                  oyuncuVipDurumu[isim] = dbKullanici.vip;
              } catch(e) { if(!oyuncuCipleri[isim]) oyuncuCipleri[isim] = 250000; }
          } else {
              if(!oyuncuCipleri[isim]) oyuncuCipleri[isim] = 250000;
              if(!oyuncuVipDurumu[isim]) oyuncuVipDurumu[isim] = false;
          }
      }
      socket.emit('cip_guncelle', oyuncuCipleri[isim]);
      io.emit('masalari_guncelle', masalar);
  });

  socket.on('masaya_otur', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && !masa.koltuklar.includes(data.isim)) {
          let bosKoltuk = masa.koltuklar.indexOf(null);
          if(bosKoltuk !== -1) {
              masa.koltuklar[bosKoltuk] = data.isim;
              io.emit('masalari_guncelle', masalar);
              // Masadaki herkese oyuncuların güncel halini gönder
              io.emit('masa_oyuncu_durumu', { masaAdi: data.masaAdi, koltuklar: masa.koltuklar });
          }
      }
  });

  // YENİ: SOHBET SİSTEMİ
  socket.on('sohbet_mesaj_gonder', (data) => {
      io.emit('sohbet_mesaj_ilet', {
          isim: socket.kullaniciAdi,
          mesaj: data.mesaj,
          masaAdi: data.masaAdi
      });
  });

  socket.on('masadan_kalk', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa) {
          let index = masa.koltuklar.indexOf(socket.kullaniciAdi);
          if(index !== -1) {
              masa.koltuklar[index] = null;
              io.emit('masalari_guncelle', masalar);
              io.emit('masa_oyuncu_durumu', { masaAdi: data.masaAdi, koltuklar: masa.koltuklar });
          }
      }
  });

  socket.on('disconnect', () => {
      if(socket.kullaniciAdi) {
          for(let m in masalar) {
              let index = masalar[m].koltuklar.indexOf(socket.kullaniciAdi);
              if(index !== -1) {
                  masalar[m].koltuklar[index] = null;
                  io.emit('masalari_guncelle', masalar);
                  io.emit('masa_oyuncu_durumu', { masaAdi: m, koltuklar: masalar[m].koltuklar });
              }
          }
      }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Sunucu dinlemede...'); });
