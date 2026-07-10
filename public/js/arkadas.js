// ==========================================
// BEYCO GAMES - AAA ARKADAŞ & REAL-TIME DM SİSTEMİ
// ==========================================

window.benimGelenIsteklerim = [];
window.benimGidenIsteklerim = [];
window.aktifSohbetHedef = null;
window.sohbetAbonelikSinyali = null;

// ⸻ FİREBASE GERÇEK ZAMANLI DİNLEYİCİSİ ⸻
function baslatIstekListener() {
    if(typeof auth !== 'undefined' && auth.currentUser && typeof db !== 'undefined') {
        db.collection('kullanicilar').doc(auth.currentUser.uid).onSnapshot(doc => {
            if(doc.exists) {
                let data = doc.data();
                let yeniGelen = data.gelenIstekler || [];
                window.benimGidenIsteklerim = data.gidenIstekler || [];
                window.benimArkadaslarim = data.arkadaslar || [];

                if(window.benimGelenIsteklerim) {
                    yeniGelen.forEach(istekYapan => {
                        if(!window.benimGelenIsteklerim.includes(istekYapan)) {
                            arkadaslikIstegiGeldiToast(istekYapan);
                        }
                    });
                }
                window.benimGelenIsteklerim = yeniGelen;

                if(document.getElementById('arkadaslarEkrani').style.display === 'flex') {
                    arkadaslarMenusuAc();
                }
                
                let acikProfil = document.getElementById('profilArkadasBtn')?.dataset?.hedef;
                if(acikProfil && document.getElementById('profilEkrani').style.display === 'flex') {
                    profiliGoster(acikProfil);
                }
            }
        });

        // 🔴 OKUNMAMIŞ ÖZEL MESAJ BİLDİRİM ROZETİ MOTORU
        db.collection("ozel_sohbetler").where("katilimcilar", "array-contains", aktifKullaniciAdi).onSnapshot(snap => {
            let okunmamisVarMi = false;
            snap.forEach(doc => {
                let d = doc.data();
                if(d.sonGonderen !== aktifKullaniciAdi && d.okundu === false) {
                    okunmamisVarMi = true;
                }
            });
            
            const badge = document.getElementById('menuSohbetItem');
            if(badge) {
                let eskiRozet = badge.querySelector('.unread-msg-badge');
                if(okunmamisVarMi) {
                    if(!eskiRozet) {
                        let r = document.createElement('div');
                        r.className = 'unread-msg-badge';
                        badge.appendChild(r);
                    }
                } else if(eskiRozet) {
                    eskiRozet.remove();
                }
            }
        });
    }
}

setInterval(() => {
    if(typeof auth !== 'undefined' && auth.currentUser && !window.istekDinleyiciBasladi) {
        window.istekDinleyiciBasladi = true;
        baslatIstekListener();
    }
}, 2000);

// ⸻ TOAST BİLDİRİMİ ⸻
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
    setTimeout(() => { if(toast) toast.remove(); }, 10000);
};

// ⸻ ARKADAŞ İSTEK, KABUL, RED, SİL MOTORLARI ⸻
window.arkadasEkleIstek = function(hedefIsim) {
    if(isMisafir) return ozelUyariGoster("⚠️ Misafirler istek gönderemez.");
    if(hedefIsim === aktifKullaniciAdi) return ozelUyariGoster("Kendinize istek gönderemezsiniz.");

    db.collection("kullanicilar").doc(auth.currentUser.uid).update({
        gidenIstekler: firebase.firestore.FieldValue.arrayUnion(hedefIsim)
    });
    db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then(snap => {
        if(!snap.empty) {
            snap.docs[0].ref.update({ gelenIstekler: firebase.firestore.FieldValue.arrayUnion(aktifKullaniciAdi) });
            ozelUyariGoster("✅ İstek gönderildi.");
        }
    });
};

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
    document.getElementById(`toast_istek_${istekYapan}`)?.remove();
};

window.istekReddetMotor = function(istekYapan) {
    db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gelenIstekler: firebase.firestore.FieldValue.arrayRemove(istekYapan) });
    db.collection("kullanicilar").where("isim", "==", istekYapan).get().then(snap => {
        if(!snap.empty) { snap.docs[0].ref.update({ gidenIstekler: firebase.firestore.FieldValue.arrayRemove(aktifKullaniciAdi) }); }
    });
    document.getElementById(`toast_istek_${istekYapan}`)?.remove();
};

window.arkadasliktanCikarIstek = function(hedefIsim) {
    if(confirm(`Bu oyuncuyu arkadaş listesinden kaldırmak istiyor musun?`)) {
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: firebase.firestore.FieldValue.arrayRemove(hedefIsim) });
        db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then(snap => {
            if(!snap.empty) { snap.docs[0].ref.update({ arkadaslar: firebase.firestore.FieldValue.arrayRemove(aktifKullaniciAdi) }); }
        });
        ozelUyariGoster(`❌ Arkadaş silindi.`);
        document.getElementById('profilEkrani').style.display='none';
    }
};

// ⸻ 🔥 REAL-TIME PREMIUM ORTALANMIŞ MODAL SOHBET MOTORU 🔥 ⸻
window.acOzelMesaj = function(hedefIsim) {
    if(!hedefIsim || isMisafir) return;
    
    window.aktifSohbetHedef = hedefIsim;
    document.getElementById('profilEkrani').style.display = 'none';
    document.getElementById('arkadaslarEkrani').style.display = 'none';
    
    // Kapsayıcı Overlay ekranı flexten açılır (Standart Modal)
    const overlay = document.getElementById('ozelSohbetEkrani');
    document.getElementById('chatTargetName').innerText = hedefIsim;
    document.getElementById('chatTargetStatus').innerText = onlineOyuncularListesi.includes(hedefIsim) ? "🟢 Çevrimiçi" : "⚫ Çevrimdışı";
    overlay.style.display = 'flex';

    const roomId = [aktifKullaniciAdi, hedefIsim].sort().join("__");
    if(window.sohbetAbonelikSinyali) window.sohbetAbonelikSinyali();

    window.sohbetAbonelikSinyali = db.collection("ozel_sohbetler").doc(roomId).onSnapshot(doc => {
        const historyDiv = document.getElementById('chatHistory');
        historyDiv.innerHTML = '';
        
        if(doc.exists) {
            let data = doc.data();
            let mesajlar = data.mesajlar || [];
            
            mesajlar.forEach(m => {
                let bubbleClass = m.gonderen === aktifKullaniciAdi ? 'chat-bubble chat-bubble-me' : 'chat-bubble chat-bubble-them';
                let t = new Date(m.tarih);
                let timeStr = String(t.getHours()).padStart(2,'0') + ':' + String(t.getMinutes()).padStart(2,'0');
                
                historyDiv.innerHTML += `
                    <div class="${bubbleClass}">
                        <span>${m.metin}</span>
                        <span class="chat-bubble-time">${timeStr}</span>
                    </div>`;
            });
            historyDiv.scrollTop = historyDiv.scrollHeight;

            if(data.sonGonderen !== aktifKullaniciAdi && data.okundu === false) {
                db.collection("ozel_sohbetler").doc(roomId).update({ okundu: true });
            }
        }
    });
};

window.gonderOzelMesaj = function() {
    const input = document.getElementById('chatInput');
    if(!input || input.value.trim() === "" || !window.aktifSohbetHedef) return;
    
    const metin = input.value.trim();
    input.value = '';

    const roomId = [aktifKullaniciAdi, window.aktifSohbetHedef].sort().join("__");
    const yeniMesaj = { gonderen: aktifKullaniciAdi, metin: metin, tarih: Date.now() };

    db.collection("ozel_sohbetler").doc(roomId).set({
        katilimcilar: [aktifKullaniciAdi, window.aktifSohbetHedef],
        sonGonderen: aktifKullaniciAdi,
        okundu: false,
        mesajlar: firebase.firestore.FieldValue.arrayUnion(yeniMesaj)
    }, { merge: true });
};

window.kapatOzelMesaj = function() {
    document.getElementById('ozelSohbetEkrani').style.display = 'none';
    window.aktifSohbetHedef = null;
    if(window.sohbetAbonelikSinyali) { window.sohbetAbonelikSinyali(); window.sohbetAbonelikSinyali = null; }
};

// ⸻ ARKADAŞ MENÜSÜ LİSTE RENDER MOTORU ⸻
window.arkadasAraFiltre = function() {
    let input = document.getElementById('arkadasAraInput'); if(!input) return;
    let filter = input.value.toLowerCase(); let cards = document.querySelectorAll('#arkadasListesiDiv .friend-card');
    cards.forEach(card => {
        let nameEl = card.querySelector('.friend-name');
        if(nameEl) { card.style.display = nameEl.innerText.toLowerCase().includes(filter) ? 'flex' : 'none'; }
    });
};

window.arkadaslarMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler arkadaş kullanamaz."); return; } 
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; 
    const listeDiv = document.getElementById('arkadasListesiDiv'); 
    
    if(!benimArkadaslarim || benimArkadaslarim.length === 0) {
        listeDiv.innerHTML = `<div class="empty-friends-state"><div class="empty-icon">👥</div><h3>Henüz arkadaşın bulunmuyor.</h3><p>Oyuncuların profiline girerek arkadaş ekleyebilirsin.</p></div>`;
        return;
    }
    listeDiv.innerHTML = ''; 

    let siraliArkadaslar = [...benimArkadaslarim].sort((a, b) => {
        let aOnline = onlineOyuncularListesi.includes(a); let bOnline = onlineOyuncularListesi.includes(b);
        return (aOnline === bOnline) ? 0 : aOnline ? -1 : 1;
    });

    siraliArkadaslar.forEach(o => {
        let isOnline = onlineOyuncularListesi.includes(o); let koz = globalKozmetikler[o] || []; 
        let iR = koz.includes('atesli_isim') ? '#ff4757' : '#fff'; let tac = koz.includes('neon_tac') ? '👑 ' : '';
        let ligColors = ["#cd7f32", "#bdc3c7", "#f1c40f", "#3498db"]; let ligNames = ["BRONZ", "GÜMÜŞ", "ALTIN", "ELMAS"];
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
                            <span class="friend-league" style="color:${ligColors[o.length%4]}; border-color:${ligColors[o.length%4]}">${ligNames[o.length%4]} LİG</span>
                            ${durumHtml}
                        </div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="f-btn f-btn-profile" onclick="profiliGoster('${o}')" title="Profil">👤</button>
                    <button class="f-btn f-btn-msg" onclick="window.acOzelMesaj('${o}')" title="Mesaj Gönder">💬</button>
                    ${davetBtnHtml}
                </div>
            </div>`;
    });
};

window.davetMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler davet edemez."); return; } 
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; 
    const titleEl = document.querySelector('#arkadaslarEkrani .premium-modal-title');
    if(titleEl) titleEl.innerHTML = '🎯 OYUNCU DAVET ET';
    const listeDiv = document.getElementById('arkadasListesiDiv'); listeDiv.innerHTML = ''; 

    let onSay = 0;
    onlineOyuncularListesi.forEach(o => {
        if(o === aktifKullaniciAdi || o.startsWith('Misafir_')) return; onSay++;
        let koz = globalKozmetikler[o] || []; let iR = koz.includes('atesli_isim') ? '#ff4757' : '#fff'; let tac = koz.includes('neon_tac') ? '👑 ' : '';
        let ligColors = ["#cd7f32", "#bdc3c7", "#f1c40f", "#3498db"]; let ligNames = ["BRONZ", "GÜMÜŞ", "ALTIN", "ELMAS"];

        listeDiv.innerHTML += `
            <div class="friend-card">
                <div class="friend-card-left">
                    <div class="friend-avatar">😎</div>
                    <div class="friend-info">
                        <div class="friend-name" style="color:${iR};">${tac}${o}</div>
                        <div class="friend-tags">
                            <span class="friend-league" style="color:${ligColors[o.length%4]}; border-color:${ligColors[o.length%4]}">${ligNames[o.length%4]} LİG</span>
                            <span class="status-badge online">🟢 Çevrimiçi</span>
                        </div>
                    </div>
                </div>
                <div class="friend-actions">
                    <button class="f-btn f-btn-profile" onclick="profiliGoster('${o}')" title="Profil">👤</button>
                    <button class="f-btn f-btn-invite" onclick="masayaDavetEt('${o}')" title="Masaya Davet Et">🎮</button>
                </div>
            </div>`;
    });
    if(onSay === 0) listeDiv.innerHTML = `<div class="empty-friends-state"><div class="empty-icon">🎲</div><h3>Kimse Yok</h3><p>Lobide uygun oyuncu bulunmuyor.</p></div>`;
};

window.masayaDavetEt = function(n) { socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: n, masaAdi: suAnkiMasam }); document.getElementById('arkadaslarEkrani').style.display = 'none'; };
