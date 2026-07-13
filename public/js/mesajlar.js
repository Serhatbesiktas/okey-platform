// ==========================================
// BEYCO GAMES - PROFESYONEL ÖZEL MESAJ SİSTEMİ (WhatsApp Tarzı)
// ==========================================

window.aktifDMSohbet = null;
let dmUnsubscribe = null;
let globalUnreadUnsubscribe = null;
let isTypingTimeout = null;
window.dmDinleyiciBasladi = false;

// Güvenlik: HTML ve Script Engelleme Filtresi
function dmSanitize(str) {
    if(typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// DM Penceresini Kapat
window.kapatDM = function() {
    document.getElementById('dmModal').style.display = 'none';
    window.aktifDMSohbet = null;
    if(dmUnsubscribe) { dmUnsubscribe(); dmUnsubscribe = null; } // Bellek sızıntısını önler
};

// DM Penceresini Aç
window.acDM = function(hedefIsim) {
    if(typeof isMisafir !== 'undefined' && isMisafir) return ozelUyariGoster("⚠️ Misafirler özel mesaj gönderemez.");
    if(hedefIsim === aktifKullaniciAdi) return ozelUyariGoster("Kendinize mesaj gönderemezsiniz.");
    if(!hedefIsim) return;

    // Diğer tüm modalları gizle ki UI temiz kalsın
    let profil = document.getElementById('profilEkrani'); if(profil) profil.style.display = 'none';
    let arkadaslar = document.getElementById('arkadaslarEkrani'); if(arkadaslar) arkadaslar.style.display = 'none';
    let gelenKutusu = document.getElementById('dmGelenKutusuModal'); if(gelenKutusu) gelenKutusu.style.display = 'none';

    window.aktifDMSohbet = hedefIsim;
    document.getElementById('dmHedefIsim').innerText = hedefIsim;
    
    updateDmHeaderStatus(hedefIsim);

    document.getElementById('dmModal').style.display = 'flex';
    document.getElementById('dmMesajListesi').innerHTML = '<div style="text-align:center; padding:20px; color:#a3c4bc; font-weight:bold; font-size:12px;">Sohbet Yükleniyor...</div>';
    
    listenToDMRoom(hedefIsim);
};

// Üst Kısımdaki Çevrimiçi / Son Görülme Kontrolü
function updateDmHeaderStatus(hedef) {
    const durumEl = document.getElementById('dmHedefDurum');
    if(typeof onlineOyuncularListesi !== 'undefined' && onlineOyuncularListesi.includes(hedef)) {
        durumEl.innerText = '🟢 Çevrimiçi';
        durumEl.style.color = '#2ecc71';
    } else {
        db.collection("kullanicilar").where("isim", "==", hedef).get().then(snap => {
            if(!snap.empty && snap.docs[0].data().sonGorulme) {
                let date = new Date(snap.docs[0].data().sonGorulme);
                let timeStr = String(date.getHours()).padStart(2,'0') + ":" + String(date.getMinutes()).padStart(2,'0');
                durumEl.innerText = `Son görülme: ${timeStr}`;
            } else {
                durumEl.innerText = '⚫ Çevrimdışı';
            }
            durumEl.style.color = '#7f8c8d';
        }).catch(() => { durumEl.innerText = '⚫ Çevrimdışı'; durumEl.style.color = '#7f8c8d'; });
    }
}

// Sadece aktif sohbeti dinleyen optimize edilmiş Firestore Listener
function listenToDMRoom(hedefIsim) {
    if(dmUnsubscribe) dmUnsubscribe();
    
    const roomId = [aktifKullaniciAdi, hedefIsim].sort().join("_");
    const docRef = db.collection('ozel_sohbetler').doc(roomId);

    dmUnsubscribe = docRef.onSnapshot(doc => {
        if(!doc.exists) {
            document.getElementById('dmMesajListesi').innerHTML = '<div style="text-align:center; padding:20px; color:#a3c4bc; font-size:12px; font-weight:bold;">Henüz mesaj yok. İlk mesajı gönder!</div>';
            return;
        }
        
        const data = doc.data();
        const mesajlar = data.mesajlar || [];
        
        // Karşıdan yeni mesaj geldiyse, otomatik olarak "Okundu" işaretle
        let myReadTime = data.okunmaZamani && data.okunmaZamani[aktifKullaniciAdi] ? data.okunmaZamani[aktifKullaniciAdi] : 0;
        let lastMsgTime = data.sonMesajZamani || 0;
        
        if(data.sonGonderen !== aktifKullaniciAdi && myReadTime < lastMsgTime) {
            docRef.set({ okunmaZamani: { [aktifKullaniciAdi]: Date.now() } }, {merge: true});
        }

        renderDMMessages(mesajlar, data.okunmaZamani ? data.okunmaZamani[hedefIsim] : 0);
        
        // "Yazıyor..." Kontrolü (Son 3 saniye içinde klavyeye bastıysa)
        const typingTime = data.yaziyor && data.yaziyor[hedefIsim] ? data.yaziyor[hedefIsim] : 0;
        if(Date.now() - typingTime < 3000) {
            document.getElementById('dmYaziyor').style.display = 'block';
        } else {
            document.getElementById('dmYaziyor').style.display = 'none';
        }
    });
}

// Mesajları Ekrana Render Etme (Okundu tikleri ve modern balonlar)
function renderDMMessages(mesajlar, hedefOkunmaZamani) {
    const list = document.getElementById('dmMesajListesi');
    list.innerHTML = '';
    
    let targetOnline = typeof onlineOyuncularListesi !== 'undefined' && onlineOyuncularListesi.includes(window.aktifDMSohbet);

    mesajlar.forEach(m => {
        let isMe = m.gonderen === aktifKullaniciAdi;
        let d = new Date(m.tarih);
        let timeStr = String(d.getHours()).padStart(2,'0') + ":" + String(d.getMinutes()).padStart(2,'0');
        
        let tikHtml = '';
        if(isMe) {
            let isRead = m.tarih <= hedefOkunmaZamani;
            let isDelivered = targetOnline;
            
            if(isRead) tikHtml = '<span class="dm-tik tik-okundu">✓✓</span>';
            else if(isDelivered) tikHtml = '<span class="dm-tik tik-cift">✓✓</span>';
            else tikHtml = '<span class="dm-tik tik-tek">✓</span>';
        }

        let div = document.createElement('div');
        div.className = 'dm-balon ' + (isMe ? 'dm-ben' : 'dm-karsi');
        div.innerHTML = `${m.metin} <div class="dm-alt-bilgi">${timeStr} ${tikHtml}</div>`;
        list.appendChild(div);
    });
    
    list.scrollTop = list.scrollHeight; // Otomatik olarak en alta in
}

// Mesaj Gönderme İşlemi
window.dmGonder = function() {
    const input = document.getElementById('dmInput');
    let text = input.value.trim();
    if(text === '' || !window.aktifDMSohbet) return;
    if(text.length > 200) return ozelUyariGoster("Mesaj çok uzun! (Maks 200 karakter)");
    
    text = dmSanitize(text);
    input.value = '';
    document.getElementById('dmYaziyor').style.display = 'none'; 

    const roomId = [aktifKullaniciAdi, window.aktifDMSohbet].sort().join("_");
    const msgObj = { gonderen: aktifKullaniciAdi, metin: text, tarih: Date.now() };

    db.collection('ozel_sohbetler').doc(roomId).set({
        katilimcilar: [aktifKullaniciAdi, window.aktifDMSohbet],
        sonGonderen: aktifKullaniciAdi,
        sonMesajZamani: Date.now(),
        sonMesajOzet: text.substring(0,25),
        mesajlar: firebase.firestore.FieldValue.arrayUnion(msgObj)
    }, {merge: true}).catch(e => console.error("Mesaj gönderilemedi:", e));
};

// Yazıyor İndikatörü Tetikleyicisi
window.dmYaziyorTetikle = function() {
    if(!window.aktifDMSohbet) return;
    if(isTypingTimeout) return; // Throttling: Saniyede 1 kez veritabanına yazar
    
    const roomId = [aktifKullaniciAdi, window.aktifDMSohbet].sort().join("_");
    db.collection('ozel_sohbetler').doc(roomId).set({
        yaziyor: { [aktifKullaniciAdi]: Date.now() }
    }, {merge: true});

    isTypingTimeout = setTimeout(() => { isTypingTimeout = null; }, 2000);
};

// Arka Planda Yeni Mesajları Yakalayan Global Dinleyici
function baslatDMDinleyici() {
    if(typeof db === 'undefined' || !auth.currentUser) return;
    
    if(globalUnreadUnsubscribe) globalUnreadUnsubscribe();
    
    globalUnreadUnsubscribe = db.collection('ozel_sohbetler')
        .where('katilimcilar', 'array-contains', aktifKullaniciAdi)
        .onSnapshot(snap => {
            let unreadCount = 0;
            snap.forEach(doc => {
                let d = doc.data();
                let myReadTime = d.okunmaZamani && d.okunmaZamani[aktifKullaniciAdi] ? d.okunmaZamani[aktifKullaniciAdi] : 0;
                
                if(d.sonGonderen !== aktifKullaniciAdi && d.sonMesajZamani > myReadTime) {
                    unreadCount++;
                    // O sohbet açık değilse ekrana Toast bildirim gönder
                    if(window.aktifDMSohbet !== d.sonGonderen && Date.now() - d.sonMesajZamani < 5000) {
                        window.gosterDMToast(d.sonGonderen, d.sonMesajOzet);
                    }
                }
            });
            
            // Alt Menüdeki "Sohbet" Kırmızı Rozetini Güncelle
            const badge = document.getElementById('dmUnreadBadge');
            if(badge) {
                if(unreadCount > 0) { badge.innerText = unreadCount; badge.style.display = 'flex'; } 
                else { badge.style.display = 'none'; }
            }
            
            // Gelen kutusu penceresi kapağı açıksa anlık render et
            if(document.getElementById('dmGelenKutusuModal') && document.getElementById('dmGelenKutusuModal').style.display === 'flex') {
                renderInbox(snap);
            }
        });
        
    // Sunucuya dokunmadan, oyuncu çevrimdışı olduğunda görülebilmesi için "Son Görülme" tetikleyicisi
    setInterval(() => {
        if(auth.currentUser && typeof isMisafir !== 'undefined' && !isMisafir) {
            db.collection("kullanicilar").doc(auth.currentUser.uid).update({ sonGorulme: Date.now() }).catch(()=>{});
        }
    }, 60000); 
}

// Gelen Kutusu (İnbox) Arayüzü
window.dmGelenKutusuAc = function() {
    if(typeof isMisafir !== 'undefined' && isMisafir) return ozelUyariGoster("⚠️ Misafirler mesaj kullanamaz.");
    document.getElementById('dmGelenKutusuModal').style.display = 'flex';
};

function renderInbox(snap) {
    const list = document.getElementById('dmGelenKutusuListesi');
    if(!list) return;
    
    let docs = [];
    snap.forEach(d => docs.push(d.data()));
    docs.sort((a,b) => (b.sonMesajZamani || 0) - (a.sonMesajZamani || 0)); // En son mesaj en üste
    
    if(docs.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#555; font-size:12px; font-weight:bold;">Sohbet geçmişin boş.</div>';
        return;
    }
    
    list.innerHTML = '';
    docs.forEach(d => {
        let otherUser = d.katilimcilar[0] === aktifKullaniciAdi ? d.katilimcilar[1] : d.katilimcilar[0];
        let myReadTime = d.okunmaZamani && d.okunmaZamani[aktifKullaniciAdi] ? d.okunmaZamani[aktifKullaniciAdi] : 0;
        let isUnread = d.sonGonderen !== aktifKullaniciAdi && d.sonMesajZamani > myReadTime;
        
        let timeStr = "";
        if(d.sonMesajZamani) {
            let t = new Date(d.sonMesajZamani);
            timeStr = String(t.getHours()).padStart(2,'0') + ":" + String(t.getMinutes()).padStart(2,'0');
        }
        
        let unreadBadge = isUnread ? `<span style="background:#e74c3c; color:#fff; font-size:9px; padding:2px 6px; border-radius:10px; font-weight:900;">YENİ</span>` : '';
        let bck = isUnread ? 'rgba(52, 152, 219, 0.1)' : 'rgba(255,255,255,0.03)';
        let brd = isUnread ? '#3498db' : 'rgba(255,255,255,0.05)';
        
        list.innerHTML += `
            <div onclick="acDM('${otherUser}')" style="display:flex; justify-content:space-between; align-items:center; background:${bck}; border:1px solid ${brd}; padding:12px; border-radius:12px; margin-bottom:10px; cursor:pointer; transition: transform 0.1s;">
                <div style="display:flex; flex-direction:column; gap:5px; max-width:70%;">
                    <div style="color:#f1c40f; font-weight:900; font-size:14px; display:flex; align-items:center; gap:6px;">${otherUser} ${unreadBadge}</div>
                    <div style="color:#a3c4bc; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:${isUnread ? 'bold':'normal'};">${d.sonGonderen === aktifKullaniciAdi ? 'Sen: ' : ''}${d.sonMesajOzet || '...'}</div>
                </div>
                <div style="font-size:10px; color:#777; font-weight:bold;">${timeStr}</div>
            </div>
        `;
    });
}

// Toast (Kayan) Bildirim
window.gosterDMToast = function(isim, ozet) {
    const container = document.getElementById('arkadasToastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = 'arkadas-toast';
    toast.style.cssText = "background: rgba(18, 26, 20, 0.95); border: 1px solid #3498db; border-radius: 12px; padding: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.5); width: 250px; pointer-events: auto; font-family: inherit; cursor:pointer;";
    toast.innerHTML = `
        <div style="color:#3498db; font-weight:bold; font-size:13px; margin-bottom:8px;">💬 Yeni Mesaj</div>
        <div style="color:#f1c40f; font-size:12px; font-weight:bold;">${isim}</div>
        <div style="color:#fff; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ozet}...</div>
    `;
    toast.onclick = () => { toast.remove(); window.acDM(isim); };
    container.appendChild(toast);
    if(typeof sesCal === 'function' && typeof sesSiraSende !== 'undefined') sesCal(sesSiraSende);
    setTimeout(() => { if(toast) toast.remove(); }, 5000);
};

// Global Dinleyiciyi Sadece 1 Kere Başlat
setInterval(() => {
    if(!window.dmDinleyiciBasladi && typeof auth !== 'undefined' && auth.currentUser) {
        window.dmDinleyiciBasladi = true;
        baslatDMDinleyici();
    }
}, 2000);
