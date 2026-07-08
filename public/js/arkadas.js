// ==========================================
// BEYCO GAMES - ARKADAŞ VE DAVET SİSTEMİ
// ==========================================
window.arkadaslarMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler arkadaş kullanamaz."); return; } 
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; 
    const listeDiv = document.getElementById('arkadasListesiDiv'); 
    listeDiv.innerHTML = '<p style="color:#a3c4bc; font-size:11px; text-align:center;">Aktif arkadaşların burada!</p>';
    let onSay = 0;
    onlineOyuncularListesi.forEach(o => {
        if(o === aktifKullaniciAdi || !benimArkadaslarim.includes(o)) return; 
        onSay++; let koz = globalKozmetikler[o] || []; let iR = koz.includes('atesli_isim') ? '#ff4d4d' : '#fff'; 
        listeDiv.innerHTML += `<div class="lider-satir"><div style="color:${iR};"><span class="online-nokta"></span> ${o}</div><button class="btn-davet-et" onclick="masayaDavetEt('${o}')">Davet Et</button></div>`;
    });
    if(onSay === 0) listeDiv.innerHTML += '<p style="text-align:center; color:#777; font-size:12px;">Aktif arkadaşın yok.</p>';
};

window.davetMenusuAc = function() {
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler davet edemez."); return; } 
    document.getElementById('arkadaslarEkrani').style.display = 'flex'; 
    const listeDiv = document.getElementById('arkadasListesiDiv'); 
    listeDiv.innerHTML = '<p style="color:#a3c4bc; font-size:11px; text-align:center;">Masaya davet edilecek oyuncular</p>';
    let onSay = 0;
    onlineOyuncularListesi.forEach(o => {
        if(o === aktifKullaniciAdi || o.startsWith('Misafir_')) return; 
        onSay++; let koz = globalKozmetikler[o] || []; let iR = koz.includes('atesli_isim') ? '#ff4d4d' : '#fff'; 
        listeDiv.innerHTML += `<div class="lider-satir"><div style="color:${iR};"><span class="online-nokta"></span> ${o}</div><button class="btn-davet-et" onclick="masayaDavetEt('${o}')">Davet Et</button></div>`;
    });
    if(onSay === 0) listeDiv.innerHTML += '<p style="text-align:center; color:#777; font-size:12px;">Kimse yok.</p>';
};

window.masayaDavetEt = function(n) { 
    socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: n, masaAdi: suAnkiMasam }); 
    document.getElementById('arkadaslarEkrani').style.display = 'none'; 
};

window.profilArkadasAksiyon = function() {
    const btn = document.getElementById('profilArkadasBtn'); const hedef = btn.dataset.hedef; if (!hedef || isMisafir) return;
    if (benimArkadaslarim.includes(hedef)) { if(confirm(`${hedef} silinsin mi?`)) { benimArkadaslarim = benimArkadaslarim.filter(n=>n!==hedef); ozelUyariGoster(`❌ Silindi.`); if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ arkadaslar: benimArkadaslarim }); document.getElementById('profilEkrani').style.display='none'; } } 
    else { window.arkadasEkle(hedef); document.getElementById('profilEkrani').style.display='none'; } 
};

window.profilDavetAksiyon = function() { 
    const hedef = document.getElementById('profilDavetBtn').dataset.hedef; 
    if (!hedef || !suAnkiMasam) return; 
    socket.emit('masaya_davet_et', { kimden: aktifKullaniciAdi, kime: hedef, masaAdi: suAnkiMasam }); 
    ozelUyariGoster(`💌 Davet gönderildi!`); 
    document.getElementById('profilEkrani').style.display = 'none'; 
};
