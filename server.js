const express = require('express');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

const oyuncuCipleri = {};
const oyuncuVipDurumu = {}; // YENİ: Oyuncuların VIP statüsünü tutar
const kopanOyuncular = {}; 

const masalar = {
    'Acemiler (20K Bahis)': { bahis: 20000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeYapilabilir: false, gostergeYapanlar: [] },
    'Usta Masası (50K Bahis)': { bahis: 50000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeYapilabilir: false, gostergeYapanlar: [] },
    'Hızlı Oyun (10K Bahis)': { bahis: 10000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeYapilabilir: false, gostergeYapanlar: [] }
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

function oyunuSifirla(masaAdi, kazanan = null, odul = 0, sebep = "") {
    const masa = masalar[masaAdi];
    if(masa) {
        masa.oyunBasladi = false;
        masa.deste = [];
        masa.gosterge = null;
        masa.siradakiOyuncu = null;
        masa.eller = {};
        masa.kasa = 0; 
        masa.gostergeYapilabilir = false;
        masa.gostergeYapanlar = [];
        
        for(let k in kopanOyuncular) {
            if(kopanOyuncular[k].masaAdi === masaAdi) delete kopanOyuncular[k];
        }

        io.emit('oyun_bitti', { masaAdi: masaAdi, kazanan: kazanan, odul: odul, sebep: sebep });
    }
}

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
                if (expectedForward === 1) { isSeri = false; break; }
                expectedForward = expectedForward === 13 ? 1 : expectedForward + 1;
                let eff = getEffectiveTile(grup[i]);
                if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expectedForward) { isSeri = false; break; } }
            }
            let expectedBackward = cSayi;
            for (let i = firstNormalIdx - 1; i >= 0; i--) {
                if (expectedBackward === 1) { isSeri = false; break; }
                expectedBackward = expectedBackward === 1 ? 13 : expectedBackward - 1;
                let eff = getEffectiveTile(grup[i]);
                if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expectedBackward) { isSeri = false; break; } }
            }
        } else { isSeri = false; }
        if (!isAyniSayi && !isSeri) return false;
    }
    return true;
}

function enCopTasiBul(el, gosterge) {
    if (!el || el.length === 0) return 0;
    let okeySayi = gosterge ? (gosterge.sayi === 13 ? 1 : parseInt(gosterge.sayi) + 1) : -1;
    let okeyRenk = gosterge ? gosterge.renk : '';

    let skorlar = el.map((tas, index) => {
        let skor = 0;
        let isOkey = (tas.renk === okeyRenk && parseInt(tas.sayi) === okeySayi);
        if (isOkey) return { index: index, skor: 9999 }; 
        if (tas.renk === 'sahte') return { index: index, skor: 900 }; 

        let ayniSayiBaskaRenk = el.filter(t => t.sayi === tas.sayi && t.renk !== tas.renk).length;
        skor += (ayniSayiBaskaRenk * 10);

        let tasSayi = parseInt(tas.sayi);
        let ardisik = el.filter(t => t.renk === tas.renk && Math.abs(parseInt(t.sayi) - tasSayi) <= 2 && t.id !== tas.id).length;
        skor += (ardisik * 15);

        let ayniTas = el.filter(t => t.renk === tas.renk && t.sayi === tas.sayi && t.id !== tas.id).length;
        skor += (ayniTas * 5);

        return { index: index, skor: skor };
    });

    skorlar.sort((a, b) => a.skor - b.skor);
    return skorlar[0].index; 
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
                oyunuSifirla(masaAdi, null, 0, "Ortadaki taşlar bitti, oyun berabere!");
                return;
            }

            masa.gostergeYapilabilir = false; 
            const cekilenTas = masa.deste.shift(); 
            masa.eller[siradaki].push(cekilenTas); 
            io.emit('masa_ortasi_guncelle', { masaAdi: masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
            
            setTimeout(() => {
                if(!masa.oyunBasladi) return;
                
                const botunEli = masa.eller[siradaki];
                const atilacakIndex = enCopTasiBul(botunEli, masa.gosterge);
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

  socket.on('kullanici_girisi', (isim) => {
      socket.kullaniciAdi = isim;
      if(!oyuncuCipleri[isim]) {
          oyuncuCipleri[isim] = 250000;
          oyuncuVipDurumu[isim] = false; // Varsayılan olarak normal üye
      }
      socket.emit('cip_guncelle', oyuncuCipleri[isim]);

      let masadaBulundu = false;
      for(let m in masalar) {
          if (masalar[m].koltuklar.includes(isim)) {
              masadaBulundu = true;
              socket.emit('kaldigin_yerden_devam', { masaAdi: m, koltuklar: masalar[m].koltuklar });
              break;
          }
      }

      if (!masadaBulundu && kopanOyuncular[isim]) {
          const data = kopanOyuncular[isim];
          const masa = masalar[data.masaAdi];
          
          if (masa && masa.oyunBasladi) {
              let botIndex = masa.koltuklar.indexOf(data.botIsmi);
              if (botIndex !== -1) {
                  masa.koltuklar[botIndex] = isim;
                  masa.eller[isim] = masa.eller[data.botIsmi];
                  delete masa.eller[data.botIsmi];
                  
                  if (masa.siradakiOyuncu === data.botIsmi) masa.siradakiOyuncu = isim;
                  delete kopanOyuncular[isim]; 
                  
                  socket.emit('kaldigin_yerden_devam', { masaAdi: data.masaAdi, koltuklar: masa.koltuklar });
                  io.emit('sistem_mesaji', `✅ ${isim} bağlantısını kurtardı ve oyuna geri döndü!`);
                  
                  const guncelLobi = {};
                  for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar;
                  io.emit('masalari_guncelle', guncelLobi);
                  io.emit('sira_guncelle', { masaAdi: data.masaAdi, kimde: masa.siradakiOyuncu });
              }
          } else { delete kopanOyuncular[isim]; }
      }
  });

  // YENİ: PROFİL TALEBİ ROTASI
  socket.on('profil_talebi', (hedefIsim) => {
      if (hedefIsim.startsWith('Bot_')) {
          socket.emit('profil_yaniti', { isim: hedefIsim, cip: 'Sınırsız', vip: true, botMu: true });
      } else {
          socket.emit('profil_yaniti', { 
              isim: hedefIsim, 
              cip: oyuncuCipleri[hedefIsim] || 0, 
              vip: oyuncuVipDurumu[hedefIsim] || false,
              botMu: false 
          });
      }
  });

  // YENİ: HİLE/TEST AMAÇLI VIP TOGGLED ROTASI
  socket.on('vip_durumunu_degistir', (data) => {
      oyuncuVipDurumu[data.isim] = data.yeniDurum;
      socket.emit('sistem_mesaji', `👑 VIP Durumunuz Güncellendi: ${data.yeniDurum ? 'VIP ÜYE' : 'Normal Üye'}`);
  });

  // YENİ: ÖZEL FİSILTI MESAJLAŞMA ROTASI
  socket.on('fisilti_gonder', (data) => {
      // Sadece VIP olanlar fısıldayabilir (Güvenlik kontrolü)
      if (!oyuncuVipDurumu[data.kimden]) {
          socket.emit('hata_mesaji', "Fısıltı göndermek için VIP üye olmalısınız!");
          return;
      }
      
      const hedefSocket = Array.from(io.of("/").sockets.values()).find(s => s.kullaniciAdi === data.kime);
      if (hedefSocket) {
          hedefSocket.emit('fisilti_geldi', { kimden: data.kimden, kime: data.kime, mesaj: data.mesaj });
          socket.emit('fisilti_geldi', { kimden: data.kimden, kime: data.kime, mesaj: data.mesaj });
      } else {
          socket.emit('sistem_mesaji', `⚠️ Fısıltı başarısız: ${data.kime} şu an çevrimdışı.`);
      }
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
        masa.gostergeYapilabilir = true; 
        masa.gostergeYapanlar = [];
        masa.kasa = 0; 
        
        for(let i=0; i<4; i++) {
            if(masa.koltuklar[i] === null) { masa.koltuklar[i] = "Bot_" + Math.floor(Math.random() * 900 + 100); }
        }
        
        const guncelLobi = {};
        for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar;
        io.emit('masalari_guncelle', guncelLobi);

        masa.koltuklar.forEach(isim => {
            masa.kasa += masa.bahis; 
            if(!isim.startsWith('Bot_')) {
                oyuncuCipleri[isim] -= masa.bahis; 
                io.emit('cip_guncelle_ozel', { isim: isim, cip: oyuncuCipleri[isim] });
            }
        });
        
        io.emit('masa_kasa_guncelle', { masaAdi: masaAdi, kasa: masa.kasa });

        masa.deste = desteYaratVeKaristir(); 
        
        let gIndex = masa.deste.length - 1;
        while(masa.deste[gIndex].renk === 'sahte') { gIndex--; }
        masa.gosterge = masa.deste.splice(gIndex, 1)[0]; 
        
        const baslayacakOyuncu = masa.koltuklar[Math.floor(Math.random() * 4)];
        masa.siradakiOyuncu = baslayacakOyuncu;
        masa.eller = {}; 
        
        io.emit('masa_oyun_basladi', { masaAdi: masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length, kasa: masa.kasa });
        io.emit('sistem_mesaji', `🎰 Oyun başladı! Göstergesi olan göstersin! Toplam Kasa: ${masa.kasa.toLocaleString()} ÇİP.`);

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

  socket.on('gosterge_yap', (data) => {
      const masa = masalar[data.masaAdi];
      if (masa && masa.gostergeYapilabilir && !masa.gostergeYapanlar.includes(data.isim)) {
          const varMi = masa.eller[data.isim].some(t => t.renk === masa.gosterge.renk && t.sayi === masa.gosterge.sayi && t.id !== masa.gosterge.id);
          
          if (varMi) {
              masa.gostergeYapanlar.push(data.isim);
              let kesilecekCip = masa.bahis / 2; 
              let toplamKazanilan = 0;

              this.masalar[data.masaAdi].koltuklar.forEach(k => {
                  if (k !== data.isim) {
                      if (!k.startsWith('Bot_')) {
                          oyuncuCipleri[k] -= kesilecekCip;
                          io.emit('cip_guncelle_ozel', { isim: k, cip: oyuncuCipleri[k] });
                      }
                      toplamKazanilan += kesilecekCip;
                  }
              });

              oyuncuCipleri[data.isim] += toplamKazanilan;
              io.emit('cip_guncelle_ozel', { isim: data.isim, cip: oyuncuCipleri[data.isim] });

              io.emit('gosterge_basarili', { masaAdi: data.masaAdi, kimYapti: data.isim });
              io.emit('sistem_mesaji', `🌟 ŞOV ZAMANI! ${data.isim} masaya GÖSTERGE yaptı ve ${toplamKazanilan.toLocaleString()} ÇİP topladı! 🌟`);
          }
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
          masa.gostergeYapilabilir = false; 
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
          masa.gostergeYapilabilir = false; 
          if(masa.deste.length === 0) {
              io.emit('sistem_mesaji', `⚠️ ${data.masaAdi} masasında TAŞ BİTTİ!`);
              oyunuSifirla(data.masaAdi, null, 0, "Ortadaki taşlar bitti, el berabere!"); 
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
          masa.gostergeYapilabilir = false; 
          masa.eller[data.kimAldi].push(data.tas); 
      }
      io.emit('yandan_alindi_guncelle', data);
  });

  socket.on('oyunu_bitir', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          const elGecerliMi = eliKontrolEt(data.gruplar, masa.gosterge);
          if(elGecerliMi) {
              let okeySayi = masa.gosterge.sayi === 13 ? 1 : parseInt(masa.gosterge.sayi) + 1;
              let okeyRenk = masa.gosterge.renk;
              let bitisTasi = data.bitisTasi;
              let okeyAttiMi = false;

              if (bitisTasi && bitisTasi.renk === okeyRenk && parseInt(bitisTasi.sayi) === okeySayi) {
                  okeyAttiMi = true;
              }

              let kazanilanPara = masa.kasa;
              let sebep = "Mükemmel bir dizilimle elini tamamladı!";

              if (okeyAttiMi) {
                  kazanilanPara = masa.kasa * 2;
                  sebep = "🔥 OKEY ATARAK BİTİRDİ! Ödül İkiye Katlandı! 🔥";
              }

              oyuncuCipleri[data.isim] += kazanilanPara;
              io.emit('cip_guncelle_ozel', { isim: data.isim, cip: oyuncuCipleri[data.isim] });
              
              if (okeyAttiMi) {
                  io.emit('sistem_mesaji', `🚨 İNANILMAZ! ${data.isim} OKEY ATARAK BİTİRDİ VE ${kazanilanPara.toLocaleString()} ÇİP KAZANDI! 🚨`);
              } else {
                  io.emit('sistem_mesaji', `🎉 BÜYÜK VURGUN! ${data.isim} elini tamamladı ve masadaki ${kazanilanPara.toLocaleString()} ÇİPİ KAZANDI! 🎉`);
              }
              
              oyunuSifirla(data.masaAdi, data.isim, kazanilanPara, sebep);
          } else {
              socket.emit('hatali_bitis', "Dizilim hatalı veya perler arasında boşluk bırakmadınız! Lütfen elinizi kontrol edin.");
          }
      }
  });

  socket.on('masadan_kalk', (data) => { kullaniciyiMasadanKaldir(data.isim, false); });
  socket.on('disconnect', () => { if(socket.kullaniciAdi) kullaniciyiMasadanKaldir(socket.kullaniciAdi, true); });

  function kullaniciyiMasadanKaldir(isim, koptuMu) {
      for(let m in masalar) {
          let index = masalar[m].koltuklar.indexOf(isim);
          if(index !== -1) {
              if (masalar[m].oyunBasladi) {
                  const yeniBot = "Bot_" + Math.floor(Math.random() * 900 + 100);
                  masalar[m].koltuklar[index] = yeniBot;
                  masalar[m].eller[yeniBot] = masalar[m].eller[isim]; 
                  delete masalar[m].eller[isim];
                  
                  if (koptuMu) { kopanOyuncular[isim] = { masaAdi: m, botIsmi: yeniBot }; }

                  io.emit('sistem_mesaji', `⚠️ ${isim} oyundan ayrıldı, yerine ${yeniBot} geçti!`);
                  if (masalar[m].siradakiOyuncu === isim) {
                      masalar[m].siradakiOyuncu = yeniBot;
                      io.emit('sira_guncelle', { masaAdi: m, kimde: yeniBot });
                      botHamlesiYap(m);
                  }
              } else { masalar[m].koltuklar[index] = null; }

              if(!masalar[m].oyunBasladi && masalar[m].koltuklar.every(k => k === null || k.startsWith('Bot_'))) {
                  masalar[m].koltuklar = [null, null, null, null]; 
              }
              const guncelLobi = {};
              for(let ms in masalar) guncelLobi[ms] = masalar[ms].koltuklar;
              io.emit('masalari_guncelle', guncelLobi);
              break;
          }
      }
  }

  socket.on('lobi_mesaji_gonder', (data) => { io.emit('lobi_mesaji_geldi', { isim: data.isim, mesaj: data.mesaj }); });
  socket.on('masa_mesaji_gonder', (data) => { io.emit('masa_mesaji_geldi', { masaAdi: data.masaAdi, isim: data.isim, mesaj: data.mesaj, emojiMi: data.emojiMi }); });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log(`Sunucu ${PORT} portunda aktif...`); });
