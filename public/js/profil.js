// ==========================================
// BEYCO GAMES - PROFİL GÖSTERİMİ VE EŞYALAR
// ==========================================
window.profiliGoster = function(hedefIsim) {
    if(!hedefIsim || hedefIsim === "" || hedefIsim === "Bekleniyor..." || hedefIsim === "➕ DAVET" || hedefIsim === "Boş") { 
        if(suAnkiMasam && !izleyiciModu) {
            if(typeof window.davetMenusuAc === 'function') window.davetMenusuAc(); 
        }
        return; 
    }
    
    const pEkrani = document.getElementById('profilEkrani'); 
    const pIsim = document.getElementById('profilIsim'); 
    const pCip = document.getElementById('profilCipMiktari'); 
    const pDurum = document.getElementById('profilDurumBadge'); 
    const pOynanan = document.getElementById('profilOynanan'); 
    const pKazanilan = document.getElementById('profilKazanilan'); 
    const pOran = document.getElementById('profilKazanmaOrani'); 
    const pLig = document.getElementById('profilLigBadge'); 
    const pUnvan = document.getElementById('profilUnvanBadge'); 
    const pArkadasBtn = document.getElementById('profilArkadasBtn'); 
    const pDavetBtn = document.getElementById('profilDavetBtn');
    
    if(pEkrani) pEkrani.style.display = 'flex'; 
    if(pArkadasBtn) pArkadasBtn.dataset.hedef = hedefIsim; 
    if(pDavetBtn) pDavetBtn.dataset.hedef = hedefIsim;

    if(pDurum) {
        pDurum.innerHTML = "🟢 Çevrimiçi"; 
        pDurum.style.color = "#2ecc71";
    }
    
    let isOnline = (onlineOyuncularListesi && onlineOyuncularListesi.includes(hedefIsim)) || hedefIsim === aktifKullaniciAdi;
    
    if (hedefIsim !== aktifKullaniciAdi) {
        if(pArkadasBtn) {
            pArkadasBtn.style.display = 'block';
            let istekGonderilmis = window.benimGonderilenIstekler && window.benimGonderilenIstekler.has(hedefIsim);
            if (benimArkadaslarim && benimArkadaslarim.includes(hedefIsim)) { 
                pArkadasBtn.innerHTML = "❌ Arkadaştan Çıkar"; 
                pArkadasBtn.style.background = "linear-gradient(180deg, #e74c3c 0%, #c0392b 100%)"; 
                pArkadasBtn.style.color = "#fff"; 
                pArkadasBtn.disabled = false;
            } else if (istekGonderilmis) {
                pArkadasBtn.innerHTML = "⏳ İstek Gönderildi";
                pArkadasBtn.style.background = "linear-gradient(180deg, #7f8c8d 0%, #636e72 100%)";
                pArkadasBtn.style.color = "#fff";
                pArkadasBtn.disabled = true;
            } else { 
                pArkadasBtn.innerHTML = "➕ Arkadaş Ekle"; 
                pArkadasBtn.style.background = "linear-gradient(180deg, #f1c40f 0%, #f39c12 100%)"; 
                pArkadasBtn.style.color = "#111"; 
                pArkadasBtn.disabled = false;
            }
        }
        if(pDavetBtn) pDavetBtn.style.display = 'block'; 
    } else { 
        if(pArkadasBtn) pArkadasBtn.style.display = 'none'; 
        if(pDavetBtn) pDavetBtn.style.display = 'none'; 
    }

    let tacIcon = ""; let ismRengi = "#fff"; let textGlow = "none";
    if(globalKozmetikler && globalKozmetikler[hedefIsim]) {
        if(globalKozmetikler[hedefIsim].includes('neon_tac')) tacIcon = "👑 ";
        if(globalKozmetikler[hedefIsim].includes('atesli_isim')) { ismRengi = "#ff4d4d"; textGlow = "0 0 10px rgba(255, 77, 77, 0.8)"; }
    }
    
    if(pIsim) {
        pIsim.innerHTML = tacIcon + hedefIsim; 
        pIsim.style.color = ismRengi; 
        pIsim.style.textShadow = textGlow;
    }
    
    if(pCip) pCip.innerText = "..."; 
    if(pOynanan) pOynanan.innerText = "..."; 
    if(pKazanilan) pKazanilan.innerHTML = "..."; 
    if(pOran) pOran.innerText = "...";

    const setStats = (cip, oynanan, kazanilan, oran, ligTxt, ligBg, unvanTxt) => {
        if(pDurum) { pDurum.innerHTML = "🟢 Çevrimiçi"; pDurum.style.color = "#2ecc71"; }
        if(pCip) pCip.innerText = cip.toLocaleString('tr-TR'); 
        if(pOynanan) pOynanan.innerText = oynanan; 
        if(pKazanilan) pKazanilan.innerHTML = kazanilan + ' <span style="color:#777; font-size:14px;">/</span> <span style="color:#e74c3c; font-size:14px;">' + (oynanan - kazanilan) + '</span>'; 
        if(pOran) pOran.innerText = '%' + oran; 
        if(pLig) { pLig.innerText = ligTxt; pLig.style.background = ligBg; }
        if(pUnvan) pUnvan.innerText = unvanTxt;
    };
    
    let hIsimKiyas = hedefIsim.toUpperCase();
    if(hIsimKiyas.startsWith("MİSAFİR") || hIsimKiyas.startsWith("MISAFIR")) { 
        setStats(20000, 0, 0, 0, "🥉 BRONZ LİG", "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)", "MİSAFİR");
        return; 
    }

    let hash = 0; for (let i = 0; i < hedefIsim.length; i++) { hash = hedefIsim.charCodeAt(i) + ((hash << 5) - hash); } hash = Math.abs(hash);
    let fakeCip = (hash % 15000000) + 500000; let fakeOynanan = (hash % 800) + 50; let fakeKazanilan = Math.floor(fakeOynanan * ((hash % 30 + 40) / 100)); let fakeOran = Math.floor((fakeKazanilan / fakeOynanan) * 100);
    
    let lig = "🥉 BRONZ LİG"; let ligBg = "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)";
    if(fakeCip > 10000000) { lig = "💎 ELMAS LİG"; ligBg = "linear-gradient(180deg, #3498db 0%, #2980b9 100%)"; } else if(fakeCip > 5000000) { lig = "🥇 ALTIN LİG"; ligBg = "linear-gradient(180deg, #f1c40f 0%, #f39c12 100%)"; } else if(fakeCip > 2000000) { lig = "🥈 GÜMÜŞ LİG"; ligBg = "linear-gradient(180deg, #bdc3c7 0%, #95a5a6 100%)"; }
    let unvan = "🃏 OYUNCU"; if(fakeOran > 60 && fakeOynanan > 50) unvan = "👑 OKEY KRALI"; else if(fakeOynanan > 500) unvan = "⚔️ USTA"; else if(fakeKazanilan > 200) unvan = "🔥 ATEŞ USTASI";

    if(typeof db !== 'undefined') {
        db.collection("kullanicilar").where("isim", "==", hedefIsim).get().then((q) => {
            if(!q.empty) { 
                const data = q.docs[0].data(); let gCip = parseInt(String(data.cip).replace(/[^0-9]/g, '')) || 0; let gOynanan = data.oynananOyun || 0; let gKazanilan = data.kazanilanOyun || 0; let gOran = gOynanan > 0 ? Math.floor((gKazanilan / gOynanan) * 100) : 0;
                let gercekLig = "🥉 BRONZ LİG"; let gercekLigBg = "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)";
                if(gCip > 10000000) { gercekLig = "💎 ELMAS LİG"; gercekLigBg = "linear-gradient(180deg, #3498db 0%, #2980b9 100%)"; } else if(gCip > 5000000) { gercekLig = "🥇 ALTIN LİG"; gercekLigBg = "linear-gradient(180deg, #f1c40f 0%, #f39c12 100%)"; } else if(gCip > 2000000) { gercekLig = "🥈 GÜMÜŞ LİG"; gercekLigBg = "linear-gradient(180deg, #bdc3c7 0%, #95a5a6 100%)"; }
                let gercekUnvan = "🃏 OYUNCU"; if(gOran > 60 && gOynanan > 50) gercekUnvan = "👑 OKEY KRALI"; else if(gOynanan > 500) gercekUnvan = "⚔️ USTA"; else if(gKazanilan > 200) gercekUnvan = "🔥 ATEŞ USTASI";
                
                setStats(gCip, gOynanan, gKazanilan, gOran, gercekLig, gercekLigBg, gercekUnvan);
            } else { setStats(fakeCip, fakeOynanan, fakeKazanilan, fakeOran, lig, ligBg, unvan); }
        }).catch(err => { setStats(fakeCip, fakeOynanan, fakeKazanilan, fakeOran, lig, ligBg, unvan); });
    } else { setStats(fakeCip, fakeOynanan, fakeKazanilan, fakeOran, lig, ligBg, unvan); }
};

// 🔥 SİLİNEN EŞYA FIRLATMA MOTORU GERİ GELDİ 🔥
window.esyaFirlatAksiyon = function(esyaIcon) {
    if(isMisafir) { ozelUyariGoster("⚠️ Eşya fırlatılamaz!"); return; } 
    const hedef = document.getElementById('profilArkadasBtn').dataset.hedef;
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    
    if(!hedef || !suAnkiMasam || hedef === aktifKullaniciAdi || safCip < 5000) return;
    
    socket.emit('esya_firlat', { masaAdi: suAnkiMasam, kimden: aktifKullaniciAdi, kime: hedef, esya: esyaIcon }); 
    document.getElementById('profilEkrani').style.display = 'none';
};
