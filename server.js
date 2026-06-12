const express = require('express');
const app = express();
const http = require('http').createServer(app);
const mongoose = require('mongoose');

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

// Gizli kasadan linki oku, yoksa eski linki yedek olarak kullan
const dbURI = process.env.MONGODB_URI || "mongodb+srv://admin:Okey123456@cluster0.e9ntzng.mongodb.net/okeydb?retryWrites=true&w=majority&appName=Cluster0";
const ADMIN_SIFRE = "Patron2026"; 

let dbAktif = false;

mongoose.connect(dbURI, { serverSelectionTimeoutMS: 4000 })
  .then(() => {
      console.log('✅ Veritabanı başarıyla bağlandı.');
      dbAktif = true;
  })
  .catch((err) => {
      console.log('⚠️ Local hafıza modu aktif.');
      dbAktif = false;
  });

const oyuncuSchema = new mongoose.Schema({
    isim: { type: String, unique: true },
    cip: { type: Number, default: 250000 },
    vip: { type: Boolean, default: false }
});
const Oyuncu = mongoose.model('Oyuncu', oyuncuSchema);

const oyuncuCipleri = {};
const oyuncuVipDurumu = {}; 

const masalar = {
    'Acemiler Masası': { bahis: 20000, koltuklar: [null, null, null, null] },
    'Orta Seviye Masası': { bahis: 50000, koltuklar: [null, null, null, null] },
    'Ustalar VIP Masası': { bahis: 100000, koltuklar: [null, null, null, null] }
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
              } catch(e) {
                  if(!oyuncuCipleri[isim]) oyuncuCipleri[isim] = 250000;
              }
          } else {
              if(!oyuncuCipleri[isim]) oyuncuCipleri[isim] = 250000;
              if(!oyuncuVipDurumu[isim]) oyuncuVipDurumu[isim] = false;
          }
      }
      socket.emit('cip_guncelle', oyuncuCipleri[isim]);
      socket.emit('vip_guncelle', oyuncuVipDurumu[isim]);
      
      const lobiVerisi = {};
      for(let m in masalar) lobiVerisi[m] = masalar[m].koltuklar;
      socket.emit('masalari_guncelle', lobiVerisi);
  });

  socket.on('masaya_otur', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && !masa.koltuklar.includes(data.isim)) {
          let bosKoltuk = masa.koltuklar.indexOf(null);
          if(bosKoltuk !== -1) {
              masa.koltuklar[bosKoltuk] = data.isim;
              const lobiVerisi = {};
              for(let m in masalar) lobiVerisi[m] = masalar[m].koltuklar;
              io.emit('masalari_guncelle', lobiVerisi);
          }
      }
  });

  socket.on('disconnect', () => {
      if(socket.kullaniciAdi) {
          for(let m in masalar) {
              let index = masalar[m].koltuklar.indexOf(socket.kullaniciAdi);
              if(index !== -1) {
                  masalar[m].koltuklar[index] = null;
                  const lobiVerisi = {};
                  for(let ms in masalar) lobiVerisi[ms] = masalar[ms].koltuklar;
                  io.emit('masalari_guncelle', lobiVerisi);
              }
          }
      }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Sunucu dinlemede...'); });
