// public/ui.js

// 🔥 HAYALET BİLDİRİM TEMİZLEYİCİ 🔥
setInterval(() => {
    document.querySelectorAll('.bildirim-badge, .mesaj-badge').forEach(badge => {
        if(badge.innerText === '0' || badge.innerText === '') badge.style.display = 'none';
    });
}, 2000);

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
    const esyalar = [ {id: 'altin_cerceve', fiyat: '500.000'}, {id: 'neon_tac', fiyat: '1.5M'}, {id: 'atesli_isim', fiyat: '3M'} ];
    esyalar.forEach(esya => { 
        const btn = document.getElementById('btn_' + esya.id); 
        if(btn) { 
            if(aktifKozmetikler.includes(esya.id)) { btn.innerText = 'ÇIKAR'; btn.style.background = '#e74c3c'; btn.style.color = '#fff'; } 
            else if(benimEnvanterim.includes(esya.id)) { btn.innerText = 'KULLAN'; btn.style.background = '#2ecc71'; btn.style.color = '#fff'; } 
            else { btn.innerText = esya.fiyat + ' ÇİP'; btn.style.background = ''; btn.style.color = ''; } 
        } 
    });
};

window.vipMasaKurAksiyon = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar VIP Masa kuramaz!"); return; }
    let bahisDeger = parseInt(document.getElementById('vipMasaBahis').value); 
    let gizliDeger = document.getElementById('vipMasaGizlilik').value === "true";
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(safCip < bahisDeger) { ozelUyariGoster("⚠️ Bu masayı kurmak için yeterli çipiniz yok patron!"); return; }
    document.getElementById('vipMasaKurPanel').style.display = 'none'; 
    socket.emit('vip_masa_kur', { sahibi: aktifKullaniciAdi, bahis: bahisDeger, gizli: gizliDeger });
};

window.vipGizlilikDurumuDegistir = function() { 
    if(suAnkiMasam && suAnkiMasaVIPMi && suAnkiMasaSahibi === aktifKullaniciAdi) { 
        socket.emit('vip_masa_gizlilik_degis', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); 
    } 
};

function gorevleriKaydet() {
    if(auth.currentUser && !isMisafir) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gorevler: benimGorevler }).catch(e=>console.log(e)); }
}

window.gorevleriAc = function() { 
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar görev yapamaz!"); return; } 
    document.getElementById('gorevlerEkrani').style.display = 'flex'; window.renderGorevler(); 
};

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
    if(benimGorevler.alinanlar[id]) return; 
    benimGorevler.alinanlar[id] = true; gorevleriKaydet(); 
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0; benimAnlikCipim = safCip + m; 
    document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); 
    if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim }); 
    socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); 
    ozelUyariGoster(`🎉 Görev bitti! Çipler eklendi.`); window.renderGorevler(); 
};

window.arkadaslarMenusuAc = function() { window.davetMenusuAc(); };

window.davetMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler davet edemez."); return; } 
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; 
    const listeDiv = document.getElementById('arkadasListesiDiv'); 
    listeDiv.innerHTML = '<p style="color:#a3c4bc; font-size:11px; text-align:center;">Aktif oyuncu seçin</p>';
    let onSay = 0;
    onlineOyuncularListesi.forEach(o => {
        if(o === aktifKullaniciAdi || (window.isBotIsmi && window.isBotIsmi(o)) || o.startsWith('Misafir_')) return; onSay++;
        let koz = globalKozmetikler[o] || []; let iR = koz.includes('atesli_isim') ? '#ff4d4d' : '#fff'; let t = koz.includes('neon_tac') ? '👑 ' : '';
        listeDiv.innerHTML += `<div class="lider-satir"><div style="color:${iR};"><span class="online-nokta"></span> ${t}${o}</div><button class="btn-davet-et" onclick="masayaDavetEt('${o}')">Davet Et</button></div>`;
    });
    if(onSay === 0) listeDiv.innerHTML += '<p style="text-align:center; color:#777; font-size:12px;">Aktif oyuncu yok.</p>';
};

window.profiliGoster = function(hedefIsim) {
    if(!hedefIsim || hedefIsim === "" || hedefIsim === "Bekleniyor..." || hedefIsim === "➕ DAVET") { if(suAnkiMasam && !izleyiciModu) window.davetMenusuAc(); return; }
    const pIsim = document.getElementById('profilIsim'); const pCip = document.getElementById('profilCip'); const pDurum = document.getElementById('profilDurumBadge'); const pArkadasBtn = document.getElementById('profilArkadasBtn'); const pDavetBtn = document.getElementById('profilDavetBtn');
    document.getElementById('profilEkrani').style.display = 'flex'; pArkadasBtn.dataset.hedef = hedefIsim; pDavetBtn.dataset.hedef = hedefIsim;
    let isOnline = onlineOyuncularListesi.includes(hedefIsim) || hedefIsim === aktifKullaniciAdi;
    pDurum.innerText = isOnline ? "🟢 Çevrimiçi" : "🔴 Çevrimdışı"; pDurum.style.color = isOnline ? "#2ecc71" : "#e74c3c";
    
    if (hedefIsim !== aktifKullaniciAdi) {
        pArkadasBtn.style.display = 'block';
        if (benimArkadaslarim.includes(hedefIsim)) { pArkadasBtn.innerText = "❌ Arkadaştan Çıkar"; pArkadasBtn.style.background = "#e74c3c"; } else { pArkadasBtn.innerText = "➕ Arkadaş Ekle"; pArkadasBtn.style.background = ""; }
        if (isOnline) { pDavetBtn.style.display = 'block'; } else { pDavetBtn.style.display = 'none'; }
    } else { pArkadasBtn.style.display = 'none'; pDavetBtn.style.display = 'none'; }

    if(hedefIsim.startsWith("MİSAFİR_")) { pIsim.innerText = hedefIsim; pCip.innerText = "20.000"; pArkadasBtn.style.display = 'none'; pDavetBtn.style.display = (suAnkiMasam && isOnline && !izleyiciModu) ? 'block' : 'none'; return; }
    pIsim.innerText = "Yükleniyor..."; 
    
    db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then((q) => {
        if(!q.empty) {
            const data = q.docs[0].data(); pIsim.innerText = data.isim; 
            let gCip = parseInt(String(data.cip).replace(/[^0-9]/g, '')) || 0; if(pCip) pCip.innerText = gCip.toLocaleString('tr-TR');
        } else {
            let hash = Math.abs(hedefIsim.charCodeAt(0) + (hedefIsim.charCodeAt(1) << 5)); let bCip = (hash % 14500000) + 1200000;
            pIsim.innerText = hedefIsim; if(pCip) pCip.innerText = bCip.toLocaleString('tr-TR');
        }
    }).catch(err => { pIsim.innerText = "Hata"; });
};

window.profilArkadasAksiyon = function() {
    const btn = document.getElementById('profilArkadasBtn'); const hedef = btn.dataset.hedef; if (!hedef || isMisafir) return;
    if (benimArkadaslarim.includes(hedef)) { 
        if(confirm(`${hedef} adlı kişiyi silmek istediğine emin misin?`)) { benimArkadaslarim = benimArkadaslarim.filter(n=>n!==hedef); ozelUyariGoster(`❌ Silindi.`); if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }); document.getElementById('profilEkrani').style.display='none'; }
    } else { window.arkadasEkle(hedef); document.getElementById('profilEkrani').style.display='none'; } 
};

window.esyaFirlatAksiyon = function(esyaIcon) {
    if(isMisafir) { ozelUyariGoster("⚠️ Eşya fırlatılamaz!"); return; } const hedef = document.getElementById('profilArkadasBtn').dataset.hedef;
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(!hedef || !suAnkiMasam || hedef === aktifKullaniciAdi || safCip < 5000) return;
    socket.emit('esya_firlat', { masaAdi: suAnkiMasam, kimden: aktifKullaniciAdi, kime: hedef, esya: esyaIcon }); document.getElementById('profilEkrani').style.display = 'none';
};

window.profilDavetAksiyon = function() { 
    const hedef = document.getElementById('profilDavetBtn').dataset.hedef; 
    if (!hedef || !suAnkiMasam) return; 
    socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: hedef, masaAdi: suAnkiMasam }); 
    ozelUyariGoster(`💌 Davet gönderildi!`); 
    document.getElementById('profilEkrani').style.display = 'none'; 
};

window.liderlikTablosunuAc = function() { document.getElementById('liderlikEkrani').style.display = 'flex'; socket.emit('liderlik_tablosu_iste'); };

window.masadanAyrilmaIslemi = function(cezaUygulansinMi = false) {
    if (suAnkiMasam) { socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); }
    suAnkiMasam = null; izleyiciModu = false; window.masayiTemizle();
    try { document.querySelector('.istaka-container').style.display = 'flex'; document.querySelector('.okey-istaka-tuslar-area').style.display = 'flex'; } catch(e) {}
    masaEkrani.style.display = 'none'; lobiEkrani.style.display = 'flex'; window.arayuzGuncelle();
};

const lobiyeDonBtn = document.getElementById('lobiyeDonBtn'); 
if(lobiyeDonBtn) {
    lobiyeDonBtn.addEventListener('click', () => { 
        if (suAnkiMasam && !izleyiciModu) { document.getElementById('cikisUyariEkrani').style.display = 'flex'; } 
        else { window.masadanAyrilmaIslemi(false); } 
    });
}

document.getElementById('btnCikisOnayla')?.addEventListener('click', () => { document.getElementById('cikisUyariEkrani').style.display = 'none'; window.masadanAyrilmaIslemi(true); });

if(sohbetCekmecesi) {
    document.getElementById('sohbetAcBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.add('acik'); });
    document.getElementById('sohbetKapatBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.remove('acik'); });
    document.getElementById('sohbetGonderBtn')?.addEventListener('click', () => { 
        if(isMisafir) { ozelUyariGoster("⚠️ MİSAFİR HESAPLAR SOHBETE MESAJ YAZAMAZ!"); return; } 
        const input = document.getElementById('sohbetInput'); 
        if(input.value.trim() !== '' && suAnkiMasam) { 
            socket.emit('sohbet_mesaji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, mesaj: input.value, kozmetikler: aktifKozmetikler }); 
            input.value = ''; benimGorevler.mesaj++; gorevleriKaydet(); 
        } 
    });
}
window.vipEmojiGonder = function(emoji) { if(isMisafir) return; if(suAnkiMasam) { socket.emit('vip_emoji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, emoji: emoji }); sohbetCekmecesi.classList.remove('acik'); } };
