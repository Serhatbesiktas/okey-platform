const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static('public'));

const oyuncuCipleri = {};
const oyuncuKozmetikleri = {}; 
const banliKullanicilar = new Set(); 
const baglantiKopanlar = {}; 

const masalar = {
    'Acemiler (20K Bahis)': { bahis: 20000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false },
    'Usta Masası (50K Bahis)': { bahis: 50000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false },
    'Hızlı Oyun (10K Bahis)': { bahis: 10000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false }
};

// [OYUN MOTORU FONKSİYONLARI AYNEN KALIYOR - DEĞİŞTİRMEDİK]
function desteYaratVeKaristir() { /* Senin mevcut motor kodların */ }
function oyunuSifirla(masaAdi, kazanan, odul, sebep, okeyleBittiMi) { /* Senin mevcut motor kodların */ }
function eliKontrolEt(gruplar, gosterge) { /* Senin mevcut motor kodların */ }
function botHamlesiYap(masaAdi) { /* Senin mevcut motor kodların */ }
function kullaniciyiMasadanKaldir(isim) { /* Senin mevcut motor kodların */ }

io.on('connection', (socket) => {
  socket.on('kullanici_girisi', (data) => {
      let isim = data.isim;
      if(banliKullanicilar.has(isim)) return;
      if(baglantiKopanlar[isim]) { clearTimeout(baglantiKopanlar[isim]); delete baglantiKopanlar[isim]; }
      socket.kullaniciAdi = isim;
      oyuncuCipleri[isim] = data.cip;
      oyuncuKozmetikleri[isim] = data.kozmetikler || [];
      io.emit('online_oyuncular', Object.keys(oyuncuCipleri));
      io.emit('kozmetikleri_guncelle', oyuncuKozmetikleri);
  });

  socket.on('kozmetik_guncelle', (data) => {
      oyuncuKozmetikleri[data.isim] = data.kozmetikler;
      io.emit('kozmetikleri_guncelle', oyuncuKozmetikleri);
  });

  socket.on('masaya_davet_et', (data) => { io.emit('davet_geldi', data); });

  socket.on('masaya_geri_don', (data) => {
      const masa = masalar[data.masaAdi];
      if (masa && masa.oyunBasladi && masa.koltuklar.includes(data.isim)) {
          socket.emit('masa_oyun_basladi', { masaAdi: data.masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length, kasa: masa.kasa });
          socket.emit('taslari_al', { kime: data.isim, taslar: masa.eller[data.isim] });
          socket.emit('sira_guncelle', { masaAdi: data.masaAdi, kimde: masa.siradakiOyuncu });
      }
  });

  socket.on('disconnect', () => { 
      if(socket.kullaniciAdi) {
          baglantiKopanlar[socket.kullaniciAdi] = setTimeout(() => {
              kullaniciyiMasadanKaldir(socket.kullaniciAdi);
              delete oyuncuCipleri[socket.kullaniciAdi];
              io.emit('online_oyuncular', Object.keys(oyuncuCipleri));
              delete baglantiKopanlar[socket.kullaniciAdi];
          }, 20000);
      }
  });

  // [DİĞER TÜM SOCKET İŞLEMLERİ (oyunu_baslat, tas_atildi vb.) SENİN MEVCUT KODLARINLA AYNEN KALIYOR]
});

http.listen(3000, () => console.log("Sunucu Aktif"));
