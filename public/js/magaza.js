// ==========================================
// BEYCO GAMES - MAĞAZA VE KASA SİSTEMİ
// ==========================================
window.magazaIslem = function(esyaId, fiyat) {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafir hesaplar mağazayı kullanamaz!"); return; }
    
    if(aktifKozmetikler.includes(esyaId)) {
        // Çıkar
        aktifKozmetikler = aktifKozmetikler.filter(k => k !== esyaId);
    } else if(benimEnvanterim.includes(esyaId)) {
        // Kullan
        if(esyaId.startsWith('tema_')) { aktifKozmetikler = aktifKozmetikler.filter(k => !k.startsWith('tema_')); } // Eski temayı çıkar
        aktifKozmetikler.push(esyaId);
    } else {
        // Satın Al
        let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
        if(safCip < fiyat) { ozelUyariGoster("⚠️ Yetersiz Çip!"); return; }
        
        benimAnlikCipim = safCip - fiyat;
        document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
        benimEnvanterim.push(esyaId);
        
        if(esyaId.startsWith('tema_')) { aktifKozmetikler = aktifKozmetikler.filter(k => !k.startsWith('tema_')); }
        aktifKozmetikler.push(esyaId);
        
        socket.emit('magaza_harcamasi', { isim: aktifKullaniciAdi, yeniCip: benimAnlikCipim });
        ozelUyariGoster("🎉 Başarıyla satın alındı!");
    }

    if(auth.currentUser && !isMisafir) {
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({
            cip: benimAnlikCipim, envanter: benimEnvanterim, aktifKozmetikler: aktifKozmetikler
        }).catch(e => console.log(e));
    }
    socket.emit('kozmetik_guncelle', { isim: aktifKullaniciAdi, kozmetikler: aktifKozmetikler });
    if(typeof window.arayuzGuncelle === 'function') window.arayuzGuncelle();
};
