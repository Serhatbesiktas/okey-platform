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

window.profiliGoster = function(hedefIsim) {
    if(!hedefIsim || hedefIsim === "" || hedefIsim === "Bekleniyor..." || hedefIsim.startsWith("Bot_")) return;
    
    const pAvatar = document.getElementById('profilAvatarAlan');
    const pIsim = document.getElementById('profilIsim');
    const pOynanan = document.getElementById('profilOynanan');
    const pKazanilan = document.getElementById('profilKazanilan');
    const pCip = document.getElementById('profilCip');
    const kazanmaOrani = document.getElementById('profilKazanmaOrani');
    
    pIsim.innerText = "Yükleniyor...";
    pOynanan.innerText = "..."; pKazanilan.innerText = "..."; pCip.innerText = "...";
    kazanmaOrani.innerText = "%0";
    pAvatar.style.border = '3px solid #52796f'; pAvatar.style.boxShadow = 'none';
    pIsim.style.color = '#fff'; pIsim.style.textShadow = 'none';
    
    document.getElementById('profilEkrani').style.display = 'flex';
    
    if(hedefIsim.startsWith("MİSAFİR_")) {
        pIsim.innerText = hedefIsim;
        pOynanan.innerText = "0"; pKazanilan.innerText = "0"; pCip.innerText = "20.000";
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
            pIsim.innerText = hedefIsim;
            pOynanan.innerText = "Gizli"; pKazanilan.innerText = "Gizli"; pCip.innerText = "Gizli";
        }
    }).catch(err => { pIsim.innerText = "Bağlantı Hatası"; });
}

// İŞTE BURASI: TARAYICININ ENGELLEYEMEYECEĞİ, KUSURSUZ HTML CEZA EKRANI!
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
                
                // Alert yerine VIP HTML Ceza Penceresini Aç!
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

document.getElementById('btnCikisYap').addEventListener('click', (e) => {
    e.stopPropagation(); 
    const cikisOnay = confirm("Hesabınızdan çıkış yapmak istediğinize emin misiniz?");
    if(cikisOnay) {
        if(suAnkiMasam && masaOyunBasladiMi) {
            masadanAyrilmaIslemi(true); 
        } else if (suAnkiMasam) {
            masadanAyrilmaIslemi(false); 
        }
        
        auth.signOut().then(() => {
            aktifKullaniciAdi = "";
            suAnkiMasam = null;
            masaOyunBasladiMi = false;
            
            document.getElementById('authEkrani').style.display = 'flex';
            document.getElementById('lobiEkrani').style.display = 'none';
            document.getElementById('masaEkrani').style.display = 'none';
            document.querySelector('.vip-header').style.display = 'none';
            document.getElementById('cezaBildirimEkrani').style.display = 'none'; // Çıkışta açık kalmasın
            
            document.getElementById('authEmail').value = '';
            document.getElementById('authSifre').value = '';
            document.getElementById('authKullaniciAdi').value = '';
        });
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
    document.getElementById('authEmail').value = '';
    document.getElementById('authSifre').value = '';
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
    
    benimAnlikCipim = 20000; 
    benimEnvanterim = [];
    aktifKozmetikler = [];
    benimArkadaslarim = []; 
    sonBonusTarihim = new Date().toLocaleDateString('tr-TR'); 
    
    document.getElementById('misafirUyariBanner').style.display = 'block';
    document.getElementById('benimVipRozetim').innerText = "DENEME HESABI";
    document.getElementById('benimVipRozetim').style.background = "#7f8c8d";
    
    oyunaGirisYap(misafirIsim);
    arayuzGuncelle();
});

document.getElementById('btnKayitTamamla').addEventListener('click', () => {
    const btn = document.getElementById('btnKayitTamamla');
    const nick = document.getElementById('authKullaniciAdi').value.trim().toUpperCase();
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authSifre').value;
    
    if(!nick) { alert("Lütfen kendinize havalı bir Oyuncu Nicki belirleyin!"); return; }
    if(nick.length < 3) { alert("Nickiniz en az 3 harf olmalı!"); return; }
    if(nick.startsWith("MİSAFİR") || nick.startsWith("BOT_")) { alert("Bu nick sistem tarafından rezerve edilmiştir, lütfen başka bir nick seçin!"); return; }
    if(!email || !pass) { alert("Lütfen e-posta ve şifre girin patron!"); return; }
    if(pass.length < 6) { alert("Şifre en az 6 haneli olmalı!"); return; }
    
    btn.disabled = true;
    btn.innerText = "KAYDEDİLİYOR... ⏳";
    btn.style.opacity = "0.7";
    
    db.collection("kullanicilar").where("isim", "==", nick).get().then((querySnapshot) => {
        if(!querySnapshot.empty) {
            alert("Bu nick zaten alınmış patron! Kendine eşsiz başka bir isim bul."); 
            btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1";
            return;
        }
        
        auth.createUserWithEmailAndPassword(email, pass).then((userCredential) => {
            db.collection("kullanicilar").doc(userCredential.user.uid).set({
                isim: nick, cip: 250000, envanter: [], aktifKozmetikler: [], sonBonusTarihi: "", arkadaslar: [],
                oynananOyun: 0, kazanilanOyun: 0 
            }).then(() => { 
                auth.signOut().then(() => {
                    alert("✅ Kayıt Başarılı! Efsanevi nickin ayarlandı.\nŞimdi lütfen e-posta ve şifrenle GİRİŞ YAP.");
                    document.getElementById('btnGecisGiris').click(); 
                    document.getElementById('authSifre').value = ''; 
                    btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1";
                });
            }).catch(dbError => { 
                console.error(dbError); alert("Veritabanı kayıt hatası."); 
                btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1";
            });
        }).catch(error => { 
            alert("Sistem Hatası (E-posta zaten kullanımda olabilir): " + error.message); 
            btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1";
        });
    }).catch(err => { 
        console.error(err); alert("İsim kontrolü yapılamadı."); 
        btn.disabled = false; btn.innerText = "KAYDI TAMAMLA"; btn.style.opacity = "1";
    });
});

document.getElementById('btnGiris').addEventListener('click', () => {
    const btn = document.getElementById('btnGiris');
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authSifre').value;
    if(!email || !pass) { alert("Lütfen e-posta ve şifrenizi girin!"); return; }

    btn.disabled = true;
    btn.innerText = "GİRİŞ YAPILIYOR... ⏳";
    btn.style.opacity = "0.7";

    auth.signInWithEmailAndPassword(email, pass).then((userCredential) => {
        isMisafir = false;
        document.getElementById('misafirUyariBanner').style.display = 'none';
        document.getElementById('benimVipRozetim').innerText = "VIP GOLD";
        document.getElementById('benimVipRozetim').style.background = "";

        db.collection("kullanicilar").doc(userCredential.user.uid).get().then(doc => {
            let kayitliNick = "";
            if(doc.exists && doc.data().isim) {
                kayitliNick = doc.data().isim;
                benimAnlikCipim = doc.data().cip || 250000;
                benimEnvanterim = doc.data().envanter || [];
                aktifKozmetikler = doc.data().aktifKozmetikler || [];
                sonBonusTarihim = doc.data().sonBonusTarihi || "";
                benimArkadaslarim = doc.data().arkadaslar || []; 
            } else {
                kayitliNick = email.split('@')[0].toUpperCase(); 
                benimAnlikCipim = 250000;
                db.collection("kullanicilar").doc(userCredential.user.uid).set({
                    isim: kayitliNick, cip: 250000, envanter: [], aktifKozmetikler: [], sonBonusTarihi: "", arkadaslar: [], oynananOyun: 0, kazanilanOyun: 0
                });
            }
            
            btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1";
            
            oyunaGirisYap(kayitliNick); 
            arayuzGuncelle(); 
            gunlukBonusKontrol();
        }).catch(dbError => { 
            console.error("Hata:", dbError);
            alert("Veritabanı bağlantısında geçici bir kopukluk oldu. Lütfen sayfayı yenileyip tekrar deneyin."); 
            btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1";
        });
    }).catch(error => { 
        alert("Giriş Başarısız. E-posta veya şifre yanlış."); 
        btn.disabled = false; btn.innerText = "GİRİŞ YAP"; btn.style.opacity = "1";
    });
});

function oyunaGirisYap(isim) {
    aktifKullaniciAdi = isim;
    document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
    authEkrani.style.display = 'none';
    vipHeader.style.display = 'flex';
    lobiEkrani.style.display = 'flex';
    socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler });
}

socket.on('sen_masadasin', (masaAdi) => {
    suAnkiMasam = masaAdi;
    lobiEkrani.style.display = 'none';
    masaEkrani.style.display = 'flex';
    document.getElementById('masaOrtasiYazi').innerText = masaAdi.toUpperCase();
    socket.emit('masaya_geri_don', { masaAdi: masaAdi, isim: aktifKullaniciAdi });
});

window.liderlikTablosunuAc = function() {
    document.getElementById('liderlikEkrani').style.display = 'flex';
    const listeDiv = document.getElementById('liderlikListesi');
    listeDiv.innerHTML = '<p style="text-align:center; color:#f2c94c; font-weight:bold;">Veritabanı taranıyor...</p>';

    db.collection("kullanicilar").orderBy("cip", "desc").limit(5).get().then((querySnapshot) => {
          listeDiv.innerHTML = '';
          if(querySnapshot.empty) { listeDiv.innerHTML = '<p style="text-align:center; color:#777;">Henüz sıralama oluşmadı.</p>'; return; }

          let index = 0;
          querySnapshot.forEach((doc) => {
              const oyuncu = doc.data();
              if(oyuncu.isim.startsWith('MİSAFİR_')) return; 

              let siraClass = ''; let kupa = '';
              if(index === 0) { siraClass = 'sira-1'; kupa = '🏆'; }
              else if(index === 1) { siraClass = 'sira-2'; kupa = '🥈'; }
              else if(index === 2) { siraClass = 'sira-3'; kupa = '🥉'; }
              else { siraClass = ''; kupa = '🏅'; }
              
              let kozmetikler = oyuncu.aktifKozmetikler || [];
              let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff';
              let isimGolge = kozmetikler.includes('atesli_isim') ? '0 0 5px #ff0000' : 'none';
              let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';

              listeDiv.innerHTML += `
                  <div class="lider-satir" style="cursor:pointer;" onclick="profiliGoster('${oyuncu.isim}')">
                      <div class="lider-sira ${siraClass}">${index + 1}.</div>
                      <div class="lider-isim" style="color:${isimRenk}; text-shadow:${isimGolge};">${kupa} ${tac}${oyuncu.isim}</div>
                      <div class="lider-cip">${oyuncu.cip.toLocaleString('tr-TR')} ÇİP</div>
                  </div>
              `;
              index++;
          });
      }).catch((error) => { console.log("Liderlik tablosu hatası:", error); listeDiv.innerHTML = '<p style="text-align:center; color:#e74c3c;">Bağlantı hatası, liste alınamadı.</p>'; });
}

socket.on('online_oyuncular', (liste) => {
    onlineOyuncularListesi = liste;
    const lobiDiv = document.getElementById('lobidekilerListesi');
    if(!lobiDiv) return;
    
    lobiDiv.innerHTML = '';
    liste.forEach(oyuncuIsmi => {
        if(oyuncuIsmi === aktifKullaniciAdi) return; 
        
        let kozmetikler = globalKozmetikler[oyuncuIsmi] || [];
        let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#0dcaf0';
        let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';
        
        let butonHtml = '';
        if(!isMisafir && !oyuncuIsmi.startsWith('MİSAFİR_') && !benimArkadaslarim.includes(oyuncuIsmi)) {
            butonHtml = `<button class="btn-arkadas-ekle" onclick="arkadasEkle('${oyuncuIsmi}')">+ Ekle</button>`;
        }

        lobiDiv.innerHTML += `
            <div class="lobi-oyuncu-satir">
                <span class="lobi-oyuncu-isim" style="color:${isimRenk}; cursor:pointer;" onclick="profiliGoster('${oyuncuIsmi}')"><span class="online-nokta"></span>${tac}${oyuncuIsmi}</span>
                ${butonHtml}
            </div>
        `;
    });
});

window.arkadasEkle = function(isim) {
    if(isMisafir) return;
    if(!benimArkadaslarim.includes(isim)) {
        benimArkadaslarim.push(isim);
        if(auth.currentUser) {
            db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }).then(() => {
                alert(`✅ ${isim} arkadaş listene eklendi!`);
            });
        }
    }
}

window.arkadaslarMenusuAc = function() {
    if(isMisafir) { alert("⚠️ Misafir hesapların arkadaş listesi kapalıdır."); return; }
    document.getElementById('arkadaslarEkrani').style.display = 'flex';
    
    const listeDiv = document.getElementById('arkadasListesiDiv');
    listeDiv.innerHTML = '';
    
    if(benimArkadaslarim.length === 0) {
        listeDiv.innerHTML = '<p style="text-align:center; color:#777; font-size:12px;">Henüz hiç arkadaşın yok. Lobiden ekleyebilirsin!</p>';
        return;
    }

    benimArkadaslarim.forEach(arkadas => {
        let isOnline = onlineOyuncularListesi.includes(arkadas);
        let durumNoktasi = isOnline ? '<span class="online-nokta"></span>' : '<span class="offline-nokta"></span>';
        
        let kozmetikler = globalKozmetikler[arkadas] || [];
        let isimRenk = kozmetikler.includes('atesli_isim') ? '#ff4d4d' : '#fff';
        let tac = kozmetikler.includes('neon_tac') ? '👑 ' : '';
        
        let davetButonu = '';
        if(isOnline && suAnkiMasam) {
            davetButonu = `<button class="btn-davet-et" onclick="masayaDavetEt('${arkadas}')">📥 Davet Et</button>`;
        }

        listeDiv.innerHTML += `
            <div class="lider-satir">
                <div class="lider-isim" style="color:${isimRenk}; cursor:pointer;" onclick="profiliGoster('${arkadas}')">${durumNoktasi} ${tac}${arkadas}</div>
                ${davetButonu}
            </div>
        `;
    });
}

window.masayaDavetEt = function(arkadasIsmi) {
    event.stopPropagation(); 
    if(!suAnkiMasam) return;
    socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: arkadasIsmi, masaAdi: suAnkiMasam });
    alert(`💌 ${arkadasIsmi} adlı oyuncuya davet gönderildi!`);
    document.getElementById('arkadaslarEkrani').style.display = 'none';
}

socket.on('davet_geldi', (data) => {
    if(data.kime === aktifKullaniciAdi && !suAnkiMasam) { 
        document.getElementById('davetEdenIsim').innerText = data.kimden;
        document.getElementById('davetMasaIsim').innerText = data.masaAdi;
        document.getElementById('davetGeldiEkrani').style.display = 'flex';
        
        document.getElementById('btnDavetKabul').onclick = function() {
            document.getElementById('davetGeldiEkrani').style.display = 'none';
            masayaOtur(data.masaAdi); 
        };
    }
});

function gunlukBonusKontrol() {
    if(isMisafir) return; 
    const bugun = new Date().toLocaleDateString('tr-TR');
    if (sonBonusTarihim !== bugun) { setTimeout(() => { document.getElementById('gunlukBonusEkrani').style.display = 'flex'; }, 1000); }
}

window.gunlukKasaCevir = function() {
    if(isMisafir) return;
    const btn = document.getElementById('btnBonusCevir');
    const gosterge = document.getElementById('dijitalGosterge');
    btn.disabled = true; btn.innerText = "KASA AÇILIYOR...";

    const oduller = [10000, 25000, 50000, 100000, 250000, 500000];
    let kazanilanOdul = 10000; const sans = Math.random();
    if(sans > 0.5) kazanilanOdul = 25000;
    if(sans > 0.8) kazanilanOdul = 50000;
    if(sans > 0.9) kazanilanOdul = 100000;
    if(sans > 0.95) kazanilanOdul = 250000;
    if(sans > 0.98) kazanilanOdul = 500000;

    let animasyonSayaci = 0;
    const animasyonAraligi = setInterval(() => {
        const rastgeleSayi = Math.floor(Math.random() * 900000) + 100000;
        gosterge.innerText = rastgeleSayi.toLocaleString('tr-TR');
        animasyonSayaci += 50;
        if (animasyonSayaci >= 3000) {
            clearInterval(animasyonAraligi);
            gosterge.innerText = kazanilanOdul.toLocaleString('tr-TR');
            gosterge.style.color = '#2ecc71'; gosterge.style.borderColor = '#2ecc71'; gosterge.style.boxShadow = 'inset 0 0 30px rgba(46, 204, 113, 0.4)';
            oduluKaydet(kazanilanOdul);
        }
    }, 50);
}

function oduluKaydet(odulMiktari) {
    const bugun = new Date().toLocaleDateString('tr-TR');
    benimAnlikCipim += odulMiktari; sonBonusTarihim = bugun;
    if(auth.currentUser) {
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim, sonBonusTarihi: bugun }).then(() => {
            document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
            socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler });
            setTimeout(() => { alert(`Tebrikler! Günlük kasanızdan ${odulMiktari.toLocaleString('tr-TR')} ÇİP çıktı! Yarın tekrar gelin.`); document.getElementById('gunlukBonusEkrani').style.display = 'none'; }, 1000);
        });
    }
}

window.magazaIslem = function(esyaId, fiyat) {
    if(isMisafir) { alert("⚠️ MİSAFİR HESAPLAR MAĞAZADAN ALIŞVERİŞ YAPAMAZ!\nLütfen lobiye dönüp gerçek bir VIP hesap kaydedin."); return; }
    
    if (!benimEnvanterim.includes(esyaId)) {
        if (benimAnlikCipim < fiyat) { alert("Bunun için yeterli çipin yok patron!"); return; }
        
        benimAnlikCipim -= fiyat; 
        benimEnvanterim.push(esyaId); 
        aktifKozmetikler.push(esyaId); 
        document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
        arayuzGuncelle(); 

        socket.emit('magaza_harcamasi', { isim: aktifKullaniciAdi, yeniCip: benimAnlikCipim });
        socket.emit('kozmetik_guncelle', { isim: aktifKullaniciAdi, kozmetikler: aktifKozmetikler }); 

        if(auth.currentUser) {
            db.collection("kullanicilar").doc(auth.currentUser.uid).update({ 
                cip: benimAnlikCipim, envanter: benimEnvanterim, aktifKozmetikler: aktifKozmetikler 
            }).then(() => {
                alert("✅ Satın alma başarılı! Eşya otomatik olarak kuşanıldı.");
            });
        }
    } else {
        if(aktifKozmetikler.includes(esyaId)) { aktifKozmetikler = aktifKozmetikler.filter(e => e !== esyaId); } 
        else { aktifKozmetikler.push(esyaId); }
        
        arayuzGuncelle(); 
        socket.emit('kozmetik_guncelle', { isim: aktifKullaniciAdi, kozmetikler: aktifKozmetikler }); 

        if(auth.currentUser) { 
            db.collection("kullanicilar").doc(auth.currentUser.uid).update({ aktifKozmetikler: aktifKozmetikler }); 
        }
    }
}

function arayuzGuncelle() {
    const avatar = document.getElementById('vipAvatar');
    const isimKutu = document.getElementById('benimAdimKutusu');
    const lobiIsim = document.getElementById('lobiBenimAdim');
    
    if(avatar) { avatar.style.border = '2px solid #52796f'; avatar.style.boxShadow = 'none'; }
    if(isimKutu) { isimKutu.style.color = '#fff'; isimKutu.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)'; }
    if(lobiIsim) { lobiIsim.style.color = '#f2c94c'; lobiIsim.style.textShadow = 'none'; }
    
    let tacEki = ""; if(aktifKozmetikler.includes('neon_tac')) { tacEki = "👑 "; }

    if(aktifKullaniciAdi) {
        if(isimKutu) isimKutu.innerHTML = tacEki + aktifKullaniciAdi + ' <span style="color:#2ecc71;">✔</span>';
        if(lobiIsim) lobiIsim.innerText = tacEki + aktifKullaniciAdi; 
    }

    if(aktifKozmetikler.includes('altin_cerceve') && avatar) { avatar.style.border = '3px solid #f2c94c'; avatar.style.boxShadow = '0 0 15px #f2c94c'; }
    if(aktifKozmetikler.includes('atesli_isim')) {
        if(isimKutu) { isimKutu.style.color = '#ff4d4d'; isimKutu.style.textShadow = '0 0 8px #ff0000'; }
        if(lobiIsim) { lobiIsim.style.color = '#ff4d4d'; lobiIsim.style.textShadow = '0 0 5px #ff0000'; }
    }
    
    const esyalar = [ {id: 'altin_cerceve', fiyat: '500.000'}, {id: 'neon_tac', fiyat: '1.5M'}, {id: 'atesli_isim', fiyat: '3M'} ];
    
    esyalar.forEach(esya => {
        const btn = document.getElementById('btn_' + esya.id);
        if(btn) {
            if(aktifKozmetikler.includes(esya.id)) { btn.innerText = 'ÇIKAR'; btn.style.background = '#e74c3c'; btn.style.color = '#fff'; } 
            else if(benimEnvanterim.includes(esya.id)) { btn.innerText = 'KULLAN'; btn.style.background = '#2ecc71'; btn.style.color = '#fff'; } 
            else { btn.innerText = esya.fiyat + ' ÇİP'; btn.style.background = ''; btn.style.color = ''; }
        }
    });
}

socket.on('kozmetikleri_guncelle', (data) => {
    globalKozmetikler = data;
    if(suAnkiMasam && guncelMasalar[suAnkiMasam]) { gelişmişKoltukHizala(guncelMasalar[suAnkiMasam]); }
    if(document.getElementById('lobiEkrani').style.display !== 'none') { socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); }
});

socket.on('cip_guncelle', (cip) => { 
    benimAnlikCipim = cip; 
    document.getElementById('benimCipim').innerText = cip.toLocaleString('tr-TR'); 
});

socket.on('cip_guncelle_ozel', (data) => { 
    if(data.isim === aktifKullaniciAdi) {
        benimAnlikCipim = data.cip; document.getElementById('benimCipim').innerText = data.cip.toLocaleString('tr-TR'); 
        if(auth.currentUser && !isMisafir) { db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: data.cip }); }
    }
});

socket.on('hata_mesaji', (mesaj) => { alert(mesaj); });


const oyunuBaslatBtn = document.getElementById('oyunuBaslatBtn');
const oyunAlanObjeleri = document.getElementById('oyunAlanObjeleri');
const kalanTasBilgi = document.getElementById('kalanTasBilgi');
const bitisAlani = document.getElementById('bitisAlani');
const ustRaf = document.getElementById('ustRaf');
const altRaf = document.getElementById('altRaf');
const masaOrtasiYazi = document.getElementById('masaOrtasiYazi');
const masaKasaBilgisi = document.getElementById('masaKasaBilgisi');
const masalarAlani = document.getElementById('masalarAlani');

let gostergeBtn = document.createElement('button');
gostergeBtn.id = 'gostergeBtn'; gostergeBtn.innerText = '⭐ GÖSTERGE YAP'; gostergeBtn.className = 'gosterge-btn';
gostergeBtn.onclick = () => { socket.emit('gosterge_goster', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); gostergeBtn.style.display = 'none'; };
document.getElementById('oyunAlanObjeleri').firstElementChild.appendChild(gostergeBtn);

function masayiTemizle() {
    masaOyunBasladiMi = false; 
    const flash = document.getElementById('flashBildirim'); if (flash) flash.classList.remove('goster'); 
    document.getElementById('sonucEkrani').style.display = 'none'; oyunAlanObjeleri.style.display = 'none'; gostergeBtn.style.display = 'none'; gostergeHakki = false; 
    oyunuBaslatBtn.innerText = "🎲 OYUNU BAŞLAT"; oyunuBaslatBtn.style.display = 'block'; bitisAlani.style.display = 'none'; masaKasaBilgisi.style.display = 'none'; bitisAlani.innerHTML = 'BİTİR<br>🏆'; 
    for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = '';
    document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>';
    document.getElementById('iskartaSag').innerHTML = ''; document.getElementById('iskartaSol').innerHTML = ''; document.getElementById('iskartaUst').innerHTML = '';
    document.getElementById('benimAdimKutusu').classList.remove('aktif-sira'); document.getElementById('seatRight').classList.remove('aktif-sira');
    document.getElementById('seatTop').classList.remove('aktif-sira'); document.getElementById('seatLeft').classList.remove('aktif-sira');
    benimSiramMi = false;
}

socket.on('gosterge_basarili', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        if (data.isim === aktifKullaniciAdi) { gostergeHakki = false; gostergeBtn.style.display = 'none'; }
        sesCal(sesSiraSende); 
        
        document.getElementById('gostergeKutlamaMetni').innerHTML = `<strong style="color:#f2c94c;">${data.isim}</strong> gösterge yaptı!`;
        document.getElementById('gostergeKutlamaOdul').innerText = `+${data.odul.toLocaleString('tr-TR')} ÇİP`;
        
        const kutlamaEkrani = document.getElementById('gostergeKutlamaEkrani');
        kutlamaEkrani.style.display = 'flex';
        
        setTimeout(() => {
            kutlamaEkrani.style.display = 'none';
        }, 3500);
    }
});

function checkGosterge() {
    gostergeBtn.style.display = 'none'; if(!gostergeHakki || !benimSiramMi) return; 
    let gostergeDiv = document.getElementById('gostergeTasi');
    if(gostergeDiv.innerText) {
        let gSayi = gostergeDiv.innerText; let renkClass = Array.from(gostergeDiv.classList).find(c => c.startsWith('tas-')); if(!renkClass) return; let gRenk = renkClass.replace('tas-', ''); let varMi = false;
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
        let yuva = document.getElementById('y'+i); if(yuva.children.length > 0) { let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); let renk = renkClass ? renkClass.replace('tas-', '') : ''; currentGrup.push({ id: tas.id, renk: renk, sayi: tas.innerText }); } 
        else { if(currentGrup.length > 0) { gruplar.push(currentGrup); currentGrup = []; } }
    }
    if(currentGrup.length > 0) gruplar.push(currentGrup); return gruplar;
}

const sortableOptions = {
    group: { name: 'istaka', put: (to) => to.el.children.length === 0 }, animation: 100, delay: 0, forceFallback: true, fallbackOnBody: true, fallbackTolerance: 3, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag', easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    onEnd: function() { sesCal(sesTasKoy); }
};

for(let i=0; i<12; i++) {
    const yUst = document.createElement('div'); yUst.className = 'yuva'; yUst.id = 'y'+i; ustRaf.appendChild(yUst); new Sortable(yUst, sortableOptions);
    const yAlt = document.createElement('div'); yAlt.className = 'yuva'; yAlt.id = 'y'+(i+12); altRaf.appendChild(yAlt); new Sortable(yAlt, sortableOptions);
}

new Sortable(document.getElementById('benimIskartam'), {
    group: { name: 'istaka', put: function (to) { return benimSiramMi && elimdekiTasSayisi() === 15; }, pull: false }, animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, 
    onAdd: function (evt) {
        gostergeHakki = false; gostergeBtn.style.display = 'none'; document.getElementById('iskartaYazi').style.display = 'none'; const atilanTas = evt.item; atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0';
        let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText } }); sesCal(sesTasKoy);
    }
});

new Sortable(bitisAlani, {
    group: { name: 'istaka', put: function (to) { return benimSiramMi && elimdekiTasSayisi() === 15; }, pull: false }, animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, 
    onAdd: function (evt) {
        gostergeHakki = false; gostergeBtn.style.display = 'none'; const atilanTas = evt.item; atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0';
        let gruplar = getIstakaGruplari(); let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; const bitisTasi = { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText };
        socket.emit('oyunu_bitir', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, gruplar: gruplar, bitisTasi: bitisTasi }); sesCal(sesTasKoy);
    }
});

socket.on('hatali_bitis', (mesaj) => { const tas = bitisAlani.querySelector('.okey-tasi'); if (tas) { for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { document.getElementById('y'+i).appendChild(tas); tas.style.position = ''; tas.style.top = ''; tas.style.left = ''; tas.style.transform = ''; tas.style.margin = ''; break; } } } setTimeout(() => { alert(mesaj); }, 100); });

function otomatikTasAt(tasElementi) {
    if (!benimSiramMi || elimdekiTasSayisi() !== 15) return; 
    gostergeHakki = false; gostergeBtn.style.display = 'none'; const iskartaKutusu = document.getElementById('benimIskartam');
    if (iskartaKutusu) { iskartaKutusu.appendChild(tasElementi); tasElementi.style.position = 'absolute'; tasElementi.style.top = '50%'; tasElementi.style.left = '50%'; tasElementi.style.transform = 'translate(-50%, -50%)'; tasElementi.style.margin = '0'; document.getElementById('iskartaYazi').style.display = 'none'; let renkSinifi = Array.from(tasElementi.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: tasElementi.id, renk: renk, sayi: tasElementi.innerText } }); sesCal(sesTasKoy); }
}

window.seriDiz = function() {
    let taslar = []; for(let i=0; i<24; i++) { let yuva = document.getElementById('y'+i); if(yuva.children.length > 0) { let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); let renk = renkClass ? renkClass.replace('tas-', '') : ''; taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 }); } }
    const renkDeger = { 'kirmizi': 1, 'siyah': 2, 'mavi': 3, 'sari': 4, 'sahte': 5 }; taslar.sort((a, b) => { if (renkDeger[a.renk] !== renkDeger[b.renk]) return renkDeger[a.renk] - renkDeger[b.renk]; return a.sayi - b.sayi; }); taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); }); sesCal(sesTasCek);
};

window.ciftDiz = function() {
    let taslar = []; for(let i=0; i<24; i++) { let yuva = document.getElementById('y'+i); if(yuva.children.length > 0) { let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); let renk = renkClass ? renkClass.replace('tas-', '') : ''; taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 }); } }
    taslar.sort((a, b) => { if (a.sayi !== b.sayi) return a.sayi - b.sayi; return a.renk.localeCompare(b.renk); }); taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); }); sesCal(sesTasCek);
};

function kurtarmaSinyaliGonder() { if (document.getElementById('oyunuBaslatBtn').style.display !== 'none' && suAnkiMasam) { socket.emit('taslarimi_ver', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); } }

kalanTasBilgi.addEventListener('click', () => { if (benimSiramMi && elimdekiTasSayisi() === 14) { gostergeHakki = false; gostergeBtn.style.display = 'none'; socket.emit('ortadan_tas_cek', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); sesCal(sesTasCek); } else if(!benimSiramMi) alert("Şu an sıra sizde değil!"); else alert("Önce elinizdeki fazlalık taşı sağdaki oyuncuya atmalısınız!"); });

document.getElementById('iskartaSol').addEventListener('click', function() { if (benimSiramMi && elimdekiTasSayisi() === 14 && this.children.length > 0) { gostergeHakki = false; gostergeBtn.style.display = 'none'; const tasEl = this.lastElementChild; let renkSinifi = Array.from(tasEl.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; const tasObj = { id: tasEl.id, sayi: tasEl.innerText, renk: renk }; this.innerHTML = ''; for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { tasEkle(tasObj, 'y'+i); break; } } socket.emit('yandan_tas_alindi', { masaAdi: suAnkiMasam, kimAldi: aktifKullaniciAdi, tas: tasObj }); sesCal(sesTasCek); } else if(!benimSiramMi) alert("Şu an sıra sizde değil!"); else if(elimdekiTasSayisi() === 15) alert("Elinizde zaten 15 taş var!"); });

socket.on('ortaya_tas_atildi', (data) => { if(suAnkiMasam === data.masaAdi) { let target = null; if(data.kimAtti === document.getElementById('seatRight').dataset.isim) target = 'iskartaSag'; else if(data.kimAtti === document.getElementById('seatTop').dataset.isim) target = 'iskartaUst'; else if(data.kimAtti === document.getElementById('seatLeft').dataset.isim) target = 'iskartaSol'; if(target) { const kutu = document.getElementById(target); kutu.innerHTML = ''; const div = document.createElement('div'); div.className = `okey-tasi tas-${data.tas.renk}`; div.innerText = data.tas.sayi; div.id = data.tas.id; div.style.position = 'absolute'; div.style.top = '50%'; div.style.left = '50%'; div.style.transform = 'translate(-50%, -50%)'; div.style.margin = '0'; div.style.pointerEvents = 'none'; if(target === 'iskartaSol') div.style.pointerEvents = 'auto'; kutu.appendChild(div); sesCal(sesTasKoy); } } });

socket.on('yandan_alindi_guncelle', (data) => { if(data.masaAdi === suAnkiMasam && data.kimAldi !== aktifKullaniciAdi) { let source = null; if(data.kimAldi === document.getElementById('seatRight').dataset.isim) source = 'benimIskartam'; else if(data.kimAldi === document.getElementById('seatTop').dataset.isim) source = 'iskartaSag'; else if(data.kimAldi === document.getElementById('seatLeft').dataset.isim) source = 'iskartaUst'; if(source) { document.getElementById(source).innerHTML = ''; if(source === 'benimIskartam') document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; sesCal(sesTasCek); } } });

socket.on('oyun_bitti', (data) => { 
    if(suAnkiMasam === data.masaAdi) { 
        const sonucEkrani = document.getElementById('sonucEkrani'); 
        const baslik = document.getElementById('sonucBaslik'); 
        const metin = document.getElementById('sonucMetin'); 
        const odul = document.getElementById('sonucOdul'); 
        
        if(auth.currentUser && !isMisafir && data.kazanan) {
            const userRef = db.collection("kullanicilar").doc(auth.currentUser.uid);
            if(data.kazanan === aktifKullaniciAdi) {
                userRef.update({
                    oynananOyun: firebase.firestore.FieldValue.increment(1),
                    kazanilanOyun: firebase.firestore.FieldValue.increment(1)
                });
            } else {
                userRef.update({
                    oynananOyun: firebase.firestore.FieldValue.increment(1)
                });
            }
        }

        if (data.kazanan) { 
            if (data.kazanan === aktifKullaniciAdi) { 
                baslik.innerText = data.okeyleBittiMi ? "🔥 OKEYLE BİTİRDİN! 🔥" : "🏆 TEBRİKLER, KAZANDIN! 🏆"; 
                baslik.style.color = data.okeyleBittiMi ? "#ff3333" : "#f2c94c"; 
            } else { 
                baslik.innerText = data.okeyleBittiMi ? "🚨 RAKİP OKEY ATTI! 🚨" : "🎉 OYUN BİTTİ 🎉"; 
                baslik.style.color = data.okeyleBittiMi ? "#ff3333" : "#f2c94c"; 
            } 
            metin.innerText = `Kazanan: ${data.kazanan}\nSebep: ${data.sebep}`; 
            odul.innerText = `+${data.odul.toLocaleString('tr-TR')} ÇİP`; 
            sesCal(sesSiraSende); 
        } else { 
            baslik.innerText = "🛑 OYUN BİTTİ 🛑"; 
            baslik.style.color = "#dc3545"; 
            metin.innerText = data.sebep || "Masadaki herkes ayrıldı."; 
            odul.innerText = ""; 
        } 
        
        sonucEkrani.style.display = 'flex'; 
        const flash = document.getElementById('flashBildirim'); if (flash) flash.classList.remove('goster'); 
        oyunAlanObjeleri.style.display = 'none'; 
        gostergeBtn.style.display = 'none'; 
        gostergeHakki = false; 
        oyunuBaslatBtn.innerText = "🔄 AYNI MASADA TEKRAR OYNA"; 
        oyunuBaslatBtn.style.display = 'block'; 
        bitisAlani.style.display = 'none'; 
        masaKasaBilgisi.style.display = 'none'; 
        bitisAlani.innerHTML = 'BİTİR<br>🏆'; 
        
        for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; 
        document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; 
        document.getElementById('iskartaSag').innerHTML = ''; 
        document.getElementById('iskartaSol').innerHTML = ''; 
        document.getElementById('iskartaUst').innerHTML = ''; 
        
        benimSiramMi = false; 
        masaOyunBasladiMi = false; 
    } 
});

socket.on('masalari_guncelle', (lobidekiMasalar) => { guncelMasalar = lobidekiMasalar; masalarAlani.innerHTML = ''; for (const [masaAdi, koltuklar] of Object.entries(lobidekiMasalar)) { const doluKoltukSayisi = koltuklar.filter(k => k !== null).length; const benBuMasadaMiyim = koltuklar.includes(aktifKullaniciAdi); const html = `<div class="masa-kart"><div class="masa-watermark"></div><div class="kart-sol"><div class="zar-kutu">🎲</div><div class="masa-kart-isim">${masaAdi}</div></div><div class="kart-sag"><div class="masa-kisi-kutu">🎲 ${doluKoltukSayisi}/4</div><button class="btn-otur ${benBuMasadaMiyim || doluKoltukSayisi>=4 ? 'disabled':''}" style="${benBuMasadaMiyim ? 'background:#2ecc71;color:#111;':''}" onclick="masayaOtur('${masaAdi}')">${benBuMasadaMiyim ? 'OTURDUN ✓' : (doluKoltukSayisi>=4 ? 'DOLU' : 'OTUR')}</button></div></div>`; masalarAlani.innerHTML += html; if(benBuMasadaMiyim) gelişmişKoltukHizala(koltuklar); } });

function gelişmişKoltukHizala(koltuklar) { 
    const index = koltuklar.indexOf(aktifKullaniciAdi); 
    if (index === -1) return; 
    const sR = koltuklar[(index + 1) % 4] || ""; const sT = koltuklar[(index + 2) % 4] || ""; const sL = koltuklar[(index + 3) % 4] || "";
    document.getElementById('seatRight').dataset.isim = sR; document.getElementById('seatTop').dataset.isim = sT; document.getElementById('seatLeft').dataset.isim = sL;
    koltukStiliUygula('seatRight', sR); koltukStiliUygula('seatTop', sT); koltukStiliUygula('seatLeft', sL);
}

function koltukStiliUygula(elementId, oyuncuIsmi) {
    const el = document.getElementById(elementId);
    if(!oyuncuIsmi || oyuncuIsmi.startsWith('Bot_')) { el.innerText = oyuncuIsmi || "Bekleniyor..."; el.style.color = "#0dcaf0"; el.style.textShadow = "none"; return; }
    let kozmetikler = globalKozmetikler[oyuncuIsmi] || []; let tac = kozmetikler.includes('neon_tac') ? "👑 " : ""; el.innerText = tac + oyuncuIsmi;
    if(kozmetikler.includes('atesli_isim')) { el.style.color = '#ff4d4d'; el.style.textShadow = '0 0 5px #ff0000'; } else { el.style.color = '#0dcaf0'; el.style.textShadow = 'none'; }
}

window.masayaOtur = function(masaAdi) { 
    let bahis = 0;
    if(masaAdi.includes('20K')) bahis = 20000;
    else if(masaAdi.includes('50K')) bahis = 50000;
    else if(masaAdi.includes('10K')) bahis = 10000;

    if (benimAnlikCipim < bahis) {
        alert("⚠️ Yetersiz Bakiye! Bu masaya oturmak için en az " + bahis.toLocaleString() + " ÇİP gerekiyor.");
        return;
    }

    suAnkiMasam = masaAdi; 
    socket.emit('masaya_otur', { isim: aktifKullaniciAdi, masaAdi: masaAdi }); 
    lobiEkrani.style.display = 'none'; 
    masaEkrani.style.display = 'flex'; 
    masaOrtasiYazi.innerText = masaAdi.toUpperCase(); 
};

oyunuBaslatBtn.addEventListener('click', () => { socket.emit('oyunu_baslat', suAnkiMasam); });
document.querySelector('.btn-hemen-oyna').addEventListener('click', () => { if (suAnkiMasam) return; let musaitMasa = null; for (const [masaAdi, koltuklar] of Object.entries(guncelMasalar)) { if (koltuklar.filter(k => k !== null).length < 4) { musaitMasa = masaAdi; break; } } if (musaitMasa) masayaOtur(musaitMasa); else alert("Şu an tüm masalar tam kapasite dolu, patron!"); });
socket.on('masa_kasa_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { masaKasaBilgisi.style.display = 'block'; masaKasaBilgisi.innerText = 'KASA: ' + data.kasa.toLocaleString('tr-TR') + ' ÇİP'; } });
socket.on('masa_oyun_basladi', (data) => { if(suAnkiMasam === data.masaAdi) { masaOyunBasladiMi = true; masayiTemizle(); oyunuBaslatBtn.style.display = 'none'; oyunAlanObjeleri.style.display = 'flex'; bitisAlani.style.display = 'flex'; gostergeHakki = true; kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { const gostergeDiv = document.getElementById('gostergeTasi'); gostergeDiv.innerText = data.gosterge.sayi; gostergeDiv.className = `gosterge-tasi tas-${data.gosterge.renk}`; } if(data.kasa) { masaKasaBilgisi.style.display = 'block'; masaKasaBilgisi.innerText = 'KASA: ' + data.kasa.toLocaleString('tr-TR') + ' ÇİP'; } if (guncelMasalar[data.masaAdi]) gelişmişKoltukHizala(guncelMasalar[data.masaAdi]); } });
socket.on('taslari_al', (data) => { if (data.kime === aktifKullaniciAdi) { for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; data.taslar.forEach((tas, index) => { tasEkle(tas, 'y'+index); }); setTimeout(checkGosterge, 500); } });
socket.on('tas_cekildi', (tas) => { for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { tasEkle(tas, 'y'+i); break; } } });
function tasEkle(tasData, yuvaId) { const div = document.createElement('div'); div.className = `okey-tasi tas-${tasData.renk}`; div.innerText = tasData.sayi; div.id = tasData.id; let sonDokunma = 0; let surukleniyorMu = false; div.addEventListener('touchstart', () => { surukleniyorMu = false; }, {passive: true}); div.addEventListener('touchmove', () => { surukleniyorMu = true; }, {passive: true}); div.addEventListener('touchend', function(e) { if(surukleniyorMu) return; const simdi = new Date().getTime(); if (simdi - sonDokunma < 300) { e.preventDefault(); otomatikTasAt(this); } sonDokunma = simdi; }); div.addEventListener('dblclick', function() { otomatikTasAt(this); }); document.getElementById(yuvaId).appendChild(div); }
socket.on('sira_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { kurtarmaSinyaliGonder(); const eskiSira = benimSiramMi; benimSiramMi = (data.kimde === aktifKullaniciAdi); if(benimSiramMi && !eskiSira) sesCal(sesSiraSende); const iskarta = document.getElementById('benimIskartam'); if(benimSiramMi) iskarta.classList.remove('kilitli-iskarta'); else iskarta.classList.add('kilitli-iskarta'); const koltuklar = [ { id: 'benimAdimKutusu', isim: aktifKullaniciAdi }, { id: 'seatRight', isim: document.getElementById('seatRight').dataset.isim }, { id: 'seatTop', isim: document.getElementById('seatTop').dataset.isim }, { id: 'seatLeft', isim: document.getElementById('seatLeft').dataset.isim } ]; koltuklar.forEach(k => { const el = document.getElementById(k.id); if(el && k.isim === data.kimde) el.classList.add('aktif-sira'); else if(el) el.classList.remove('aktif-sira'); }); checkGosterge(); } });
socket.on('masa_ortasi_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { kurtarmaSinyaliGonder(); kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { const gostergeDiv = document.getElementById('gostergeTasi'); gostergeDiv.innerText = data.gosterge.sayi; gostergeDiv.className = `gosterge-tasi tas-${data.gosterge.renk}`; } } });

const sohbetCekmecesi = document.getElementById('sohbetCekmecesi');
document.getElementById('sohbetAcBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.add('acik'); });
document.getElementById('sohbetKapatBtn')?.addEventListener('click', () => { sohbetCekmecesi.classList.remove('acik'); });
document.getElementById('sohbetGonderBtn')?.addEventListener('click', () => { if(isMisafir) { alert("⚠️ MİSAFİR HESAPLAR SOHBETE MESAJ YAZAMAZ!\nLütfen lobiye dönüp gerçek bir VIP hesap kaydedin."); return; } const input = document.getElementById('sohbetInput'); if(input.value.trim() !== '' && suAnkiMasam) { socket.emit('sohbet_mesaji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, mesaj: input.value, kozmetikler: aktifKozmetikler }); input.value = ''; } });
window.vipEmojiGonder = function(emoji) { if(isMisafir) { alert("⚠️ MİSAFİR HESAPLAR EMOLİ GÖNDEREMEZ!\nLütfen lobiye dönüp gerçek bir VIP hesap kaydedin."); return; } if(suAnkiMasam) { socket.emit('vip_emoji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, emoji: emoji }); sohbetCekmecesi.classList.remove('acik'); } }
socket.on('yeni_sohbet_mesaji', (data) => { if(data.masaAdi === suAnkiMasam) { let isimRenk = "#f2c94c"; let isimGolge = "none"; let tacIcon = ""; if (data.kozmetikler) { if(data.kozmetikler.includes('atesli_isim')) { isimRenk = "#ff4d4d"; isimGolge = "0 0 5px #ff0000"; } if(data.kozmetikler.includes('neon_tac')) { tacIcon = "👑 "; } } const div = document.createElement('div'); div.className = 'pro-mesaj'; div.innerHTML = `<span class="pro-mesaj-isim" style="color:${isimRenk}; text-shadow:${isimGolge};">${tacIcon}${data.isim}</span>${data.mesaj}`; const mesajAlani = document.getElementById('sohbetMesajlari'); if(mesajAlani) { mesajAlani.appendChild(div); mesajAlani.scrollTop = mesajAlani.scrollHeight; } const anlikDiv = document.createElement('div'); anlikDiv.className = 'anlik-mesaj'; anlikDiv.innerHTML = `<strong style="color:${isimRenk}; text-shadow:${isimGolge};">${tacIcon}${data.isim}:</strong> ${data.mesaj}`; document.getElementById('anlikMesajAlani')?.appendChild(anlikDiv); setTimeout(() => { anlikDiv.remove(); }, 4000); } });
socket.on('yeni_vip_emoji', (data) => { if(data.masaAdi === suAnkiMasam) { const div = document.createElement('div'); div.className = 'ucan-emoji'; div.innerText = data.emoji; document.getElementById('masaEkrani').appendChild(div); setTimeout(() => { div.remove(); }, 2500); } });
socket.on('admin_flash_mesaj', (mesaj) => { const flash = document.getElementById('flashBildirim'); if (flash) { flash.innerHTML = `👑 PATRON DUYURUSU 👑<br><span style="font-size:18px; color:#fff; text-transform:none; margin-top:5px; display:block;">${mesaj}</span>`; flash.style.background = "linear-gradient(135deg, #c0392b, #8e44ad)"; flash.style.boxShadow = "0 15px 40px rgba(0,0,0,0.85), 0 0 25px rgba(192, 57, 43, 0.8)"; flash.style.borderColor = "#f2c94c"; flash.classList.remove('goster'); void flash.offsetWidth; flash.classList.add('goster'); setTimeout(() => { flash.style.background = ""; flash.style.boxShadow = ""; flash.style.borderColor = ""; }, 3500); } });
socket.on('admin_islem_uyarisi', (data) => { if(data.isim === aktifKullaniciAdi) { if(data.islem === 'kick') { alert("🚨 YÖNETİCİ TARAFINDAN MASADAN ATILDINIZ!"); if(suAnkiMasam) { suAnkiMasam = null; masayiTemizle(); document.getElementById('masaEkrani').style.display = 'none'; document.getElementById('lobiEkrani').style.display = 'flex'; } } else if(data.islem === 'ban') { alert("🛑 HESABINIZ SİSTEMDEN SINIRSIZ BANLANDI!"); location.reload(); } } });

socket.on('connect', () => {
    if (aktifKullaniciAdi) {
        socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler });
        if (suAnkiMasam) { socket.emit('masaya_geri_don', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); }
    }
});
