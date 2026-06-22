// --- BEYCO SERİ OKEY - İZLEYİCİ (YANCI) MODÜLÜ --- //

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
    
    /* Seyirci Modu Aktifken Oyuncu Kontrollerini Kökünden Gizle */
    body.seyirci-aktif #benimIstakam,
    body.seyirci-aktif .pro-tus-takimi,
    body.seyirci-aktif #bitisAlani,
    body.seyirci-aktif #oyunuBaslatBtn,
    body.seyirci-aktif #btnVipGizlilikTetikle,
    body.seyirci-aktif #iskartaYazi {
        display: none !important;
    }
    
    /* Seyirci ortadaki ıskartayı görsün ama tıklayamasın */
    body.seyirci-aktif #benimIskartam {
        pointer-events: none !important;
    }

    body.seyirci-aktif #seatBottomSeyirci {
        display: block !important;
    }
`;
document.head.appendChild(seyirciStil);

window.isSeyirci = false;

// Lobideki Masa Kartlarına Otomatik 'İzle' Butonu Ekleme Motoru
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
                izleBtn.className = 'btn-izle';
                izleBtn.innerHTML = '👁️ MASAYI İZLE';
                izleBtn.onclick = () => window.masayiIzle(masaAdi);
                sag.appendChild(izleBtn);
            }
        }
    });
}, 2000); 

window.masayiIzle = function(masaAdi) {
    if(typeof window.isMisafir !== 'undefined' && window.isMisafir) {
        if(window.ozelUyariGoster) window.ozelUyariGoster("⚠️ BEYCO misafirleri yancı olamaz! Markaya yakışmaz, kayıt ol patron.");
        return;
    }

    window.suAnkiMasam = masaAdi;
    window.isSeyirci = true;
    document.body.classList.add('seyirci-aktif');

    document.getElementById('lobiEkrani').style.display = 'none';
    document.getElementById('masaEkrani').style.display = 'flex';
    
    const yazi = document.getElementById('masaOrtasiYazi');
    if(yazi) yazi.innerHTML = masaAdi.toUpperCase() + '<br><span style="color:#9b59b6; font-size:12px;">(👁️ İZLEYİCİ)</span>';

    // 4. Koltuk (Aşağıdaki) için HTML elementi oluştur
    let seatB = document.getElementById('seatBottomSeyirci');
    if(!seatB) {
        seatB = document.createElement('div');
        seatB.id = 'seatBottomSeyirci';
        seatB.className = 'player-seat';
        seatB.style.cssText = 'bottom: 130px; left: 50%; transform: translateX(-50%); position: absolute; z-index:9; display:none; cursor:pointer;';
        seatB.onclick = function() { if(this.dataset.isim && this.dataset.isim !== "Boş") window.profiliGoster(this.dataset.isim); };
        const ui = document.querySelector('.okey-table-ui');
        if(ui) ui.appendChild(seatB);
    }

    // Masadaki oyuncuları çekip koltuklara yerleştir
    if(window.guncelMasalar && window.guncelMasalar[masaAdi]) {
        const koltuklar = window.guncelMasalar[masaAdi];
        const idList = ['seatBottomSeyirci', 'seatRight', 'seatTop', 'seatLeft'];
        
        idList.forEach((id, index) => {
            const el = document.getElementById(id);
            if(el) {
                const kisi = koltuklar[index];
                el.dataset.isim = kisi || "";
                el.innerText = kisi ? kisi : "Boş";
                el.style.color = kisi ? '#fff' : '#777';
            }
        });
    }
};

// Alt oyuncu taş attığında seyircinin ortadaki iskarta kutusunda görmesi için
if(typeof socket !== 'undefined') {
    socket.on('ortaya_tas_atildi', (data) => {
        if(window.isSeyirci && window.suAnkiMasam === data.masaAdi) {
            const seatB = document.getElementById('seatBottomSeyirci');
            if(seatB && data.kimAtti === seatB.dataset.isim) {
                const kutu = document.getElementById('benimIskartam');
                if(kutu) {
                    kutu.innerHTML = '';
                    const div = document.createElement('div');
                    div.className = 'okey-tasi tas-' + data.tas.renk;
                    div.innerText = data.tas.sayi;
                    div.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); pointer-events:none; margin:0;';
                    kutu.appendChild(div);
                }
            }
        }
    });
}

// Lobiye dönüşte seyirci kostümünü çıkar
document.addEventListener('click', (e) => {
    if(e.target && e.target.id === 'lobiyeDonBtn') {
        document.body.classList.remove('seyirci-aktif');
        window.isSeyirci = false;
    }
});
