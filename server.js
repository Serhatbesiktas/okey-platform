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
    isim: { type: String, unique: true }, cip: { type: Number, default: 250000 }, vip: { type: Boolean, default: false }
});
const Oyuncu = mongoose.model('Oyuncu', oyuncuSchema);

const oyuncuCipleri = {};

const masalar = {
    'Acemiler (20K Bahis)': { bahis: 20000, koltuklar: [null, null, null, null], oyunBasladi: false, deste: [], gosterge: null, okey: null, eller: {}, siradaki: null },
    'Orta Seviye (50K Bahis)': { bahis: 50000, koltuklar: [null, null, null, null], oyunBasladi: false, deste: [], gosterge: null, okey: null, eller: {}, siradaki: null },
    'Ustalar VIP (100K Bahis)': { bahis: 100000, koltuklar: [null, null, null, null], oyunBasladi: false, deste: [], gosterge: null, okey: null, eller: {}, siradaki: null }
};

// YENİ: OKEY MOTORU - 106 Taşı Yarat ve Karıştır
function desteYarat() {
    let deste = [];
    let idSayaci = 1;
    const renkler = ['kirmizi', 'siyah', 'mavi', 'sari'];
    
    // 2 set 1-13 arası taşlar
    for(let set = 0; set < 2; set++) {
        for(let r of renkler) {
            for(let s = 1; s <= 13; s++) { deste.push({ id: 'tas_' + idSayaci++, renk: r, sayi: s }); }
        }
    }
    // 2 Sahte Okey
    deste.push({ id: 'tas_105', renk: 'siyah', sayi: 'S' });
    deste.push({ id: 'tas_106', renk: 'kirmizi', sayi: 'S' });

    // Karıştır
    for (let i = deste.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deste[i], deste[j]] = [deste[j], deste[i]];
    }
    return deste;
}

function okeyBelirle(gosterge) {
    if(gosterge.sayi === 'S') return { renk: 'kirmizi', sayi: 1 }; // Sahte okeyse kırmızı 1 okeydir (Basit kural)
    let okeySayi = gosterge.sayi === 13 ? 1 : gosterge.sayi + 1;
    return { renk: gosterge.renk, sayi: okeySayi };
}

io.on('connection', (socket) => {
  
  socket.on('kullanici_girisi', async (isim) => {
      socket.kullaniciAdi = isim;
      if (!isim.startsWith('Bot_')) {
          if (dbAktif) {
              try {
                  let dbKullanici = await Oyuncu.findOne({ isim: isim });
                  if (!dbKullanici) dbKullanici = await Oyuncu.create({ isim: isim, cip: 250000 });
                  oyuncuCipleri[isim] = dbKullanici.cip;
              } catch(e) { if(!oyuncuCipleri[isim]) oyuncuCipleri[isim] = 250000; }
          } else { if(!oyuncuCipleri[isim]) oyuncuCipleri[isim] = 250000; }
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
              io.emit('masa_oyuncu_durumu', { masaAdi: data.masaAdi, koltuklar: masa.koltuklar });
          }
      }
  });

  // YENİ: TEST MOTORU (Botları ekler ve taşı dağıtır)
  socket.on('test_oyunu_baslat', (masaAdi) => {
      const masa = masalar[masaAdi];
      if(masa && !masa.oyunBasladi) {
          // Botları doldur
          for(let i=0; i<4; i++) {
              if(masa.koltuklar[i] === null) masa.koltuklar[i] = "Bot_" + Math.floor(Math.random()*1000);
          }
          
          masa.oyunBasladi = true;
          masa.deste = desteYarat();
          
          // Göstergeyi en sondan çek
          masa.gosterge = masa.deste.pop();
          masa.okey = okeyBelirle(masa.gosterge);

          // Taşları dağıt (Herkese 14, başlayana 15)
          masa.siradaki = 0; // 0. koltuk başlar
          for(let i=0; i<4; i++) {
              let oyuncu = masa.koltuklar[i];
              let tasSayisi = (i === masa.siradaki) ? 15 : 14;
              masa.eller[oyuncu] = masa.deste.splice(0, tasSayisi);
              
              // Gerçek oyuncuya taşlarını gizlice gönder
              if(!oyuncu.startsWith('Bot_')) {
                  const targetSocket = Array.from(io.sockets.sockets.values()).find(s => s.kullaniciAdi === oyuncu);
                  if(targetSocket) {
                      targetSocket.emit('elimi_guncelle', { el: masa.eller[oyuncu], gosterge: masa.gosterge });
                  }
              }
          }
          
          io.emit('masa_oyuncu_durumu', { masaAdi: masaAdi, koltuklar: masa.koltuklar, basladi: true });
          io.emit('sohbet_mesaj_ilet', { isim: "Sistem", mesaj: "Oyun başladı! Taşlar dağıtıldı.", masaAdi: masaAdi });
      }
  });

  socket.on('sohbet_mesaj_gonder', (data) => {
      io.emit('sohbet_mesaj_ilet', { isim: socket.kullaniciAdi, mesaj: data.mesaj, masaAdi: data.masaAdi });
  });

  socket.on('masadan_kalk', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa) {
          let index = masa.koltuklar.indexOf(socket.kullaniciAdi);
          if(index !== -1) {
              masa.koltuklar[index] = null;
              if(masa.oyunBasladi) { masa.oyunBasladi = false; masa.eller = {}; } // Biri kalkarsa test oyunu biter
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
                  if(masalar[m].oyunBasladi) masalar[m].oyunBasladi = false;
                  io.emit('masalari_guncelle', masalar);
                  io.emit('masa_oyuncu_durumu', { masaAdi: m, koltuklar: masalar[m].koltuklar });
              }
          }
      }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Okey Motoru Aktif...'); });
