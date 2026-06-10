const express = require('express');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

// MASALARIN GELİŞMİŞ HAFIZASI
const masalar = {
    'Acemiler (20K Bahis)': { koltuklar: [null, null, null, null], deste: [], okeyTasi: null, oyunBasladi: false },
    'Usta Masası (50K Bahis)': { koltuklar: [null, null, null, null], deste: [], okeyTasi: null, oyunBasladi: false },
    'Hızlı Oyun (10K Bahis)': { koltuklar: [null, null, null, null], deste: [], okeyTasi: null, oyunBasladi: false }
};

// YAZIM HATASI DÜZELTİLDİ (Boşluk silindi)
function desteYaratVeKaristir() {
    let yeniDeste = [];
    let idSayaci = 1;
    const renkler = ['kirmizi', 'siyah', 'mavi', 'sari'];
    
    // Her renkten 1-13 arası 2'şer set (104 taş)
    for(let set = 0; set < 2; set++) {
        for(let r of renkler) {
            for(let s = 1; s <= 13; s++) {
                yeniDeste.push({ id: 'tas_' + idSayaci++, renk: r, sayi: s });
            }
        }
    }
    // 2 Adet Sahte Okey (106 taş tamamlandı)
    yeniDeste.push({ id: 'tas_' + idSayaci++, renk: 'sahte', sayi: 'S' });
    yeniDeste.push({ id: 'tas_' + idSayaci++, renk: 'sahte', sayi: 'S' });

    // Taşları Karıştır
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

  // OYUNU BAŞLATMA VE TAŞ DAĞITMA EMRİ
  socket.on('oyunu_baslat', (masaAdi) => {
    const masa = masalar[masaAdi];
    if (masa && !masa.oyunBasladi) {
        masa.oyunBasladi = true;
        masa.deste = desteYaratVeKaristir(); // Hatasız fonksiyon çağırılıyor
        
        // Rastgele birini ilk oyuncu seç
        const doluKoltuklar = masa.koltuklar.filter(k => k !== null);
        const baslayacakOyuncu = doluKoltuklar[Math.floor(Math.random() * doluKoltuklar.length)];
        
        io.emit('sistem_mesaji', `${masaAdi} masasında oyun başladı! Taşlar dağıtılıyor... (İlk oynayacak: ${baslayacakOyuncu})`);

        // Taşları Dağıt
        masa.koltuklar.forEach(oyuncuIsmi => {
            if(oyuncuIsmi !== null) {
                const kacTasAlacak = (oyuncuIsmi === baslayacakOyuncu) ? 15 : 14;
                const oyuncununTaslari = masa.deste.splice(0, kacTasAlacak); 
                
                io.emit('taslari_al_' + oyuncuIsmi, oyuncununTaslari);
            }
        });
        
        io.emit('masa_ortasi_guncelle_' + masaAdi, { kalanTas: masa.deste.length });
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
