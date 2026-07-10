// ==========================================
// BEYCO GAMES - AAA ARKADAŞ SİSTEMİ
// ==========================================

window.benimGelenIsteklerim = [];
window.benimGidenIsteklerim = [];

// ⸻ FİREBASE GERÇEK ZAMANLI DİNLEYİCİSİ ⸻
function baslatIstekListener() {
    if(typeof auth !== 'undefined' && auth.currentUser && typeof db !== 'undefined') {
        db.collection('kullanicilar').doc(auth.currentUser.uid).onSnapshot(doc => {
            if(doc.exists) {
                let data = doc.data();
                let yeniGelen = data.gelenIstekler || [];
                window.benimGidenIsteklerim = data.gidenIstekler || [];
                window.benimArkadaslarim = data.arkadaslar || [];

                // Yeni istek geldiğinde Toast bildirimi göster
                if(window.benimGelenIsteklerim) {
                    yeniGelen.forEach(istekYapan => {
                        if(!window.benimGelenIsteklerim.includes(istekYapan)) {
                            arkadaslikIstegiGeldiToast(istekYapan);
                        }
                    });
                }
                window.benimGelenIsteklerim = yeniGelen;

                // Arkadaş menüsü açıksa anında HTML'i yenile
                if(document.getElementById('arkadaslarEkrani').style.display === 'flex') {
                    arkadaslarMenusuAc();
                }
                
                // Profil açıksa ve istek atılan kişiyle aynıysa butonu güncelle
                let acikProfil = document.getElementById('profilArkadasBtn')?.dataset?.hedef;
                if(acikProfil && document.getElementById('profilEkrani').style.display === 'flex') {
                    profiliGoster(acikProfil);
                }
            }
        });
    }
}

// Oyuna girişte dinleyiciyi başlat
setInterval(() => {
    if(typeof auth !== 'undefined' && auth.currentUser && !window.istekDinleyiciBasladi) {
        window.istekDinleyiciBasladi = true;
        baslatIstekListener();
    }
}, 2000);


// ⸻ SAĞ ALT (TOAST) BİLDİRİM MOTORU ⸻
window.arkadaslikIstegiGeldiToast = function(isim) {
    const container = document.getElementById('arkadasToastContainer');
    if(!container) return;

    const toast = document.createElement('div');
    toast.className = 'arkadas-toast';
    toast.id = `toast_istek_${isim}`;
    toast.innerHTML = `
        <div class="toast-title">🔔 Yeni Arkadaşlık İsteği</div>
        <div class="toast-msg"><b>${isim}</b> sana arkadaşlık isteği gönderdi.</div>
        <div class="toast-actions">
            <button class="toast-btn btn-success" onclick="window.istekKabulEtMotor('${isim}')">Kabul Et</button>
            <button class="toast-btn btn-danger" onclick="window.istekReddetMotor('${isim}')">Reddet</button>
        </div>
    `;
    container.appendChild(toast);
    
    // 10 Saniye sonra otomatik silinir
    setTimeout(() => { if(toast) toast.remove(); }, 10000);
};

// ⸻ İSTEK GÖNDERME MOTORU ⸻
window.arkadasEkleIstek = function(hedefIsim) {
    if(isMisafir) return ozelUyariGoster("⚠️ Misafirler istek gönderemez.");
    if(hedefIsim === aktifKullaniciAdi) return ozelUyariGoster("Kendinize istek gönderemezsiniz.");

    const btn = document.getElementById('profilArkadasBtn');
    if(btn) {
        btn.innerHTML = "⏳ Gönderiliyor...";
        btn.className = "profil-action-btn btn-disabled";
    }

    db.collection("kullanicilar").doc(auth.currentUser.uid).update({
        gidenIstekler: firebase.firestore.FieldValue.arrayUnion(hedefIsim)
    });

    db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then(snap => {
        if(!snap.empty) {
            snap.docs[0].ref.update({
                gelenIstekler: firebase.firestore.FieldValue.arrayUnion(aktifKullaniciAdi)
            });
            ozelUyariGoster(`✅ ${hedefIsim} oyuncusuna istek gönderildi.`);
        }
    });
};

// ⸻ İSTEK KABUL ET MOTORU ⸻
window.istekKabulEtMotor = function(istekYapan) {
    db.collection("kullanicilar").doc(auth.currentUser.uid).update({
        arkadaslar: firebase.firestore.FieldValue.arrayUnion(istekYapan),
        gelenIstekler: firebase.firestore.FieldValue.arrayRemove(istekYapan)
    });

    db.collection("kullanicilar").where("isim", "==", istekYapan).get().then(snap => {
        if(!snap.empty) {
            snap.docs[0].ref.update({
                arkadaslar: firebase.firestore.FieldValue.arrayUnion(aktifKullaniciAdi),
                gidenIstekler: firebase.firestore.FieldValue.arrayRemove(aktifKullaniciAdi)
            });
        }
    });

    ozelUyariGoster(`✅ Artık ${istekYapan} ile arkadaşsınız.`);
    let toast = document.getElementById(`toast_istek_${istekYapan}`);
    if(toast) toast.remove();
};

// ⸻ İSTEK REDDET MOTORU ⸻
window.istekReddetMotor = function(istekYapan) {
    db.collection("kullanicilar").doc(auth.currentUser.uid).update({
        gelenIstekler: firebase.firestore.FieldValue.arrayRemove(istekYapan)
    });

    db.collection("kullanicilar").where("isim", "==", istekYapan).get().then(snap => {
        if(!snap.empty) {
            snap.docs[0].ref.update({
                gidenIstekler: firebase.firestore.FieldValue.arrayRemove(aktifKullaniciAdi)
            });
        }
    });

    let toast = document.getElementById(`toast_istek_${istekYapan}`);
    if(toast) toast.remove();
};

// ⸻ ARKADAŞTAN ÇIKAR MOTORU ⸻
window.arkadasliktanCikarIstek = function(hedefIsim) {
    if(confirm(`❌ ${hedefIsim} arkadaş listesinden silinsin mi?`)) {
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({
            arkadaslar: firebase.firestore.FieldValue.arrayRemove(hedefIsim)
        });

        db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then(snap => {
            if(!snap.empty) {
                snap.docs[0].ref.update({
                    arkadaslar: firebase.firestore.FieldValue.arrayRemove(aktifKullaniciAdi)
                });
            }
        });
        ozelUyariGoster(`❌ ${hedefIsim} silindi.`);
    }
};

// ⸻ ARKADAŞ LİSTESİ RENDER MOTORU ⸻
window.arkadasAraFiltre = function() {
    let input = document.getElementById('arkadasAraInput');
    if(!input) return;
    let filter = input.value.toLowerCase();
    let cards = document.querySelectorAll('#arkadasListesiDiv .friend-card');
    
    cards.forEach(card => {
        let nameEl = card.querySelector('.friend-name');
        if(nameEl) {
            let name = nameEl.innerText.toLowerCase();
            if(name.includes(filter)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        }
    });
};

window.arkadaslarMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler arkadaş kullanamaz."); return; } 
    
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; 
    const titleEl = document.querySelector('#arkadaslarEkrani .premium-modal-title');
    if(titleEl) titleEl.innerHTML = '👥 ARKADAŞLAR';

    const listeDiv = document.getElementById('arkadasListesiDiv'); 
    
    if(!benimArkadaslarim || benimArkadaslarim.length === 0) {
        listeDiv.innerHTML = `
            <div class="empty-friends-state">
                <div class="empty-icon">👥</div>
                <h3>Henüz arkadaşın bulunmuyor.</h3>
                <p>Oyuncuların profiline girerek arkadaş ekleyebilir ve birlikte masaya oturabilirsin.</p>
                <button class="premium-btn btn-gold" onclick="document.getElementById('arkadaslarEkrani').style.display='none'">➕ Oyuncu Ara</button>
            </div>
        `;
        return;
    }

    listeDiv.innerHTML = ''; 

    let siraliArkadaslar = [...benimArkadaslarim].sort((a, b) => {
        let aOnline = onlineOyuncularListesi.includes(a);
        let bOnline = onlineOyuncularListesi.includes(b);
        return (aOnline === bOnline) ? 0 : aOnline ? -1 : 1;
    });

    siraliArkadaslar.forEach(o => {
        let isOnline = onlineOyuncularListesi.includes(o);
        let koz = globalKozmetikler[o] || []; 
        let iR = koz.includes('atesli_isim') ? '#ff4757' : '#fff'; 
        let tac = koz.includes('neon_tac') ? '👑 ' : '';
        
        let ligColors = ["#cd7f32", "#bdc3c7", "#f1c40f", "#3498db"];
        let ligNames = ["BRONZ", "GÜMÜŞ", "ALTIN", "ELMAS"];
        let hash = o.length % 4;

        let durumHtml = isOnline ? '<span class="status-badge online">🟢 Çevrimiçi</span>' : '<span class="status-badge offline">⚫ Çevrimdışı</span>';
        let cardClass = isOnline ? 'friend-card' : 'friend-card offline-card';

        let davetBtnHtml = isOnline ? `<button class="f-btn f-btn-invite" onclick="masayaDavetEt('${o}')" title="Davet Et">🎮</button>` : '';

        listeDiv.innerHTML += `
            <div class="${cardClass}">
                <div class="friend-card-left">
                    <div class="friend-avatar">😎</div>
                    <div class="friend-info">
                        <div class="friend-name" style="color:${iR};">${tac}${o}</div>
                        <div class="friend-tags">
                            <span class="friend-league" style="color:${ligColors[hash]}; border-color:${ligColors[hash]}">${ligNames[hash]} LİG</span>
                            ${durumHtml}
                        </div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="f-btn f-btn-profile" onclick="profiliGoster('${o}')" title="Profil">👤</button>
                    <button class="f-btn f-btn-msg" onclick="document.getElementById('arkadaslarEkrani').style.display='none'; document.getElementById('sohbetCekmecesi').classList.add('acik'); let inp = document.getElementById('sohbetInput'); inp.value = '@${o} '; inp.focus();" title="Mesaj Gönder">💬</button>
                    ${davetBtnHtml}
                </div>
            </div>
        `;
    });
};

window.davetMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler davet edemez."); return; } 
    
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; 
    const titleEl = document.querySelector('#arkadaslarEkrani .premium-modal-title');
    if(titleEl) titleEl.innerHTML = '🎯 OYUNCU DAVET ET';

    const listeDiv = document.getElementById('arkadasListesiDiv'); 
    listeDiv.innerHTML = ''; 

    let onSay = 0;
    onlineOyuncularListesi.forEach(o => {
        if(o === aktifKullaniciAdi || o.startsWith('Misafir_')) return; 
        onSay++; 
        
        let koz = globalKozmetikler[o] || []; 
        let iR = koz.includes('atesli_isim') ? '#ff4757' : '#fff'; 
        let tac = koz.includes('neon_tac') ? '👑 ' : '';
        
        let ligColors = ["#cd7f32", "#bdc3c7", "#f1c40f", "#3498db"];
        let ligNames = ["BRONZ", "GÜMÜŞ", "ALTIN", "ELMAS"];
        let hash = o.length % 4;

        listeDiv.innerHTML += `
            <div class="friend-card">
                <div class="friend-card-left">
                    <div class="friend-avatar">😎</div>
                    <div class="friend-info">
                        <div class="friend-name" style="color:${iR};">${tac}${o}</div>
                        <div class="friend-tags">
                            <span class="friend-league" style="color:${ligColors[hash]}; border-color:${ligColors[hash]}">${ligNames[hash]} LİG</span>
                            <span class="status-badge online">🟢 Çevrimiçi</span>
                        </div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="f-btn f-btn-profile" onclick="profiliGoster('${o}')" title="Profil">👤</button>
                    <button class="f-btn f-btn-invite" onclick="masayaDavetEt('${o}')" title="Masaya Davet Et">🎮</button>
                </div>
            </div>
        `;
    });

    if(onSay === 0) {
        listeDiv.innerHTML = `
            <div class="empty-friends-state">
                <div class="empty-icon">🎲</div>
                <h3>Kimse Yok</h3>
                <p>Şu an lobide davet edilecek uygun oyuncu bulunmuyor.</p>
            </div>
        `;
    }
};

window.masayaDavetEt = function(n) { 
    socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: n, masaAdi: suAnkiMasam }); 
    document.getElementById('arkadaslarEkrani').style.display = 'none'; 
};

window.profilDavetAksiyon = function() { 
    const hedef = document.getElementById('profilDavetBtn').dataset.hedef; 
    if (!hedef || !suAnkiMasam) return; 
    socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: hedef, masaAdi: suAnkiMasam }); 
    ozelUyariGoster(`💌 Davet gönderildi!`); 
    document.getElementById('profilEkrani').style.display = 'none'; 
};
