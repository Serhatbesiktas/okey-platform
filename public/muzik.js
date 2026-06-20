document.addEventListener('DOMContentLoaded', () => {
    const soundBtn = document.createElement('button');
    soundBtn.id = 'sound-toggle-btn';
    soundBtn.innerHTML = '🔊';
    
    // JS İÇİNDEKİ SİZING STİLLERİNİ SİLDİK, CSS'DEKİ KALIBI EKLEDİK
    soundBtn.classList.add('m-sol-btn');

    // Sadece Masa Ekranına ekle
    const masaEkrani = document.getElementById('masaEkrani');
    if (masaEkrani) {
        masaEkrani.appendChild(soundBtn);
    }

    // Ses durumu ve GLOBAL DEĞİŞKEN (Kapatma için kritik)
    window.oyunSesleriAktif = true; 
    
    soundBtn.addEventListener('click', () => {
        // Durumu tersine çevir
        window.oyunSesleriAktif = !window.oyunSesleriAktif;
        
        if (window.oyunSesleriAktif) {
            soundBtn.innerHTML = '🔊';
            soundBtn.classList.remove('ses-kapali'); // Yeşil çerçeveye dön
        } else {
            soundBtn.innerHTML = '🔇';
            soundBtn.classList.add('ses-kapali'); // Kırmızı çerçeveye dön
        }
    });
});
