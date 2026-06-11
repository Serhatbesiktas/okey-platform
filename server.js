const express = require('express');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

const masalar = {
    'Acemiler (20K Bahis)': { koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {} },
    'Usta Masası (50K Bahis)': { koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {} },
    'Hızlı Oyun (10K Bahis)': { koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {} }
};

function desteYaratVeKaristir() {
    let yeniDeste = [];
    let idSayaci = 1;
    const renkler = ['kirmizi', 'siyah', 'mavi', 'sari'];
    for(let set = 0; set < 2; set++) {
        for(let r of renkler) {
            for(let s = 1; s <= 13; s++) { yeniDeste.push({ id: 'tas_' + idSayaci++, renk: r, sayi: s }); }
        }
    }
    yeniDeste.push({ id: 'tas_' + idSayaci++, renk: 'sahte', sayi: 'S' });
    yeniDeste.push({ id: 'tas_' + idSayaci++, renk: 'sahte', sayi: 'S' });
    for (let i = yeniDeste.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [yeniDeste[i], yeniDeste[j]] = [yeniDeste[j], yeniDeste[i]];
    }
    return yeniDeste;
}

function oyunuSifirla(masaAdi) {
    const masa = masalar[masaAdi];
    if(masa) {
        masa.oyunBasladi = false;
        masa.deste = [];
        masa.gosterge = null;
        masa.siradakiOyuncu = null;
        masa.eller = {};
        io.emit('oyun_bitti', { masaAdi: masaAdi });
    }
}

function botHamlesiYap(masaAdi) {
    const masa = masalar[masaAdi];
    if(!masa || !masa.oyunBasladi) return;

    const siradaki = masa.siradakiOyuncu;
    if(siradaki && siradaki.startsWith('Bot_')) {
        setTimeout(() => {
            if(!masa.oyunBasladi) return;
            
            if(masa.deste.length === 0) {
                io.emit('sistem_mesaji', `⚠️ ${masaAdi} masasında TAŞ BİTTİ! Oyun berabere sonuçlandı.`);
                oyunuSifirla(masaAdi);
                return;
            }

            const cekilenTas = masa.deste.shift(); 
            masa.eller[siradaki].push(cekilenTas); 
            io.emit('masa_ortasi_guncelle', { masaAdi: masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
            
            setTimeout(() => {
                if(!masa.oyunBasladi) return;
                
                const botunEli = masa.eller[siradaki];
                const atilacakIndex = Math.floor(Math.random() * botunEli.length);
                const atilanTas = botunEli.splice(atilacakIndex, 1)[0]; 

                io.emit('ortaya_tas_atildi', { masaAdi: masaAdi, kimAtti: siradaki, tas: atilanTas });

                let currentIndex = masa.koltuklar.indexOf(siradaki);
                if(currentIndex === -1) return;

                let nextIndex = (currentIndex + 1) % 4;
                masa.siradakiOyuncu = masa.koltuklar[nextIndex];
                
                io.emit('sistem_mesaji', `${siradaki} hamlesini yaptı. Sıra ${masa.siradakiOyuncu}'da!`);
                io.emit('sira_guncelle', { masaAdi: masaAdi, kimde: masa.siradakiOyuncu });
                
                if(masa.siradakiOyuncu && masa.siradakiOyuncu.startsWith('Bot_')) {
                    botHamlesiYap(masaAdi);
                }
            }, 1500); 
        }, 1500); 
    }
}

io.on('connection', (socket) => {
  const lobiVerisi = {};
  for(let m in masalar) lobiVerisi[m] = masalar[m].koltuklar;
  socket.emit('masalari_guncelle', lobiVerisi);

  socket.on('masaya_otur', (data) => {
    const masa = masalar[data.masaAdi];
    if (masa && !masa.koltuklar.includes(data.isim)) {
        const bosKoltukIndex = masa.koltuklar.indexOf(null);
        if (bosKoltukIndex !== -1) {
            masa.koltuklar[bosKoltukIndex] = data.isim;
            socket.kullaniciAdi = data.isim;
            const guncelLobi = {};
            for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar;
            io.emit('masalari_guncelle', guncelLobi);
        }
    }
  });

  socket.on('oyunu_baslat', (masaAdi) => {
    const masa = masalar[masaAdi];
    if (masa && !masa.oyunBasladi) {
        masa.oyunBasladi = true;
        
        for(let i=0; i<4; i++) {
            if(masa.koltuklar[i] === null) { masa.koltuklar[i] = "Bot_" + Math.floor(Math.random() * 900 + 100); }
        }
        
        const guncelLobi = {};
        for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar;
        io.emit('masalari_guncelle', guncelLobi);

        masa.deste = desteYaratVeKaristir(); 
        masa.gosterge = masa.deste.pop();
        
        const baslayacakOyuncu = masa.koltuklar[Math.floor(Math.random() * 4)];
        masa.siradakiOyuncu = baslayacakOyuncu;
        masa.eller = {}; 
        
        // EKRANLARI GÜNCELLE (Taş dağıtmadan önce arayüzü hazırlar)
        io.emit('masa_oyun_basladi', { masaAdi: masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length });
        io.emit('sistem_mesaji', `${masaAdi} masasında oyun başladı! Gösterge açıklandı. (İlk oynayacak: ${baslayacakOyuncu})`);

        masa.koltuklar.forEach(oyuncuIsmi => {
            const kacTasAlacak = (oyuncuIsmi === baslayacakOyuncu) ? 15 : 14;
            const oyuncununTaslari = masa.deste.splice(0, kacTasAlacak); 
            masa.eller[oyuncuIsmi] = oyuncununTaslari; 
            if(!oyuncuIsmi.startsWith('Bot_')) {
                io.emit('taslari_al', { kime: oyuncuIsmi, taslar: oyuncununTaslari });
            }
        });
        
        io.emit('masa_ortasi_guncelle', { masaAdi: masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
        io.emit('sira_guncelle', { masaAdi: masaAdi, kimde: masa.siradakiOyuncu });

        if(masa.siradakiOyuncu.startsWith('Bot_')) { botHamlesiYap(masaAdi); }
    }
  });

  // UYUYAN SEKMELER İÇİN KURTARMA SİNYALİ
  socket.on('taslarimi_ver', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.oyunBasladi && masa.eller[data.isim]) {
          socket.emit('masa_oyun_basladi', { masaAdi: data.masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length });
          socket.emit('taslari_al', { kime: data.isim, taslar: masa.eller[data.isim] });
      }
  });

  socket.on('tas_atildi', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          // Atılan taşı elinden sil (Kurtarma radarı için)
          if(masa.eller[data.isim]) {
              const tasIndex = masa.eller[data.isim].findIndex(t => t.id === data.tas.id);
              if(tasIndex !== -1) masa.eller[data.isim].splice(tasIndex, 1);
          }

          io.emit('ortaya_tas_atildi', { masaAdi: data.masaAdi, kimAtti: data.isim, tas: data.tas });

          let currentIndex = masa.koltuklar.indexOf(data.isim);
          let nextIndex = (currentIndex + 1) % 4;
          masa.siradakiOyuncu = masa.koltuklar[nextIndex];
          
          io.emit('sistem_mesaji', `Hamle yapıldı. Sıra ${masa.siradakiOyuncu}'da!`);
          io.emit('sira_guncelle', { masaAdi: data.masaAdi, kimde: masa.siradakiOyuncu });

          if(masa.siradakiOyuncu.startsWith('Bot_')) { botHamlesiYap(data.masaAdi); }
      }
  });

  socket.on('ortadan_tas_cek', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          if(masa.deste.length === 0) {
              io.emit('sistem_mesaji', `⚠️ ${data.masaAdi} masasında TAŞ BİTTİ! Oyun berabere sonuçlandı.`);
              oyunuSifirla(data.masaAdi);
              return;
          }

          const cekilenTas = masa.deste.shift(); 
          if(masa.eller[data.isim]) masa.eller[data.isim].push(cekilenTas);
          
          socket.emit('tas_cekildi', cekilenTas); 
          io.emit('masa_ortasi_guncelle', { masaAdi: data.masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
      }
  });

  socket.on('yandan_tas_alindi', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.eller[data.kimAldi]) {
          masa.eller[data.kimAldi].push(data.tas); // Alınan taşı eline kaydet
      }
      io.emit('yandan_alindi_guncelle', data);
  });

  socket.on('oyunu_bitir', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          io.emit('sistem_mesaji', `🎉 TEBRİKLER! ${data.isim} elini tamamladı ve taşı ortaya koyarak OYUNU BİTİRDİ! 🎉`);
          oyunuSifirla(data.masaAdi);
      }
  });

  socket.on('masadan_kalk', (data) => { kullaniciyiMasadanKaldir(data.isim); });
  socket.on('disconnect', () => { if(socket.kullaniciAdi) kullaniciyiMasadanKaldir(socket.kullaniciAdi); });

  function kullaniciyiMasadanKaldir(isim) {
      for(let m in masalar) {
          let index = masalar[m].koltuklar.indexOf(isim);
          if(index !== -1) {
              masalar[m].koltuklar[index] = null;
              if(masalar[m].koltuklar.every(k => k === null || k.startsWith('Bot_'))) {
                  oyunuSifirla(m);
                  masalar[m].koltuklar = [null, null, null, null]; 
              }
              const guncelLobi = {};
              for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar;
              io.emit('masalari_guncelle', guncelLobi);
              break;
          }
      }
  }

  socket.on('lobi_mesaji_gonder', (data) => { io.emit('lobi_mesaji_geldi', { isim: data.isim, mesaj: data.mesaj }); });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log(`Sunucu ${PORT} portunda aktif...`); });
