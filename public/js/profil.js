// ==========================================
// BEYCO GAMES - PROFİL GÖSTERİMİ VE EŞYALAR
// ==========================================
window.profiliGoster = function(hedefIsim) {
    if(!hedefIsim || hedefIsim === "" || hedefIsim === "Bekleniyor..." || hedefIsim === "➕ DAVET" || hedefIsim === "Boş") { if(suAnkiMasam && !izleyiciModu && typeof window.davetMenusuAc === 'function') window.davetMenusuAc(); return; }
    const pIsim = document.getElementById('profilIsim'); const pCip = document.getElementById('profilCipMiktari'); const pDurum = document.getElementById('profilDurumBadge'); const pArkadasBtn = document.getElementById('profilArkadasBtn'); const pDavetBtn = document.getElementById('profilDavetBtn');
    document.getElementById('profilEkrani').style.display = 'flex'; if(pArkadasBtn) pArkadasBtn.dataset.hedef = hedefIsim; if(pDavetBtn) pDavetBtn.dataset.hedef = hedefIsim;
    let isOnline = (window.onlineOyuncularListesi && window.onlineOyuncularListesi.includes(hedefIsim)) || hedefIsim === aktifKullaniciAdi;
    if(pDurum) { pDurum.innerText = isOnline ? "🟢 Çevrimiçi" : "🔴 Çevrimdışı"; pDurum.style.color = isOnline ? "#2ecc71" : "#e74c3c"; }
    
    if (hedefIsim !== aktifKullaniciAdi) {
        if(pArkadasBtn) {
            pArkadasBtn.style.display = 'block';
            if (benimArkadaslarim && benimArkadaslarim.includes(hedefIsim)) { pArkadasBtn.innerText = "❌ Arkadaştan Çıkar"; pArkadasBtn.style.background = "#e74c3c"; } else { pArkadasBtn.innerText = "➕ Arkadaş Ekle"; pArkadasBtn.style.background = ""; }
        }
        if(pDavetBtn) { if (isOnline) { pDavetBtn.style.display = 'block'; } else { pDavetBtn.style.display = 'none'; } }
    } else { if(pArkadasBtn) pArkadasBtn.style.display = 'none'; if(pDavetBtn) pDavetBtn.style.display = 'none'; }

    let tacIcon = ""; let ismRengi = "#fff"; let textGlow = "none";
    if(window.globalKozmetikler && window.globalKozmetikler[hedefIsim]) {
        if(window.globalKozmetikler[hedefIsim].includes('neon_tac')) tacIcon = "👑 ";
        if(window.globalKozmetikler[hedefIsim].includes('atesli_isim')) { ismRengi = "#ff4d4d"; textGlow = "0 0 10px rgba(255, 77, 77, 0.8)"; }
    }
    if(pIsim) { pIsim.innerHTML = tacIcon + hedefIsim; pIsim.style.color = ismRengi; pIsim.style.textShadow = textGlow; }

    if(hedefIsim.startsWith("MİSAFİR_")) { if(pCip) pCip.innerText = "20.000"; if(pArkadasBtn) pArkadasBtn.style.display = 'none'; if(pDavetBtn) pDavetBtn.style.display = (suAnkiMasam && isOnline && !izleyiciModu) ? 'block' : 'none'; return; }
    
    if(window.db) {
        window.db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then((q) => {
            if(!q.empty) { 
                const data = q.docs[0].data(); let gCip = parseInt(String(data.cip).replace(/[^0-9]/g, '')) || 0; 
                if(pCip) pCip.innerText = gCip.toLocaleString('tr-TR');
                if(document.getElementById('profilOynanan')) document.getElementById('profilOynanan').innerText = data.oynananOyun || 0;
            } 
        }).catch(err => { console.log("Profil verisi çekilemedi."); });
    }
};

window.esyaFirlatAksiyon = function(esyaIcon) {
    if(isMisafir) { ozelUyariGoster("⚠️ Eşya fırlatılamaz!"); return; } const hedef = document.getElementById('profilArkadasBtn').dataset.hedef;
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    if(!hedef || !suAnkiMasam || hedef === aktifKullaniciAdi || safCip < 5000) return;
    socket.emit('esya_firlat', { masaAdi: suAnkiMasam, kimden: aktifKullaniciAdi, kime: hedef, esya: esyaIcon }); document.getElementById('profilEkrani').style.display = 'none';
};
