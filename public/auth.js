// public/auth.js

auth.onAuthStateChanged((user) => {
    if (user && !aktifKullaniciAdi) {
        let kayitliNick = user.email ? user.email.split('@')[0].toUpperCase() : "OYUNCU_" + Math.floor(Math.random()*1000); 
        let bugun = new Date().toLocaleDateString('tr-TR');
        db.collection("kullanicilar").doc(user.uid).get().then(doc => {
            if(doc.exists && doc.data().isim) {
                kayitliNick = doc.data().isim;
                benimAnlikCipim = parseInt(String(doc.data().cip).replace(/[^0-9]/g, '')) || 250000;
                benimEnvanterim = doc.data().envanter || []; 
                aktifKozmetikler = doc.data().aktifKozmetikler || [];
                sonBonusTarihim = doc.data().sonBonusTarihi || ""; 
                benimArkadaslarim = doc.data().arkadaslar || []; 
                benimKazanilanOyun = doc.data().kazanilanOyun || 0; 
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

function oyunaGirisYap(isim) { 
    aktifKullaniciAdi = isim; 
    document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); 
    authEkrani.style.display = 'none'; 
    vipHeader.style.display = 'flex'; 
    lobiEkrani.style.display = 'flex'; 
    socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); 
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

window.tamamenCikisYap = function() { auth.signOut().then(() => window.location.reload()).catch(() => window.location.reload()); };
document.getElementById('btnCikisYap').addEventListener('click', (e) => { e.stopPropagation(); if(confirm("Çıkış yapmak istediğinize emin misiniz?")) { if (suAnkiMasam) socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); tamamenCikisYap(); } });
