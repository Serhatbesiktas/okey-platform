// 🔥 TEMA RADARI VE DIŞ EKLENTİ YÖNETİCİSİ 🔥
// Ana kodlara ASLA dokunmaz.

// 1. Dışarıdan Global Kozmetik Listesini Yakala
if(typeof socket !== 'undefined') {
    socket.on('kozmetikleri_guncelle', (data) => {
        window.globalKozmetikler = data;
    });
}

// 2. Tema Radarı (Her 1 Saniyede Bir Masayı Taramaya Başlar)
setInterval(() => {
    // Sadece VIP masadaysak tema çalışır
    if (window.suAnkiMasam && window.suAnkiMasam.startsWith('👑 VIP:')) {
        // Masanın isminden sahibini çal (Örn: "👑 VIP: RAUL Masası" -> "RAUL")
        let masaSahibi = window.suAnkiMasam.split('VIP: ')[1].split(' Masası')[0];
        
        // Sahibin sahip olduğu kozmetikleri bul
        let sahibinKozmetikleri = window.globalKozmetikler ? (window.globalKozmetikler[masaSahibi] || []) : [];
        
        // Temayı Uygula
        document.body.classList.remove('tema-royal', 'tema-neon', 'tema-kizil');
        
        if (sahibinKozmetikleri.includes('tema_royal')) document.body.classList.add('tema-royal');
        else if (sahibinKozmetikleri.includes('tema_neon')) document.body.classList.add('tema-neon');
        else if (sahibinKozmetikleri.includes('tema_kizil')) document.body.classList.add('tema-kizil');

    } else {
        // Normal masadaysak veya lobideysek temaları temizle (Orijinale dön)
        document.body.classList.remove('tema-royal', 'tema-neon', 'tema-kizil');
    }
}, 1000);

// 3. Mağaza Butonlarını Dışarıdan Yönetme Radarı
setInterval(() => {
    const vipTemalar = [
        {id: 'tema_royal', fiyat: 10000000, metin: '10 Milyon'},
        {id: 'tema_neon', fiyat: 20000000, metin: '20 Milyon'},
        {id: 'tema_kizil', fiyat: 30000000, metin: '30 Milyon'}
    ];

    vipTemalar.forEach(tema => {
        const btn = document.getElementById('btn_' + tema.id);
        if(btn) {
            // Butonların renklerini dışarıdan güncelle
            if(window.aktifKozmetikler && window.aktifKozmetikler.includes(tema.id)) {
                btn.innerText = 'TEMA AKTİF'; btn.style.background = '#e74c3c'; btn.style.color = '#fff';
            } else if(window.benimEnvanterim && window.benimEnvanterim.includes(tema.id)) {
                btn.innerText = 'KULLAN'; btn.style.background = '#2ecc71'; btn.style.color = '#fff';
            } else {
                btn.innerText = tema.metin + ' ÇİP'; btn.style.background = ''; btn.style.color = '';
            }

            // Eğer butona henüz tıklama özelliği eklemediysek ekle
            if(!btn.dataset.temaEklendi) {
                btn.dataset.temaEklendi = "true";
                btn.addEventListener('click', () => {
                    if(window.isMisafir) return window.ozelUyariGoster("Misafirler tema alamaz!");
                    
                    if(window.aktifKozmetikler.includes(tema.id)) {
                        // Çıkar
                        window.aktifKozmetikler = window.aktifKozmetikler.filter(k => k !== tema.id);
                    } else if(window.benimEnvanterim.includes(tema.id)) {
                        // Kullan (Diğer temaları kapat, bunu aç)
                        window.aktifKozmetikler = window.aktifKozmetikler.filter(k => !k.startsWith('tema_'));
                        window.aktifKozmetikler.push(tema.id);
                    } else {
                        // Satın Al
                        let safCip = parseInt(String(window.benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
                        if(safCip < tema.fiyat) return window.ozelUyariGoster("Bu Premium Temayı almak için çipiniz yetersiz!");
                        
                        window.benimAnlikCipim = safCip - tema.fiyat;
                        window.benimEnvanterim.push(tema.id);
                        window.aktifKozmetikler = window.aktifKozmetikler.filter(k => !k.startsWith('tema_'));
                        window.aktifKozmetikler.push(tema.id);
                        
                        if(typeof socket !== 'undefined') socket.emit('magaza_harcamasi', {isim: window.aktifKullaniciAdi, yeniCip: window.benimAnlikCipim});
                        window.ozelUyariGoster("🎉 Premium Tema Satın Alındı! Artık masanın ağası sensin!");
                    }

                    // Firebase Kaydet
                    if(document.getElementById('benimCipim')) document.getElementById('benimCipim').innerText = window.benimAnlikCipim.toLocaleString('tr-TR');
                    if(window.auth && window.auth.currentUser && window.db) {
                        window.db.collection("kullanicilar").doc(window.auth.currentUser.uid).update({
                            cip: window.benimAnlikCipim, envanter: window.benimEnvanterim, aktifKozmetikler: window.aktifKozmetikler
                        });
                    }
                    if(typeof socket !== 'undefined') socket.emit('kozmetik_guncelle', {isim: window.aktifKullaniciAdi, kozmetikler: window.aktifKozmetikler});
                });
            }
        }
    });
}, 1000);
