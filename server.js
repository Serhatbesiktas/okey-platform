const express = require('express');
const app = express();
const http = require('http').createServer(app);
const mongoose = require('mongoose');

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

const dbURI = "mongodb+srv://admin:Okey123456@cluster0.e9ntzng.mongodb.net/okeydb?retryWrites=true&w=majority&appName=Cluster0";
const ADMIN_SIFRE = "Patron2026"; 

let dbAktif = false; // Veritabanı durumunu takip eden sistem

// YENİ: 5 saniyede bağlanamazsa çökmek yerine yerel hafızaya geçer
mongoose.connect(dbURI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
      console.log('✅ MongoDB Veritabanı Aktif! Her şey kalıcı.');
      dbAktif = true;
  })
  .catch((err) => {
      console.log('⚠️ MongoDB Bağlanamadı! Geçici (Local) Hafıza ile devam ediliyor.');
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

async function veritabaninaKaydet(isim) {
    if(!isim.startsWith('Bot_') && dbAktif) {
        try { await Oyuncu.updateOne({ isim: isim }, { cip: oyuncuCipleri[isim], vip: oyuncuVipDurumu[isim] }); } 
        catch(e) {}
    }
}

const masalar = {
    'Acemiler Masası': { bahis: 20000, koltuklar: [null, null, null, null] },
    'Orta Seviye': { bahis: 50000, koltuklar: [null, null, null, null] },
    'Ustalar (VIP)': { bahis: 100000, koltuklar: [null, null, null, null] }
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
              // DB yoksa geçici çip ver
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
http.listen(PORT, () => { console.log('Sunucu başlatıldı...'); });
