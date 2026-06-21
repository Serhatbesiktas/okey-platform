const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static('public'));

// --- YAPAY ZEKA (HAYALET OYUNCU) MOTORU BAŞLANGIÇ ---
const aktifBotIsimleri = new Set();
const gercekciBotHavuzu = [
    "Dayi_34", "Ayse_Gozde", "OkeyUstasi", "Kartal_1903", "Cilgin_Kiz", 
    "Mekansiz_06", "YalnizKurt", "Sefir", "Papatya_01", "Kral_Suleyman",
    "Duman_Gozlum", "Donen_Adam", "Asi_Mavi", "Zalim_Kader", "Reis_55",
    "Sari_Firtina", "Gece_Yargici", "Tatli_Bela", "Bordo_Mavi", "Efsane_Pro",
    "Okey_Prensesi", "Kacak_Yolcu", "Usta_Birlik", "Vefasiz", "Kusursuz",
    "Zar_Tutucu", "Gizemli_Adam", "Melek_Yuzu", "Kara_Kartal", "Aslan_Parcasi",
    "Fenerbahceli_07", "Gassarayli", "Sari_Kanarya", "Oyun_Kurucu", "Dertli",
    "Kader_Mahkumu", "Gulen_Gozler", "Son_Kral", "Baskentli", "Yorgun_Yil"
];

function getRastgeleBotIsmi() {
    let musaitBotlar = gercekciBotHavuzu.filter(isim => oyuncuCipleri[isim] === undefined);
    if (musaitBotlar.length === 0) return "MisafirBot_" + Math.floor(Math.random()*9999);
    return musaitBotlar[Math.floor(Math.random() * musaitBotlar.length)];
}

function isSistemBotu(isim) {
    return isim && (isim.startsWith('Bot_') || isim.startsWith('MisafirBot_') || aktifBotIsimleri.has(isim));
}
// --- YAPAY ZEKA (HAYALET OYUNCU) MOTORU BİTİŞ ---

const oyuncuCipleri = {};
const oyuncuKozmetikleri = {}; 
const banliKullanicilar = new Set(); 
const baglantiKopanlar = {}; 

const masalar = {
    'Acemiler (20K Bahis)': { bahis: 20000, kasa: 0, koltuklar: [null, null, null, null], izleyiciler: [], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false },
    'Usta Masası (50K Bahis)': { bahis: 50000, kasa: 0, koltuklar: [null, null, null, null], izleyiciler: [], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false },
    'Hızlı Oyun (10K Bahis)': { bahis: 10000, kasa: 0, koltuklar: [null, null, null, null], izleyiciler: [], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false }
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
                if (!eff.isOkey) { if (eff.renk !== cRenk || el.sayi !== expFwdAzalan) { isSeriAzalan = false; break; } }
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
    if(siradaki && isSistemBotu(siradaki)) {
        const dusunmeSuresi = Math.floor(Math.random() * 3000) + 2500; 

        setTimeout(() => {
            if(!masa.oyunBasladi) return;
            if(masa.deste.length === 0) {
                io.emit('sistem_mesaji', `⚠️ ${masaAdi} masasında TAŞ BİTTİ! Oyun berabere sonuçlandı.`);
                oyunuSifirla(masaAdi, null, 0, "Ortadaki taşlar bitti, oyun berabere!");
                return;
            }

            if (Math.random() < 0.08) {
                const rastgeleLaflar = ["Taş gelmiyor ki", "Okeye dönüyorum kimse atmasın :)", "Çay yok mu çay :D", "Bu el kesin bende"];
                const laf = rastgeleLaflar[Math.floor(Math.random() * rastgeleLaflar.length)];
                io.emit('yeni_sohbet_mesaji', { masaAdi: masaAdi, isim: siradaki, mesaj: laf, kozmetikler: oyuncuKozmetikleri[siradaki] || [] });
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
                
                if(masa.siradakiOyuncu && isSistemBotu(masa.siradakiOyuncu)) { botHamlesiYap(masaAdi); }
            }, 1000); 
        }, dusunmeSuresi); 
    }
}

function kullaniciyiMasadanKaldir(isim) {
    let degisiklikOldu = false;
    let silinecekMasalar = [];
    for(let m in masalar) {
        if (masalar[m].izleyiciler) {
            let izIndex = masalar[m].izleyiciler.indexOf(isim);
            if (izIndex !== -1) { masalar[m].izleyiciler.splice(izIndex, 1); degisiklikOldu = true; }
        }
        let index = masalar[m].koltuklar.indexOf(isim);
        if(index !== -1) {
            if (masalar[m].oyunBasladi) {
                let ceza = masalar[m].bahis;
                if(oyuncuCipleri[isim] !== undefined) {
                    oyuncuCipleri[isim] = Math.max(0, Number(oyuncuCipleri[isim]) - Number(ceza));
                    io.emit('cip_guncelle_ozel', { isim: isim, cip: oyuncuCipleri[isim] });
                }
                const yeniBot = getRastgeleBotIsmi();
                aktifBotIsimleri.add(yeniBot);
                masalar[m].koltuklar[index] = yeniBot;
                masalar[m].eller[yeniBot] = masalar[m].eller[isim]; 
                delete masalar[m].eller[isim];
                if (masalar[m].siradakiOyuncu === isim) { masalar[m].siradakiOyuncu = yeniBot; io.emit('sira_guncelle', { masaAdi: m, kimde: yeniBot }); botHamlesiYap(m); }
            } else { masalar[m].koltuklar[index] = null; }

            if (masalar[m].isVIP) {
                if (masalar[m].sahibi === isim) { io.emit('vip_masa_kapandi', { masaAdi: m }); silinecekMasalar.push(m); }
                else { if (masalar[m].koltuklar.filter(k => k !== null && !isSistemBotu(k)).length === 0) silinecekMasalar.push(m); }
            } else {
                if(masalar[m].koltuklar.every(k => k === null || isSistemBotu(k))) { oyunuSifirla(m, null, 0, "Masada kimse kalmadı."); masalar[m].koltuklar = [null, null, null, null]; }
            }
            degisiklikOldu = true; break;
        }
    }
    silinecekMasalar.forEach(m => delete masalar[m]);
    if(degisiklikOldu) { const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi); }
}

io.on('connection', (socket) => {
  const lobiVerisi = {}; for(let m in masalar) lobiVerisi[m] = masalar[m].koltuklar; socket.emit('masalari_guncelle', lobiVerisi);

  socket.on('kullanici_girisi', (data) => {
      let isim = typeof data === 'object' ? data.isim : data;
      let dbCip = typeof data === 'object' ? data.cip : 250000;
      let dbKozmetikler = typeof data === 'object' && data.kozmetikler ? data.kozmetikler : []; 
      if(banliKullanicilar.has(isim)) { socket.emit('admin_islem_uyarisi', { isim: isim, islem: 'ban' }); return; }
      socket.kullaniciAdi = isim; oyuncuCipleri[isim] = Number(dbCip); oyuncuKozmetikleri[isim] = dbKozmetikler; 
      socket.emit('cip_guncelle', oyuncuCipleri[isim]); io.emit('admin_guncel_veri', oyuncuCipleri); io.emit('kozmetikleri_guncelle', oyuncuKozmetikleri); io.emit('online_oyuncular', Object.keys(oyuncuCipleri));
  });

  // 🔥 INTERACTIVE SOHBET VE MANDALLI ARKADAŞLIK İSTEĞİ SİSTEMİ
  socket.on('arkadaslik_istegi_gonder', (data) => {
      if(isSistemBotu(data.kime)) {
          setTimeout(() => {
              socket.emit('canli_arkadaslik_onay', { kimden: data.kime });
          }, 1800);
      } else { io.emit('canli_arkadaslik_talebi', data); }
  });

  socket.on('arkadaslik_cevabi_ver', (data) => { io.emit('canli_arkadaslik_sonuc', data); });

  socket.on('esya_firlat', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && Number(oyuncuCipleri[data.kimden]) >= 5000) {
          oyuncuCipleri[data.kimden] = Math.max(0, Number(oyuncuCipleri[data.kimden]) - 5000);
          io.emit('cip_guncelle_ozel', { isim: data.kimden, cip: oyuncuCipleri[data.kimden] }); io.emit('esya_firlatildi', data);
      }
  });

  socket.on('vip_masa_kur', (data) => {
      kullaniciyiMasadanKaldir(data.sahibi);
      const vMasaAdi = `👑 VIP: ${data.sahibi} Masası`;
      masalar[vMasaAdi] = { bahis: Number(data.bahis), kasa: 0, koltuklar: [data.sahibi, null, null, null], izleyiciler: [], deste: [], gosterge: null, oyunBasladi: false, siradakiOyuncu: null, eller: {}, isVIP: true, sahibi: data.sahibi, gizli: data.gizli, davetliler: [] };
      socket.emit('sen_masadasin', { masaAdi: vMasaAdi, isVIP: true, sahibi: data.sahibi, gizli: data.gizli });
      const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi);
  });

  socket.on('masaya_otur', (data) => {
    kullaniciyiMasadanKaldir(data.isim); const masa = masalar[data.masaAdi];
    if (masa && !masa.koltuklar.includes(data.isim)) {
        const bosKoltukIndex = masa.koltuklar.indexOf(null);
        if (bosKoltukIndex !== -1) { masa.koltuklar[bosKoltukIndex] = data.isim; const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi); }
    }
  });

  socket.on('masayi_izle', (data) => {
      kullaniciyiMasadanKaldir(data.isim); const masa = masalar[data.masaAdi];
      if(masa) {
          if(!masa.izleyiciler.includes(data.isim)) masa.izleyiciler.push(data.isim);
          socket.emit('izleyici_olarak_katildin', { masaAdi: data.masaAdi, kasa: masa.kasa, gosterge: masa.gosterge, koltuklar: masa.koltuklar, oyunBasladi: masa.oyunBasladi, kalanTas: masa.deste.length, siradaki: masa.siradakiOyuncu });
      }
  });

  socket.on('oyunu_baslat', (masaAdi) => {
    const masa = masalar[masaAdi];
    if (masa && !masa.oyunBasladi) {
        masa.oyunBasladi = true; masa.kasa = 0;
        for(let i=0; i<4; i++) { if(masa.koltuklar[i] === null) { const yeniBot = getRastgeleBotIsmi(); aktifBotIsimleri.add(yeniBot); oyuncuCipleri[yeniBot] = Math.floor(Math.random() * 5000000) + 1000000; oyuncuKozmetikleri[yeniBot] = [['neon_tac']]; masa.koltuklar[i] = yeniBot; } }
        masa.koltuklar.forEach(isim => { masa.kasa += masa.bahis; if(!isSistemBotu(isim)) { oyuncuCipleri[isim] = Math.max(0, Number(oyuncuCipleri[isim]) - masa.bahis); io.emit('cip_guncelle_ozel', { isim: isim, cip: oyuncuCipleri[isim] }); } });
        masa.deste = desteYaratVeKaristir(); masa.gosterge = masa.deste.pop();
        const baslayacakOyuncu = masa.koltuklar[Math.floor(Math.random() * 4)]; masa.siradakiOyuncu = baslayacakOyuncu;
        masa.koltuklar.forEach(oyuncuIsmi => { masa.eller[oyuncuIsmi] = masa.deste.splice(0, (oyuncuIsmi === baslayacakOyuncu) ? 15 : 14); });
        io.emit('masa_oyun_basladi', { masaAdi: masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length, kasa: masa.kasa, koltuklar: masa.koltuklar });
        masa.koltuklar.forEach(oyuncuIsmi => { if(!isSistemBotu(oyuncuIsmi)) { io.emit('taslari_al', { kime: oyuncuIsmi, taslar: masa.eller[oyuncuIsmi] }); } });
        io.emit('sira_guncelle', { masaAdi: masaAdi, kimde: masa.siradakiOyuncu }); if(isSistemBotu(masa.siradakiOyuncu)) { botHamlesiYap(masaAdi); }
    }
  });

  socket.on('tas_atildi', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          if(masa.eller[data.isim]) { const idx = masa.eller[data.isim].findIndex(t => t.id === data.tas.id); if(idx !== -1) masa.eller[data.isim].splice(idx, 1); }
          io.emit('ortaya_tas_atildi', { masaAdi: data.masaAdi, kimAtti: data.isim, tas: data.tas });
          let nextIndex = (masa.koltuklar.indexOf(data.isim) + 1) % 4; masa.siradakiOyuncu = masa.koltuklar[nextIndex];
          io.emit('sira_guncelle', { masaAdi: data.masaAdi, kimde: masa.siradakiOyuncu }); if(isSistemBotu(masa.siradakiOyuncu)) { botHamlesiYap(data.masaAdi); }
      }
  });

  socket.on('ortadan_tas_cek', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim && masa.deste.length > 0) {
          const cekilenTas = masa.deste.shift(); masa.eller[data.isim].push(cekilenTas);
          socket.emit('tas_cekildi', cekilenTas); io.emit('masa_ortasi_guncelle', { masaAdi: data.masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
      }
  });

  socket.on('oyunu_bitir', (data) => {
      const masa = masalar[data.masaAdi];
      if(masa && masa.siradakiOyuncu === data.isim) {
          const elGecerliMi = eliKontrolEt(data.gruplar, masa.gosterge);
          if(elGecerliMi) {
              let kazanilanPara = masa.kasa; oyuncuCipleri[data.isim] = Number(oyuncuCipleri[data.isim]) + kazanilanPara;
              io.emit('cip_guncelle_ozel', { isim: data.isim, cip: oyuncuCipleri[data.isim] }); oyunuSifirla(data.masaAdi, data.isim, kazanilanPara, "Nizami dizilimle el bitti.");
          } else { socket.emit('hatali_bitis', "Dizilim hatalı!"); }
      }
  });

  socket.on('magaza_harcamasi', (data) => { if (oyuncuCipleri[data.isim] !== undefined) { oyuncuCipleri[data.isim] = Number(data.yeniCip); io.emit('admin_guncel_veri', oyuncuCipleri); } });
  socket.on('kozmetik_guncelle', (data) => { oyuncuKozmetikleri[data.isim] = data.kozmetikler; io.emit('kozmetikleri_guncelle', oyuncuKozmetikleri); });
  socket.on('liderlik_tablosu_iste', () => { const list = Object.entries(oyuncuCipleri).map(e => ({ isim: e[0], cip: e[1] })).filter(k => !k.isim.startsWith('MİSAFİR_')).sort((a, b) => b.cip - a.cip).slice(0, 5); socket.emit('liderlik_tablosu_guncelle', list); });
  socket.on('masadan_kalk', (data) => { kullaniciyiMasadanKaldir(data.isim); });
  socket.on('disconnect', () => { const kopanIsim = socket.kullaniciAdi; if(kopanIsim) { kullaniciyiMasadanKaldir(kopanIsim); } });
  socket.on('sohbet_mesaji', (data) => { io.emit('yeni_sohbet_mesaji', data); });
});

setInterval(() => {
    let botCount = Array.from(aktifBotIsimleri).filter(b => oyuncuCipleri[b] !== undefined).length;
    if (botCount < 75) {
        const yeniBot = getRastgeleBotIsmi(); aktifBotIsimleri.add(yeniBot);
        oyuncuCipleri[yeniBot] = Math.floor(Math.random() * 19000000) + 1000000;
        const kozmetikIhtimalleri = [['atesli_isim'], ['neon_tac'], ['altin_cerceve'], []];
        oyuncuKozmetikleri[yeniBot] = kozmetikIhtimalleri[Math.floor(Math.random() * kozmetikIhtimalleri.length)];
        io.emit('online_oyuncular', Object.keys(oyuncuCipleri)); io.emit('kozmetikleri_guncelle', oyuncuKozmetikleri);
    }
    for(let m in masalar) {
        if(!masalar[m].isVIP && !masalar[m].oyunBasladi) {
            let botSayisi = masalar[m].koltuklar.filter(k => isSistemBotu(k)).length;
            let bosSayisi = masalar[m].koltuklar.filter(k => k === null).length;
            if(bosSayisi > 0 && botSayisi < 3 && Math.random() < 0.35) {
                let bostaBotlar = Array.from(aktifBotIsimleri).filter(b => !masalar[m].koltuklar.includes(b));
                if(bostaBotlar.length > 0) { masalar[m].koltuklar[masalar[m].koltuklar.indexOf(null)] = bostaBotlar[0]; io.emit('masalari_guncelle', masalar); }
            }
        }
    }
}, 12000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log(`Sunucu ${PORT} portunda aktif...`); });
