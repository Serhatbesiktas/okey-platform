const socket = io();
let aktifKullaniciAdi = ""; 
let suAnkiMasam = null; 
let benimSiramMi = false;
let guncelMasalar = {}; 
let gostergeHakki = false; 
let izleyiciModu = false; 

let benimAnlikCipim = 0; 
let benimKazanilanOyun = 0; 
let benimEnvanterim = []; 
let aktifKozmetikler = []; 
let sonBonusTarihim = ""; 
let isMisafir = false; 
let globalKozmetikler = {}; 

let benimArkadaslarim = []; 
let onlineOyuncularListesi = []; 
let masaOyunBasladiMi = false; 
let cikisIcinBekleyenLogout = false; 

let suAnkiMasaVIPMi = false;
let suAnkiMasaSahibi = "";
let suAnkiMasaGizliMi = false;

let benimGorevler = { kazanma: 0, mesaj: 0, gosterge: 0, tarih: "", alinanlar: {} };

window.ozelUyariGoster = function(mesaj) {
    const uyariMetin = document.getElementById('uyariModalMetni');
    const uyariEkran = document.getElementById('uyariModalEkrani');
    if(uyariMetin && uyariEkran) {
        uyariMetin.innerText = mesaj;
        uyariEkran.style.display = 'flex';
    } else { alert(mesaj); }
};

function markaVeReklamKurulumu() {
    setInterval(() => {
        document.querySelectorAll('*').forEach(el => {
            if(el.childNodes.length === 1 && el.textContent.includes('Sistem: VIP Oyuna Hoş Geldiniz!')) {
                el.innerHTML = '🟢 Sistem: Seri Okey Salonlarına Hoş Geldiniz - <b style="color:#f2c94c; margin-left:5px;">BEYCO GAMES</b>';
            }
        });
    }, 1000);
}
window.addEventListener('DOMContentLoaded', markaVeReklamKurulumu);
setTimeout(markaVeReklamKurulumu, 1000);

socket.on('canli_arkadaslik_talebi', (data) => {
    if (data.kime === aktifKullaniciAdi) {
        const reqDiv = document.createElement('div');
        reqDiv.id = "canliIstekKutusu";
        reqDiv.style = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #112618, #06120b); border:2px solid #f2c94c; padding:15px 25px; border-radius:12px; z-index:999999; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.8); width: 90%; max-width: 350px;";
        reqDiv.innerHTML = `
            <div style='color:#fff; font-weight:bold; margin-bottom:15px; font-size:14px;'>👥 <span style="color:#f2c94c">${data.kimden}</span> sana arkadaşlık isteği gönderdi!</div>
            <div style='display:flex; gap:10px; justify-content:center;'>
                <button style='background:#2ecc71; border:none; padding:8px 20px; border-radius:6px; color:#111; font-weight:bold; cursor:pointer; flex:1;' id='btnAcceptReq'>Kabul Et</button>
                <button style='background:#e74c3c; border:none; padding:8px 20px; border-radius:6px; color:#fff; font-weight:bold; cursor:pointer; flex:1;' id='btnRejectReq'>Reddet</button>
            </div>`;
        document.body.appendChild(reqDiv);

        reqDiv.querySelector('#btnAcceptReq').onclick = () => {
            if(!benimArkadaslarim.includes(data.kimden)) { benimArkadaslarim.push(data.kimden); if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }); }
            socket.emit('arkadaslik_cevabi_ver', { kimden: aktifKullaniciAdi, kime: data.kimden, durum: 'kabul' });
            reqDiv.remove(); ozelUyariGoster(`🎉 ${data.kimden} ile artık arkadaşsınız!`); arayuzGuncelle();
        };
        reqDiv.querySelector('#btnRejectReq').onclick = () => { reqDiv.remove(); };
    }
});

socket.on('canli_arkadaslik_onay', (data) => {
    if(!benimArkadaslarim.includes(data.kimden)) {
        benimArkadaslarim.push(data.kimden);
        if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim });
        ozelUyariGoster(`🎉 ${data.kimden} isteğini kabul etti!`); arayuzGuncelle();
    }
});

socket.on('canli_arkadaslik_sonuc', (data) => {
    if(data.kime === aktifKullaniciAdi && data.durum === 'kabul') {
        if(!benimArkadaslarim.includes(data.kimden)) {
            benimArkadaslarim.push(data.kimden);
            if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim });
            ozelUyariGoster(`🎉 ${data.kimden} isteğini kabul etti!`); arayuzGuncelle();
        }
    }
});

window.arkadasEkle = function(isim) {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler arkadaş ekleyemez."); return; }
    socket.emit('arkadaslik_istegi_gonder', { kimden: aktifKullaniciAdi, kime: isim });
    ozelUyariGoster(`⏳ ${isim} adlı oyuncuya arkadaşlık isteği gönderildi!`);
};

let reklamIzlendi = false; let reklamSayiciInt = null;
window.reklamIzleAksiyon = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar reklam izleyemez."); return; }
    document.getElementById('reklamEkrani').style.display = 'flex'; document.getElementById('btnReklamKapat').style.display = 'none';
    let saniye = 15; document.getElementById('reklamSayac').innerText = saniye;
    clearInterval(reklamSayiciInt);
    reklamSayiciInt = setInterval(() => {
        saniye--; document.getElementById('reklamSayac').innerText = saniye;
        if(saniye <= 0) { clearInterval(reklamSayiciInt); document.getElementById('btnReklamKapat').style.display = 'block'; reklamIzlendi = true; }
    }, 1000);
};

window.reklamOduluAl = function() {
    if(reklamIzlendi) {
        document.getElementById('reklamEkrani').style.display = 'none'; 
        let guncelCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
        benimAnlikCipim = guncelCip + 25000;
        document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
        if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim });
        socket.emit('magaza_harcamasi', { isim: aktifKullaniciAdi, yeniCip: benimAnlikCipim });
        ozelUyariGoster("📺 25.000 ÇİP hesabına yatırıldı!"); reklamIzlendi = false;
    }
};

const sesTasCek = new Audio('sounds/tas_cek.mp3'); const sesTasKoy = new Audio('sounds/tas_koy.mp3'); const sesSiraSende = new Audio('sounds/sira_sende.mp3');
function sesCal(sesObje) { if(window.oyunSesleriAktif === false) return; try { let yeniSes = sesObje.cloneNode(); yeniSes.volume = 0.5; yeniSes.play().catch(e => console.log(e)); } catch(err) {} }

const authEkrani = document.getElementById('authEkrani'); const lobiEkrani = document.getElementById('lobiEkrani'); const masaEkrani = document.getElementById('masaEkrani'); const vipHeader = document.querySelector('.vip-header'); const oyunuBaslatBtn = document.getElementById('oyunuBaslatBtn'); const oyunAlanObjeleri = document.getElementById('oyunAlanObjeleri'); const kalanTasBilgi = document.getElementById('kalanTasBilgi'); const bitisAlani = document.getElementById('bitisAlani'); const ustRaf = document.getElementById('ustRaf'); const altRaf = document.getElementById('altRaf'); const masaOrtasiYazi = document.getElementById('masaOrtasiYazi'); const masaKasaBilgisi = document.getElementById('masaKasaBilgisi'); const masalarAlani = document.getElementById('masalarAlani'); const sohbetCekmecesi = document.getElementById('sohbetCekmecesi'); const btnVipGizlilikTetikle = document.getElementById('btnVipGizlilikTetikle');

let gostergeBtn = document.createElement('button'); gostergeBtn.id = 'gostergeBtn'; gostergeBtn.innerText = '⭐ GÖSTERGE YAP'; gostergeBtn.className = 'gosterge-btn';
gostergeBtn.onclick = () => { socket.emit('gosterge_goster', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); gostergeBtn.style.display = 'none'; };
if(oyunAlanObjeleri && oyunAlanObjeleri.firstElementChild) { oyunAlanObjeleri.firstElementChild.appendChild(gostergeBtn); }

function getLigRozeti(kazanilanOyunSayisi, misafirMi = false) {
    if (misafirMi) return { metin: "DENEME HESABI", renk: "#7f8c8d", yaziRenk: "#fff" };
    if (kazanilanOyunSayisi < 10) return { metin: "🥉 BRONZ LİG", renk: "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)", yaziRenk: "#fff" };
    if (kazanilanOyunSayisi < 50) return { metin: "🥈 GÜMÜŞ LİG", renk: "linear-gradient(180deg, #e0e0e0 0%, #9e9e9e 100%)", yaziRenk: "#000" };
    if (kazanilanOyunSayisi < 100) return { metin: "🥇 ALTIN LİG", renk: "linear-gradient(180deg, #f2d94c 0%, #d4af37 100%)", yaziRenk: "#000" };
    return { metin: "💎 ELMAS LİG", renk: "linear-gradient(180deg, #00d2ff 0%, #3a7bd5 100%)", yaziRenk: "#fff" };
}

const firebaseConfig = { apiKey: "AIzaSyDZ2VhlFEtpT4kpvJn0TbCwbot8QB3MJGg", authDomain: "okeyoyunu-41321.firebaseapp.com", projectId: "okeyoyunu-41321", storageBucket: "okeyoyunu-41321.firebasestorage.app", messagingSenderId: "472848132493", appId: "1:472848132493:web:d104317f6398b5a3adf5c4" };
firebase.initializeApp(firebaseConfig); const auth = firebase.auth(); const db = firebase.firestore();

auth.onAuthStateChanged((user) => {
    if (user && !aktifKullaniciAdi) {
        let kayitliNick = user.email ? user.email.split('@')[0].toUpperCase() : "OYUNCU_" + Math.floor(Math.random()*1000); 
        let bugun = new Date().toLocaleDateString('tr-TR');
        db.collection("kullanicilar").doc(user.uid).get().then(doc => {
            if(doc.exists && doc.data().isim) {
                kayitliNick = doc.data().isim;
                benimAnlikCipim = parseInt(String(doc.data().cip).replace(/[^0-9]/g, '')) || 250000;
                benimEnvanterim = doc.data().envanter || []; aktifKozmetikler = doc.data().aktifKozmetikler || [];
                sonBonusTarihim = doc.data().sonBonusTarihi || ""; benimArkadaslarim = doc.data().arkadaslar || []; benimKazanilanOyun = doc.data().kazanilanOyun || 0; 
                benimGorevler = doc.data().gorevler || { kazanma: 0, mesaj: 0, gosterge: 0, tarih: bugun, alinanlar: {} };
                if(benimGorevler.tarih !== bugun) { benimGorevler = { kazanma: 0, mesaj: 0, gosterge: 0, tarih: bugun, alinanlar: {} }; }
            } else {
                benimAnlikCipim = 250000; benimKazanilanOyun = 0; benimGorevler = { kazanma: 0, mesaj: 0, gosterge: 0, tarih: bugun, alinanlar: {} };
                db.collection("kullanicilar").doc(user.uid).set({ isim: kayitliNick, cip: 250000, envanter: [], aktifKozmetikler: [], sonBonusTarihi: "", arkadaslar: [], oynananOyun: 0, kazanilanOyun: 0, gorevler: benimGorevler });
            }
            basariylaOyunaGec(kayitliNick);
        }).catch(err => { console.log("Firebase Yüklenemedi:", err); basariylaOyunaGec(kayitliNick); });
    }
});

function basariylaOyunaGec(nick) {
    isMisafir = false; document.getElementById('misafirUyariBanner').style.display = 'none';
    const btn = document.getElementById('btnGiris'); if(btn) { btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1"; }
    oyunaGirisYap(nick); arayuzGuncelle(); gunlukBonusKontrol();
}

document.getElementById('btnGiris').addEventListener('click', () => {
    const btn = document.getElementById('btnGiris'); const email = document.getElementById('authEmail').value.trim(); const pass = document.getElementById('authSifre').value;
    if(!email || !pass) { ozelUyariGoster("Lütfen e-posta ve şifrenizi girin!"); return; }
    btn.disabled = true; btn.innerText = "GİRİŞ YAPILIYOR... ⏳"; btn.style.opacity = "0.7";
    auth.signInWithEmailAndPassword(email, pass).catch(error => { ozelUyariGoster("Giriş Başarısız. E-posta veya şifre yanlış."); btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1"; });
});

document.getElementById('btnGecisKayit').addEventListener('click', () => { document.getElementById('authBaslik').innerText = "YENİ HESAP OLUŞTUR"; document.getElementById('authKullaniciAdi').style.display = 'block'; document.getElementById('loginButonlari').style.display = 'none'; document.getElementById('kayitButonlari').style.display = 'block'; document.getElementById('authEmail').value = ''; document.getElementById('authSifre').value = ''; });
document.getElementById('btnGecisGiris').addEventListener('click', () => { document.getElementById('authBaslik').innerText = "SERİ OKEY"; document.getElementById('authKullaniciAdi').style.display = 'none'; document.getElementById('loginButonlari').style.display = 'block'; document.getElementById('kayitButonlari').style.display = 'none'; });

document.getElementById('btnMisafir').addEventListener('click', () => { isMisafir = true; const misafirIsim = "MİSAFİR_" + Math.floor(Math.random() * 9000 + 1000); benimAnlikCipim = 20000; benimKazanilanOyun = 0; benimEnvanterim = []; aktifKozmetikler = []; benimArkadaslarim = []; sonBonusTarihim = new Date().toLocaleDateString('tr-TR'); document.getElementById('misafirUyariBanner').style.display = 'block'; oyunaGirisYap(misafirIsim); arayuzGuncelle(); });

document.getElementById('btnKayitTamamla').addEventListener('click', () => {
    const btn = document.getElementById('btnKayitTamamla'); const nick = document.getElementById('authKullaniciAdi').value.trim().toUpperCase(); const email = document.getElementById('authEmail').value.trim(); const pass = document.getElementById('authSifre').value;
    if(!nick || nick.length < 3) { ozelUyariGoster("Nick en az 3 harf olmalı!"); return; } if(nick.startsWith("MİSAFİR") || nick.startsWith("USTA_") || nick.startsWith("BOT_")) { ozelUyariGoster("Bu nick rezerve edilmiştir!"); return; } if(!email || pass.length < 6) { ozelUyariGoster("Şifre en az 6 haneli olmalı!"); return; }
    btn.disabled = true; btn.innerText = "KAYDEDİLİYOR... ⏳"; btn.style.opacity = "0.7";
    db.collection("kullanicilar").where("isim", "==", nick).get().then((q) => {
        if(!q.empty) { ozelUyariGoster("Bu nick alınmış patron!"); btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; return; }
        auth.createUserWithEmailAndPassword(email, pass).then((uc) => {
            db.collection("kullanicilar").doc(uc.user.uid).set({ isim: nick, cip: 250000, envanter: [], aktifKozmetikler: [], sonBonusTarihi: "", arkadaslar: [], oynananOyun: 0, kazanilanOyun: 0, gorevler: benimGorevler }).then(() => { auth.signOut().then(() => { ozelUyariGoster("✅ Kayıt Başarılı! GİRİŞ YAPabilirsiniz."); document.getElementById('btnGecisGiris').click(); document.getElementById('authSifre').value = ''; btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; }); });
        }).catch(e => { ozelUyariGoster("Hata: " + e.message); btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; });
    });
});

function oyunaGirisYap(isim) { aktifKullaniciAdi = isim; document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); authEkrani.style.display = 'none'; vipHeader.style.display = 'flex'; lobiEkrani.style.display = 'flex'; socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); }

window.vipMasaKurAksiyon = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar VIP Masa kuramaz! Lütfen kayıt ol patron."); return; }
    let bahisDeger = parseInt(document.getElementById('vipMasaBahis').value); let gizliDeger = document.getElementById('vipMasaGizlilik').value === "true";
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(safCip < bahisDeger) { ozelUyariGoster("⚠️ Bu masayı kurmak için yeterli çipiniz yok patron!"); return; }
    document.getElementById('vipMasaKurPanel').style.display = 'none'; socket.emit('vip_masa_kur', { sahibi: aktifKullaniciAdi, bahis: bahisDeger, gizli: gizliDeger });
};

window.vipGizlilikDurumuDegistir = function() { if(suAnkiMasam && suAnkiMasaVIPMi && suAnkiMasaSahibi === aktifKullaniciAdi) { socket.emit('vip_masa_gizlilik_degis', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); } };
socket.on('vip_durum_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { suAnkiMasaGizliMi = data.gizli; if(btnVipGizlilikTetikle) { btnVipGizlilikTetikle.innerText = suAnkiMasaGizliMi ? "🔓 MASAYI HERKESE AÇ" : "🔒 MASAYI KİLİTLE"; btnVipGizlilikTetikle.style.background = suAnkiMasaGizliMi ? "#2ecc71" : "#ff33aa"; } } });
socket.on('vip_masa_kapandi', (data) => { if(suAnkiMasam === data.masaAdi) { ozelUyariGoster("🚨 VIP oda sahibi masadan ayrıldığı için oda kapatıldı!"); masadanAyrilmaIslemi(false); } });

function gorevleriKaydet() { if(auth.currentUser && !isMisafir) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gorevler: benimGorevler }).catch(e=>console.log(e)); } }
window.gorevleriAc = function() { if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar görev yapamaz! Lütfen kayıt olun."); return; } document.getElementById('gorevlerEkrani').style.display = 'flex'; renderGorevler(); }
function renderGorevler() {
    const liste = document.getElementById('gorevListesi'); if(!liste) return; liste.innerHTML = '';
    const gorevlerData = [ { id: 'kazanma', baslik: '🏆 3 El Kazan', hedef: 3, mevcut: benimGorevler.kazanma, odul: 50000 }, { id: 'mesaj', baslik: '💬 5 Mesaj Gönder', hedef: 5, mevcut: benimGorevler.mesaj, odul: 10000 }, { id: 'gosterge', baslik: '⭐ 1 Kere Gösterge Yap', hedef: 1, mevcut: benimGorevler.gosterge, odul: 25000 } ];
    gorevlerData.forEach(g => {
        let yuzde = Math.min(100, (g.mevcut / g.hedef) * 100); let bittiMi = g.mevcut >= g.hedef; let btnHtml = g.alinanlar ? `<button class="satin-al-btn" style="background:#555;" disabled>ALINDI</button>` : (bittiMi ? `<button class="satin-al-btn" style="background:#2ecc71;" onclick="gorevOduluAl('${g.id}', ${g.odul})">🎁 AL</button>` : `<div style="font-size:12px; color:#f2c94c; text-align:center;">${g.mevcut} / ${g.hedef}</div>`);
        liste.innerHTML += `<div style="background:rgba(0,0,0,0.5); border:1px solid #52796f; border-radius:10px; padding:15px; margin-bottom:10px;"><h3 style="color:#fff; font-size:14px; margin-bottom:10px;">${g.baslik}</h3><div style="background:#111; width:100%; height:10px; border-radius:5px; margin-bottom:10px;"><div style="background:#2ecc71; width:${yuzde}%; height:100%;"></div></div>${btnHtml}</div>`;
    });
}
window.gorevOduluAl = function(id, m) { if(benimGorevler.alinanlar[id]) return; benimGorevler.alinanlar[id] = true; if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gorevler: benimGorevler }); let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0; benimAnlikCipim = safCip + m; document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim }); socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); ozelUyariGoster(`🎉 Görev bitti!`); renderGorevler(); }

window.arkadaslarMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesapların arkadaş listesi kapalıdır."); return; }
    const ekran = document.getElementById('arkadaslarEkrani');
    const header = ekran.querySelector('h2');
    if(header) header.innerText = "👥 ARKADAŞ LİSTESİ";
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; 
    const listeDiv = document.getElementById('arkadasListesiDiv'); 
    listeDiv.innerHTML = '';
    if(!benimArkadaslarim || benimArkadaslarim.length === 0) { listeDiv.innerHTML = '<p style="text-align:center; color:#777; font-size:12px;">Henüz hiç arkadaşın yok.</p>'; return; }
    benimArkadaslarim.forEach(arkadas => {
        let isOnline = onlineOyuncularListesi.includes(arkadas); 
        let durumNoktasi = isOnline ? '<span class="online-nokta"></span>' : '<span class="offline-nokta"></span>';
        let kozmetikler = globalKozmetikler[arkadas] || []; 
        let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff'; 
        let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';
        let davetButonu = ''; if(isOnline && suAnkiMasam && !izleyiciModu) { davetButonu = `<button class="btn-davet-et" onclick="masayaDavetEt('${arkadas}')">📥 Davet Et</button>`; }
        listeDiv.innerHTML += `<div class="lider-satir" style="cursor:pointer;"><div class="lider-isim" style="color:${isimRenk};" onclick="profiliGoster('${arkadas}')">${durumNoktasi} ${tac}${arkadas}</div>${davetButonu}</div>`;
    });
}

window.davetMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar davet edemez."); return; }
    const ekran = document.getElementById('arkadaslarEkrani');
    const listeDiv = document.getElementById('arkadasListesiDiv');
    const header = ekran.querySelector('h2');
    if(header) header.innerText = "📥 OYUNCU DAVET ET";
    ekran.style.display = 'flex';
    listeDiv.innerHTML = '<p style="color:#a3c4bc; font-size:11px; text-align:center; margin-bottom:10px;">Masaya çağırmak için aktif bir oyuncu seçin</p>';
    let onlineSayisi = 0;
    onlineOyuncularListesi.forEach(oyuncu => {
        if(oyuncu === aktifKullaniciAdi || oyuncu.startsWith('Bot_') || oyuncu.startsWith('Usta_') || oyuncu.startsWith('Kral_') || oyuncu.startsWith('Okeyci') || oyuncu.startsWith('Misafir_')) return; 
        onlineSayisi++;
        let kozmetikler = globalKozmetikler[oyuncu] || [];
        let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff';
        let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';
        let davetButonu = `<button class="btn-davet-et" style="background:#2ecc71; border:none; padding:6px 12px; border-radius:5px; color:#111; font-weight:bold; cursor:pointer;" onclick="masayaDavetEt('${oyuncu}')">Davet Et</button>`;
        listeDiv.innerHTML += `<div class="lider-satir" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5); padding:10px; border-radius:8px; margin-bottom:5px;"><div style="color:${isimRenk}; font-weight:bold; cursor:pointer;" onclick="profiliGoster('${oyuncu}')"><span class="online-nokta"></span> ${tac}${oyuncu}</div>${davetButonu}</div>`;
    });
    if(onlineSayisi === 0) { listeDiv.innerHTML += '<p style="text-align:center; color:#777; font-size:12px;">Şu an aktif başka oyuncu yok.</p>'; }
};

window.profiliGoster = function(hedefIsim) {
    if(!hedefIsim || hedefIsim === "" || hedefIsim === "Bekleniyor...") { if(suAnkiMasam && !izleyiciModu) davetMenusuAc(); return; }
    const pAvatar = document.getElementById('profilAvatarAlan'); const pIsim = document.getElementById('profilIsim'); const pOynanan = document.getElementById('profilOynanan'); const pKazanilan = document.getElementById('profilKazanilan'); const pCip = document.getElementById('profilCip'); const kazanmaOrani = document.getElementById('profilKazanmaOrani'); const pDurum = document.getElementById('profilDurumBadge'); const pArkadasBtn = document.getElementById('profilArkadasBtn'); const pDavetBtn = document.getElementById('profilDavetBtn'); const pLigBadge = document.getElementById('profilLigBadge'); const pUnvanBadge = document.getElementById('profilUnvanBadge'); const firlatAlani = document.getElementById('profilEsyaFirlatAlani');
    
    document.getElementById('profilEkrani').style.display = 'flex'; pArkadasBtn.dataset.hedef = hedefIsim; pDavetBtn.dataset.hedef = hedefIsim;
    let isOnline = onlineOyuncularListesi.includes(hedefIsim) || hedefIsim === aktifKullaniciAdi;
    let masadaMi = false; ['seatRight', 'seatTop', 'seatLeft'].forEach(id => { let el = document.getElementById(id); if(el && el.dataset.isim === hedefIsim) masadaMi = true; });

    if (firlatAlani) { if (suAnkiMasam && masadaMi && hedefIsim !== aktifKullaniciAdi && !izleyiciModu) { firlatAlani.style.display = 'flex'; } else { firlatAlani.style.display = 'none'; } }
    if(isOnline) { pDurum.innerText = "🟢 Çevrimiçi"; pDurum.style.color = "#2ecc71"; } else { pDurum.innerText = "🔴 Çevrimdışı"; pDurum.style.color = "#e74c3c"; }

    if (hedefIsim !== aktifKullaniciAdi) {
        pArkadasBtn.style.display = 'block';
        if (benimArkadaslarim.includes(hedefIsim)) { pArkadasBtn.innerText = "❌ Arkadaştan Çıkar"; pArkadasBtn.style.background = "#e74c3c"; } else { pArkadasBtn.innerText = "➕ Arkadaş Ekle"; pArkadasBtn.style.background = ""; }
        if (isOnline) { pDavetBtn.style.display = 'block'; } else { pDavetBtn.style.display = 'none'; }
    } else { pArkadasBtn.style.display = 'none'; pDavetBtn.style.display = 'none'; }

    if(hedefIsim.startsWith("MİSAFİR_")) {
        pIsim.innerText = hedefIsim; pOynanan.innerText = "0"; pKazanilan.innerHTML = `<span style="color:#2ecc71">0</span> <span style="color:#777">/</span> <span style="color:#e74c3c">0</span>`; 
        pCip.innerText = "20.000"; let ligAyar = getLigRozeti(0, true); pLigBadge.innerText = ligAyar.metin; pLigBadge.style.background = ligAyar.renk; pLigBadge.style.color = ligAyar.yaziRenk; pArkadasBtn.style.display = 'none'; pDavetBtn.style.display = (suAnkiMasam && isOnline && !izleyiciModu && hedefIsim !== aktifKullaniciAdi) ? 'block' : 'none'; return;
    }

    pIsim.innerText = "Yükleniyor..."; pOynanan.innerText = "..."; pKazanilan.innerText = "..."; pCip.innerText = "..."; kazanmaOrani.innerText = "%0"; pAvatar.style.border = '3px solid #52796f'; pAvatar.style.boxShadow = 'none'; pIsim.style.color = '#fff'; pIsim.style.textShadow = 'none'; pUnvanBadge.style.display = 'none'; pLigBadge.innerText = "Yükleniyor..."; pLigBadge.style.background = "#333";

    db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then((q) => {
        if(!q.empty) {
            const data = q.docs[0].data(); let kozmetikler = data.aktifKozmetikler || []; let tac = kozmetikler.includes('neon_tac') ? "👑 " : ""; pIsim.innerHTML = tac + data.isim; pIsim.style.color = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff'; pIsim.style.textShadow = kozmetikler.includes('atesli_isim') ? '0 0 8px #ff0000' : 'none';
            if (kozmetikler.includes('atesli_isim')) { pUnvanBadge.innerText = "🔥 ATEŞ USTASI"; pUnvanBadge.style.display = "inline-block"; } else if (kozmetikler.includes('neon_tac')) { pUnvanBadge.innerText = "👑 OKEY KRALI"; pUnvanBadge.style.display = "inline-block"; }
            if(kozmetikler.includes('altin_cerceve')) { pAvatar.style.border = '3px solid #f2c94c'; pAvatar.style.boxShadow = '0 0 15px #f2c94c'; }
            let oynanan = data.oynananOyun || 0; let kazanilan = data.kazanilanOyun || 0; let kaybedilen = Math.max(0, oynanan - kazanilan); let oran = oynanan > 0 ? Math.round((kazanilan / oynanan) * 100) : 0; 
            pOynanan.innerText = oynanan; pKazanilan.innerHTML = `<span style="color:#2ecc71; font-weight:900;">${kazanilan}</span> <span style="color:#777">/</span> <span style="color:#e74c3c; font-weight:900;">${kaybedilen}</span>`; kazanmaOrani.innerText = "%" + oran; let gorunenCip = parseInt(String(data.cip).replace(/[^0-9]/g, '')) || 0; pCip.innerText = gorunenCip.toLocaleString('tr-TR'); let ligAyar = getLigRozeti(kazanilan, false); pLigBadge.innerText = ligAyar.metin; pLigBadge.style.background = ligAyar.renk; pLigBadge.style.color = ligAyar.yaziRenk;
        } else { 
            let hash = Math.abs(hedefIsim.charCodeAt(0) + (hedefIsim.charCodeAt(1) << 5) + (hedefIsim.length)); let bOynanan = (hash % 1150) + 75; let bOran = (hash % 25) + 38; let bKazanilan = Math.floor(bOynanan * (bOran / 100)); let bKaybedilen = bOynanan - bKazanilan; let bCip = (hash % 14500000) + 1200000; 
            let bKozmetikler = globalKozmetikler[hedefIsim] || []; let bTac = bKozmetikler.includes('neon_tac') ? "👑 " : ""; pIsim.innerHTML = bTac + hedefIsim;
            if(bKozmetikler.includes('atesli_isim')) { pIsim.style.color = '#ff4d4d'; pIsim.style.textShadow = '0 0 8px #ff0000'; pUnvanBadge.innerText = "🔥 ATEŞ USTASI"; pUnvanBadge.style.display = "inline-block"; }
            if(bKozmetikler.includes('neon_tac')) { pUnvanBadge.innerText = "👑 OKEY KRALI"; pUnvanBadge.style.display = "inline-block"; }
            if(bKozmetikler.includes('altin_cerceve')) { pAvatar.style.border = '3px solid #f2c94c'; pAvatar.style.boxShadow = '0 0 15px #f2c94c'; }
            pOynanan.innerText = bOynanan; pKazanilan.innerHTML = `<span style="color:#2ecc71; font-weight:900;">${bKazanilan}</span> <span style="color:#777">/</span> <span style="color:#e74c3c; font-weight:900;">${bKaybedilen}</span>`; kazanmaOrani.innerText = "%" + bOran; pCip.innerText = bCip.toLocaleString('tr-TR'); let bLigAyar = getLigRozeti(bKazanilan, false); pLigBadge.innerText = bLigAyar.metin; pLigBadge.style.background = bLigAyar.renk; pLigBadge.style.color = bLigAyar.yaziRenk;
        }
    }).catch(err => { pIsim.innerText = "Bağlantı Hatası"; });
};

window.profilArkadasAksiyon = function() {
    const btn = document.getElementById('profilArkadasBtn'); const hedef = btn.dataset.hedef; if (!hedef || isMisafir) return;
    if (benimArkadaslarim.includes(hedef)) { 
        if(confirm(`${hedef} adlı kişiyi silmek istediğine emin misin?`)) { benimArkadaslarim = benimArkadaslarim.filter(n=>n!==hedef); ozelUyariGoster(`❌ Silindi.`); if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }); document.getElementById('profilEkrani').style.display='none'; }
    } else { arkadasEkle(hedef); document.getElementById('profilEkrani').style.display='none'; } 
};

window.esyaFirlatAksiyon = function(esyaIcon) {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar eşya fırlatamaz!"); return; } const hedef = document.getElementById('profilArkadasBtn').dataset.hedef;
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(!hedef || !suAnkiMasam || hedef === aktifKullaniciAdi || safCip < 5000) return;
    socket.emit('esya_firlat', { masaAdi: suAnkiMasam, kimden: aktifKullaniciAdi, kime: hedef, esya: esyaIcon }); document.getElementById('profilEkrani').style.display = 'none';
};

window.profilDavetAksiyon = function() { const hedef = document.getElementById('profilDavetBtn').dataset.hedef; if (!hedef || !suAnkiMasam) return; socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: hedef, masaAdi: suAnkiMasam }); ozelUyariGoster(`💌 Davet gönderildi!`); document.getElementById('profilEkrani').style.display = 'none'; };

// --- BÖLÜM 1 BURADA BİTİYOR --- //
// --- BÖLÜM 2 BAŞLANGICI BURADA --- //

function masadanAyrilmaIslemi(cezaUygulansinMi = false) {
    if (suAnkiMasam) { socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); }
    suAnkiMasam = null; izleyiciModu = false; masayiTemizle();
    try { document.querySelector('.istaka-container').style.display = 'flex'; document.querySelector('.okey-istaka-tuslar-area').style.display = 'flex'; } catch(e) {}
    masaEkrani.style.display = 'none'; lobiEkrani.style.display = 'flex'; arayuzGuncelle();
}

window.cezaAnladimKapat = function() { try { document.getElementById('cezaBildirimEkrani').style.display = 'none'; } catch(e){} if(cikisIcinBekleyenLogout) { tamamenCikisYap(); } }

window.tamamenCikisYap = function() { auth.signOut().then(() => window.location.reload()).catch(() => window.location.reload()); };
document.getElementById('btnCikisYap').addEventListener('click', (e) => { e.stopPropagation(); if(confirm("Çıkış yapmak istediğinize emin misiniz?")) { if (suAnkiMasam) socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); tamamenCikisYap(); } });

const lobiyeDonBtn = document.getElementById('lobiyeDonBtn'); 
lobiyeDonBtn.addEventListener('click', () => { 
    if (suAnkiMasam && !izleyiciModu && masaOyunBasladiMi) { document.getElementById('cikisUyariEkrani').style.display = 'flex'; } 
    else { masadanAyrilmaIslemi(false); } 
});
document.getElementById('btnCikisOnayla').addEventListener('click', () => { document.getElementById('cikisUyariEkrani').style.display = 'none'; masadanAyrilmaIslemi(true); });

window.liderlikTablosunuAc = function() { document.getElementById('liderlikEkrani').style.display = 'flex'; socket.emit('liderlik_tablosu_iste'); };
socket.on('liderlik_tablosu_guncelle', (list) => {
    const div = document.getElementById('liderlikListesi'); div.innerHTML = '';
    list.forEach((o, i) => { div.innerHTML += `<div class="lider-satir" onclick="profiliGoster('${o.isim}')" style="cursor:pointer;"><div class="lider-sira">${i+1}.</div><div class="lider-isim">${o.isim}</div><div class="lider-cip">${Number(o.cip).toLocaleString()} ÇİP</div></div>`; });
});

socket.on('online_oyuncular', (liste) => {
    onlineOyuncularListesi = liste; const lobiDiv = document.getElementById('lobidekilerListesi'); if(!lobiDiv) return; lobiDiv.innerHTML = '';
    liste.forEach(o => { if(o !== aktifKullaniciAdi) lobiDiv.innerHTML += `<div class="lobi-oyuncu-satir"><span class="lobi-oyuncu-isim" onclick="profiliGoster('${o}')" style="cursor:pointer;"><span class="online-nokta"></span>${o}</span><button class="btn-arkadas-ekle" onclick="arkadasEkle('${o}')">+ Ekle</button></div>`; });
});

window.masayaDavetEt = function(n) { socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: n, masaAdi: suAnkiMasam }); document.getElementById('arkadaslarEkrani').style.display = 'none'; };
socket.on('davet_geldi', (data) => {
    if(data.kime === aktifKullaniciAdi) { 
        const metinEl = document.getElementById('davetMetni'); if(metinEl) metinEl.innerHTML = `<strong style="color:#ff33aa;">${data.kimden}</strong> seni janjanlı VIP masaya çağırıyor patron!`;
        document.getElementById('davetGeldiEkrani').style.display = 'flex';
        document.getElementById('btnDavetKabul').onclick = function() { document.getElementById('davetGeldiEkrani').style.display = 'none'; if(suAnkiMasam) { socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); suAnkiMasam = null; izleyiciModu = false;} setTimeout(() => { masayaOtur(data.masaAdi); }, 300); };
    }
});

window.masayiIzle = function(m) { socket.emit('masayi_izle', { isim: aktifKullaniciAdi, masaAdi: m }); };

socket.on('izleyici_olarak_katildin', (data) => {
    masayiTemizle(); suAnkiMasam = data.masaAdi; izleyiciModu = true; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex';
    document.getElementById('masaOrtasiYazi').innerHTML = data.masaAdi.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>";
    document.querySelector('.istaka-container').style.display = 'none'; document.querySelector('.okey-istaka-tuslar-area').style.display = 'none'; oyunuBaslatBtn.style.display = 'none';
    if(data.oyunBasladi) { masaOyunBasladiMi = true; oyunAlanObjeleri.style.display = 'flex'; kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; } }
    gelişmişKoltukHizala(data.koltuklar);
});

socket.on('sen_masadasin', (data) => { 
    masayiTemizle(); suAnkiMasam = data.masaAdi || data; suAnkiMasaVIPMi = data.isVIP || false; suAnkiMasaSahibi = data.sahibi || ""; suAnkiMasaGizliMi = data.gizli || false; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; 
    document.getElementById('masaOrtasiYazi').innerHTML = suAnkiMasam.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>"; 
    if(suAnkiMasaVIPMi && suAnkiMasaSahibi === aktifKullaniciAdi) { if(btnVipGizlilikTetikle) { btnVipGizlilikTetikle.style.display = "block"; btnVipGizlilikTetikle.innerText = suAnkiMasaGizliMi ? "🔓 MASAYI HERKESE AÇ" : "🔒 MASAYI KİLİTLE"; btnVipGizlilikTetikle.style.background = suAnkiMasaGizliMi ? "#2ecc71" : "#ff33aa"; } } else { if(btnVipGizlilikTetikle) btnVipGizlilikTetikle.style.display = "none"; }
    socket.emit('masaya_geri_don', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); 
});

socket.on('masalari_guncelle', (lobidekiMasalar) => {
    guncelMasalar = lobidekiMasalar; if(!masalarAlani) return; masalarAlani.innerHTML = '';
    const siraliMasalar = Object.entries(lobidekiMasalar).sort((a, b) => { let aIsVIP = a[0].includes('👑 VIP:'); let bIsVIP = b[0].includes('👑 VIP:'); if(aIsVIP && !bIsVIP) return -1; if(!aIsVIP && bIsVIP) return 1; return 0; });
    for (const [masaAdi, koltuklar] of siraliMasalar) {
        const dolu = koltuklar.filter(k => k !== null).length; const benVarim = koltuklar.includes(aktifKullaniciAdi);
        const action = benVarim ? `masayaGeriDon('${masaAdi}')` : `masayaOtur('${masaAdi}')`; const txt = benVarim ? 'OTURDUN ✓' : (dolu>=4 ? 'DOLU' : 'OTUR');
        let proStyle = ""; let crownEki = "🎲"; if (masaAdi.includes('👑 VIP:')) { proStyle = "border: 2px solid #ff33aa; box-shadow: 0 0 15px #ff33aa, inset 0 0 10px rgba(255,51,170,0.2); background: linear-gradient(135deg, #160011 0%, #000000 100%);"; crownEki = "👑"; }
        let izleBtn = !benVarim ? `<button class="btn-izle" onclick="masayiIzle('${masaAdi}')">👁️ İZLE</button>` : '';
        masalarAlani.innerHTML += `<div class="masa-kart" style="${proStyle}"><div class="masa-watermark"></div><div class="kart-sol"><div class="zar-kutu">${crownEki}</div><div class="masa-kart-isim">${masaAdi}</div></div><div class="kart-sag"><div class="masa-kisi-kutu">🎲 ${dolu}/4</div><div style="display:flex; gap:8px;">${izleBtn}<button class="btn-otur ${benVarim || (dolu>=4 && !benVarim) ? 'disabled':''}" style="${benVarim ? 'background:#2ecc71;color:#111;':''}" onclick="${action}">${txt}</button></div></div></div>`;
        if(benVarim) gelişmişKoltukHizala(koltuklar);
    }
});

const btnHemenOynalar = document.querySelectorAll('.btn-hemen-oyna');
btnHemenOynalar.forEach(btn => {
    btn.addEventListener('click', () => { 
        if (suAnkiMasam && !izleyiciModu) return; 
        for (const [m, koltuklar] of Object.entries(guncelMasalar)) { if (koltuklar.includes(aktifKullaniciAdi)) { masayaGeriDon(m); return; } }
        let musaitMasa = null; 
        for (const [masaAdi, koltuklar] of Object.entries(guncelMasalar)) { if (masaAdi.includes('👑 VIP:')) continue; if (koltuklar.filter(k => k !== null).length < 4) { musaitMasa = masaAdi; break; } } 
        if (musaitMasa) masayaOtur(musaitMasa); else ozelUyariGoster("Şu an tüm genel masalar tam kapasite dolu, patron!"); 
    });
});

window.masayaOtur = function(m) { 
    let bahis = 0; if(m.includes('20K')) bahis = 20000; else if(m.includes('50K')) bahis = 50000; else if(m.includes('10K')) bahis = 10000;
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(safCip < bahis) { ozelUyariGoster("⚠️ Yetersiz Bakiye! Bu masaya oturmak için en az " + bahis.toLocaleString() + " ÇİP gerekiyor."); return; }
    suAnkiMasam = m; socket.emit('masaya_otur', { isim: aktifKullaniciAdi, masaAdi: m }); lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; masaOrtasiYazi.innerHTML = m.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>";
};

window.masayaGeriDon = function(m) { suAnkiMasam = m; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; socket.emit('masaya_geri_don', { masaAdi: m, isim: aktifKullaniciAdi }); };

socket.on('masa_oyun_basladi', (data) => { if(suAnkiMasam === data.masaAdi) { masayiTemizle(); masaOyunBasladiMi = true; oyunuBaslatBtn.style.display = 'none'; oyunAlanObjeleri.style.display = 'flex'; bitisAlani.style.display = 'flex'; kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; } gelişmişKoltukHizala(data.koltuklar); } });
socket.on('taslari_al', (data) => { if (data.kime === aktifKullaniciAdi && !izleyiciModu) { data.taslar.forEach((t, i) => tasEkle(t, 'y'+i)); setTimeout(checkGosterge, 500); } });
socket.on('tas_cekildi', (t) => { if(!izleyiciModu) { for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { tasEkle(t, 'y'+i); break; } } } });

function tasEkle(tasData, yuvaId) { const div = document.createElement('div'); div.className = `okey-tasi tas-${tasData.renk}`; div.innerText = tasData.sayi; div.id = tasData.id; let surukleniyorMu = false; div.addEventListener('touchstart', () => { surukleniyorMu = false; }, {passive: true}); div.addEventListener('touchmove', () => { surukleniyorMu = true; }, {passive: true}); div.addEventListener('touchend', function(e) { if(!surukleniyorMu) { otomatikTasAt(this); } }); div.ondblclick = function() { otomatikTasAt(this); }; document.getElementById(yuvaId).appendChild(div); }

socket.on('sira_guncelle', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        kurtarmaSinyaliGonder();
        const eskiSira = benimSiramMi;
        benimSiramMi = (!izleyiciModu && data.kimde === aktifKullaniciAdi); if(benimSiramMi && !eskiSira) sesCal(sesSiraSende);
        const iskarta = document.getElementById('benimIskartam'); if(benimSiramMi) iskarta.classList.remove('kilitli-iskarta'); else iskarta.classList.add('kilitli-iskarta'); 
        let bName = izleyiciModu ? document.getElementById('benimAdimKutusu').dataset.isim : aktifKullaniciAdi;
        const koltuklar = [ { id: 'benimAdimKutusu', isim: bName }, { id: 'seatRight', isim: document.getElementById('seatRight').dataset.isim }, { id: 'seatTop', isim: document.getElementById('seatTop').dataset.isim }, { id: 'seatLeft', isim: document.getElementById('seatLeft').dataset.isim } ];
        koltuklar.forEach(k => { const el = document.getElementById(k.id); if(el) { if(k.isim === data.kimde && k.isim !== "") el.classList.add('aktif-sira'); else el.classList.remove('aktif-sira'); } });
        checkGosterge();
    }
});

socket.on('masa_ortasi_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { kurtarmaSinyaliGonder(); kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; } } });

function gelişmişKoltukHizala(koltuklar) {
    let idx = koltuklar.indexOf(aktifKullaniciAdi); if(idx === -1) idx = 0;
    document.getElementById('benimAdimKutusu').innerText = koltuklar[idx] || "Boş";
    document.getElementById('seatRight').dataset.isim = koltuklar[(idx+1)%4] || ""; document.getElementById('seatRight').innerHTML = koltuklar[(idx+1)%4] ? koltuklar[(idx+1)%4] : '<span style="color:#2ecc71; font-weight:bold; font-size:13px;">➕ DAVET ET</span>';
    document.getElementById('seatTop').dataset.isim = koltuklar[(idx+2)%4] || ""; document.getElementById('seatTop').innerHTML = koltuklar[(idx+2)%4] ? koltuklar[(idx+2)%4] : '<span style="color:#2ecc71; font-weight:bold; font-size:13px;">➕ DAVET ET</span>';
    document.getElementById('seatLeft').dataset.isim = koltuklar[(idx+3)%4] || ""; document.getElementById('seatLeft').innerHTML = koltuklar[(idx+3)%4] ? koltuklar[(idx+3)%4] : '<span style="color:#2ecc71; font-weight:bold; font-size:13px;">➕ DAVET ET</span>';
}

function masayiTemizle() { 
    masaOyunBasladiMi = false; const flash = document.getElementById('flashBildirim'); if (flash) flash.classList.remove('goster'); 
    document.getElementById('sonucEkrani').style.display = 'none'; oyunAlanObjeleri.style.display = 'none'; gostergeBtn.style.display = 'none'; gostergeHakki = false; 
    oyunuBaslatBtn.innerText = "🎲 OYUNU BAŞLAT"; oyunuBaslatBtn.style.display = 'block'; bitisAlani.style.display = 'none'; masaKasaBilgisi.style.display = 'none'; bitisAlani.innerHTML = 'BİTİR<br>🏆'; 
    for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; 
    document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; 
    document.getElementById('iskartaSag').innerHTML = ''; document.getElementById('iskartaSol').innerHTML = ''; document.getElementById('iskartaUst').innerHTML = ''; 
    ['benimAdimKutusu', 'seatRight', 'seatTop', 'seatLeft'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.remove('aktif-sira'); }); benimSiramMi = false; 
}

function checkGosterge() { 
    gostergeBtn.style.display = 'none'; if(!gostergeHakki || !benimSiramMi) return; 
    let gostergeDiv = document.getElementById('gostergeTasi'); 
    if(gostergeDiv.innerText) { 
        let gSayi = gostergeDiv.innerText; let renkClass = Array.from(gostergeDiv.classList).find(c => c.startsWith('tas-')); if(!renkClass) return; 
        let gRenk = renkClass.replace('tas-', ''); let varMi = false; 
        for(let i=0; i<24; i++) { 
            let yuva = document.getElementById('y'+i); 
            if(yuva.children.length > 0) { let t = yuva.children[0]; let tRenkClass = Array.from(t.classList).find(c => c.startsWith('tas-')); if(tRenkClass) { let tRenk = tRenkClass.replace('tas-', ''); if(tRenk === gRenk && t.innerText === gSayi) varMi = true; } } 
        } 
        if(varMi) gostergeBtn.style.display = 'block'; 
    } 
}

function elimdekiTasSayisi() { let sayi = 0; for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length > 0) sayi++; } return sayi; }

function getIstakaGruplari() { 
    let gruplar = []; let currentGrup = []; 
    for(let i=0; i<24; i++) { 
        if(i === 12 && currentGrup.length > 0) { gruplar.push(currentGrup); currentGrup = []; } 
        let yuva = document.getElementById('y'+i); 
        if(yuva.children.length > 0) { 
            let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); let renk = renkClass ? renkClass.replace('tas-', '') : ''; 
            currentGrup.push({ id: tas.id, renk: renk, sayi: tas.innerText }); 
        } else { if(currentGrup.length > 0) { gruplar.push(currentGrup); currentGrup = []; } } 
    } 
    if(currentGrup.length > 0) gruplar.push(currentGrup); return gruplar; 
}

window.seriDiz = function() { 
    let taslar = []; for(let i=0; i<24; i++) { let yuva = document.getElementById('y'+i); if(yuva.children.length > 0) { let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); let renk = renkClass ? renkClass.replace('tas-', '') : ''; taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 }); } } 
    const renkDeger = { 'kirmizi': 1, 'siyah': 2, 'mavi': 3, 'sari': 4, 'sahte': 5 }; 
    taslar.sort((a, b) => { if (renkDeger[a.renk] !== renkDeger[b.renk]) return renkDeger[a.renk] - renkDeger[b.renk]; return a.sayi - b.sayi; }); 
    taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); }); sesCal(sesTasCek); 
};

window.ciftDiz = function() { 
    let taslar = []; for(let i=0; i<24; i++) { let yuva = document.getElementById('y'+i); if(yuva.children.length > 0) { let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); let renk = renkClass ? renkClass.replace('tas-', '') : ''; taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 }); } } 
    taslar.sort((a, b) => { if (a.sayi !== b.sayi) return a.sayi - b.sayi; return a.renk.localeCompare(b.renk); }); 
    taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); }); sesCal(sesTasCek); 
};

function kurtarmaSinyaliGonder() { if (document.getElementById('oyunuBaslatBtn').style.display !== 'none' && suAnkiMasam && !izleyiciModu) { socket.emit('taslarimi_ver', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); } }

function otomatikTasAt(tasElementi) { 
    if (!benimSiramMi || elimdekiTasSayisi() !== 15) return; 
    gostergeHakki = false; gostergeBtn.style.display = 'none'; const iskartaKutusu = document.getElementById('benimIskartam'); 
    if (iskartaKutusu) { 
        iskartaKutusu.appendChild(tasElementi); tasElementi.style.position = 'absolute'; tasElementi.style.top = '50%'; tasElementi.style.left = '50%'; tasElementi.style.transform = 'translate(-50%, -50%)'; tasElementi.style.margin = '0'; document.getElementById('iskartaYazi').style.display = 'none'; 
        let renkSinifi = Array.from(tasElementi.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; 
        socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: tasElementi.id, renk: renk, sayi: tasElementi.innerText } }); sesCal(sesTasKoy); 
    } 
}

if(oyunuBaslatBtn) oyunuBaslatBtn.addEventListener('click', () => { socket.emit('oyunu_baslat', suAnkiMasam); });
kalanTasBilgi.addEventListener('click', () => { if (benimSiramMi && elimdekiTasSayisi() === 14) { gostergeHakki = false; gostergeBtn.style.display = 'none'; socket.emit('ortadan_tas_cek', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); sesCal(sesTasCek); } else if(!benimSiramMi) ozelUyariGoster("Şu an sıra sizde değil!"); else ozelUyariGoster("Önce elinizdeki fazlalık taşı sağdaki oyuncuya atmalısınız!"); });

document.getElementById('iskartaSol').addEventListener('click', function() { 
    if (benimSiramMi && elimdekiTasSayisi() === 14 && this.children.length > 0) { 
        gostergeHakki = false; gostergeBtn.style.display = 'none'; const tasEl = this.lastElementChild; let renkSinifi = Array.from(tasEl.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; const tasObj = { id: tasEl.id, sayi: tasEl.innerText, renk: renk }; 
        this.innerHTML = ''; for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { tasEkle(tasObj, 'y'+i); break; } } 
        socket.emit('yandan_tas_alindi', { masaAdi: suAnkiMasam, kimAldi: aktifKullaniciAdi, tas: tasObj }); sesCal(sesTasCek); 
    } else if(!benimSiramMi) ozelUyariGoster("Şu an sıra sizde değil!"); else if(elimdekiTasSayisi() === 15) ozelUyariGoster("Elinizde zaten 15 taş var!"); 
});

socket.on('ortaya_tas_atildi', (data) => { 
    if(suAnkiMasam === data.masaAdi) { 
        let target = null; 
        if(data.kimAtti === document.getElementById('seatRight').dataset.isim) target = 'iskartaSag'; 
        else if(data.kimAtti === document.getElementById('seatTop').dataset.isim) target = 'iskartaUst'; 
        else if(data.kimAtti === document.getElementById('seatLeft').dataset.isim) target = 'iskartaSol'; 
        else if(data.kimAtti === document.getElementById('benimAdimKutusu').dataset.isim && izleyiciModu) target = 'benimIskartam'; 
        if(target) { 
            const kutu = document.getElementById(target); kutu.innerHTML = ''; const div = document.createElement('div'); div.className = `okey-tasi tas-${data.tas.renk}`; div.innerText = data.tas.sayi; div.id = data.tas.id; div.style.position = 'absolute'; div.style.top = '50%'; div.style.left = '50%'; div.style.transform = 'translate(-50%, -50%)'; div.style.margin = '0'; div.style.pointerEvents = 'none'; if(target === 'iskartaSol') div.style.pointerEvents = 'auto'; kutu.appendChild(div); sesCal(sesTasKoy); 
        } 
    } 
});

socket.on('yandan_alindi_guncelle', (data) => { 
    if(data.masaAdi === suAnkiMasam && data.kimAldi !== aktifKullaniciAdi) { 
        let source = null; 
        if(data.kimAldi === document.getElementById('seatRight').dataset.isim) source = 'benimIskartam'; 
        else if(data.kimAldi === document.getElementById('seatTop').dataset.isim) source = 'iskartaSag'; 
        else if(data.kimAldi === document.getElementById('seatLeft').dataset.isim) source = 'iskartaUst'; 
        else if(data.kimAldi === document.getElementById('benimAdimKutusu').dataset.isim && izleyiciModu) source = 'iskartaSol'; 
        if(source) { document.getElementById(source).innerHTML = ''; if(source === 'benimIskartam' && !izleyiciModu) document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; sesCal(sesTasCek); } 
    } 
});

const sortableOptions = { group: { name: 'istaka', put: (to) => to.el.children.length === 0 }, animation: 100, delay: 0, forceFallback: true, fallbackOnBody: true, fallbackTolerance: 3, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag', easing: "cubic-bezier(0.25, 1, 0.5, 1)", onEnd: function() { sesCal(sesTasKoy); } };
for(let i=0; i<12; i++) { 
    const yUst = document.createElement('div'); yUst.className = 'yuva'; yUst.id = 'y'+i; ustRaf.appendChild(yUst); new Sortable(yUst, sortableOptions); 
    const yAlt = document.createElement('div'); yAlt.className = 'yuva'; yAlt.id = 'y'+(i+12); altRaf.appendChild(yAlt); new Sortable(yAlt, sortableOptions); 
}

new Sortable(document.getElementById('benimIskartam'), { 
    group: { name: 'istaka', put: function (to) { return benimSiramMi && elimdekiTasSayisi() === 15; }, pull: false }, 
    animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, 
    onAdd: function (evt) { 
        gostergeHakki = false; gostergeBtn.style.display = 'none'; document.getElementById('iskartaYazi').style.display = 'none'; const atilanTas = evt.item; atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0'; let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText } }); sesCal(sesTasKoy); 
    } 
});

new Sortable(bitisAlani, { 
    group: { name: 'istaka', put: function (to) { return benimSiramMi && elimdekiTasSayisi() === 15; }, pull: false }, 
    animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, 
    onAdd: function (evt) { 
        gostergeHakki = false; gostergeBtn.style.display = 'none'; const atilanTas = evt.item; atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0'; let gruplar = getIstakaGruplari(); let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; const bitisTasi = { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText }; socket.emit('oyunu_bitir', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, gruplar: gruplar, bitisTasi: bitisTasi, tasHtmlId: atilanTas.id }); sesCal(sesTasKoy); 
    } 
});

socket.on('hatali_bitis', (data) => {
    ozelUyariGoster(data.mesaj); 
    const atilanTas = document.getElementById(data.tasId);
    if(atilanTas && atilanTas.parentNode === bitisAlani) {
        for(let i=0; i<24; i++) { let yuva = document.getElementById('y'+i); if(yuva.children.length === 0) { atilanTas.style.position = 'relative'; atilanTas.style.top = 'auto'; atilanTas.style.left = 'auto'; atilanTas.style.transform = 'none'; yuva.appendChild(atilanTas); break; } }
    }
});

socket.on('hata_mesaji', (mesaj) => { ozelUyariGoster(mesaj); if (suAnkiMasam && !masaOyunBasladiMi) { suAnkiMasam = null; suAnkiMasaVIPMi = false; suAnkiMasaSahibi = ""; suAnkiMasaGizliMi = false; izleyiciModu = false; if(btnVipGizlilikTetikle) btnVipGizlilikTetikle.style.display = "none"; masaEkrani.style.display = 'none'; lobiEkrani.style.display = 'flex'; } });

if(sohbetCekmecesi) {
    document.getElementById('sohbetAcBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.add('acik'); });
    document.getElementById('sohbetKapatBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.remove('acik'); });
    document.getElementById('sohbetGonderBtn')?.addEventListener('click', () => { if(isMisafir) { ozelUyariGoster("⚠️ MİSAFİR HESAPLAR SOHBETE MESAJ YAZAMAZ!"); return; } const input = document.getElementById('sohbetInput'); if(input.value.trim() !== '' && suAnkiMasam) { socket.emit('sohbet_mesaji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, mesaj: input.value, kozmetikler: aktifKozmetikler }); input.value = ''; benimGorevler.mesaj++; gorevleriKaydet(); } });
}

window.vipEmojiGonder = function(emoji) { if(isMisafir) return; if(suAnkiMasam) { socket.emit('vip_emoji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, emoji: emoji }); sohbetCekmecesi.classList.remove('acik'); } }
socket.on('yeni_sohbet_mesaji', (data) => { if(data.masaAdi === suAnkiMasam) { let isimRenk = data.isim === "Sistem" ? "#2ecc71" : "#f2c94c"; let tacIcon = ""; if (data.kozmetikler) { if(data.kozmetikler.includes('atesli_isim')) { isimRenk = "#ff4d4d"; } if(data.kozmetikler.includes('neon_tac')) { tacIcon = "👑 "; } } const div = document.createElement('div'); div

