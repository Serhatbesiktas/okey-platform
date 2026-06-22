// --- PROFESYONEL ÖZEL MESAJLAŞMA VE ENGELLEME MODÜLÜ --- //

// 1. VIP Casino Tarzı CSS ve Ekranları Sayfaya Enjekte Edelim
const mesajStilleri = document.createElement('style');
mesajStilleri.innerHTML = `
    .vip-mesaj-modal {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        height: -webkit-fill-available;
        background: rgba(10, 15, 10, 0.95);
        backdrop-filter: blur(8px);
        z-index: 9999999;
        display: none; flex-direction: column; justify-content: center; align-items: center;
        overscroll-behavior: none; touch-action: none;
    }
    .vip-mesaj-kutu {
        width: 90%; max-width: 450px; max-height: 85vh;
        background: linear-gradient(145deg, #16221a 0%, #0a0f0c 100%);
        border: 2px solid #f2c94c;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(242, 201, 76, 0.2), inset 0 0 15px rgba(242, 201, 76, 0.1);
        display: flex; flex-direction: column;
        pointer-events: auto; touch-action: auto;
    }
    .vip-mesaj-header {
        border-bottom: 1px solid rgba(242, 201, 76, 0.3);
        padding: 15px; display: flex; justify-content: space-between; align-items: center;
    }
    .vip-mesaj-header h2 { color: #f2c94c; font-size: 18px; margin: 0; text-shadow: 0 0 10px rgba(242, 201, 76, 0.5); }
    .vip-mesaj-kapat { background: none; border: none; color: #e74c3c; font-size: 26px; cursor: pointer; font-weight: bold; }
    .vip-mesaj-liste {
        flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 12px;
        overscroll-behavior: contain;
    }
    .vip-mesaj-kart {
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid #52796f;
        border-radius: 12px; padding: 12px; position: relative;
    }
    .vip-mesaj-kart.yeni { border-color: #f2c94c; box-shadow: 0 0 10px rgba(242, 201, 76, 0.2); }
    .vip-mesaj-btn {
        background: #2c3e50; color: #fff; border: 1px solid #a3c4bc; padding: 6px 10px;
        border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; transition: 0.2s;
    }
    .vip-mesaj-btn:active { transform: scale(0.95); }
    .btn-cevapla { background: linear-gradient(135deg, #2ecc71, #27ae60); border-color: #2ecc71; }
    .btn-engelle { background: linear-gradient(135deg, #c0392b, #e74c3c); border-color: #e74c3c; }
    .btn-sil { background: #333; border-color: #555; }
    
    .vip-textarea {
        width: 100%; background: rgba(0,0,0,0.5); color: #fff; border: 1px solid #f2c94c;
        border-radius: 10px; padding: 12px; font-family: inherit; resize: none; font-size: 14px;
        box-sizing: border-box; outline: none; transition: 0.3s;
    }
    .vip-textarea:focus { box-shadow: 0 0 10px rgba(242, 201, 76, 0.3); }
`;
document.head.appendChild(mesajStilleri);

document.body.insertAdjacentHTML('beforeend', `
    <div id="ozelMesajEkrani" class="vip-mesaj-modal">
        <div class="vip-mesaj-kutu">
            <div class="vip-mesaj-header">
                <h2>✉️ GELEN KUTUSU</h2>
                <button onclick="kapatVIPMesajEkrani('ozelMesajEkrani')" class="vip-mesaj-kapat">×</button>
            </div>
            <div id="mesajListesi" class="vip-mesaj-liste">
                <p style="color:#777; text-align:center; font-size:12px; margin-top:30px;">Mesajlarınız yükleniyor...</p>
            </div>
        </div>
    </div>
    
    <div id="mesajYazmaEkrani" class="vip-mesaj-modal">
        <div class="vip-mesaj-kutu" style="max-width: 380px;">
            <div class="vip-mesaj-header">
                <h2 id="mesajYazmaBaslik">Mesaj Gönder</h2>
                <button onclick="kapatVIPMesajEkrani('mesajYazmaEkrani')" class="vip-mesaj-kapat">×</button>
            </div>
            <div style="padding: 15px;">
                <textarea id="mesajIcerik" class="vip-textarea" rows="4" placeholder="Mesajınızı buraya yazın..." maxlength="150"></textarea>
                <div style="text-align:right; color:#a3c4bc; font-size:10px; margin-top:5px; margin-bottom:15px;" id="charCount">0 / 150</div>
                <div style="display:flex; gap:10px;">
                    <button id="btnMesajGonder" class="satin-al-btn" style="flex:2; background:linear-gradient(135deg, #f2c94c, #f39c12); color:#000; font-weight:900;">GÖNDER</button>
                    <button onclick="kapatVIPMesajEkrani('mesajYazmaEkrani')" class="satin-al-btn" style="flex:1; background:#333; color:#fff;">İPTAL</button>
                </div>
            </div>
        </div>
    </div>
`);

// 2. Alt Menüye Tuşu ve Profil Ekranına Mesaj Butonunu Ekle
setTimeout(() => {
    const altMenu = document.querySelector('.alt-menu-container');
    if(altMenu) {
        const mesajBtn = document.createElement('div');
        mesajBtn.className = 'alt-menu-item';
        mesajBtn.style.cursor = 'pointer';
        mesajBtn.style.position = 'relative';
        mesajBtn.onclick = () => mesajKutusunuAc();
        mesajBtn.innerHTML = `
            <div class="alt-menu-ikon">✉️</div>
            <span style="color:#f2c94c; font-weight:bold;">Mesajlar</span>
            <span id="yeniMesajBildirim" style="display:none; position:absolute; top:-5px; right:5px; background:#e74c3c; color:#fff; border-radius:50%; width:16px; height:16px; font-size:10px; line-height:16px; text-align:center; font-weight:bold; box-shadow:0 0 5px #e74c3c;">!</span>
        `;
        altMenu.appendChild(mesajBtn);
    }

    const profilFirlatAlani = document.getElementById('profilEsyaFirlatAlani');
    if(profilFirlatAlani) {
        const btnMesajAtHTML = `<button onclick="mesajYazmaEkraniniAc()" class="satin-al-btn" style="width:100%; margin-top:5px; margin-bottom:15px; background:linear-gradient(135deg, #f2c94c, #f39c12); color:#000; font-size:13px; padding:10px; font-weight:900; box-shadow: 0 0 10px rgba(242, 201, 76, 0.4);">✉️ ÖZEL MESAJ GÖNDER</button>`;
        profilFirlatAlani.insertAdjacentHTML('beforebegin', btnMesajAtHTML);
    }
}, 500);

// Karakter Sayacı
document.getElementById('mesajIcerik').addEventListener('input', function(e) {
    document.getElementById('charCount').innerText = e.target.value.length + " / 150";
});

let aktifSohbetHedefi = "";
let engellenenKullanicilar = [];

// EKRAN KAYMASINI ENGELLEYEN KAPAT/AÇ FONKSİYONLARI
window.kapatVIPMesajEkrani = function(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = ''; // Kilidi aç
};

window.mesajKutusunuAc = function() {
    if(typeof isMisafir !== 'undefined' && isMisafir) {
        if(window.ozelUyariGoster) ozelUyariGoster("⚠️ Misafir hesaplar mesaj kutusunu kullanamaz!");
        return;
    }
    document.body.style.overflow = 'hidden'; // Ekranı kilitle (Kaymayı engeller)
    document.getElementById('ozelMesajEkrani').style.display = 'flex';
    mesajlariYukle();
};

window.mesajYazmaEkraniniAc = function(hedefIsim) {
    if(typeof isMisafir !== 'undefined' && isMisafir) {
        if(window.ozelUyariGoster) ozelUyariGoster("⚠️ Misafir hesaplar özel mesaj atamaz!");
        return;
    }
    
    let kime = hedefIsim;
    if(!kime) {
        const hedefBtn = document.getElementById('profilArkadasBtn');
        if(hedefBtn && hedefBtn.dataset.hedef) kime = hedefBtn.dataset.hedef;
    }
    
    if(!kime || kime === (typeof aktifKullaniciAdi !== 'undefined' ? aktifKullaniciAdi : "")) return;

    aktifSohbetHedefi = kime;
    document.getElementById('mesajYazmaBaslik').innerHTML = `✉️ <span style="color:#2ecc71;">${kime}</span>`;
    document.getElementById('mesajIcerik').value = "";
    document.getElementById('charCount').innerText = "0 / 150";
    
    document.getElementById('profilEkrani').style.display = 'none';
    document.body.style.overflow = 'hidden'; // Ekranı kilitle
    document.getElementById('mesajYazmaEkrani').style.display = 'flex';

    document.getElementById('btnMesajGonder').onclick = function() { mesajGonderDB(aktifSohbetHedefi); };
};

// 3. Mesaj Gönderme
function mesajGonderDB(kime) {
    const icerik = document.getElementById('mesajIcerik').value.trim();
    if(icerik === "") return;
    if(!auth.currentUser) return;

    const btn = document.getElementById('btnMesajGonder');
    btn.disabled = true; btn.innerText = "İLETİLİYOR... ⏳";

    db.collection("kullanicilar").where("isim", "==", kime).get().then(snapshot => {
        if(snapshot.empty) {
            if(window.ozelUyariGoster) ozelUyariGoster("⚠️ Oyuncu bulunamadı.");
            btn.disabled = false; btn.innerText = "GÖNDER"; return;
        }
        
        // Karşı taraf beni engellemiş mi diye gizlice bakıyoruz (İsteğe bağlı, şimdilik direkt atıyoruz o görmez)
        const hedefDoc = snapshot.docs[0];
        const yeniMesaj = {
            kimden: typeof aktifKullaniciAdi !== 'undefined' ? aktifKullaniciAdi : "Oyuncu",
            icerik: icerik,
            tarih: new Date().toISOString(),
            okunduMu: false
        };

        db.collection("kullanicilar").doc(hedefDoc.id).update({
            gelenKutusu: firebase.firestore.FieldValue.arrayUnion(yeniMesaj)
        }).then(() => {
            kapatVIPMesajEkrani('mesajYazmaEkrani');
            if(window.ozelUyariGoster) ozelUyariGoster(`✅ Mesajınız ${kime} adlı oyuncuya iletildi!`);
            btn.disabled = false; btn.innerText = "GÖNDER";
        }).catch(err => {
            if(window.ozelUyariGoster) ozelUyariGoster("Hata: Mesaj gönderilemedi.");
            btn.disabled = false; btn.innerText = "GÖNDER";
        });
    });
}

// 4. Mesajları ve Engellenenleri Yükleme
window.mesajlariYukle = function() {
    const liste = document.getElementById('mesajListesi');
    if(!auth.currentUser) return;

    db.collection("kullanicilar").doc(auth.currentUser.uid).get().then(doc => {
        if(!doc.exists) return;
        const veriler = doc.data();
        engellenenKullanicilar = veriler.engellenenler || []; // Engellenenler listesini al
        
        let tumMesajlar = veriler.gelenKutusu || [];
        
        // Engellenen kişilerden gelen mesajları FİLTRELE (Gösterme)
        let gosterilecekMesajlar = tumMesajlar.filter(m => !engellenenKullanicilar.includes(m.kimden));
        
        liste.innerHTML = '';
        if(gosterilecekMesajlar.length === 0) {
            liste.innerHTML = '<p style="text-align:center; color:#777; font-size:12px; margin-top:50px;">Gelen kutunuz tertemiz, mesaj yok.</p>';
            document.getElementById('yeniMesajBildirim').style.display = 'none';
            return;
        }

        const okunmamisVarMi = gosterilecekMesajlar.some(m => !m.okunduMu);
        document.getElementById('yeniMesajBildirim').style.display = okunmamisVarMi ? 'block' : 'none';

        // Mesajları çiz
        gosterilecekMesajlar.slice().reverse().forEach((mesaj, reversedIndex) => {
            // Firestore array'inden silmek için orijinal array'deki index'ini bulmamız lazım
            const gercekIndex = tumMesajlar.findIndex(m => m.kimden === mesaj.kimden && m.tarih === mesaj.tarih && m.icerik === mesaj.icerik);
            
            let kartSinifi = mesaj.okunduMu ? "vip-mesaj-kart" : "vip-mesaj-kart yeni";
            let yeniEtiketi = mesaj.okunduMu ? "" : `<span style="background:#e74c3c; color:#fff; font-size:9px; padding:2px 5px; border-radius:4px; margin-left:5px;">YENİ</span>`;

            liste.innerHTML += `
            <div class="${kartSinifi}">
                <div style="font-size:11px; color:#a3c4bc; margin-bottom:10px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
                    <div><strong style="color:#f2c94c; font-size:14px;">${mesaj.kimden}</strong> ${yeniEtiketi}</div>
                    <span style="font-size:9px; color:#777;">${new Date(mesaj.tarih).toLocaleString('tr-TR')}</span>
                </div>
                <div style="color:#fff; font-size:13px; line-height:1.5; word-break: break-all; margin-bottom:15px; padding: 0 5px;">
                    ${mesaj.icerik}
                </div>
                
                <div style="display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap;">
                    ${!mesaj.okunduMu ? `<button onclick="mesajiOkunduIsaretle(${gercekIndex})" class="vip-mesaj-btn">Gördüm ✓</button>` : ''}
                    <button onclick="mesajYazmaEkraniniAc('${mesaj.kimden}')" class="vip-mesaj-btn btn-cevapla">Cevapla ↩️</button>
                    <button onclick="kullaniciyiEngelle('${mesaj.kimden}')" class="vip-mesaj-btn btn-engelle">Engelle 🚫</button>
                    <button onclick="mesajiSil(${gercekIndex})" class="vip-mesaj-btn btn-sil">Sil 🗑️</button>
                </div>
            </div>`;
        });
    });
};

// 5. Engelleme Fonksiyonu
window.kullaniciyiEngelle = function(isim) {
    const onay = confirm(`⚠️ DİKKAT!\n${isim} adlı oyuncuyu engellemek istediğinize emin misiniz?\nArtık size özel mesaj atamayacak.`);
    if(!onay) return;

    if(!auth.currentUser) return;
    
    if(!engellenenKullanicilar.includes(isim)) {
        engellenenKullanicilar.push(isim);
    }

    db.collection("kullanicilar").doc(auth.currentUser.uid).update({
        engellenenler: engellenenKullanicilar
    }).then(() => {
        if(window.ozelUyariGoster) ozelUyariGoster(`🚫 ${isim} başarıyla engellendi! Artık ondan mesaj almayacaksın.`);
        mesajlariYukle(); // Listeyi yenile ki adamın eski mesajları da ekrandan kaybolsun
    });
};

window.mesajiSil = function(index) {
    if(!auth.currentUser) return;
    db.collection("kullanicilar").doc(auth.currentUser.uid).get().then(doc => {
        let mesajlar = doc.data().gelenKutusu || [];
        if(mesajlar[index]) {
            mesajlar.splice(index, 1);
            db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gelenKutusu: mesajlar }).then(() => mesajlariYukle());
        }
    });
}

window.mesajiOkunduIsaretle = function(index) {
    if(!auth.currentUser) return;
    db.collection("kullanicilar").doc(auth.currentUser.uid).get().then(doc => {
        let mesajlar = doc.data().gelenKutusu || [];
        if(mesajlar[index]) {
            mesajlar[index].okunduMu = true;
            db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gelenKutusu: mesajlar }).then(() => mesajlariYukle());
        }
    });
}

// Yeni Mesaj Bildirimi Kontrolü
setInterval(() => {
    if(typeof auth !== 'undefined' && auth.currentUser && typeof isMisafir !== 'undefined' && !isMisafir) {
        db.collection("kullanicilar").doc(auth.currentUser.uid).get().then(doc => {
            if(doc.exists) {
                let engellenenler = doc.data().engellenenler || [];
                let mesajlar = doc.data().gelenKutusu || [];
                // Engellenenlerin mesajlarını sayma!
                let okunmamis = mesajlar.some(m => !m.okunduMu && !engellenenler.includes(m.kimden));
                const bildirim = document.getElementById('yeniMesajBildirim');
                if(bildirim) bildirim.style.display = okunmamis ? 'block' : 'none';
            }
        });
    }
}, 20000);
