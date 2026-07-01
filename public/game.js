window.masaKoltukMapping = { bottom: '', right: '', top: '', left: '' };

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
    masaOyunBasladiMi = false; document.getElementById('sonucEkrani').style.display = 'none'; oyunAlanObjeleri.style.display = 'none'; 
    if(document.getElementById('gostergeBtn')) document.getElementById('gostergeBtn').style.display = 'none'; gostergeHakki = false; 
    oyunuBaslatBtn.innerText = "🎲 OYUNU BAŞLAT"; oyunuBaslatBtn.style.display = 'block'; oyunuBaslatBtn.disabled = false; oyunuBaslatBtn.style.opacity = '1';
    bitisAlani.style.display = 'none'; masaKasaBilgisi.style.display = 'none'; bitisAlani.innerHTML = 'BİTİR<br>🏆'; 
    for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; 
    document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; 
    document.getElementById('iskartaSag').innerHTML = ''; document.getElementById('iskartaSol').innerHTML = ''; document.getElementById('iskartaUst').innerHTML = ''; 
    document.getElementById('benimAdimKutusu')?.classList.remove('aktif-sira'); document.getElementById('seatRight')?.classList.remove('aktif-sira'); document.getElementById('seatTop')?.classList.remove('aktif-sira'); document.getElementById('seatLeft')?.classList.remove('aktif-sira'); 
    benimSiramMi = false; 
};

window.gelişmişKoltukHizala = function(koltuklar) {
    let idx = koltuklar.indexOf(aktifKullaniciAdi); 
    if(idx === -1) idx = 0; 
    
    window.masaKoltukMapping.bottom = koltuklar[idx] || "";
    window.masaKoltukMapping.right = koltuklar[(idx+1)%4] || "";
    window.masaKoltukMapping.top = koltuklar[(idx+2)%4] || "";
    window.masaKoltukMapping.left = koltuklar[(idx+3)%4] || "";

    const rightEl = document.getElementById('seatRight');
    if(rightEl) { rightEl.innerText = window.masaKoltukMapping.right || (izleyiciModu ? "Boş" : "➕ DAVET"); rightEl.dataset.isim = window.masaKoltukMapping.right; }
    
    const topEl = document.getElementById('seatTop');
    if(topEl) { topEl.innerText = window.masaKoltukMapping.top || (izleyiciModu ? "Boş" : "➕ DAVET"); topEl.dataset.isim = window.masaKoltukMapping.top; }
    
    const leftEl = document.getElementById('seatLeft');
    if(leftEl) { leftEl.innerText = window.masaKoltukMapping.left || (izleyiciModu ? "Boş" : "➕ DAVET"); leftEl.dataset.isim = window.masaKoltukMapping.left; }

    const benimKutu = document.getElementById('benimAdimKutusu');
    if (benimKutu) {
        benimKutu.dataset.isim = window.masaKoltukMapping.bottom;
        if (izleyiciModu) {
            const masaOrtasi = document.getElementById('masaOrtasiYazi');
            if(masaOrtasi) masaOrtasi.innerHTML = `${suAnkiMasam.toUpperCase()}<br><span style='font-size:10px; color:#f2c94c;'>İzleyici Modu</span><br><span style='font-size:9px; color:#a3c4bc;'>Aşağıdaki Oyuncu: ${window.masaKoltukMapping.bottom || 'Boş'}</span>`;
        }
    }
};

window.tasEkle = function(tasData, yuvaId) { 
    const div = document.createElement('div'); div.className = `okey-tasi tas-${tasData.renk}`; div.innerText = tasData.sayi; div.id = tasData.id; 
    let sonTiklama = 0;
    const ciftTiklamaIsleyici = function(e) {
        let suAn = new Date().getTime(); if (suAn - sonTiklama < 400) { window.otomatikTasAt(div); if(e) e.preventDefault(); } sonTiklama = suAn;
    };
    div.addEventListener('click', ciftTiklamaIsleyici); div.addEventListener('touchstart', ciftTiklamaIsleyici, {passive: false}); div.ondblclick = function() { window.otomatikTasAt(this); }; 
    document.getElementById(yuvaId).appendChild(div); 
};

window.checkGosterge = function() { 
    const btn = document.getElementById('gostergeBtn'); if(!btn) return; btn.style.display = 'none'; 
    if(!benimSiramMi || !gostergeHakki) return; 
    let gostergeDiv = document.getElementById('gostergeTasi'); 
    if(gostergeDiv && gostergeDiv.innerText) { 
        let gSayi = gostergeDiv.innerText; let renkClass = Array.from(gostergeDiv.classList).find(c => c.startsWith('tas-')); 
        if(!renkClass) return; let gRenk = renkClass.replace('tas-', ''); let varMi = false; 
        for(let i=0; i<24; i++) { 
            let yuva = document.getElementById('y'+i); 
            if(yuva.children.length > 0) { 
                let t = yuva.children[0]; let tRenkClass = Array.from(t.classList).find(c => c.startsWith('tas-')); 
                if(tRenkClass && tRenkClass.replace('tas-', '') === gRenk && t.innerText === gSayi) varMi = true; 
            } 
        } 
        if(varMi) btn.style.display = 'block'; 
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
    if(currentGrup.length > 0) gruplar.push(currentGrup); return gruplar; 
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
    taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); }); sesCal(sesTasCek); 
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
    taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); }); sesCal(sesTasCek); 
};

window.otomatikTasAt = function(tasElementi) { 
    if (!benimSiramMi) { ozelUyariGoster("Şu an sıra sizde değil!"); return; }
    if (window.elimdekiTasSayisi() !== 15) { ozelUyariGoster("Sadece 15 taşınız varken ortaya taş atabilirsiniz!"); return; }

    gostergeHakki = false; if(document.getElementById('gostergeBtn')) document.getElementById('gostergeBtn').style.display = 'none'; 
    const iskartaKutusu = document.getElementById('benimIskartam'); 
    if (iskartaKutusu) { 
        iskartaKutusu.appendChild(tasElementi); 
        tasElementi.style.position = 'absolute'; tasElementi.style.top = '50%'; tasElementi.style.left = '50%'; tasElementi.style.transform = 'translate(-50%, -50%)'; tasElementi.style.margin = '0'; 
        if(document.getElementById('iskartaYazi')) document.getElementById('iskartaYazi').style.display = 'none'; 
        let renkSinifi = Array.from(tasElementi.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; 
        socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: tasElementi.id, renk: renk, sayi: tasElementi.innerText } }); sesCal(sesTasKoy); 
    } 
};

if(oyunuBaslatBtn) {
    oyunuBaslatBtn.addEventListener('click', () => { 
        oyunuBaslatBtn.disabled = true; oyunuBaslatBtn.innerText = "⏳ BAŞLIYOR..."; oyunuBaslatBtn.style.opacity = '0.5';
        socket.emit('oyunu_baslat', suAnkiMasam); 
        setTimeout(() => { if(oyunuBaslatBtn) { oyunuBaslatBtn.disabled = false; oyunuBaslatBtn.innerText = "🎲 OYUNU BAŞLAT"; oyunuBaslatBtn.style.opacity = '1'; } }, 4000);
    });
}

kalanTasBilgi?.addEventListener('click', () => { 
    if (benimSiramMi && window.elimdekiTasSayisi() === 14) { 
        gostergeHakki = false; socket.emit('ortadan_tas_cek', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); sesCal(sesTasCek); 
    } else if(!benimSiramMi) ozelUyariGoster("Şu an sıra sizde değil!"); else ozelUyariGoster("Önce taşı atmalısınız!"); 
});

document.getElementById('iskartaSol')?.addEventListener('click', function() { 
    if (benimSiramMi && window.elimdekiTasSayisi() === 14 && this.children.length > 0) { 
        gostergeHakki = false; const tasEl = this.lastElementChild; 
        let renkSinifi = Array.from(tasEl.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; 
        const tasObj = { id: tasEl.id, sayi: tasEl.innerText, renk: renk }; this.innerHTML = ''; 
        for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { window.tasEkle(tasObj, 'y'+i); break; } } 
        socket.emit('yandan_tas_alindi', { masaAdi: suAnkiMasam, kimAldi: aktifKullaniciAdi, tas: tasObj }); sesCal(sesTasCek); 
    } else if(!benimSiramMi) ozelUyariGoster("Şu an sıra sizde değil!"); else if(window.elimdekiTasSayisi() === 15) ozelUyariGoster("Elinizde zaten 15 taş var!"); 
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
            gostergeHakki = false; if(document.getElementById('iskartaYazi')) document.getElementById('iskartaYazi').style.display = 'none'; 
            const atilanTas = evt.item; atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0'; 
            let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; 
            socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText } }); sesCal(sesTasKoy); 
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
            socket.emit('oyunu_bitir', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, gruplar: gruplar, bitisTasi: bitisTasi, tasHtmlId: atilanTas.id }); sesCal(sesTasKoy); 
        } 
    });
}

// 🔥 KUSURSUZ ARAYÜZ YAMALARI (Orijinal Sistemi Bozmayan Zırh) 🔥
if (typeof socket !== 'undefined') {

    // Katman (Z-index) Hatası Çözümü
    let style = document.createElement('style');
    style.innerHTML = `
        #iskartaSol { z-index: 100 !important; }
        #iskartaSol .okey-tasi { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) !important; margin: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.8); }
        body #kazananEliAlani .okey-tasi-bitis { background: #fdfbf7 !important; box-shadow: 0 4px 10px rgba(0,0,0,0.8) !important; border: 2px solid #d1ccc0 !important; }
    `;
    document.head.appendChild(style);

    // Bitiş Ekranı (Siyah Kutu) Zorla Doldurucu
    socket.on('oyun_bitti', function(data) {
        if (window.suAnkiMasam !== data.masaAdi) return;

        let htmlIcerik = "";
        if (data.bitisEli && Array.isArray(data.bitisEli) && data.bitisEli.length > 0) {
            let siraliEl = [...data.bitisEli].sort((a, b) => {
                let vA = (a.sayi === 'S') ? 14 : parseInt(a.sayi || 0);
                let vB = (b.sayi === 'S') ? 14 : parseInt(b.sayi || 0);
                if(vA === vB) return (a.renk || '').localeCompare(b.renk || '');
                return vA - vB;
            });

            siraliEl.forEach(tas => {
                if(!tas) return;
                let textColor = '#111';
                if(tas.renk === 'kirmizi') textColor = '#cc0000';
                else if(tas.renk === 'mavi') textColor = '#0000cc';
                else if(tas.renk === 'sari') textColor = '#d4af37';

                let displaySayi = tas.sayi === 'S' ? '☻' : tas.sayi;
                htmlIcerik += `<div class="okey-tasi-bitis" style="position:relative; width:26px; height:38px; font-size:16px; font-weight:900; color:${textColor}; border-radius:4px; display:flex; justify-content:center; align-items:center; margin:2px;">${displaySayi}</div>`;
            });
        } else {
            htmlIcerik = '<span style="color:#aaa; font-size:12px;">Taşlar alınamadı.</span>';
        }

        setTimeout(() => {
            let sEkrani = document.getElementById('sonucEkrani');
            if (sEkrani) sEkrani.style.display = 'flex';
            let elAlani = document.getElementById('kazananEliAlani');
            if (elAlani) {
                elAlani.innerHTML = htmlIcerik;
                let vurus = 0;
                let civi = setInterval(() => {
                    if(document.getElementById('kazananEliAlani')) document.getElementById('kazananEliAlani').innerHTML = htmlIcerik;
                    if(++vurus > 5) clearInterval(civi);
                }, 200);
            }
        }, 200);
    });

    // Yandan Taş Çekildiğinde Eski Taşı (Alttakini) Gösterme Motoru
    socket.on('yandan_alindi_guncelle', function(data) {
        if(window.suAnkiMasam === data.masaAdi && data.atanKisi) {
            let tDiv = 'benimIskartam';
            if(window.masaKoltukMapping) {
                if(window.masaKoltukMapping.right === data.atanKisi) tDiv = 'iskartaSag';
                else if(window.masaKoltukMapping.top === data.atanKisi) tDiv = 'iskartaUst';
                else if(window.masaKoltukMapping.left === data.atanKisi) tDiv = 'iskartaSol';
            }
            let k = document.getElementById(tDiv);
            if(k) {
                k.innerHTML = '';
                if (data.yeniUstTas) {
                    k.innerHTML = `<div class="okey-tasi tas-${data.yeniUstTas.renk}" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); box-shadow:0 2px 5px rgba(0,0,0,0.8); margin:0;">${data.yeniUstTas.sayi}</div>`;
                } else if (tDiv === 'benimIskartam') {
                    k.innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>';
                }
            }
        }
    });

    socket.on('masa_oyun_basladi', () => {
        let sEkrani = document.getElementById('sonucEkrani');
        if(sEkrani) sEkrani.style.display = 'none';
    });
}
