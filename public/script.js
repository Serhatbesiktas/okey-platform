const socket = io();
let aktifKullaniciAdi = ""; 
let suAnkiMasam = null; 
let benimSiramMi = false;
let guncelMasalar = {}; 
let gostergeHakki = false; 

let benimAnlikCipim = 0; 
let benimEnvanterim = []; 
let aktifKozmetikler = []; 
let sonBonusTarihim = ""; 
let isMisafir = false; 
let globalKozmetikler = {}; 

let benimArkadaslarim = []; 
let onlineOyuncularListesi = []; 
let masaOyunBasladiMi = false; 
let cikisIcinBekleyenLogout = false; 

const sesTasCek = new Audio('sounds/tas_cek.mp3');
const sesTasKoy = new Audio('sounds/tas_koy.mp3');
const sesSiraSende = new Audio('sounds/sira_sende.mp3');

sesTasCek.preload = 'auto';
sesTasKoy.preload = 'auto';
sesSiraSende.preload = 'auto';

function sesCal(sesObje) {
    try {
        let yeniSes = sesObje.cloneNode(); 
        yeniSes.volume = 0.5; 
        yeniSes.play().catch(e => console.log("Ses aktif değil:", e));
    } catch(err) {}
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

const authEkrani = document.getElementById('authEkrani');
const lobiEkrani = document.getElementById('lobiEkrani');
const masaEkrani = document.getElementById('masaEkrani');
const vipHeader = document.querySelector('.vip-header');

lobiEkrani.style.display = 'none';
masaEkrani.style.display = 'none';
vipHeader.style.display = 'none';

window.ozelUyariGoster = function(mesaj) {
    document.getElementById('uyariModalMetni').innerText = mesaj;
    document.getElementById('uyariModalEkrani').style.display = 'flex';
};

auth.onAuthStateChanged((user) => {
    if (user && !aktifKullaniciAdi) {
        db.collection("kullanicilar").doc(user.uid).get().then(doc => {
            if(doc.exists && doc.data().isim) {
                let kayitliNick = doc.data().isim;
                benimAnlikCipim = doc.data().cip || 250000;
                benimEnvanterim = doc.data().envanter || [];
                aktifKozmetikler = doc.data().aktifKozmetikler || [];
                sonBonusTarihim = doc.data().sonBonusTarihi || "";
                benimArkadaslarim = doc.data().arkadaslar || []; 
                
                isMisafir = false;
                document.getElementById('misafirUyariBanner').style.display = 'none';
                document.getElementById('benimVipRozetim').innerText = "VIP GOLD";
                document.getElementById('benimVipRozetim').style.background = "";

                oyunaGirisYap(kayitliNick); 
                arayuzGuncelle(); 
                gunlukBonusKontrol();
            }
        }).catch(err => console.log("Otomatik giriş başarısız", err));
    }
});

// PRO: Akıllı Sosyal Profil Kartı Modülü
window.profiliGoster = function(hedefIsim) {
    if(!hedefIsim || hedefIsim === "" || hedefIsim === "Bekleniyor..." || hedefIsim.startsWith("Bot_")) return;
    
    const pAvatar = document.getElementById('profilAvatarAlan');
    const pIsim = document.getElementById('profilIsim');
    const pOynanan = document.getElementById('profilOynanan');
    const pKazanilan = document.getElementById('profilKazanilan');
    const pCip = document.getElementById('profilCip');
    const kazanmaOrani = document.getElementById('profilKazanmaOrani');
    const pDurum = document.getElementById('profilDurumBadge');
    const pArkadasBtn = document.getElementById('profilArkadasBtn');
    const pDavetBtn = document.getElementById('profilDavetBtn');
    const pUnvan = document.getElementById('profilUnvanBadge');
    
    pIsim.innerText = "Yükleniyor...";
    pOynanan.innerText = "..."; pKazanilan.innerText = "..."; pCip.innerText = "...";
    kazanmaOrani.innerText = "%0";
    pAvatar.style.border = '3px solid #52796f'; pAvatar.style.boxShadow = 'none';
    pIsim.style.color = '#fff'; pIsim.style.textShadow = 'none';
    pArkadasBtn.style.display = 'none'; pDavetBtn.style.display = 'none';
    pUnvan.innerText = "VIP GOLD";
    
    document.getElementById('profilEkrani').style.display = 'flex';
    
    let isOnline = onlineOyuncularListesi.includes(hedefIsim) || hedefIsim === aktifKullaniciAdi;
    if(isOnline) { pDurum.innerText = "🟢 Çevrimiçi"; pDurum.style.color = "#2ecc71"; } 
    else { pDurum.innerText = "🔴 Çevrimdışı"; pDurum.style.color = "#e74c3c"; }

    pArkadasBtn.dataset.hedef = hedefIsim;
    pDavetBtn.dataset.hedef = hedefIsim;

    if (hedefIsim !== aktifKullaniciAdi) {
        pArkadasBtn.style.display = 'block';
        if (benimArkadaslarim.includes(hedefIsim)) {
            pArkadasBtn.innerText = "❌ Arkadaştan Çıkar"; pArkadasBtn.style.background = "#e74c3c";
        } else {
            pArkadasBtn.innerText = "➕ Arkadaş Ekle"; pArkadasBtn.style.background = "";
        }
        if (isOnline && suAnkiMasam) { pDavetBtn.style.display = 'block'; }
    }

    if(hedefIsim.startsWith("MİSAFİR_")) {
        pIsim.innerText = hedefIsim;
        pOynanan.innerText = "0"; pKazanilan.innerText = "0"; pCip.innerText = "20.000";
        pUnvan.innerText = "DENEME HESABI";
        pArkadasBtn.style.display = 'none';
        pDavetBtn.style.display = (suAnkiMasam && isOnline) ? 'block' : 'none';
        return;
    }

    db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then((querySnapshot) => {
        if(!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            let kozmetikler = data.aktifKozmetikler || [];
            
            let tac = kozmetikler.includes('neon_tac') ? "👑 " : "";
            pIsim.innerHTML = tac + data.isim;
            pIsim.style.color = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff';
            pIsim.style.textShadow = kozmetikler.includes('atesli_isim') ? '0 0 8px #ff0000' : 'none';
            
            if (kozmetikler.includes('atesli_isim')) pUnvan.innerText = "🔥 ATEŞ USTASI";
            else if (kozmetikler.includes('neon_tac')) pUnvan.innerText = "👑 OKEY KRALI";
            else pUnvan.innerText = "VIP GOLD";

            if(kozmetikler.includes('altin_cerceve')) {
                pAvatar.style.border = '3px solid #f2c94c'; pAvatar.style.boxShadow = '0 0 15px #f2c94c';
            }
            
            let oynanan = data.oynananOyun || 0;
            let kazanilan = data.kazanilanOyun || 0;
            let oran = oynanan > 0 ? Math.round((kazanilan / oynanan) * 100) : 0;
            
            pOynanan.innerText = oynanan; pKazanilan.innerText = kazanilan;
            kazanmaOrani.innerText = "%" + oran;
            pCip.innerText = (data.cip || 0).toLocaleString('tr-TR');
        } else {
            pIsim.innerText = hedefIsim; pOynanan.innerText = "Gizli"; pKazanilan.innerText = "Gizli"; pCip.innerText = "Gizli";
        }
    }).catch(err => { pIsim.innerText = "Bağlantı Hatası"; });
};

// PRO: Profil Kartı Arkadaş Aksiyonu Köprüsü
window.profilArkadasAksiyon = function() {
    const btn = document.getElementById('profilArkadasBtn');
    const hedef = btn.dataset.hedef;
    if (!hedef || isMisafir) return;

    if (benimArkadaslarim.includes(hedef)) {
        benimArkadaslarim = benimArkadaslarim.filter(name => name !== hedef);
        btn.innerText = "➕ Arkadaş Ekle"; btn.style.background = "";
        ozelUyariGoster(`❌ ${hedef} arkadaş listenden çıkarıldı.`);
    } else {
        benimArkadaslarim.push(hedef);
        btn.innerText = "❌ Arkadaştan Çıkar"; btn.style.background = "#e74c3c";
        ozelUyariGoster(`✅ ${hedef} arkadaş listene eklendi!`);
    }
    if (auth.currentUser) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }); }
};

// PRO: Profil Kartı Masaya Davet Köprüsü
window.profilDavetAksiyon = function() {
    const btn = document.getElementById('profilDavetBtn');
    const hedef = btn.dataset.hedef;
    if (!hedef || !suAnkiMasam) return;

    socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: hedef, masaAdi: suAnkiMasam });
    ozelUyariGoster(`💌 ${hedef} adlı oyuncuya davet gönderildi!`);
    document.getElementById('profilEkrani').style.display = 'none';
};

function masadanAyrilmaIslemi(cezaUygulansinMi = false) {
    if (suAnkiMasam) {
        if (cezaUygulansinMi && masaOyunBasladiMi) {
            let cezaMiktari = 0;
            if (suAnkiMasam.includes('20K')) cezaMiktari = 20000;
            else if (suAnkiMasam.includes('50K')) cezaMiktari = 50000;
            else if (suAnkiMasam.includes('10K')) cezaMiktari = 10000;

            if (cezaMiktari > 0) {
                benimAnlikCipim -= cezaMiktari;
                if (benimAnlikCipim < 0) benimAnlikCipim = 0;

                document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');

                if (auth.currentUser && !isMisafir) {
                    db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim });
                }
                
                socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler });
                
                document.getElementById('cezaMiktarMetni').innerText = cezaMiktari.toLocaleString('tr-TR') + " ÇİP";
                document.getElementById('cezaBildirimEkrani').style.display = 'flex';
            }
        }
        socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); 
    }

    suAnkiMasam = null; 
    masayiTemizle(); 
    document.getElementById('seatTop').innerText = "Bekleniyor..."; 
    document.getElementById('seatLeft').innerText = "Bekleniyor..."; 
    document.getElementById('seatRight').innerText = "Bekleniyor..."; 
    document.getElementById('seatTop').dataset.isim = ""; 
    document.getElementById('seatLeft').dataset.isim = ""; 
    document.getElementById('seatRight').dataset.isim = ""; 
    masaEkrani.style.display = 'none'; 
    lobiEkrani.style.display = 'flex';
}

window.cezaAnladimKapat = function() {
    document.getElementById('cezaBildirimEkrani').style.display = 'none';
    if(cikisIcinBekleyenLogout) { tamamenCikisYap(); }
}

function tamamenCikisYap() {
    auth.signOut().then(() => {
        aktifKullaniciAdi = ""; suAnkiMasam = null; masaOyunBasladiMi = false; cikisIcinBekleyenLogout = false;
        document.getElementById('authEkrani').style.display = 'flex';
        document.getElementById('lobiEkrani').style.display = 'none';
        document.getElementById('masaEkrani').style.display = 'none';
        document.querySelector('.vip-header').style.display = 'none';
        document.getElementById('cezaBildirimEkrani').style.display = 'none'; 
        document.getElementById('authEmail').value = ''; document.getElementById('authSifre').value = ''; document.getElementById('authKullaniciAdi').value = '';
    });
}

document.getElementById('btnCikisYap').addEventListener('click', (e) => {
    e.stopPropagation(); 
    const cikisOnay = confirm("Hesabınızdan çıkış yapmak istediğinize emin misiniz?");
    if(cikisOnay) {
        if(suAnkiMasam && masaOyunBasladiMi) {
            cikisIcinBekleyenLogout = true; masadanAyrilmaIslemi(true); 
        } else {
            if (suAnkiMasam) masadanAyrilmaIslemi(false); 
            tamamenCikisYap(); 
        }
    }
});

const lobiyeDonBtn = document.getElementById('lobiyeDonBtn');
lobiyeDonBtn.addEventListener('click', () => {
    if (suAnkiMasam && masaOyunBasladiMi) {
        document.getElementById('cikisUyariEkrani').style.display = 'flex';
    } else {
        masadanAyrilmaIslemi(false); 
    }
});

document.getElementById('btnCikisOnayla').addEventListener('click', () => {
    document.getElementById('cikisUyariEkrani').style.display = 'none';
    masadanAyrilmaIslemi(true); 
});

document.getElementById('btnGecisKayit').addEventListener('click', () => {
    document.getElementById('authBaslik').innerText = "YENİ HESAP OLUŞTUR";
    document.getElementById('authAltMetin').innerText = "Milyonların arasına katılmak için efsanevi nickini seç!";
    document.getElementById('authKullaniciAdi').style.display = 'block';
    document.getElementById('loginButonlari').style.display = 'none';
    document.getElementById('kayitButonlari').style.display = 'block';
    document.getElementById('authEmail').value = ''; document.getElementById('authSifre').value = '';
});

document.getElementById('btnGecisGiris').addEventListener('click', () => {
    document.getElementById('authBaslik').innerText = "VIP CASINO GİRİŞİ";
    document.getElementById('authAltMetin').innerText = "Çiplerini güvende tutmak için kayıt ol veya giriş yap";
    document.getElementById('authKullaniciAdi').style.display = 'none';
    document.getElementById('loginButonlari').style.display = 'block';
    document.getElementById('kayitButonlari').style.display = 'none';
});

document.getElementById('btnMisafir').addEventListener('click', () => {
    isMisafir = true;
    const rastgeleId = Math.floor(Math.random() * 9000) + 1000;
    const misafirIsim = "MİSAFİR_" + rastgeleId;
    benimAnlikCipim = 20000; benimEnvanterim = []; aktifKozmetikler = []; benimArkadaslarim = []; 
    sonBonusTarihim = new Date().toLocaleDateString('tr-TR'); 
    document.getElementById('misafirUyariBanner').style.display = 'block';
    document.getElementById('benimVipRozetim').innerText = "DENEME HESABI";
    document.getElementById('benimVipRozetim').style.background = "#7f8c8d";
    oyunaGirisYap(misafirIsim); arayuzGuncelle();
});

document.getElementById('btnKayitTamamla').addEventListener('click', () => {
    const btn = document.getElementById('btnKayitTamamla');
    const nick = document.getElementById('authKullaniciAdi').value.trim().toUpperCase();
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authSifre').value;
    
    if(!nick) { ozelUyariGoster("Lütfen kendinize havalı bir Oyuncu Nicki belirleyin!"); return; }
    if(nick.length < 3) { ozelUyariGoster("Nickiniz en az 3 harf olmalı!"); return; }
    if(nick.startsWith("MİSAFİR") || nick.startsWith("BOT_")) { ozelUyariGoster("Bu nick sistem tarafından rezerve edilmiştir, lütfen başka bir nick seçin!"); return; }
    if(!email || !pass) { ozelUyariGoster("Lütfen e-posta ve şifre girin patron!"); return; }
    if(pass.length < 6) { ozelUyariGoster("Şifre en az 6 haneli olmalı!"); return; }
    
    btn.disabled = true; btn.innerText = "KAYDEDİLİYOR... ⏳"; btn.style.opacity = "0.7";
    
    db.collection("kullanicilar").where("isim", "==", nick).get().then((querySnapshot) => {
        if(!querySnapshot.empty) {
            ozelUyariGoster("Bu nick zaten alınmış patron! Kendine eşsiz başka bir isim bul."); 
            btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; return;
        }
        auth.createUserWithEmailAndPassword(email, pass).then((userCredential) => {
            db.collection("kullanicilar").doc(userCredential.user.uid).set({
                isim: nick, cip: 250000, envanter: [], aktifKozmetikler: [], sonBonusTarihi: "", arkadaslar: [], oynananOyun: 0, kazanilanOyun: 0 
            }).then(() => { 
                auth.signOut().then(() => {
                    ozelUyariGoster("✅ Kayıt Başarılı! Efsanevi nickin ayarlandı.\nŞimdi lütfen e-posta ve şifrenle GİRİŞ YAP.");
                    document.getElementById('btnGecisGiris').click(); document.getElementById('authSifre').value = ''; 
                    btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1";
                });
            }).catch(dbError => { console.error(dbError); ozelUyariGoster("Veritabanı kayıt hatası."); btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; });
        }).catch(error => { ozelUyariGoster("Sistem Hatası (E-posta kullanımda veya geçersiz): " + error.message); btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; });
    }).catch(err => { console.error(err); ozelUyariGoster("İsim kontrolü yapılamadı."); btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1"; });
});

document.getElementById('btnGiris').addEventListener('click', () => {
    const btn = document.getElementById('btnGiris');
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authSifre').value;
    if(!email || !pass) { ozelUyariGoster("Lütfen e-posta ve şifrenizi girin!"); return; }

    btn.disabled = true; btn.innerText = "GİRİŞ YAPILIYOR... ⏳"; btn.style.opacity = "0.7";

    auth.signInWithEmailAndPassword(email, pass).then((userCredential) => {
        isMisafir = false; document.getElementById('misafirUyariBanner').style.display = 'none';
        document.getElementById('benimVipRozetim').innerText = "VIP GOLD"; document.getElementById('benimVipRozetim').style.background = "";

        db.collection("kullanicilar").doc(userCredential.user.uid).get().then(doc => {
            let kayitliNick = "";
            if(doc.exists && doc.data().isim) {
                kayitliNick = doc.data().isim; benimAnlikCipim = doc.data().cip || 250000; benimEnvanterim = doc.data().envanter || [];
                aktifKozmetikler = doc.data().aktifKozmetikler || []; sonBonusTarihim = doc.data().sonBonusTarihi || ""; benimArkadaslarim = doc.data().arkadaslar || []; 
            } else {
                kayitliNick = email.split('@')[0].toUpperCase(); benimAnlikCipim = 250000;
                db.collection("kullanicilar").doc(userCredential.user.uid).set({ isim: kayitliNick, cip: 250000, envanter: [], aktifKozmetikler: [], sonBonusTarihi: "", arkadaslar: [], oynananOyun: 0, kazanilanOyun: 0 });
            }
            btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1";
            oyunaGirisYap(kayitliNick); arayuzGuncelle(); gunlukBonusKontrol();
        }).catch(dbError => { console.error("Hata:", dbError); ozelUyariGoster("Veritabanı bağlantısında geçici bir kopukluk oldu. Lütfen sayfayı yenileyip tekrar deneyin."); btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1"; });
    }).catch(error => { ozelUyariGoster("Giriş Başarısız. E-posta veya şifre yanlış."); btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1"; });
});

function oyunaGirisYap(isim) {
    aktifKullaniciAdi = isim; document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
    authEkrani.style.display = 'none'; vipHeader.style.display = 'flex'; lobiEkrani.style.display = 'flex';
    socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler });
}

socket.on('sen_masadasin', (data) => {
    let mAdi = typeof data === 'object' ? data.masaAdi : data;
    suAnkiMasam = mAdi; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex';
    document.getElementById('masaOrtasiYazi').innerText = mAdi.toUpperCase();
    socket.emit('masaya_geri_don', { masaAdi: mAdi, isim: aktifKullaniciAdi });
});

window.liderlikTablosunuAc = function() {
    document.getElementById('liderlikEkrani').style.display = 'flex';
    const listeDiv = document.getElementById('liderlikListesi');
    listeDiv.innerHTML = '<p style="text-align:center; color:#f2c94c; font-weight:bold;">Veritabanı taranıyor...</p>';

    db.collection("kullanicilar").orderBy("cip", "desc").limit(5).get().then((querySnapshot) => {
          listeDiv.innerHTML = ''; if(querySnapshot.empty) { listeDiv.innerHTML = '<p style="text-align:center; color:#777;">Henüz sıralama oluşmadı.</p>'; return; }
          let index = 0;
          querySnapshot.forEach((doc) => {
              const oyuncu = doc.data(); if(oyuncu.isim.startsWith('MİSAFİR_')) return; 
              let siraClass = ''; let kupa = '';
              if(index === 0) { siraClass = 'sira-1'; kupa = '🏆'; } else if(index === 1) { siraClass = 'sira-2'; kupa = '🥈'; } else if(index === 2) { siraClass = 'sira-3'; kupa = '🥉'; } else { siraClass = ''; kupa = '🏅'; }
              let kozmetikler = oyuncu.aktifKozmetikler || [];
              let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff';
              let isimGolge = kozmetikler.includes('atesli_isim') ? '0 0 5px #ff0000' : 'none';
              let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';
              listeDiv.innerHTML += `<div class="lider-satir" style="cursor:pointer;" onclick="profiliGoster('${oyuncu.isim}')"><div class="lider-sira ${siraClass}">${index + 1}.</div><div class="lider-isim" style="color:${isimRenk}; text-shadow:${isimGolge};">${kupa} ${tac}${oyuncu.isim}</div><div class="lider-cip">${oyuncu.cip.toLocaleString('tr-TR')} ÇİP</div></div>`;
              index++;
          });
      }).catch((error) => { console.log("Liderlik tablosu hatası:", error); listeDiv.innerHTML = '<p style="text-align:center; color:#e74c3c;">Bağlantı hatası, liste alınamadı.</p>'; });
}

socket.on('online_oyuncular', (liste) => {
    onlineOyuncularListesi = liste; const lobiDiv = document.getElementById('lobidekilerListesi'); if(!lobiDiv) return; lobiDiv.innerHTML = '';
    liste.forEach(oyuncuIsmi => {
        if(oyuncuIsmi === aktifKullaniciAdi) return; 
        let kozmetikler = globalKozmetikler[oyuncuIsmi] || [];
        let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#0dcaf0';
        let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';
        let butonHtml = '';
        if(!isMisafir && !oyuncuIsmi.startsWith('MİSAFİR_') && !benimArkadaslarim.includes(oyuncuIsmi)) { butonHtml = `<button class="btn-arkadas-ekle" onclick="arkadasEkle('${oyuncuIsmi}')">+ Ekle</button>`; }
        lobiDiv.innerHTML += `<div class="lobi-oyuncu-satir"><span class="lobi-oyuncu-isim" style="color:${isimRenk}; cursor:pointer;" onclick="profiliGoster('${oyuncuIsmi}')"><span class="online-nokta"></span>${tac}${oyuncuIsmi}</span>${butonHtml}</div>`;
    });
});

window.arkadasEkle = function(isim) {
    if(isMisafir) return;
    if(!benimArkadaslarim.includes(isim)) {
        benimArkadaslarim.push(isim);
        if(auth.currentUser) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }).then(() => { ozelUyariGoster(`✅ ${isim} arkadaş listene eklendi!`); }); }
    }
}

window.arkadaslarMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesapların arkadaş listesi kapalıdır."); return; }
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; const listeDiv = document.getElementById('arkadasListesiDiv'); listeDiv.innerHTML = '';
    if(benimArkadaslarim.length === 0) { listeDiv.innerHTML = '<p style="text-align:center; color:#777; font-size:12px;">Henüz hiç arkadaşın yok. Lobiden ekleyebilirsin!</p>'; return; }
    benimArkadaslarim.forEach(arkadas => {
        let isOnline = onlineOyuncularListesi.includes(arkadas); let durumNoktasi = isOnline ? '<span class="online-nokta"></span>' : '<span class="offline-nokta"></span>';
        let kozmetikler = globalKozmetikler[arkadas] || []; let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff'; let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';
        let davetButonu = ''; if(isOnline && suAnkiMasam) { davetButonu = `<button class="btn-davet-et" onclick="masayaDavetEt('${arkadas}')">📥 Davet Et</button>`; }
        listeDiv.innerHTML += `<div class="lider-satir"><div class="lider-isim" style="color:${isimRenk}; cursor:pointer;" onclick="profiliGoster('${arkadas}')">${durumNoktasi} ${tac}${arkadas}</div>${davetButonu}</div>`;
    });
}

window.masayaDavetEt = function(arkadasIsmi) {
    event.stopPropagation(); if(!suAnkiMasam) return;
    socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: arkadasIsmi, masaAdi: suAnkiMasam });
    ozelUyariGoster(`💌 ${arkadasIsmi} adlı oyuncuya davet gönderildi!`); document.getElementById('arkadaslarEkrani').style.display = 'none';
}

socket.on('davet_geldi', (data) => {
    if(data.kime === aktifKullaniciAdi && !suAnkiMasam) { 
        document.getElementById('davetGeldiEkrani').style.display = 'flex';
        document.getElementById('btnDavetKabul').onclick = function() { document.getElementById('davetGeldiEkrani').style.display = 'none'; masayaOtur(data.masaAdi); };
    }
});

window.masayaOtur = function(masaAdi) { 
    let bahis = 0; if(masaAdi.includes('20K')) bahis = 20000; else if(masaAdi.includes('50K')) bahis = 50000; else if(masaAdi.includes('10K')) bahis = 10000;
    if (benimAnlikCipim < bahis) { ozelUyariGoster("⚠️ Yetersiz Bakiye! Bu masaya oturmak için en az " + bahis.toLocaleString() + " ÇİP gerekiyor."); return; }
    suAnkiMasam = masaAdi; socket.emit('masaya_otur', { isim: aktifKullaniciAdi, masaAdi: masaAdi }); lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; masaOrtasiYazi.innerText = masaAdi.toUpperCase(); 
};

oyunuBaslatBtn.addEventListener('click', () => { socket.emit('oyunu_baslat', suAnkiMasam); });
document.querySelector('.btn-hemen-oyna').addEventListener('click', () => { if (suAnkiMasam) return; let musaitMasa = null; for (const [masaAdi, koltuklar] of Object.entries(guncelMasalar)) { if (koltuklar.filter(k => k !== null).length < 4) { musaitMasa = masaAdi; break; } } if (musaitMasa) masayaOtur(musaitMasa); else ozelUyariGoster("Şu an tüm masalar tam kapasite dolu, patron!"); });
socket.on('masa_kasa_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { masaKasaBilgisi.style.display = 'block'; masaKasaBilgisi.innerText = 'KASA: ' + data.kasa.toLocaleString('tr-TR') + ' ÇİP'; } });

socket.on('masa_oyun_basladi', (data) => { 
    if(suAnkiMasam === data.masaAdi) { 
        masayiTemizle(); masaOyunBasladiMi = true; 
        oyunuBaslatBtn.style.display = 'none'; oyunAlanObjeleri.style.display = 'flex'; bitisAlani.style.display = 'flex'; gostergeHakki = true; kalanTasBilgi.innerText = data.kalanTas; 
        if(data.gosterge) { const gostergeDiv = document.getElementById('gostergeTasi'); gostergeDiv.innerText = data.gosterge.sayi; gostergeDiv.className = `gosterge-tasi tas-${data.gosterge.renk}`; } 
        if(data.kasa) { masaKasaBilgisi.style.display = 'block'; masaKasaBilgisi.innerText = 'KASA: ' + data.kasa.toLocaleString('tr-TR') + ' ÇİP'; } 
        if (guncelMasalar[data.masaAdi]) gelişmişKoltukHizala(guncelMasalar[data.masaAdi]); 
    } 
});

socket.on('taslari_al', (data) => { if (data.kime === aktifKullaniciAdi) { for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; data.taslar.forEach((tas, index) => { tasEkle(tas, 'y'+index); }); setTimeout(checkGosterge, 500); } });
socket.on('tas_cekildi', (tas) => { for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { tasEkle(tas, 'y'+i); break; } } });
function tasEkle(tasData, yuvaId) { const div = document.createElement('div'); div.className = `okey-tasi tas-${tasData.renk}`; div.innerText = tasData.sayi; div.id = tasData.id; let sonDokunma = 0; let surukleniyorMu = false; div.addEventListener('touchstart', () => { surukleniyorMu = false; }, {passive: true}); div.addEventListener('touchmove', () => { surukleniyorMu = true; }, {passive: true}); div.addEventListener('touchend', function(e) { if(surukleniyorMu) return; const simdi = new Date().getTime(); if (simdi - sonDokunma < 300) { e.preventDefault(); otomatikTasAt(this); } sonDokunma = simdi; }); div.addEventListener('dblclick', function() { otomatikTasAt(this); }); document.getElementById(yuvaId).appendChild(div); }
socket.on('sira_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { kurtarmaSinyaliGonder(); const eskiSira = monumentsMi; benimSiramMi = (data.kimde === aktifKullaniciAdi); if(benimSiramMi && !eskiSira) sesCal(sesSiraSende); const iskarta = document.getElementById('benimIskartam'); if(benimSiramMi) iskarta.classList.remove('kilitli-iskarta'); else iskarta.classList.add('kilitli-iskarta'); const koltuklar = [ { id: 'benimAdimKutusu', isim: aktifKullaniciAdi }, { id: 'seatRight', isim: document.getElementById('seatRight').dataset.isim }, { id: 'seatTop', isim: document.getElementById('seatTop').dataset.isim }, { id: 'seatLeft', isim: document.getElementById('seatLeft').dataset.isim } ]; koltuklar.forEach(k => { const el = document.getElementById(k.id); if(el && k.isim === data.kimde) el.classList.add('aktif-sira'); else if(el) el.classList.remove('aktif-sira'); }); checkGosterge(); } });
socket.on('masa_ortasi_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { kurtarmaSinyaliGonder(); kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { const gostergeDiv = document.getElementById('gostergeTasi'); gostergeDiv.innerText = data.gosterge.sayi; gostergeDiv.className = `gosterge-tasi tas-${data.gosterge.renk}`; } } });

const sohbetCekmecesi = document.getElementById('sohbetCekmecesi');
document.getElementById('sohbetAcBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.add('acik'); });
document.getElementById('sohbetKapatBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.remove('acik'); });
document.getElementById('sohbetGonderBtn')?.addEventListener('click', () => { if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar sohbete katılamaz."); return; } const input = document.getElementById('sohbetInput'); if(input.value.trim() !== '' && suAnkiMasam) { socket.emit('sohbet_mesaji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, mesaj: input.value, kozmetikler: aktifKozmetikler }); input.value = ''; } });
window.vipEmojiGonder = function(emoji) { if(isMisafir) { ozelUyariGoster("⚠️ Emojiler misafirlere kilitlidir."); return; } if(suAnkiMasam) { socket.emit('vip_emoji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, emoji: emoji }); sohbetCekmecesi.classList.remove('acik'); } }
socket.on('yeni_sohbet_mesaji', (data) => { if(data.masaAdi === suAnkiMasam) { let isimRenk = "#f2c94c"; let isimGolge = "none"; let tacIcon = ""; if (data.kozmetikler) { if(data.kozmetikler.includes('atesli_isim')) { isimRenk = "#ff4d4d"; isimGolge = "0 0 5px #ff0000"; } if(data.kozmetikler.includes('neon_tac')) { tacIcon = "👑 "; } } const div = document.createElement('div'); div.className = 'pro-mesaj'; div.innerHTML = `<span class="pro-mesaj-isim" style="color:${isimRenk}; text-shadow:${isimGolge};">${tacIcon}${data.isim}</span>${data.mesaj}`; const mesajAlani = document.getElementById('sohbetMesajlari'); if(mesajAlani) { mesajAlani.appendChild(div); mesajAlani.scrollTop = mesajAlani.scrollHeight; } const anlikDiv = document.createElement('div'); anlikDiv.className = 'anlik-mesaj'; anlikDiv.innerHTML = `<strong style="color:${isimRenk}; text-shadow:${isimGolge};">${tacIcon}${data.isim}:</strong> ${data.mesaj}`; document.getElementById('anlikMesajAlani')?.appendChild(anlikDiv); setTimeout(() => { anlikDiv.remove(); }, 4000); } });
socket.on('yeni_vip_emoji', (data) => { if(data.masaAdi === suAnkiMasam) { const div = document.createElement('div'); div.className = 'ucan-emoji'; div.innerText = data.emoji; document.getElementById('masaEkrani').appendChild(div); setTimeout(() => { div.remove(); }, 2500); } });
socket.on('admin_flash_mesaj', (mesaj) => { const flash = document.getElementById('flashBildirim'); if (flash) { flash.innerHTML = `👑 PATRON DUYURUSU 👑<br><span style="font-size:18px; color:#fff; text-transform:none; margin-top:5px; display:block;">${mesaj}</span>`; flash.style.background = "linear-gradient(135deg, #c0392b, #8e44ad)"; flash.style.boxShadow = "0 15px 40px rgba(0,0,0,0.85), 0 0 25px rgba(192, 57, 43, 0.8)"; flash.style.borderColor = "#f2c94c"; flash.classList.remove('goster'); void flash.offsetWidth; flash.classList.add('goster'); setTimeout(() => { flash.style.background = ""; flash.style.boxShadow = ""; flash.style.borderColor = ""; }, 3500); } });
socket.on('admin_islem_uyarisi', (data) => { if(data.isim === aktifKullaniciAdi) { if(data.islem === 'kick') { ozelUyariGoster("🚨 YÖNETİCİ TARAFINDAN MASADAN ATILDINIZ!"); if(suAnkiMasam) { suAnkiMasam = null; masayiTemizle(); document.getElementById('masaEkrani').style.display = 'none'; document.getElementById('lobiEkrani').style.display = 'flex'; } } else if(data.islem === 'ban') { ozelUyariGoster("🛑 HESABINIZ SİSTEMDEN SINIRSIZ BANLANDI!"); location.reload(); } } });
