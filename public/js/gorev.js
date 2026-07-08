// ==========================================
// BEYCO GAMES - GÜNLÜK GÖREV SİSTEMİ
// ==========================================
window.gorevleriKaydet = function() { 
    if(auth.currentUser && !isMisafir) { 
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({ gorevler: benimGorevler }).catch(e=>console.log(e)); 
    } 
};

window.gorevleriAc = function() { 
    if(isMisafir) { ozelUyariGoster("⚠️ Misafirler görev yapamaz!"); return; } 
    document.getElementById('gorevlerEkrani').style.display = 'flex'; 
    window.renderGorevler(); 
};

window.renderGorevler = function() {
    const liste = document.getElementById('gorevListesi'); if(!liste) return; liste.innerHTML = '';
    const gorevlerData = [ 
        { id: 'kazanma', baslik: '🏆 3 El Kazan', hedef: 3, mevcut: benimGorevler.kazanma, odul: 50000 }, 
        { id: 'mesaj', baslik: '💬 5 Mesaj Gönder', hedef: 5, mevcut: benimGorevler.mesaj, odul: 10000 }, 
        { id: 'gosterge', baslik: '⭐ 1 Kere Gösterge Yap', hedef: 1, mevcut: benimGorevler.gosterge, odul: 25000 } 
    ];
    
    gorevlerData.forEach(g => {
        let yuzde = Math.min(100, (g.mevcut / g.hedef) * 100); let bittiMi = g.mevcut >= g.hedef; 
        let btnHtml = benimGorevler.alinanlar[g.id] ? `<button class="satin-al-btn" style="background:#555;" disabled>ALINDI</button>` : (bittiMi ? `<button class="satin-al-btn" style="background:#2ecc71; color:#fff;" onclick="gorevOduluAl('${g.id}', ${g.odul})">🎁 AL</button>` : `<div style="font-size:12px; color:#f2c94c; text-align:center; padding:10px;">İlerleme: ${g.mevcut} / ${g.hedef}</div>`);
        liste.innerHTML += `<div style="background:rgba(0,0,0,0.5); border:1px solid #52796f; border-radius:10px; padding:15px; margin-bottom:10px;"><h3 style="color:#fff; font-size:14px; margin-bottom:10px;">${g.baslik}</h3><div style="background:#111; width:100%; height:10px; border-radius:5px; margin-bottom:10px; overflow:hidden;"><div style="background:#2ecc71; width:${yuzde}%; height:100%;"></div></div>${btnHtml}</div>`;
    });
};

window.gorevOduluAl = function(id, m) { 
    if(benimGorevler.alinanlar[id]) return; benimGorevler.alinanlar[id] = true; window.gorevleriKaydet(); 
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0; benimAnlikCipim = safCip + m; 
    document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR'); 
    if(auth.currentUser) db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim }); 
    socket.emit('kullanici_girisi', { isim: aktifKullaniciAdi, cip: benimAnlikCipim, kozmetikler: aktifKozmetikler }); ozelUyariGoster(`🎉 Görev bitti!`); window.renderGorevler(); 
};
