// --- ÖZEL MESAJLAŞMA (POSTA KUTUSU) MODÜLÜ --- //

// 1. Ekranları ve Butonları Sayfaya Otomatik Çizelim
document.body.insertAdjacentHTML('beforeend', `
    <div id="ozelMesajEkrani" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:999999; flex-direction:column; justify-content:center; align-items:center;">
        <div class="magaza-kutu" style="max-height: 85vh; display: flex; flex-direction: column; width: 95%; max-width: 450px; border:2px solid #3498db; box-shadow: 0 0 25px rgba(52, 152, 219, 0.4);">
            <div class="magaza-header" style="border-bottom: 1px solid #3498db; padding-bottom: 10px; margin-bottom: 15px;">
                <h2 style="color:#3498db;">✉️ GELEN KUTUSU</h2>
                <button onclick="document.getElementById('ozelMesajEkrani').style.display='none'" style="background:none;border:none;color:#e74c3c;font-size:24px;cursor:pointer;font-weight:bold;">X</button>
            </div>
            <div id="mesajListesi" style="display:flex; flex-direction:column; gap:10px; overflow-y:auto; padding-right:5px; flex:1; min-height:300px;">
                <p style="color:#777; text-align:center; font-size:12px; margin-top:30px;">Mesajlarınız yükleniyor...</p>
            </div>
        </div>
    </div>
    
    <div id="mesajYazmaEkrani" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:9999999; flex-direction:column; justify-content:center; align-items:center;">
        <div class="magaza-kutu" style="width: 90%; max-width: 350px; border:2px solid #3498db; box-shadow: 0 0 20px rgba(52, 152, 219, 0.4);">
            <h3 id="mesajYazmaBaslik" style="color:#fff; margin-bottom:15px; font-size:16px;">... mesaj yaz</h3>
            <textarea id="mesajIcerik" rows="4" style="width:100%; background:#111; color:#fff; border:1px solid #3498db; border-radius:8px; padding:10px; margin-bottom:15px; font-family:inherit; resize:none;" placeholder="Mesajınızı buraya yazın (Maks. 150 karakter)" maxlength="150"></textarea>
            <div style="display:flex; gap:10px;">
                <button id="btnMesajGonder" class="satin-al-btn" style="flex:1; background:linear-gradient(135deg, #3498db, #2980b9); color:#fff; font-weight:bold;">GÖNDER</button>
                <button onclick="document.getElementById('mesajYazmaEkrani').style.display='none'" class="satin-al-btn" style="flex:1; background:#e74c3c;">İPTAL</button>
            </div>
        </div>
    </div>
`);

// 2. Alt Menüye "Mesajlar" Butonunu Otomatik Ekle
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
            <span style="color:#3498db; font-weight:bold;">Mesajlar</span>
            <span id="yeniMesajBildirim" style="display:none; position:absolute; top:-5px; right:5px; background:#e74c3c; color:#fff; border-radius:50%; width:16px; height:16px; font-size:10px; line-height:16px; text-align:center; font-weight:bold; box-shadow:0 0 5px #e74c3c;">!</span>
        `;
        altMenu.appendChild(mesajBtn);
    }

    // 3. Rakibin Profil Ekranına "Özel Mesaj At" Butonunu Ekle
    const profilFirlatAlani = document.getElementById('profilEsyaFirlatAlani');
    if(profilFirlatAlani) {
        const btnMesajAtHTML = `<button onclick="mesajYazmaEkraniniAc()" class="satin-al-btn" style="width:100%; margin-top:5px; margin-bottom:15px; background:linear-gradient(135deg, #3498db, #2980b9); color:#fff; font-size:13px; padding:10px; font-weight:bold; box-shadow: 0 0 10px rgba(52, 152, 219, 0.4);">✉️ ÖZEL MESAJ GÖNDER</button>`;
        profilFirlatAlani.insertAdjacentHTML('beforebegin', btnMesajAtHTML);
    }
}, 500);

let aktifSohbetHedefi = "";

window.mesajKutusunuAc = function() {
    if(typeof isMisafir !== 'undefined' && isMisafir) {
        if(window.ozelUyariGoster) ozelUyariGoster("⚠️ Misafir hesaplar mesaj kutusunu kullanamaz! Lütfen kayıt olun.");
        return;
    }
    document.getElementById('ozelMesajEkrani').style.display = 'flex';
    mesajlariYukle();
};

window.mesajYazmaEkraniniAc = function() {
    if(typeof isMisafir !== 'undefined' && isMisafir) {
        if(window.ozelUyariGoster) ozelUyariGoster("⚠️ Misafir hesaplar özel mesaj atamaz!");
        return;
    }
    const hedefBtn = document.getElementById('profilArkadasBtn');
    if(!hedefBtn || !hedefBtn.dataset.hedef) return;
    
    aktifSohbetHedefi = hedefBtn.dataset.hedef;
    
    // Kendi kendine mesaj atmayı engelle
    if(aktifSohbetHedefi === (typeof aktifKullaniciAdi !== 'undefined' ? aktifKullaniciAdi : "")) return;

    document.getElementById('mesajYazmaBaslik').innerText = `✉️ ${aktifSohbetHedefi} ile iletişim:`;
    document.getElementById('mesajIcerik').value = "";
    document.getElementById('profilEkrani').style.display = 'none';
    document.getElementById('mesajYazmaEkrani').style.display = 'flex';

    document.getElementById('btnMesajGonder').onclick = function() { mesajGonderDB(aktifSohbetHedefi); };
};

function mesajGonderDB(kime) {
    const icerik = document.getElementById('mesajIcerik').value.trim();
    if(icerik === "") return;
    if(!auth.currentUser) return;

    const btn = document.getElementById('btnMesajGonder');
    btn.disabled = true; btn.innerText = "İLETİLİYOR... ⏳";

    // Karşı tarafın veritabanı kasasını bul ve mesajı içine bırak
    db.collection("kullanicilar").where("isim", "==", kime).get().then(snapshot => {
        if(snapshot.empty) {
            if(window.ozelUyariGoster) ozelUyariGoster("⚠️ Oyuncu bulunamadı.");
            btn.disabled = false; btn.innerText = "GÖNDER";
            return;
        }
        
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
            document.getElementById('mesajYazmaEkrani').style.display = 'none';
            if(window.ozelUyariGoster) ozelUyariGoster(`✅ Mesajınız ${kime} adlı oyuncuya güvenle iletildi!`);
            btn.disabled = false; btn.innerText = "GÖNDER";
        }).catch(err => {
            console.log(err);
            if(window.ozelUyariGoster) ozelUyariGoster("Hata: Mesaj gönderilemedi.");
            btn.disabled = false; btn.innerText = "GÖNDER";
        });
    });
}

window.mesajlariYukle = function() {
    const liste = document.getElementById('mesajListesi');
    if(!auth.currentUser) return;

    db.collection("kullanicilar").doc(auth.currentUser.uid).get().then(doc => {
        if(!doc.exists) return;
        const veriler = doc.data();
        let mesajlar = veriler.gelenKutusu || [];
        
        liste.innerHTML = '';
        if(mesajlar.length === 0) {
            liste.innerHTML = '<p style="text-align:center; color:#777; font-size:12px; margin-top:50px;">Gelen kutunuz tertemiz, mesaj yok.</p>';
            document.getElementById('yeniMesajBildirim').style.display = 'none';
            return;
        }

        const okunmamisVarMi = mesajlar.some(m => !m.okunduMu);
        document.getElementById('yeniMesajBildirim').style.display = okunmamisVarMi ? 'block' : 'none';

        // En yeni mesajlar en üstte görünsün diye tersine çeviriyoruz
        mesajlar.slice().reverse().forEach((mesaj, reversedIndex) => {
            const gercekIndex = mesajlar.length - 1 - reversedIndex;
            let bg = mesaj.okunduMu ? "rgba(0,0,0,0.4)" : "rgba(52, 152, 219, 0.15)";
            let border = mesaj.okunduMu ? "1px solid #333" : "1px solid #3498db";
            let yeniEtiketi = mesaj.okunduMu ? "" : `<span style="background:#e74c3c; color:#fff; font-size:9px; padding:2px 5px; border-radius:4px; margin-left:5px;">YENİ</span>`;

            liste.innerHTML += `
            <div style="background:${bg}; border:${border}; border-radius:8px; padding:12px; position:relative;">
                <div style="font-size:11px; color:#a3c4bc; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:5px;">
                    <strong style="color:#f2c94c; font-size:13px;">${mesaj.kimden}</strong> ${yeniEtiketi} <br>
                    <span style="font-size:9px; color:#777;">${new Date(mesaj.tarih).toLocaleString('tr-TR')}</span>
                </div>
                <div style="color:#fff; font-size:13px; line-height:1.5; word-break: break-all; margin-bottom:10px;">
                    ${mesaj.icerik}
                </div>
                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    ${!mesaj.okunduMu ? `<button onclick="mesajiOkunduIsaretle(${gercekIndex})" style="background:#3498db; color:#fff; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;">Okundu Yap</button>` : ''}
                    <button onclick="mesajiSil(${gercekIndex})" style="background:#e74c3c; color:#fff; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-size:11px; font-weight:bold;">Sil 🗑️</button>
                </div>
            </div>`;
        });
    });
}

window.mesajiSil = function(index) {
    if(!auth.currentUser) return;
    db.collection("kullanicilar").doc(auth.currentUser.uid).get().then(doc => {
        let mesajlar = doc.data().gelenKutusu || [];
        mesajlar.splice(index, 1);
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gelenKutusu: mesajlar }).then(() => mesajlariYukle());
    });
}

window.mesajiOkunduIsaretle = function(index) {
    if(!auth.currentUser) return;
    db.collection("kullanicilar").doc(auth.currentUser.uid).get().then(doc => {
        let mesajlar = doc.data().gelenKutusu || [];
        if(mesajlar[index]) mesajlar[index].okunduMu = true;
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gelenKutusu: mesajlar }).then(() => mesajlariYukle());
    });
}

// Arka planda sunucuyu yormadan her 20 saniyede bir DB'yi fısıltı gibi kontrol et (Yeni mesaj var mı?)
setInterval(() => {
    if(typeof auth !== 'undefined' && auth.currentUser && typeof isMisafir !== 'undefined' && !isMisafir) {
        db.collection("kullanicilar").doc(auth.currentUser.uid).get().then(doc => {
            if(doc.exists) {
                let mesajlar = doc.data().gelenKutusu || [];
                const okunmamis = mesajlar.some(m => !m.okunduMu);
                const bildirim = document.getElementById('yeniMesajBildirim');
                if(bildirim) bildirim.style.display = okunmamis ? 'block' : 'none';
            }
        });
    }
}, 20000);
