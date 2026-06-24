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

// 🔥 BEYCO GAMES & REKLAM SİSTEMİ BRANDING 🔥
function markaVeReklamKurulumu() {
    setInterval(() => {
        document.querySelectorAll('*').forEach(el => {
            if(el.childNodes.length === 1 && el.textContent.includes('Sistem: VIP Oyuna Hoş Geldiniz!')) {
                el.innerHTML = '🟢 Sistem: Seri Okey Salonlarına Hoş Geldiniz - <b style="color:#f2c94c; margin-left:5px;">BEYCO GAMES</b>';
            }
        });
    }, 1000);
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

window.arkadasEkle = function(isim) {
    if(isMisafir) return;
    socket.emit('arkadaslik_istegi_gonder', { kimden: aktifKullaniciAdi, kime: isim });
    ozelUyariGoster(`⏳ ${isim} adlı oyuncuya arkadaşlık isteği gönderildi!`);
};

// 🔥 REKLAM / BEDAVA ÇİP FONKSİYONLARI 🔥
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
        document.getElementById('reklamEkrani').style.display = 'none'; benimAnlikCipim = Number(benimAnlikCipim) + 25000;
        document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
        if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim });
        socket.emit('magaza_harcamasi', { isim: aktifKullaniciAdi, yeniCip: benimAnlikCipim });
        ozelUyariGoster("📺 25.000 ÇİP hesabına yatırıldı!"); reklamIzlendi = false;
    }
};

const sesTasCek = new Audio('sounds/tas_cek.mp3');
const sesTasKoy = new Audio('sounds/tas_koy.mp3');
const sesSiraSende = new Audio('sounds/sira_sende.mp3');

sesTasCek.preload = 'auto'; sesTasKoy.preload = 'auto'; sesSiraSende.preload = 'auto';
function sesCal(sesObje) { if(window.oyunSesleriAktif === false) return; try { let yeniSes = sesObje.cloneNode(); yeniSes.volume = 0.5; yeniSes.play().catch(e => console.log(e)); } catch(err) {} }

const authEkrani = document.getElementById('authEkrani');
const lobiEkrani = document.getElementById('lobiEkrani');
const masaEkrani = document.getElementById('masaEkrani');
const vipHeader = document.querySelector('.vip-header');
const oyunuBaslatBtn = document.getElementById('oyunuBaslatBtn');
const oyunAlanObjeleri = document.getElementById('oyunAlanObjeleri');
const kalanTasBilgi = document.getElementById('kalanTasBilgi');
const bitisAlani = document.getElementById('bitisAlani');
const ustRaf = document.getElementById('ustRaf');
const altRaf = document.getElementById('altRaf');
const masaOrtasiYazi = document.getElementById('masaOrtasiYazi');
const masaKasaBilgisi = document.getElementById('masaKasaBilgisi');
const masalarAlani = document.getElementById('masalarAlani');
const sohbetCekmecesi = document.getElementById('sohbetCekmecesi');
const btnVipGizlilikTetikle = document.getElementById('btnVipGizlilikTetikle');

let gostergeBtn = document.createElement('button');
gostergeBtn.id = 'gostergeBtn'; gostergeBtn.innerText = '⭐ GÖSTERGE YAP'; gostergeBtn.className = 'gosterge-btn';
gostergeBtn.onclick = () => { socket.emit('gosterge_goster', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); gostergeBtn.style.display = 'none'; };

if(oyunAlanObjeleri && oyunAlanObjeleri.firstElementChild) {
    oyunAlanObjeleri.firstElementChild.appendChild(gostergeBtn);
}

window.ozelUyariGoster = function(mesaj) {
    document.getElementById('uyariModalMetni').innerText = mesaj;
    document.getElementById('uyariModalEkrani').style.display = 'flex';
};

function getLigRozeti(kazanilanOyunSayisi, misafirMi = false) {
    if (misafirMi) return { metin: "DENEME HESABI", renk: "#7f8c8d", yaziRenk: "#fff" };
    if (kazanilanOyunSayisi < 10) return { metin: "🥉 BRONZ LİG", renk: "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)", yaziRenk: "#fff" };
    if (kazanilanOyunSayisi < 50) return { metin: "🥈 GÜMÜŞ LİG", renk: "linear-gradient(180deg, #e0e0e0 0%, #9e9e9e 100%)", yaziRenk: "#000" };
    if (kazanilanOyunSayisi < 100) return { metin: "🥇 ALTIN LİG", renk: "linear-gradient(180deg, #f2d94c 0%, #d4af37 100%)", yaziRenk: "#000" };
    return { metin: "💎 ELMAS LİG", renk: "linear-gradient(180deg, #00d2ff 0%, #3a7bd5 100%)", yaziRenk: "#fff" };
}
window.seriDiz = function() { let taslar = []; for(let i=0; i<24; i++) { let yuva = document.getElementById('y'+i); if(yuva.children.length > 0) { let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); let renk = renkClass ? renkClass.replace('tas-', '') : ''; taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 }); } } const renkDeger = { 'kirmizi': 1, 'siyah': 2, 'mavi': 3, 'sari': 4, 'sahte': 5 }; taslar.sort((a, b) => { if (renkDeger[a.renk] !== renkDeger[b.renk]) return renkDeger[a.renk] - renkDeger[b.renk]; return a.sayi - b.sayi; }); taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); }); sesCal(sesTasCek); };
window.ciftDiz = function() { let taslar = []; for(let i=0; i<24; i++) { let yuva = document.getElementById('y'+i); if(yuva.children.length > 0) { let tas = yuva.children[0]; let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-')); let renk = renkClass ? renkClass.replace('tas-', '') : ''; taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 }); } } taslar.sort((a, b) => { if (a.sayi !== b.sayi) return a.sayi - b.sayi; return a.renk.localeCompare(b.renk); }); taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); }); sesCal(sesTasCek); };
function kurtarmaSinyaliGonder() { if (document.getElementById('oyunuBaslatBtn').style.display !== 'none' && suAnkiMasam && !izleyiciModu) { socket.emit('taslarimi_ver', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); } }
kalanTasBilgi.addEventListener('click', () => { if (benimSiramMi && elimdekiTasSayisi() === 14) { gostergeHakki = false; gostergeBtn.style.display = 'none'; socket.emit('ortadan_tas_cek', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); sesCal(sesTasCek); } else if(!benimSiramMi) ozelUyariGoster("Şu an sıra sizde değil!"); else ozelUyariGoster("Önce elinizdeki fazlalık taşı sağdaki oyuncuya atmalısınız!"); });
document.getElementById('iskartaSol').addEventListener('click', function() { if (benimSiramMi && elimdekiTasSayisi() === 14 && this.children.length > 0) { gostergeHakki = false; gostergeBtn.style.display = 'none'; const tasEl = this.lastElementChild; let renkSinifi = Array.from(tasEl.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; const tasObj = { id: tasEl.id, sayi: tasEl.innerText, renk: renk }; this.innerHTML = ''; for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { tasEkle(tasObj, 'y'+i); break; } } socket.emit('yandan_tas_alindi', { masaAdi: suAnkiMasam, kimAldi: aktifKullaniciAdi, tas: tasObj }); sesCal(sesTasCek); } else if(!benimSiramMi) ozelUyariGoster("Şu an sıra sizde değil!"); else if(elimdekiTasSayisi() === 15) ozelUyariGoster("Elinizde zaten 15 taş var!"); });
socket.on('ortaya_tas_atildi', (data) => { if(suAnkiMasam === data.masaAdi) { let target = null; if(data.kimAtti === document.getElementById('seatRight').dataset.isim) target = 'iskartaSag'; else if(data.kimAtti === document.getElementById('seatTop').dataset.isim) target = 'iskartaUst'; else if(data.kimAtti === document.getElementById('seatLeft').dataset.isim) target = 'iskartaSol'; else if(data.kimAtti === document.getElementById('benimAdimKutusu').dataset.isim && izleyiciModu) target = 'benimIskartam'; if(target) { const kutu = document.getElementById(target); kutu.innerHTML = ''; const div = document.createElement('div'); div.className = `okey-tasi tas-${data.tas.renk}`; div.innerText = data.tas.sayi; div.id = data.tas.id; div.style.position = 'absolute'; div.style.top = '50%'; div.style.left = '50%'; div.style.transform = 'translate(-50%, -50%)'; div.style.margin = '0'; div.style.pointerEvents = 'none'; if(target === 'iskartaSol') div.style.pointerEvents = 'auto'; kutu.appendChild(div); sesCal(sesTasKoy); } } });
socket.on('yandan_alindi_guncelle', (data) => { if(data.masaAdi === suAnkiMasam && data.kimAldi !== aktifKullaniciAdi) { let source = null; if(data.kimAldi === document.getElementById('seatRight').dataset.isim) source = 'benimIskartam'; else if(data.kimAldi === document.getElementById('seatTop').dataset.isim) source = 'iskartaSag'; else if(data.kimAldi === document.getElementById('seatLeft').dataset.isim) source = 'iskartaUst'; else if(data.kimAldi === document.getElementById('benimAdimKutusu').dataset.isim && izleyiciModu) source = 'iskartaSol'; if(source) { document.getElementById(source).innerHTML = ''; if(source === 'benimIskartam' && !izleyiciModu) document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; sesCal(sesTasCek); } } });

const sortableOptions = { group: { name: 'istaka', put: (to) => to.el.children.length === 0 }, animation: 100, delay: 0, forceFallback: true, fallbackOnBody: true, fallbackTolerance: 3, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag', easing: "cubic-bezier(0.25, 1, 0.5, 1)", onEnd: function() { sesCal(sesTasKoy); } };
for(let i=0; i<12; i++) { const yUst = document.createElement('div'); yUst.className = 'yuva'; yUst.id = 'y'+i; ustRaf.appendChild(yUst); new Sortable(yUst, sortableOptions); const yAlt = document.createElement('div'); yAlt.className = 'yuva'; yAlt.id = 'y'+(i+12); altRaf.appendChild(yAlt); new Sortable(yAlt, sortableOptions); }

// Normal Taş Atma
new Sortable(document.getElementById('benimIskartam'), { group: { name: 'istaka', put: function (to) { return benimSiramMi && elimdekiTasSayisi() === 15; }, pull: false }, animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, onAdd: function (evt) { gostergeHakki = false; gostergeBtn.style.display = 'none'; document.getElementById('iskartaYazi').style.display = 'none'; const atilanTas = evt.item; atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0'; let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText } }); sesCal(sesTasKoy); } });

// Bitiş Alanına Taş Atma (Hatada İade Eder)
new Sortable(bitisAlani, { group: { name: 'istaka', put: function (to) { return benimSiramMi && elimdekiTasSayisi() === 15; }, pull: false }, animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, onAdd: function (evt) { gostergeHakki = false; gostergeBtn.style.display = 'none'; const atilanTas = evt.item; atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0'; let gruplar = getIstakaGruplari(); let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; const bitisTasi = { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText }; 
// Sunucuya bitiş sinyali gönderdik
socket.emit('oyunu_bitir', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, gruplar: gruplar, bitisTasi: bitisTasi, tasHtmlId: atilanTas.id }); sesCal(sesTasKoy); } });

// Hatalı Bitiş İadesi!
socket.on('hatali_bitis', (data) => {
    ozelUyariGoster(data.mesaj); // Hatalı dizilim uyarısı
    // Taşı bitiş alanından kopar ve ıstakada boş bulduğun bir yere geri koy!
    const atilanTas = document.getElementById(data.tasId);
    if(atilanTas && atilanTas.parentNode === bitisAlani) {
        for(let i=0; i<24; i++) {
            let yuva = document.getElementById('y'+i);
            if(yuva.children.length === 0) {
                atilanTas.style.position = 'relative';
                atilanTas.style.top = 'auto';
                atilanTas.style.left = 'auto';
                atilanTas.style.transform = 'none';
                yuva.appendChild(atilanTas);
                break;
            }
        }
    }
});

function otomatikTasAt(tasElementi) { if (!benimSiramMi || elimdekiTasSayisi() !== 15) return; gostergeHakki = false; gostergeBtn.style.display = 'none'; const iskartaKutusu = document.getElementById('benimIskartam'); if (iskartaKutusu) { iskartaKutusu.appendChild(tasElementi); tasElementi.style.position = 'absolute'; tasElementi.style.top = '50%'; tasElementi.style.left = '50%'; tasElementi.style.transform = 'translate(-50%, -50%)'; tasElementi.style.margin = '0'; document.getElementById('iskartaYazi').style.display = 'none'; let renkSinifi = Array.from(tasElementi.classList).find(c=>c.startsWith('tas-')); let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah'; socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: tasElementi.id, renk: renk, sayi: tasElementi.innerText } }); sesCal(sesTasKoy); } }
