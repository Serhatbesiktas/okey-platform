const express = require('express');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

// MASALARIN HAFIZASI (Sıradaki oyuncu bilgisi eklendi)
const masalar = {
    'Acemiler (20K Bahis)': { koltuklar: [null, null, null, null], deste: [], okeyTasi: null, oyunBasladi: false, siradakiOyuncu: null },
    'Usta Masası (50K Bahis)': { koltuklar: [null, null, null, null], deste: [], okeyTasi: null, oyunBasladi: false, siradakiOyuncu: null },
    'Hızlı Oyun (10K Bahis)': { koltuklar: [null, null, null, null], deste: [], okeyTasi: null, oyunBasladi: false, siradakiOyuncu: null }
};

function desteYaratVeKaristir() {
    let yeniDeste = [];
    let idSayaci = 1;
    const renkler = ['kirmizi', 'siyah', 'mavi', 'sari'];
    
    for(let set = 0; set < 2; set++) {
        for(let r of renkler) {
            for(let s = 1; s <= 13; s++) {
                yeniDeste.push({ id: 'tas_' + idSayaci++, renk: r, sayi: s });
            }
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

io.on('connection', (socket) => {
  console.log('Oyuncu bağlandı: ' + socket.id);

  const lobiVerisi = {};
  for(let m in masalar) lobiVerisi[m] = masalar[m].koltuklar;
  socket.emit('masalari_guncelle', lobiVerisi);

  socket.on('masaya_otur', (data) => {
    const masa = masalar[data.masaAdi];
    if (masa && !masa.koltuklar.includes(data.isim)) {
        const bosKoltukIndex = masa.koltuklar.indexOf(null);
        if (bosKoltukIndex !== -1) {
            masa.koltuklar[bosKoltukIndex] = data.isim;
            
            const guncelLobi = {};
            for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar;
            
            io.emit('masalari_guncelle', guncelLobi);
            io.emit('sistem_mesaji', `${data.isim}, ${data.masaAdi} masasına oturdu!`);
        }
    }
  });

  // OYUNU BAŞLAT
  socket.on('oyunu_baslat', (masaAdi) => {
    const masa = masalar[masaAdi];
    if (masa && !masa.oyunBasladi) {
        masa.oyunBasladi = true;
        masa.deste = desteYaratVeKaristir(); 
        
        // İlk oynayacak kişiyi seç ve sırayı ona ver
        const doluKoltuklar = masa.koltuklar.filter(k => k !== null);
        const baslayacakOyuncu = doluKoltuklar[Math.floor(Math.random() * doluKoltuklar.length)];
        masa.siradakiOyuncu = baslayacakOyuncu;
        
        io.emit('sistem_mesaji', `${masaAdi} masasında oyun başladı! (İlk oynayacak: ${baslayacakOyuncu})`);

        masa.koltuklar.forEach(oyuncuIsmi => {
            if(oyuncuIsmi !== null) {
                const kacTasAlacak = (oyuncuIsmi === baslayacakOyuncu) ? 15 : 14;
                const oyuncununTaslari = masa.deste.splice(0, kacTasAlacak); 
                
                // Oyunculara kendi taşlarını gönder
                io.sockets.sockets.forEach(s => {
                    if(s.kullaniciAdi === oyuncuIsmi) s.emit('taslari_al', oyuncununTaslari);
                });
                io.emit('taslari_al_' + oyuncuIsmi, oyuncununTaslari); // Yedek yakalayıcı
            }
        });
        
        // Herkese masanın ortasını ve SIRANIN KİMDE OLDUĞUNU bildir
        io.emit('masa_ortasi_guncelle_' + masaAdi, { kalanTas: masa.deste.length });
        io.emit('sira_guncelle_' + masaAdi, masa.siradakiOyuncu);
    }
  });

  // BİR OYUNCU TAŞ ATTIĞINDA SIRAYI SAĞDAKİNE GEÇİR
  socket.on('tas_atildi', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          let currentIndex = masa.koltuklar.indexOf(data.isim);
          let nextIndex = (currentIndex + 1) % 4;
          
          // Eğer koltuk boşsa bir sonrakine atla (Test için)
          while(masa.koltuklar[nextIndex] === null) {
              nextIndex = (nextIndex + 1) % 4;
              if(nextIndex === currentIndex) break; 
          }
          
          masa.siradakiOyuncu = masa.koltuklar[nextIndex]; // Sıra sağdakine geçti!
          io.emit('sistem_mesaji', `Hamle yapıldı. Sıra ${masa.siradakiOyuncu}'da!`);
          io.emit('sira_guncelle_' + data.masaAdi, masa.siradakiOyuncu);
      }
  });

  // OYUNCU ORTADAN TAŞ ÇEKTİĞİNDE
  socket.on('ortadan_tas_cek', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim && masa.deste.length > 0) {
          const cekilenTas = masa.deste.shift(); // Desteden en üstteki taşı al
          
          socket.emit('tas_cekildi', cekilenTas); // Sadece o oyuncuya taşı yolla
          io.emit('masa_ortasi_guncelle_' + data.masaAdi, { kalanTas: masa.deste.length });
      }
  });

  socket.on('masadan_kalk', (data) => {
    const masa = masalar[data.masaAdi];
    if (masa) {
        const koltukIndex = masa.koltuklar.indexOf(data.isim);
        if (koltukIndex !== -1) {
            masa.koltuklar[koltukIndex] = null;
            if(masa.koltuklar.every(k => k === null)) {
                masa.oyunBasladi = false;
                masa.deste = [];
                masa.siradakiOyuncu = null;
            }
            const guncelLobi = {};
            for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar;
            io.emit('masalari_guncelle', guncelLobi);
        }
    }
  });

  socket.on('lobi_mesaji_gonder', (data) => {
    io.emit('lobi_mesaji_geldi', { isim: data.isim, mesaj: data.mesaj });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda aktif...`);
});
