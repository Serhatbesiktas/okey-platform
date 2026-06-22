const sesStilleri = document.createElement('style');
sesStilleri.innerHTML = `
    .masa-sol-btn {
        background: rgba(10, 15, 12, 0.85); backdrop-filter: blur(5px);
        border: 2px solid #2ecc71; border-radius: 50%; 
        width: 45px; height: 45px; display: flex; justify-content: center; align-items: center;
        box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3); cursor: pointer; transition: 0.3s;
        color: #fff; font-size: 20px; padding: 0; margin: 0;
    }
    .masa-sol-btn:active { transform: scale(0.9); }
    .masa-sol-btn.sessiz { border-color: #e74c3c; box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3); }
`;
document.head.appendChild(sesStilleri);

setTimeout(() => {
    const masaEkrani = document.getElementById('masaEkrani');
    if(masaEkrani) {
        let solGrup = document.getElementById('solButonGrubu');
        if(!solGrup) {
            solGrup = document.createElement('div');
            solGrup.id = 'solButonGrubu';
            solGrup.style.cssText = 'position:absolute; top:20px; left:20px; display:flex; flex-direction:column; gap:12px; z-index:99999;';
            masaEkrani.appendChild(solGrup);
            
            const genelSohbetBtn = document.getElementById('sohbetAcBtn');
            if(genelSohbetBtn) {
                genelSohbetBtn.style.position = 'static';
                genelSohbetBtn.className = 'masa-sol-btn'; 
                genelSohbetBtn.style.order = '2'; 
                solGrup.appendChild(genelSohbetBtn);
            }
        }

        const sesKontrolHtml = `<button id="btnOyunSesiToggle" class="masa-sol-btn" style="order:1;" title="Oyun Sesleri Aç/Kapat"><span id="sesToggleIkon">🔊</span></button>`;
        solGrup.insertAdjacentHTML('beforeend', sesKontrolHtml);

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

        document.getElementById('btnOyunSesiToggle').addEventListener('click', function() {
            window.oyunSesiAcik = !window.oyunSesiAcik;
            const btn = document.getElementById('btnOyunSesiToggle');
            const ikon = document.getElementById('sesToggleIkon');
            if(window.oyunSesiAcik) { btn.classList.remove('sessiz'); ikon.innerText = "🔊"; } 
            else { btn.classList.add('sessiz'); ikon.innerText = "🔇"; }
        });
    }
}, 1000);
