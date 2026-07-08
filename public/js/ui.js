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

    const esyalar = [ {id: 'altin_cerceve', fiyat: '500.000'}, {id: 'neon_tac', fiyat: '1.5M'}, {id: 'atesli_isim', fiyat: '3M'}, {id: 'tema_royal', fiyat: '10 Milyon'}, {id: 'tema_neon', fiyat: '20 Milyon'}, {id: 'tema_kizil', fiyat: '30 Milyon'} ];
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
    let bahisDeger = parseInt(document.getElementById('vipMasaBahis').value); let gizliDeger = document.getElementById('vipMasaGizlilik').value === "true";
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(safCip < bahisDeger) { ozelUyariGoster("⚠️ Yetersiz çip!"); return; }
    vipMasaKurPanel.style.display = 'none'; socket.emit('vip_masa_kur', { sahibi: aktifKullaniciAdi, bahis: bahisDeger, gizli: gizliDeger });
};

window.vipGizlilikDurumuDegistir = function() { if(suAnkiMasam && suAnkiMasaVIPMi && suAnkiMasaSahibi === aktifKullaniciAdi) { socket.emit('vip_masa_gizlilik_degis', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); } };
window.liderlikTablosunuAc = function() { liderlikEkrani.style.display = 'flex'; socket.emit('liderlik_tablosu_iste'); };

window.masadanAyrilmaIslemi = function(cezaUygulansinMi = false) {
    if (suAnkiMasam) { socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); }
    suAnkiMasam = null; izleyiciModu = false;
    if(typeof window.masayiTemizle === 'function') window.masayiTemizle();
    try { document.querySelector('.istaka-container').style.display = 'flex'; document.querySelector('.okey-istaka-tuslar-area').style.display = 'flex'; } catch(e) {}
    masaEkrani.style.display = 'none';
    lobiEkrani.style.display = 'flex';
    window.arayuzGuncelle();
};

lobiyeDonBtn?.addEventListener('click', () => {
    if (suAnkiMasam && !izleyiciModu) {
        let uyariMetni = "Çıkmak istediğine emin misin?";
        if (masaOyunBasladiMi) {
            let bahis = "20.000"; if(suAnkiMasam.includes('50K')) bahis = "50.000"; else if(suAnkiMasam.includes('10K')) bahis = "10.000";
            uyariMetni = `Çıkmak istediğine emin misin?<br><br><span style='color:#e74c3c; font-weight:bold; font-size:13px;'>⚠️ DİKKAT: Oyunu terk edersen ${bahis} ÇİP ceza kesilir!</span>`;
        }
        const uyariEkrani = document.getElementById('cikisUyariEkrani');
        const metinAlani = uyariEkrani.querySelector('p') || uyariEkrani.querySelector('div');
        if(metinAlani) metinAlani.innerHTML = uyariMetni;
        uyariEkrani.style.display = 'flex';
    } else { window.masadanAyrilmaIslemi(false); }
});

document.getElementById('btnCikisOnayla')?.addEventListener('click', () => { cikisUyariEkrani.style.display = 'none'; window.masadanAyrilmaIslemi(true); });

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
