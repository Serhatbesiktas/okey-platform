window.masaKoltukMapping = { bottom: '', right: '', top: '', left: '' };

window.masayaOtur = function(m) {
    let bahis = 0; if(m.includes('20K')) bahis = 20000; else if(m.includes('50K')) bahis = 50000; else if(m.includes('10K')) bahis = 10000;
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(safCip < bahis) { ozelUyariGoster("⚠️ Yetersiz Bakiye! Bu masaya oturmak için en az " + bahis.toLocaleString() + " ÇİP gerekiyor."); return; }
    suAnkiMasam = m; socket.emit('masaya_otur', { isim: aktifKullaniciAdi, masaAdi: m });
    
    document.getElementById('lobiEkrani').style.display = 'none'; 
    document.getElementById('masaEkrani').style.display = 'flex';
    document.getElementById('masaOrtasiYazi').innerHTML = m.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>";
};

window.masayaGeriDon = function(m) { suAnkiMasam = m; document.getElementById('lobiEkrani').style.display = 'none'; document.getElementById('masaEkrani').style.display = 'flex'; socket.emit('masaya_geri_don', { masaAdi: m, isim: aktifKullaniciAdi }); };
window.masayiIzle = function(m) { socket.emit('masayi_izle', { isim: aktifKullaniciAdi, masaAdi: m }); };

window.masayiTemizle = function() {
    masaOyunBasladiMi = false;
    if(document.getElementById('sonucEkrani')) document.getElementById('sonucEkrani').style.display = 'none';
    const oyunAlanObjeleri = document.getElementById('oyunAlanObjeleri'); if(oyunAlanObjeleri) oyunAlanObjeleri.style.display = 'none';
    if(document.getElementById('gostergeBtn')) document.getElementById('gostergeBtn').style.display = 'none';
    gostergeHakki = false;

    const oyunuBaslatBtn = document.getElementById('oyunuBaslatBtn');
    if(oyunuBaslatBtn) { oyunuBaslatBtn.innerText = "🎲 OYUNU BAŞLAT"; oyunuBaslatBtn.style.display = 'block'; oyunuBaslatBtn.disabled = false; oyunuBaslatBtn.style.opacity = '1'; }

    const bitisAlani = document.getElementById('bitisAlani');
    if(bitisAlani) { bitisAlani.style.display = 'none'; bitisAlani.innerHTML = 'BİTİR<br>🏆'; }
    if(document.getElementById('masaKasaBilgisi')) document.getElementById('masaKasaBilgisi').style.display = 'none';

    for(let i=0; i<24; i++) { let y = document.getElementById('y'+i); if(y) y.innerHTML = ''; }

    if(document.getElementById('benimIskartam')) document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>';
    if(document.getElementById('iskartaSag')) document.getElementById('iskartaSag').innerHTML = '';
    if(document.getElementById('iskartaSol')) document.getElementById('iskartaSol').innerHTML = '';
    if(document.getElementById('iskartaUst')) document.getElementById('iskartaUst').innerHTML = '';

    document.getElementById('benimAdimKutusu')?.classList.remove('aktif-sira');
    document.getElementById('seatRight')?.classList.remove('aktif-sira');
    document.getElementById('seatTop')?.classList.remove('aktif-sira');
    document.getElementById('seatLeft')?.classList.remove('aktif-sira');
    benimSiramMi = false;
};

window.gelişmişKoltukHizala = function(koltuklar) {
    let idx = koltuklar.indexOf(aktifKullaniciAdi); if(idx === -1) idx = 0;
    window.masaKoltukMapping.bottom = koltuklar[idx] || ""; window.masaKoltukMapping.right = koltuklar[(idx+1)%4] || ""; window.masaKoltukMapping.top = koltuklar[(idx+2)%4] || ""; window.masaKoltukMapping.left = koltuklar[(idx+3)%4] || "";

    const rightEl = document.getElementById('seatRight'); if(rightEl) { rightEl.innerText = window.masaKoltukMapping.right || (izleyiciModu ? "Boş" : "➕ DAVET"); rightEl.dataset.isim = window.masaKoltukMapping.right; }
    const topEl = document.getElementById('seatTop'); if(topEl) { topEl.innerText = window.masaKoltukMapping.top || (izleyiciModu ? "Boş" : "➕ DAVET"); topEl.dataset.isim = window.masaKoltukMapping.top; }
    const leftEl = document.getElementById('seatLeft'); if(leftEl) { leftEl.innerText = window.masaKoltukMapping.left || (izleyiciModu ? "Boş" : "➕ DAVET"); leftEl.dataset.isim = window.masaKoltukMapping.left; }
    const benimKutu = document.getElementById('benimAdimKutusu');
    if (benimKutu) {
        benimKutu.dataset.isim = window.masaKoltukMapping.bottom;
        if (izleyiciModu) { const masaOrtasi = document.getElementById('masaOrtasiYazi'); if(masaOrtasi) masaOrtasi.innerHTML = `${suAnkiMasam.toUpperCase()}<br><span style='font-size:10px; color:#f2c94c;'>İzleyici Modu</span><br><span style='font-size:9px; color:#a3c4bc;'>Aşağıdaki Oyuncu: ${window.masaKoltukMapping.bottom || 'Boş'}</span>`; }
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
    taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); });
    if(typeof sesCal === 'function') sesCal(typeof sesTasCek !== 'undefined' ? sesTasCek : '');
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
    taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); });
    if(typeof sesCal === 'function') sesCal(typeof sesTasCek !== 'undefined' ? sesTasCek : '');
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
        socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: tasElementi.id, renk: renk, sayi: tasElementi.innerText } });
        if(typeof sesCal === 'function') sesCal(typeof sesTasKoy !== 'undefined' ? sesTasKoy : '');
    }
};

const oyunuBaslatBtnDOM = document.getElementById('oyunuBaslatBtn');
if(oyunuBaslatBtnDOM) {
    oyunuBaslatBtnDOM.addEventListener('click', () => {
        oyunuBaslatBtnDOM.disabled = true; oyunuBaslatBtnDOM.innerText = "⏳ BAŞLIYOR..."; oyunuBaslatBtnDOM.style.opacity = '0.5';
        socket.emit('oyunu_baslat', suAnkiMasam);
        setTimeout(() => { if(oyunuBaslatBtnDOM) { oyunuBaslatBtnDOM.disabled = false; oyunuBaslatBtnDOM.innerText = "🎲 OYUNU BAŞLAT"; oyunuBaslatBtnDOM.style.opacity = '1'; } }, 5000);
    });
}

document.getElementById('kalanTasBilgi')?.addEventListener('click', () => {
    if (benimSiramMi && window.elimdekiTasSayisi() === 14) {
        gostergeHakki = false; socket.emit('ortadan_tas_cek', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
        if(typeof sesCal === 'function') sesCal(typeof sesTasCek !== 'undefined' ? sesTasCek : '');
    } else if(!benimSiramMi) ozelUyariGoster("Şu an sıra sizde değil!"); else ozelUyariGoster("Önce taşı atmalısınız!");
});

document.getElementById('iskartaSol')?.addEventListener('click', function() {
    if (benimSiramMi && window.elimdekiTasSayisi() === 14 && this.children.length > 0) {
        gostergeHakki = false; const tasEl = this.lastElementChild;
        let renkSinifi = Array.from(tasEl.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
        const tasObj = { id: tasEl.id, sayi: tasEl.innerText, renk: renk };
        this.removeChild(tasEl);
        for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { window.tasEkle(tasObj, 'y'+i); break; } }
        socket.emit('yandan_tas_alindi', { masaAdi: suAnkiMasam, kimAldi: aktifKullaniciAdi, tas: tasObj });
        if(typeof sesCal === 'function') sesCal(typeof sesTasCek !== 'undefined' ? sesTasCek : '');
    } else if(!benimSiramMi) ozelUyariGoster("Şu an sıra sizde değil!"); else if(window.elimdekiTasSayisi() === 15) ozelUyariGoster("Elinizde zaten 15 taş var!");
});

const btnGostergeDOM = document.getElementById('gostergeBtn');
if(btnGostergeDOM) {
    btnGostergeDOM.addEventListener('click', () => {
        if(suAnkiMasam && aktifKullaniciAdi && gostergeHakki) {
            socket.emit('gosterge_goster', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
            gostergeHakki = false; btnGostergeDOM.style.display = 'none';
        }
    });
}

const sortableOptions = { group: { name: 'istaka', put: (to) => to.el.children.length === 0 }, animation: 100, delay: 0, forceFallback: true, fallbackOnBody: true, fallbackTolerance: 3, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag', easing: "cubic-bezier(0.25, 1, 0.5, 1)", onEnd: function() { if(typeof sesCal === 'function') sesCal(typeof sesTasKoy !== 'undefined' ? sesTasKoy : ''); } };

const ustRaf = document.getElementById('ustRaf');
const altRaf = document.getElementById('altRaf');
if(ustRaf && altRaf) {
    for(let i=0; i<12; i++) {
        const yUst = document.createElement('div'); yUst.className = 'yuva'; yUst.id = 'y'+i; ustRaf.appendChild(yUst); if(typeof Sortable !== 'undefined') new Sortable(yUst, sortableOptions);
        const yAlt = document.createElement('div'); yAlt.className = 'yuva'; yAlt.id = 'y'+(i+12); altRaf.appendChild(yAlt); if(typeof Sortable !== 'undefined') new Sortable(yAlt, sortableOptions);
    }
}

const isKartaKutu = document.getElementById('benimIskartam');
if(isKartaKutu && typeof Sortable !== 'undefined') {
    new Sortable(isKartaKutu, {
        group: { name: 'istaka', put: function (to) { return benimSiramMi && window.elimdekiTasSayisi() === 15; }, pull: false },
        animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100,
        onAdd: function (evt) {
            gostergeHakki = false; if(document.getElementById('iskartaYazi')) document.getElementById('iskartaYazi').style.display = 'none';
            const atilanTas = evt.item; atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0';
            let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
            socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText } });
            if(typeof sesCal === 'function') sesCal(typeof sesTasKoy !== 'undefined' ? sesTasKoy : '');
        }
    });
}

const bitisAlanKutu = document.getElementById('bitisAlani');
if(bitisAlanKutu && typeof Sortable !== 'undefined') {
    new Sortable(bitisAlanKutu, {
        group: { name: 'istaka', put: function (to) { return benimSiramMi && window.elimdekiTasSayisi() === 15; }, pull: false },
        animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100,
        onAdd: function (evt) {
            gostergeHakki = false; const atilanTas = evt.item;
            atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0';
            let gruplar = window.getIstakaGruplari();
            let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
            const bitisTasi = { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText };
            socket.emit('oyunu_bitir', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, gruplar: gruplar, bitisTasi: bitisTasi, tasHtmlId: atilanTas.id });
            if(typeof sesCal === 'function') sesCal(typeof sesTasKoy !== 'undefined' ? sesTasKoy : '');
        }
    });
}
