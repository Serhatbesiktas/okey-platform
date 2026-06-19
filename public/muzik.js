// --- VIP CASINO MÜZİK VE AMBİYANS MODÜLÜ --- //

const muzikStilleri = document.createElement('style');
muzikStilleri.innerHTML = `
    .vip-muzik-kutu {
        position: fixed; 
        top: 20px; left: 20px; 
        z-index: 9999; 
        background: rgba(10, 15, 12, 0.8); 
        backdrop-filter: blur(8px);
        border: 1px solid #f2c94c; 
        padding: 8px 15px; 
        border-radius: 30px; 
        display: flex; 
        align-items: center; 
        gap: 12px; 
        box-shadow: 0 5px 15px rgba(242,201,76,0.2); 
        transition: 0.4s ease;
    }
    .vip-muzik-kutu.aktif {
        border-color: #2ecc71;
        box-shadow: 0 5px 20px rgba(46, 204, 113, 0.4);
    }
    .muzik-btn {
        background: none; border: none; font-size: 22px; cursor: pointer; 
        padding: 0; margin: 0; filter: drop-shadow(0 0 5px rgba(255,255,255,0.4));
        transition: 0.2s;
    }
    .muzik-btn:active { transform: scale(0.8); }
    .muzik-bilgi {
        display: flex; flex-direction: column; justify-content: center;
    }
    .muzik-isim {
        color: #f2c94c; font-size: 10px; font-weight: 900; letter-spacing: 1px;
        transition: 0.4s;
    }
    .vip-muzik-kutu.aktif .muzik-isim { color: #2ecc71; }
    
    /* Modern Volume Range */
    .muzik-ses-ayar {
        -webkit-appearance: none; width: 65px; height: 4px; background: #333; 
        border-radius: 5px; outline: none; margin-top: 3px;
    }
    .muzik-ses-ayar::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 10px; height: 10px; border-radius: 50%; background: #f2c94c; cursor: pointer;
        transition: 0.4s;
    }
    .vip-muzik-kutu.aktif .muzik-ses-ayar::-webkit-slider-thumb { background: #2ecc71; }
`;
document.head.appendChild(muzikStilleri);

// Müzik çalar arayüzünü ekrana bas
document.body.insertAdjacentHTML('beforeend', `
    <div id="vipMuzikCalar" class="vip-muzik-kutu">
        <button id="btnMuzikTetikle" class="muzik-btn" title="Müziği Aç/Kapat">🔇</button>
        <div class="muzik-bilgi">
            <span id="muzikBaslik" class="muzik-isim">CASINO LOUNGE</span>
            <input type="range" id="muzikSesAyar" class="muzik-ses-ayar" min="0" max="1" step="0.05" value="0.2">
        </div>
    </div>
`);

// Telifsiz, havalı bir casino/lounge müziği (İleride kendi MP3 linkinle değiştirebilirsin)
const lobiMuzigi = new Audio('https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=smooth-jazz-114890.mp3');
lobiMuzigi.loop = true;  // Şarkı bitince başa sarsın
lobiMuzigi.volume = 0.2; // Varsayılan ses seviyesi kısık olsun

let muzikAcik = false;

document.getElementById('btnMuzikTetikle').addEventListener('click', function() {
    const kutu = document.getElementById('vipMuzikCalar');
    if(!muzikAcik) {
        lobiMuzigi.play().then(() => {
            this.innerText = "🎵";
            muzikAcik = true;
            kutu.classList.add('aktif');
            document.getElementById('muzikBaslik').innerText = "ÇALIYOR...";
        }).catch(e => {
            console.log("Tarayıcı otomatik oynatmaya izin vermedi: ", e);
        });
    } else {
        lobiMuzigi.pause();
        this.innerText = "🔇";
        muzikAcik = false;
        kutu.classList.remove('aktif');
        document.getElementById('muzikBaslik').innerText = "CASINO LOUNGE";
    }
});

document.getElementById('muzikSesAyar').addEventListener('input', function(e) {
    lobiMuzigi.volume = e.target.value;
});
