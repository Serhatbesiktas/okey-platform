// --- VIP CASINO OYUN SESLERİ KONTROL MODÜLÜ (GÜNCELLENDİ) --- //

const sesStilleri = document.createElement('style');
sesStilleri.innerHTML = `
    .vip-ses-btn {
        position: fixed; 
        top: 75px; right: 20px; /* Mesaj Zarfı (20px) butonunun tam hizasında altında */
        z-index: 9999; 
        background: rgba(10, 15, 12, 0.85); 
        backdrop-filter: blur(5px);
        border: 2px solid #2ecc71; 
        border-radius: 50%; 
        width: 45px; height: 45px;
        display: flex; justify-content: center; align-items: center;
        box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3); 
        cursor: pointer; transition: 0.3s;
    }
    .vip-ses-btn.sessiz {
        border-color: #e74c3c;
        box-shadow: 0 5px 15px rgba(231, 76, 60, 0.3);
    }
    .vip-ses-btn:active { transform: scale(0.9); }
    .ses-ikon { font-size: 20px; }
`;
document.head.appendChild(sesStilleri);

document.body.insertAdjacentHTML('beforeend', `
    <button id="btnOyunSesiToggle" class="vip-ses-btn" title="Oyun Sesleri Aç/Kapat">
        <span id="sesToggleIkon" class="ses-ikon">🔊</span>
    </button>
`);

// Butona tıklandığında sadece ana motordaki bayrağı değiştirir
document.getElementById('btnOyunSesiToggle').addEventListener('click', function() {
    window.oyunSesiAcik = !window.oyunSesiAcik;
    const btn = document.getElementById('btnOyunSesiToggle');
    const ikon = document.getElementById('sesToggleIkon');
    
    if(window.oyunSesiAcik) {
        btn.classList.remove('sessiz');
        ikon.innerText = "🔊";
    } else {
        btn.classList.add('sessiz');
        ikon.innerText = "🔇";
    }
});
