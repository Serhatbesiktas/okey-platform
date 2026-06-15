// ... (Tüm fonksiyonların arasına şu güncellemeyi koy)

socket.on('kozmetikleri_guncelle', (data) => {
    globalKozmetikler = data;
    // Masa ekranındaysan herkesin görünümünü anında tazele
    if(suAnkiMasam && guncelMasalar[suAnkiMasam]) {
        gelişmişKoltukHizala(guncelMasalar[suAnkiMasam]);
    }
    // Lobi ekranındaysan listeyi tazele
    if(document.getElementById('lobiEkrani').style.display !== 'none') {
        socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler });
    }
});

// Masadaki oyuncuların ismini ve kozmetiğini güncelleyen fonksiyon
function koltukStiliUygula(elementId, oyuncuIsmi) {
    const el = document.getElementById(elementId);
    if(!oyuncuIsmi || oyuncuIsmi.startsWith('Bot_')) {
        el.innerText = oyuncuIsmi || "Bekleniyor...";
        el.style.color = "#0dcaf0"; el.style.textShadow = "none";
        return;
    }
    // İşte burası! Sunucudan gelen global kozmetikleri kullanıyoruz
    let kozmetikler = globalKozmetikler[oyuncuIsmi] || []; 
    let tac = kozmetikler.includes('neon_tac') ? "👑 " : "";
    
    el.innerText = tac + oyuncuIsmi;
    el.dataset.isim = oyuncuIsmi; // Davet sistemi için

    if(kozmetikler.includes('atesli_isim')) {
        el.style.color = '#ff4d4d'; 
        el.style.textShadow = '0 0 5px #ff0000';
    } else {
        el.style.color = '#0dcaf0'; 
        el.style.textShadow = 'none';
    }
}
