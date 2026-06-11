const express = require('express');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

const masalar = {
    'Acemiler (20K Bahis)': { koltuklar: [null, null, null, null], deste: [], oyunBasladi: false, siradakiOyuncu: null, eller: {}, iskartalar: {} },
    'Usta Masası (50K Bahis)': { koltuklar: [null, null, null, null], deste: [], oyunBasladi: false, siradakiOyuncu: null, eller: {}, iskartalar: {} },
    'Hızlı Oyun (10K Bahis)': { koltuklar: [null, null, null, null], deste: [], oyunBasladi: false, siradakiOyuncu: null, eller: {}, iskartalar: {} }
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

function botHamlesiYap(masaAdi) {
    const masa = masalar[masaAdi];
    if(!masa || !masa.oyunBasladi) return;

    const siradaki = masa.siradakiOyuncu;
    if(siradaki && siradaki.startsWith('Bot_')) {
        setTimeout(() => {
            if(masa.deste.length > 0) {
                let cekilen = masa.deste.shift();
                if(!masa.eller[siradaki]) masa.eller[siradaki] = [];
                masa.eller[siradaki].push(cekilen);
                io.emit('masa_ortasi_guncelle', { masaAdi: masaAdi, kalanTas: masa.deste.length });
            }
            
            setTimeout(() => {
                let atilanTas;
                if(masa.eller[siradaki] && masa.eller[siradaki].length > 0) {
                    atilanTas = masa.eller[siradaki].shift(); // İlk taşı at
                } else {
                    atilanTas = { id: 'tas_bot_' + Math.random(), renk: 'siyah', sayi: 1 };
                }
                
                if(!masa.iskartalar[siradaki]) masa.iskartalar[siradaki] = [];
                masa.iskartalar[siradaki].push(atilanTas);
                
                io.emit('masaya_tas_atildi', { masaAdi: masaAdi, kimAtti: siradaki, tas: atilanTas });
                
                let currentIndex = masa.koltuklar.indexOf(siradaki);
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
    if (masa) {
        masa.oyunBasladi = true;
        masa.eller = {};
        masa.iskartalar = {};
        
        for(let i=0; i<4; i++) {
            if(masa.koltuklar[i] === null) {
                masa.koltuklar[i] = "Bot_" + Math.floor(Math.random() * 900 + 100);
            }
            masa.iskartalar[masa.koltuklar[i]] = [];
        }
        
        const guncelLobi = {};
        for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar;
        io.emit('masalari_guncelle', guncelLobi);

        masa.deste = desteYaratVeKaristir(); 
        const baslayacakOyuncu = masa.koltuklar[Math.floor(Math.random() * 4)];
        masa.siradakiOyuncu = baslayacakOyuncu;
        
        io.emit('sistem_mesaji', `${masaAdi} masasında oyun başladı!`);

        masa.koltuklar.forEach(oyuncuIsmi => {
            const kacTasAlacak = (oyuncuIsmi === baslayacakOyuncu) ? 15 : 14;
            const oyuncununTaslari = masa.deste.splice(0, kacTasAlacak); 
            masa.eller[oyuncuIsmi] = oyuncununTaslari;
            
            if(!oyuncuIsmi.startsWith('Bot_')) {
                io.emit('taslari_al', { kime: oyuncuIsmi, taslar: oyuncununTaslari });
            }
        });
        
        io.emit('masa_ortasi_guncelle', { masaAdi: masaAdi, kalanTas: masa.deste.length });
        io.emit('sira_guncelle', { masaAdi: masaAdi, kimde: masa.siradakiOyuncu });

        if(masa.siradakiOyuncu.startsWith('Bot_')) {
            botHamlesiYap(masaAdi);
        }
    }
  });

  socket.on('tas_atildi', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          if(!masa.iskartalar[data.isim]) masa.iskartalar[data.isim] = [];
          masa.iskartalar[data.isim].push(data.tas);
          
          io.emit('masaya_tas_atildi', { masaAdi: data.masaAdi, kimAtti: data.isim, tas: data.tas });

          let currentIndex = masa.koltuklar.indexOf(data.isim);
          let nextIndex = (currentIndex + 1) % 4;
          masa.siradakiOyuncu = masa.koltuklar[nextIndex];
          
          io.emit('sira_guncelle', { masaAdi: data.masaAdi, kimde: masa.siradakiOyuncu });

          if(masa.siradakiOyuncu.startsWith('Bot_')) {
              botHamlesiYap(data.masaAdi);
          }
      }
  });

  socket.on('ortadan_tas_cek', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim && masa.deste.length > 0) {
          const cekilenTas = masa.deste.shift(); 
          if(!masa.eller[data.isim]) masa.eller[data.isim] = [];
          masa.eller[data.isim].push(cekilenTas);
          
          socket.emit('tas_cekildi', cekilenTas); 
          io.emit('masa_ortasi_guncelle', { masaAdi: data.masaAdi, kalanTas: masa.deste.length });
      }
  });

  socket.on('yandan_tas_cek', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          let currentIndex = masa.koltuklar.indexOf(data.isim);
          let prevIndex = (currentIndex + 3) % 4; // Solundaki oyuncu (Senden önceki)
          let solOyuncu = masa.koltuklar[prevIndex];
          
          if(masa.iskartalar[solOyuncu] && masa.iskartalar[solOyuncu].length > 0) {
              const cekilenTas = masa.iskartalar[solOyuncu].pop(); // Yerdeki taşı al
              if(!masa.eller[data.isim]) masa.eller[data.isim] = [];
              masa.eller[data.isim].push(cekilenTas);
              
              socket.emit('tas_cekildi', cekilenTas);
              io.emit('iskartadan_tas_alindi', { masaAdi: data.masaAdi, kimden: solOyuncu });
          }
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
                  masalar[m].oyunBasladi = false;
                  masalar[m].deste = [];
                  masalar[m].siradakiOyuncu = null;
                  masalar[m].eller = {};
                  masalar[m].iskartalar = {};
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
