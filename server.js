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
    'Acemiler (20K Bahis)': { bahis: 20000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, oyunBittiBeklemede: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false, sonAtilanTas: null, iskartalar: {}, afkCount: {}, turnTimer: null },
    'Usta Masası (50K Bahis)': { bahis: 50000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, oyunBittiBeklemede: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false, sonAtilanTas: null, iskartalar: {}, afkCount: {}, turnTimer: null },
    'Hızlı Oyun (10K Bahis)': { bahis: 10000, kasa: 0, koltuklar: [null, null, null, null], deste: [], gosterge: null, oyunBasladi: false, oyunBittiBeklemede: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false, sonAtilanTas: null, iskartalar: {}, afkCount: {}, turnTimer: null }
};

const aktifBotlar = [];
const botIsimleri = ["Ordulu_52", "Umraniyeli_Reis", "Pattik_Sever", "Geralt_34", "Sileli_Balikci", "Efsane_06", "Yalniz_Kurt", "Bursali_16", "Mavi_Ay", "Reis_55", "Atasehir_Beyi", "Fluence_Kral", "Gecelerin_Yargici", "Okey_Uzmani", "Cilgin_Turk", "Tek_Atan", "Zalim_Kral", "Guzel_Gozlum", "Ahmet_K", "Kral_Ayhan", "Zehir_Hafiye", "Vefasiz_Alem", "Esmer_Kiz", "Tatli_Bela", "Oflu_Hoca", "Erzurumlu_25", "Asi_Mavi", "Ruzgar_Gibi", "Son_Vurus", "Kader_Mahkumu", "Kaptan_34", "Gezgin_Ruh", "Oyun_Kurucu", "Sari_Firtina", "Demir_Bilek", "Karadeniz_Firtinasi", "Izmirli_Guzel", "Adanali_01", "Deli_Yurek"];

for(let i=0; i<75; i++) {
    const tamIsim = botIsimleri[i % botIsimleri.length] + "_" + Math.floor(10 + Math.random() * 89);
    aktifBotlar.push(tamIsim);
    oyuncuCipleri[tamIsim] = Math.floor(Math.random() * 9000000) + 1000000; 
    oyuncuKozmetikleri[tamIsim] = (Math.random() > 0.8) ? ['neon_tac'] : [];
}

function getAvailableBot() {
    const usedBots = new Set();
    for(let m in masalar) { masalar[m].koltuklar.forEach(k => { if(k && aktifBotlar.includes(k)) usedBots.add(k); }); }
    const available = aktifBotlar.filter(b => !usedBots.has(b));
    if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
    const tamIsim = "Yedek_Bot_" + Math.floor(100 + Math.random() * 899);
    aktifBotlar.push(tamIsim); oyuncuCipleri[tamIsim] = 5000000; oyuncuKozmetikleri[tamIsim] = []; return tamIsim;
}

function desteYaratVeKaristir() {
    let yeniDeste = []; let idSayaci = 1; const renkler = ['kirmizi', 'siyah', 'mavi', 'sari'];
    for(let set = 0; set < 2; set++) { for(let r of renkler) { for(let s = 1; s <= 13; s++) { yeniDeste.push({ id: 'tas_' + idSayaci++, renk: r, sayi: s }); } } }
    yeniDeste.push({ id: 'tas_' + idSayaci++, renk: 'sahte', sayi: 'S' }); yeniDeste.push({ id: 'tas_' + idSayaci++, renk: 'sahte', sayi: 'S' });
    for (let i = yeniDeste.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [yeniDeste[i], yeniDeste[j]] = [yeniDeste[j], yeniDeste[i]]; } return yeniDeste;
}

function oyunuSifirla(masaAdi, kazanan = null, odul = 0, sebep = "", okeyleBittiMi = false, ozelBitisEli = null) {
    const masa = masalar[masaAdi];
    if(masa) {
        clearTimeout(masa.turnTimer);
        masa.oyunBasladi = false; masa.oyunBittiBeklemede = true; 
        
        let sunucuEli = ozelBitisEli || [];
        if(!ozelBitisEli && kazanan && masa.eller[kazanan]) {
            sunucuEli = [...masa.eller[kazanan]];
            sunucuEli.sort((a,b) => (a.sayi==='S'?14:parseInt(a.sayi)) - (b.sayi==='S'?14:parseInt(b.sayi)));
        }

        io.emit('oyun_bitti', { masaAdi: masaAdi, kazanan: kazanan, odul: odul, sebep: sebep, okeyleBittiMi: okeyleBittiMi, bitisEli: sunucuEli });
        
        if (kazanan) {
            masa.koltuklar.forEach(k => {
                if (k && k !== kazanan && aktifBotlar.includes(k)) {
                    setTimeout(() => {
                        const tebrikler = ["Tebrikler!", "Helal olsun usta", "İyi oyundu", "Şanslıydın :)", "Güzel bittin", "Vay be!", "Kıl payı kaçırdım"];
                        const msj = tebrikler[Math.floor(Math.random() * tebrikler.length)];
                        io.emit('masa_sohbet_balonu', { masaAdi: masaAdi, isim: k, mesaj: msj });
                        io.emit('yeni_sohbet_mesaji', { masaAdi: masaAdi, isim: k, mesaj: msj, kozmetikler: oyuncuKozmetikleri[k] || [] });
                    }, Math.random() * 2000 + 1000);
                }
            });
        }

        setTimeout(() => {
            masa.deste = []; masa.gosterge = null; masa.siradakiOyuncu = null; masa.eller = {}; masa.kasa = 0; masa.gostergeGosterildi = false; masa.sonAtilanTas = null; masa.iskartalar = {}; masa.afkCount = {}; masa.oyunBittiBeklemede = false; 
            for(let i=0; i<4; i++) { if (masa.koltuklar[i] && aktifBotlar.includes(masa.koltuklar[i])) masa.koltuklar[i] = null; }
            const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi);
        }, 8000);
    }
}

function eliKontrolEt(gruplar, gosterge) {
    if (!gosterge) return false;
    let okeySayi = gosterge.sayi === 13 ? 1 : parseInt(gosterge.sayi) + 1; let okeyRenk = gosterge.renk;
    let totalTiles = 0; let isCift = true; let ciftCount = 0;
    for (let grup of gruplar) { totalTiles += grup.length; if (grup.length !== 2) isCift = false; else ciftCount++; }
    if (totalTiles !== 14) return false;
    function getEffectiveTile(t) { if (t.renk === okeyRenk && parseInt(t.sayi) === okeySayi) return { isOkey: true }; if (t.renk === 'sahte') return { renk: okeyRenk, sayi: okeySayi, isOkey: false }; return { renk: t.renk, sayi: parseInt(t.sayi), isOkey: false }; }
    if (isCift && ciftCount === 7) { for (let grup of gruplar) { let t1 = getEffectiveTile(grup[0]); let t2 = getEffectiveTile(grup[1]); if (t1.isOkey || t2.isOkey) continue; if (t1.renk !== t2.renk || t1.sayi !== t2.sayi) return false; } return true; }
    for (let grup of gruplar) {
        if (grup.length < 3) return false; let normalTiles = [];
        for (let t of grup) { let eff = getEffectiveTile(t); if (!eff.isOkey) normalTiles.push(eff); }
        if (normalTiles.length === 0) continue; 
        let isAyniSayi = true; let baseSayi = normalTiles[0].sayi; let colors = new Set();
        for (let t of normalTiles) { if (t.sayi !== baseSayi) isAyniSayi = false; colors.add(t.renk); }
        if (colors.size !== normalTiles.length) isAyniSayi = false; 
        let isSeriArtan = true; let isSeriAzalan = true; let firstNormalIdx = grup.findIndex(t => !getEffectiveTile(t).isOkey);
        if (firstNormalIdx !== -1) {
            let cSayi = getEffectiveTile(grup[firstNormalIdx]).sayi; let cRenk = getEffectiveTile(grup[firstNormalIdx]).renk;
            let expFwdArtan = cSayi; for (let i = firstNormalIdx + 1; i < grup.length; i++) { expFwdArtan = expFwdArtan === 13 ? 1 : expFwdArtan + 1; let eff = getEffectiveTile(grup[i]); if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expFwdArtan) { isSeriArtan = false; break; } } }
            let expBwdArtan = cSayi; for (let i = firstNormalIdx - 1; i >= 0; i--) { expBwdArtan = expBwdArtan === 1 ? 13 : expBwdArtan - 1; let eff = getEffectiveTile(grup[i]); if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expBwdArtan) { isSeriArtan = false; break; } } }
            let expFwdAzalan = cSayi; for (let i = firstNormalIdx + 1; i < grup.length; i++) { expFwdAzalan = expFwdAzalan === 1 ? 13 : expFwdAzalan - 1; let eff = getEffectiveTile(grup[i]); if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expFwdAzalan) { isSeriAzalan = false; break; } } }
            let expBwdAzalan = cSayi; for (let i = firstNormalIdx - 1; i >= 0; i--) { expBwdAzalan = expBwdAzalan === 13 ? 1 : expBwdAzalan + 1; let eff = getEffectiveTile(grup[i]); if (!eff.isOkey) { if (eff.renk !== cRenk || eff.sayi !== expBwdAzalan) { isSeriAzalan = false; break; } } }
        } else { isSeriArtan = false; isSeriAzalan = false; }
        if (!isAyniSayi && !isSeriArtan && !isSeriAzalan) return false;
    } return true;
}

function insanHamlesiBaslat(masaAdi, isim) {
    const masa = masalar[masaAdi];
    if(!masa) return;
    clearTimeout(masa.turnTimer);
    
    masa.turnTimer = setTimeout(() => {
        if(!masa.oyunBasladi || masa.siradakiOyuncu !== isim) return;
        
        let otomatikTasCekildiMi = false;
        if(masa.eller[isim] && masa.eller[isim].length === 14 && masa.deste.length > 0) {
             const cekilen = masa.deste.shift();
             masa.eller[isim].push(cekilen);
             io.emit('masa_ortasi_guncelle', { masaAdi: masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
             otomatikTasCekildiMi = true;
        }
        
        if(masa.eller[isim] && masa.eller[isim].length > 0) {
             let atilan = masa.eller[isim].pop(); 
             masa.sonAtilanTas = atilan;
             
             if(!masa.iskartalar[isim]) masa.iskartalar[isim] = [];
             masa.iskartalar[isim].push(atilan);
             
             if(!otomatikTasCekildiMi) { io.emit('oto_tas_atildi_istemci', { kim: isim, tas: atilan }); }
             io.emit('ortaya_tas_atildi', { masaAdi: masaAdi, kimAtti: isim, tas: atilan });
        }
        
        masa.afkCount[isim] = (masa.afkCount[isim] || 0) + 1;
        
        if(masa.afkCount[isim] >= 3) {
             io.emit('yeni_sohbet_mesaji', { masaAdi: masaAdi, isim: "Sistem", mesaj: `⏳ ${isim} hareketsiz kaldığı için atıldı.`, kozmetikler:[] });
             kullaniciyiMasadanKaldir(isim);
        } else {
             io.emit('yeni_sohbet_mesaji', { masaAdi: masaAdi, isim: "Sistem", mesaj: `⏳ Süre bitti, ${isim} yerine sistem oynadı.`, kozmetikler:[] });
             let currentIndex = masa.koltuklar.indexOf(isim); 
             if(currentIndex !== -1) {
                 let nextIndex = (currentIndex + 1) % 4; 
                 masa.siradakiOyuncu = masa.koltuklar[nextIndex];
                 io.emit('sira_guncelle', { masaAdi: masaAdi, kimde: masa.siradakiOyuncu });
                 if(aktifBotlar.includes(masa.siradakiOyuncu)) botHamlesiYap(masaAdi);
                 else insanHamlesiBaslat(masaAdi, masa.siradakiOyuncu);
             }
        }
    }, 15000); 
}

function masadaOyunuBaslat(masaAdi) {
    const masa = masalar[masaAdi];
    if (!masa || masa.oyunBasladi) return;
    for(let i=0; i<4; i++) { if(masa.koltuklar[i] === null) masa.koltuklar[i] = getAvailableBot(); }
    clearTimeout(masa.turnTimer);
    masa.oyunBasladi = true; masa.oyunBittiBeklemede = false; masa.gostergeGosterildi = false; masa.kasa = 0; masa.sonAtilanTas = null; masa.iskartalar = {}; masa.afkCount = {};
    const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi);
    
    masa.koltuklar.forEach(isim => {
        masa.kasa += masa.bahis;
        if(!aktifBotlar.includes(isim)) {
            let uCip = parseInt(String(oyuncuCipleri[isim]).replace(/[^0-9]/g, '')) || 0;
            oyuncuCipleri[isim] = Math.max(0, uCip - Number(masa.bahis));
            io.emit('cip_guncelle_ozel', { isim: isim, cip: oyuncuCipleri[isim] });
        }
        masa.iskartalar[isim] = [];
    });
    
    masa.deste = desteYaratVeKaristir();
    let secilenGosterge = masa.deste.pop();
    while (secilenGosterge.renk === 'sahte') { masa.deste.unshift(secilenGosterge); secilenGosterge = masa.deste.pop(); }
    masa.gosterge = secilenGosterge;
    const baslayacakOyuncu = masa.koltuklar[Math.floor(Math.random() * 4)]; 
    masa.siradakiOyuncu = baslayacakOyuncu; masa.eller = {};
    masa.koltuklar.forEach(oyuncuIsmi => { const kacTasAlacak = (oyuncuIsmi === baslayacakOyuncu) ? 15 : 14; masa.eller[oyuncuIsmi] = masa.deste.splice(0, kacTasAlacak); });
    
    io.emit('masa_oyun_basladi', { masaAdi: masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length, kasa: masa.kasa, koltuklar: masa.koltuklar });
    io.emit('sistem_mesaji', `🎰 ${masaAdi} masasında bahisler alındı! Oyun başladı.`);
    
    setTimeout(() => {
        masa.koltuklar.forEach(oyuncuIsmi => { if(!aktifBotlar.includes(oyuncuIsmi)) { io.emit('taslari_al', { kime: oyuncuIsmi, taslar: masa.eller[oyuncuIsmi] }); } });
        io.emit('masa_ortasi_guncelle', { masaAdi: masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
        io.emit('sira_guncelle', { masaAdi: masaAdi, kimde: masa.siradakiOyuncu });
        
        if(aktifBotlar.includes(masa.siradakiOyuncu)) { botHamlesiYap(masaAdi); }
        else { insanHamlesiBaslat(masaAdi, masa.siradakiOyuncu); }
    }, 800);
}

function botHamlesiYap(masaAdi) {
    const masa = masalar[masaAdi];
    if(!masa || !masa.oyunBasladi) return;
    const siradaki = masa.siradakiOyuncu;
    clearTimeout(masa.turnTimer);
    
    if(siradaki && aktifBotlar.includes(siradaki)) {
        if (Math.random() < 0.15) { 
            const sohbetler = ["Okeye dönüyorum beyler kimse atmasın!", "Çay yok mu çay :D", "Şanssızlık diz boyu", "Hadi at da oynayalım", "Böyle el mi gelir be!", "Usta bu ne hız", "Biterim bak!", "Zar zor per yaptım"];
            const msj = sohbetler[Math.floor(Math.random() * sohbetler.length)]; io.emit('masa_sohbet_balonu', { masaAdi: masaAdi, isim: siradaki, mesaj: msj });
        }

        setTimeout(() => {
            try {
                if(!masa.oyunBasladi) return;
                
                if (masa.deste.length > 35 && !masa.gostergeGosterildi && masa.gosterge) {
                    let hasGosterge = masa.eller[siradaki] && masa.eller[siradaki].some(t => t.renk === masa.gosterge.renk && t.sayi === masa.gosterge.sayi);
                    if (hasGosterge && Math.random() > 0.5) { 
                        masa.gostergeGosterildi = true; 
                        io.emit('yeni_sohbet_mesaji', { masaAdi: masaAdi, isim: "Sistem", mesaj: `⭐ ${siradaki} gösterge yaptı!`, kozmetikler: [] }); 
                    }
                }

                let tasAldi = false;
                if (masa.sonAtilanTas && masa.eller[siradaki] && masa.eller[siradaki].length < 15) {
                    let yandakiTas = masa.sonAtilanTas;
                    let isineYararMi = masa.eller[siradaki].filter(t => t.renk === yandakiTas.renk || t.sayi === yandakiTas.sayi).length >= 2;
                    if (isineYararMi && Math.random() > 0.4) {
                        masa.eller[siradaki].push(yandakiTas); 
                        masa.sonAtilanTas = null; 
                        tasAldi = true;
                        
                        let atanKisi = null; 
                        let yeniUstTas = null;
                        for(let p in masa.iskartalar) { 
                            if(Array.isArray(masa.iskartalar[p]) && masa.iskartalar[p].length > 0) { 
                                let topTile = masa.iskartalar[p][masa.iskartalar[p].length - 1];
                                if(topTile.id === yandakiTas.id) { 
                                    masa.iskartalar[p].pop(); 
                                    atanKisi = p; 
                                    if(masa.iskartalar[p].length > 0) yeniUstTas = masa.iskartalar[p][masa.iskartalar[p].length - 1];
                                    break; 
                                } 
                            } 
                        }
                        io.emit('yandan_alindi_guncelle', { masaAdi: masaAdi, kimAldi: siradaki, tas: yandakiTas, atanKisi: atanKisi, yeniUstTas: yeniUstTas });
                    }
                }

                if (!tasAldi && masa.eller[siradaki] && masa.eller[siradaki].length < 15) {
                    if(masa.deste.length === 0) { oyunuSifirla(masaAdi, null, 0, "Ortadaki taşlar bitti, oyun berabere!"); return; }
                    const cekilenTas = masa.deste.shift(); masa.eller[siradaki].push(cekilenTas); io.emit('masa_ortasi_guncelle', { masaAdi: masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge });
                }
                
                setTimeout(() => {
                    try {
                        if(!masa.oyunBasladi) return;
                        const botunEli = masa.eller[siradaki]; if(!botunEli || botunEli.length === 0) return; 
                        let okeySayi = masa.gosterge ? (masa.gosterge.sayi === 13 ? 1 : parseInt(masa.gosterge.sayi) + 1) : null; let okeyRenk = masa.gosterge ? masa.gosterge.renk : null;
                        let guvenliTaslar = botunEli.filter(t => { let isOkey = (t.renk === okeyRenk && parseInt(t.sayi) === okeySayi); return !isOkey && t.renk !== 'sahte'; });
                        if(guvenliTaslar.length === 0) guvenliTaslar = botunEli; 

                        let kazanmaSansi = 0; 
                        if (masa.deste.length <= 15) kazanmaSansi = 0.10; 
                        else if (masa.deste.length <= 35) kazanmaSansi = 0.02;

                        if (Math.random() < kazanmaSansi) {
                            let kazanilanPara = Number(masa.kasa); oyuncuCipleri[siradaki] += kazanilanPara; io.emit('cip_guncelle_ozel', { isim: siradaki, cip: oyuncuCipleri[siradaki] });
                            let atilacakIndex = Math.floor(Math.random() * guvenliTaslar.length); let bitisTasi = guvenliTaslar[atilacakIndex];
                            let gercekIndex = botunEli.findIndex(t => t.id === bitisTasi.id); botunEli.splice(gercekIndex, 1);
                            
                            if(!masa.iskartalar[siradaki]) masa.iskartalar[siradaki] = [];
                            masa.iskartalar[siradaki].push(bitisTasi);
                            io.emit('ortaya_tas_atildi', { masaAdi: masaAdi, kimAtti: siradaki, tas: bitisTasi });
                            
                            let siraliBotEli = [...botunEli].sort((a, b) => {
                                let valA = a.sayi === 'S' ? 14 : parseInt(a.sayi); let valB = b.sayi === 'S' ? 14 : parseInt(b.sayi);
                                if(valA === valB) return (a.renk || '').localeCompare(b.renk || ''); return valA - valB;
                            });

                            oyunuSifirla(masaAdi, siradaki, kazanilanPara, "Usta bir dizilimle elini bitirdi!", false, siraliBotEli); 
                            return;
                        }

                        let atilacakIndex = Math.floor(Math.random() * guvenliTaslar.length); let atilanTas = guvenliTaslar[atilacakIndex];
                        let gercekIndex = botunEli.findIndex(t => t.id === atilanTas.id); botunEli.splice(gercekIndex, 1); 

                        masa.sonAtilanTas = atilanTas; 
                        if(!masa.iskartalar[siradaki]) masa.iskartalar[siradaki] = [];
                        masa.iskartalar[siradaki].push(atilanTas);
                        
                        io.emit('ortaya_tas_atildi', { masaAdi: masaAdi, kimAtti: siradaki, tas: atilanTas });
                        
                        let currentIndex = masa.koltuklar.indexOf(siradaki); if(currentIndex === -1) return;
                        let nextIndex = (currentIndex + 1) % 4; masa.siradakiOyuncu = masa.koltuklar[nextIndex];
                        io.emit('sira_guncelle', { masaAdi: masaAdi, kimde: masa.siradakiOyuncu });
                        
                        if(aktifBotlar.includes(masa.siradakiOyuncu)) { botHamlesiYap(masaAdi); }
                        else { insanHamlesiBaslat(masaAdi, masa.siradakiOyuncu); }
                    } catch(err2) { console.log("Bot iç hamle hatası:", err2); }
                }, 1500); 
            } catch(err1) { console.log("Bot dış hamle hatası:", err1); }
        }, 1000); 
    }
}

function kullaniciyiMasadanKaldir(isim) {
    let degisiklikOldu = false; let silinecekMasalar = [];
    for(let m in masalar) {
        let index = masalar[m].koltuklar.indexOf(isim);
        if(index !== -1) {
            if (masalar[m].oyunBasladi) {
                let ceza = masalar[m].bahis;
                if(oyuncuCipleri[isim] !== undefined) { let c = parseInt(String(oyuncuCipleri[isim]).replace(/[^0-9]/g, '')) || 0; oyuncuCipleri[isim] = Math.max(0, c - ceza); io.emit('cip_guncelle_ozel', { isim: isim, cip: oyuncuCipleri[isim] }); }
                const yeniBot = getAvailableBot();
                masalar[m].koltuklar[index] = yeniBot;
                masalar[m].eller[yeniBot] = masalar[m].eller[isim]; delete masalar[m].eller[isim];
                
                if(masalar[m].iskartalar[isim]) {
                    masalar[m].iskartalar[yeniBot] = [...masalar[m].iskartalar[isim]];
                    delete masalar[m].iskartalar[isim];
                }

                io.emit('sistem_mesaji', `🏃‍♂️💨 ${isim} masadan kaçtı! Yerine ${yeniBot} geçti.`);
                
                if (masalar[m].siradakiOyuncu === isim) { 
                    clearTimeout(masalar[m].turnTimer);
                    masalar[m].siradakiOyuncu = yeniBot; io.emit('sira_guncelle', { masaAdi: m, kimde: yeniBot }); botHamlesiYap(m); 
                }
            } else { masalar[m].koltuklar[index] = null; }

            if (masalar[m].isVIP) { 
                if (masalar[m].sahibi === isim) { io.emit('vip_masa_kapandi', { masaAdi: m }); silinecekMasalar.push(m); } 
                else { let humanCount = masalar[m].koltuklar.filter(k => k !== null && !aktifBotlar.includes(k)).length; if (humanCount === 0) silinecekMasalar.push(m); } 
            } else { if(masalar[m].koltuklar.every(k => k === null || aktifBotlar.includes(k))) { oyunuSifirla(m, null, 0, "Masada kimse kalmadı."); } }
            degisiklikOldu = true; break; 
        }
    }
    silinecekMasalar.forEach(m => delete masalar[m]);
    if(degisiklikOldu) { const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi); }
}

setInterval(() => {
    const masalarArr = Object.keys(masalar); const randomMasa = masalarArr[Math.floor(Math.random() * masalarArr.length)]; const m = masalar[randomMasa];
    if(m && !m.isVIP && !m.oyunBasladi && !m.oyunBittiBeklemede) {
        const bosKoltukIndex = m.koltuklar.indexOf(null);
        if(bosKoltukIndex !== -1 && Math.random() > 0.4) { 
            const bot = getAvailableBot();
            if(bot) {
                m.koltuklar[bosKoltukIndex] = bot; const guncelLobi = {}; for(let table in masalar) guncelLobi[table] = masalar[table].koltuklar; io.emit('masalari_guncelle', guncelLobi);
                if (!m.koltuklar.includes(null)) { masadaOyunuBaslat(randomMasa); }
            }
        }
    }
}, 4000); 

setInterval(() => {
    const masalarArr = Object.keys(masalar); const randomMasa = masalarArr[Math.floor(Math.random() * masalarArr.length)]; const m = masalar[randomMasa];
    if(m && m.oyunBasladi) {
        const botKoltuklar = m.koltuklar.filter(k => k && aktifBotlar.includes(k));
        if(botKoltuklar.length > 0 && Math.random() > 0.6) { 
            const konusanBot = botKoltuklar[Math.floor(Math.random() * botKoltuklar.length)];
            const mesajlar = ["Taş gelmiyor ki", "Seri atın beyler", "Zar zor per yaptım", "Hadi at da oynayalım", "Çay yok mu çay :D"];
            io.emit('masa_sohbet_balonu', { masaAdi: randomMasa, isim: konusanBot, mesaj: mesajlar[Math.floor(Math.random()*mesajlar.length)] });
        }
    }
}, 15000); 

io.on('connection', (socket) => {
    const lobiVerisi = {}; for(let m in masalar) lobiVerisi[m] = masalar[m].koltuklar; socket.emit('masalari_guncelle', lobiVerisi);

    socket.on('kullanici_girisi', (data) => {
        let isim = typeof data === 'object' ? data.isim : data; let dbCip = typeof data === 'object' ? data.cip : 250000; let dbKozmetikler = typeof data === 'object' && data.kozmetikler ? data.kozmetikler : []; 
        if(banliKullanicilar.has(isim)) { socket.emit('admin_islem_uyarisi', { isim: isim, islem: 'ban' }); return; }
        if(baglantiKopanlar[isim]) { clearTimeout(baglantiKopanlar[isim]); delete baglantiKopanlar[isim]; }
        socket.kullaniciAdi = isim; oyuncuCipleri[isim] = parseInt(String(dbCip).replace(/[^0-9]/g, '')) || 0; oyuncuKozmetikleri[isim] = dbKozmetikler; 
        socket.emit('cip_guncelle', oyuncuCipleri[isim]); io.emit('admin_guncel_veri', oyuncuCipleri); io.emit('kozmetikleri_guncelle', oyuncuKozmetikleri); io.emit('online_oyuncular', Object.keys(oyuncuCipleri));
        let masaBulundu = null; for(let m in masalar) { if(masalar[m].koltuklar.includes(isim)) { masaBulundu = m; break; } }
        if(masaBulundu) { socket.emit('sen_masadasin', { masaAdi: masaBulundu, isVIP: masalar[masaBulundu].isVIP || false, sahibi: masalar[masaBulundu].sahibi || "", gizli: masalar[masaBulundu].gizli || false }); }
    });

    socket.on('arkadaslik_istegi_gonder', (data) => { if(data.kime && aktifBotlar.includes(data.kime)) { setTimeout(() => { socket.emit('canli_arkadaslik_onay', { kimden: data.kime }); }, 1500); } else { io.emit('canli_arkadaslik_talebi', data); } });
    socket.on('arkadaslik_cevabi_ver', (data) => { io.emit('canli_arkadaslik_sonuc', data); });

    socket.on('masayi_izle', (data) => {
        const masa = masalar[data.masaAdi];
        if(masa) { 
            let topIskartalar = {};
            for(let p in masa.iskartalar) {
                if(Array.isArray(masa.iskartalar[p]) && masa.iskartalar[p].length > 0) { topIskartalar[p] = masa.iskartalar[p][masa.iskartalar[p].length - 1]; }
                else if (masa.iskartalar[p]) { topIskartalar[p] = masa.iskartalar[p]; }
            }
            socket.emit('izleyici_olarak_katildin', { masaAdi: data.masaAdi, oyunBasladi: masa.oyunBasladi, kalanTas: masa.deste.length, gosterge: masa.gosterge, kasa: masa.kasa, koltuklar: masa.koltuklar, siradaki: masa.siradakiOyuncu, iskartalar: topIskartalar }); 
        }
    });

    socket.on('esya_firlat', (data) => { const masa = masalar[data.masaAdi]; let kimdenCip = parseInt(String(oyuncuCipleri[data.kimden]).replace(/[^0-9]/g, '')) || 0; if(masa && kimdenCip >= 5000) { oyuncuCipleri[data.kimden] = Math.max(0, kimdenCip - 5000); io.emit('cip_guncelle_ozel', { isim: data.kimden, cip: oyuncuCipleri[data.kimden] }); io.emit('esya_firlatildi', data); } else { socket.emit('hata_mesaji', "Yetersiz Bakiye!"); } });

    socket.on('vip_masa_kur', (data) => {
        kullaniciyiMasadanKaldir(data.sahibi); let miktar = parseInt(String(data.bahis).replace(/[^0-9]/g, '')) || 0; let pCip = parseInt(String(oyuncuCipleri[data.sahibi]).replace(/[^0-9]/g, '')) || 0;
        if(pCip < miktar) { socket.emit('hata_mesaji', "Yetersiz Bakiye!"); return; }
        const vMasaAdi = `👑 VIP: ${data.sahibi} Masası`;
        masalar[vMasaAdi] = { bahis: miktar, kasa: 0, koltuklar: [data.sahibi, null, null, null], deste: [], gosterge: null, oyunBasladi: false, oyunBittiBeklemede: false, siradakiOyuncu: null, eller: {}, gostergeGosterildi: false, isVIP: true, sahibi: data.sahibi, gizli: data.gizli, davetliler: [], sonAtilanTas: null, iskartalar: {}, afkCount: {}, turnTimer: null };
        socket.emit('sen_masadasin', { masaAdi: vMasaAdi, isVIP: true, sahibi: data.sahibi, gizli: data.gizli }); const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi);
    });

    socket.on('vip_masa_gizlilik_degis', (data) => { const masa = masalar[data.masaAdi]; if (masa && masa.sahibi === data.isim) { masa.gizli = !masa.gizli; io.emit('yeni_sohbet_mesaji', { masaAdi: data.masaAdi, isim: "Sistem", mesaj: `🔒 Oda durumu: ${masa.gizli ? 'SADECE DAVETLİLER' : 'HERKESE AÇIK'}`, kozmetikler: [] }); io.emit('vip_durum_guncelle', { masaAdi: data.masaAdi, gizli: masa.gizli }); } });
    socket.on('magaza_harcamasi', (data) => { if (oyuncuCipleri[data.isim] !== undefined) { oyuncuCipleri[data.isim] = parseInt(String(data.yeniCip).replace(/[^0-9]/g, '')) || 0; io.emit('admin_guncel_veri', oyuncuCipleri); } });
    socket.on('kozmetik_guncelle', (data) => { oyuncuKozmetikleri[data.isim] = data.kozmetikler; io.emit('kozmetikleri_guncelle', oyuncuKozmetikleri); });
    socket.on('liderlik_tablosu_iste', () => { const siraliList = Object.entries(oyuncuCipleri).map(entry => ({ isim: entry[0], cip: entry[1] })).filter(k => !aktifBotlar.includes(k.isim) && !k.isim.startsWith('MİSAFİR_')).sort((a, b) => b.cip - a.cip).slice(0, 10); socket.emit('liderlik_tablosu_guncelle', siraliList); });
    
    socket.on('masaya_davet_et', (data) => { 
        const masa = masalar[data.masaAdi]; if (masa && masa.isVIP && !masa.davetliler.includes(data.kime)) { masa.davetliler.push(data.kime); } 
        if(aktifBotlar.includes(data.kime)) {
            setTimeout(() => {
                kullaniciyiMasadanKaldir(data.kime); const bMasa = masalar[data.masaAdi];
                if(bMasa && !bMasa.oyunBasladi && bMasa.koltuklar.includes(null)) {
                    const bosKoltukIndex = bMasa.koltuklar.indexOf(null); bMasa.koltuklar[bosKoltukIndex] = data.kime; const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi); io.emit('yeni_sohbet_mesaji', { masaAdi: data.masaAdi, isim: "Sistem", mesaj: `🤖 ${data.kime} masaya oturdu!`, kozmetikler: [] });
                    if (!bMasa.koltuklar.includes(null)) { masadaOyunuBaslat(data.masaAdi); }
                }
            }, 2000);
        } else { io.emit('davet_geldi', data); }
    });

    socket.on('masaya_otur', (data) => {
        kullaniciyiMasadanKaldir(data.isim); const masa = masalar[data.masaAdi];
        if (masa && !masa.koltuklar.includes(data.isim)) {
            let uCip = parseInt(String(oyuncuCipleri[data.isim]).replace(/[^0-9]/g, '')) || 0; if(uCip < masa.bahis) { socket.emit('hata_mesaji', `Yeterli çipiniz yok!`); return; }
            if (masa.isVIP && masa.gizli && masa.sahibi !== data.isim) { if (!masa.davetliler || !masa.davetliler.includes(data.isim)) { socket.emit('hata_mesaji', "🚫 Bu VIP masa kilitlidir!"); return; } }
            const bosKoltukIndex = masa.koltuklar.indexOf(null);
            if (bosKoltukIndex !== -1) { masa.koltuklar[bosKoltukIndex] = data.isim; const guncelLobi = {}; for(let m in masalar) guncelLobi[m] = masalar[m].koltuklar; io.emit('masalari_guncelle', guncelLobi); if (!masa.koltuklar.includes(null)) { masadaOyunuBaslat(data.masaAdi); } }
        }
    });

    socket.on('oyunu_baslat', (masaAdi) => { masadaOyunuBaslat(masaAdi); });
    
    socket.on('gosterge_goster', (data) => { 
        const masa = masalar[data.masaAdi]; 
        if(masa && masa.oyunBasladi && !masa.gostergeGosterildi && masa.eller[data.isim]) { 
            const hasTile = masa.eller[data.isim].some(t => t.renk === masa.gosterge.renk && t.sayi === masa.gosterge.sayi); 
            if(hasTile) { 
                masa.gostergeGosterildi = true; 
                const odul = masa.bahis; 
                let uCip = parseInt(String(oyuncuCipleri[data.isim]).replace(/[^0-9]/g, '')) || 0; 
                oyuncuCipleri[data.isim] = uCip + Number(odul); 
                io.emit('cip_guncelle_ozel', { isim: data.isim, cip: oyuncuCipleri[data.isim] }); 
                io.emit('gosterge_basarili', { masaAdi: data.masaAdi, isim: data.isim, odul: odul }); 
                io.emit('yeni_sohbet_mesaji', { masaAdi: data.masaAdi, isim: "Sistem", mesaj: `⭐ ${data.isim} gösterge yaptı!`, kozmetikler: [] }); 
            } 
        } 
    });
    
    socket.on('tas_atildi', (data) => {
        const masa = masalar[data.masaAdi];
        if(masa && masa.siradakiOyuncu === data.isim) {
            clearTimeout(masa.turnTimer); 
            masa.afkCount[data.isim] = 0; 
            
            if(masa.eller[data.isim]) { const tasIndex = masa.eller[data.isim].findIndex(t => t.id === data.tas.id); if(tasIndex !== -1) masa.eller[data.isim].splice(tasIndex, 1); }
            masa.sonAtilanTas = data.tas; 
            
            if(!masa.iskartalar[data.isim]) masa.iskartalar[data.isim] = [];
            masa.iskartalar[data.isim].push(data.tas); 
            
            io.emit('ortaya_tas_atildi', { masaAdi: data.masaAdi, kimAtti: data.isim, tas: data.tas });
            
            let currentIndex = masa.koltuklar.indexOf(data.isim); let nextIndex = (currentIndex + 1) % 4; masa.siradakiOyuncu = masa.koltuklar[nextIndex];
            io.emit('sira_guncelle', { masaAdi: data.masaAdi, kimde: masa.siradakiOyuncu }); 
            
            if(aktifBotlar.includes(masa.siradakiOyuncu)) { botHamlesiYap(data.masaAdi); }
            else { insanHamlesiBaslat(data.masaAdi, masa.siradakiOyuncu); }
        }
    });

    socket.on('ortadan_tas_cek', (data) => { const masa = masalar[data.masaAdi]; if(masa && masa.siradakiOyuncu === data.isim && masa.deste.length > 0) { masa.sonAtilanTas = null; const cekilenTas = masa.deste.shift(); masa.eller[data.isim].push(cekilenTas); socket.emit('tas_cekildi', cekilenTas); io.emit('masa_ortasi_guncelle', { masaAdi: data.masaAdi, kalanTas: masa.deste.length, gosterge: masa.gosterge }); } });
    
    socket.on('yandan_tas_alindi', (data) => { 
        const masa = masalar[data.masaAdi]; 
        if(masa && masa.eller[data.kimAldi]) { 
            masa.eller[data.kimAldi].push(data.tas); masa.sonAtilanTas = null; 
            
            let atanKisi = null; 
            let yeniUstTas = null;
            for(let p in masa.iskartalar) { 
                if(Array.isArray(masa.iskartalar[p]) && masa.iskartalar[p].length > 0) { 
                    let topTile = masa.iskartalar[p][masa.iskartalar[p].length - 1];
                    if(topTile.id === data.tas.id) { 
                        masa.iskartalar[p].pop(); 
                        atanKisi = p; 
                        if(masa.iskartalar[p].length > 0) yeniUstTas = masa.iskartalar[p][masa.iskartalar[p].length - 1];
                        break; 
                    } 
                } 
            }
            io.emit('yandan_alindi_guncelle', { ...data, atanKisi: atanKisi, yeniUstTas: yeniUstTas }); 
        } 
    });
    
    socket.on('oyunu_bitir', (data) => { 
        const masa = masalar[data.masaAdi]; 
        if(masa && masa.siradakiOyuncu === data.isim) { 
            clearTimeout(masa.turnTimer); 
            const elGecerliMi = eliKontrolEt(data.gruplar, masa.gosterge); 
            if(elGecerliMi) { 
                let kazanilanPara = Number(masa.kasa); 
                let uCip = parseInt(String(oyuncuCipleri[data.isim]).replace(/[^0-9]/g, '')) || 0; 
                oyuncuCipleri[data.isim] = uCip + kazanilanPara; 
                io.emit('cip_guncelle_ozel', { isim: data.isim, cip: oyuncuCipleri[data.isim] }); 
                
                let oyuncununOrijinalEli = [];
                if (data.gruplar && Array.isArray(data.gruplar)) { data.gruplar.forEach(grup => oyuncununOrijinalEli.push(...grup)); }

                oyunuSifirla(data.masaAdi, data.isim, kazanilanPara, "Nizami dizilimle el bitti.", false, oyuncununOrijinalEli); 
            } else { 
                socket.emit('hatali_bitis', { mesaj: "Dizilim hatalı!", tasId: data.tasHtmlId }); 
            } 
        } 
    });
    
    socket.on('masaya_geri_don', (data) => { const masa = masalar[data.masaAdi]; if (masa && masa.oyunBasladi && masa.koltuklar.includes(data.isim)) { socket.emit('masa_oyun_basladi', { masaAdi: data.masaAdi, gosterge: masa.gosterge, kalanTas: masa.deste.length, kasa: masa.kasa, koltuklar: masa.koltuklar }); if(masa.eller[data.isim]) { socket.emit('taslari_al', { kime: data.isim, taslar: masa.eller[data.isim] }); } socket.emit('sira_guncelle', { masaAdi: data.masaAdi, kimde: masa.siradakiOyuncu }); } });
    socket.on('masadan_kalk', (data) => { kullaniciyiMasadanKaldir(data.isim); });
    socket.on('disconnect', () => { const kopanIsim = socket.kullaniciAdi; if(kopanIsim) { baglantiKopanlar[kopanIsim] = setTimeout(() => { kullaniciyiMasadanKaldir(kopanIsim); delete oyuncuCipleri[kopanIsim]; io.emit('online_oyuncular', Object.keys(oyuncuCipleri)); delete baglantiKopanlar[kopanIsim]; }, 20000); } });

    socket.on('admin_giris', (sifre) => { if(sifre === "BJK1903") { socket.emit('admin_onay', { basarili: true }); socket.emit('admin_guncel_veri', oyuncuCipleri); } else { socket.emit('admin_onay', { basarili: false }); } });
    socket.on('admin_veri_iste', () => { socket.emit('admin_guncel_veri', oyuncuCipleri); });
    socket.on('admin_cip_islem', (data) => { let hedefIsim = (data.isim || "").trim().toUpperCase(); if (oyuncuCipleri[hedefIsim] !== undefined) { let gercekCip = parseInt(String(oyuncuCipleri[hedefIsim]).replace(/[^0-9]/g, '')) || 0; let miktar = parseInt(String(data.miktar).replace(/[^0-9]/g, '')) || 0; if (data.islem === 'ekle') { oyuncuCipleri[hedefIsim] = gercekCip + miktar; } else if (data.islem === 'cikar') { oyuncuCipleri[hedefIsim] = Math.max(0, gercekCip - miktar); } io.emit('cip_guncelle_ozel', { isim: hedefIsim, cip: oyuncuCipleri[hedefIsim] }); io.emit('admin_guncel_veri', oyuncuCipleri); socket.emit('admin_flash_mesaj', `Başarılı: ${hedefIsim} güncellendi!`); } else { socket.emit('admin_flash_mesaj', `⚠️ HATA: ${hedefIsim} bulunamadı.`); } });
    socket.on('admin_duyuru', (mesaj) => { io.emit('admin_flash_mesaj', mesaj); });
    socket.on('admin_oyuncu_kick', (isim) => { let hedefIsim = (isim || "").trim().toUpperCase(); kullaniciyiMasadanKaldir(hedefIsim); io.emit('admin_islem_uyarisi', { isim: hedefIsim, islem: 'kick' }); });
    socket.on('admin_oyuncu_ban', (isim) => { let hedefIsim = (isim || "").trim().toUpperCase(); banliKullanicilar.add(hedefIsim); kullaniciyiMasadanKaldir(hedefIsim); io.emit('admin_islem_uyarisi', { isim: hedefIsim, islem: 'ban' }); });
});

const PORT = process.env.PORT || 3000; http.listen(PORT, () => { console.log(`Sunucu ${PORT} portunda aktif...`); });
