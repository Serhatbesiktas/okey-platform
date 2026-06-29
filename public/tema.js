// 🔥 TEMA RADARI (Sadece Ekranı Boyar) 🔥
if(typeof socket !== 'undefined') {
    socket.on('kozmetikleri_guncelle', (data) => {
        window.globalKozmetikler = data;
    });
}

setInterval(() => {
    // Sadece VIP masadaysak tema çalışır
    if (window.suAnkiMasam && window.suAnkiMasam.startsWith('👑 VIP:')) {
        let masaSahibi = window.suAnkiMasam.split('VIP: ')[1].split(' Masası')[0];
        let sahibinKozmetikleri = window.globalKozmetikler ? (window.globalKozmetikler[masaSahibi] || []) : [];
        
        document.body.classList.remove('tema-royal', 'tema-neon', 'tema-kizil');
        
        if (sahibinKozmetikleri.includes('tema_royal')) document.body.classList.add('tema-royal');
        else if (sahibinKozmetikleri.includes('tema_neon')) document.body.classList.add('tema-neon');
        else if (sahibinKozmetikleri.includes('tema_kizil')) document.body.classList.add('tema-kizil');

    } else {
        document.body.classList.remove('tema-royal', 'tema-neon', 'tema-kizil');
    }
}, 1000);
