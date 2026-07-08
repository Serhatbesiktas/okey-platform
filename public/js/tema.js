// ==========================================
// TEMA DENETLEYİCİSİ (HTML İÇİNDEN ÇIKARILDI)
// ==========================================
setInterval(() => {
    try {
        let uygulanacak = [];
        if (typeof aktifKozmetikler !== 'undefined') uygulanacak = aktifKozmetikler;
        else if (window.aktifKozmetikler) uygulanacak = window.aktifKozmetikler;
        let masaAdi = null;
        if (typeof suAnkiMasam !== 'undefined') masaAdi = suAnkiMasam;
        else if (window.suAnkiMasam) masaAdi = window.suAnkiMasam;
        let gKoz = null;
        if (typeof globalKozmetikler !== 'undefined') gKoz = globalKozmetikler;
        else if (window.globalKozmetikler) gKoz = window.globalKozmetikler;

        if (masaAdi && masaAdi.includes('VIP:')) {
            let masaSahibi = masaAdi.split('VIP:')[1].split('Masası')[0].trim();
            if (gKoz && gKoz[masaSahibi]) { uygulanacak = gKoz[masaSahibi]; }
        }

        document.body.classList.remove('tema-royal', 'tema-neon', 'tema-kizil');
        if (uygulanacak.includes('tema_royal')) document.body.classList.add('tema-royal');
        else if (uygulanacak.includes('tema_neon')) document.body.classList.add('tema-neon');
        else if (uygulanacak.includes('tema_kizil')) document.body.classList.add('tema-kizil');
    } catch(e) { }
}, 500);
