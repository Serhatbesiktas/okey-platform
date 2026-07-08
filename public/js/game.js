// ==========================================
// BEYCO GAMES - ANA OYUN MOTORU (ENGINE)
// ==========================================
window.masaKoltukMapping = { bottom: '', right: '', top: '', left: '' };

window.masayaOtur = function(m) { 
    try {
        let bahis = 0; if(m.includes('20K')) bahis = 20000; else if(m.includes('50K')) bahis = 50000; else if(m.includes('10K')) bahis = 10000;
        let c = (typeof benimAnlikCipim !== 'undefined') ? benimAnlikCipim : 0;
        let safCip = parseInt(String(c).replace(/[^0-9]/g, '')) || 0;
        
        if(safCip < bahis) { 
            if(typeof ozelUyariGoster !== 'undefined') ozelUyariGoster("⚠️ Yetersiz Bakiye! Bu masaya oturmak için en az " + bahis.toLocaleString() + " ÇİP gerekiyor."); 
            else alert("Yetersiz Bakiye!");
            return; 
        }
        
        if (typeof suAnkiMasam !== 'undefined') suAnkiMasam = m; 
        
        if(typeof socket !== 'undefined') {
            socket.emit('masaya_otur', { isim: (typeof aktifKullaniciAdi !== 'undefined' ? aktifKullaniciAdi : ""), masaAdi: m }); 
        }
        
        let lobi = document.getElementById('lobiEkrani'); if(lobi) lobi.style.display = 'none'; 
        let masa = document.getElementById('masaEkrani'); if(masa) masa.style.display = 'flex'; 
        let yazi = document.getElementById('masaOrtasiYazi');
        if(yazi) yazi.innerHTML = m.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>";
    } catch(err) { console.error("Oturma Hatası:", err); }
};

window.masayaGeriDon = function(m) { 
    if (typeof suAnkiMasam !== 'undefined') suAnkiMasam = m; 
    let lobi = document.getElementById('lobiEkrani'); if(lobi) lobi.style.display = 'none'; 
    let masa = document.getElementById('masaEkrani'); if(masa) masa.style.display = 'flex'; 
    if(typeof socket !== 'undefined') socket.emit('masaya_geri_don', { masaAdi: m, isim: (typeof aktifKullaniciAdi !== 'undefined' ? aktifKullaniciAdi : "") }); 
};

window.masayiIzle = function(m) { 
    if(typeof socket !== 'undefined') socket.emit('masayi_izle', { isim: (typeof aktifKullaniciAdi !== 'undefined' ? aktifKullaniciAdi : ""), masaAdi: m }); 
};

window.masayiTemizle = function() { 
    if(typeof masaOyunBasladiMi !== 'undefined') masaOyunBasladiMi = false; 
    let sec = document.getElementById('sonucEkrani'); if(sec) sec.style.display = 'none'; 
    let oao = document.getElementById('oyunAlanObjeleri'); if(oao) oao.style.display = 'none'; 
    let gbtn = document.getElementById('gostergeBtn'); if(gbtn) gbtn.style.display = 'none'; 
    if(typeof gostergeHakki !== 'undefined') gostergeHakki = false; 
    
    let obtn = document.getElementById('oyunuBaslatBtn');
    if(obtn) { obtn.innerText = "🎲 OYUNU BAŞLAT"; obtn.style.display = 'block'; obtn.disabled = false; obtn.style.opacity = '1'; }

    let balan = document.getElementById('bitisAlani');
    if(balan) { balan.style.display = 'none'; balan.innerHTML = 'BİTİR<br>🏆'; }
    let mkasa = document.getElementById('masaKasaBilgisi'); if(mkasa) mkasa.style.display = 'none'; 
    
    for(let i=0; i<24; i++) { let y = document.getElementById('y'+i); if(y) y.innerHTML = ''; }
    
    let bis = document.getElementById('benimIskartam'); if(bis) bis.innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; 
    let isag = document.getElementById('iskartaSag'); if(isag) isag.innerHTML = ''; 
    let isol = document.getElementById('iskartaSol'); if(isol) isol.innerHTML = ''; 
    let iust = document.getElementById('iskartaUst'); if(iust) iust.innerHTML = ''; 
    
    document.getElementById('benimAdimKutusu')?.classList.remove('aktif-sira'); 
    document.getElementById('seatRight')?.classList.remove('aktif-sira'); 
    document.getElementById('seatTop')?.classList.remove('aktif-sira'); 
    document.getElementById('seatLeft')?.classList.remove('aktif-sira'); 
    if(typeof benimSiramMi !== 'undefined') benimSiramMi = false; 
};

window.gelişmişKoltukHizala = function(koltuklar) {
    let k = typeof aktifKullaniciAdi !== 'undefined' ? aktifKullaniciAdi : "";
    let izl = typeof izleyiciModu !== 'undefined' ? izleyiciModu : false;

    let idx = koltuklar.indexOf(k); if(idx === -1) idx = 0; 
    window.masaKoltukMapping.bottom = koltuklar[idx] || ""; 
    window.masaKoltukMapping.right = koltuklar[(idx+1)%4] || ""; 
    window.masaKoltukMapping.top = koltuklar[(idx+2)%4] || ""; 
    window.masaKoltukMapping.left = koltuklar[(idx+3)%4] || "";

    const rEl = document.getElementById('seatRight'); if(rEl) { rEl.innerText = window.masaKoltukMapping.right || (izl ? "Boş" : "➕ DAVET"); rEl.dataset.isim = window.masaKoltukMapping.right; }
    const tEl = document.getElementById('seatTop'); if(tEl) { tEl.innerText = window.masaKoltukMapping.top || (izl ? "Boş" : "➕ DAVET"); tEl.dataset.isim = window.masaKoltukMapping.top; }
    const lEl = document.getElementById('seatLeft'); if(lEl) { lEl.innerText = window.masaKoltukMapping.left || (izl ? "Boş" : "➕ DAVET"); lEl.dataset.isim = window.masaKoltukMapping.left; }
    const bEl = document.getElementById('benimAdimKutusu');
    if (bEl) {
        bEl.dataset.isim = window.masaKoltukMapping.bottom;
        if (izl) { 
            const mo = document.getElementById('masaOrtasiYazi'); 
            let curM = typeof suAnkiMasam !== 'undefined' && suAnkiMasam ? suAnkiMasam.toUpperCase() : "MASA";
            if(mo) mo.innerHTML = `${curM}<br><span style='font-size:10px; color:#f2c94c;'>İzleyici Modu</span><br><span style='font-size:9px; color:#a3c4bc;'>Aşağıdaki Oyuncu: ${window.masaKoltukMapping.bottom || 'Boş'}</span>`; 
        }
    }
};

window.tasEkle = function(tasData, yuvaId) { 
    const div = document.createElement('div'); div.className = `okey-tasi tas-${tasData.renk}`; div.innerText = tasData.sayi; div.id = tasData.id; 
    let sonTiklama = 0;
    const ciftTiklamaIsleyici = function(e) { let suAn = new Date().getTime(); if (suAn - sonTiklama < 400) { window.otomatikTasAt(div); if(e) e.preventDefault(); } sonTiklama = suAn; };
    div.addEventListener('click', ciftTiklamaIsleyici); div.addEventListener('touchstart', ciftTiklamaIsleyici, {passive: false}); div.ondblclick = function() { window.otomatikTasAt(this); }; 
    const yuva = document.getElementById(yuvaId); if(yuva) yuva.appendChild(div); 
};

window.checkGosterge = function() {}; 

window.elimdekiTasSayisi = function() { let sayi = 0; for(let i=0; i<24; i++) { let y = document.getElementById('y'+i); if(y && y.children.length > 0) sayi++; } return sayi; };

window.getIstakaGruplari = function() { 
    let gruplar = []; let currentGrup = []; 
    for(let i=0; i<24; i++) { 
        if(i === 12 && currentGrup.length > 0) { gruplar.push(currentGrup); currentGrup = []; } 
        let yuva = document.getElementById('y'+i); 
        if(yuva && yuva.children.length > 0) { 
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
        if(yuva && yuva.children.length > 0) { 
            let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); 
            let renk = renkClass ? renkClass.replace('tas-', '') : ''; taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 }); 
        } 
    } 
    const renkDeger = { 'kirmizi': 1, 'siyah': 2, 'mavi': 3, 'sari': 4, 'sahte': 5 }; 
    taslar.sort((a, b) => { if (renkDeger[a.renk] !== renkDeger[b.renk]) return renkDeger[a.renk] - renkDeger[b.renk]; return a.sayi - b.sayi; }); 
    taslar.forEach((tasObj, index) => { let yy = document.getElementById('y'+index); if(yy) yy.appendChild(tasObj.el); }); 
    if(typeof sesCal === 'function' && typeof sesTasCek !== 'undefined') sesCal(sesTasCek); 
};

window.ciftDiz = function() { 
    let taslar = []; 
    for(let i=0; i<24; i++) { 
        let yuva = document.getElementById('y'+i); 
        if(yuva && yuva.children.length > 0) { 
            let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); 
            let renk = renkClass ? renkClass.replace('tas-', '') : ''; taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 }); 
        } 
    } 
    taslar.sort((a, b) => { if (a.sayi !== b.sayi) return a.sayi - b.sayi; return a.renk.localeCompare(b.renk); }); 
    taslar.forEach((tasObj, index) => { let yy = document.getElementById('y'+index); if(yy) yy.appendChild(tasObj.el); }); 
    if(typeof sesCal === 'function' && typeof sesTasCek !== 'undefined') sesCal(sesTasCek); 
};

window.otomatikTasAt = function(tasElementi) { 
    if (typeof benimSiramMi === 'undefined' || !benimSiramMi) { if(typeof ozelUyariGoster !== 'undefined') ozelUyariGoster("Şu an sıra sizde değil!"); return; }
    if (window.elimdekiTasSayisi() !== 15) { if(typeof ozelUyariGoster !== 'undefined') ozelUyariGoster("Sadece 15 taşınız varken ortaya taş atabilirsiniz!"); return; }

    if(typeof gostergeHakki !== 'undefined') gostergeHakki = false; 
    let gBtn = document.getElementById('gostergeBtn'); if(gBtn) gBtn.style.display = 'none'; 
    
    const iskartaKutusu = document.getElementById('benimIskartam'); 
    if (iskartaKutusu) { 
        iskartaKutusu.appendChild(tasElementi); 
        tasElementi.style.position = 'absolute'; tasElementi.style.top = '50%'; tasElementi.style.left = '50%'; tasElementi.style.transform = 'translate(-50%, -50%)'; tasElementi.style.margin = '0'; 
        let iy = document.getElementById('iskartaYazi'); if(iy) iy.style.display = 'none'; 
        let renkSinifi = Array.from(tasElementi.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; 
        
        let cMasa = typeof suAnkiMasam !== 'undefined' ? suAnkiMasam : "";
        let cAd = typeof aktifKullaniciAdi !== 'undefined' ? aktifKullaniciAdi : "";
        if(typeof socket !== 'undefined') socket.emit('tas_atildi', { masaAdi: cMasa, isim: cAd, tas
