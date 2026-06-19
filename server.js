const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

const oyuncuCipleri = {};
const oyuncuKozmetikleri = {}; 
const banliKullanicilar = new Set(); 
const baglantiKopanlar = {}; 

// YENİ: Posta Kutusu Veritabanı (Geçici Hafıza)
const postaKutusu = {}; 

const masalar = {
    'Acemiler (20K Bahis)': { bahis: 20000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false },
    'Usta Masası (50K Bahis)': { bahis: 50000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false },
    'Hızlı Oyun (10K Bahis)': { bahis: 10000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false }
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

function oyunuSifirla(masaAdi, kazanan = null, odul = 0, sebep = "", okeyleBittiMi = false) {
    const masa = masalar[masaAdi];
    if(masa) {
        masa.oyunBasladi = false;
        masa.deste = [];
        masa.gosterge = null;
        masa.siradakiOyuncu = null;
        masa.eller = {};
        masa.kasa = 0; 
        masa.gostergeGosterildi = false;
        io.emit('oyun_bitti', { masaAdi: masaAdi, kazanan: kazanan, odul: odul, sebep: sebep, okeyleBittiMi: okeyleBittiMi });
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

        let isAyniSayi = true; 
        let baseSayi = normalTiles[0].sayi; let colors = new Set();
        for (let t of normalTiles) {
            if (t.sayi !== baseSayi) isAyniSayi = false;
            colors.add(t.renk);
        }
        if (colors.size !== normalTiles.length) isAyniSayi = false; 

        let isSeriArtan = true; let isSeriAzalan = true; 
        let firstNormalIdx = grup.findIndex(t => !getEffectiveTile(t).isOkey);

        if (firstNormalIdx !== -1) {
            let cSayi = getEffectiveTile(grup[firstNormalIdx]).sayi;
            let cRenk = getEffectiveTile(grup[firstNormalIdx]).renk;
            
            let expFwdArtan = cSayi;
            for (let i = firstNormalIdx + 1; i < grup.length; i++) {
                expFwdArtan = expFwdArtan === 13 ? 1 : expFwdArtan + 1;
                let eff = getEffectiveTile(grup[i]);
                if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expFwdArtan) { isSeriArtan = false; break; } }
            }
            let expBwdArtan = cSayi;
            for (let i = firstNormalIdx - 1; i >= 0; i--) {
                expBwdArtan = expBwdArtan === 1 ? 13 : expBwdArtan - 1;
                let eff = getEffectiveTile(grup[i]);
                if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expBwdArtan) { isSeriArtan = false; break; } }
            }

            let expFwdAzalan = cSayi;
            for (let i = firstNormalIdx + 1; i < grup.length; i++) {
                expFwdAzalan = expFwdAzalan === 1 ? 13 : expFwdAzalan - 1;
                let eff = getEffectiveTile(grup[i]);
                if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expFwdAzalan) { isSeriAzalan = false; break; } }
            }
            let expBwdAzalan = cSayi;
            for (let i = firstNormalIdx - 1; i >= 0; i--) {
                expBwdAzalan = expBwdAzalan === 13 ? 1 : expBwdAzalan + 1;
                let eff = getEffectiveTile(grup[i]);
                if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expBwdAzalan) { isSeriAzalan = false; break; } }
            }
        } else { isSeriArtan = false; isSeriAzalan = false; }

        if (!isAyniSayi && !isSeriArtan && !isSeriAzalan) return false;
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
                io.emit('sistem_mesaji', `⚠️ ${masaAdi} masasında TAŞ BİTTİ! Oyun berabere sonuçlandı.`);
                oyunuSifirla(masaAdi, null, 0, "Ortadaki taşlar bitti, oyun berabere!");
                return;
            }

            const cekilenTas = masa.deste.shift(); 
            masa.eller[siradaki].push(cekilenTas); 
            io.emit('masa_ortasi_guncelle', { masaAdi: masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
            
            setTimeout(() => {
                if(!masa.oyunBasladi) return;
                const botunEli = masa.eller[siradaki];
                let okeySayi = masa.gosterge.sayi === 13 ? 1 : parseInt(masa.gosterge.sayi) + 1;
                let okeyRenk = masa.gosterge.renk;
                
                let guvenliTaslar = botunEli.filter(t => {
                    let isOkey = (t.renk === okeyRenk && parseInt(t.sayi) === okeySayi);
                    return !isOkey && t.renk !== 'sahte';
                });

                if(guvenliTaslar.length === 0) guvenliTaslar = botunEli; 

                const atilacakIndex = Math.floor(Math.random() * guvenliTaslar.length);
                const atilanTas = guvenliTaslar[atilacakIndex];
                
                const gercekIndex = botunEli.findIndex(t => t.id === atilanTas.id);
                botunEli.splice(gercekIndex, 1); 

                io.emit('ortaya_tas_atildi', { masaAdi: masaAdi, kimAtti: siradaki, tas: atilanTas });

                let currentIndex = masa.koltuklar.indexOf(siradaki);
                if(currentIndex === -1) return;

                let nextIndex = (currentIndex + 1) % 4;
                masa.siradakiOyuncu = masa.koltuklar[nextIndex];
                
                io.emit('sistem_mesaji', `${siradaki} hamlesini yaptı. Sıra ${masa.siradakiOyuncu}'da!`);
                io.emit('sira_guncelle', { masaAdi: masaAdi, kimde: masa.siradakiOyuncu });
                
                if(masa.siradakiOyuncu && masa.siradakiOyuncu.startsWith('Bot_')) { botHamlesiYap(masaAdi); }
            }, 1500); 
        }, 1500); 
    }
}

function kullaniciyiMasadanKaldir(isim) {
    let degisiklikOldu = false;
    let silinecekMasalar = [];
    
    for(let m in masalar) {
        let index = masalar[m].koltuklar.indexOf(isim);
        if(index !== -1) {
            if (masalar[m].oyunBasladi) {
                let ceza = masalar[m].bahis;
                if(oyuncuCipleri[isim] !== undefined) {
                    let c = Number(oyuncuCipleri[isim]);
                    if (isNaN(c)) c = 0; 
                    oyuncuCipleri[isim] = Math.max(0, c - Number(ceza));
                    io.emit('cip_guncelle_ozel', { isim: isim, cip: oyuncuCipleri[isim] });
                }
                const yeniBot = "Bot_" + Math.floor(Math.random() * 900 + 100);
                masalar[m].koltuklar[index] = yeniBot;
                masalar[m].eller[yeniBot] = masalar[m].eller[isim]; 
                delete masalar[m].eller[isim];
                
                io.emit('sistem_mesaji', `🏃‍♂️💨 ${isim} masadan kaçtı ve ${ceza.toLocaleString()} ÇİP ceza yedi! Yerine ${yeniBot} geçti.`);
                
                if (masalar[m].siradakiOyuncu === isim) {
                    masalar[m].siradakiOyuncu = yeniBot;
                    io.emit('sira_guncelle', { masaAdi: m, kimde: yeniBot });
                    botHamlesiYap(m);
                }
            } else { 
                masalar[m].koltuklar[index] = null; 
            }

            if (masalar[m].isVIP) {
                if (masalar[m].sahibi === isim) {
                    io.emit('vip_masa_kapandi', { masaAdi: m });
                    silinecekMasalar.push(m);
                } else {
                    let humanCount = masalar[m].koltuklar.filter(k => k !== null && !k.startsWith('Bot_')).length;
                    if (humanCount === 0) silinecekMasalar.push(m);
                }
            } else {
                if(masalar[m].koltuklar.every(k => k === null || k.startsWith('Bot_'))) {
                    oyunuSifirla(m, null, 0, "Masada kimse kalmadı.");
                    masalar[m].koltuklar = [null, null, null, null]; 
                }
            }
            degisiklikOldu = true;
            break; 
        }
    }
    
    silinecekMasalar.forEach(m => delete masalar[m]);

    if(degisiklikOldu) {
        const guncelLobi = {};
        for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar;
        io.emit('masalari_guncelle', guncelLobi);
    }
}

io.on('connection', (socket) => {
  const lobiVerisi = {};
  for(let m in masalar) lobiVerisi[m] = masalar[m].koltuklar;
  socket.emit('masalari_guncelle', lobiVerisi);

  socket.on('kullanici_girisi', (data) => {
      let isim = typeof data === 'object' ? data.isim : data;
      let dbCip = typeof data === 'object' ? data.cip : 250000;
      let dbKozmetikler = typeof data === 'object' && data.kozmetikler ? data.kozmetikler : []; 
      
      if(banliKullanicilar.has(isim)) { socket.emit('admin_islem_uyarisi', { isim: isim, islem: 'ban' }); return; }
      if(baglantiKopanlar[isim]) { clearTimeout(baglantiKopanlar[isim]); delete baglantiKopanlar[isim]; }

      socket.kullaniciAdi = isim;
      let c = Number(dbCip); if(isNaN(c) || c === null) c = 0; oyuncuCipleri[isim] = c; 
      oyuncuKozmetikleri[isim] = dbKozmetikler; 

      socket.emit('cip_guncelle', oyuncuCipleri[isim]);
      io.emit('admin_guncel_veri', oyuncuCipleri);
      io.emit('kozmetikleri_guncelle', oyuncuKozmetikleri); 
      io.emit('online_oyuncular', Object.keys(oyuncuCipleri));

      // Kullanıcı giriş yapınca posta kutusunu da gönder
      socket.emit('posta_kutusu_verisi', postaKutusu[isim] || []);
      
      let masaBulundu = null;
      for(let m in masalar) { if(masalar[m].koltuklar.includes(isim)) { masaBulundu = m; break; } }
      if(masaBulundu) { socket.emit('sen_masadasin', { masaAdi: masaBulundu, isVIP: masalar[masaBulundu].isVIP || false, sahibi: masalar[masaBulundu].sahibi || "", gizli: masalar[masaBulundu].gizli || false }); }
  });

  // YENİ: ÖZEL MESAJLAŞMA (DM) ALTYAPISI
  socket.on('ozel_mesaj_gonder', (data) => {
      const { kimden, kime, mesaj } = data;
      if (!postaKutusu[kime]) postaKutusu[kime] = [];
      
      const yeniMesaj = {
          id: Date.now(),
          kimden: kimden,
          mesaj: mesaj,
          tarih: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          okundu: false
      };
      
      postaKutusu[kime].push(yeniMesaj);
      io.emit('yeni_ozel_mesaj_bildirimi', { kime: kime }); // Alıcıya bildirim gönder
  });

  socket.on('posta_kutusu_iste', (isim) => {
      socket.emit('posta_kutusu_verisi', postaKutusu[isim] || []);
  });

  socket.on('mesajlari_okundu_yap', (isim) => {
      if (postaKutusu[isim]) {
          postaKutusu[isim].forEach(m => m.okundu = true);
      }
      socket.emit('posta_kutusu_verisi', postaKutusu[isim] || []); // Güncel listeyi geri yolla
  });

  socket.on('esya_firlat', (data) => {
      const masa = masalar[data.masaAdi];
      let kimdenCip = Number(oyuncuCipleri[data.kimden]); if (isNaN(kimdenCip)) kimdenCip = 0;

      if(masa && kimdenCip >= 5000) {
          oyuncuCipleri[data.kimden] = Math.max(0, kimdenCip - 5000);
          io.emit('cip_guncelle_ozel', { isim: data.kimden, cip: oyuncuCipleri[data.kimden] });
          io.emit('esya_firlatildi', data);
      } else { socket.emit('hata_mesaji', "Bu eşyayı fırlatmak için en az 5.000 ÇİP'e ihtiyacın var!"); }
  });

  socket.on('vip_masa_kur', (data) => {
      kullaniciyiMasadanKaldir(data.sahibi); 

      let miktar = Number(data.bahis);
      let pCip = Number(oyuncuCipleri[data.sahibi]); if(isNaN(pCip)) pCip = 0;
      if(pCip < miktar) { socket.emit('hata_mesaji', "Yetersiz Bakiye! VIP masa kurmak için çipiniz yetersiz."); return; }
      
      const vMasaAdi = `👑 VIP: ${data.sahibi} Masası`;
      masalar[vMasaAdi] = {
          bahis: miktar, kasa: 0, koltuklar: [data.sahibi, null, null, null],
          deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false,
          isVIP: true, sahibi: data.sahibi, gizli: data.gizli, davetliler: []
      };
      socket.emit('sen_masadasin', { masaAdi: vMasaAdi, isVIP: true, sahibi: data.sahibi, gizli: data.gizli });
      const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi);
  });

  socket.on('vip_masa_gizlilik_degis', (data) => {
      const masa = masalar[data.masaAdi];
      if (masa && masa.sahibi === data.isim) {
          masa.gizli = !masa.gizli;
          io.emit('yeni_sohbet_mesaji', { masaAdi: data.masaAdi, isim: "Sistem", mesaj: `🔒 Oda durumu güncellendi: ${masa.gizli ? 'SADECE DAVETLİLER' : 'HERKESE AÇIK'}`, kozmetikler: [] });
          io.emit('vip_durum_guncelle', { masaAdi: data.masaAdi, gizli: masa.gizli });
          const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi);
      }
  });

  socket.on('magaza_harcamasi', (data) => { if (oyuncuCipleri[data.isim] !== undefined) { oyuncuCipleri[data.isim] = Number(data.yeniCip); io.emit('admin_guncel_veri', oyuncuCipleri); } });
  socket.on('kozmetik_guncelle', (data) => { oyuncuKozmetikleri[data.isim] = data.kozmetikler; io.emit('kozmetikleri_guncelle', oyuncuKozmetikleri); });
  socket.on('liderlik_tablosu_iste', () => { const siraliList = Object.entries(oyuncuCipleri).map(entry => ({ isim: entry[0], cip: entry[1] })).filter(k => !k.isim.startsWith('MİSAFİR_')).sort((a, b) => b.cip - a.cip).slice(0, 10); socket.emit('liderlik_tablosu_guncelle', siraliList); });
  socket.on('masaya_davet_et', (data) => { const masa = masalar[data.masaAdi]; if (masa && masa.isVIP) { if (!masa.davetliler.includes(data.kime)) masa.davetliler.push(data.kime); } io.emit('davet_geldi', data); });

  socket.on('masaya_otur', (data) => {
    kullaniciyiMasadanKaldir(data.isim); 
    
    const masa = masalar[data.masaAdi];
    if (masa && !masa.koltuklar.includes(data.isim)) {
        let uCip = Number(oyuncuCipleri[data.isim]); if(isNaN(uCip)) uCip = 0;
        if(uCip < masa.bahis) { socket.emit('hata_mesaji', `Yeterli çipiniz yok! Bu masanın bahsi: ${masa.bahis.toLocaleString()} ÇİP.`); return; }
        
        if (masa.isVIP && masa.gizli && masa.sahibi !== data.isim) {
            if (!masa.davetliler || !masa.davetliler.includes(data.isim)) { socket.emit('hata_mesaji', "🚫 Bu VIP masa kilitlidir! Sadece oda sahibinin davet ettiği kişiler girebilir."); return; }
        }
        
        const bosKoltukIndex = masa.koltuklar.indexOf(null);
        if (bosKoltukIndex !== -1) {
            masa.koltuklar[bosKoltukIndex] = data.isim;
            const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi);
        }
    }
  });

  socket.on('oyunu_baslat', (masaAdi) => {
    const masa = masalar[masaAdi];
    if (masa && !masa.oyunBasladi && masa.koltuklar.includes(socket.kullaniciAdi)) {
        masa.oyunBasladi = true; masa.gostergeGosterildi = false; masa.kasa = 0; 
        for(let i=0; i<4; i++) { if(masa.koltuklar[i] === null) { masa.koltuklar[i] = "Bot_" + Math.floor(Math.random() * 900 + 100); } }
        const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi);

        masa.koltuklar.forEach(isim => {
            masa.kasa += masa.bahis; 
            if(!isim.startsWith('Bot_')) {
                let uCip = Number(oyuncuCipleri[isim]); if(isNaN(uCip)) uCip = 0;
                oyuncuCipleri[isim] = Math.max(0, uCip - Number(masa.bahis)); 
                io.emit('cip_guncelle_ozel', { isim: isim, cip: oyuncuCipleri[isim] });
            }
        });
        
        masa.deste = desteYaratVeKaristir(); 
        let secilenGosterge = masa.deste.pop();
        while (secilenGosterge.renk === 'sahte') { masa.deste.unshift(secilenGosterge); secilenGosterge = masa.deste.pop(); }
        masa.gosterge = secilenGosterge;
        const baslayacakOyuncu = masa.koltuklar[Math.floor(Math.random() * 4)]; masa.siradakiOyuncu = baslayacakOyuncu; masa.eller = {}; 
        
        masa.koltuklar.forEach(oyuncuIsmi => {
            const kacTasAlacak = (oyuncuIsmi === baslayacakOyuncu) ? 15 : 14;
            const oyuncununTaslari = masa.deste.splice(0, kacTasAlacak); masa.eller[oyuncuIsmi] = oyuncununTaslari; 
        });
        
        io.emit('masa_oyun_basladi', { masaAdi: masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length, kasa: masa.kasa, koltuklar: masa.koltuklar });
        io.emit('sistem_mesaji', `🎰 Bahisler alındı! Oyun başladı. Elinde gösterge olan butona bassın!`);

        masa.koltuklar.forEach(oyuncuIsmi => { if(!oyuncuIsmi.startsWith('Bot_')) { io.emit('taslari_al', { kime: oyuncuIsmi, taslar: masa.eller[oyuncuIsmi] }); } });
        io.emit('masa_ortasi_guncelle', { masaAdi: masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
        io.emit('sira_guncelle', { masaAdi: masaAdi, kimde: masa.siradakiOyuncu });

        if(masa.siradakiOyuncu.startsWith('Bot_')) { botHamlesiYap(masaAdi); }
    }
  });

  socket.on('gosterge_goster', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.oyunBasladi && !masa.gostergeGosterildi) {
          const hasTile = masa.eller[data.isim].some(t => t.renk === masa.gosterge.renk && t.sayi === masa.gosterge.sayi);
          if(hasTile) {
              masa.gostergeGosterildi = true; const odul = masa.bahis; let uCip = Number(oyuncuCipleri[data.isim]); if(isNaN(uCip)) uCip = 0; oyuncuCipleri[data.isim] = uCip + Number(odul);
              io.emit('cip_guncelle_ozel', { isim: data.isim, cip: oyuncuCipleri[data.isim] }); io.emit('gosterge_basarili', { masaAdi: data.masaAdi, isim: data.isim, odul: odul }); io.emit('yeni_sohbet_mesaji', { masaAdi: data.masaAdi, isim: "Sistem", mesaj: `⭐ ${data.isim} gösterge yaptı ve ${odul.toLocaleString('tr-TR')} ÇİP kazandı!`, kozmetikler: [] });
          }
      }
  });

  socket.on('tas_atildi', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          if(masa.eller[data.isim]) { const tasIndex = masa.eller[data.isim].findIndex(t => t.id === data.tas.id); if(tasIndex !== -1) masa.eller[data.isim].splice(tasIndex, 1); }
          io.emit('ortaya_tas_atildi', { masaAdi: data.masaAdi, kimAtti: data.isim, tas: data.tas });
          let currentIndex = masa.koltuklar.indexOf(data.isim); let nextIndex = (currentIndex + 1) % 4; masa.siradakiOyuncu = masa.koltuklar[nextIndex];
          io.emit('sistem_mesaji', `Hamle yapıldı. Sıra ${masa.siradakiOyuncu}'da!`); io.emit('sira_guncelle', { masaAdi: data.masaAdi, kimde: masa.siradakiOyuncu }); if(masa.siradakiOyuncu.startsWith('Bot_')) { botHamlesiYap(data.masaAdi); }
      }
  });

  socket.on('ortadan_tas_cek', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          if(masa.deste.length === 0) { io.emit('sistem_mesaji', `⚠️ ${data.masaAdi} masasında TAŞ BİTTİ!`); oyunuSifirla(data.masaAdi, null, 0, "Ortadaki taşlar bitti, el berabere!"); return; }
          const cekilenTas = masa.deste.shift(); if(masa.eller[data.isim]) masa.eller[data.isim].push(cekilenTas);
          socket.emit('tas_cekildi', cekilenTas); io.emit('masa_ortasi_guncelle', { masaAdi: data.masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
      }
  });

  socket.on('yandan_tas_alindi', (data) => { const masa = masalar[data.masaAdi]; if(masa && masa.eller[data.kimAldi]) { masa.eller[data.kimAldi].push(data.tas); } io.emit('yandan_alindi_guncelle', data); });

  socket.on('oyunu_bitir', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          const elGecerliMi = eliKontrolEt(data.gruplar, masa.gosterge);
          if(elGecerliMi) {
              let okeyleBittiMi = false; let kazanilanPara = masa.kasa; let sebepMesaji = "Mükemmel bir dizilimle elini tamamladı!";
              if (data.bitisTasi) { let okeySayi = masa.gosterge.sayi === 13 ? 1 : parseInt(masa.gosterge.sayi) + 1; let okeyRenk = masa.gosterge.renk; if (data.bitisTasi.renk === okeyRenk && parseInt(data.bitisTasi.sayi) === okeySayi) { okeyleBittiMi = true; kazanilanPara = masa.kasa * 2; sebepMesaji = "🔥 İNANILMAZ! Yere Okey Atarak Bitirdi! Çifte Kazanç! 🔥"; } }
              let uCip = Number(oyuncuCipleri[data.isim]); if(isNaN(uCip)) uCip = 0; oyuncuCipleri[data.isim] = uCip + Number(kazanilanPara);
              io.emit('cip_guncelle_ozel', { isim: data.isim, cip: oyuncuCipleri[data.isim] }); io.emit('yeni_sohbet_mesaji', { masaAdi: data.masaAdi, isim: "Sistem", mesaj: `🏆 Oyun bitti! Kazanan: ${data.isim} (+${kazanilanPara.toLocaleString('tr-TR')} ÇİP)`, kozmetikler: [] }); oyunuSifirla(data.masaAdi, data.isim, kazanilanPara, sebepMesaji, okeyleBittiMi);
          } else { socket.emit('hatali_bitis', "Dizilim hatalı veya perler arasında boşluk bırakmadınız! Lütfen elinizi kontrol edin."); }
      }
  });

  socket.on('masaya_geri_don', (data) => { const masa = masalar[data.masaAdi]; if (masa && masa.oyunBasladi && masa.koltuklar.includes(data.isim)) { socket.emit('masa_oyun_basladi', { masaAdi: data.masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length, kasa: masa.kasa, koltuklar: masa.koltuklar }); if(masa.eller[data.isim]) { socket.emit('taslari_al', { kime: data.isim, taslar: masa.eller[data.isim] }); } socket.emit('sira_guncelle', { masaAdi: data.masaAdi, kimde: masa.siradakiOyuncu }); } });
  socket.on('masadan_kalk', (data) => { kullaniciyiMasadanKaldir(data.isim); });
  socket.on('disconnect', () => { const kopanIsim = socket.kullaniciAdi; if(kopanIsim) { baglantiKopanlar[kopanIsim] = setTimeout(() => { kullaniciyiMasadanKaldir(kopanIsim); delete oyuncuCipleri[kopanIsim]; io.emit('online_oyuncular', Object.keys(oyuncuCipleri)); delete baglantiKopanlar[kopanIsim]; }, 20000); } });
  socket.on('sohbet_mesaji', (data) => { io.emit('yeni_sohbet_mesaji', data); });
  socket.on('vip_emoji', (data) => { io.emit('yeni_vip_emoji', data); });
  socket.on('admin_giris', (sifre) => { if(sifre === "BJK1903") { socket.emit('admin_onay', { basarili: true }); socket.emit('admin_guncel_veri', oyuncuCipleri); } else { socket.emit('admin_onay', { basarili: false }); } });
  socket.on('admin_veri_iste', () => { socket.emit('admin_guncel_veri', oyuncuCipleri); });
  
  socket.on('admin_cip_islem', (data) => {
      let hedefIsim = (data.isim || "").trim().toUpperCase(); 
      if (oyuncuCipleri[hedefIsim] !== undefined) {
          if(isNaN(oyuncuCipleri[hedefIsim]) || oyuncuCipleri[hedefIsim] === null) { oyuncuCipleri[hedefIsim] = 0; }
          let miktar = parseInt(String(data.miktar).replace(/[^0-9]/g, '')) || 0; 
          if (data.islem === 'ekle') { oyuncuCipleri[hedefIsim] += miktar; } else if (data.islem === 'cikar') { oyuncuCipleri[hedefIsim] = Math.max(0, oyuncuCipleri[hedefIsim] - miktar); }
          io.emit('cip_guncelle_ozel', { isim: hedefIsim, cip: oyuncuCipleri[hedefIsim] }); io.emit('admin_guncel_veri', oyuncuCipleri); socket.emit('admin_flash_mesaj', `Başarılı: ${hedefIsim} adlı oyuncunun çipleri güncellendi!`);
      } else { socket.emit('admin_flash_mesaj', `⚠️ HATA: ${hedefIsim} şu an aktif değil! Çip gönderilemedi.`); }
  });

  socket.on('admin_duyuru', (mesaj) => { io.emit('admin_flash_mesaj', mesaj); });
  socket.on('admin_oyuncu_kick', (isim) => { let hedefIsim = (isim || "").trim().toUpperCase(); kullaniciyiMasadanKaldir(hedefIsim); io.emit('admin_islem_uyarisi', { isim: hedefIsim, islem: 'kick' }); io.emit('sistem_mesaji', `🚨 Yönetici, ${hedefIsim} adlı oyuncuyu masadan uzaklaştırdı.`); });
  socket.on('admin_oyuncu_ban', (isim) => { let hedefIsim = (isim || "").trim().toUpperCase(); banliKullanicilar.add(hedefIsim); kullaniciyiMasadanKaldir(hedefIsim); io.emit('admin_islem_uyarisi', { isim: hedefIsim, islem: 'ban' }); });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log(`Sunucu ${PORT} portunda aktif...`); });
