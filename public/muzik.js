document.addEventListener('DOMContentLoaded', () => {
    const soundBtn = document.createElement('button');
    soundBtn.id = 'sound-toggle-btn';
    soundBtn.innerHTML = '🔊';
    
    /* --- SOL ÜST KÖŞE TAM AYARLARI --- */
    soundBtn.style.position = 'fixed';
    soundBtn.style.top = '15px';
    soundBtn.style.left = '15px';
    soundBtn.style.zIndex = '9999';
    soundBtn.style.width = '40px';
    soundBtn.style.height = '40px';
    soundBtn.style.borderRadius = '50%';
    soundBtn.style.border = '2px solid #2ecc71';
    soundBtn.style.background = 'rgba(11, 38, 20, 0.8)';
    soundBtn.style.color = '#fff';
    soundBtn.style.fontSize = '18px';
    soundBtn.style.cursor = 'pointer';
    soundBtn.style.display = 'flex';
    soundBtn.style.justifyContent = 'center';
    soundBtn.style.alignItems = 'center';
    soundBtn.style.boxShadow = '0 0 10px rgba(46, 204, 113, 0.5)';

    document.body.appendChild(soundBtn);

    let soundEnabled = true;
    window.oyunSesleriAktif = true; 
    
    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.innerHTML = soundEnabled ? '🔊' : '🔇';
        soundBtn.style.borderColor = soundEnabled ? '#2ecc71' : '#e74c3c';
        soundBtn.style.boxShadow = soundEnabled ? '0 0 10px rgba(46, 204, 113, 0.5)' : '0 0 10px rgba(231, 76, 60, 0.5)';
        window.oyunSesleriAktif = soundEnabled; 
    });
});
