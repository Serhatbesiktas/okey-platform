setInterval(() => {
    document.querySelectorAll('.bildirim-badge, .mesaj-badge, [id*="badge"], [class*="badge"]').forEach(badge => {
        if(badge.innerText.trim() === '0' || badge.innerText.trim() === '') {
            badge.style.display = 'none';
        }
    });
}, 1000);

document.querySelectorAll('#ozelMesajBtn, .ozel-mesaj-btn, #mesajlarBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.bildirim-badge, .mesaj-badge').forEach(b => b.style.display = 'none');
    });
});

window.arayuzGuncelle = function() {
    const avatar = document.getElementById('vipAvatar'); const isimKutu = document.getElementById('benimAdimKutusu'); const rozetim = document.getElementById('benimVipRozetim');
    if(avatar) { avatar.style.border = '2px solid #52796f'; avatar.style.boxShadow = 'none'; } 
    if(isimKutu) { isimKutu.style.color = '#fff'; isimKutu.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)'; }
    let ligAyar = getLigRozeti(benimKazanilanOyun, isMisafir); 
    if(rozetim) { rozetim.innerText = ligAyar.metin; rozetim.style.background = ligAyar.renk; rozetim.style.color = ligAyar.yaziRenk; }
    let tacEki = ""; if(aktifKozmetikler.includes('neon_tac')) { tacEki = "👑 "; }
    if(aktifKullaniciAdi && !izleyiciModu) { if(isimKutu) isimKutu.innerHTML = tacEki + aktifKullaniciAdi + ' <span style="color:#2ecc71;">✔</span>'; }
    if(aktifKozmetikler.includes('altin_cerceve') && avatar) { avatar.style.border = '3px solid #f2c94c'; avatar.style.boxShadow = '0 0 15px #f2c94c'; }
    if(aktifKozmetikler.includes('atesli_isim') && isimKutu && !izleyiciModu) { isimKutu.style.color = '#ff4d4d'; }
    
    const esyalar = [ 
        {id: 'altin_cerceve', fiyat: '500.000'}, {id: 'neon_tac', fiyat: '1.5M'}, {id: 'atesli_isim', fiyat: '3M'},
        {id: 'tema_royal', fiyat: '10 Milyon'}, {id: 'tema_neon', fiyat: '20 Milyon'}, {id: 'tema_kizil', fiyat: '30 Milyon'}
    ];
    esyalar.forEach(esya => { 
        const btn = document.getElementById('btn_' + esya.id); 
        if(btn) { 
            if(aktifKozmetikler.includes(esya.id)) { btn.innerText = 'ÇIKAR'; btn.style.background = '#e74c3c'; btn.style.color = '#fff'; } 
            else if(benimEnvanterim.includes(esya.id)) { btn.innerText = 'KULLAN'; btn.style.background = '#2ecc71'; btn.style.color = '#fff'; } 
            else { btn.innerText = esya.fiyat + ' ÇİP'; btn.style.background = ''; btn.style.color = ''; } 
        } 
    });
};

window.magazaIslem = function(esyaId, fiyat) {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar mağazayı kullanamaz!"); return; }
    
    if(aktifKozmetikler.includes(esyaId)) {
        aktifKozmetikler = aktifKozmetikler.filter(k => k !== esyaId);
    } else if(benimEnvanterim.includes(esyaId)) {
        if(esyaId.startsWith('tema_')) { aktifKozmetikler = aktifKozmetikler.filter(k => !k.startsWith('tema_')); } 
        aktifKozmetikler.push(esyaId);
    } else {
        let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
        if(safCip < fiyat) { ozelUyariGoster("⚠️ Yetersiz Çip!"); return; }
        
        benimAnlikCipim = safCip - fiyat;
        document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
        benimEnvanterim.push(esyaId);
        
        if(esyaId.startsWith('tema_')) { aktifKozmetikler = aktifKozmetikler.filter(k => !k.startsWith('tema_')); }
        aktifKozmetikler.push(esyaId);
        
        socket.emit('magaza_harcamasi', { isim: aktifKullaniciAdi, yeniCip: benimAnlikCipim });
        ozelUyariGoster("🎉 Başarıyla satın alındı!");
    }

    if(auth.currentUser && !isMisafir) {
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({
            cip: benimAnlikCipim, envanter: benimEnvanterim, aktifKozmetikler: aktifKozmetikler
        }).catch(e => console.log(e));
    }
    socket.emit('kozmetik_guncelle', { isim: aktifKullaniciAdi, kozmetikler: aktifKozmetikler });
    window.arayuzGuncelle();
};

window.vipMasaKurAksiyon = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar VIP Masa kuramaz!"); return; }
    let bahisDeger = parseInt(document.getElementById('vipMasaBahis').value); let gizliDeger = document.getElementById('vipMasaGizlilik').value === "true";
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(safCip < bahisDeger) { ozelUyariGoster("⚠️ Yetersiz çip!"); return; }
    document.getElementById('vipMasaKurPanel').style.display = 'none'; socket.emit('vip_masa_kur', { sahibi: aktifKullaniciAdi, bahis: bahisDeger, gizli: gizliDeger });
};

window.vipGizlilikDurumuDegistir = function() { if(suAnkiMasam && suAnkiMasaVIPMi && suAnkiMasaSahibi === aktifKullaniciAdi) { socket.emit('vip_masa_gizlilik_degis', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); } };
function gorevleriKaydet() { if(auth.currentUser && !isMisafir) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gorevler: benimGorevler }).catch(e=>console.log(e)); } }
window.gorevleriAc = function() { if(isMisafir) { ozelUyariGoster("⚠️ Misafirler görev yapamaz!"); return; } document.getElementById('gorevlerEkrani').style.display = 'flex'; window.renderGorevler(); };

window.renderGorevler = function() {
    const liste = document.getElementById('gorevListesi'); if(!liste) return; liste.innerHTML = '';
    const gorevlerData = [ { id: 'kazanma', baslik: '🏆 3 El Kazan', hedef: 3, mevcut: benimGorevler.kazanma, odul: 50000 }, { id: 'mesaj', baslik: '💬 5 Mesaj Gönder', hedef: 5, mevcut: benimGorevler.mesaj, odul: 10000 }, { id: 'gosterge', baslik: '⭐ 1 Kere Gösterge Yap', hedef: 1, mevcut: benimGorevler.gosterge, odul: 25000 } ];
    gorevlerData.forEach(g => {
        let yuzde = Math.min(100, (g.mevcut / g.hedef) * 100); let bittiMi = g.mevcut >= g.hedef; 
        let btnHtml = benimGorevler.alinanlar[g.id] ? `<button class="satin-al-btn" style="background:#555;" disabled>ALINDI</button>` : (bittiMi ? `<button class="satin-al-btn" style="background:#2ecc71; color:#fff;" onclick="gorevOduluAl('${g.id}', ${g.odul})">🎁 AL</button>` : `<div style="font-size:12px; color:#f2c94c; text-align:center; padding:10px;">İlerleme: ${g.mevcut} / ${g.hedef}</div>`);
        liste.innerHTML += `<div style="background:rgba(0,0,0,0.5); border:1px solid #52796f; border-radius:10px; padding:15px; margin-bottom:10px;"><h3 style="color:#fff; font-size:14px; margin-bottom:10px;">${g.baslik}</h3><div style="background:#111; width:100%; height:10px; border-radius:5px; margin-bottom:10px; overflow:hidden;"><div style="background:#2ecc71; width:${yuzde}%; height:100%;"></div></div>${btnHtml}</div>`;
    });
};

window.gorevOduluAl = function(id, m) { 
    if(benimGorevler.alinanlar[id]) return; benimGorevler.alinanlar[id] = true; gorevleriKaydet(); 
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0; benimAnlikCipim = safCip + m; 
    document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); 
    if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim }); 
    socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); ozelUyariGoster(`🎉 Görev bitti!`); window.renderGorevler(); 
};

window.konfetiPatlat = function() {
    for (let i = 0; i < 50; i++) {
        let conf = document.createElement('div');
        conf.className = 'konfeti-parcacik';
        let colors = ['#f1c40f', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6'];
        conf.style.cssText = `position:fixed; left:50%; top:50%; width:10px; height:10px; background:${colors[Math.floor(Math.random() * colors.length)]}; z-index:9999999; border-radius:${Math.random() > 0.5 ? '50%' : '0'}; transform: translate(-50%, -50%); pointer-events:none;`;
        document.body.appendChild(conf);

        let angle = Math.random() * Math.PI * 2;
        let velocity = 150 + Math.random() * 200;
        let tx = Math.cos(angle) * velocity;
        let ty = Math.sin(angle) * velocity - 100;
        let rot = Math.random() * 720 - 360;

        conf.animate([
            { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty+150}px)) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: 1500 + Math.random() * 1000, easing: 'cubic-bezier(.25, .8, .25, 1)' }).onfinish = () => conf.remove();
    }
};

window.gunlukOdulEkraniAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Günlük VIP ödülü için Kayıt Olun!"); return; }
    const simdi = new Date().getTime(); const sonAlis = window.localStorage.getItem('sonGunlukOdulZamani');
    const btnCevir = document.getElementById('btnBonusCevir'); const gosterge = document.getElementById('dijitalGosterge');
    if (sonAlis && (simdi - parseInt(sonAlis)) < 86400000) {
        let kalanMs = 86400000 - (simdi - parseInt(sonAlis)); let saat = Math.floor(kalanMs / (1000 * 60 * 60)); let dakika = Math.floor((kalanMs % (1000 * 60 * 60)) / (1000 * 60));
        gosterge.innerText = "BEKLE"; btnCevir.innerHTML = `🔒 YARIN GEL (${saat}s ${dakika}d)`; btnCevir.style.background = "#333"; btnCevir.style.color = "#888"; btnCevir.disabled = true;
    } else {
        gosterge.innerText = "000.000"; btnCevir.innerHTML = "🎲 KASAYI ÇEVİR"; btnCevir.style.background = "linear-gradient(180deg, #ffe066 0%, #db9d13 100%)"; btnCevir.style.color = "#000"; btnCevir.disabled = false;
    }
    document.getElementById('gunlukBonusEkrani').style.display = 'flex';
};

window.gunlukKasaCevir = function() {
    const btnCevir = document.getElementById('btnBonusCevir'); const gosterge = document.getElementById('dijitalGosterge'); btnCevir.disabled = true;
    const odul = Math.floor(Math.random() * 75000) + 25000;
    let hiz = 50; let donmeSayisi = 0;
    let kasaSesi = setInterval(() => {
        gosterge.innerText = (Math.floor(Math.random() * 90000) + 10000).toLocaleString('tr-TR'); donmeSayisi++;
        if(donmeSayisi > 30) {
            clearInterval(kasaSesi);
            gosterge.innerText = odul.toLocaleString('tr-TR'); gosterge.style.color = "#2ecc71"; gosterge.style.borderColor = "#2ecc71";
            btnCevir.innerHTML = "✅ ÖDÜLÜ ALDIN"; btnCevir.style.background = "#2ecc71";
            window.konfetiPatlat();
            let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0; benimAnlikCipim = safCip + odul; document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); 
            if(auth.currentUser) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim }); }
            socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); 
            window.localStorage.setItem('sonGunlukOdulZamani', new Date().getTime().toString());
            setTimeout(() => { document.getElementById('gunlukBonusEkrani').style.display = 'none'; }, 3000);
        }
    }, hiz);
};

window.reklamIzleAksiyon = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler bu ödülü kullanamaz!"); return; }
    const re = document.getElementById('reklamEkrani'); const sayacEl = document.getElementById('reklamSayac'); const kapatBtn = document.getElementById('btnReklamKapat');
    re.style.display = 'flex'; kapatBtn.style.display = 'none'; let kalanSure = 15; sayacEl.innerText = kalanSure;
    let reklamSayaci = setInterval(() => {
        kalanSure--; sayacEl.innerText = kalanSure;
        if (kalanSure <= 0) { clearInterval(reklamSayaci); sayacEl.innerText = "BİTTİ"; sayacEl.style.color = "#2ecc71"; kapatBtn.style.display = 'block'; }
    }, 1000);
};

window.reklamOduluAl = function() {
    document.getElementById('reklamEkrani').style.display = 'none';
    let odul = 25000; let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0; benimAnlikCipim = safCip + odul; document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); 
    if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim }); socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); 
    window.konfetiPatlat(); ozelUyariGoster("🎉 Sponsor ödülü olarak 25.000 ÇİP kazandın!");
};

// ==========================================
// 🔥 FAZ 4: ARKADAŞLIK VE BİLDİRİM MOTORU EKLENDİ 🔥
// ==========================================

window.benimGelenIsteklerim = [];
window.benimGidenIsteklerim = [];
window.benimArkadaslarim = [];
window.istekDinleyiciBasladi = false;

// 1. Gerçek Zamanlı Firestore Dinleyicisi (Sadece Kimlik Doğrulamadan Sonra 1 Kere Başlar)
function baslatArkadasListener() {
    if(typeof auth !== 'undefined' && auth.currentUser && typeof db !== 'undefined') {
        db.collection('kullanicilar').doc(auth.currentUser.uid).onSnapshot(doc => {
            if(doc.exists) {
                let data = doc.data();
                let yeniGelen = data.gelenIstekler || [];
                window.benimGidenIsteklerim = data.gidenIstekler || [];
                window.benimArkadaslarim = data.arkadaslar || [];

                // Yeni İstek Bildirimi
                if (window.benimGelenIsteklerim) {
                    yeniGelen.forEach(istekYapan => {
                        if (!window.benimGelenIsteklerim.includes(istekYapan)) {
                            window.gosterArkadaslikToast(istekYapan);
                        }
                    });
                }
                window.benimGelenIsteklerim = yeniGelen;

                // Anlık Ekran Güncellemeleri
                if (document.getElementById('arkadaslarEkrani').style.display === 'flex') window.arkadaslarMenusuAc();
                let acikProfil = document.getElementById('profilArkadasBtn')?.dataset?.hedef;
                if (acikProfil && document.getElementById('profilEkrani').style.display === 'flex') window.profiliGoster(acikProfil);
            }
        });
    }
}

// Oyuncu girdiği an dinleyiciyi aktif eden döngü
setInterval(() => {
    if(typeof auth !== 'undefined' && auth.currentUser && !window.istekDinleyiciBasladi) {
        window.istekDinleyiciBasladi = true;
        baslatArkadasListener();
    }
}, 2000);

// 2. Anlık Toast Bildirim Arayüzü (Ekrana CSS/Sistem Bozmadan Eklenir)
window.gosterArkadaslikToast = function(isim) {
    const container = document.getElementById('arkadasToastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = 'arkadas-toast';
    toast.id = `toast_istek_${isim}`;
    toast.style.cssText = "background: rgba(18, 26, 20, 0.95); border: 1px solid #f1c40f; border-radius: 12px; padding: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.5); width: 250px; pointer-events: auto; font-family: inherit;";
    toast.innerHTML = `
        <div style="color:#f1c40f; font-weight:bold; font-size:13px; margin-bottom:8px;">📨 Yeni İstek</div>
        <div style="color:#fff; font-size:12px; margin-bottom:10px;"><b>${isim}</b> sana arkadaşlık isteği gönderdi.</div>
        <div style="display:flex; gap:8px;">
            <button style="flex:1; background:#2ecc71; color:#000; border:none; border-radius:6px; padding:8px; font-weight:bold; cursor:pointer;" onclick="window.istekKabulEt('${isim}')">✅ KABUL</button>
            <button style="flex:1; background:#e74c3c; color:#fff; border:none; border-radius:6px; padding:8px; font-weight:bold; cursor:pointer;" onclick="window.istekReddet('${isim}')">❌ RED</button>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => { if(toast) toast.remove(); }, 15000); // 15 Saniyede Kaybolur
};

// 3. Profesyonel Arkadaş Listesi (Online/Offline Durum ve Mesajlaşma Birlikte)
window.arkadaslarMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler arkadaş kullanamaz."); return; } 
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; 
    const listeDiv = document.getElementById('arkadasListesiDiv'); 
    
    if (!window.benimArkadaslarim || window.benimArkadaslarim.length === 0) {
        listeDiv.innerHTML = '<p style="text-align:center; color:#777; font-size:12px; margin-top:20px;">Henüz arkadaşın yok.</p>';
        return;
    }
    
    listeDiv.innerHTML = '<p style="color:#a3c4bc; font-size:11px; text-align:center; margin-bottom:10px;">Arkadaş Listeniz</p>';
    
    let siraliArkadaslar = [...window.benimArkadaslarim].sort((a, b) => {
        let aOnline = typeof onlineOyuncularListesi !== 'undefined' && onlineOyuncularListesi.includes(a);
        let bOnline = typeof onlineOyuncularListesi !== 'undefined' && onlineOyuncularListesi.includes(b);
        return (aOnline === bOnline) ? 0 : aOnline ? -1 : 1;
    });

    siraliArkadaslar.forEach(o => {
        let isOnline = typeof onlineOyuncularListesi !== 'undefined' && onlineOyuncularListesi.includes(o);
        let koz = (typeof globalKozmetikler !== 'undefined' && globalKozmetikler[o]) || [];
        let iR = koz.includes('atesli_isim') ? '#ff4d4d' : '#fff';
        let tac = koz.includes('neon_tac') ? '👑 ' : '';
        let durumHtml = isOnline ? '<span style="color:#2ecc71; font-size:10px;">🟢 Çevrimiçi</span>' : '<span style="color:#7f8c8d; font-size:10px;">⚫ Çevrimdışı</span>';
        let davetBtnHtml = (isOnline && suAnkiMasam && !izleyiciModu) ? `<button class="btn-davet-et" onclick="masayaDavetEt('${o}')" style="background:#3498db; color:#fff; border:none; padding:5px 10px; border-radius:5px; font-weight:bold; cursor:pointer;">Davet Et</button>` : '';

        listeDiv.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.1); margin-bottom:8px;">
                <div style="display:flex; flex-direction:column; gap:4px; cursor:pointer;" onclick="profiliGoster('${o}')">
                    <div style="color:${iR}; font-weight:bold; font-size:14px;">${tac}${o}</div>
                    ${durumHtml}
                </div>
                <div style="display:flex; gap:8px;">
                    <button onclick="document.getElementById('arkadaslarEkrani').style.display='none'; document.getElementById('eskiMesajHedefIsim').innerText='${o}'; document.getElementById('eskiMesajGonderModal').style.display='flex';" style="background:#2ecc71; color:#000; border:none; padding:5px 10px; border-radius:5px; font-weight:bold; cursor:pointer;">✉️ Mesaj</button>
                    ${davetBtnHtml}
                </div>
            </div>`;
    });
};

window.davetMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler davet edemez."); return; } 
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; 
    const listeDiv = document.getElementById('arkadasListesiDiv'); 
    listeDiv.innerHTML = '<p style="color:#a3c4bc; font-size:11px; text-align:center;">Masaya davet edilecek oyuncular</p>';
    let onSay = 0;
    if(typeof onlineOyuncularListesi !== 'undefined') {
        onlineOyuncularListesi.forEach(o => {
            if(o === aktifKullaniciAdi || o.startsWith('Misafir_')) return; 
            onSay++; let koz = (typeof globalKozmetikler !== 'undefined' && globalKozmetikler[o]) || []; let iR = koz.includes('atesli_isim') ? '#ff4d4d' : '#fff'; 
            listeDiv.innerHTML += `<div class="lider-satir"><div style="color:${iR};"><span class="online-nokta"></span> ${o}</div><button class="btn-davet-et" onclick="masayaDavetEt('${o}')">Davet Et</button></div>`;
        });
    }
    if(onSay === 0) listeDiv.innerHTML += '<p style="text-align:center; color:#777; font-size:12px;">Kimse yok.</p>';
};

// 4. Profil Gösterimi (Arkadaşlık Durumuna Göre Akıllı Butonlar)
window.profiliGoster = function(hedefIsim) {
    if(!hedefIsim || hedefIsim === "" || hedefIsim === "Bekleniyor..." || hedefIsim === "➕ DAVET" || hedefIsim === "Boş") { if(suAnkiMasam && !izleyiciModu) window.davetMenusuAc(); return; }
    
    const pIsim = document.getElementById('profilIsim'); const pCip = document.getElementById('profilCip'); const pDurum = document.getElementById('profilDurumBadge'); const pArkadasBtn = document.getElementById('profilArkadasBtn'); const pDavetBtn = document.getElementById('profilDavetBtn');
    document.getElementById('profilEkrani').style.display = 'flex'; pArkadasBtn.dataset.hedef = hedefIsim; pDavetBtn.dataset.hedef = hedefIsim;
    
    let isOnline = typeof onlineOyuncularListesi !== 'undefined' && (onlineOyuncularListesi.includes(hedefIsim) || hedefIsim === aktifKullaniciAdi);
    pDurum.innerText = isOnline ? "🟢 Çevrimiçi" : "🔴 Çevrimdışı"; pDurum.style.color = isOnline ? "#2ecc71" : "#e74c3c";
    
    if (hedefIsim !== aktifKullaniciAdi) {
        pArkadasBtn.style.display = 'block';
        if (window.benimArkadaslarim.includes(hedefIsim)) {
            pArkadasBtn.innerText = "🗑 Arkadaşı Sil";
            pArkadasBtn.style.background = "#e74c3c";
        } else if (window.benimGidenIsteklerim.includes(hedefIsim)) {
            pArkadasBtn.innerText = "⏳ İsteği İptal Et";
            pArkadasBtn.style.background = "#555";
        } else if (window.benimGelenIsteklerim.includes(hedefIsim)) {
            pArkadasBtn.innerText = "✅ İsteği Kabul Et";
            pArkadasBtn.style.background = "#2ecc71";
        } else {
            pArkadasBtn.innerText = "➕ Arkadaş Ekle";
            pArkadasBtn.style.background = "linear-gradient(180deg, #f1c40f 0%, #f39c12 100%)";
        }
        pDavetBtn.style.display = (isOnline && suAnkiMasam && !izleyiciModu) ? 'block' : 'none';
    } else { 
        pArkadasBtn.style.display = 'none'; pDavetBtn.style.display = 'none'; 
    }

    if(hedefIsim.startsWith("MİSAFİR_")) { pIsim.innerText = hedefIsim; pCip.innerText = "20.000"; pArkadasBtn.style.display = 'none'; pDavetBtn.style.display = (suAnkiMasam && isOnline && !izleyiciModu) ? 'block' : 'none'; return; }
    pIsim.innerText = "Yükleniyor..."; 
    
    if(typeof db !== 'undefined') {
        db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then((q) => {
            if(!q.empty) { const data = q.docs[0].data(); pIsim.innerText = data.isim; let gCip = parseInt(String(data.cip).replace(/[^0-9]/g, '')) || 0; if(pCip) pCip.innerText = gCip.toLocaleString('tr-TR'); } 
            else { let hash = Math.abs(hedefIsim.charCodeAt(0) + (hedefIsim.charCodeAt(1) << 5)); let bCip = (hash % 14500000) + 1200000; pIsim.innerText = hedefIsim; if(pCip) pCip.innerText = bCip.toLocaleString('tr-TR'); }
        }).catch(err => { pIsim.innerText = "Hata"; });
    }
};

// 5. Arkadaşlık İşlemleri Veritabanı Yönlendirmesi
window.profilArkadasAksiyon = function() {
    const btn = document.getElementById('profilArkadasBtn'); const hedef = btn.dataset.hedef; 
    if (!hedef || isMisafir) { ozelUyariGoster("⚠️ Misafirler bu özelliği kullanamaz!"); return; }
    if (hedef === aktifKullaniciAdi) return;

    if (window.benimArkadaslarim.includes(hedef)) {
        if(confirm(`🗑 ${hedef} adlı oyuncuyu arkadaşlıktan çıkarmak istiyor musun?`)) {
            db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: firebase.firestore.FieldValue.arrayRemove(hedef) });
            db.collection("kullanicilar").where("isim", "==", hedef).get().then(snap => {
                if(!snap.empty) snap.docs[0].ref.update({ arkadaslar: firebase.firestore.FieldValue.arrayRemove(aktifKullaniciAdi) });
            });
            ozelUyariGoster(`🗑 Arkadaş silindi.`); document.getElementById('profilEkrani').style.display='none';
        }
    } else if (window.benimGidenIsteklerim.includes(hedef)) {
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gidenIstekler: firebase.firestore.FieldValue.arrayRemove(hedef) });
        db.collection("kullanicilar").where("isim", "==", hedef).get().then(snap => {
            if(!snap.empty) snap.docs[0].ref.update({ gelenIstekler: firebase.firestore.FieldValue.arrayRemove(aktifKullaniciAdi) });
        });
        ozelUyariGoster(`ℹ️ İstek iptal edildi.`); document.getElementById('profilEkrani').style.display='none';
    } else if (window.benimGelenIsteklerim.includes(hedef)) {
        window.istekKabulEt(hedef); document.getElementById('profilEkrani').style.display='none';
    } else {
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gidenIstekler: firebase.firestore.FieldValue.arrayUnion(hedef) });
        db.collection("kullanicilar").where("isim", "==", hedef).get().then(snap => {
            if(!snap.empty) snap.docs[0].ref.update({ gelenIstekler: firebase.firestore.FieldValue.arrayUnion(aktifKullaniciAdi) });
        });
        ozelUyariGoster(`✅ Arkadaşlık isteği gönderildi.`); document.getElementById('profilEkrani').style.display='none';
    }
};

window.istekKabulEt = function(istekYapan) {
    db.collection("kullanicilar").doc(auth.currentUser.uid).update({
        arkadaslar: firebase.firestore.FieldValue.arrayUnion(istekYapan),
        gelenIstekler: firebase.firestore.FieldValue.arrayRemove(istekYapan)
    });
    db.collection("kullanicilar").where("isim", "==", istekYapan).get().then(snap => {
        if(!snap.empty) snap.docs[0].ref.update({
            arkadaslar: firebase.firestore.FieldValue.arrayUnion(aktifKullaniciAdi),
            gidenIstekler: firebase.firestore.FieldValue.arrayRemove(aktifKullaniciAdi)
        });
    });
    ozelUyariGoster(`✅ ${istekYapan} ile arkadaş oldunuz!`);
    document.getElementById(`toast_istek_${istekYapan}`)?.remove();
};

window.istekReddet = function(istekYapan) {
    db.collection("kullanicilar").doc(auth.currentUser.uid).update({
        gelenIstekler: firebase.firestore.FieldValue.arrayRemove(istekYapan)
    });
    db.collection("kullanicilar").where("isim", "==", istekYapan).get().then(snap => {
        if(!snap.empty) snap.docs[0].ref.update({ gidenIstekler: firebase.firestore.FieldValue.arrayRemove(aktifKullaniciAdi) });
    });
    ozelUyariGoster(`❌ İstek reddedildi.`);
    document.getElementById(`toast_istek_${istekYapan}`)?.remove();
};

window.esyaFirlatAksiyon = function(esyaIcon) {
    if(isMisafir) { ozelUyariGoster("⚠️ Eşya fırlatılamaz!"); return; } const hedef = document.getElementById('profilArkadasBtn').dataset.hedef;
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(!hedef || !suAnkiMasam || hedef === aktifKullaniciAdi || safCip < 5000) return;
    socket.emit('esya_firlat', { masaAdi: suAnkiMasam, kimden: aktifKullaniciAdi, kime: hedef, esya: esyaIcon }); document.getElementById('profilEkrani').style.display = 'none';
};

window.profilDavetAksiyon = function() { const hedef = document.getElementById('profilDavetBtn').dataset.hedef; if (!hedef || !suAnkiMasam) return; socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: hedef, masaAdi: suAnkiMasam }); ozelUyariGoster(`💌 Davet gönderildi!`); document.getElementById('profilEkrani').style.display = 'none'; };
window.liderlikTablosunuAc = function() { document.getElementById('liderlikEkrani').style.display = 'flex'; socket.emit('liderlik_tablosu_iste'); };
window.masadanAyrilmaIslemi = function(cezaUygulansinMi = false) { if (suAnkiMasam) { socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); } suAnkiMasam = null; izleyiciModu = false; window.masayiTemizle(); try { document.querySelector('.istaka-container').style.display = 'flex'; document.querySelector('.okey-istaka-tuslar-area').style.display = 'flex'; } catch(e) {} masaEkrani.style.display = 'none'; lobiEkrani.style.display = 'flex'; window.arayuzGuncelle(); };

const lobiyeDonBtn = document.getElementById('lobiyeDonBtn'); 
if(lobiyeDonBtn) { 
    lobiyeDonBtn.addEventListener('click', () => { 
        if (suAnkiMasam && !izleyiciModu) { 
            let uyariMetni = "Çıkmak istediğine emin misin?";
            if (masaOyunBasladiMi) {
                let bahis = "20.000";
                if(suAnkiMasam.includes('50K')) bahis = "50.000";
                else if(suAnkiMasam.includes('10K')) bahis = "10.000";
                uyariMetni = `Çıkmak istediğine emin misin?<br><br><span style='color:#e74c3c; font-weight:bold; font-size:13px;'>⚠️ DİKKAT: Oyunu terk edersen ${bahis} ÇİP ceza kesilir!</span>`;
            }
            const uyariEkrani = document.getElementById('cikisUyariEkrani');
            const metinAlani = uyariEkrani.querySelector('p') || uyariEkrani.querySelector('div');
            if(metinAlani) metinAlani.innerHTML = uyariMetni;
            uyariEkrani.style.display = 'flex'; 
        } else { 
            window.masadanAyrilmaIslemi(false); 
        } 
    }); 
}

document.getElementById('btnCikisOnayla')?.addEventListener('click', () => { document.getElementById('cikisUyariEkrani').style.display = 'none'; window.masadanAyrilmaIslemi(true); });

if(typeof sohbetCekmecesi !== 'undefined' && sohbetCekmecesi) {
    document.getElementById('sohbetAcBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.add('acik'); });
    document.getElementById('sohbetKapatBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.remove('acik'); });
    document.getElementById('sohbetGonderBtn')?.addEventListener('click', () => { 
        if(isMisafir) { ozelUyariGoster("⚠️ MİSAFİR HESAPLAR SOHBETE MESAJ YAZAMAZ!"); return; } 
        const input = document.getElementById('sohbetInput'); 
        if(input.value.trim() !== '' && suAnkiMasam) { socket.emit('sohbet_mesaji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, mesaj: input.value, kozmetikler: typeof aktifKozmetikler !== 'undefined' ? aktifKozmetikler : [] }); input.value = ''; if(typeof benimGorevler !== 'undefined'){ benimGorevler.mesaj++; gorevleriKaydet(); } } 
    });
}
window.vipEmojiGonder = function(emoji) { if(isMisafir) return; if(suAnkiMasam) { socket.emit('vip_emoji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, emoji: emoji }); if(typeof sohbetCekmecesi !== 'undefined') sohbetCekmecesi.classList.remove('acik'); } };

setInterval(() => {
    const elOnline = document.getElementById('statOnlineRand');
    const elMasa = document.getElementById('statMasaRand');
    if(elOnline && elMasa) {
        let baseOnline = parseInt(elOnline.innerText.replace('.',''));
        let change = Math.floor(Math.random() * 5) - 2; 
        let newOnline = baseOnline + change;
        if(newOnline < 100) newOnline = 150;
        
        let yeniMasa = Math.floor(newOnline / 4) + Math.floor(Math.random() * 5);
        
        elOnline.innerText = newOnline;
        elMasa.innerText = yeniMasa;
    }
}, 12000);

window.addEventListener('load', () => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
            setTimeout(() => splash.remove(), 500); 
        }, 1000); 
    }
});
