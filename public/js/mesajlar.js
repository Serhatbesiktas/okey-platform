// --- BEYCO ÖZEL SOHBET MODÜLÜ (YOK EDİCİ SİLME & BİLDİRİM KORUMASI) --- //

const msgStilleri = document.createElement('style');
msgStilleri.innerHTML = `
    .vip-mesaj-modal {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 15, 10, 0.85); backdrop-filter: blur(5px);
        z-index: 9999999; display: none; flex-direction: column; justify-content: center; align-items: center;
        overscroll-behavior: none; touch-action: none;
    }
    .vip-mesaj-kutu {
        width: 95%; max-width: 400px; height: 60vh; min-height: 400px; max-height: 550px; 
        background: #0a0f0c; border: 2px solid #2ecc71; border-radius: 20px;
        box-shadow: 0 15px 40px rgba(46, 204, 113, 0.25); display: flex; flex-direction: column; overflow: hidden;
    }
    .vip-mesaj-header {
        background: linear-gradient(145deg, #16221a 0%, #0a0f0c 100%);
        border-bottom: 1px solid rgba(46, 204, 113, 0.3); padding: 15px; display: flex; justify-content: space-between; align-items: center;
    }
    .vip-mesaj-header h2 { color: #2ecc71; font-size: 16px; margin: 0; display:flex; align-items:center; gap:8px;}
    .sohbet-liste-satir {
        display: flex; justify-content: space-between; align-items: center;
        padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: 0.2s;
    }
    .sohbet-liste-satir:active { background: rgba(255,255,255,0.05); }
    .sohbet-alani { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; background: #0d1410; overscroll-behavior: contain; }
    .balon { max-width: 78%; padding: 10px 14px; border-radius: 18px; font-size: 13px; line-height: 1.4; word-wrap: break-word; }
    .balon-ben { align-self: flex-end; background: #005c4b; color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
    .balon-karsi { align-self: flex-start; background: #202c33; color: #fff; border-bottom-left-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
    .mesaj-zaman { font-size: 9px; color: rgba(255,255,255,0.6); display: block; text-align: right; margin-top: 4px; }
    .sohbet-yazma-alani { padding: 12px; background: #16221a; border-top: 1px solid rgba(46, 204, 113, 0.3); display: flex; gap: 10px; align-items: center; }
    .sohbet-input { flex: 1; background: #0a0f0c; color: #fff; border: 1px solid #52796f; border-radius: 25px; padding: 12px 18px; font-size: 14px; outline: none; }
    .sohbet-input:focus { border-color: #2ecc71; box-shadow: 0 0 8px rgba(46, 204, 113, 0.3); }
    .btn-gonder-ok { background: #2ecc71; color: #111; border: none; width: 44px; height: 44px; border-radius: 50%; font-size: 20px; font-weight: bold; display: flex; justify-content: center; align-items: center; cursor: pointer; }
    .pulse-anim { animation: pulseAlert 1.2s infinite; }
`;
document.head.appendChild(msgStilleri);

function getKendiAdim() {
    const kutu = document.getElementById('benimAdimKutusu');
    return kutu ? kutu.innerText.replace('✔', '').replace('👑', '').trim() : "";
}

document.body.insertAdjacentHTML('beforeend', `
    <div id="pmToast" style="position:fixed; top:-100px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #128C7E, #25D366); color:#fff; padding:10px 20px; border-radius:30px; font-weight:bold; font-size:13px; z-index:999999999; box-shadow:0 5px 15px rgba(37, 211, 102, 0.4); transition:0.4s; border:2px solid #fff;">✉️ Yeni Özel Mesaj!</div>
    
    <div id="sohbetListesiEkrani" class="vip-mesaj-modal">
        <div class="vip-mesaj-kutu">
            <div class="vip-mesaj-header">
                <h2>💬 Sohbetlerim</h2>
                <button onclick="kapatMesajEkrani('sohbetListesiEkrani')" style="background:none;border:none;color:#e74c3c;font-size:28px;cursor:pointer;">×</button>
            </div>
            <div id="sohbetKisilerListesi" style="flex:1; overflow-y:auto;"><p style="color:#777; text-align:center; font-size:12px; margin-top:50px;">Henüz hiç sohbetin yok.</p></div>
        </div>
    </div>
    <div id="sohbetPenceresi" class="vip-mesaj-modal" style="z-index: 99999999;">
        <div class="vip-mesaj-kutu">
            <div class="vip-mesaj-header">
                <button onclick="sohbetPenceresindenGeriDon()" style="background:none;border:none;color:#f2c94c;font-size:18px;cursor:pointer;font-weight:bold;">⬅ Geri</button>
                <h2 id="sohbetBaslikIsim" style="color:#fff; font-size:15px;">...</h2>
                <button onclick="aktifKisiyiEngelle()" style="background:none;border:none;color:#e74c3c;font-size:20px;cursor:pointer;">🚫</button>
            </div>
            <div id="sohbetBalonlariAlani" class="sohbet-alani"></div>
            <div class="sohbet-yazma-alani">
                <input type="text" id="sohbetMesajInput" class="sohbet-input" placeholder="Mesaj yaz..." maxlength="150" autocomplete="off" onkeypress="if(event.key === 'Enter') window.sohbetGonderAksiyon()">
                <button id="btnSohbetGonder" class="btn-gonder-ok" onclick="window.sohbetGonderAksiyon()">➤</button>
            </div>
        </div>
    </div>
`);

setTimeout(() => {
    const altMenu = document.querySelector('.alt-menu-container');
    if(altMenu) {
        const mBtn = document.createElement('div'); mBtn.className = 'alt-menu-item'; mBtn.style.cursor = 'pointer'; mBtn.style.position = 'relative';
        mBtn.onclick = () => {
            if(getKendiAdim().startsWith('MİSAFİR_')) { if(window.ozelUyariGoster) window.ozelUyariGoster("⚠️ BEYCO Misafir hesapları mesajlaşamaz!"); return; }
            document.body.style.overflow = 'hidden'; document.getElementById('sohbetListesiEkrani').style.display = 'flex';
        };
        mBtn.innerHTML = `<div class="alt-menu-ikon">💬</div><span style="color:#2ecc71; font-weight:bold;">Sohbet</span><span id="yeniMesajBildirim" style="display:none; position:absolute; top:-5px; right:5px; background:#e74c3c; color:#fff; border-radius:50%; width:16px; height:16px; font-size:10px; line-height:16px; text-align:center; font-weight:bold;">!</span>`;
        altMenu.appendChild(mBtn);
    }

    const profilFirlatAlani = document.getElementById('profilEsyaFirlatAlani');
    if(profilFirlatAlani) {
        const btnHTML = `<button onclick="profilldenMesajAt()" class="satin-al-btn" style="width:100%; margin-top:5px; margin-bottom:15px; background:linear-gradient(135deg, #128C7E, #27ae60); color:#fff; font-size:13px; padding:10px; font-weight:900; box-shadow: 0 0 10px rgba(46, 204, 113, 0.4); border-radius:10px;">💬 ÖZEL MESAJ GÖNDER</button>`;
        profilFirlatAlani.insertAdjacentHTML('beforebegin', btnHTML);
    }

    const masaEkrani = document.getElementById('masaEkrani');
    if(masaEkrani) {
        let solGrup = document.getElementById('solButonGrubu');
        if(!solGrup) {
            solGrup = document.createElement('div'); solGrup.id = 'solButonGrubu';
            masaEkrani.appendChild(solGrup);
        }
        
        if(!document.getElementById('masaIciOzelMesajBtn')) {
            solGrup.insertAdjacentHTML('beforeend', `<button id="masaIciOzelMesajBtn" class="masa-sol-btn" style="order:3; position:relative;" onclick="document.body.style.overflow='hidden'; document.getElementById('sohbetListesiEkrani').style.display='flex';" title="Özel Mesajlar">✉️<span id="masaYeniMesajBildirim" class="pulse-anim" style="display:none; position:absolute; top:-3px; right:-3px; background:#e74c3c; color:#fff; border-radius:50%; width:18px; height:18px; font-size:11px; line-height:18px; text-align:center; font-weight:bold;">!</span></button>`);
        }
    }
}, 1200);

let aktifSohbetHedefi = ""; let engellenenKullanicilar = []; let tumSohbetVerisi = {}; let canliYayinAboneligi = null; let oncekiOkunmamisSayisi = 0; let ilkYukleme = true;

window.kapatMesajEkrani = function(id) { document.getElementById(id).style.display = 'none'; document.body.style.overflow = ''; };
window.sohbetPenceresindenGeriDon = function() { document.getElementById('sohbetPenceresi').style.display = 'none'; aktifSohbetHedefi = ""; document.getElementById('sohbetListesiEkrani').style.display = 'flex'; };

window.profilldenMesajAt = function() {
    const bAd = getKendiAdim(); 
    if(bAd === "Bağlanıyor..." || bAd === "") { if(window.ozelUyariGoster) window.ozelUyariGoster("Sunucuya bağlanıyor, lütfen bekle..."); return; }
    if(bAd.startsWith('MİSAFİR_')) { if(window.ozelUyariGoster) window.ozelUyariGoster("⚠️ Misafirler mesaj atamaz!"); return; }
    
    const hBtn = document.getElementById('profilArkadasBtn'); if(!hBtn || !hBtn.dataset.hedef) return; const kime = hBtn.dataset.hedef;
    if(kime === bAd) return; if(kime.startsWith("MİSAFİR_")) { if(window.ozelUyariGoster) window.ozelUyariGoster("⚠️ Misafir hesaplara mesaj gönderilemez!"); return; }
    document.getElementById('profilEkrani').style.display = 'none'; window.sohbetiAc(kime);
};

window.sohbetGonderAksiyon = function() {
    try {
        const inputEl = document.getElementById('sohbetMesajInput'); const icerik = inputEl.value.trim();
        if(icerik === "" || !aktifSohbetHedefi || typeof firebase === 'undefined' || !firebase.auth().currentUser) return;
        
        const gonderen = getKendiAdim(); 
        if(gonderen === "Bağlanıyor..." || gonderen === "") { if(window.ozelUyariGoster) window.ozelUyariGoster("Sunucuya bağlanıyor, lütfen bekle..."); return; }
        
        inputEl.value = ""; const yeniMesaj = { kimden: gonderen, icerik: icerik, tarih: new Date().toISOString() };
        
        // Kendi listeme ekle (FieldPath ile güvenli yazım)
        const benimYol = new firebase.firestore.FieldPath("sohbetler", aktifSohbetHedefi);
        firebase.firestore().collection("kullanicilar").doc(firebase.auth().currentUser.uid).update({
            [benimYol]: firebase.firestore.FieldValue.arrayUnion(yeniMesaj)
        }).catch(() => {
            // Belki doc ilk kez açılıyordur
            firebase.firestore().collection("kullanicilar").doc(firebase.auth().currentUser.uid).set({
                sohbetler: { [aktifSohbetHedefi]: [yeniMesaj] }
            }, { merge: true });
        });

        // Karşı tarafa gönder
        firebase.firestore().collection("kullanicilar").where("isim", "==", aktifSohbetHedefi).get().then(snap => {
            if(!snap.empty) {
                const hDoc = snap.docs[0]; const engeller = hDoc.data().engellenenler || [];
                if(!engeller.includes(gonderen)) { 
                    const hedefYol = new firebase.firestore.FieldPath("sohbetler", gonderen);
                    firebase.firestore().collection("kullanicilar").doc(hDoc.id).update({ 
                        [hedefYol]: firebase.firestore.FieldValue.arrayUnion(yeniMesaj),
                        okunmamisSohbetler: firebase.firestore.FieldValue.arrayUnion(gonderen) 
                    }).catch(() => {
                        firebase.firestore().collection("kullanicilar").doc(hDoc.id).set({
                            sohbetler: { [gonderen]: [yeniMesaj] },
                            okunmamisSohbetler: [gonderen]
                        }, { merge: true });
                    });
                }
            }
        });
    } catch(err) { console.log(err); }
};

window.sohbetiAc = function(kisiIsmi) {
    aktifSohbetHedefi = kisiIsmi; document.getElementById('sohbetListesiEkrani').style.display = 'none'; document.body.style.overflow = 'hidden';
    const ekran = document.getElementById('sohbetPenceresi'); document.getElementById('sohbetBaslikIsim').innerText = kisiIsmi; ekran.style.display = 'flex';
    
    const lobiB = document.getElementById('yeniMesajBildirim'); const masaB = document.getElementById('masaYeniMesajBildirim');
    if(lobiB) lobiB.style.display = 'none'; if(masaB) masaB.style.display = 'none';

    if(typeof firebase !== 'undefined' && firebase.auth().currentUser) { 
        firebase.firestore().collection("kullanicilar").doc(firebase.auth().currentUser.uid).update({ okunmamisSohbetler: firebase.firestore.FieldValue.arrayRemove(kisiIsmi) }).catch(e=>{}); 
    }
    ekranaBalonlariCiz();
};

function ekranaBalonlariCiz() {
    const balonAlani = document.getElementById('sohbetBalonlariAlani'); balonAlani.innerHTML = ''; const benimAdim = getKendiAdim();
    if(!aktifSohbetHedefi || !tumSohbetVerisi[aktifSohbetHedefi] || tumSohbetVerisi[aktifSohbetHedefi].length === 0) { balonAlani.innerHTML = '<p style="color:#777; text-align:center; font-size:12px; margin-top:20px;">Sohbete başla...</p>'; return; }
    tumSohbetVerisi[aktifSohbetHedefi].forEach(m => {
        let benM = (m.kimden === benimAdim); let sinif = benM ? "balon balon-ben" : "balon balon-karsi";
        let t = new Date(m.tarih); let saatStr = t.getHours().toString().padStart(2, '0') + ":" + t.getMinutes().toString().padStart(2, '0');
        balonAlani.innerHTML += `<div class="${sinif}">${m.icerik}<span class="mesaj-zaman">${saatStr}</span></div>`;
    });
    setTimeout(() => { balonAlani.scrollTop = balonAlani.scrollHeight; }, 50);
}

// İŞTE NOKTA BUG'INI KÖKÜNDEN ÇÖZEN ATOMİK YOK EDİCİ KOMUT
window.sohbetiKompleSil = function(hedefIsim) {
    if(event) event.stopPropagation(); 
    const onay = confirm(`⚠️ DİKKAT!\n${hedefIsim} ile olan tüm sohbet geçmişini silmek istediğinize emin misiniz?`); 
    if(!onay) return;
    
    if(typeof firebase === 'undefined' || !firebase.auth().currentUser) return;
    const uid = firebase.auth().currentUser.uid;
    
    // Noktalı isimleri ezmek için FieldPath ve FieldValue.delete() kombinasyonu (Geri dönmesi imkansız)
    const sohbetYolu = new firebase.firestore.FieldPath('sohbetler', hedefIsim);
    
    firebase.firestore().collection("kullanicilar").doc(uid).update({ 
        [sohbetYolu]: firebase.firestore.FieldValue.delete(),
        okunmamisSohbetler: firebase.firestore.FieldValue.arrayRemove(hedefIsim)
    }).then(() => { 
        if(window.ozelUyariGoster) window.ozelUyariGoster(`🗑️ ${hedefIsim} ile olan sohbet kalıcı olarak silindi.`); 
        if(aktifSohbetHedefi === hedefIsim) window.sohbetPenceresindenGeriDon();
    }).catch(e => console.log("Silme hatası:", e));
};

function canliSohbetiBaslat() {
    if(typeof firebase === 'undefined' || !firebase.auth().currentUser || getKendiAdim().startsWith("MİSAFİR_")) return;
    if(canliYayinAboneligi) canliYayinAboneligi();
    canliYayinAboneligi = firebase.firestore().collection("kullanicilar").doc(firebase.auth().currentUser.uid).onSnapshot(doc => {
        if(!doc.exists) return; const data = doc.data(); tumSohbetVerisi = data.sohbetler || {}; engellenenKullanicilar = data.engellenenler || []; const okunmamisListesi = data.okunmamisSohbetler || [];
        const listDiv = document.getElementById('sohbetKisilerListesi');
        if(listDiv) {
            listDiv.innerHTML = ''; let sohbetSayisi = 0; let siralamaDizisi = [];
            for(let kisi in tumSohbetVerisi) {
                if(engellenenKullanicilar.includes(kisi)) continue; let m = tumSohbetVerisi[kisi];
                if(m.length > 0) { siralamaDizisi.push({ kisi: kisi, son: m[m.length - 1] }); }
            }
            siralamaDizisi.sort((a, b) => new Date(b.son.tarih) - new Date(a.son.tarih));
            siralamaDizisi.forEach(veri => {
                sohbetSayisi++; let k = veri.kisi; let sonM = veri.son; let msgOnizleme = sonM.icerik.length > 25 ? sonM.icerik.substring(0, 25) + '...' : sonM.icerik;
                let isY = okunmamisListesi.includes(k) && k !== aktifSohbetHedefi; let yeniE = isY ? `<span style="background:#2ecc71; color:#111; font-size:10px; padding:2px 6px; border-radius:10px; font-weight:bold; margin-right:5px;">YENİ</span>` : '';
                listDiv.innerHTML += `<div class="sohbet-liste-satir" onclick="sohbetiAc('${k}')"><div style="display:flex; flex-direction:column; gap:5px; flex:1;"><strong style="color:#fff; font-size:14px;">${k}</strong><span style="color:#7f8c8d; font-size:12px;">${msgOnizleme}</span></div><div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;"><span style="color:#52796f; font-size:10px;">${new Date(sonM.tarih).toLocaleDateString('tr-TR')}</span><div style="display:flex; align-items:center;">${yeniE}<button onclick="window.sohbetiKompleSil('${k}')" style="background:rgba(231,76,60,0.15); color:#e74c3c; border:1px solid rgba(231,76,60,0.5); border-radius:5px; padding:4px 8px; font-size:11px; font-weight:bold; cursor:pointer;">Sil 🗑️</button></div></div></div>`;
            });
            if(sohbetSayisi === 0) listDiv.innerHTML = '<p style="text-align:center; color:#777; font-size:12px; margin-top:50px;">Henüz hiç sohbetin yok.</p>';
        }
        if(aktifSohbetHedefi && document.getElementById('sohbetPenceresi').style.display !== 'none') { ekranaBalonlariCiz(); if(okunmamisListesi.includes(aktifSohbetHedefi)) { firebase.firestore().collection("kullanicilar").doc(firebase.auth().currentUser.uid).update({ okunmamisSohbetler: firebase.firestore.FieldValue.arrayRemove(aktifSohbetHedefi) }).catch(e=>{}); } }
        
        const gercekOkunmamis = okunmamisListesi.filter(k => !engellenenKullanicilar.includes(k));
        const lobiB = document.getElementById('yeniMesajBildirim'); const masaB = document.getElementById('masaYeniMesajBildirim');
        
        if(gercekOkunmamis.length > 0) {
            if(lobiB) lobiB.style.display = 'block'; if(masaB) masaB.style.display = 'block';
            
            // SAYFA YENİLEME KORUMASI: İlk yüklemede toast gösterme!
            if(gercekOkunmamis.length > oncekiOkunmamisSayisi && !ilkYukleme) {
                const toast = document.getElementById('pmToast');
                if(toast) { toast.innerHTML = `✉️ <span style="color:#fff;">${gercekOkunmamis[gercekOkunmamis.length - 1]}</span> sana mesaj gönderdi!`; toast.style.top = "20px"; setTimeout(() => { toast.style.top = "-100px"; }, 3000); }
            }
        } else { 
            if(lobiB) lobiB.style.display = 'none'; if(masaB) masaB.style.display = 'none'; 
        }
        ilkYukleme = false; // Sistem oturdu, korumayı kaldır
        oncekiOkunmamisSayisi = gercekOkunmamis.length;
    });
}

window.aktifKisiyiEngelle = function() {
    if(!aktifSohbetHedefi) return; const onay = confirm(`⚠️ DİKKAT!\n${aktifSohbetHedefi} adlı oyuncuyu engellemek istediğinize emin misiniz?\nSohbet geçmişi silinecek ve size bir daha mesaj atamayacak.`); if(!onay) return;
    if(typeof firebase === 'undefined' || !firebase.auth().currentUser) return;
    if(!engellenenKullanicilar.includes(aktifSohbetHedefi)) engellenenKullanicilar.push(aktifSohbetHedefi);
    firebase.firestore().collection("kullanicilar").doc(firebase.auth().currentUser.uid).update({ engellenenler: engellenenKullanicilar, [`sohbetler.${aktifSohbetHedefi}`]: firebase.firestore.FieldValue.delete() }).then(() => { if(window.ozelUyariGoster) window.ozelUyariGoster(`🚫 ${aktifSohbetHedefi} engellendi!`); sohbetPenceresindenGeriDon(); });
};

let sohbetBaslatici = setInterval(() => { if(typeof firebase !== 'undefined' && firebase.auth().currentUser) { clearInterval(sohbetBaslatici); canliSohbetiBaslat(); } }, 1000);
