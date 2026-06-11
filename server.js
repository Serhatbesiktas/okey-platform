const express = require('express');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

// OYUNCU BANKASI
const oyuncuCipleri = {};

// MASALAR (Bahis miktarları ve Kasa eklendi)
const masalar = {
    'Acemiler (20K Bahis)': { bahis: 20000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {} },
    'Usta Masası (50K Bahis)': { bahis: 50000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {} },
    'Hızlı Oyun (10K Bahis)': { bahis: 10000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {} }
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
        masa.kasa = 0; // Kasa sıfırlanır
        io.emit('oyun_bitti', { masaAdi: masaAdi });
    }
}

// HAKEM ALGORİTMASI
function eliKontrolEt(gruplar, gosterge) {
    if (!gosterge) return false;
    let okeySayi = gosterge.sayi === 13 ? 1 : parseInt(gosterge.sayi) + 1;
    let okeyRenk = gosterge.renk;
    let totalTiles = 0; let isCift = true; let ciftCount = 0;

    for (let grup of gruplar) {
        totalTiles += grup.length;
        if (grup.length !== 2) isCift = false; else ciftCount++;
    }
    if (totalTiles !== 14) return false;

    function getEffectiveTile(t) {
        if (t.renk === okeyRenk && parseInt(t.sayi) === okeySayi) return { isOkey: true };
        if (t.renk === 'sahte') return { renk: okeyRenk, sayi: okeySayi, isOkey: false };
        return { renk: t.renk, sayi: parseInt(t.sayi), isOkey: false };
    }

    if (isCift && ciftCount === 7) {
        for (let grup of gruplar) {
            let t1 = getEffectiveTile(grup[0]); let t2 = getEffectiveTile(grup[1]);
            if (t1.isOkey || t2.isOkey) continue; 
            if (t1.renk !== t2.renk || t1.sayi !== t2.sayi) return false;
        }
        return true;
    }

    for (let grup of gruplar) {
        if (grup.length < 3) return false;
        let normalTiles = [];
        for (let t of grup) {
            let eff = getEffectiveTile(t);
            if (!eff.isOkey) normalTiles.push(eff);
        }
        if (normalTiles.length === 0) continue; 

        let isAyniSayi = true; let isSeri = true;     
        let baseSayi = normalTiles[0].sayi; let colors = new Set();
        for (let t of normalTiles) {
            if (t.sayi !== baseSayi) isAyniSayi = false;
            colors.add(t.renk);
        }
        if (colors.size !== normalTiles.length) isAyniSayi = false; 

        let firstNormalIdx = grup.findIndex(t => !getEffectiveTile(t).isOkey);
        if (firstNormalIdx !== -1) {
            let cSayi = getEffectiveTile(grup[firstNormalIdx]).sayi;
            let cRenk = getEffectiveTile(grup[firstNormalIdx]).renk;
            let expectedForward = cSayi;
            for (let i = firstNormalIdx + 1; i < grup.length; i++) {
                expectedForward = expectedForward === 13 ? 1 : expectedForward + 1;
                let eff = getEffectiveTile(grup[i]);
                if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expectedForward) { isSeri = false; break; } }
            }
            let expectedBackward = cSayi;
            for (let i = firstNormalIdx - 1; i >= 0; i--) {
                expectedBackward = expectedBackward === 1 ? 13 : expectedBackward - 1;
                let eff = getEffectiveTile(grup[i]);
                if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expectedBackward) { isSeri = false; break; } }
            }
        } else { isSeri = false; }
        if (!isAyniSayi && !isSeri) return false;
    }
    return true;
}

function botHamlesiYap(masaAdi) {
    const masa = masalar[masaAdi];
    if(!masa || !masa.oyunBasladi) return;

    const siradaki = masa.siradakiOyuncu;
    if(siradaki && siradaki.startsWith('Bot_')) {
        setTimeout(() => {
            if(!masa.oyunBasladi) return;
            
            if(masa.deste.length === 0) {
                io.emit('sistem_mesaji', `⚠️ ${masaAdi} masasında TAŞ BİTTİ! Oyun berabere sonuçlandı. Çipler masada kaldı!`);
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

  // GİRİŞ VE BANKA KAYDI
  socket.on('kullanici_girisi', (isim) => {
      socket.kullaniciAdi = isim;
      if(!oyuncuCipleri[isim]) oyuncuCipleri[isim] = 250000; // İlk giriş hediyesi
      socket.emit('cip_guncelle', oyuncuCipleri[isim]);
  });

  socket.on('masaya_otur', (data) => {
    const masa = masalar[data.masaAdi];
    if (masa && !masa.koltuklar.includes(data.isim)) {
        if(oyuncuCipleri[data.isim] < masa.bahis) {
            socket.emit('hata_mesaji', `Yeterli çipiniz yok! Bu masanın bahsi: ${masa.bahis.toLocaleString()} ÇİP.`);
            return;
        }

        const bosKoltukIndex = masa.koltuklar.indexOf(null);
        if (bosKoltukIndex !== -1) {
            masa.koltuklar[bosKoltukIndex] = data.isim;
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
        masa.kasa = 0; // Kasa hazırlığı
        
        for(let i=0; i<4; i++) {
            if(masa.koltuklar[i] === null) { masa.koltuklar[i] = "Bot_" + Math.floor(Math.random() * 900 + 100); }
        }
        
        const guncelLobi = {};
        for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar;
        io.emit('masalari_guncelle', guncelLobi);

        // KASAYI DOLDUR VE HESAPLARDAN DÜŞ
        masa.koltuklar.forEach(isim => {
            masa.kasa += masa.bahis; // Herkes kasaya para koyar
            if(!isim.startsWith('Bot_')) {
                oyuncuCipleri[isim] -= masa.bahis; // İnsanların hesabından para kesilir
                io.emit('cip_guncelle_ozel', { isim: isim, cip: oyuncuCipleri[isim] });
            }
        });
        
        io.emit('masa_kasa_guncelle', { masaAdi: masaAdi, kasa: masa.kasa });

        masa.deste = desteYaratVeKaristir(); 
        masa.gosterge = masa.deste.pop();
        const baslayacakOyuncu = masa.koltuklar[Math.floor(Math.random() * 4)];
        masa.siradakiOyuncu = baslayacakOyuncu;
        masa.eller = {}; 
        
        io.emit('masa_oyun_basladi', { masaAdi: masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length, kasa: masa.kasa });
        io.emit('sistem_mesaji', `🎰 Bahisler alındı! Toplam Kasa: ${masa.kasa.toLocaleString()} ÇİP. Oyun başladı!`);

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

  socket.on('taslarimi_ver', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.oyunBasladi && masa.eller[data.isim]) {
          socket.emit('masa_oyun_basladi', { masaAdi: data.masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length, kasa: masa.kasa });
          socket.emit('taslari_al', { kime: data.isim, taslar: masa.eller[data.isim] });
      }
  });

  socket.on('tas_atildi', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
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
              io.emit('sistem_mesaji', `⚠️ ${data.masaAdi} masasında TAŞ BİTTİ! Çipler kasada kaldı.`);
              oyunuSifirla(data.masaAdi); return;
          }
          const cekilenTas = masa.deste.shift(); 
          if(masa.eller[data.isim]) masa.eller[data.isim].push(cekilenTas);
          socket.emit('tas_cekildi', cekilenTas); 
          io.emit('masa_ortasi_guncelle', { masaAdi: data.masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
      }
  });

  socket.on('yandan_tas_alindi', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.eller[data.kimAldi]) { masa.eller[data.kimAldi].push(data.tas); }
      io.emit('yandan_alindi_guncelle', data);
  });

  socket.on('oyunu_bitir', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          const elGecerliMi = eliKontrolEt(data.gruplar, masa.gosterge);
          if(elGecerliMi) {
              // BÜYÜK VURGUN! KASADAKİ PARAYI OYUNCUYA AKTAR
              oyuncuCipleri[data.isim] += masa.kasa;
              io.emit('cip_guncelle_ozel', { isim: data.isim, cip: oyuncuCipleri[data.isim] });
              io.emit('sistem_mesaji', `🎉 BÜYÜK VURGUN! ${data.isim} elini tamamladı ve masadaki ${masa.kasa.toLocaleString()} ÇİPİ KAZANDI! 🎉`);
              oyunuSifirla(data.masaAdi);
          } else {
              socket.emit('hatali_bitis', "Dizilim hatalı veya perler arasında boşluk bırakmadınız! Lütfen elinizi kontrol edin.");
          }
      }
  });

  socket.on('masadan_kalk', (data) => { kullaniciyiMasadanKaldir(data.isim); });
  socket.on('disconnect', () => { if(socket.kullaniciAdi) kullaniciyiMasadanKaldir(socket.kullaniciAdi); });

  function kullaniciyiMasadanKaldir(isim) {
      for(let m in masalar) {
          let index = masalar[m].koltuklar.indexOf(isim);
          if(index !== -1) {
              if (masalar[m].oyunBasladi) {
                  const yeniBot = "Bot_" + Math.floor(Math.random() * 900 + 100);
                  masalar[m].koltuklar[index] = yeniBot;
                  masalar[m].eller[yeniBot] = masalar[m].eller[isim]; 
                  delete masalar[m].eller[isim];
                  io.emit('sistem_mesaji', `⚠️ ${isim} oyundan koptu, yerine ${yeniBot} geçti!`);
                  if (masalar[m].siradakiOyuncu === isim) {
                      masalar[m].siradakiOyuncu = yeniBot;
                      io.emit('sira_guncelle', { masaAdi: m, kimde: yeniBot });
                      botHamlesiYap(m);
                  }
              } else { masalar[m].koltuklar[index] = null; }

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
