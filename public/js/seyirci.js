// --- BEYCO SERİ OKEY - İZLEYİCİ (YANCI) MODÜLÜ PRO V2 --- //

const seyirciStil = document.createElement('style');
seyirciStil.innerHTML = `
    .btn-izle {
        background: linear-gradient(135deg, #8e44ad, #9b59b6);
        color: #fff; border: 1px solid #8e44ad; padding: 6px 12px;
        border-radius: 8px; font-weight: bold; font-size: 11px; cursor: pointer;
        margin-top: 8px; width: 100%; box-shadow: 0 0 10px rgba(142, 68, 173, 0.4);
        transition: 0.2s;
    }
    .btn-izle:active { transform: scale(0.95); }
    
    body.seyirci-aktif #benimIstakam,
    body.seyirci-aktif .pro-tus-takimi,
    body.seyirci-aktif #bitisAlani,
    body.seyirci-aktif #oyunuBaslatBtn,
    body.seyirci-aktif #btnVipGizlilikTetikle,
    body.seyirci-aktif #gostergeBtn,
    body.seyirci-aktif #iskartaYazi {
        display: none !important;
    }
    
    body.seyirci-aktif #benimIskartam {
        pointer-events: none !important;
        background: rgba(0,0,0,0.3) !important;
        border: 1px dashed rgba(142, 68, 173, 0.5) !important;
    }

    body.seyirci-aktif #seatBottomSeyirci {
        display: block !important;
    }
`;
document.head.appendChild(seyirciStil);

window.isSeyirci = false;

setInterval(() => {
    const masalarAlani = document.getElementById('masalarAlani');
    if(!masalarAlani) return;
    const kartlar = masalarAlani.querySelectorAll('.masa-kart .kart-sag');
    kartlar.forEach(sag => {
        if(!sag.querySelector('.btn-izle')) {
            const isimDiv = sag.parentElement.querySelector('.masa-kart-isim');
            if(isimDiv) {
                const masaAdi = isimDiv.innerText;
                const izleBtn = document.createElement('button');
                izleBtn.className = 'btn-izle'; izleBtn.innerHTML = '👁️ MASAYI İZLE';
                izleBtn.onclick = () => window.masayiIzle(masaAdi);
                sag.appendChild(izleBtn);
            }
        }
    });
}, 2000); 

// İŞTE YENİ ZORBA FONKSİYON: Koltukları Zorla Doldurur
window.seyirciKoltuklariGuncelle = function(koltuklar) {
    if(!koltuklar || !window.isSeyirci) return;
    const idList = ['seatBottomSeyirci', 'seatRight', 'seatTop', 'seatLeft'];
    idList.forEach((id, index) => {
        const el = document.getElementById(id);
        if(el) {
            const kisi = koltuklar[index];
            el.dataset.isim = kisi || "";
            if(kisi) {
                let tac = (window.globalKozmetikler && window.globalKozmetikler[kisi] && window.globalKozmetikler[kisi].includes('neon_tac')) ? "👑 " : "";
                let renk = (window.globalKozmetikler && window.globalKozmetikler[kisi] && window.globalKozmetikler[kisi].includes('atesli_isim')) ? '#ff4d4d' : '#0dcaf0';
                el.innerText = tac + kisi;
                el.style.color = renk; el.style.textShadow = 'none';
            } else {
                el.innerText = "Boş"; el.style.color = '#777'; el.style.textShadow = 'none';
            }
        }
    });
}

window.masayiIzle = function(masaAdi) {
    if(typeof window.isMisafir !== 'undefined' && window.isMisafir) {
        if(window.ozelUyariGoster) window.ozelUyariGoster("⚠️ BEYCO misafirleri yancı olamaz! Kayıt ol patron."); return;
    }

    window.suAnkiMasam = masaAdi; window.isSeyirci = true;
    document.body.classList.add('seyirci-aktif');

    document.getElementById('lobiEkrani').style.display = 'none'; document.getElementById('masaEkrani').style.display = 'flex';
    
    const yazi = document.getElementById('masaOrtasiYazi');
    if(yazi) yazi.innerHTML = masaAdi.toUpperCase() + '<br><span style="color:#9b59b6; font-size:12px;">(👁️ İZLEYİCİ)</span>';

    let seatB = document.getElementById('seatBottomSeyirci');
    if(!seatB) {
        seatB = document.createElement('div'); seatB.id = 'seatBottomSeyirci'; seatB.className = 'player-seat';
        seatB.style.cssText = 'bottom: 130px; left: 50%; transform: translateX(-50%); position: absolute; z-index:9; display:none; cursor:pointer;';
        seatB.onclick = function() { if(this.dataset.isim && this.dataset.isim !== "Boş") window.profiliGoster(this.dataset.isim); };
        const ui = document.querySelector('.okey-table-ui'); if(ui) ui.appendChild(seatB);
    }

    if(window.guncelMasalar && window.guncelMasalar[masaAdi]) {
        window.seyirciKoltuklariGuncelle(window.guncelMasalar[masaAdi]);
    }

    if(typeof socket !== 'undefined') {
        const benimAdim = document.getElementById('benimAdimKutusu') ? document.getElementById('benimAdimKutusu').innerText.replace('✔', '').replace('👑', '').trim() : "Oyuncu";
        socket.emit('seyirci_girisi', { masaAdi: masaAdi, isim: benimAdim });
    }
};

if(typeof socket !== 'undefined') {
    // Lobideki değişimleri anında seyirci koltuklarına yansıt
    socket.on('masalari_guncelle', (lobidekiMasalar) => {
        if(window.isSeyirci && window.suAnkiMasam && lobidekiMasalar[window.suAnkiMasam]) {
            window.seyirciKoltuklariGuncelle(lobidekiMasalar[window.suAnkiMasam]);
        }
    });

    // Oyun başlayınca ana motorun sildiği koltukları saniyesinde geri getir
    socket.on('masa_oyun_basladi', (data) => {
        if(window.isSeyirci && window.suAnkiMasam === data.masaAdi) {
            setTimeout(() => { 
                window.seyirciKoltuklariGuncelle(data.koltuklar);
                document.getElementById('oyunAlanObjeleri').style.display = 'flex';
            }, 100);
        }
    });

    // Sıra dönünce izleyicide de yeşil ışık yansın
    socket.on('sira_guncelle', (data) => {
        if(window.isSeyirci && window.suAnkiMasam === data.masaAdi) {
            setTimeout(() => {
                const idList = ['seatBottomSeyirci', 'seatRight', 'seatTop', 'seatLeft'];
                idList.forEach(id => {
                    const el = document.getElementById(id);
                    if(el && el.dataset.isim === data.kimde) { el.classList.add('aktif-sira'); } 
                    else if(el) { el.classList.remove('aktif-sira'); }
                });
            }, 50);
        }
    });

    // Alttaki adam (izleyicinin kendi hizası) taş atarsa göstersin
    socket.on('ortaya_tas_atildi', (data) => {
        if(window.isSeyirci && window.suAnkiMasam === data.masaAdi) {
            const seatB = document.getElementById('seatBottomSeyirci');
            if(seatB && data.kimAtti === seatB.dataset.isim) {
                const kutu = document.getElementById('benimIskartam');
                if(kutu) {
                    kutu.innerHTML = '';
                    const div = document.createElement('div');
                    div.className = 'okey-tasi tas-' + data.tas.renk; div.innerText = data.tas.sayi;
                    div.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); pointer-events:none; margin:0;';
                    kutu.appendChild(div);
                }
            }
        }
    });
}

document.addEventListener('click', (e) => {
    if(e.target && e.target.id === 'lobiyeDonBtn') {
        document.body.classList.remove('seyirci-aktif');
        window.isSeyirci = false;
    }
});
