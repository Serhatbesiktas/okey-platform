// 🔥 TEMA RADARI VE DIŞ EKLENTİ YÖNETİCİSİ 🔥
if(typeof socket !== 'undefined') {
    socket.on('kozmetikleri_guncelle', (data) => {
        window.globalKozmetikler = data;
    });
}

setInterval(() => {
    // 1. Varsayılan olarak kendi giydiğin (KULLAN dediğin) temayı baz al
    let uygulanacakKozmetikler = window.aktifKozmetikler || [];

    // 2. Eğer özel bir VIP masaya girdiysen, KURAL DEĞİŞİR:
    // Masanın ağası (kurucusu) hangi temayı kullanıyorsa herkese o tema yansır!
    if (window.suAnkiMasam && window.suAnkiMasam.includes('VIP:')) {
        // İsimdeki boşlukları (trim) temizleyerek masa sahibini tam buluruz
        let masaSahibi = window.suAnkiMasam.split('VIP:')[1].split('Masası')[0].trim();
        if (window.globalKozmetikler && window.globalKozmetikler[masaSahibi]) {
            uygulanacakKozmetikler = window.globalKozmetikler[masaSahibi];
        }
    }

    // 3. Ekrandaki eski temaları sil
    document.body.classList.remove('tema-royal', 'tema-neon', 'tema-kizil');
    
    // 4. Hangi tema aktifse anında ekrana giydir!
    if (uygulanacakKozmetikler.includes('tema_royal')) document.body.classList.add('tema-royal');
    else if (uygulanacakKozmetikler.includes('tema_neon')) document.body.classList.add('tema-neon');
    else if (uygulanacakKozmetikler.includes('tema_kizil')) document.body.classList.add('tema-kizil');

}, 500); // Radar saniyede 2 kez tarar, anında tepki verir!
