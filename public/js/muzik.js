const sesStilleri = document.createElement('style');
sesStilleri.innerHTML = `
    #solButonGrubu {
        position: absolute !important; 
        top: 20px !important; 
        left: 20px !important; 
        display: flex !important; 
        flex-direction: column !important; 
        gap: 15px !important; 
        z-index: 99999 !important;
    }
    .masa-sol-btn, #sohbetAcBtn.masa-sol-btn {
        position: relative !important; 
        background: rgba(10, 15, 12, 0.85) !important; 
        backdrop-filter: blur(5px) !important;
        border: 2px solid #2ecc71 !important; 
        border-radius: 50% !important; 
        width: 45px !important; 
        height: 45px !important; 
        display: flex !important; 
        justify-content: center !important; 
        align-items: center !important;
        box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3) !important; 
        cursor: pointer !important; 
        color: #fff !important; 
        font-size: 20px !important; 
        padding: 0 !important; 
        margin: 0 !important;
        inset: auto !important; 
        transform: none !important;
    }
    .masa-sol-btn:active { transform: scale(0.9) !important; }
    .masa-sol-btn.sessiz { border-color: #e74c3c !important; box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3) !important; }
`;
document.head.appendChild(sesStilleri);

setTimeout(() => {
    const masaEkrani = document.getElementById('masaEkrani');
    if(masaEkrani) {
        let solGrup = document.getElementById('solButonGrubu');
        if(!solGrup) {
            solGrup = document.createElement('div');
            solGrup.id = 'solButonGrubu';
            masaEkrani.appendChild(solGrup);
        }
        
        // 1. Ses Butonu (En Üstte)
        if(!document.getElementById('btnOyunSesiToggle')) {
            solGrup.insertAdjacentHTML('beforeend', `<button id="btnOyunSesiToggle" class="masa-sol-btn" style="order:1;" title="Oyun Sesleri Aç/Kapat"><span id="sesToggleIkon">🔊</span></button>`);
        }

        // 2. Eski Sohbet Butonunu Yakala, Hortumla Sütuna Çek (Ortada)
        const genelSohbetBtn = document.getElementById('sohbetAcBtn');
        if(genelSohbetBtn) {
            genelSohbetBtn.className = 'masa-sol-btn'; 
            genelSohbetBtn.style.order = '2'; 
            solGrup.appendChild(genelSohbetBtn);
        }

        window.oyunSesiAcik = true; 
        const orijinalSesCal = window.sesCal;
        window.sesCal = function(sesObje) { 
            try { 
                if(!window.oyunSesiAcik) return; 
                let yeniSes = sesObje.cloneNode(); 
                yeniSes.volume = 0.5; 
                yeniSes.play().catch(e => console.log(e)); 
            } catch(err) {} 
        };

        const btnSesi = document.getElementById('btnOyunSesiToggle');
        if(btnSesi) {
            btnSesi.addEventListener('click', function() {
                window.oyunSesiAcik = !window.oyunSesiAcik;
                const ikon = document.getElementById('sesToggleIkon');
                if(window.oyunSesiAcik) { this.classList.remove('sessiz'); ikon.innerText = "🔊"; } 
                else { this.classList.add('sessiz'); ikon.innerText = "🔇"; }
            });
        }
    }
}, 1000);
