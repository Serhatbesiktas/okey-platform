const socket = io();
let aktifKullaniciAdi = ""; 
let suAnkiMasam = null; 
let benimSiramMi = false;
let guncelMasalar = {}; 
let gostergeHakki = false; 

// YENİ: Oyuncunun sahip olduğu lüks eşyalar
let benimEnvanterim = [];

const sesTasCek = new Audio('sounds/tas_cek.mp3');
const sesTasKoy = new Audio('sounds/tas_koy.mp3');
const sesSiraSende = new Audio('sounds/sira_sende.mp3');

sesTasCek.preload = 'auto';
sesTasKoy.preload = 'auto';
sesSiraSende.preload = 'auto';

function sesCal(sesObje) {
    try {
        let yeniSes = sesObje.cloneNode(); 
        yeniSes.volume = 0.5; 
        yeniSes.play().catch(e => console.log("Ses aktif değil:", e));
    } catch(err) {}
}

const firebaseConfig = {
  apiKey: "AIzaSyDZ2VhlFEtpT4kpvJn0TbCwbot8QB3MJGg",
  authDomain: "okeyoyunu-41321.firebaseapp.com",
  projectId: "okeyoyunu-41321",
  storageBucket: "okeyoyunu-41321.firebasestorage.app",
  messagingSenderId: "472848132493",
  appId: "1:472848132493:web:d104317f6398b5a3adf5c4"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const authEkrani = document.getElementById('authEkrani');
const lobiEkrani = document.getElementById('lobiEkrani');
const masaEkrani = document.getElementById('masaEkrani');
const vipHeader = document.querySelector('.vip-header');

lobiEkrani.style.display = 'none';
masaEkrani.style.display = 'none';
vipHeader.style.display = 'none';

document.getElementById('btnKayit').addEventListener('click', () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authSifre').value;
    
    if(!email || !pass) { alert("Lütfen e-posta ve şifre girin patron!"); return; }
    if(pass.length < 6) { alert("Şifre en az 6 haneli olmalı!"); return; }
    
    auth.createUserWithEmailAndPassword(email, pass).then((userCredential) => {
        const kullaniciAdi = email.split('@')[0].toUpperCase();
        db.collection("kullanicilar").doc(userCredential.user.uid).set({
            isim: kullaniciAdi,
            cip: 250000,
            envanter: [] // YENİ: Başlangıçta boş envanter
        }).then(() => { 
            benimEnvanterim = [];
            oyunaGirisYap(kullaniciAdi, 250000); 
            kozmetikleriUygula(benimEnvanterim);
        }).catch(dbError => { alert("Veritabanı kayıt hatası."); });
    }).catch(error => { alert("Sistem Hatası: " + error.message); });
});

document.getElementById('btnGiris').addEventListener('click', () => {
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authSifre').value;
    
    if(!email || !pass) { alert("Lütfen e-posta ve şifre girin!"); return; }

    auth.signInWithEmailAndPassword(email, pass).then((userCredential) => {
        const kullaniciAdi = email.split('@')[0].toUpperCase();
        db.collection("kullanicilar").doc(userCredential.user.uid).get().then(doc => {
            let mevcutCip = 250000;
            if(doc.exists) {
                mevcutCip = doc.data().cip;
                benimEnvanterim = doc.data().envanter || []; // YENİ: Veritabanından çantayı çek
            }
            oyunaGirisYap(kullaniciAdi, mevcutCip);
            kozmetikleriUygula(benimEnvanterim); // Eşyaları üstüne giy
        }).catch(dbError => { alert("Veritabanı okunamadı."); });
    }).catch(error => { alert("Giriş Başarısız."); });
});

function oyunaGirisYap(isim, cip) {
    aktifKullaniciAdi = isim;
    document.getElementById('benimAdimKutusu').innerHTML = aktifKullaniciAdi + ' <span style="color:#2ecc71;">✔</span>';
    document.getElementById('lobiBenimAdim').innerText = "👑 " + aktifKullaniciAdi;
    document.getElementById('benimCipim').innerText = cip.toLocaleString('tr-TR');

    authEkrani.style.display = 'none';
    vipHeader.style.display = 'flex';
    lobiEkrani.style.display = 'flex';

    socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: cip });
}

// YENİ: MAĞAZA SATIN ALMA SİSTEMİ
window.esyaSatinAl = function(esyaId, fiyat) {
    if(benimEnvanterim.includes(esyaId)) {
        alert("Buna zaten sahipsin patron!"); return;
    }
    
    const guncelCip = parseInt(document.getElementById('benimCipim').innerText.replace(/\./g, ''));
    if(guncelCip < fiyat) {
        alert("Bunun için yeterli çipin yok!"); return;
    }
    
    const yeniCip = guncelCip - fiyat;
    benimEnvanterim.push(esyaId);
    
    if(auth.currentUser) {
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({ 
            cip: yeniCip,
            envanter: benimEnvanterim
        }).then(() => {
            socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: yeniCip });
            document.getElementById('benimCipim').innerText = yeniCip.toLocaleString('tr-TR');
            kozmetikleriUygula(benimEnvanterim);
            alert("✅ Satın alma başarılı! VIP eşyan hemen kuşanıldı.");
        });
    }
}

// YENİ: SATIN ALINANLARI GÖRÜNÜME YANSITMA
function kozmetikleriUygula(envanter) {
    const avatar = document.getElementById('vipAvatar');
    const isimKutu = document.getElementById('benimAdimKutusu');
    const lobiIsim = document.getElementById('lobiBenimAdim');

    if(envanter.includes('altin_cerceve')) {
        avatar.style.border = '3px solid #f2c94c';
        avatar.style.boxShadow = '0 0 15px #f2c94c';
    }
    if(envanter.includes('atesli_isim')) {
        isimKutu.style.color = '#ff4d4d';
        isimKutu.style.textShadow = '0 0 8px #ff0000';
        lobiIsim.style.color = '#ff4d4d';
    }
    if(envanter.includes('neon_tac')) {
        if(!lobiIsim.innerText.includes('👑')) {
            lobiIsim.innerText = '👑 ' + lobiIsim.innerText.replace('👑 ', '');
        }
    }
    
    // Mağazadaki butonları "SAHİPSİN" olarak değiştir
    envanter.forEach(esya => {
        const btn = document.getElementById('btn_' + esya);
        if(btn) { btn.innerText = 'SAHİPSİN'; btn.classList.add('sahip'); }
    });
}

socket.on('cip_guncelle', (cip) => { document.getElementById('benimCipim').innerText = cip.toLocaleString('tr-TR'); });
socket.on('cip_guncelle_ozel', (data) => { 
    if(data.isim === aktifKullaniciAdi) {
        document.getElementById('benimCipim').innerText = data.cip.toLocaleString('tr-TR'); 
        if(auth.currentUser) {
            db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: data.cip });
        }
    }
});

socket.on('hata_mesaji', (mesaj) => { alert(mesaj); });

const lobiyeDonBtn = document.getElementById('lobiyeDonBtn');
const oyunuBaslatBtn = document.getElementById('oyunuBaslatBtn');
const oyunAlanObjeleri = document.getElementById('oyunAlanObjeleri');
const kalanTasBilgi = document.getElementById('kalanTasBilgi');
const bitisAlani = document.getElementById('bitisAlani');
const ustRaf = document.getElementById('ustRaf');
const altRaf = document.getElementById('altRaf');
const masaOrtasiYazi = document.getElementById('masaOrtasiYazi');
const masaKasaBilgisi = document.getElementById('masaKasaBilgisi');
const masalarAlani = document.getElementById('masalarAlani');

let gostergeBtn = document.createElement('button');
gostergeBtn.id = 'gostergeBtn';
gostergeBtn.innerText = '⭐ GÖSTERGE YAP';
gostergeBtn.className = 'gosterge-btn';
gostergeBtn.onclick = () => {
    socket.emit('gosterge_goster', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
    gostergeBtn.style.display = 'none';
};
document.getElementById('oyunAlanObjeleri').firstElementChild.appendChild(gostergeBtn);

function masayiTemizle() {
    const flash = document.getElementById('flashBildirim');
    if (flash) flash.classList.remove('goster'); 
    
    document.getElementById('sonucEkrani').style.display = 'none';
    oyunAlanObjeleri.style.display = 'none';
    gostergeBtn.style.display = 'none';
    gostergeHakki = false; 
    
    oyunuBaslatBtn.innerText = "🎲 OYUNU BAŞLAT";
    oyunuBaslatBtn.style.display = 'block';
    
    bitisAlani.style.display = 'none';
    masaKasaBilgisi.style.display = 'none'; 
    bitisAlani.innerHTML = 'BİTİR<br>🏆'; 
    
    for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = '';
    document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>';
    document.getElementById('iskartaSag').innerHTML = '';
    document.getElementById('iskartaSol').innerHTML = '';
    document.getElementById('iskartaUst').innerHTML = '';
    
    document.getElementById('benimAdimKutusu').classList.remove('aktif-sira');
    document.getElementById('seatRight').classList.remove('aktif-sira');
    document.getElementById('seatTop').classList.remove('aktif-sira');
    document.getElementById('seatLeft').classList.remove('aktif-sira');

    benimSiramMi = false;
}

socket.on('gosterge_basarili', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        if (data.isim === aktifKullaniciAdi) {
            gostergeHakki = false;
            gostergeBtn.style.display = 'none';
        }
        sesCal(sesSiraSende);
        const flash = document.getElementById('flashBildirim');
        if (flash) {
            flash.innerHTML = `🌟 ${data.isim} GÖSTERGE YAPTI!<br><span style="font-size:22px; color:#c0392b;">+${data.odul.toLocaleString()} ÇİP</span>`;
            flash.classList.remove('goster');
            void flash.offsetWidth; 
            flash.classList.add('goster');
        }
    }
});

function checkGosterge() {
    gostergeBtn.style.display = 'none';
    if(!gostergeHakki || !benimSiramMi) return; 
    
    let gostergeDiv = document.getElementById('gostergeTasi');
    if(gostergeDiv.innerText) {
        let gSayi = gostergeDiv.innerText;
        let renkClass = Array.from(gostergeDiv.classList).find(c => c.startsWith('tas-'));
        if(!renkClass) return;
        let gRenk = renkClass.replace('tas-', '');
        
        let varMi = false;
        for(let i=0; i<24; i++) {
            let yuva = document.getElementById('y'+i);
            if(yuva.children.length > 0) {
                let t = yuva.children[0];
                let tRenkClass = Array.from(t.classList).find(c => c.startsWith('tas-'));
                if(tRenkClass) {
                    let tRenk = tRenkClass.replace('tas-', '');
                    if(tRenk === gRenk && t.innerText === gSayi) varMi = true;
                }
            }
        }
        if(varMi) gostergeBtn.style.display = 'block';
    }
}

function elimdekiTasSayisi() {
    let sayi = 0;
    for(let i=0; i<24; i++) {
        if(document.getElementById('y'+i).children.length > 0) sayi++;
    }
    return sayi;
}

function getIstakaGruplari() {
    let gruplar = [];
    let currentGrup = [];
    for(let i=0; i<24; i++) {
        if(i === 12 && currentGrup.length > 0) { gruplar.push(currentGrup); currentGrup = []; }
        let yuva = document.getElementById('y'+i);
        if(yuva.children.length > 0) {
            let tas = yuva.children[0];
            let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-'));
            let renk = renkClass ? renkClass.replace('tas-', '') : '';
            currentGrup.push({ id: tas.id, renk: renk, sayi: tas.innerText });
        } else {
            if(currentGrup.length > 0) { gruplar.push(currentGrup); currentGrup = []; }
        }
    }
    if(currentGrup.length > 0) gruplar.push(currentGrup);
    return gruplar;
}

const sortableOptions = {
    group: { name: 'istaka', put: (to) => to.el.children.length === 0 },
    animation: 100, delay: 0, forceFallback: true, fallbackOnBody: true, fallbackTolerance: 3, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag', easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    onEnd: function() { sesCal(sesTasKoy); }
};

for(let i=0; i<12; i++) {
    const yUst = document.createElement('div'); yUst.className = 'yuva'; yUst.id = 'y'+i; ustRaf.appendChild(yUst); new Sortable(yUst, sortableOptions);
    const yAlt = document.createElement('div'); yAlt.className = 'yuva'; yAlt.id = 'y'+(i+12); altRaf.appendChild(yAlt); new Sortable(yAlt, sortableOptions);
}

new Sortable(document.getElementById('benimIskartam'), {
    group: { name: 'istaka', put: function (to) { return benimSiramMi && elimdekiTasSayisi() === 15; }, pull: false },
    animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, 
    onAdd: function (evt) {
        gostergeHakki = false; gostergeBtn.style.display = 'none'; document.getElementById('iskartaYazi').style.display = 'none';
        const atilanTas = evt.item;
        atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0';
        let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-'));
        let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
        socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText } });
        sesCal(sesTasKoy);
    }
});

new Sortable(bitisAlani, {
    group: { name: 'istaka', put: function (to) { return benimSiramMi && elimdekiTasSayisi() === 15; }, pull: false },
    animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, 
    onAdd: function (evt) {
        gostergeHakki = false; gostergeBtn.style.display = 'none';
        const atilanTas = evt.item;
        atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0';
        let gruplar = getIstakaGruplari(); 
        let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-'));
        let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
        const bitisTasi = { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText };
        socket.emit('oyunu_bitir', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, gruplar: gruplar, bitisTasi: bitisTasi });
        sesCal(sesTasKoy);
    }
});

socket.on('hatali_bitis', (mesaj) => {
    const tas = bitisAlani.querySelector('.okey-tasi');
    if (tas) {
        for(let i=0; i<24; i++) {
            if(document.getElementById('y'+i).children.length === 0) {
                document.getElementById('y'+i).appendChild(tas);
                tas.style.position = ''; tas.style.top = ''; tas.style.left = ''; tas.style.transform = ''; tas.style.margin = '';
                break;
            }
        }
    }
    setTimeout(() => { alert(mesaj); }, 100);
});

function otomatikTasAt(tasElementi) {
    if (!benimSiramMi || elimdekiTasSayisi() !== 15) return; 
    gostergeHakki = false; gostergeBtn.style.display = 'none'; 
    const iskartaKutusu = document.getElementById('benimIskartam');
    if (iskartaKutusu) {
        iskartaKutusu.appendChild(tasElementi);
        tasElementi.style.position = 'absolute'; tasElementi.style.top = '50%'; tasElementi.style.left = '50%'; tasElementi.style.transform = 'translate(-50%, -50%)'; tasElementi.style.margin = '0';
        document.getElementById('iskartaYazi').style.display = 'none';
        let renkSinifi = Array.from(tasElementi.classList).find(c=>c.startsWith('tas-'));
        let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
        socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: tasElementi.id, renk: renk, sayi: tasElementi.innerText } });
        sesCal(sesTasKoy);
    }
}

window.seriDiz = function() {
    let taslar = [];
    for(let i=0; i<24; i++) {
        let yuva = document.getElementById('y'+i);
        if(yuva.children.length > 0) {
            let tas = yuva.children[0];
            let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-'));
            let renk = renkClass ? renkClass.replace('tas-', '') : '';
            taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 });
        }
    }
    const renkDeger = { 'kirmizi': 1, 'siyah': 2, 'mavi': 3, 'sari': 4, 'sahte': 5 };
    taslar.sort((a, b) => { if (renkDeger[a.renk] !== renkDeger[b.renk]) return renkDeger[a.renk] - renkDeger[b.renk]; return a.sayi - b.sayi; });
    taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); });
    sesCal(sesTasCek);
};

window.ciftDiz = function() {
    let taslar = [];
    for(let i=0; i<24; i++) {
        let yuva = document.getElementById('y'+i);
        if(yuva.children.length > 0) {
            let tas = yuva.children[0];
            let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-'));
            let renk = renkClass ? renkClass.replace('tas-', '') : '';
            taslar.push({ el: tas, renk: renk, sayi: parseInt(tas.innerText) || 0 });
        }
    }
    taslar.sort((a, b) => { if (a.sayi !== b.sayi) return a.sayi - b.sayi; return a.renk.localeCompare(b.renk); });
    taslar.forEach((tasObj, index) => { document.getElementById('y'+index).appendChild(tasObj.el); });
    sesCal(sesTasCek);
};

function kurtarmaSinyaliGonder() {
    if (document.getElementById('oyunuBaslatBtn').style.display !== 'none' && suAnkiMasam) {
        socket.emit('taslarimi_ver', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
    }
}

kalanTasBilgi.addEventListener('click', () => {
    if (benimSiramMi && elimdekiTasSayisi() === 14) {
        gostergeHakki = false; gostergeBtn.style.display = 'none'; 
        socket.emit('ortadan_tas_cek', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
        sesCal(sesTasCek);
    } else if(!benimSiramMi) alert("Şu an sıra sizde değil!");
    else alert("Önce elinizdeki fazlalık taşı sağdaki oyuncuya atmalısınız!");
});

document.getElementById('iskartaSol').addEventListener('click', function() {
    if (benimSiramMi && elimdekiTasSayisi() === 14 && this.children.length > 0) {
        gostergeHakki = false; gostergeBtn.style.display = 'none'; 
        const tasEl = this.lastElementChild;
        let renkSinifi = Array.from(tasEl.classList).find(c=>c.startsWith('tas-'));
        let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
        const tasObj = { id: tasEl.id, sayi: tasEl.innerText, renk: renk };
        
        this.innerHTML = ''; 
        for(let i=0; i<24; i++) {
            if(document.getElementById('y'+i).children.length === 0) { tasEkle(tasObj, 'y'+i); break; }
        }
        socket.emit('yandan_tas_alindi', { masaAdi: suAnkiMasam, kimAldi: aktifKullaniciAdi, tas: tasObj });
        sesCal(sesTasCek);
    } else if(!benimSiramMi) alert("Şu an sıra sizde değil!");
    else if(elimdekiTasSayisi() === 15) alert("Elinizde zaten 15 taş var!");
});

socket.on('ortaya_tas_atildi', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        let target = null;
        if(data.kimAtti === document.getElementById('seatRight').innerText) target = 'iskartaSag';
        else if(data.kimAtti === document.getElementById('seatTop').innerText) target = 'iskartaUst';
        else if(data.kimAtti === document.getElementById('seatLeft').innerText) target = 'iskartaSol';

        if(target) {
            const kutu = document.getElementById(target);
            kutu.innerHTML = ''; 
            const div = document.createElement('div');
            div.className = `okey-tasi tas-${data.tas.renk}`; div.innerText = data.tas.sayi; div.id = data.tas.id;
            div.style.position = 'absolute'; div.style.top = '50%'; div.style.left = '50%'; div.style.transform = 'translate(-50%, -50%)'; div.style.margin = '0'; div.style.pointerEvents = 'none'; 
            if(target === 'iskartaSol') div.style.pointerEvents = 'auto'; 
            kutu.appendChild(div);
            sesCal(sesTasKoy);
        }
    }
});

socket.on('yandan_alindi_guncelle', (data) => {
    if(data.masaAdi === suAnkiMasam && data.kimAldi !== aktifKullaniciAdi) {
        let source = null;
        if(data.kimAldi === document.getElementById('seatRight').innerText) source = 'benimIskartam';
        else if(data.kimAldi === document.getElementById('seatTop').innerText) source = 'iskartaSag';
        else if(data.kimAldi === document.getElementById('seatLeft').innerText) source = 'iskartaUst';

        if(source) {
            document.getElementById(source).innerHTML = '';
            if(source === 'benimIskartam') document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>';
            sesCal(sesTasCek);
        }
    }
});

socket.on('oyun_bitti', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        const sonucEkrani = document.getElementById('sonucEkrani');
        const baslik = document.getElementById('sonucBaslik');
        const metin = document.getElementById('sonucMetin');
        const odul = document.getElementById('sonucOdul');
        
        if (data.kazanan) {
            if (data.kazanan === aktifKullaniciAdi) {
                baslik.innerText = data.okeyleBittiMi ? "🔥 OKEYLE BİTİRDİN! 🔥" : "🏆 TEBRİKLER, KAZANDIN! 🏆";
                baslik.style.color = data.okeyleBittiMi ? "#ff3333" : "#f2c94c";
            } else {
                baslik.innerText = data.okeyleBittiMi ? "🚨 RAKİP OKEY ATTI! 🚨" : "🎉 OYUN BİTTİ 🎉";
                baslik.style.color = data.okeyleBittiMi ? "#ff3333" : "#f2c94c";
            }
            metin.innerText = `Kazanan: ${data.kazanan}\nSebep: ${data.sebep}`;
            odul.innerText = `+${data.odul.toLocaleString('tr-TR')} ÇİP`;
            sesCal(sesSiraSende); 
        } else {
            baslik.innerText = "🛑 OYUN BİTTİ 🛑";
            baslik.style.color = "#dc3545";
            metin.innerText = data.sebep || "Masadaki herkes ayrıldı.";
            odul.innerText = "";
        }
        
        sonucEkrani.style.display = 'flex'; 
        const flash = document.getElementById('flashBildirim');
        if (flash) flash.classList.remove('goster');

        oyunAlanObjeleri.style.display = 'none';
        gostergeBtn.style.display = 'none';
        gostergeHakki = false; 
        
        oyunuBaslatBtn.innerText = "🔄 AYNI MASADA TEKRAR OYNA";
        oyunuBaslatBtn.style.display = 'block';
        
        bitisAlani.style.display = 'none';
        masaKasaBilgisi.style.display = 'none'; 
        bitisAlani.innerHTML = 'BİTİR<br>🏆'; 
        for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = '';
        document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>';
        document.getElementById('iskartaSag').innerHTML = '';
        document.getElementById('iskartaSol').innerHTML = '';
        document.getElementById('iskartaUst').innerHTML = '';
        benimSiramMi = false;
    }
});

socket.on('masalari_guncelle', (lobidekiMasalar) => {
    guncelMasalar = lobidekiMasalar; 
    masalarAlani.innerHTML = ''; 
    for (const [masaAdi, koltuklar] of Object.entries(lobidekiMasalar)) {
        const doluKoltukSayisi = koltuklar.filter(k => k !== null).length;
        const benBuMasadaMiyim = koltuklar.includes(aktifKullaniciAdi);
        const html = `
            <div class="masa-kart">
                <div class="masa-watermark"></div>
                <div class="kart-sol"><div class="zar-kutu">🎲</div><div class="masa-kart-isim">${masaAdi}</div></div>
                <div class="kart-sag">
                    <div class="masa-kisi-kutu">🎲 ${doluKoltukSayisi}/4</div>
                    <button class="btn-otur ${benBuMasadaMiyim || doluKoltukSayisi>=4 ? 'disabled':''}" 
                        style="${benBuMasadaMiyim ? 'background:#2ecc71;color:#111;':''}" 
                        onclick="masayaOtur('${masaAdi}')">
                        ${benBuMasadaMiyim ? 'OTURDUN ✓' : (doluKoltukSayisi>=4 ? 'DOLU' : 'OTUR')}
                    </button>
                </div>
            </div>`;
        masalarAlani.innerHTML += html;
        if(benBuMasadaMiyim) gelişmişKoltukHizala(koltuklar);
    }
});

function gelişmişKoltukHizala(koltuklar) {
    const index = koltuklar.indexOf(aktifKullaniciAdi);
    if (index === -1) return;
    document.getElementById('seatRight').innerText = koltuklar[(index + 1) % 4] || "Bekleniyor...";
    document.getElementById('seatTop').innerText = koltuklar[(index + 2) % 4] || "Bekleniyor...";
    document.getElementById('seatLeft').innerText = koltuklar[(index + 3) % 4] || "Bekleniyor...";
}

window.masayaOtur = function(masaAdi) {
    suAnkiMasam = masaAdi;
    socket.emit('masaya_otur', { isim: aktifKullaniciAdi, masaAdi: masaAdi });
    lobiEkrani.style.display = 'none';
    masaEkrani.style.display = 'flex';
    masaOrtasiYazi.innerText = masaAdi.toUpperCase();
};

lobiyeDonBtn.addEventListener('click', () => {
    if(suAnkiMasam) socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam });
    suAnkiMasam = null;
    masayiTemizle();
    
    document.getElementById('seatTop').innerText = "Bekleniyor...";
    document.getElementById('seatLeft').innerText = "Bekleniyor...";
    document.getElementById('seatRight').innerText = "Bekleniyor...";
    
    masaEkrani.style.display = 'none';
    lobiEkrani.style.display = 'flex';
});

oyunuBaslatBtn.addEventListener('click', () => { socket.emit('oyunu_baslat', suAnkiMasam); });

document.querySelector('.btn-hemen-oyna').addEventListener('click', () => {
    if (suAnkiMasam) return; 
    let musaitMasa = null;
    for (const [masaAdi, koltuklar] of Object.entries(guncelMasalar)) {
        if (koltuklar.filter(k => k !== null).length < 4) { musaitMasa = masaAdi; break; }
    }
    if (musaitMasa) masayaOtur(musaitMasa);
    else alert("Şu an tüm masalar tam kapasite dolu, patron!");
});

socket.on('masa_kasa_guncelle', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        masaKasaBilgisi.style.display = 'block';
        masaKasaBilgisi.innerText = 'KASA: ' + data.kasa.toLocaleString('tr-TR') + ' ÇİP';
    }
});

socket.on('masa_oyun_basladi', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        masayiTemizle(); 
        oyunuBaslatBtn.style.display = 'none';
        oyunAlanObjeleri.style.display = 'flex';
        bitisAlani.style.display = 'flex';
        gostergeHakki = true; 
        
        kalanTasBilgi.innerText = data.kalanTas;
        if(data.gosterge) {
            const gostergeDiv = document.getElementById('gostergeTasi');
            gostergeDiv.innerText = data.gosterge.sayi;
            gostergeDiv.className = `gosterge-tasi tas-${data.gosterge.renk}`;
        }
        if(data.kasa) {
            masaKasaBilgisi.style.display = 'block';
            masaKasaBilgisi.innerText = 'KASA: ' + data.kasa.toLocaleString('tr-TR') + ' ÇİP';
        }
        if (guncelMasalar[data.masaAdi]) gelişmişKoltukHizala(guncelMasalar[data.masaAdi]);
    }
});

socket.on('taslari_al', (data) => {
    if (data.kime === aktifKullaniciAdi) {
        for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = '';
        data.taslar.forEach((tas, index) => { tasEkle(tas, 'y'+index); });
        setTimeout(checkGosterge, 500);
    }
});

socket.on('tas_cekildi', (tas) => {
    for(let i=0; i<24; i++) {
        if(document.getElementById('y'+i).children.length === 0) { tasEkle(tas, 'y'+i); break; }
    }
});

function tasEkle(tasData, yuvaId) {
    const div = document.createElement('div');
    div.className = `okey-tasi tas-${tasData.renk}`; div.innerText = tasData.sayi; div.id = tasData.id; 
    let sonDokunma = 0; let surukleniyorMu = false;
    div.addEventListener('touchstart', () => { surukleniyorMu = false; }, {passive: true});
    div.addEventListener('touchmove', () => { surukleniyorMu = true; }, {passive: true});
    div.addEventListener('touchend', function(e) {
        if(surukleniyorMu) return; 
        const simdi = new Date().getTime();
        if (simdi - sonDokunma < 300) { e.preventDefault(); otomatikTasAt(this); }
        sonDokunma = simdi;
    });
    div.addEventListener('dblclick', function() { otomatikTasAt(this); });
    document.getElementById(yuvaId).appendChild(div);
}

socket.on('sira_guncelle', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        kurtarmaSinyaliGonder(); 
        const eskiSira = benimSiramMi; 
        benimSiramMi = (data.kimde === aktifKullaniciAdi);
        
        if(benimSiramMi && !eskiSira) sesCal(sesSiraSende);
        
        const iskarta = document.getElementById('benimIskartam');
        if(benimSiramMi) iskarta.classList.remove('kilitli-iskarta');
        else iskarta.classList.add('kilitli-iskarta');

        const koltuklar = [
            { id: 'benimAdimKutusu', isim: "Ben: " + aktifKullaniciAdi, gercekIsim: aktifKullaniciAdi },
            { id: 'seatRight', isim: document.getElementById('seatRight').innerText },
            { id: 'seatTop', isim: document.getElementById('seatTop').innerText },
            { id: 'seatLeft', isim: document.getElementById('seatLeft').innerText }
        ];
        
        koltuklar.forEach(k => {
            const el = document.getElementById(k.id);
            if(k.isim === data.kimde || k.gercekIsim === data.kimde) el.classList.add('aktif-sira');
            else el.classList.remove('aktif-sira');
        });
        checkGosterge(); 
    }
});

socket.on('masa_ortasi_guncelle', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        kurtarmaSinyaliGonder(); 
        kalanTasBilgi.innerText = data.kalanTas;
        if(data.gosterge) {
            const gostergeDiv = document.getElementById('gostergeTasi');
            gostergeDiv.innerText = data.gosterge.sayi;
            gostergeDiv.className = `gosterge-tasi tas-${data.gosterge.renk}`;
        }
    }
});

const sohbetCekmecesi = document.getElementById('sohbetCekmecesi');

document.getElementById('sohbetAcBtn')?.addEventListener('click', () => {
    sohbetCekmecesi.classList.add('acik');
});

document.getElementById('sohbetKapatBtn')?.addEventListener('click', () => {
    sohbetCekmecesi.classList.remove('acik');
});

document.getElementById('sohbetGonderBtn')?.addEventListener('click', () => {
    const input = document.getElementById('sohbetInput');
    if(input.value.trim() !== '' && suAnkiMasam) {
        socket.emit('sohbet_mesaji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, mesaj: input.value });
        input.value = '';
    }
});

window.vipEmojiGonder = function(emoji) {
    if(suAnkiMasam) {
        socket.emit('vip_emoji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, emoji: emoji });
        sohbetCekmecesi.classList.remove('acik'); 
    }
}

socket.on('yeni_sohbet_mesaji', (data) => {
    if(data.masaAdi === suAnkiMasam) {
        const div = document.createElement('div');
        div.className = 'pro-mesaj';
        div.innerHTML = `<span class="pro-mesaj-isim">${data.isim}</span>${data.mesaj}`;
        const mesajAlani = document.getElementById('sohbetMesajlari');
        if(mesajAlani) {
            mesajAlani.appendChild(div);
            mesajAlani.scrollTop = mesajAlani.scrollHeight;
        }
        
        const anlikDiv = document.createElement('div');
        anlikDiv.className = 'anlik-mesaj';
        anlikDiv.innerHTML = `<strong style="color:#f2c94c">${data.isim}:</strong> ${data.mesaj}`;
        document.getElementById('anlikMesajAlani')?.appendChild(anlikDiv);
        
        setTimeout(() => { anlikDiv.remove(); }, 4000);
    }
});

socket.on('yeni_vip_emoji', (data) => {
    if(data.masaAdi === suAnkiMasam) {
        const div = document.createElement('div');
        div.className = 'ucan-emoji';
        div.innerText = data.emoji;
        document.getElementById('masaEkrani').appendChild(div);
        setTimeout(() => { div.remove(); }, 2500);
    }
});

socket.on('admin_flash_mesaj', (mesaj) => {
    const flash = document.getElementById('flashBildirim');
    if (flash) {
        flash.innerHTML = `👑 PATRON DUYURUSU 👑<br><span style="font-size:18px; color:#fff; text-transform:none; margin-top:5px; display:block;">${mesaj}</span>`;
        flash.style.background = "linear-gradient(135deg, #c0392b, #8e44ad)";
        flash.style.boxShadow = "0 15px 40px rgba(0,0,0,0.85), 0 0 25px rgba(192, 57, 43, 0.8)";
        flash.style.borderColor = "#f2c94c";
        flash.classList.remove('goster');
        void flash.offsetWidth; 
        flash.classList.add('goster');
        setTimeout(() => { flash.style.background = ""; flash.style.boxShadow = ""; flash.style.borderColor = ""; }, 3500);
    }
});

socket.on('admin_islem_uyarisi', (data) => {
    if(data.isim === aktifKullaniciAdi) {
        if(data.islem === 'kick') {
            alert("🚨 YÖNETİCİ TARAFINDAN MASADAN ATILDINIZ!");
            if(suAnkiMasam) {
                suAnkiMasam = null;
                masayiTemizle();
                document.getElementById('masaEkrani').style.display = 'none';
                document.getElementById('lobiEkrani').style.display = 'flex';
            }
        } else if(data.islem === 'ban') {
            alert("🛑 HESABINIZ SİSTEMDEN SINIRSIZ BANLANDI!");
            location.reload(); 
        }
    }
});
