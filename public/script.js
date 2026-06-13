const socket = io();
const aktifKullaniciAdi = "Oyuncu_" + Math.floor(Math.random() * 900 + 100);
let suAnkiMasam = null; 
let benimSiramMi = false;
let guncelMasalar = {}; 

let gostergeHakki = false; 

document.getElementById('benimAdimKutusu').innerHTML = aktifKullaniciAdi + ' <span style="color:#2ecc71;">✔</span>';
document.getElementById('lobiBenimAdim').innerText = "👑 " + aktifKullaniciAdi;

socket.emit('kullanici_girisi', aktifKullaniciAdi);

socket.on('cip_guncelle', (cip) => { document.getElementById('benimCipim').innerText = cip.toLocaleString('tr-TR'); });
socket.on('cip_guncelle_ozel', (data) => { if(data.isim === aktifKullaniciAdi) document.getElementById('benimCipim').innerText = data.cip.toLocaleString('tr-TR'); });
socket.on('hata_mesaji', (mesaj) => { alert(mesaj); });

const lobiEkrani = document.getElementById('lobiEkrani');
const masaEkrani = document.getElementById('masaEkrani');
const masaOrtasiYazi = document.getElementById('masaOrtasiYazi');
const masaKasaBilgisi = document.getElementById('masaKasaBilgisi');
const masalarAlani = document.getElementById('masalarAlani');
const lobiyeDonBtn = document.getElementById('lobiyeDonBtn');
const oyunuBaslatBtn = document.getElementById('oyunuBaslatBtn');
const oyunAlanObjeleri = document.getElementById('oyunAlanObjeleri');
const kalanTasBilgi = document.getElementById('kalanTasBilgi');
const bitisAlani = document.getElementById('bitisAlani');
const ustRaf = document.getElementById('ustRaf');
const altRaf = document.getElementById('altRaf');

let gostergeBtn = document.createElement('button');
gostergeBtn.id = 'gostergeBtn';
gostergeBtn.innerText = '⭐ GÖSTERGE YAP';
gostergeBtn.className = 'gosterge-btn';
gostergeBtn.onclick = () => {
    socket.emit('gosterge_goster', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
    gostergeBtn.style.display = 'none';
};
document.getElementById('oyunAlanObjeleri').firstElementChild.appendChild(gostergeBtn);

// YENİ: Masayı Tamamen Sıfırlama ve Temizleme Fonksiyonu
function masayiTemizle() {
    const flash = document.getElementById('flashBildirim');
    if (flash) flash.classList.remove('goster'); // Asılı kalan gösterge afişini sil
    
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
    
    document.getElementById('seatTop').innerText = "Bekleniyor...";
    document.getElementById('seatLeft').innerText = "Bekleniyor...";
    document.getElementById('seatRight').innerText = "Bekleniyor...";
    
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
        if(i === 12 && currentGrup.length > 0) {
            gruplar.push(currentGrup);
            currentGrup = [];
        }
        let yuva = document.getElementById('y'+i);
        if(yuva.children.length > 0) {
            let tas = yuva.children[0];
            let renkClass = Array.from(tas.classList).find(c => c.startsWith('tas-'));
            let renk = renkClass ? renkClass.replace('tas-', '') : '';
            currentGrup.push({ id: tas.id, renk: renk, sayi: tas.innerText });
        } else {
            if(currentGrup.length > 0) {
                gruplar.push(currentGrup);
                currentGrup = [];
            }
        }
    }
    if(currentGrup.length > 0) gruplar.push(currentGrup);
    return gruplar;
}

const sortableOptions = {
    group: { name: 'istaka', put: (to) => to.el.children.length === 0 },
    animation: 100, delay: 0, forceFallback: true, fallbackOnBody: true, fallbackTolerance: 3, ghostClass: 'sortable-ghost', dragClass: 'sortable-drag', easing: "cubic-bezier(0.25, 1, 0.5, 1)"
};

for(let i=0; i<12; i++) {
    const yUst = document.createElement('div'); yUst.className = 'yuva'; yUst.id = 'y'+i; ustRaf.appendChild(yUst); new Sortable(yUst, sortableOptions);
    const yAlt = document.createElement('div'); yAlt.className = 'yuva'; yAlt.id = 'y'+(i+12); altRaf.appendChild(yAlt); new Sortable(yAlt, sortableOptions);
}

new Sortable(document.getElementById('benimIskartam'), {
    group: { name: 'istaka', put: function (to) { return benimSiramMi && elimdekiTasSayisi() === 15; }, pull: false },
    animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, 
    onAdd: function (evt) {
        gostergeHakki = false; 
        gostergeBtn.style.display = 'none'; 
        document.getElementById('iskartaYazi').style.display = 'none';
        const atilanTas = evt.item;
        atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0';
        
        let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-'));
        let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
        socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText } });
    }
});

new Sortable(bitisAlani, {
    group: { name: 'istaka', put: function (to) { return benimSiramMi && elimdekiTasSayisi() === 15; }, pull: false },
    animation: 150, forceFallback: true, fallbackOnBody: true, emptyInsertThreshold: 100, 
    onAdd: function (evt) {
        gostergeHakki = false; 
        gostergeBtn.style.display = 'none';
        const atilanTas = evt.item;
        atilanTas.style.position = 'absolute'; atilanTas.style.top = '50%'; atilanTas.style.left = '50%'; atilanTas.style.transform = 'translate(-50%, -50%)'; atilanTas.style.margin = '0';
        let gruplar = getIstakaGruplari(); 
        
        let renkSinifi = Array.from(atilanTas.classList).find(c=>c.startsWith('tas-'));
        let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
        const bitisTasi = { id: atilanTas.id, renk: renk, sayi: atilanTas.innerText };

        socket.emit('oyunu_bitir', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, gruplar: gruplar, bitisTasi: bitisTasi });
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
    gostergeHakki = false; 
    gostergeBtn.style.display = 'none'; 
    const iskartaKutusu = document.getElementById('benimIskartam');
    if (iskartaKutusu) {
        iskartaKutusu.appendChild(tasElementi);
        tasElementi.style.position = 'absolute'; tasElementi.style.top = '50%'; tasElementi.style.left = '50%'; tasElementi.style.transform = 'translate(-50%, -50%)'; tasElementi.style.margin = '0';
        document.getElementById('iskartaYazi').style.display = 'none';
        let renkSinifi = Array.from(tasElementi.classList).find(c=>c.startsWith('tas-'));
        let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
        socket.emit('tas_atildi', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, tas: { id: tasElementi.id, renk: renk, sayi: tasElementi.innerText } });
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
};

function kurtarmaSinyaliGonder() {
    if (document.getElementById('oyunuBaslatBtn').style.display !== 'none' && suAnkiMasam) {
        socket.emit('taslarimi_ver', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
    }
}

kalanTasBilgi.addEventListener('click', () => {
    if (benimSiramMi && elimdekiTasSayisi() === 14) {
        gostergeHakki = false; 
        gostergeBtn.style.display = 'none'; 
        socket.emit('ortadan_tas_cek', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi });
    }
    else if(!benimSiramMi) alert("Şu an sıra sizde değil!");
    else alert("Önce elinizdeki fazlalık taşı sağdaki oyuncuya atmalısınız!");
});

document.getElementById('iskartaSol').addEventListener('click', function() {
    if (benimSiramMi && elimdekiTasSayisi() === 14 && this.children.length > 0) {
        gostergeHakki = false; 
        gostergeBtn.style.display = 'none'; 
        const tasEl = this.lastElementChild;
        let renkSinifi = Array.from(tasEl.classList).find(c=>c.startsWith('tas-'));
        let renk = renkSinifi ? renkSinifi.split('-')[1] : 'siyah';
        const tasObj = { id: tasEl.id, sayi: tasEl.innerText, renk: renk };
        
        this.innerHTML = ''; 
        for(let i=0; i<24; i++) {
            if(document.getElementById('y'+i).children.length === 0) {
                tasEkle(tasObj, 'y'+i);
                break;
            }
        }
        socket.emit('yandan_tas_alindi', { masaAdi: suAnkiMasam, kimAldi: aktifKullaniciAdi, tas: tasObj });
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
                <div class="kart-sol">
                    <div class="zar-kutu">🎲</div>
                    <div class="masa-kart-isim">${masaAdi}</div>
                </div>
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

// YENİ: Masadan kalkarken her şeyi temizliyoruz
lobiyeDonBtn.addEventListener('click', () => {
    if(suAnkiMasam) socket.emit('masadan_kalk', { isim: aktifKullaniciAdi, masaAdi: suAnkiMasam });
    suAnkiMasam = null;
    masayiTemizle();
    masaEkrani.style.display = 'none';
    lobiEkrani.style.display = 'flex';
});

oyunuBaslatBtn.addEventListener('click', () => { socket.emit('oyunu_baslat', suAnkiMasam); });

document.querySelector('.btn-hemen-oyna').addEventListener('click', () => {
    if (suAnkiMasam) return; 
    
    let musaitMasa = null;
    for (const [masaAdi, koltuklar] of Object.entries(guncelMasalar)) {
        const doluSayisi = koltuklar.filter(k => k !== null).length;
        if (doluSayisi < 4) {
            musaitMasa = masaAdi;
            break;
        }
    }
    
    if (musaitMasa) {
        masayaOtur(musaitMasa);
    } else {
        alert("Şu an tüm masalar tam kapasite dolu, patron!");
    }
});

socket.on('masa_kasa_guncelle', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        masaKasaBilgisi.style.display = 'block';
        masaKasaBilgisi.innerText = 'KASA: ' + data.kasa.toLocaleString('tr-TR') + ' ÇİP';
    }
});

socket.on('masa_oyun_basladi', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        masayiTemizle(); // Önce eski kalıntıları temizle
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
        if(document.getElementById('y'+i).children.length === 0) {
            tasEkle(tas, 'y'+i);
            break;
        }
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
        benimSiramMi = (data.kimde === aktifKullaniciAdi);
        
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
