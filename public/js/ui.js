// ==========================================
// BEYCO GAMES - TEMEL ARAYÜZ (UI) YÖNETİMİ
// ==========================================

// KESİLEN HAYATİ FONKSİYONLAR GERİ YÜKLENDİ
window.ozelUyariGoster = function(mesaj) {
    const modal = document.getElementById('uyariModalEkrani');
    const metin = document.getElementById('uyariModalMetni');
    if(modal && metin) { metin.innerHTML = mesaj; modal.style.display = 'flex'; }
    else { alert(mesaj); }
};

window.bildirimGoster = function(mesaj, tip) {
    const fl = document.getElementById('flashBildirim');
    if(fl) {
        fl.innerHTML = mesaj;
        fl.className = 'flash-bildirim goster';
        setTimeout(() => fl.className = 'flash-bildirim', 3500);
    } else { alert(mesaj); }
};

window.getLigRozeti = function(oynanan, misafirMi) {
    if(misafirMi) return { metin: "MİSAFİR", renk: "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)", yaziRenk: "#fff" };
    if(oynanan > 1000) return { metin: "💎 ELMAS LİG", renk: "linear-gradient(180deg, #3498db 0%, #2980b9 100%)", yaziRenk: "#fff" };
    if(oynanan > 500) return { metin: "🥇 ALTIN LİG", renk: "linear-gradient(180deg, #f1c40f 0%, #f39c12 100%)", yaziRenk: "#111" };
    if(oynanan > 100) return { metin: "🥈 GÜMÜŞ LİG", renk: "linear-gradient(180deg, #bdc3c7 0%, #95a5a6 100%)", yaziRenk: "#111" };
    return { metin: "🥉 BRONZ LİG", renk: "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)", yaziRenk: "#fff" };
};

// ORİJİNAL KODLARIN BURADAN İTİBAREN BAŞLIYOR (Güvenlik Eklenmiş Halde)
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
    const avatar = document.getElementById('vipAvatar'); 
    const isimKutu = document.getElementById('benimAdimKutusu'); 
    const rozetim = document.getElementById('benimVipRozetim');
    
    if(avatar) { avatar.style.border = '2px solid #52796f'; avatar.style.boxShadow = 'none'; }
    if(isimKutu) { isimKutu.style.color = '#fff'; isimKutu.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)'; }

    let oynananOyun = (typeof benimKazanilanOyun !== 'undefined') ? benimKazanilanOyun : 0;
    let misafirDurumu = (typeof isMisafir !== 'undefined') ? isMisafir : false;

    let ligAyar = window.getLigRozeti(oynananOyun, misafirDurumu);
    if(rozetim) { rozetim.innerText = ligAyar.metin; rozetim.style.background = ligAyar.renk; rozetim.style.color = ligAyar.yaziRenk; }

    let kozmetikler = (typeof aktifKozmetikler !== 'undefined' && aktifKozmetikler) ? aktifKozmetikler : [];
    let kullanici = (typeof aktifKullaniciAdi !== 'undefined') ? aktifKullaniciAdi : "";
    let izleyici = (typeof izleyiciModu !== 'undefined') ? izleyiciModu : false;

    let tacEki = ""; if(kozmetikler.includes('neon_tac')) { tacEki = "👑 "; }
    if(kullanici && !izleyici) { if(isimKutu) isimKutu.innerHTML = tacEki + kullanici + ' <span style="color:#2ecc71;">✔</span>'; }
    if(kozmetikler.includes('altin_cerceve') && avatar) { avatar.style.border = '3px solid #f2c94c'; avatar.style.boxShadow = '0 0 15px #f2c94c'; }
    if(kozmetikler.includes('atesli_isim') && isimKutu && !izleyici) { isimKutu.style.color = '#ff4d4d'; }

    let envanter = (typeof benimEnvanterim !== 'undefined' && benimEnvanterim) ? benimEnvanterim : [];
    const esyalar = [ {id: 'altin_cerceve', fiyat: '500.000'}, {id: 'neon_tac', fiyat: '1.5M'}, {id: 'atesli_isim', fiyat: '3M'}, {id: 'tema_royal', fiyat: '10 Milyon'}, {id: 'tema_neon', fiyat: '20 Milyon'}, {id: 'tema_kizil', fiyat: '30 Milyon'} ];
    
    esyalar.forEach(esya => {
        const btn = document.getElementById('btn_' + esya.id);
        if(btn) {
            if(kozmetikler.includes(esya.id)) { btn.innerText = 'ÇIKAR'; btn.style.background = '#e74c3c'; btn.style.color = '#fff'; }
            else if(envanter.includes(esya.id)) { btn.innerText = 'KULLAN'; btn.style.background = '#2ecc71'; btn.style.color = '#fff'; }
            else { btn.innerText = esya.fiyat + ' ÇİP'; btn.style.background = ''; btn.style.color = ''; }
        }
    });
};

window.vipMasaKurAksiyon = function() {
    let misafirCheck = (typeof isMisafir !== 'undefined') ? isMisafir : false;
    if(misafirCheck) { window.ozelUyariGoster("⚠️ Misafir hesaplar VIP Masa kuramaz!"); return; }
    
    let bahisDeger = parseInt(document.getElementById('vipMasaBahis').value);
    let gizliDeger = document.getElementById('vipMasaGizlilik').value === "true";
    let anlikCip = (typeof benimAnlikCipim !== 'undefined') ? benimAnlikCipim : 0;
    let safCip = parseInt(String(anlikCip).replace(/[^0-9]/g, '')) || 0;
    
    if(safCip < bahisDeger) { window.ozelUyariGoster("⚠️ Yetersiz çip!"); return; }
    document.getElementById('vipMasaKurPanel').style.display = 'none';
    if(typeof socket !== 'undefined') socket.emit('vip_masa_kur', { sahibi: aktifKullaniciAdi, bahis: bahisDeger, gizli: gizliDeger });
};

window.vipGizlilikDurumuDegistir = function() {
    if(typeof suAnkiMasam !== 'undefined' && suAnkiMasam && typeof suAnkiMasaVIPMi !== 'undefined' && suAnkiMasaVIPMi && typeof suAnkiMasaSahibi !== 'undefined' && suAnkiMasaSahibi === aktifKullaniciAdi) {
        if(typeof socket !== 'undefined') socket.emit('vip_masa_gizlilik_degis', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
    }
};

window.liderlikTablosunuAc = function() {
    document.getElementById('liderlikEkrani').style.display = 'flex';
    if(typeof socket !== 'undefined') socket.emit('liderlik_tablosu_iste');
};

window.masadanAyrilmaIslemi = function(cezaUygulansinMi = false) {
    if (typeof suAnkiMasam !== 'undefined' && suAnkiMasam) {
        if(typeof socket !== 'undefined') socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam });
    }
    if(typeof suAnkiMasam !== 'undefined') suAnkiMasam = null;
    if(typeof izleyiciModu !== 'undefined') izleyiciModu = false;

    if(typeof window.masayiTemizle === 'function') window.masayiTemizle();

    try {
        let istakaC = document.querySelector('.istaka-container'); if(istakaC) istakaC.style.display = 'flex';
        let okeyTuslar = document.querySelector('.okey-istaka-tuslar-area'); if(okeyTuslar) okeyTuslar.style.display = 'flex';
    } catch(e) {}

    let masaEkran = document.getElementById('masaEkrani'); if(masaEkran) masaEkran.style.display = 'none';
    let lobiEkran = document.getElementById('lobiEkrani'); if(lobiEkran) lobiEkran.style.display = 'flex';

    window.arayuzGuncelle();
};

const lobiyeDonBtn = document.getElementById('lobiyeDonBtn');
if(lobiyeDonBtn) {
    lobiyeDonBtn.addEventListener('click', () => {
        let izleyici = (typeof izleyiciModu !== 'undefined') ? izleyiciModu : false;
        if (typeof suAnkiMasam !== 'undefined' && suAnkiMasam && !izleyici) {
            let uyariMetni = "Çıkmak istediğine emin misin?";
            if (typeof masaOyunBasladiMi !== 'undefined' && masaOyunBasladiMi) {
                let bahis = "20.000";
                if(suAnkiMasam.includes('50K')) bahis = "50.000";
                else if(suAnkiMasam.includes('10K')) bahis = "10.000";
                uyariMetni = `Çıkmak istediğine emin misin?<br><br><span style='color:#e74c3c; font-weight:bold; font-size:13px;'>⚠️ DİKKAT: Oyunu terk edersen ${bahis} ÇİP ceza kesilir!</span>`;
            }
            const uyariEkrani = document.getElementById('cikisUyariEkrani');
            if(uyariEkrani) {
                const metinAlani = uyariEkrani.querySelector('p') || uyariEkrani.querySelector('div');
                if(metinAlani) metinAlani.innerHTML = uyariMetni;
                uyariEkrani.style.display = 'flex';
            }
        } else {
            window.masadanAyrilmaIslemi(false);
        }
    });
}

const btnCikis = document.getElementById('btnCikisOnayla');
if(btnCikis) {
    btnCikis.addEventListener('click', () => {
        document.getElementById('cikisUyariEkrani').style.display = 'none';
        window.masadanAyrilmaIslemi(true);
    });
}

const sohbetCekmecesiDOM = document.getElementById('sohbetCekmecesi');
if(sohbetCekmecesiDOM) {
    document.getElementById('sohbetAcBtn')?.addEventListener('click', () => { sohbetCekmecesiDOM.classList.add('acik'); });
    document.getElementById('sohbetKapatBtn')?.addEventListener('click', () => { sohbetCekmecesiDOM.classList.remove('acik'); });
    document.getElementById('sohbetGonderBtn')?.addEventListener('click', () => {
        let misafirCheck = (typeof isMisafir !== 'undefined') ? isMisafir : false;
        if(misafirCheck) { window.ozelUyariGoster("⚠️ MİSAFİR HESAPLAR SOHBETE MESAJ YAZAMAZ!"); return; }
        
        const input = document.getElementById('sohbetInput');
        if(input && input.value.trim() !== '' && typeof suAnkiMasam !== 'undefined' && suAnkiMasam) {
            let kozmetikler = (typeof aktifKozmetikler !== 'undefined') ? aktifKozmetikler : [];
            if(typeof socket !== 'undefined') socket.emit('sohbet_mesaji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, mesaj: input.value, kozmetikler: kozmetikler });
            input.value = '';
            if(typeof benimGorevler !== 'undefined') benimGorevler.mesaj++;
            if(typeof window.gorevleriKaydet === 'function') window.gorevleriKaydet();
        }
    });
}

window.vipEmojiGonder = function(emoji) {
    let misafirCheck = (typeof isMisafir !== 'undefined') ? isMisafir : false;
    if(misafirCheck) return;
    if(typeof suAnkiMasam !== 'undefined' && suAnkiMasam) {
        if(typeof socket !== 'undefined') socket.emit('vip_emoji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, emoji: emoji });
        let sC = document.getElementById('sohbetCekmecesi');
        if(sC) sC.classList.remove('acik');
    }
};

setInterval(() => {
    const elOnline = document.getElementById('statOnlineRand');
    const elMasa = document.getElementById('statMasaRand');
    if(elOnline && elMasa) {
        let baseOnline = parseInt(elOnline.innerText.replace('.',''));
        if(isNaN(baseOnline)) baseOnline = 247;
        let change = Math.floor(Math.random() * 5) - 2;
        let newOnline = baseOnline + change;
        if(newOnline < 100) newOnline = 150;
        
        let yeniMasa = Math.floor(newOnline / 4) + Math.floor(Math.random() * 5);
        elOnline.innerText = newOnline;
        elMasa.innerText = yeniMasa;
    }
}, 12000);
