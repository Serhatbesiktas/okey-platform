// 🔥 BOT KONTROL RADARI 🔥
window.isBotIsmi = function(isim) {
    return isim && (isim.startsWith("Usta_") || isim.startsWith("Kral_") || isim.startsWith("Reis_") || isim.startsWith("Okeyci_"));
};

window.masayaOtur = function(m) { 
    let bahis = 0; if(m.includes('20K')) bahis = 20000; else if(m.includes('50K')) bahis = 50000; else if(m.includes('10K')) bahis = 10000;
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(safCip < bahis) { ozelUyariGoster("⚠️ Yetersiz Bakiye! Bu masaya oturmak için en az " + bahis.toLocaleString() + " ÇİP gerekiyor."); return; }
    suAnkiMasam = m; socket.emit('masaya_otur', { isim: aktifKullaniciAdi, masaAdi: m }); 
    lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; 
    masaOrtasiYazi.innerHTML = m.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>";
};

window.masayaGeriDon = function(m) { suAnkiMasam = m; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; socket.emit('masaya_geri_don', { masaAdi: m, isim: aktifKullaniciAdi }); };
window.masayiIzle = function(m) { socket.emit('masayi_izle', { isim: aktifKullaniciAdi, masaAdi: m }); };
window.masayaDavetEt = function(n) { socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: n, masaAdi: suAnkiMasam }); document.getElementById('arkadaslarEkrani').style.display = 'none'; };

window.masayiTemizle = function() { 
    masaOyunBasladiMi = false; 
    const flash = document.getElementById('flashBildirim'); if (flash) flash.classList.remove('goster'); 
    document.getElementById('sonucEkrani').style.display = 'none'; 
    oyunAlanObjeleri.style.display = 'none'; 
    gostergeBtn.style.display = 'none'; gostergeHakki = false; 
    oyunuBaslatBtn.innerText = "🎲 OYUNU BAŞLAT"; oyunuBaslatBtn.style.display = 'block'; 
    bitisAlani.style.display = 'none'; masaKasaBilgisi.style.display = 'none'; bitisAlani.innerHTML = 'BİTİR<br>🏆'; 
    for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; 
    document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; 
    document.getElementById('iskartaSag').innerHTML = ''; document.getElementById('iskartaSol').innerHTML = ''; document.getElementById('iskartaUst').innerHTML = ''; 
    document.getElementById('benimAdimKutusu').classList.remove('aktif-sira'); document.getElementById('seatRight').classList.remove('aktif-sira'); document.getElementById('seatTop').classList.remove('aktif-sira'); document.getElementById('seatLeft').classList.remove('aktif-sira'); 
    benimSiramMi = false; 
};

// 🔥 İZLEYİCİ İÇİN HİZALAMA TAMİRİ ("Bekleniyor..." hatası çözüldü) 🔥
window.gelişmişKoltukHizala = function(koltuklar) {
    let idx = koltuklar.indexOf(aktifKullaniciAdi); 
    if(idx === -1) idx = 0; // İzleyiciyse 0'dan başla

    document.getElementById('benimAdimKutusu').innerText = koltuklar[idx] || (izleyiciModu ? "Boş" : "Bekleniyor...");
    let sr = koltuklar[(idx+1)%4]; document.getElementById('seatRight').dataset.isim = sr || ""; document.getElementById('seatRight').innerText = sr || (izleyiciModu ? "Boş" : "➕ DAVET");
    let st = koltuklar[(idx+2)%4]; document.getElementById('seatTop').dataset.isim = st || ""; document.getElementById('seatTop').innerText = st || (izleyiciModu ? "Boş" : "➕ DAVET");
    let sl = koltuklar[(idx+3)%4]; document.getElementById('seatLeft').dataset.isim = sl || ""; document.getElementById('seatLeft').innerText = sl || (izleyiciModu ? "Boş" : "➕ DAVET");
};

// 🔥 MOBİL ÇİFT TIKLAMA (DOUBLE-TAP) TAMİRİ 🔥
window.tasEkle = function(tasData, yuvaId) { 
    const div = document.createElement('div'); div.className = `okey-tasi tas-${tasData.renk}`; div.innerText = tasData.sayi; div.id = tasData.id; 
    
    let sonDokunma = 0;
    div.addEventListener('touchend', function(e) {
        let suAn = new Date().getTime();
        let fark = suAn - sonDokunma;
        if (fark > 0 && fark < 300) { window.otomatikTasAt(this); e.preventDefault(); }
        sonDokunma = suAn;
    });
    div.ondblclick = function() { window.otomatikTasAt(this); }; 
    document.getElementById(yuvaId).appendChild(div); 
};

window.checkGosterge = function() { 
    gostergeBtn.style.display = 'none'; 
    if(!gostergeHakki || !benimSiramMi) return; 
    let gostergeDiv = document.getElementById('gostergeTasi'); 
    if(gostergeDiv.innerText) { 
        let gSayi = gostergeDiv.innerText; let renkClass = Array.from(gostergeDiv.classList).find(c => c.startsWith('tas-')); 
        if(!renkClass) return; let gRenk = renkClass.replace('tas-', ''); let varMi = false; 
        for(let i=0; i<24; i++) { 
            let yuva = document.getElementById('y'+i); 
            if(yuva.children.length > 0) { 
                let t = yuva.children[0]; let tRenkClass = Array.from(t.classList).find(c => c.startsWith('tas-')); 
                if(tRenkClass) { let tRenk = tRenkClass.replace('tas-', ''); if(tRenk === gRenk && t.innerText === gSayi) varMi = true; } 
            } 
        } 
        if(varMi) gostergeBtn.style.display = 'block'; 
    } 
};

window.elimdekiTasSayisi = function() { let sayi = 0; for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length > 0) sayi++; } return sayi; };

window.getIstakaGruplari = function() { 
    let gruplar = []; let currentGrup = []; 
    for(let i=0; i<24; i++) { 
        if(i === 12 && currentGrup.length > 0) { gruplar.push(currentGrup); currentGrup = []; } 
        let yuva = document.getElementById('y'+i); 
        if(yuva.children.length > 0) { 
            let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); 
            let renk = renkClass ? renkClass.replace('tas-', '') : ''; currentGrup.push({ id: tas.id, renk: renk, sayi: tas.innerText }); 
        } else { if(currentGrup.length > 0) { gruplar.push(currentGrup); currentGrup = []; } } 
    } 
    if(currentGrup.length > 0) gruplar.push(currentGrup); 
    return gruplar; 
};

window.seriDiz = function() { 
    let taslar = []; 
    for(let i=0; i<24; i++) { 
        let yuva = document.getElementById('y'+i); 
        if(yuva.children.length > 0) { 
            let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); 
            let renk = renkClass ? renkClass.replace('tas-', '') : ''; taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 }); 
        } 
    } 
    const renkDeger = { 'kirmizi': 1, 'siyah': 2, 'mavi': 3, 'sari': 4, 'sahte': 5 }; 
    taslar.sort((a, b) => { if (renkDeger[a.renk] !== renkDeger[b.renk]) return renkDeger[a.renk] - renkDeger[b.renk]; return a.sayi - b.sayi; }); 
    taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); }); 
    sesCal(sesTasCek); 
};

window.ciftDiz = function() { 
    let taslar = []; 
    for(let i=0; i<24; i++) { 
        let yuva = document.getElementById('y'+i); 
        if(yuva.children.length > 0) { 
            let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); 
            let renk = renkClass ? renkClass.replace('tas-', '') : ''; taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 }); 
        } 
    } 
    taslar.sort((a, b) => { if (a.sayi !== b.sayi) return a.sayi - b.sayi; return a.renk.localeCompare(b.renk); }); 
    taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); }); 
    sesCal(sesTasCek); 
};

window.otomatikTasAt = function(tasElementi) { 
    if (!benimSiramMi || window.elimdekiTasSayisi() !== 15) return; 
    gostergeHakki = false; gostergeBtn.style.display = 'none'; 
    const iskartaKutusu = document.getElementById('benimIskartam'); 
    if (iskartaKutusu) { 
        iskartaKutusu.appendChild(tasElementi); 
        tasElementi.style.position = 'absolute'; tasElementi.style.top = '50%'; tasElementi.style.left = '50%'; tasElementi.style.transform = 'translate(-50%, -50%)'; tasElementi.style.margin = '0'; 
        document.getElementById('iskartaYazi').style.display = 'none'; 
        let renkSinifi = Array.from(tasElementi.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; 
        socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: tasElementi.id, renk: renk, sayi: tasElementi.innerText } }); 
        sesCal(sesTasKoy); 
    } 
};

if(oyunuBaslatBtn) oyunuBaslatBtn.addEventListener('click', () => { socket.emit('oyunu_baslat', suAnkiMasam); });
kalanTasBilgi?.addEventListener('click', () => { 
    if (benimSiramMi && window.elimdekiTasSayisi() === 14) { 
        gostergeHakki = false; socket.emit('ortadan_tas_cek', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); sesCal(sesTasCek); 
    } else if(!benimSiramMi) ozelUyariGoster("Şu an sıra sizde değil!"); 
    else ozelUyariGoster("Önce elinizdeki fazlalık taşı sağdaki oyuncuya atmalısınız!"); 
});

document.getElementById('iskartaSol')?.addEventListener('click', function() { 
    if (benimSiramMi && window.elimdekiTasSayisi() === 14 && this.children.length > 0) { 
        gostergeHakki = false; const tasEl = this.lastElementChild; 
        let renkSinifi = Array.from(tasEl.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; 
        const tasObj = { id: tasEl.id, sayi: tasEl.innerText, renk: renk }; 
        this.innerHTML = ''; 
        for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { window.tasEkle(tasObj, 'y'+i); break; } } 
        socket.emit('yandan_tas_alindi', { masaAdi: suAnkiMasam, kimAldi: aktifKullaniciAdi, tas: tasObj }); sesCal(sesTasCek); 
    } else if(!benimSiramMi) ozelUyariGoster("Şu an sıra sizde değil!"); 
    else if(window.elimdekiTasSayisi() === 15) ozelUyariGoster("Elinizde zaten 15 taş var!"); 
});

const sortableOptions = { group: { name: 'istaka', put: (to) => to.el.children.length === 0 }, animation: 100, delay: 0, forceFallback: true, fallbackOnBody: true, fallbackTolerance: 3, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag', easing: "cubic-bezier(0.25, 1, 0.5, 1)", onEnd: function() { sesCal(sesTasKoy); } };
if(ustRaf && altRaf) {
    for(let i=0; i<12; i++) { 
        const yUst = document.createElement('div'); yUst.className = 'yuva'; yUst.id = 'y'+i; ustRaf.appendChild(yUst); new Sortable(yUst, sortableOptions); 
        const yAlt = document.createElement('div'); yAlt.className = 'yuva'; yAlt.id = 'y'+(i+12); altRaf.appendChild(yAlt); new Sortable(yAlt, sortableOptions); 
    }
}

if(document.getElementById('benimIskartam')) {
    new Sortable(document.getElementById('benimIskartam'), { 
        group: { name: 'istaka', put: function (to) { return benimSiramMi && window.elimdekiTasSayisi() === 15; }, pull: false }, 
        animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, 
        onAdd: function (evt) { 
            gostergeHakki = false; document.getElementById('iskartaYazi').style.display = 'none'; 
            const atilanTas = evt.item; atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0'; 
            let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; 
            socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText } }); 
            sesCal(sesTasKoy); 
        } 
    });
}

if(bitisAlani) {
    new Sortable(bitisAlani, { 
        group: { name: 'istaka', put: function (to) { return benimSiramMi && window.elimdekiTasSayisi() === 15; }, pull: false }, 
        animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, 
        onAdd: function (evt) { 
            gostergeHakki = false; const atilanTas = evt.item; 
            atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0'; 
            let gruplar = window.getIstakaGruplari(); 
            let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; 
            const bitisTasi = { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText }; 
            socket.emit('oyunu_bitir', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, gruplar: gruplar, bitisTasi: bitisTasi, tasHtmlId: atilanTas.id }); 
            sesCal(sesTasKoy); 
        } 
    });
}
