// --- PROFESYONEL CANLI SOHBET MODÜLÜ (KOMPAKT BOYUT & HATASIZ) --- //

// 1. VIP Sohbet Stilleri (BOYUTLAR KÜÇÜLTÜLDÜ VE ŞIKLAŞTIRILDI)
const mesajStilleri = document.createElement('style');
mesajStilleri.innerHTML = `
    .vip-mesaj-modal {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(10, 15, 10, 0.85); backdrop-filter: blur(5px);
        z-index: 9999999; display: none; flex-direction: column; justify-content: center; align-items: center;
        overscroll-behavior: none; touch-action: none;
    }
    .vip-mesaj-kutu {
        width: 95%; max-width: 400px; 
        height: 60vh; min-height: 400px; max-height: 550px; /* EKRANIN YARISI KADAR KİBAR OLDU */
        background: #0a0f0c; border: 2px solid #2ecc71; border-radius: 20px;
        box-shadow: 0 15px 40px rgba(46, 204, 113, 0.25);
        display: flex; flex-direction: column; overflow: hidden;
        pointer-events: auto; touch-action: auto;
    }
    .vip-mesaj-header {
        background: linear-gradient(145deg, #16221a 0%, #0a0f0c 100%);
        border-bottom: 1px solid rgba(46, 204, 113, 0.3);
        padding: 15px; display: flex; justify-content: space-between; align-items: center;
    }
    .vip-mesaj-header h2 { color: #2ecc71; font-size: 16px; margin: 0; display:flex; align-items:center; gap:8px;}
    .sohbet-liste-satir {
        display: flex; justify-content: space-between; align-items: center;
        padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer; transition: 0.2s;
    }
    .sohbet-liste-satir:active { background: rgba(255,255,255,0.05); }
    
    /* WhatsApp Balonları */
    .sohbet-alani {
        flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px;
        background: #0d1410; overscroll-behavior: contain;
    }
    .balon {
        max-width: 78%; padding: 10px 14px; border-radius: 18px; font-size: 13px; line-height: 1.4;
        position: relative; word-wrap: break-word;
    }
    .balon-ben {
        align-self: flex-end; background: #005c4b; color: #fff;
        border-bottom-right-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .balon-karsi {
        align-self: flex-start; background: #202c33; color: #fff;
        border-bottom-left-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .mesaj-zaman { font-size: 9px; color: rgba(255,255,255,0.6); display: block; text-align: right; margin-top: 4px; }
    
    /* Modern Yazma Alanı */
    .sohbet-yazma-alani {
        padding: 12px; background: #16221a; border-top: 1px solid rgba(46, 204, 113, 0.3);
        display: flex; gap: 10px; align-items: center;
    }
    .sohbet-input {
        flex: 1; background: #0a0f0c; color: #fff; border: 1px solid #52796f;
        border-radius: 25px; padding: 12px 18px; font-size: 14px; outline: none; transition: 0.3s;
    }
    .sohbet-input:focus { border-color: #2ecc71; box-shadow: 0 0 8px rgba(46, 204, 113, 0.3); }
    .btn-gonder-ok {
        background: #2ecc71; color: #111; border: none; width: 44px; height: 44px;
        border-radius: 50%; font-size: 20px; font-weight: bold; display: flex;
        justify-content: center; align-items: center; cursor: pointer; transition: 0.2s;
    }
    .btn-gonder-ok:active { transform: scale(0.9); }
`;
document.head.appendChild(mesajStilleri);

// Yardımcı Fonksiyon (Diğer dosyadan etkilenmeden kendi adımızı güvenle bulmamızı sağlar)
function getKendiAdim() {
    const kutu = document.getElementById('benimAdimKutusu');
    if(!kutu) return "";
    return kutu.innerText.replace('✔', '').replace('👑', '').trim();
}

// 2. Ekranların Sayfaya Eklenmesi
document.body.insertAdjacentHTML('beforeend', `
    <div id="sohbetListesiEkrani" class="vip-mesaj-modal">
        <div class="vip-mesaj-kutu">
            <div class="vip-mesaj-header">
                <h2>💬 Sohbetlerim</h2>
                <button onclick="kapatMesajEkrani('sohbetListesiEkrani')" style="background:none;border:none;color:#e74c3c;font-size:28px;cursor:pointer;">×</button>
            </div>
            <div id="sohbetKisilerListesi" style="flex:1; overflow-y:auto;">
                <p style="color:#777; text-align:center; font-size:12px; margin-top:50px;">Henüz hiç sohbetin yok.</p>
            </div>
        </div>
    </div>
    
    <div id="sohbetPenceresi" class="vip-mesaj-modal" style="z-index: 99999999;">
        <div class="vip-mesaj-kutu">
            <div class="vip-mesaj-header">
                <button onclick="sohbetPenceresindenGeriDon()" style="background:none;border:none;color:#f2c94c;font-size:18px;cursor:pointer;font-weight:bold;">⬅ Geri</button>
                <h2 id="sohbetBaslikIsim" style="color:#fff; font-size:15px;">...</h2>
                <button onclick="aktifKisiyiEngelle()" title="Kullanıcıyı Engelle" style="background:none;border:none;color:#e74c3c;font-size:20px;cursor:pointer;">🚫</button>
            </div>
            <div id="sohbetBalonlariAlani" class="sohbet-alani">
                </div>
            <div class="sohbet-yazma-alani">
                <input type="text" id="sohbetMesajInput" class="sohbet-input" placeholder="Mesaj yaz..." maxlength="150" autocomplete="off">
                <button id="btnSohbetGonder" class="btn-gonder-ok">➤</button>
            </div>
        </div>
    </div>
`);

// Tuşların Bağlanması
setTimeout(() => {
    const altMenu = document.querySelector('.alt-menu-container');
    if(altMenu) {
        const mesajBtn = document.createElement('div');
        mesajBtn.className = 'alt-menu-item';
        mesajBtn.style.cursor = 'pointer'; mesajBtn.style.position = 'relative';
        mesajBtn.onclick = () => {
            if(getKendiAdim().startsWith('MİSAFİR_')) { if(window.ozelUyariGoster) ozelUyariGoster("⚠️ Misafir hesaplar mesajlaşamaz!"); return; }
            document.body.style.overflow = 'hidden';
            document.getElementById('sohbetListesiEkrani').style.display = 'flex';
        };
        mesajBtn.innerHTML = `
            <div class="alt-menu-ikon">💬</div>
            <span style="color:#2ecc71; font-weight:bold;">Sohbet</span>
            <span id="yeniMesajBildirim" style="display:none; position:absolute; top:-5px; right:5px; background:#e74c3c; color:#fff; border-radius:50%; width:16px; height:16px; font-size:10px; line-height:16px; text-align:center; font-weight:bold;">!</span>
        `;
        altMenu.appendChild(mesajBtn);
    }

    const profilFirlatAlani = document.getElementById('profilEsyaFirlatAlani');
    if(profilFirlatAlani) {
        const btnMesajAtHTML = `<button onclick="profilldenMesajAt()" class="satin-al-btn" style="width:100%; margin-top:5px; margin-bottom:15px; background:linear-gradient(135deg, #128C7E, #27ae60); color:#fff; font-size:13px; padding:10px; font-weight:900; box-shadow: 0 0 10px rgba(46, 204, 113, 0.4); border-radius:10px;">💬 ÖZEL MESAJ GÖNDER</button>`;
        profilFirlatAlani.insertAdjacentHTML('beforebegin', btnMesajAtHTML);
    }
}, 500);

let aktifSohbetHedefi = "";
let engellenenKullanicilar = [];
let tumSohbetVerisi = {};
let canliYayinAboneligi = null;

window.kapatMesajEkrani = function(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = ''; 
};

window.sohbetPenceresindenGeriDon = function() {
    document.getElementById('sohbetPenceresi').style.display = 'none';
    aktifSohbetHedefi = "";
    document.getElementById('sohbetListesiEkrani').style.display = 'flex';
};

window.profilldenMesajAt = function() {
    const benimAdim = getKendiAdim();
    if(benimAdim.startsWith('MİSAFİR_')) { if(window.ozelUyariGoster) ozelUyariGoster("⚠️ Misafirler mesaj atamaz!"); return; }
    
    const hedefBtn = document.getElementById('profilArkadasBtn');
    if(!hedefBtn || !hedefBtn.dataset.hedef) return;
    const kime = hedefBtn.dataset.hedef;
    
    if(kime === benimAdim) return; // Kendine mesaj atamaz

    document.getElementById('profilEkrani').style.display = 'none';
    sohbetiAc(kime);
};

// Enter ile gönderme
document.getElementById('sohbetMesajInput').addEventListener('keypress', function(e) {
    if(e.key === 'Enter') window.sohbetGonderAksiyon();
});

document.getElementById('btnSohbetGonder').onclick = function() { window.sohbetGonderAksiyon(); };

// İŞTE ÇÖZÜM: BAĞIMSIZ, HATA VERMEYEN MESAJ GÖNDERME MOTORU
window.sohbetGonderAksiyon = function() {
    const icerik = document.getElementById('sohbetMesajInput').value.trim();
    const gonderen = getKendiAdim();
    const myUid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;

    if(icerik === "" || !aktifSohbetHedefi || !myUid) return;

    document.getElementById('sohbetMesajInput').value = ""; // Anında sil, bekletme!
    
    const yeniMesaj = { kimden: gonderen, icerik: icerik, tarih: new Date().toISOString() };

    // 1. Kendi veri tabanımı güncelle
    const benimRef = firebase.firestore().collection("kullanicilar").doc(myUid);
    benimRef.update({
        [`sohbetler.${aktifSohbetHedefi}`]: firebase.firestore.FieldValue.arrayUnion(yeniMesaj)
    }).catch(() => {
        // Eğer daha önce hiç sohbet açılmamışsa update hata verir, set ile oluştururuz.
        benimRef.set({ sohbetler: { [aktifSohbetHedefi]: [yeniMesaj] } }, { merge: true });
    });

    // 2. Karşı tarafın veri tabanına mermiyi ateşle
    firebase.firestore().collection("kullanicilar").where("isim", "==", aktifSohbetHedefi).get().then(snapshot => {
        if(!snapshot.empty) {
            const hedefDocId = snapshot.docs[0].id;
            const engellenenler = snapshot.docs[0].data().engellenenler || [];
            
            // Eğer karşı taraf beni engellemediyse mesajı kutusuna koy!
            if(!engellenenler.includes(gonderen)) {
                const hedefRef = firebase.firestore().collection("kullanicilar").doc(hedefDocId);
                hedefRef.update({
                    [`sohbetler.${gonderen}`]: firebase.firestore.FieldValue.arrayUnion(yeniMesaj),
                    okunmamisSohbetler: firebase.firestore.FieldValue.arrayUnion(gonderen)
                }).catch(() => {
                    hedefRef.set({
                        sohbetler: { [gonderen]: [yeniMesaj] },
                        okunmamisSohbetler: [gonderen]
                    }, { merge: true });
                });
            }
        }
    });
};

window.sohbetiAc = function(kisiIsmi) {
    aktifSohbetHedefi = kisiIsmi;
    document.getElementById('sohbetListesiEkrani').style.display = 'none';
    document.body.style.overflow = 'hidden';
    
    const ekran = document.getElementById('sohbetPenceresi');
    document.getElementById('sohbetBaslikIsim').innerText = kisiIsmi;
    ekran.style.display = 'flex';
    
    // Açıldığında okunmamış listesinden bu kişiyi çıkar
    const myUid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;
    if(myUid) {
        firebase.firestore().collection("kullanicilar").doc(myUid).update({
            okunmamisSohbetler: firebase.firestore.FieldValue.arrayRemove(kisiIsmi)
        }).catch(e=>{});
    }
    
    ekranaBalonlariCiz();
};

function ekranaBalonlariCiz() {
    const balonAlani = document.getElementById('sohbetBalonlariAlani');
    balonAlani.innerHTML = '';
    const benimAdim = getKendiAdim();
    
    if(!aktifSohbetHedefi || !tumSohbetVerisi[aktifSohbetHedefi]) {
        balonAlani.innerHTML = '<p style="color:#777; text-align:center; font-size:12px; margin-top:20px;">Sohbete başla...</p>';
        return;
    }

    const mesajlar = tumSohbetVerisi[aktifSohbetHedefi];
    mesajlar.forEach(mesaj => {
        let benMiyim = (mesaj.kimden === benimAdim);
        let sinif = benMiyim ? "balon balon-ben" : "balon balon-karsi";
        
        let tarih = new Date(mesaj.tarih);
        let saatStr = tarih.getHours().toString().padStart(2, '0') + ":" + tarih.getMinutes().toString().padStart(2, '0');

        balonAlani.innerHTML += `
            <div class="${sinif}">
                ${mesaj.icerik}
                <span class="mesaj-zaman">${saatStr}</span>
            </div>
        `;
    });
    
    setTimeout(() => { balonAlani.scrollTop = balonAlani.scrollHeight; }, 50);
}

// CANLI YAYIN (Veritabanını Dinleme)
function canliSohbetiBaslat() {
    if(!firebase.auth().currentUser || getKendiAdim().startsWith("MİSAFİR_")) return;
    
    if(canliYayinAboneligi) canliYayinAboneligi(); 
    const myUid = firebase.auth().currentUser.uid;
    
    canliYayinAboneligi = firebase.firestore().collection("kullanicilar").doc(myUid).onSnapshot(doc => {
        if(!doc.exists) return;
        
        const data = doc.data();
        tumSohbetVerisi = data.sohbetler || {};
        engellenenKullanicilar = data.engellenenler || [];
        const okunmamisListesi = data.okunmamisSohbetler || [];

        const listDiv = document.getElementById('sohbetKisilerListesi');
        if(listDiv) {
            listDiv.innerHTML = '';
            let sohbetSayisi = 0;
            
            let siralamaDizisi = [];
            for(let kisi in tumSohbetVerisi) {
                if(engellenenKullanicilar.includes(kisi)) continue; 
                let mesajlar = tumSohbetVerisi[kisi];
                if(mesajlar.length > 0) {
                    let sonMesaj = mesajlar[mesajlar.length - 1];
                    siralamaDizisi.push({ kisi: kisi, son: sonMesaj });
                }
            }

            siralamaDizisi.sort((a, b) => new Date(b.son.tarih) - new Date(a.son.tarih));

            siralamaDizisi.forEach(veri => {
                sohbetSayisi++;
                let k = veri.kisi;
                let sonM = veri.son;
                let mesajOnizleme = sonM.icerik.length > 25 ? sonM.icerik.substring(0, 25) + '...' : sonM.icerik;
                let isYeni = okunmamisListesi.includes(k) && k !== aktifSohbetHedefi; 
                let yeniEtiketi = isYeni ? `<span style="background:#2ecc71; color:#111; font-size:10px; padding:2px 6px; border-radius:10px; font-weight:bold;">YENİ</span>` : '';

                listDiv.innerHTML += `
                    <div class="sohbet-liste-satir" onclick="sohbetiAc('${k}')">
                        <div style="display:flex; flex-direction:column; gap:5px;">
                            <strong style="color:#fff; font-size:14px;">${k}</strong>
                            <span style="color:#7f8c8d; font-size:12px;">${mesajOnizleme}</span>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
                            <span style="color:#52796f; font-size:10px;">${new Date(sonM.tarih).toLocaleDateString('tr-TR')}</span>
                            ${yeniEtiketi}
                        </div>
                    </div>
                `;
            });

            if(sohbetSayisi === 0) listDiv.innerHTML = '<p style="text-align:center; color:#777; font-size:12px; margin-top:50px;">Henüz hiç sohbetin yok.</p>';
        }

        if(aktifSohbetHedefi && document.getElementById('sohbetPenceresi').style.display !== 'none') {
            ekranaBalonlariCiz();
            if(okunmamisListesi.includes(aktifSohbetHedefi)) {
                firebase.firestore().collection("kullanicilar").doc(myUid).update({ okunmamisSohbetler: firebase.firestore.FieldValue.arrayRemove(aktifSohbetHedefi) }).catch(e=>{});
            }
        }

        const gercekOkunmamis = okunmamisListesi.filter(k => !engellenenKullanicilar.includes(k));
        const bildirim = document.getElementById('yeniMesajBildirim');
        if(bildirim) bildirim.style.display = gercekOkunmamis.length > 0 ? 'block' : 'none';
    });
}

window.aktifKisiyiEngelle = function() {
    if(!aktifSohbetHedefi) return;
    const onay = confirm(`⚠️ DİKKAT!\n${aktifSohbetHedefi} adlı oyuncuyu engellemek istediğinize emin misiniz?\nSohbet geçmişi silinecek ve size bir daha mesaj atamayacak.`);
    if(!onay) return;

    const myUid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;
    if(!myUid) return;
    
    if(!engellenenKullanicilar.includes(aktifSohbetHedefi)) engellenenKullanicilar.push(aktifSohbetHedefi);
    
    firebase.firestore().collection("kullanicilar").doc(myUid).update({
        engellenenler: engellenenKullanicilar,
        [`sohbetler.${aktifSohbetHedefi}`]: firebase.firestore.FieldValue.delete()
    }).then(() => {
        if(window.ozelUyariGoster) ozelUyariGoster(`🚫 ${aktifSohbetHedefi} engellendi!`);
        sohbetPenceresindenGeriDon(); 
    });
};

// Sistemi ayağa kaldırma beklemesi
setTimeout(() => { canliSohbetiBaslat(); }, 3000);

