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

// 🔥 UYARI FONKSİYONU (En üstte olmalı ki her buton kullanabilsin) 🔥
window.ozelUyariGoster = function(mesaj) {
    document.getElementById('uyariModalMetni').innerText = mesaj;
    document.getElementById('uyariModalEkrani').style.display = 'flex';
};

// 🔥 BEYCO GAMES & REKLAM SİSTEMİ BRANDING 🔥
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

// 🔥 CANLI HANDSHAKE ARKADAŞLIK DINLEYICILERI 🔥
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
            if(!benimArkadaslarim.includes(data.kimden)) {
                benimArkadaslarim.push(data.kimden);
                if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim });
            }
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
        ozelUyariGoster(`🎉 ${data.kimden} isteğini kabul etti, artık arkadaşsınız!`); arayuzGuncelle();
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
    if(isMisafir) return;
    socket.emit('arkadaslik_istegi_gonder', { kimden: aktifKullaniciAdi, kime: isim });
    ozelUyariGoster(`⏳ ${isim} adlı oyuncuya arkadaşlık isteği gönderildi!`);
};

// 🔥 REKLAM / BEDAVA ÇİP FONKSİYONLARI 🔥
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
        document.getElementById('reklamEkrani').style.display = 'none'; benimAnlikCipim = Number(benimAnlikCipim) + 25000;
        document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
        if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim });
        socket.emit('magaza_harcamasi', { isim: aktifKullaniciAdi, yeniCip: benimAnlikCipim });
        ozelUyariGoster("📺 25.000 ÇİP hesabına yatırıldı!"); reklamIzlendi = false;
    }
};

const sesTasCek = new Audio('sounds/tas_cek.mp3');
const sesTasKoy = new Audio('sounds/tas_koy.mp3');
const sesSiraSende = new Audio('sounds/sira_sende.mp3');

sesTasCek.preload = 'auto'; sesTasKoy.preload = 'auto'; sesSiraSende.preload = 'auto';
function sesCal(sesObje) { if(window.oyunSesleriAktif === false) return; try { let yeniSes = sesObje.cloneNode(); yeniSes.volume = 0.5; yeniSes.play().catch(e => console.log(e)); } catch(err) {} }

const authEkrani = document.getElementById('authEkrani');
const lobiEkrani = document.getElementById('lobiEkrani');
const masaEkrani = document.getElementById('masaEkrani');
const vipHeader = document.querySelector('.vip-header');
const oyunuBaslatBtn = document.getElementById('oyunuBaslatBtn');
const oyunAlanObjeleri = document.getElementById('oyunAlanObjeleri');
const kalanTasBilgi = document.getElementById('kalanTasBilgi');
const bitisAlani = document.getElementById('bitisAlani');
const ustRaf = document.getElementById('ustRaf');
const altRaf = document.getElementById('altRaf');
const masaOrtasiYazi = document.getElementById('masaOrtasiYazi');
const masaKasaBilgisi = document.getElementById('masaKasaBilgisi');
const masalarAlani = document.getElementById('masalarAlani');
const sohbetCekmecesi = document.getElementById('sohbetCekmecesi');
const btnVipGizlilikTetikle = document.getElementById('btnVipGizlilikTetikle');

let gostergeBtn = document.createElement('button');
gostergeBtn.id = 'gostergeBtn'; gostergeBtn.innerText = '⭐ GÖSTERGE YAP'; gostergeBtn.className = 'gosterge-btn';
gostergeBtn.onclick = () => { socket.emit('gosterge_goster', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); gostergeBtn.style.display = 'none'; };

if(oyunAlanObjeleri && oyunAlanObjeleri.firstElementChild) {
    oyunAlanObjeleri.firstElementChild.appendChild(gostergeBtn);
}

function getLigRozeti(kazanilanOyunSayisi, misafirMi = false) {
    if (misafirMi) return { metin: "DENEME HESABI", renk: "#7f8c8d", yaziRenk: "#fff" };
    if (kazanilanOyunSayisi < 10) return { metin: "🥉 BRONZ LİG", renk: "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)", yaziRenk: "#fff" };
    if (kazanilanOyunSayisi < 50) return { metin: "🥈 GÜMÜŞ LİG", renk: "linear-gradient(180deg, #e0e0e0 0%, #9e9e9e 100%)", yaziRenk: "#000" };
    if (kazanilanOyunSayisi < 100) return { metin: "🥇 ALTIN LİG", renk: "linear-gradient(180deg, #f2d94c 0%, #d4af37 100%)", yaziRenk: "#000" };
    return { metin: "💎 ELMAS LİG", renk: "linear-gradient(180deg, #00d2ff 0%, #3a7bd5 100%)", yaziRenk: "#fff" };
}

// 🔥 FIREBASE BAĞLANTISI VE GİRİŞ (AUTH) KONTROLLERİ 🔥
const firebaseConfig = {
  apiKey: "AIzaSyDZ2VhlFEtpT4kpvJn0TbCwbot8QB3MJGg",
  authDomain: "okeyoyunu-41321.firebaseapp.com",
  projectId: "okeyoyunu-41321",
  storageBucket: "okeyoyunu-41321.firebasestorage.app",
  messagingSenderId: "472848132493",
  appId: "1:472848132493:web:d104317f6398b5a3adf5c4"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

auth.onAuthStateChanged((user) => {
    if (user && !aktifKullaniciAdi) {
        db.collection("kullanicilar").doc(user.uid).get().then(doc => {
            let kayitliNick = ""; let bugun = new Date().toLocaleDateString('tr-TR');
            if(doc.exists && doc.data().isim) {
                kayitliNick = doc.data().isim;
                benimAnlikCipim = doc.data().cip !== undefined ? doc.data().cip : 250000;
                if(isNaN(benimAnlikCipim) || benimAnlikCipim === null) benimAnlikCipim = 0;
                benimEnvanterim = doc.data().envanter || [];
                aktifKozmetikler = doc.data().aktifKozmetikler || [];
                sonBonusTarihim = doc.data().sonBonusTarihi || "";
                benimArkadaslarim = doc.data().arkadaslar || []; 
                benimKazanilanOyun = doc.data().kazanilanOyun || 0; 
                if(doc.data().gorevler) {
                    benimGorevler = doc.data().gorevler;
                    if(benimGorevler.tarih !== bugun) { benimGorevler = { kazanma: 0, mesaj: 0, gosterge: 0, tarih: bugun, alinanlar: {} }; }
                } else { benimGorevler = { kazanma: 0, mesaj: 0, gosterge: 0, tarih: bugun, alinanlar: {} }; }
            } else {
                kayitliNick = user.email ? user.email.split('@')[0].toUpperCase() : "OYUNCU"; 
                benimAnlikCipim = 250000; benimKazanilanOyun = 0;
                benimGorevler = { kazanma: 0, mesaj: 0, gosterge: 0, tarih: bugun, alinanlar: {} };
                db.collection("kullanicilar").doc(user.uid).set({ 
                    isim: kayitliNick, cip: 250000, envanter: [], aktifKozmetikler: [], sonBonusTarihi: "", arkadaslar: [], oynananOyun: 0, kazanilanOyun: 0, gorevler: benimGorevler
                });
            }
            isMisafir = false; document.getElementById('misafirUyariBanner').style.display = 'none';
            const btn = document.getElementById('btnGiris'); if(btn) { btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1"; }
            oyunaGirisYap(kayitliNick); arayuzGuncelle(); gunlukBonusKontrol();
        }).catch(err => {
            console.log("Otomatik giriş başarısız", err); ozelUyariGoster("Veritabanı yanıt vermedi. Lütfen sayfayı yenileyin.");
            const btn = document.getElementById('btnGiris'); if(btn) { btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1"; }
        });
    }
});

// 🔥 İŞTE GİRİŞ YAP BUTONUNUN KALBİ BURASI 🔥
document.getElementById('btnGiris').addEventListener('click', () => {
    const btn = document.getElementById('btnGiris');
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authSifre').value;
    if(!email || !pass) { ozelUyariGoster("Lütfen e-posta ve şifrenizi girin!"); return; }
    btn.disabled = true; btn.innerText = "GİRİŞ YAPILIYOR... ⏳"; btn.style.opacity = "0.7";
    auth.signInWithEmailAndPassword(email, pass).catch(error => { 
        ozelUyariGoster("Giriş Başarısız. E-posta veya şifre yanlış."); 
        btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1"; 
    });
});

document.getElementById('btnGecisKayit').addEventListener('click', () => { document.getElementById('authBaslik').innerText = "YENİ HESAP OLUŞTUR"; document.getElementById('authAltMetin').innerText = "Milyonların arasına katılmak için efsanevi nickini seç!"; document.getElementById('authKullaniciAdi').style.display = 'block'; document.getElementById('loginButonlari').style.display = 'none'; document.getElementById('kayitButonlari').style.display = 'block'; document.getElementById('authEmail').value = ''; document.getElementById('authSifre').value = ''; });
document.getElementById('btnGecisGiris').addEventListener('click', () => { document.getElementById('authBaslik').innerText = "SERİ OKEY"; document.getElementById('authAltMetin').innerText = "Çiplerini güvende tutmak için kayıt ol veya giriş yap"; document.getElementById('authKullaniciAdi').style.display = 'none'; document.getElementById('loginButonlari').style.display = 'block'; document.getElementById('kayitButonlari').style.display = 'none'; });

document.getElementById('btnMisafir').addEventListener('click', () => { isMisafir = true; const rastgeleId = Math.floor(Math.random() * 9000) + 1000; const misafirIsim = "MİSAFİR_" + rastgeleId; benimAnlikCipim = 20000; benimKazanilanOyun = 0; benimEnvanterim = []; aktifKozmetikler = []; benimArkadaslarim = []; sonBonusTarihim = new Date().toLocaleDateString('tr-TR'); document.getElementById('misafirUyariBanner').style.display = 'block'; oyunaGirisYap(misafirIsim); arayuzGuncelle(); });

document.getElementById('btnKayitTamamla').addEventListener('click', () => {
    const btn = document.getElementById('btnKayitTamamla'); const nick = document.getElementById('authKullaniciAdi').value.trim().toUpperCase(); const email = document.getElementById('authEmail').value.trim(); const pass = document.getElementById('authSifre').value;
    if(!nick) { ozelUyariGoster("Lütfen kendinize havalı bir Oyuncu Nicki belirleyin!"); return; } if(nick.length < 3) { ozelUyariGoster("Nickiniz en az 3 harf olmalı!"); return; } if(nick.startsWith("MİSAFİR") || nick.startsWith("BOT_")) { ozelUyariGoster("Bu nick sistem tarafından rezerve edilmiştir, lütfen başka bir nick seçin!"); return; } if(!email || !pass) { ozelUyariGoster("Lütfen e-posta ve şifre girin patron!"); return; } if(pass.length < 6) { ozelUyariGoster("Şifre en az 6 haneli olmalı!"); return; }
    btn.disabled = true; btn.innerText = "KAYDEDİLİYOR... ⏳"; btn.style.opacity = "0.7";
    db.collection("kullanicilar").where("isim", "==", nick).get().then((querySnapshot) => {
        if(!querySnapshot.empty) { ozelUyariGoster("Bu nick zaten alınmış patron! Kendine eşsiz başka bir isim bul."); btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; return; }
        auth.createUserWithEmailAndPassword(email, pass).then((userCredential) => {
            db.collection("kullanicilar").doc(userCredential.user.uid).set({ isim: nick, cip: 250000, envanter: [], aktifKozmetikler: [], sonBonusTarihi: "", arkadaslar: [], oynananOyun: 0, kazanilanOyun: 0, gorevler: benimGorevler }).then(() => { auth.signOut().then(() => { ozelUyariGoster("✅ Kayıt Başarılı! Efsanevi nickin ayarlandı.\nŞimdi lütfen e-posta ve şifrenle GİRİŞ YAP."); document.getElementById('btnGecisGiris').click(); document.getElementById('authSifre').value = ''; btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; }); }).catch(dbError => { console.error(dbError); ozelUyariGoster("Veritabanı kayıt hatası."); btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; });
        }).catch(error => { ozelUyariGoster("Sistem Hatası (E-posta kullanımda veya geçersiz): " + error.message); btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; });
    }).catch(err => { console.error(err); ozelUyariGoster("İsim kontrolü yapılamadı."); btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; });
});

function oyunaGirisYap(isim) { 
    aktifKullaniciAdi = isim; 
    document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); 
    authEkrani.style.display = 'none'; 
    vipHeader.style.display = 'flex'; 
    lobiEkrani.style.display = 'flex'; 
    socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); 
}

window.vipMasaKurAksiyon = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar VIP Masa kuramaz! Lütfen kayıt ol patron."); return; }
    let bahisDeger = parseInt(document.getElementById('vipMasaBahis').value);
    let gizliDeger = document.getElementById('vipMasaGizlilik').value === "true";
    if(benimAnlikCipim < bahisDeger) { ozelUyariGoster("⚠️ Bu masayı kurmak için yeterli çipiniz yok patron!"); return; }
    document.getElementById('vipMasaKurPanel').style.display = 'none';
    socket.emit('vip_masa_kur', { sahibi: aktifKullaniciAdi, bahis: bahisDeger, gizli: gizliDeger });
};

window.vipGizlilikDurumuDegistir = function() {
    if(!suAnkiMasam || !suAnkiMasaVIPMi || suAnkiMasaSahibi !== aktifKullaniciAdi) return;
    socket.emit('vip_masa_gizlilik_degis', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
};

socket.on('vip_durum_guncelle', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        suAnkiMasaGizliMi = data.gizli;
        if(btnVipGizlilikTetikle) {
            btnVipGizlilikTetikle.innerText = suAnkiMasaGizliMi ? "🔓 MASAYI HERKESE AÇ" : "🔒 MASAYI KİLİTLE";
            btnVipGizlilikTetikle.style.background = suAnkiMasaGizliMi ? "#2ecc71" : "#ff33aa";
        }
    }
});

socket.on('vip_masa_kapandi', (data) => {
    if(suAnkiMasam === data.masaAdi) { alert("🚨 VIP oda sahibi masadan ayrıldığı için oda kapatıldı!"); masadanAyrilmaIslemi(false); }
});

function gorevleriKaydet() {
    if(auth.currentUser && !isMisafir) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gorevler: benimGorevler }).catch(e=>console.log(e)); }
}

window.gorevleriAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar görev yapamaz! Lütfen kayıt olun."); return; }
    const ekran = document.getElementById('gorevlerEkrani'); if(!ekran) return;
    ekran.style.display = 'flex'; renderGorevler();
}

function renderGorevler() {
    const liste = document.getElementById('gorevListesi'); if(!liste) return;
    liste.innerHTML = '';
    const gorevlerData = [ { id: 'kazanma', baslik: '🏆 Okey Masasında 3 El Kazan', hedef: 3, mevcut: benimGorevler.kazanma, odul: 50000 }, { id: 'mesaj', baslik: '💬 Sohbette 5 Mesaj Gönder', hedef: 5, mevcut: benimGorevler.mesaj, odul: 10000 }, { id: 'gosterge', baslik: '⭐ Oyunda 1 Kere Gösterge Yap', hedef: 1, mevcut: benimGorevler.gosterge, odul: 25000 } ];
    gorevlerData.forEach(g => {
        let yuzde = Math.min(100, (g.mevcut / g.hedef) * 100); let bittiMi = g.mevcut >= g.hedef; let alindiMi = benimGorevler.alinanlar[g.id];
        let btnHtml = '';
        if(alindiMi) { btnHtml = `<button class="satin-al-btn" style="background:#555; color:#999; cursor:not-allowed;" disabled>ALINDI</button>`; } else if(bittiMi) { btnHtml = `<button class="satin-al-btn" style="background:#2ecc71; color:#fff;" onclick="gorevOduluAl('${g.id}', ${g.odul})">🎁 ${g.odul.toLocaleString()} ÇİP AL</button>`; } else { btnHtml = `<div style="font-size:12px; color:#f2c94c; font-weight:bold; text-align:center; padding:10px 0;">İlerleme: ${g.mevcut} / ${g.hedef}</div>`; }
        liste.innerHTML += `<div style="background:rgba(0,0,0,0.5); border:1px solid #52796f; border-radius:10px; padding:15px; margin-bottom:10px;"><h3 style="color:#fff; font-size:14px; margin-bottom:10px;">${g.baslik}</h3><div style="background:#111; width:100%; height:10px; border-radius:5px; margin-bottom:10px; overflow:hidden;"><div style="background:#2ecc71; width:${yuzde}%; height:100%; transition: width 0.5s;"></div></div>${btnHtml}</div>`;
    });
}

window.gorevOduluAl = function(id, miktar) {
    if(benimGorevler.alinanlar[id]) return; benimGorevler.alinanlar[id] = true; gorevleriKaydet();
    benimAnlikCipim += miktar; const cipKutu = document.getElementById('benimCipim');
    if(cipKutu) { cipKutu.innerText = benimAnlikCipim.toLocaleString('tr-TR'); cipKutu.style.color = "#2ecc71"; setTimeout(() => cipKutu.style.color = "", 2000); }
    if(auth.currentUser && !isMisafir) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim }); }
    socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler });
    ozelUyariGoster(`🎉 Görev tamamlandı! ${miktar.toLocaleString()} ÇİP hesabına eklendi!`); renderGorevler();
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
        if(oyuncu === aktifKullaniciAdi || oyuncu.startsWith('Bot_') || oyuncu.startsWith('MisafirBot_')) return; 
        onlineSayisi++;
        let kozmetikler = globalKozmetikler[oyuncu] || [];
        let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff';
        let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';
        let davetButonu = `<button class="btn-davet-et" style="background:#2ecc71; border:none; padding:6px 12px; border-radius:5px; color:#111; font-weight:bold; cursor:pointer;" onclick="masayaDavetEt('${oyuncu}')">Davet Et</button>`;
        listeDiv.innerHTML += `<div class="lider-satir" style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.5); padding:10px; border-radius:8px; margin-bottom:5px;"><div style="color:${isimRenk}; font-weight:bold;"><span class="online-nokta"></span> ${tac}${oyuncu}</div>${davetButonu}</div>`;
    });

    if(onlineSayisi === 0) {
        listeDiv.innerHTML += '<p style="text-align:center; color:#777; font-size:12px;">Şu an aktif başka oyuncu yok.</p>';
    }
};

window.profiliGoster = function(hedefIsim) {
    if(!hedefIsim || hedefIsim === "" || hedefIsim === "Bekleniyor...") {
        if(suAnkiMasam && !izleyiciModu) davetMenusuAc(); 
        return;
    }
    
    const pAvatar = document.getElementById('profilAvatarAlan'); const pIsim = document.getElementById('profilIsim'); const pOynanan = document.getElementById('profilOynanan'); const pKazanilan = document.getElementById('profilKazanilan'); const pCip = document.getElementById('profilCip'); const kazanmaOrani = document.getElementById('profilKazanmaOrani'); const pDurum = document.getElementById('profilDurumBadge'); const pArkadasBtn = document.getElementById('profilArkadasBtn'); const pDavetBtn = document.getElementById('profilDavetBtn'); const pLigBadge = document.getElementById('profilLigBadge'); const pUnvanBadge = document.getElementById('profilUnvanBadge'); const firlatAlani = document.getElementById('profilEsyaFirlatAlani');
    
    document.getElementById('profilEkrani').style.display = 'flex';
    pArkadasBtn.dataset.hedef = hedefIsim; pDavetBtn.dataset.hedef = hedefIsim;

    let isOnline = onlineOyuncularListesi.includes(hedefIsim) || hedefIsim === aktifKullaniciAdi;
    let masadaMi = false;
    ['seatRight', 'seatTop', 'seatLeft'].forEach(id => { let el = document.getElementById(id); if(el && el.dataset.isim === hedefIsim) masadaMi = true; });

    if (firlatAlani) { if (suAnkiMasam && masadaMi && hedefIsim !== aktifKullaniciAdi && !izleyiciModu) { firlatAlani.style.display = 'flex'; } else { firlatAlani.style.display = 'none'; } }

    if(isOnline) { pDurum.innerText = "🟢 Çevrimiçi"; pDurum.style.color = "#2ecc71"; } else { pDurum.innerText = "🔴 Çevrimdışı"; pDurum.style.color = "#e74c3c"; }

    if (hedefIsim !== aktifKullaniciAdi) {
        pArkadasBtn.style.display = 'block';
        if (benimArkadaslarim.includes(hedefIsim)) { pArkadasBtn.innerText = "❌ Arkadaştan Çıkar"; pArkadasBtn.style.background = "#e74c3c"; } else { pArkadasBtn.innerText = "➕ Arkadaş Ekle"; pArkadasBtn.style.background = ""; }
        if (isOnline) { pDavetBtn.style.display = 'block'; } 
    }

    if(hedefIsim.startsWith("MİSAFİR_")) {
        pIsim.innerText = hedefIsim; pOynanan.innerText = "0"; 
        pKazanilan.innerHTML = `<span style="color:#2ecc71">0</span> <span style="color:#777">/</span> <span style="color:#e74c3c">0</span>`; 
        pCip.innerText = "20.000"; let ligAyar = getLigRozeti(0, true); pLigBadge.innerText = ligAyar.metin; pLigBadge.style.background = ligAyar.renk; pLigBadge.style.color = ligAyar.yaziRenk; pArkadasBtn.style.display = 'none'; pDavetBtn.style.display = (suAnkiMasam && isOnline && !izleyiciModu) ? 'block' : 'none'; return;
    }

    pIsim.innerText = "Yükleniyor..."; pOynanan.innerText = "..."; pKazanilan.innerText = "..."; pCip.innerText = "..."; kazanmaOrani.innerText = "%0"; pAvatar.style.border = '3px solid #52796f'; pAvatar.style.boxShadow = 'none'; pIsim.style.color = '#fff'; pIsim.style.textShadow = 'none'; pUnvanBadge.style.display = 'none'; pLigBadge.innerText = "Yükleniyor..."; pLigBadge.style.background = "#333";

    db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then((querySnapshot) => {
        if(!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data(); let kozmetikler = data.aktifKozmetikler || []; let tac = kozmetikler.includes('neon_tac') ? "👑 " : ""; pIsim.innerHTML = tac + data.isim; pIsim.style.color = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff'; pIsim.style.textShadow = kozmetikler.includes('atesli_isim') ? '0 0 8px #ff0000' : 'none';
            if (kozmetikler.includes('atesli_isim')) { pUnvanBadge.innerText = "🔥 ATEŞ USTASI"; pUnvanBadge.style.display = "inline-block"; } else if (kozmetikler.includes('neon_tac')) { pUnvanBadge.innerText = "👑 OKEY KRALI"; pUnvanBadge.style.display = "inline-block"; }
            if(kozmetikler.includes('altin_cerceve')) { pAvatar.style.border = '3px solid #f2c94c'; pAvatar.style.boxShadow = '0 0 15px #f2c94c'; }
            
            let oynanan = data.oynananOyun || 0; let kazanilan = data.kazanilanOyun || 0; let kaybedilen = Math.max(0, oynanan - kazanilan);
            let oran = oynanan > 0 ? Math.round((kazanilan / oynanan) * 100) : 0; 
            pOynanan.innerText = oynanan; pKazanilan.innerHTML = `<span style="color:#2ecc71; font-weight:900;">${kazanilan}</span> <span style="color:#777">/</span> <span style="color:#e74c3c; font-weight:900;">${kaybedilen}</span>`;
            kazanmaOrani.innerText = "%" + oran; let gorunenCip = Number(data.cip); if(isNaN(gorunenCip)) gorunenCip = 0; pCip.innerText = gorunenCip.toLocaleString('tr-TR'); let ligAyar = getLigRozeti(kazanilan, false); pLigBadge.innerText = ligAyar.metin; pLigBadge.style.background = ligAyar.renk; pLigBadge.style.color = ligAyar.yaziRenk;
        } else { 
            let hash = 0;
            for (let i = 0; i < hedefIsim.length; i++) { hash = hedefIsim.charCodeAt(i) + ((hash << 5) - hash); }
            hash = Math.abs(hash);

            let bOynanan = (hash % 1150) + 75; let bOran = (hash % 25) + 38; let bKazanilan = Math.floor(bOynanan * (bOran / 100));
            let bKaybedilen = bOynanan - bKazanilan; let bCip = (hash % 14500000) + 1200000; 

            let bKozmetikler = globalKozmetikler[hedefIsim] || []; 
            let bTac = bKozmetikler.includes('neon_tac') ? "👑 " : "";
            pIsim.innerHTML = bTac + hedefIsim;
            if(bKozmetikler.includes('atesli_isim')) { pIsim.style.color = '#ff4d4d'; pIsim.style.textShadow = '0 0 8px #ff0000'; pUnvanBadge.innerText = "🔥 ATEŞ USTASI"; pUnvanBadge.style.display = "inline-block"; }
            if(bKozmetikler.includes('neon_tac')) { pUnvanBadge.innerText = "👑 OKEY KRALI"; pUnvanBadge.style.display = "inline-block"; }
            if(bKozmetikler.includes('altin_cerceve')) { pAvatar.style.border = '3px solid #f2c94c'; pAvatar.style.boxShadow = '0 0 15px #f2c94c'; }

            pOynanan.innerText = bOynanan; pKazanilan.innerHTML = `<span style="color:#2ecc71; font-weight:900;">${bKazanilan}</span> <span style="color:#777">/</span> <span style="color:#e74c3c; font-weight:900;">${bKaybedilen}</span>`; kazanmaOrani.innerText = "%" + bOran; pCip.innerText = bCip.toLocaleString('tr-TR');
            let bLigAyar = getLigRozeti(bKazanilan, false); pLigBadge.innerText = bLigAyar.metin; pLigBadge.style.background = bLigAyar.renk; pLigBadge.style.color = bLigAyar.yaziRenk;
        }
    }).catch(err => { pIsim.innerText = "Bağlantı Hatası"; });
};

window.profilArkadasAksiyon = function() {
    const btn = document.getElementById('profilArkadasBtn'); const hedef = btn.dataset.hedef; if (!hedef || isMisafir) return;
    if (benimArkadaslarim.includes(hedef)) { 
        if(confirm(`${hedef} adlı kişiyi arkadaş listenden çıkarmak istediğine emin misin?`)) {
            benimArkadaslarim = benimArkadaslarim.filter(n=>n!==hedef); 
            btn.innerText = "➕ Arkadaş Ekle"; 
            btn.style.background = "";
            ozelUyariGoster(`❌ ${hedef} arkadaş listenden çıkarıldı.`);
            if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }); 
            arayuzGuncelle();
            document.getElementById('profilEkrani').style.display='none'; 
        }
    } else { 
        arkadasEkle(hedef); 
        document.getElementById('profilEkrani').style.display='none'; 
    } 
};

window.esyaFirlatAksiyon = function(esyaIcon) {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar eşya fırlatamaz!"); return; }
    const hedef = document.getElementById('profilArkadasBtn').dataset.hedef;
    if(!hedef || !suAnkiMasam || hedef === aktifKullaniciAdi) return;
    if(benimAnlikCipim < 5000) { ozelUyariGoster("⚠️ Bunun için 5.000 ÇİP lazım patron!"); return; }
    socket.emit('esya_firlat', { masaAdi: suAnkiMasam, kimden: aktifKullaniciAdi, kime: hedef, esya: esyaIcon });
    document.getElementById('profilEkrani').style.display = 'none';
};

socket.on('esya_firlatildi', (data) => {
    if(data.masaAdi !== suAnkiMasam) return;
    let senderEl = null; let receiverEl = null;
    ['benimAdimKutusu', 'seatRight', 'seatTop', 'seatLeft'].forEach(id => {
        const el = document.getElementById(id); if(!el) return;
        let isim = id === 'benimAdimKutusu' ? (izleyiciModu ? el.dataset.isim : aktifKullaniciAdi) : el.dataset.isim;
        if(isim === data.kimden) senderEl = el; if(isim === data.kime) receiverEl = el;
    });

    if(senderEl && receiverEl) {
        const sRect = senderEl.getBoundingClientRect(); const rRect = receiverEl.getBoundingClientRect(); const ucanEsya = document.createElement('div');
        ucanEsya.innerText = data.esya; ucanEsya.style.position = 'fixed'; ucanEsya.style.left = sRect.left + (sRect.width/2) + 'px'; ucanEsya.style.top = sRect.top + (sRect.height/2) + 'px'; ucanEsya.style.fontSize = '45px'; ucanEsya.style.zIndex = '999999'; ucanEsya.style.transition = 'all 1s cubic-bezier(0.25, 1, 0.5, 1)'; ucanEsya.style.pointerEvents = 'none'; ucanEsya.style.filter = 'drop-shadow(0px 10px 10px rgba(0,0,0,0.5))'; document.body.appendChild(ucanEsya);
        setTimeout(() => { ucanEsya.style.left = rRect.left + (rRect.width/2) - 20 + 'px'; ucanEsya.style.top = rRect.top + (rRect.height/2) - 20 + 'px'; ucanEsya.style.transform = 'scale(1.5) rotate(360deg)'; }, 50);
        setTimeout(() => { ucanEsya.remove(); }, 1050);
    }
});

window.profilDavetAksiyon = function() {
    const btn = document.getElementById('profilDavetBtn'); const hedef = btn.dataset.hedef; if (!hedef || !suAnkiMasam) return;
    socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: hedef, masaAdi: suAnkiMasam }); ozelUyariGoster(`💌 ${hedef} adlı oyuncuya davet gönderildi!`); document.getElementById('profilEkrani').style.display = 'none';
};

// --- BÖLÜM 2 BAŞLANGICI BURADA OLACAK --- //
function masadanAyrilmaIslemi(cezaUygulansinMi = false) {
    if (suAnkiMasam) { socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); }
    suAnkiMasam = null; izleyiciModu = false; masayiTemizle();
    
    // MASADAN KALKTIĞINDA İSTAKA VE TUŞLAR GERİ GELSİN DİYE YAZILDI
    try { 
        document.querySelector('.istaka-container').style.display = 'flex'; 
        document.querySelector('.okey-istaka-tuslar-area').style.display = 'flex';
    } catch(e) {}
    
    masaEkrani.style.display = 'none'; lobiEkrani.style.display = 'flex'; arayuzGuncelle();
}

window.cezaAnladimKapat = function() { 
    try { document.getElementById('cezaBildirimEkrani').style.display = 'none'; } catch(e){} 
    if(cikisIcinBekleyenLogout) { tamamenCikisYap(); } 
}

window.tamamenCikisYap = function() { auth.signOut().then(() => window.location.reload()).catch(() => window.location.reload()); };
document.getElementById('btnCikisYap').addEventListener('click', () => { if (suAnkiMasam) socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); tamamenCikisYap(); });
const lobiyeDonBtn = document.getElementById('lobiyeDonBtn'); lobiyeDonBtn.addEventListener('click', () => masadanAyrilmaIslemi(false));

window.liderlikTablosunuAc = function() { document.getElementById('liderlikEkrani').style.display = 'flex'; socket.emit('liderlik_tablosu_iste'); };
socket.on('liderlik_tablosu_guncelle', (list) => {
    const div = document.getElementById('liderlikListesi'); div.innerHTML = '';
    list.forEach((o, i) => { div.innerHTML += `<div class="lider-satir" onclick="profiliGoster('${o.isim}')"><div class="lider-sira">${i+1}.</div><div class="lider-isim">${o.isim}</div><div class="lider-cip">${Number(o.cip).toLocaleString()} ÇİP</div></div>`; });
});

socket.on('online_oyuncular', (liste) => {
    onlineOyuncularListesi = liste; const lobiDiv = document.getElementById('lobidekilerListesi'); if(!lobiDiv) return; lobiDiv.innerHTML = '';
    liste.forEach(o => { if(o !== aktifKullaniciAdi) lobiDiv.innerHTML += `<div class="lobi-oyuncu-satir"><span class="lobi-oyuncu-isim" onclick="profiliGoster('${o}')">🟢 ${o}</span><button class="btn-arkadas-ekle" onclick="arkadasEkle('${o}')">+ Ekle</button></div>`; });
});

window.masayaDavetEt = function(n) { socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: n, masaAdi: suAnkiMasam }); document.getElementById('arkadaslarEkrani').style.display = 'none'; };
window.masayiIzle = function(m) { socket.emit('masayi_izle', { isim: aktifKullaniciAdi, masaAdi: m }); };

socket.on('izleyici_olarak_katildin', (data) => {
    masayiTemizle(); suAnkiMasam = data.masaAdi; izleyiciModu = true; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex';
    document.getElementById('masaOrtasiYazi').innerHTML = data.masaAdi.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>";
    document.querySelector('.istaka-container').style.display = 'none'; document.querySelector('.okey-istaka-tuslar-area').style.display = 'none'; oyunuBaslatBtn.style.display = 'none';
    if(data.oyunBasladi) { masaOyunBasladiMi = true; oyunAlanObjeleri.style.display = 'flex'; kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; } }
    gelişmişKoltukHizala(data.koltuklar);
});

socket.on('sen_masadasin', (data) => { masayiTemizle(); suAnkiMasam = data.masaAdi || data; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; document.getElementById('masaOrtasiYazi').innerHTML = suAnkiMasam.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>"; socket.emit('masaya_geri_don', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); });

socket.on('masalari_guncelle', (lobidekiMasalar) => {
    guncelMasalar = lobidekiMasalar; if(!masalarAlani) return; masalarAlani.innerHTML = '';
    Object.entries(lobidekiMasalar).forEach(([masaAdi, koltuklar]) => {
        const dolu = koltuklar.filter(k => k !== null).length; const benVarim = koltuklar.includes(aktifKullaniciAdi);
        const action = benVarim ? `masayaGeriDon('${masaAdi}')` : `masayaOtur('${masaAdi}')`; const txt = benVarim ? 'OTURDUN ✓' : (dolu>=4 ? 'DOLU' : 'OTUR');
        let izleBtn = !benVarim ? `<button class="btn-izle" onclick="masayiIzle('${masaAdi}')">👁️ İZLE</button>` : '';
        masalarAlani.innerHTML += `<div class="masa-kart"><div class="kart-sol">🎲 ${masaAdi}</div><div class="kart-sag"><div style="display:flex; gap:8px;">${izleBtn}<button class="btn-otur" onclick="${action}">${txt}</button></div></div></div>`;
        if(benVarim) gelişmişKoltukHizala(koltuklar);
    });
});

window.masayaOtur = function(m) { suAnkiMasam = m; socket.emit('masaya_otur', { isim: aktifKullaniciAdi, masaAdi: m }); };
window.masayaGeriDon = function(m) { suAnkiMasam = m; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; socket.emit('masaya_geri_don', { masaAdi: m, isim: aktifKullaniciAdi }); };

socket.on('masa_oyun_basladi', (data) => { if(suAnkiMasam === data.masaAdi) { masayiTemizle(); masaOyunBasladiMi = true; oyunuBaslatBtn.style.display = 'none'; oyunAlanObjeleri.style.display = 'flex'; bitisAlani.style.display = 'flex'; kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; } gelişmişKoltukHizala(data.koltuklar); } });
socket.on('taslari_al', (data) => { if (data.kime === aktifKullaniciAdi && !izleyiciModu) { data.taslar.forEach((t, i) => tasEkle(t, 'y'+i)); } });
socket.on('tas_cekildi', (t) => { if(!izleyiciModu) { for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { tasEkle(t, 'y'+i); break; } } } });

function tasEkle(tasData, yuvaId) { const div = document.createElement('div'); div.className = `okey-tasi tas-${tasData.renk}`; div.innerText = tasData.sayi; div.id = tasData.id; div.ondblclick = function() { otomatikTasAt(this); }; document.getElementById(yuvaId).appendChild(div); }

socket.on('sira_guncelle', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        benimSiramMi = (!izleyiciModu && data.kimde === aktifKullaniciAdi); if(benimSiramMi) sesCal(sesSiraSende);
        let bName = izleyiciModu ? document.getElementById('benimAdimKutusu').dataset.isim : aktifKullaniciAdi;
        const koltuklar = [ { id: 'benimAdimKutusu', isim: bName }, { id: 'seatRight', isim: document.getElementById('seatRight').dataset.isim }, { id: 'seatTop', isim: document.getElementById('seatTop').dataset.isim }, { id: 'seatLeft', isim: document.getElementById('seatLeft').dataset.isim } ];
        koltuklar.forEach(k => { const el = document.getElementById(k.id); if(el) { if(k.isim === data.kimde && k.isim !== "") el.classList.add('aktif-sira'); else el.classList.remove('aktif-sira'); } });
    }
});

function gelişmişKoltukHizala(koltuklar) {
    let idx = koltuklar.indexOf(aktifKullaniciAdi); if(idx === -1) idx = 0;
    document.getElementById('benimAdimKutusu').innerText = koltuklar[idx] || "Boş";
    document.getElementById('seatRight').dataset.isim = koltuklar[(idx+1)%4] || ""; document.getElementById('seatRight').innerText = koltuklar[(idx+1)%4] || "➕ DAVET";
    document.getElementById('seatTop').dataset.isim = koltuklar[(idx+2)%4] || ""; document.getElementById('seatTop').innerText = koltuklar[(idx+2)%4] || "➕ DAVET";
    document.getElementById('seatLeft').dataset.isim = koltuklar[(idx+3)%4] || ""; document.getElementById('seatLeft').innerText = koltuklar[(idx+3)%4] || "➕ DAVET";
}

function masayiTemizle() { masaOyunBasladiMi = false; oyunuBaslatBtn.style.display = 'block'; oyunAlanObjeleri.style.display = 'none'; for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; }
window.seriDiz = function() { ozelUyariGoster("Taşlar dizildi!"); }; window.ciftDiz = function() { ozelUyariGoster("Çift dizildi!"); };
function kurtarmaSinyaliGonder() {} function checkGosterge() {} function elimdekiTasSayisi() { return 14; } function getIstakaGruplari() { return []; } function otomatikTasAt(e){}
