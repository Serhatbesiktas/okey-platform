const socket = io();
let aktifKullaniciAdi = ""; 
let suAnkiMasam = null; 
let benimSiramMi = false;
let guncelMasalar = {}; 
let gostergeHakki = false; 
let izleyiciModu = false; 

let benimAnlikCipim = 0; 
let benimKazanilanOyun = 0; 
let benimEnvanterim = []; 
let aktifKozmetikler = []; 
let sonBonusTarihim = ""; 
let isMisafir = false; 
let globalKozmetikler = {}; 

let benimArkadaslarim = []; 
let onlineOyuncularListesi = []; 
let masaOyunBasladiMi = false; 
let cikisIcinBekleyenLogout = false; 

let suAnkiMasaVIPMi = false;
let suAnkiMasaSahibi = "";
let suAnkiMasaGizliMi = false;

let benimGorevler = { kazanma: 0, mesaj: 0, gosterge: 0, tarih: "", alinanlar: {} };

// 🔥 BEYCO GAMES & REKLAM SİSTEMİ BRANDING
function markaVeReklamKurulumu() {
    const authBaslik = document.getElementById('authBaslik');
    if(authBaslik) authBaslik.innerText = "SERİ OKEY";
    const authKutu = document.querySelector('.auth-kutu');
    if(authKutu && !document.querySelector('.beyco-imza')) {
        const imza = document.createElement('div');
        imza.className = 'beyco-imza';
        imza.innerHTML = 'MADE BY <span>BEYCO GAMES</span>';
        authKutu.appendChild(imza);
    }

    setInterval(() => {
        document.querySelectorAll('*').forEach(el => {
            if(el.childNodes.length === 1 && el.textContent.includes('Sistem: VIP Oyuna Hoş Geldiniz!')) {
                el.innerHTML = '🟢 Sistem: Seri Okey Salonlarına Hoş Geldiniz - <b style="color:#f2c94c;">BEYCO GAMES</b>';
            }
        });
    }, 1000);

    if(!document.getElementById('reklamEkrani')) {
        const reklamHTML = `
        <div id="reklamEkrani" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 999999; display: none; flex-direction: column; justify-content: center; align-items: center; color: white;">
            <div class="reklam-kutu" style="text-align: center; max-width: 400px; padding: 25px; border: 2px solid #2ecc71; border-radius: 15px; background: linear-gradient(135deg, #112618, #06120b); box-shadow: 0 10px 40px rgba(46, 204, 113, 0.3);">
                <h2 style="color:#2ecc71; margin-bottom:5px;">Sponsorlu İçerik</h2>
                <p style="color:#aaa; font-size:13px; line-height:1.5;">Videoyu sonuna kadar izle patron!</p>
                <div class="reklam-sayac" id="reklamSayac" style="font-size: 45px; color: #f2c94c; font-weight: 900; margin: 15px 0; text-shadow: 0 0 15px rgba(242, 201, 76, 0.5);">15</div>
                <div style="width:100%; height:200px; background:#0a0a0a; border:1px solid #2ecc71; border-radius:10px; display:flex; justify-content:center; align-items:center; color:#555; margin-top:15px; font-size:11px; text-transform:uppercase;">[Beyco Games Ad Network]</div>
                <button class="btn-reklam-kapat" id="btnReklamKapat" style="background: #333; color: #888; padding: 12px 20px; border-radius: 8px; border: none; font-weight: 900; display: none; cursor: pointer; margin-top: 20px; width: 100%; transition: 0.3s;" onclick="reklamOduluAl()">🎁 25.000 ÇİPİ AL</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', reklamHTML);
    }

    const altMenu = document.querySelector('.alt-menu-container');
    if(altMenu && !document.getElementById('reklamMenusu')) {
        const btn = document.createElement('div'); btn.className = 'alt-menu-item'; btn.id = 'reklamMenusu';
        btn.innerHTML = '<div class="alt-menu-ikon">📺</div><span>Bedava Çip</span>';
        btn.onclick = () => reklamIzleAksiyon(); altMenu.appendChild(btn);
    }
}
window.addEventListener('DOMContentLoaded', markaVeReklamKurulumu);
setTimeout(markaVeReklamKurulumu, 1000);

// 🔥 CANLI HANDSHAKE ARKADAŞLIK DINLEYICILERI 🔥
socket.on('canli_arkadaslik_talebi', (data) => {
    if (data.kime === aktifKullaniciAdi) {
        const reqDiv = document.createElement('div');
        reqDiv.id = "canliIstekKutusu";
        reqDiv.style = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #112618, #06120b); border:2px solid #f2c94c; padding:15px 25px; border-radius:12px; z-index:999999; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.8); width: 90%; max-width: 350px;";
        reqDiv.innerHTML = `
            <div style='color:#fff; font-weight:bold; margin-bottom:15px; font-size:14px;'>👥 <span style="color:#f2c94c">${data.kimden}</span> sana arkadaşlık isteği gönderdi!</div>
            <div style='display:flex; gap:10px; justify-content:center;'>
                <button style='background:#2ecc71; border:none; padding:8px 20px; border-radius:6px; color:#111; font-weight:bold; cursor:pointer; flex:1;' id='btnAcceptReq'>Kabul Et</button>
                <button style='background:#e74c3c; border:none; padding:8px 20px; border-radius:6px; color:#fff; font-weight:bold; cursor:pointer; flex:1;' id='btnRejectReq'>Reddet</button>
            </div>`;
        document.body.appendChild(reqDiv);

        reqDiv.querySelector('#btnAcceptReq').onclick = () => {
            if(!benimArkadaslarim.includes(data.kimden)) {
                benimArkadaslarim.push(data.kimden);
                if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim });
            }
            socket.emit('arkadaslik_cevabi_ver', { kimden: aktifKullaniciAdi, kime: data.kimden, durum: 'kabul' });
            reqDiv.remove(); ozelUyariGoster(`🎉 ${data.kimden} ile artık arkadaşsınız!`); arayuzGuncelle();
        };
        reqDiv.querySelector('#btnRejectReq').onclick = () => { reqDiv.remove(); };
    }
});

socket.on('canli_arkadaslik_onay', (data) => {
    if(!benimArkadaslarim.includes(data.kimden)) {
        benimArkadaslarim.push(data.kimden);
        if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim });
        ozelUyariGoster(`🎉 ${data.kimden} isteğini kabul etti, artık arkadaşsınız!`); arayuzGuncelle();
    }
});

socket.on('canli_arkadaslik_sonuc', (data) => {
    if(data.kime === aktifKullaniciAdi && data.durum === 'kabul') {
        if(!benimArkadaslarim.includes(data.kimden)) {
            benimArkadaslarim.push(data.kimden);
            if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim });
            ozelUyariGoster(`🎉 ${data.kimden} isteğini kabul etti!`); arayuzGuncelle();
        }
    }
});

// 🔥 ARKADAŞ EKLEME (İSTEK GÖNDERME) FONKSİYONU 🔥
window.arkadasEkle = function(isim) {
    if(isMisafir) return;
    socket.emit('arkadaslik_istegi_gonder', { kimden: aktifKullaniciAdi, kime: isim });
    ozelUyariGoster(`⏳ ${isim} adlı oyuncuya arkadaşlık isteği gönderildi!`);
};

let reklamIzlendi = false; let reklamSayiciInt = null;
window.reklamIzleAksiyon = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar reklam izleyemez."); return; }
    document.getElementById('reklamEkrani').style.display = 'flex'; document.getElementById('btnReklamKapat').style.display = 'none';
    let saniye = 15; document.getElementById('reklamSayac').innerText = saniye;
    clearInterval(reklamSayiciInt);
    reklamSayiciInt = setInterval(() => {
        saniye--; document.getElementById('reklamSayac').innerText = saniye;
        if(saniye <= 0) { clearInterval(reklamSayiciInt); document.getElementById('btnReklamKapat').style.display = 'block'; reklamIzlendi = true; }
    }, 1000);
};

window.reklamOduluAl = function() {
    if(reklamIzlendi) {
        document.getElementById('reklamEkrani').style.display = 'none'; benimAnlikCipim += 25000;
        document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
        if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim });
        socket.emit('magaza_harcamasi', { isim: aktifKullaniciAdi, yeniCip: benimAnlikCipim });
        ozelUyariGoster("📺 25.000 ÇİP hesabına yatırıldı!"); reklamIzlendi = false;
    }
};

const sesTasCek = new Audio('sounds/tas_cek.mp3'); const sesTasKoy = new Audio('sounds/tas_koy.mp3'); const sesSiraSende = new Audio('sounds/sira_sende.mp3');
sesTasCek.preload = 'auto'; sesTasKoy.preload = 'auto'; sesSiraSende.preload = 'auto';

function sesCal(sesObje) { if(window.oyunSesleriAktif === false) return; try { let yeniSes = sesObje.cloneNode(); yeniSes.volume = 0.5; yeniSes.play().catch(e => console.log(e)); } catch(err) {} }

const authEkrani = document.getElementById('authEkrani'); const lobiEkrani = document.getElementById('lobiEkrani'); const masaEkrani = document.getElementById('masaEkrani'); const vipHeader = document.querySelector('.vip-header'); const oyunuBaslatBtn = document.getElementById('oyunuBaslatBtn'); const oyunAlanObjeleri = document.getElementById('oyunAlanObjeleri'); const kalanTasBilgi = document.getElementById('kalanTasBilgi'); const bitisAlani = document.getElementById('bitisAlani'); const ustRaf = document.getElementById('ustRaf'); const altRaf = document.getElementById('altRaf'); const masaOrtasiYazi = document.getElementById('masaOrtasiYazi'); const masaKasaBilgisi = document.getElementById('masaKasaBilgisi'); const masalarAlani = document.getElementById('masalarAlani'); const sohbetCekmecesi = document.getElementById('sohbetCekmecesi'); const btnVipGizlilikTetikle = document.getElementById('btnVipGizlilikTetikle');

let gostergeBtn = document.createElement('button'); gostergeBtn.id = 'gostergeBtn'; gostergeBtn.innerText = '⭐ GÖSTERGE YAP'; gostergeBtn.className = 'gosterge-btn';
gostergeBtn.onclick = () => { socket.emit('gosterge_goster', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); gostergeBtn.style.display = 'none'; };
if(oyunAlanObjeleri && oyunAlanObjeleri.firstElementChild) oyunAlanObjeleri.firstElementChild.appendChild(gostergeBtn);

const firebaseConfig = { apiKey: "AIzaSyDZ2VhlFEtpT4kpvJn0TbCwbot8QB3MJGg", authDomain: "okeyoyunu-41321.firebaseapp.com", projectId: "okeyoyunu-41321", storageBucket: "okeyoyunu-41321.firebasestorage.app", messagingSenderId: "472848132493", appId: "1:472848132493:web:d104317f6398b5a3adf5c4" };
firebase.initializeApp(firebaseConfig); const auth = firebase.auth(); const db = firebase.firestore();

auth.onAuthStateChanged((user) => {
    if (user && !aktifKullaniciAdi) {
        db.collection("kullanicilar").doc(user.uid).get().then(doc => {
            if(doc.exists && doc.data().isim) {
                aktifKullaniciAdi = doc.data().isim; benimAnlikCipim = doc.data().cip || 0; benimEnvanterim = doc.data().envanter || []; aktifKozmetikler = doc.data().aktifKozmetikler || []; benimArkadaslarim = doc.data().arkadaslar || []; benimKazanilanOyun = doc.data().kazanilanOyun || 0;
            }
            isMisafir = false; oyunaGirisYap(aktifKullaniciAdi); arayuzGuncelle(); gunlukBonusKontrol();
        });
    }
});

document.getElementById('btnGiris').addEventListener('click', () => {
    const email = document.getElementById('authEmail').value.trim(); const pass = document.getElementById('authSifre').value;
    auth.signInWithEmailAndPassword(email, pass).catch(error => ozelUyariGoster("Giriş Başarısız."));
});

window.davetMenusuAc = function() {
    if(isMisafir) return; const ekran = document.getElementById('arkadaslarEkrani'); const listeDiv = document.getElementById('arkadasListesiDiv');
    ekran.style.display = 'flex'; listeDiv.innerHTML = '';
    onlineOyuncularListesi.forEach(oyuncu => {
        if(oyuncu === aktifKullaniciAdi || oyuncu.startsWith('Bot_') || oyuncu.startsWith('MisafirBot_')) return;
        listeDiv.innerHTML += `<div class="lider-satir" style="display:flex; justify-content:space-between; padding:10px;"><div style="color:#fff;">${oyuncu}</div><button class="btn-davet-et" onclick="masayaDavetEt('${oyuncu}')">Davet Et</button></div>`;
    });
};

window.profiliGoster = function(hedefIsim) {
    if(!hedefIsim || hedefIsim === "" || hedefIsim === "Bekleniyor...") { if(suAnkiMasam && !izleyiciModu) davetMenusuAc(); return; }
    const pIsim = document.getElementById('profilIsim'); const pOynanan = document.getElementById('profilOynanan'); const pKazanilan = document.getElementById('profilKazanilan'); const pCip = document.getElementById('profilCip'); const kazanmaOrani = document.getElementById('profilKazanmaOrani'); const pDurum = document.getElementById('profilDurumBadge'); const pArkadasBtn = document.getElementById('profilArkadasBtn'); const pDavetBtn = document.getElementById('profilDavetBtn'); const pLigBadge = document.getElementById('profilLigBadge');
    document.getElementById('profilEkrani').style.display = 'flex'; pArkadasBtn.dataset.hedef = hedefIsim;
    
    let isOnline = onlineOyuncularListesi.includes(hedefIsim); pDurum.innerText = isOnline ? "🟢 Çevrimiçi" : "🔴 Çevrimdışı";
    pArkadasBtn.style.display = (hedefIsim !== aktifKullaniciAdi) ? 'block' : 'none';
    
    pArkadasBtn.innerText = benimArkadaslarim.includes(hedefIsim) ? "❌ Arkadaştan Çıkar" : "➕ Arkadaş Ekle";
    
    // 🔥 PROFİL EKRANI ARKADAŞ EKLEME/SİLME ONAYI 🔥
    pArkadasBtn.onclick = () => { 
        if(benimArkadaslarim.includes(hedefIsim)) { 
            if(confirm(`${hedefIsim} adlı kişiyi arkadaş listenden çıkarmak istediğine emin misin?`)) {
                benimArkadaslarim = benimArkadaslarim.filter(n=>n!==hedefIsim); 
                pArkadasBtn.innerText = "➕ Arkadaş Ekle"; 
                ozelUyariGoster(`❌ ${hedefIsim} arkadaş listenden çıkarıldı.`);
                if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }); 
                arayuzGuncelle();
            }
        } else { 
            arkadasEkle(hedefIsim); 
            document.getElementById('profilEkrani').style.display='none'; 
        } 
    };

    let hash = 0; for (let i = 0; i < hedefIsim.length; i++) hash = hedefIsim.charCodeAt(i) + ((hash << 5) - hash); hash = Math.abs(hash);
    let bOynanan = (hash % 1150) + 75; let bOran = (hash % 25) + 38; let bKazanilan = Math.floor(bOynanan * (bOran / 100));
    pIsim.innerText = hedefIsim; pOynanan.innerText = bOynanan; pKazanilan.innerHTML = `<span style="color:#2ecc71">${bKazanilan}</span> / <span style="color:#e74c3c">${bOynanan-bKazanilan}</span>`; kazanmaOrani.innerText = "%" + bOran; pCip.innerText = ((hash % 14500000) + 1200000).toLocaleString() + " ÇİP";
    let bLigAyar = getLigRozeti(bKazanilan, false); pLigBadge.innerText = bLigAyar.metin; pLigBadge.style.background = bLigAyar.renk;
};

function masadanAyrilmaIslemi(cezaUygulansinMi = false) {
    if (suAnkiMasam) { socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); }
    suAnkiMasam = null; izleyiciModu = false; masayiTemizle();
    document.querySelector('.istaka-container').style.display = 'flex'; document.querySelector('.okey-istaka-tuslar-area').style.display = 'flex';
    masaEkrani.style.display = 'none'; lobiEkrani.style.display = 'flex'; arayuzGuncelle();
}

window.tamamenCikisYap = function() { auth.signOut().then(() => window.location.reload()).catch(() => window.location.reload()); };
document.getElementById('btnCikisYap').addEventListener('click', () => { if (suAnkiMasam) socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam }); tamamenCikisYap(); });
const lobiyeDonBtn = document.getElementById('lobiyeDonBtn'); lobiyeDonBtn.addEventListener('click', () => masadanAyrilmaIslemi(false));

document.getElementById('btnMisafir').addEventListener('click', () => { isMisafir = true; aktifKullaniciAdi = "MİSAFİR_" + (Math.floor(Math.random() * 9000) + 1000); benimAnlikCipim = 20000; oyunaGirisYap(aktifKullaniciAdi); arayuzGuncelle(); });
function oyunaGirisYap(isim) { document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); authEkrani.style.display = 'none'; vipHeader.style.display = 'flex'; lobiEkrani.style.display = 'flex'; socket.emit('kullanici_girisi', { isim: isim, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); }

window.arkadaslarMenusuAc = function() {
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; const div = document.getElementById('arkadasListesiDiv'); div.innerHTML = '';
    if(benimArkadaslarim.length === 0) { div.innerHTML = '<p style="color:#777;text-align:center;">Henüz arkadaş yok.</p>'; return; }
    benimArkadaslarim.forEach(a => { div.innerHTML += `<div class="lider-satir" onclick="profiliGoster('${a}')"><div class="lider-isim">👤 ${a}</div></div>`; });
};

window.liderlikTablosunuAc = function() { document.getElementById('liderlikEkrani').style.display = 'flex'; socket.emit('liderlik_tablosu_iste'); };
socket.on('liderlik_tablosu_guncelle', (list) => {
    const div = document.getElementById('liderlikListesi'); div.innerHTML = '';
    list.forEach((o, i) => { div.innerHTML += `<div class="lider-satir" onclick="profiliGoster('${o.isim}')"><div class="lider-sira">${i+1}.</div><div class="lider-isim">${o.isim}</div><div class="lider-cip">${Number(o.cip).toLocaleString()} ÇİP</div></div>`; });
});

socket.on('online_oyuncular', (liste) => {
    onlineOyuncularListesi = liste; const lobiDiv = document.getElementById('lobidekilerListesi'); if(!lobiDiv) return; lobiDiv.innerHTML = '';
    liste.forEach(o => { if(o !== aktifKullaniciAdi) lobiDiv.innerHTML += `<div class="lobi-oyuncu-satir"><span class="lobi-oyuncu-isim" onclick="profiliGoster('${o}')">🟢 ${o}</span><button class="btn-arkadas-ekle" onclick="arkadasEkle('${o}')">+ Ekle</button></div>`; });
});

window.masayaDavetEt = function(n) { socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: n, masaAdi: suAnkiMasam }); document.getElementById('arkadaslarEkrani').style.display = 'none'; };
window.masayiIzle = function(m) { socket.emit('masayi_izle', { isim: aktifKullaniciAdi, masaAdi: m }); };

socket.on('izleyici_olarak_katildin', (data) => {
    masayiTemizle(); suAnkiMasam = data.masaAdi; izleyiciModu = true; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex';
    document.getElementById('masaOrtasiYazi').innerHTML = data.masaAdi.toUpperCase() + " (👁️ İZLEYİCİ)<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>";
    document.querySelector('.istaka-container').style.display = 'none'; document.querySelector('.okey-istaka-tuslar-area').style.display = 'none'; oyunuBaslatBtn.style.display = 'none';
    if(data.oyunBasladi) { masaOyunBasladiMi = true; oyunAlanObjeleri.style.display = 'flex'; kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; } }
    gelişmişKoltukHizala(data.koltuklar);
});

socket.on('sen_masadasin', (data) => { masayiTemizle(); suAnkiMasam = data.masaAdi || data; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; document.getElementById('masaOrtasiYazi').innerHTML = suAnkiMasam.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>"; socket.emit('masaya_geri_don', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); });
socket.on('masalari_guncelle', (lobidekiMasalar) => {
    guncelMasalar = lobidekiMasalar; if(!masalarAlani) return; masalarAlani.innerHTML = '';
    Object.entries(lobidekiMasalar).forEach(([masaAdi, koltuklar]) => {
        const dolu = koltuklar.filter(k => k !== null).length; const benVarim = koltuklar.includes(aktifKullaniciAdi);
        const action = benVarim ? `masayaGeriDon('${masaAdi}')` : `masayaOtur('${masaAdi}')`; const txt = benVarim ? 'OTURDUN ✓' : (dolu>=4 ? 'DOLU' : 'OTUR');
        let izleBtn = !benVarim ? `<button class="btn-izle" onclick="masayiIzle('${masaAdi}')">👁️ İZLE</button>` : '';
        masalarAlani.innerHTML += `<div class="masa-kart"><div class="kart-sol">🎲 ${masaAdi}</div><div class="kart-sag"><div style="display:flex; gap:8px;">${izleBtn}<button class="btn-otur" onclick="${action}">${txt}</button></div></div></div>`;
        if(benVarim) gelişmişKoltukHizala(koltuklar);
    });
});

window.masayaOtur = function(m) { suAnkiMasam = m; socket.emit('masaya_otur', { isim: aktifKullaniciAdi, masaAdi: m }); };
window.masayaGeriDon = function(m) { suAnkiMasam = m; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; socket.emit('masaya_geri_don', { masaAdi: m, isim: aktifKullaniciAdi }); };

socket.on('masa_oyun_basladi', (data) => { if(suAnkiMasam === data.masaAdi) { masayiTemizle(); masaOyunBasladiMi = true; oyunuBaslatBtn.style.display = 'none'; oyunAlanObjeleri.style.display = 'flex'; bitisAlani.style.display = 'flex'; kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; } gelişmişKoltukHizala(data.koltuklar); } });
socket.on('taslari_al', (data) => { if (data.kime === aktifKullaniciAdi && !izleyiciModu) { data.taslar.forEach((t, i) => tasEkle(t, 'y'+i)); } });
socket.on('tas_cekildi', (t) => { if(!izleyiciModu) { for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { tasEkle(t, 'y'+i); break; } } } });

function tasEkle(tasData, yuvaId) { const div = document.createElement('div'); div.className = `okey-tasi tas-${tasData.renk}`; div.innerText = tasData.sayi; div.id = tasData.id; div.ondblclick = function() { otomatikTasAt(this); }; document.getElementById(yuvaId).appendChild(div); }

socket.on('sira_guncelle', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        benimSiramMi = (!izleyiciModu && data.kimde === aktifKullaniciAdi); if(benimSiramMi) sesCal(sesSiraSende);
        let bName = izleyiciModu ? document.getElementById('benimAdimKutusu').dataset.isim : aktifKullaniciAdi;
        const koltuklar = [ { id: 'benimAdimKutusu', isim: bName }, { id: 'seatRight', isim: document.getElementById('seatRight').dataset.isim }, { id: 'seatTop', isim: document.getElementById('seatTop').dataset.isim }, { id: 'seatLeft', isim: document.getElementById('seatLeft').dataset.isim } ];
        koltuklar.forEach(k => { const el = document.getElementById(k.id); if(el) { if(k.isim === data.kimde && k.isim !== "") el.classList.add('aktif-sira'); else el.classList.remove('aktif-sira'); } });
    }
});

function gelişmişKoltukHizala(koltuklar) {
    let idx = koltuklar.indexOf(aktifKullaniciAdi); if(idx === -1) idx = 0;
    document.getElementById('benimAdimKutusu').innerText = koltuklar[idx] || "Boş";
    document.getElementById('seatRight').dataset.isim = koltuklar[(idx+1)%4] || ""; document.getElementById('seatRight').innerText = koltuklar[(idx+1)%4] || "➕ DAVET";
    document.getElementById('seatTop').dataset.isim = koltuklar[(idx+2)%4] || ""; document.getElementById('seatTop').innerText = koltuklar[(idx+2)%4] || "➕ DAVET";
    document.getElementById('seatLeft').dataset.isim = koltuklar[(idx+3)%4] || ""; document.getElementById('seatLeft').innerText = koltuklar[(idx+3)%4] || "➕ DAVET";
}

function masayiTemizle() { masaOyunBasladiMi = false; oyunuBaslatBtn.style.display = 'block'; oyunAlanObjeleri.style.display = 'none'; for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; }
window.seriDiz = function() { ozelUyariGoster("Taşlar dizildi!"); }; window.ciftDiz = function() { ozelUyariGoster("Çift dizildi!"); };
function kurtarmaSinyaliGonder() {} function checkGosterge() {} function elimdekiTasSayisi() { return 14; } function getIstakaGruplari() { return []; } function otomatikTasAt(e){}
