const socket = io();
let aktifKullaniciAdi = ""; 
let suAnkiMasam = null; 
let benimSiramMi = false;
let guncelMasalar = {}; 
let gostergeHakki = false; 

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

const sesTasCek = new Audio('sounds/tas_cek.mp3');
const sesTasKoy = new Audio('sounds/tas_koy.mp3');
const sesSiraSende = new Audio('sounds/sira_sende.mp3');

sesTasCek.preload = 'auto'; sesTasKoy.preload = 'auto'; sesSiraSende.preload = 'auto';
function sesCal(sesObje) { try { let yeniSes = sesObje.cloneNode(); yeniSes.volume = 0.5; yeniSes.play().catch(e => console.log(e)); } catch(err) {} }

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

window.ozelUyariGoster = function(mesaj) {
    document.getElementById('uyariModalMetni').innerText = mesaj;
    document.getElementById('uyariModalEkrani').style.display = 'flex';
};

function getLigRozeti(kazanilanOyunSayisi, misafirMi = false) {
    if (misafirMi) return { metin: "DENEME HESABI", renk: "#7f8c8d", yaziRenk: "#fff" };
    if (kazanilanOyunSayisi < 10) return { metin: "🥉 BRONZ LİG", renk: "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)", yaziRenk: "#fff" };
    if (kazanilanOyunSayisi < 50) return { metin: "🥈 GÜMÜŞ LİG", renk: "linear-gradient(180deg, #e0e0e0 0%, #9e9e9e 100%)", yaziRenk: "#000" };
    if (kazanilanOyunSayisi < 100) return { metin: "🥇 ALTIN LİG", renk: "linear-gradient(180deg, #f2d94c 0%, #d4af37 100%)", yaziRenk: "#000" };
    return { metin: "💎 ELMAS LİG", renk: "linear-gradient(180deg, #00d2ff 0%, #3a7bd5 100%)", yaziRenk: "#fff" };
}

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

// İŞTE BURASI: Boş koltuğa tıklayınca online listeyi açıp kolayca davet etmeni sağlar!
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
        if(oyuncu === aktifKullaniciAdi || oyuncu.startsWith('Bot_')) return; 
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
        if(suAnkiMasam) davetMenusuAc(); 
        return;
    }
    
    const pAvatar = document.getElementById('profilAvatarAlan'); const pIsim = document.getElementById('profilIsim'); const pOynanan = document.getElementById('profilOynanan'); const pKazanilan = document.getElementById('profilKazanilan'); const pCip = document.getElementById('profilCip'); const kazanmaOrani = document.getElementById('profilKazanmaOrani'); const pDurum = document.getElementById('profilDurumBadge'); const pArkadasBtn = document.getElementById('profilArkadasBtn'); const pDavetBtn = document.getElementById('profilDavetBtn'); const pLigBadge = document.getElementById('profilLigBadge'); const pUnvanBadge = document.getElementById('profilUnvanBadge'); const firlatAlani = document.getElementById('profilEsyaFirlatAlani');
    const profilDmBtn = document.getElementById('profilDmBtn'); // YENİ: DM Butonu
    
    document.getElementById('profilEkrani').style.display = 'flex';
    pArkadasBtn.dataset.hedef = hedefIsim; pDavetBtn.dataset.hedef = hedefIsim;

    let isOnline = onlineOyuncularListesi.includes(hedefIsim) || hedefIsim === aktifKullaniciAdi;
    let masadaMi = false;
    ['seatRight', 'seatTop', 'seatLeft'].forEach(id => { let el = document.getElementById(id); if(el && el.dataset.isim === hedefIsim) masadaMi = true; });

    if (firlatAlani) { if (suAnkiMasam && masadaMi && hedefIsim !== aktifKullaniciAdi) { firlatAlani.style.display = 'flex'; } else { firlatAlani.style.display = 'none'; } }

    if(hedefIsim.startsWith("Bot_")) {
        pIsim.innerText = hedefIsim; pOynanan.innerText = "999+"; pKazanilan.innerText = "999+"; pCip.innerText = "Sınırsız"; kazanmaOrani.innerText = "%100"; pDurum.innerText = "🟢 Çevrimiçi"; pDurum.style.color = "#2ecc71"; pLigBadge.innerText = "🤖 SİSTEM BOTU"; pLigBadge.style.background = "#555"; pArkadasBtn.style.display = 'none'; pDavetBtn.style.display = 'none'; pUnvanBadge.style.display = 'none'; profilDmBtn.style.display = 'none'; pAvatar.style.border = '3px solid #52796f'; pAvatar.style.boxShadow = 'none'; pIsim.style.color = '#fff'; pIsim.style.textShadow = 'none'; return;
    }

    if(isOnline) { pDurum.innerText = "🟢 Çevrimiçi"; pDurum.style.color = "#2ecc71"; } else { pDurum.innerText = "🔴 Çevrimdışı"; pDurum.style.color = "#e74c3c"; }

    if (hedefIsim !== aktifKullaniciAdi && !isMisafir && !hedefIsim.startsWith("MİSAFİR_")) {
        pArkadasBtn.style.display = 'block';
        profilDmBtn.style.display = 'block'; // YENİ: Başkasıysa DM atabilirsin
        if (benimArkadaslarim.includes(hedefIsim)) { pArkadasBtn.innerText = "❌ Arkadaştan Çıkar"; pArkadasBtn.style.background = "#e74c3c"; } else { pArkadasBtn.innerText = "➕ Arkadaş Ekle"; pArkadasBtn.style.background = ""; }
        if (isOnline) { pDavetBtn.style.display = 'block'; } 
    } else {
        profilDmBtn.style.display = 'none';
        pDavetBtn.style.display = 'none';
    }

    if(hedefIsim.startsWith("MİSAFİR_")) {
        pIsim.innerText = hedefIsim; pOynanan.innerText = "0"; pKazanilan.innerText = "0"; pCip.innerText = "20.000"; let ligAyar = getLigRozeti(0, true); pLigBadge.innerText = ligAyar.metin; pLigBadge.style.background = ligAyar.renk; pLigBadge.style.color = ligAyar.yaziRenk; pArkadasBtn.style.display = 'none'; return;
    }

    pIsim.innerText = "Yükleniyor..."; pOynanan.innerText = "..."; pKazanilan.innerText = "..."; pCip.innerText = "..."; kazanmaOrani.innerText = "%0"; pAvatar.style.border = '3px solid #52796f'; pAvatar.style.boxShadow = 'none'; pIsim.style.color = '#fff'; pIsim.style.textShadow = 'none'; pUnvanBadge.style.display = 'none'; pLigBadge.innerText = "Yükleniyor..."; pLigBadge.style.background = "#333";

    db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then((querySnapshot) => {
        if(!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data(); let kozmetikler = data.aktifKozmetikler || []; let tac = kozmetikler.includes('neon_tac') ? "👑 " : ""; pIsim.innerHTML = tac + data.isim; pIsim.style.color = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff'; pIsim.style.textShadow = kozmetikler.includes('atesli_isim') ? '0 0 8px #ff0000' : 'none';
            if (kozmetikler.includes('atesli_isim')) { pUnvanBadge.innerText = "🔥 ATEŞ USTASI"; pUnvanBadge.style.display = "inline-block"; } else if (kozmetikler.includes('neon_tac')) { pUnvanBadge.innerText = "👑 OKEY KRALI"; pUnvanBadge.style.display = "inline-block"; }
            if(kozmetikler.includes('altin_cerceve')) { pAvatar.style.border = '3px solid #f2c94c'; pAvatar.style.boxShadow = '0 0 15px #f2c94c'; }
            let oynanan = data.oynananOyun || 0; let kazanilan = data.kazanilanOyun || 0; let oran = oynanan > 0 ? Math.round((kazanilan / oynanan) * 100) : 0; pOynanan.innerText = oynanan; pKazanilan.innerText = kazanilan; kazanmaOrani.innerText = "%" + oran; let gorunenCip = Number(data.cip); if(isNaN(gorunenCip)) gorunenCip = 0; pCip.innerText = gorunenCip.toLocaleString('tr-TR'); let ligAyar = getLigRozeti(kazanilan, false); pLigBadge.innerText = ligAyar.metin; pLigBadge.style.background = ligAyar.renk; pLigBadge.style.color = ligAyar.yaziRenk;
        } else { pIsim.innerText = hedefIsim; pOynanan.innerText = "Gizli"; pKazanilan.innerText = "Gizli"; pCip.innerText = "Gizli"; }
    }).catch(err => { pIsim.innerText = "Bağlantı Hatası"; });
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
        let isim = id === 'benimAdimKutusu' ? aktifKullaniciAdi : el.dataset.isim;
        if(isim === data.kimden) senderEl = el; if(isim === data.kime) receiverEl = el;
    });

    if(senderEl && receiverEl) {
        const sRect = senderEl.getBoundingClientRect(); const rRect = receiverEl.getBoundingClientRect(); const ucanEsya = document.createElement('div');
        ucanEsya.innerText = data.esya; ucanEsya.style.position = 'fixed'; ucanEsya.style.left = sRect.left + (sRect.width/2) + 'px'; ucanEsya.style.top = sRect.top + (sRect.height/2) + 'px'; ucanEsya.style.fontSize = '45px'; ucanEsya.style.zIndex = '999999'; ucanEsya.style.transition = 'all 1s cubic-bezier(0.25, 1, 0.5, 1)'; ucanEsya.style.pointerEvents = 'none'; ucanEsya.style.filter = 'drop-shadow(0px 10px 10px rgba(0,0,0,0.5))'; document.body.appendChild(ucanEsya);
        setTimeout(() => { ucanEsya.style.left = rRect.left + (rRect.width/2) - 20 + 'px'; ucanEsya.style.top = rRect.top + (rRect.height/2) - 20 + 'px'; ucanEsya.style.transform = 'scale(1.5) rotate(360deg)'; }, 50);
        setTimeout(() => { ucanEsya.remove(); }, 1050);
    }
});

window.profilArkadasAksiyon = function() {
    const btn = document.getElementById('profilArkadasBtn'); const hedef = btn.dataset.hedef; if (!hedef || isMisafir) return;
    if (benimArkadaslarim.includes(hedef)) { benimArkadaslarim = benimArkadaslarim.filter(name => name !== hedef); btn.innerText = "➕ Arkadaş Ekle"; btn.style.background = ""; ozelUyariGoster(`❌ ${hedef} arkadaş listenden çıkarıldı.`); } else { benimArkadaslarim.push(hedef); btn.innerText = "❌ Arkadaştan Çıkar"; btn.style.background = "#e74c3c"; ozelUyariGoster(`✅ ${hedef} arkadaş listene eklendi!`); }
    if (auth.currentUser) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }); }
};

window.profilDavetAksiyon = function() {
    const btn = document.getElementById('profilDavetBtn'); const hedef = btn.dataset.hedef; if (!hedef || !suAnkiMasam) return;
    socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: hedef, masaAdi: suAnkiMasam }); ozelUyariGoster(`💌 ${hedef} adlı oyuncuya davet gönderildi!`); document.getElementById('profilEkrani').style.display = 'none';
};

// YENİ: ÖZEL MESAJLAŞMA FONKSİYONLARI
window.dmGondermeEkraniAc = function() {
    const hedef = document.getElementById('profilArkadasBtn').dataset.hedef;
    if (!hedef) return;
    document.getElementById('profilEkrani').style.display = 'none';
    document.getElementById('dmAliciIsim').innerText = hedef;
    document.getElementById('dmMesajIcerik').value = "";
    document.getElementById('dmYazEkrani').style.display = 'flex';
};

window.dmGonderAksiyon = function() {
    const kime = document.getElementById('dmAliciIsim').innerText;
    const mesaj = document.getElementById('dmMesajIcerik').value.trim();
    if(mesaj === "") return;
    
    socket.emit('ozel_mesaj_gonder', { kimden: aktifKullaniciAdi, kime: kime, mesaj: mesaj });
    document.getElementById('dmYazEkrani').style.display = 'none';
    ozelUyariGoster("✉️ Mesajın başarıyla fırlatıldı patron!");
};

document.getElementById('gelenKutusuTetikleyici').addEventListener('click', () => {
    document.getElementById('postaKutusuEkrani').style.display = 'flex';
    socket.emit('mesajlari_okundu_yap', aktifKullaniciAdi);
});

socket.on('yeni_ozel_mesaj_bildirimi', (data) => {
    if(data.kime === aktifKullaniciAdi) {
        socket.emit('posta_kutusu_iste', aktifKullaniciAdi);
    }
});

socket.on('posta_kutusu_verisi', (mesajlar) => {
    const ikon = document.getElementById('gelenKutusuTetikleyici');
    const bildirim = document.getElementById('okunmamisMesajSayisi');
    const liste = document.getElementById('postaListesi');
    
    if(!isMisafir && aktifKullaniciAdi) {
        ikon.style.display = 'flex';
    } else {
        ikon.style.display = 'none';
        return;
    }

    let okunmamis = 0;
    liste.innerHTML = "";

    if (mesajlar.length === 0) {
        liste.innerHTML = '<p style="text-align:center; color:#777; margin-top:20px;">Gelen kutun bomboş patron.</p>';
    } else {
        // En yeni mesaj en üstte
        [...mesajlar].reverse().forEach(m => {
            if(!m.okundu) okunmamis++;
            let bg = m.okundu ? "rgba(0,0,0,0.5)" : "rgba(52, 152, 219, 0.2)";
            let border = m.okundu ? "1px solid #555" : "1px solid #3498db";
            
            liste.innerHTML += `
                <div style="background:${bg}; border:${border}; border-radius:8px; padding:10px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong style="color:#f2c94c; font-size:12px;" onclick="profiliGoster('${m.kimden}')" style="cursor:pointer;">${m.kimden}</strong>
                        <span style="color:#a3c4bc; font-size:10px;">${m.tarih}</span>
                    </div>
                    <div style="color:#fff; font-size:13px; word-break:break-word;">${m.mesaj}</div>
                </div>
            `;
        });
    }

    if (okunmamis > 0) {
        bildirim.style.display = 'flex';
        bildirim.innerText = okunmamis;
    } else {
        bildirim.style.display = 'none';
    }
});

function masadanAyrilmaIslemi(cezaUygulansinMi = false) {
    if (suAnkiMasam) {
        if (cezaUygulansinMi && masaOyunBasladiMi) {
            let cezaMiktari = 0;
            if (suAnkiMasam.includes('20K')) cezaMiktari = 20000; else if (suAnkiMasam.includes('50K')) cezaMiktari = 50000; else if (suAnkiMasam.includes('10K')) cezaMiktari = 10000;
            if (cezaMiktari > 0) {
                benimAnlikCipim -= cezaMiktari; if (benimAnlikCipim < 0) benimAnlikCipim = 0; const cipKutu = document.getElementById('benimCipim'); if(cipKutu) { cipKutu.innerText = benimAnlikCipim.toLocaleString('tr-TR'); cipKutu.style.color = "#e74c3c"; setTimeout(() => cipKutu.style.color = "", 2000); }
                if (auth.currentUser && !isMisafir) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim }); }
                socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); document.getElementById('cezaMiktarMetni').innerText = cezaMiktari.toLocaleString('tr-TR') + " ÇİP"; document.getElementById('cezaBildirimEkrani').style.display = 'flex';
            }
        }
        socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); 
    }
    suAnkiMasam = null; suAnkiMasaVIPMi = false; suAnkiMasaSahibi = ""; suAnkiMasaGizliMi = false; if(btnVipGizlilikTetikle) btnVipGizlilikTetikle.style.display = "none";
    masayiTemizle(); document.getElementById('seatTop').innerText = "Bekleniyor..."; document.getElementById('seatLeft').innerText = "Bekleniyor..."; document.getElementById('seatRight').innerText = "Bekleniyor..."; document.getElementById('seatTop').dataset.isim = ""; document.getElementById('seatLeft').dataset.isim = ""; document.getElementById('seatRight').dataset.isim = ""; masaEkrani.style.display = 'none'; lobiEkrani.style.display = 'flex';
}

window.cezaAnladimKapat = function() { document.getElementById('cezaBildirimEkrani').style.display = 'none'; if(cikisIcinBekleyenLogout) { tamamenCikisYap(); } }

function tamamenCikisYap() { auth.signOut().then(() => { aktifKullaniciAdi = ""; suAnkiMasam = null; masaOyunBasladiMi = false; cikisIcinBekleyenLogout = false; benimKazanilanOyun = 0; document.getElementById('authEkrani').style.display = 'flex'; document.getElementById('lobiEkrani').style.display = 'none'; document.getElementById('masaEkrani').style.display = 'none'; document.querySelector('.vip-header').style.display = 'none'; document.getElementById('cezaBildirimEkrani').style.display = 'none'; document.getElementById('gelenKutusuTetikleyici').style.display = 'none'; document.getElementById('authEmail').value = ''; document.getElementById('authSifre').value = ''; document.getElementById('authKullaniciAdi').value = ''; }); }

document.getElementById('btnCikisYap').addEventListener('click', (e) => { e.stopPropagation(); const cikisOnay = confirm("Hesabınızdan çıkış yapmak istediğinize emin misiniz?"); if(cikisOnay) { if(suAnkiMasam && masaOyunBasladiMi) { cikisIcinBekleyenLogout = true; masadanAyrilmaIslemi(true); } else { if (suAnkiMasam) masadanAyrilmaIslemi(false); tamamenCikisYap(); } } });

const lobiyeDonBtn = document.getElementById('lobiyeDonBtn');
lobiyeDonBtn.addEventListener('click', () => { if (suAnkiMasam && masaOyunBasladiMi) { document.getElementById('cikisUyariEkrani').style.display = 'flex'; } else { masadanAyrilmaIslemi(false); } });
document.getElementById('btnCikisOnayla').addEventListener('click', () => { document.getElementById('cikisUyariEkrani').style.display = 'none'; masadanAyrilmaIslemi(true); });

document.getElementById('btnGecisKayit').addEventListener('click', () => { document.getElementById('authBaslik').innerText = "YENİ HESAP OLUŞTUR"; document.getElementById('authAltMetin').innerText = "Milyonların arasına katılmak için efsanevi nickini seç!"; document.getElementById('authKullaniciAdi').style.display = 'block'; document.getElementById('loginButonlari').style.display = 'none'; document.getElementById('kayitButonlari').style.display = 'block'; document.getElementById('authEmail').value = ''; document.getElementById('authSifre').value = ''; });
document.getElementById('btnGecisGiris').addEventListener('click', () => { document.getElementById('authBaslik').innerText = "VIP CASINO GİRİŞİ"; document.getElementById('authAltMetin').innerText = "Çiplerini güvende tutmak için kayıt ol veya giriş yap"; document.getElementById('authKullaniciAdi').style.display = 'none'; document.getElementById('loginButonlari').style.display = 'block'; document.getElementById('kayitButonlari').style.display = 'none'; });

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

function oyunaGirisYap(isim) { aktifKullaniciAdi = isim; document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); authEkrani.style.display = 'none'; vipHeader.style.display = 'flex'; lobiEkrani.style.display = 'flex'; socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); }

socket.on('sen_masadasin', (data) => {
    masayiTemizle(); 
    suAnkiMasam = data.masaAdi || data; suAnkiMasaVIPMi = data.isVIP || false; suAnkiMasaSahibi = data.sahibi || ""; suAnkiMasaGizliMi = data.gizli || false; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; document.getElementById('masaOrtasiYazi').innerText = suAnkiMasam.toUpperCase();
    if(suAnkiMasaVIPMi && suAnkiMasaSahibi === aktifKullaniciAdi) { if(btnVipGizlilikTetikle) { btnVipGizlilikTetikle.style.display = "block"; btnVipGizlilikTetikle.innerText = suAnkiMasaGizliMi ? "🔓 MASAYI HERKESE AÇ" : "🔒 MASAYI KİLİTLE"; btnVipGizlilikTetikle.style.background = suAnkiMasaGizliMi ? "#2ecc71" : "#ff33aa"; } } else { if(btnVipGizlilikTetikle) btnVipGizlilikTetikle.style.display = "none"; }
    socket.emit('masaya_geri_don', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
});

window.liderlikTablosunuAc = function() {
    document.getElementById('liderlikEkrani').style.display = 'flex'; const listeDiv = document.getElementById('liderlikListesi'); listeDiv.innerHTML = '<p style="text-align:center; color:#f2c94c; font-weight:bold;">Veritabanı taranıyor...</p>';
    db.collection("kullanicilar").orderBy("cip", "desc").limit(5).get().then((querySnapshot) => {
          listeDiv.innerHTML = ''; if(querySnapshot.empty) { listeDiv.innerHTML = '<p style="text-align:center; color:#777;">Henüz sıralama oluşmadı.</p>'; return; }
          let index = 0;
          querySnapshot.forEach((doc) => {
              const oyuncu = doc.data(); if(oyuncu.isim.startsWith('MİSAFİR_')) return; 
              let siraClass = ''; let kupa = ''; if(index === 0) { siraClass = 'sira-1'; kupa = '🏆'; } else if(index === 1) { siraClass = 'sira-2'; kupa = '🥈'; } else if(index === 2) { siraClass = 'sira-3'; kupa = '🥉'; } else { siraClass = ''; kupa = '🏅'; }
              let kozmetikler = oyuncu.aktifKozmetikler || []; let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff'; let isimGolge = kozmetikler.includes('atesli_isim') ? '0 0 5px #ff0000' : 'none'; let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';
              let gCip = Number(oyuncu.cip); if(isNaN(gCip)) gCip = 0;
              listeDiv.innerHTML += `<div class="lider-satir" style="cursor:pointer;" onclick="profiliGoster('${oyuncu.isim}')"><div class="lider-sira ${siraClass}">${index + 1}.</div><div class="lider-isim" style="color:${isimRenk}; text-shadow:${isimGolge};">${kupa} ${tac}${oyuncu.isim}</div><div class="lider-cip">${gCip.toLocaleString('tr-TR')} ÇİP</div></div>`;
              index++;
          });
      }).catch((error) => { console.log(error); listeDiv.innerHTML = '<p style="text-align:center; color:#e74c3c;">Bağlantı hatası.</p>'; });
}

socket.on('online_oyuncular', (liste) => {
    onlineOyuncularListesi = liste; const lobiDiv = document.getElementById('lobidekilerListesi'); if(!lobiDiv) return; lobiDiv.innerHTML = '';
    liste.forEach(oyuncuIsmi => {
        if(oyuncuIsmi === aktifKullaniciAdi) return; 
        let kozmetikler = globalKozmetikler[oyuncuIsmi] || []; let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#0dcaf0'; let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';
        let butonHtml = ''; if(!isMisafir && !oyuncuIsmi.startsWith('MİSAFİR_') && !benimArkadaslarim.includes(oyuncuIsmi)) { butonHtml = `<button class="btn-arkadas-ekle" onclick="arkadasEkle('${oyuncuIsmi}')">+ Ekle</button>`; }
        lobiDiv.innerHTML += `<div class="lobi-oyuncu-satir"><span class="lobi-oyuncu-isim" style="color:${isimRenk}; cursor:pointer;" onclick="profiliGoster('${oyuncuIsmi}')"><span class="online-nokta"></span>${tac}${oyuncuIsmi}</span>${butonHtml}</div>`;
    });
});

window.arkadasEkle = function(isim) { if(isMisafir) return; if(!benimArkadaslarim.includes(isim)) { benimArkadaslarim.push(isim); if(auth.currentUser) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }).then(() => { ozelUyariGoster(`✅ ${isim} arkadaş listene eklendi!`); }); } } }
window.arkadaslarMenusuAc = function() { if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesapların arkadaş listesi kapalıdır."); return; } document.getElementById('arkadaslarEkrani').style.display = 'flex'; const listeDiv = document.getElementById('arkadasListesiDiv'); listeDiv.innerHTML = ''; if(benimArkadaslarim.length === 0) { listeDiv.innerHTML = '<p style="text-align:center; color:#777; font-size:12px;">Henüz hiç arkadaşın yok.</p>'; return; } benimArkadaslarim.forEach(arkadas => { let isOnline = onlineOyuncularListesi.includes(arkadas); let durumNoktasi = isOnline ? '<span class="online-nokta"></span>' : '<span class="offline-nokta"></span>'; let kozmetikler = globalKozmetikler[arkadas] || []; let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff'; let tac = kozmetikler.includes('neon_tac') ? '👑 ' : ''; let davetButonu = ''; if(isOnline && suAnkiMasam) { davetButonu = `<button class="btn-davet-et" onclick="masayaDavetEt('${arkadas}')">📥 Davet Et</button>`; } listeDiv.innerHTML += `<div class="lider-satir" style="cursor:pointer;" onclick="profiliGoster('${arkadas}')"><div class="lider-isim" style="color:${isimRenk};">${durumNoktasi} ${tac}${arkadas}</div>${davetButonu}</div>`; }); }
window.masayaDavetEt = function(arkadasIsmi) { event.stopPropagation(); if(!suAnkiMasam) return; socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: arkadasIsmi, masaAdi: suAnkiMasam }); ozelUyariGoster(`💌 ${arkadasIsmi} adlı oyuncuya davet gönderildi!`); document.getElementById('arkadaslarEkrani').style.display = 'none'; }

socket.on('davet_geldi', (data) => {
    if(data.kime === aktifKullaniciAdi) { 
        const metinEl = document.getElementById('davetMetni');
        if(metinEl) metinEl.innerHTML = `<strong style="color:#ff33aa;">${data.kimden}</strong> seni janjanlı VIP masaya çağırıyor patron!`;
        document.getElementById('davetGeldiEkrani').style.display = 'flex';
        document.getElementById('btnDavetKabul').onclick = function() { 
            document.getElementById('davetGeldiEkrani').style.display = 'none'; 
            if(suAnkiMasam) { socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); suAnkiMasam = null; }
            setTimeout(() => { masayaOtur(data.masaAdi); }, 300);
        };
    }
});

const btnHemenOynalar = document.querySelectorAll('.btn-hemen-oyna');
btnHemenOynalar.forEach(btn => {
    btn.addEventListener('click', () => { 
        if (suAnkiMasam) return; 
        for (const [m, koltuklar] of Object.entries(guncelMasalar)) { if (koltuklar.includes(aktifKullaniciAdi)) { suAnkiMasam = m; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; document.getElementById('masaOrtasiYazi').innerText = m.toUpperCase(); socket.emit('masaya_geri_don', { masaAdi: m, isim: aktifKullaniciAdi }); return; } }
        let musaitMasa = null; 
        for (const [masaAdi, koltuklar] of Object.entries(guncelMasalar)) { if (masaAdi.includes('👑 VIP:')) continue; if (koltuklar.filter(k => k !== null).length < 4) { musaitMasa = masaAdi; break; } } 
        if (musaitMasa) masayaOtur(musaitMasa); else ozelUyariGoster("Şu an tüm genel masalar tam kapasite dolu, patron!"); 
    });
});

socket.on('masalari_guncelle', (lobidekiMasalar) => { 
    guncelMasalar = lobidekiMasalar; if(masalarAlani) masalarAlani.innerHTML = ''; 
    const siraliMasalar = Object.entries(lobidekiMasalar).sort((a, b) => { let aIsVIP = a[0].includes('👑 VIP:'); let bIsVIP = b[0].includes('👑 VIP:'); if(aIsVIP && !bIsVIP) return -1; if(!aIsVIP && bIsVIP) return 1; return 0; });
    for (const [masaAdi, koltuklar] of siraliMasalar) { 
        const doluKoltukSayisi = koltuklar.filter(k => k !== null).length; const benBuMasadaMiyim = koltuklar.includes(aktifKullaniciAdi); 
        const action = benBuMasadaMiyim ? `masayaGeriDon('${masaAdi}')` : `masayaOtur('${masaAdi}')`; const btnMetni = benBuMasadaMiyim ? 'OTURDUN ✓' : (doluKoltukSayisi>=4 ? 'DOLU' : 'OTUR');
        let proStyle = ""; let crownEki = "🎲"; if (masaAdi.includes('👑 VIP:')) { proStyle = "border: 2px solid #ff33aa; box-shadow: 0 0 15px #ff33aa, inset 0 0 10px rgba(255,51,170,0.2); background: linear-gradient(135deg, #160011 0%, #000000 100%);"; crownEki = "👑"; }
        const html = `<div class="masa-kart" style="${proStyle}"><div class="masa-watermark"></div><div class="kart-sol"><div class="zar-kutu">${crownEki}</div><div class="masa-kart-isim">${masaAdi}</div></div><div class="kart-sag"><div class="masa-kisi-kutu">🎲 ${doluKoltukSayisi}/4</div><button class="btn-otur ${benBuMasadaMiyim || doluKoltukSayisi>=4 ? 'disabled':''}" style="${benBuMasadaMiyim ? 'background:#2ecc71;color:#111;':''}" onclick="${action}">${btnMetni}</button></div></div>`; 
        if(masalarAlani) masalarAlani.innerHTML += html; if(benBuMasadaMiyim) gelişmişKoltukHizala(koltuklar); 
    } 
});

window.masayaGeriDon = function(masaAdi) { suAnkiMasam = masaAdi; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; document.getElementById('masaOrtasiYazi').innerText = masaAdi.toUpperCase(); socket.emit('masaya_geri_don', { masaAdi: masaAdi, isim: aktifKullaniciAdi }); };

function gelişmişKoltukHizala(koltuklar) { const index = koltuklar.indexOf(aktifKullaniciAdi); if (index === -1) return; const sR = koltuklar[(index + 1) % 4] || ""; const sT = koltuklar[(index + 2) % 4] || ""; const sL = koltuklar[(index + 3) % 4] || ""; document.getElementById('seatRight').dataset.isim = sR; document.getElementById('seatTop').dataset.isim = sT; document.getElementById('seatLeft').dataset.isim = sL; koltukStiliUygula('seatRight', sR); koltukStiliUygula('seatTop', sT); koltukStiliUygula('seatLeft', sL); }
function koltukStiliUygula(elementId, oyuncuIsmi) { 
    const el = document.getElementById(elementId); 
    if(!oyuncuIsmi) { el.innerHTML = '<span style="color:#2ecc71; font-weight:bold; font-size:13px;">➕ DAVET ET</span>'; el.style.textShadow = "none"; return; }
    if(oyuncuIsmi.startsWith('Bot_')) { el.innerText = oyuncuIsmi; el.style.color = "#0dcaf0"; el.style.textShadow = "none"; return; } 
    let kozmetikler = globalKozmetikler[oyuncuIsmi] || []; let tac = kozmetikler.includes('neon_tac') ? "👑 " : ""; el.innerText = tac + oyuncuIsmi; if(kozmetikler.includes('atesli_isim')) { el.style.color = '#ff4d4d'; el.style.textShadow = '0 0 5px #ff0000'; } else { el.style.color = '#0dcaf0'; el.style.textShadow = 'none'; } 
}

window.masayaOtur = function(masaAdi) { 
    let bahis = 0; if(masaAdi.includes('20K')) bahis = 20000; else if(masaAdi.includes('50K')) bahis = 50000; else if(masaAdi.includes('10K')) bahis = 10000;
    if (benimAnlikCipim < bahis) { ozelUyariGoster("⚠️ Yetersiz Bakiye! Bu masaya oturmak için en az " + bahis.toLocaleString() + " ÇİP gerekiyor."); return; }
    suAnkiMasam = masaAdi; socket.emit('masaya_otur', { isim: aktifKullaniciAdi, masaAdi: masaAdi }); lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; masaOrtasiYazi.innerText = masaAdi.toUpperCase(); 
};

if(oyunuBaslatBtn) oyunuBaslatBtn.addEventListener('click', () => { socket.emit('oyunu_baslat', suAnkiMasam); });

socket.on('cip_guncelle_ozel', (data) => { 
    if(data.isim === aktifKullaniciAdi) {
        if(isNaN(data.cip)) return; benimAnlikCipim = data.cip; const cipKutu = document.getElementById('benimCipim');
        if(cipKutu) { cipKutu.innerText = data.cip.toLocaleString('tr-TR'); cipKutu.style.color = "#2ecc71"; setTimeout(() => cipKutu.style.color = "", 2000); }
        if(auth.currentUser && !isMisafir) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: data.cip }); } 
    } 
});

socket.on('masa_kasa_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { masaKasaBilgisi.style.display = 'block'; masaKasaBilgisi.innerText = 'KASA: ' + data.kasa.toLocaleString('tr-TR') + ' ÇİP'; } });
socket.on('masa_oyun_basladi', (data) => { if(suAnkiMasam === data.masaAdi) { masayiTemizle(); masaOyunBasladiMi = true; oyunuBaslatBtn.style.display = 'none'; oyunAlanObjeleri.style.display = 'flex'; bitisAlani.style.display = 'flex'; gostergeHakki = true; kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { const gostergeDiv = document.getElementById('gostergeTasi'); gostergeDiv.innerText = data.gosterge.sayi; gostergeDiv.className = `gosterge-tasi tas-${data.gosterge.renk}`; } if(data.kasa) { masaKasaBilgisi.style.display = 'block'; masaKasaBilgisi.innerText = 'KASA: ' + data.kasa.toLocaleString('tr-TR') + ' ÇİP'; } if (guncelMasalar[data.masaAdi]) gelişmişKoltukHizala(guncelMasalar[data.masaAdi]); } });
socket.on('taslari_al', (data) => { if (data.kime === aktifKullaniciAdi) { for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; data.taslar.forEach((tas, index) => { tasEkle(tas, 'y'+index); }); setTimeout(checkGosterge, 500); } });
socket.on('tas_cekildi', (tas) => { for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { tasEkle(tas, 'y'+i); break; } } });
function tasEkle(tasData, yuvaId) { const div = document.createElement('div'); div.className = `okey-tasi tas-${tasData.renk}`; div.innerText = tasData.sayi; div.id = tasData.id; let sonDokunma = 0; let surukleniyorMu = false; div.addEventListener('touchstart', () => { surukleniyorMu = false; }, {passive: true}); div.addEventListener('touchmove', () => { surukleniyorMu = true; }, {passive: true}); div.addEventListener('touchend', function(e) { if(surukleniyorMu) return; const simdi = new Date().getTime(); if (simdi - sonDokunma < 300) { e.preventDefault(); otomatikTasAt(this); } sonDokunma = simdi; }); div.addEventListener('dblclick', function() { otomatikTasAt(this); }); document.getElementById(yuvaId).appendChild(div); }
socket.on('sira_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { kurtarmaSinyaliGonder(); const eskiSira = benimSiramMi; benimSiramMi = (data.kimde === aktifKullaniciAdi); if(benimSiramMi && !eskiSira) sesCal(sesSiraSende); const iskarta = document.getElementById('benimIskartam'); if(benimSiramMi) iskarta.classList.remove('kilitli-iskarta'); else iskarta.classList.add('kilitli-iskarta'); const koltuklar = [ { id: 'benimAdimKutusu', isim: aktifKullaniciAdi }, { id: 'seatRight', isim: document.getElementById('seatRight').dataset.isim }, { id: 'seatTop', isim: document.getElementById('seatTop').dataset.isim }, { id: 'seatLeft', isim: document.getElementById('seatLeft').dataset.isim } ]; koltuklar.forEach(k => { const el = document.getElementById(k.id); if(el && k.isim === data.kimde) el.classList.add('aktif-sira'); else if(el) el.classList.remove('aktif-sira'); }); checkGosterge(); } });
socket.on('masa_ortasi_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { kurtarmaSinyaliGonder(); kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { const gostergeDiv = document.getElementById('gostergeTasi'); gostergeDiv.innerText = data.gosterge.sayi; gostergeDiv.className = `gosterge-tasi tas-${data.gosterge.renk}`; } } });

if(sohbetCekmecesi) {
    document.getElementById('sohbetAcBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.add('acik'); });
    document.getElementById('sohbetKapatBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.remove('acik'); });
    document.getElementById('sohbetGonderBtn')?.addEventListener('click', () => { 
        if(isMisafir) { ozelUyariGoster("⚠️ MİSAFİR HESAPLAR SOHBETE MESAJ YAZAMAZ!"); return; } 
        const input = document.getElementById('sohbetInput'); 
        if(input.value.trim() !== '' && suAnkiMasam) { socket.emit('sohbet_mesaji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, mesaj: input.value, kozmetikler: aktifKozmetikler }); input.value = ''; benimGorevler.mesaj++; gorevleriKaydet(); } 
    });
}

window.vipEmojiGonder = function(emoji) { if(isMisafir) { ozelUyariGoster("⚠️ MİSAFİR HESAPLAR EMOLİ GÖNDEREMEZ!"); return; } if(suAnkiMasam) { socket.emit('vip_emoji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, emoji: emoji }); sohbetCekmecesi.classList.remove('acik'); } }
socket.on('yeni_sohbet_mesaji', (data) => { if(data.masaAdi === suAnkiMasam) { let isimRenk = data.isim === "Sistem" ? "#2ecc71" : "#f2c94c"; let isimGolge = "none"; let tacIcon = ""; if (data.kozmetikler) { if(data.kozmetikler.includes('atesli_isim')) { isimRenk = "#ff4d4d"; isimGolge = "0 0 5px #ff0000"; } if(data.kozmetikler.includes('neon_tac')) { tacIcon = "👑 "; } } const div = document.createElement('div'); div.className = 'pro-mesaj'; div.innerHTML = `<span class="pro-mesaj-isim" style="color:${isimRenk}; text-shadow:${isimGolge};">${tacIcon}${data.isim}</span>${data.mesaj}`; const mesajAlani = document.getElementById('sohbetMesajlari'); if(mesajAlani) { mesajAlani.appendChild(div); mesajAlani.scrollTop = mesajAlani.scrollHeight; } const anlikDiv = document.createElement('div'); anlikDiv.className = 'anlik-mesaj'; anlikDiv.innerHTML = `<strong style="color:${isimRenk}; text-shadow:${isimGolge};">${tacIcon}${data.isim}:</strong> ${data.mesaj}`; document.getElementById('anlikMesajAlani')?.appendChild(anlikDiv); setTimeout(() => { anlikDiv.remove(); }, 4000); } });
socket.on('yeni_vip_emoji', (data) => { if(data.masaAdi === suAnkiMasam) { const div = document.createElement('div'); div.className = 'ucan-emoji'; div.innerText = data.emoji; document.getElementById('masaEkrani').appendChild(div); setTimeout(() => { div.remove(); }, 2500); } });
socket.on('admin_flash_mesaj', (mesaj) => { const flash = document.getElementById('flashBildirim'); if (flash) { flash.innerHTML = `👑 PATRON DUYURUSU 👑<br><span style="font-size:18px; color:#fff; text-transform:none; margin-top:5px; display:block;">${mesaj}</span>`; flash.style.background = "linear-gradient(135deg, #c0392b, #8e44ad)"; flash.style.boxShadow = "0 15px 40px rgba(0,0,0,0.85), 0 0 25px rgba(192, 57, 43, 0.8)"; flash.style.borderColor = "#f2c94c"; flash.classList.remove('goster'); void flash.offsetWidth; flash.classList.add('goster'); setTimeout(() => { flash.style.background = ""; flash.style.boxShadow = ""; flash.style.borderColor = ""; }, 3500); } });
socket.on('admin_islem_uyarisi', (data) => { if(data.isim === aktifKullaniciAdi) { if(data.islem === 'kick') { ozelUyariGoster("🚨 YÖNETİCİ TARAFINDAN MASADAN ATILDINIZ!"); if(suAnkiMasam) { masadanAyrilmaIslemi(false); } } else if(data.islem === 'ban') { ozelUyariGoster("🛑 HESABINIZ SİSTEMDEN SINIRSIZ BANLANDI!"); location.reload(); } } });

socket.on('gosterge_basarili', (data) => { if (data.isim === aktifKullaniciAdi) { benimGorevler.gosterge++; gorevleriKaydet(); } });

socket.on('oyun_bitti', (data) => { 
    if(suAnkiMasam === data.masaAdi) { 
        const sonucEkrani = document.getElementById('sonucEkrani'); const baslik = document.getElementById('sonucBaslik'); const metin = document.getElementById('sonucMetin'); const odul = document.getElementById('sonucOdul'); 
        if(auth.currentUser && !isMisafir && data.kazanan && !data.kazanan.startsWith('Bot_')) {
            const userRef = db.collection("kullanicilar").doc(auth.currentUser.uid);
            if(data.kazanan === aktifKullaniciAdi) { userRef.update({ oynananOyun: firebase.firestore.FieldValue.increment(1), kazanilanOyun: firebase.firestore.FieldValue.increment(1) }); benimKazanilanOyun++; benimGorevler.kazanma++; gorevleriKaydet(); arayuzGuncelle(); } 
            else { userRef.update({ oynananOyun: firebase.firestore.FieldValue.increment(1) }); }
        }
        if (data.kazanan) { 
            if (data.kazanan === aktifKullaniciAdi) { baslik.innerText = data.okeyleBittiMi ? "🔥 OKEYLE BİTİRDİN! 🔥" : "🏆 TEBRİKLER, KAZANDIN! 🏆"; baslik.style.color = data.okeyleBittiMi ? "#ff3333" : "#f2c94c"; } else { baslik.innerText = data.okeyleBittiMi ? "🚨 RAKİP OKEY ATTI! 🚨" : "🎉 OYUN BİTTİ 🎉"; baslik.style.color = data.okeyleBittiMi ? "#ff3333" : "#f2c94c"; } 
            metin.innerText = `Kazanan: ${data.kazanan}\nSebep: ${data.sebep}`; odul.innerText = `+${data.odul.toLocaleString('tr-TR')} ÇİP`; sesCal(sesSiraSende); 
        } else { baslik.innerText = "🛑 OYUN BİTTİ 🛑"; baslik.style.color = "#dc3545"; metin.innerText = data.sebep || "Masadaki herkes ayrıldı."; odul.innerText = ""; } 
        sonucEkrani.style.display = 'flex'; const flash = document.getElementById('flashBildirim'); if (flash) flash.classList.remove('goster'); oyunAlanObjeleri.style.display = 'none'; gostergeBtn.style.display = 'none'; gostergeHakki = false; oyunuBaslatBtn.innerText = "🔄 AYNI MASADA TEKRAR OYNA"; oyunuBaslatBtn.style.display = 'block'; bitisAlani.style.display = 'none'; masaKasaBilgisi.style.display = 'none'; bitisAlani.innerHTML = 'BİTİR<br>🏆'; 
        for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; document.getElementById('iskartaSag').innerHTML = ''; document.getElementById('iskartaSol').innerHTML = ''; document.getElementById('iskartaUst').innerHTML = ''; benimSiramMi = false; masaOyunBasladiMi = false; 
    } 
});

window.magazaIslem = function(esyaId, fiyat) {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar mağazayı kullanamaz!"); return; }
    if(benimEnvanterim.includes(esyaId)) {
        if(aktifKozmetikler.includes(esyaId)) { aktifKozmetikler = aktifKozmetikler.filter(e => e !== esyaId); ozelUyariGoster("Kozmetik çıkarıldı."); } else { aktifKozmetikler.push(esyaId); ozelUyariGoster("Kozmetik donatıldı!"); }
        if(auth.currentUser) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ aktifKozmetikler: aktifKozmetikler }); }
        socket.emit('kozmetik_guncelle', { isim: aktifKullaniciAdi, kozmetikler: aktifKozmetikler }); arayuzGuncelle();
    } else {
        if(benimAnlikCipim >= fiyat) {
            benimAnlikCipim -= fiyat; benimEnvanterim.push(esyaId); aktifKozmetikler.push(esyaId);
            if(auth.currentUser) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim, envanter: benimEnvanterim, aktifKozmetikler: aktifKozmetikler }); }
            const cipKutu = document.getElementById('benimCipim'); if(cipKutu) cipKutu.innerText = benimAnlikCipim.toLocaleString('tr-TR');
            socket.emit('magaza_harcamasi', { isim: aktifKullaniciAdi, yeniCip: benimAnlikCipim }); socket.emit('kozmetik_guncelle', { isim: aktifKullaniciAdi, kozmetikler: aktifKozmetikler });
            ozelUyariGoster("🎉 Satın alma başarılı!"); arayuzGuncelle();
        } else { ozelUyariGoster("⚠️ Bu eşyayı almak için yeterli çipiniz yok!"); }
    }
};

function arayuzGuncelle() {
    const avatar = document.getElementById('vipAvatar'); const isimKutu = document.getElementById('benimAdimKutusu'); const rozetim = document.getElementById('benimVipRozetim');
    if(avatar) { avatar.style.border = '2px solid #52796f'; avatar.style.boxShadow = 'none'; } if(isimKutu) { isimKutu.style.color = '#fff'; isimKutu.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)'; }
    let ligAyar = getLigRozeti(benimKazanilanOyun, isMisafir); if(rozetim) { rozetim.innerText = ligAyar.metin; rozetim.style.background = ligAyar.renk; rozetim.style.color = ligAyar.yaziRenk; }
    let tacEki = ""; if(aktifKozmetikler.includes('neon_tac')) { tacEki = "👑 "; }
    if(aktifKullaniciAdi) { if(isimKutu) isimKutu.innerHTML = tacEki + aktifKullaniciAdi + ' <span style="color:#2ecc71;">✔</span>'; }
    if(aktifKozmetikler.includes('altin_cerceve') && avatar) { avatar.style.border = '3px solid #f2c94c'; avatar.style.boxShadow = '0 0 15px #f2c94c'; }
    if(aktifKozmetikler.includes('atesli_isim') && isimKutu) { isimKutu.style.color = '#ff4d4d'; }
    const esyalar = [ {id: 'altin_cerceve', fiyat: '500.000'}, {id: 'neon_tac', fiyat: '1.5M'}, {id: 'atesli_isim', fiyat: '3M'} ];
    esyalar.forEach(esya => { const btn = document.getElementById('btn_' + esya.id); if(btn) { if(aktifKozmetikler.includes(esya.id)) { btn.innerText = 'ÇIKAR'; btn.style.background = '#e74c3c'; btn.style.color = '#fff'; } else if(benimEnvanterim.includes(esya.id)) { btn.innerText = 'KULLAN'; btn.style.background = '#2ecc71'; btn.style.color = '#fff'; } else { btn.innerText = esya.fiyat + ' ÇİP'; btn.style.background = ''; btn.style.color = ''; } } });
}

function gunlukBonusKontrol() { if(isMisafir) return; const bugun = new Date().toLocaleDateString('tr-TR'); if (sonBonusTarihim !== bugun) { setTimeout(() => { document.getElementById('
