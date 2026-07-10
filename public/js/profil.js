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

    if(pDurum) pDurum.innerHTML = "Çevrimiçi"; 
    
    let isOnline = (onlineOyuncularListesi && onlineOyuncularListesi.includes(hedefIsim)) || hedefIsim === aktifKullaniciAdi;
    
    // ANINDA SKELETON (YÜKLENİYOR) EFEKTİ GÖSTERİMİ
    if(pCip) pCip.innerHTML = '<div class="skeleton-loader" style="width: 120px; height: 30px; margin: 0 auto;"></div>';
    if(pOynanan) pOynanan.innerHTML = '<div class="skeleton-loader" style="width: 40px; height: 20px;"></div>';
    if(pOran) pOran.innerHTML = '<div class="skeleton-loader" style="width: 40px; height: 20px;"></div>';
    if(pKazanilan) pKazanilan.innerHTML = `
        <div class="stat-card"><span class="stat-icon">🏆</span><div class="stat-info"><span class="stat-lbl">Kazanılan</span><div class="skeleton-loader" style="width: 40px; height: 20px;"></div></div></div>
        <div class="stat-card"><span class="stat-icon">❌</span><div class="stat-info"><span class="stat-lbl">Kaybedilen</span><div class="skeleton-loader" style="width: 40px; height: 20px;"></div></div></div>
    `;
    
    // 👥 ARKADAŞLIK VE BUTON DURUM PROTOKOLÜ (YENİLENDİ)
    if (hedefIsim !== aktifKullaniciAdi) {
        if(pArkadasBtn) {
            pArkadasBtn.style.display = 'flex';
            
            // Eğer zaten arkadaşsa: "👥 Arkadaş" etiketi yap ve altına "Sil" butonu koy
            if (benimArkadaslarim && benimArkadaslarim.includes(hedefIsim)) { 
                pArkadasBtn.innerHTML = "👥 Arkadaş (Kaldırmak İçin Tıkla)"; 
                pArkadasBtn.className = "profil-action-btn btn-disabled";
                pArkadasBtn.onclick = () => window.arkadasliktanCikarIstek(hedefIsim);
            } else if (window.benimGidenIsteklerim && window.benimGidenIsteklerim.includes(hedefIsim)) {
                pArkadasBtn.innerHTML = "⏳ İstek Gönderildi"; 
                pArkadasBtn.className = "profil-action-btn btn-disabled";
                pArkadasBtn.onclick = null;
            } else if (window.benimGelenIsteklerim && window.benimGelenIsteklerim.includes(hedefIsim)) {
                pArkadasBtn.innerHTML = "✅ İsteği Kabul Et"; 
                pArkadasBtn.className = "profil-action-btn btn-success";
                pArkadasBtn.onclick = () => window.istekKabulEtMotor(hedefIsim);
            } else { 
                pArkadasBtn.innerHTML = "➕ Arkadaş Ekle"; 
                pArkadasBtn.className = "profil-action-btn btn-add-friend";
                pArkadasBtn.onclick = () => window.arkadasEkleIstek(hedefIsim);
            }
        }
        if(pDavetBtn) pDavetBtn.style.display = 'flex'; 
    } else { 
        if(pArkadasBtn) pArkadasBtn.style.display = 'none'; 
        if(pDavetBtn) pDavetBtn.style.display = 'none'; 
    }

    let tacIcon = ""; let ismRengi = "#fff"; let textGlow = "0 2px 10px rgba(0,0,0,0.5)";
    if(globalKozmetikler && globalKozmetikler[hedefIsim]) {
        if(globalKozmetikler[hedefIsim].includes('neon_tac')) tacIcon = "👑 ";
        if(globalKozmetikler[hedefIsim].includes('atesli_isim')) { ismRengi = "#ff4d4d"; textGlow = "0 0 10px rgba(255, 77, 77, 0.8)"; }
    }
    
    if(pIsim) {
        pIsim.innerHTML = tacIcon + hedefIsim; 
        pIsim.style.color = ismRengi; 
        pIsim.style.textShadow = textGlow;
    }

    const setStats = (cip, oynanan, kazanilan, oran, ligTxt, ligBg, unvanTxt) => {
        if(pDurum) { pDurum.innerHTML = isOnline ? "🟢 Çevrimiçi" : "⚫ Çevrimdışı"; pDurum.style.color = isOnline ? "#2ecc71" : "#7f8c8d"; }
        if(pCip) pCip.innerText = cip.toLocaleString('tr-TR'); 
        if(pOynanan) pOynanan.innerText = oynanan; 
        
        if(pKazanilan) pKazanilan.innerHTML = `
            <div class="stat-card"><span class="stat-icon">🏆</span><div class="stat-info"><span class="stat-lbl">Kazanılan</span><span class="stat-val text-green">${kazanilan}</span></div></div>
            <div class="stat-card"><span class="stat-icon">❌</span><div class="stat-info"><span class="stat-lbl">Kaybedilen</span><span class="stat-val text-red">${oynanan - kazanilan}</span></div></div>
        `;
        
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

window.esyaFirlatAksiyon = function(esyaIcon) {
    if(isMisafir) { ozelUyariGoster("⚠️ Eşya fırlatılamaz!"); return; } 
    const hedef = document.getElementById('profilArkadasBtn').dataset.hedef;
    let safCip = parseInt(String(benimAnlikCipim).replace(/[^0-9]/g, '')) || 0;
    
    if(!hedef || !suAnkiMasam || hedef === aktifKullaniciAdi || safCip < 5000) return;
    
    socket.emit('esya_firlat', { masaAdi: suAnkiMasam, kimden: aktifKullaniciAdi, kime: markup, esya: esyaIcon }); 
    document.getElementById('profilEkrani').style.display = 'none';
};
