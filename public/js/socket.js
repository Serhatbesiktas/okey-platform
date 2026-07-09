// 🔥 GÖSTERGE BAŞARILI SİNYALİ (GÖREV GÜNCELLEME VE SES) EKLENDİ 🔥
socket.on('gosterge_basarili', (data) => {
    if (data.isim === aktifKullaniciAdi && !izleyiciModu) {
        if(typeof benimGorevler !== 'undefined') {
            benimGorevler.gosterge++; // Gösterge görevini +1 yap
            if(typeof gorevleriKaydet === 'function') gorevleriKaydet();
            if(typeof window.renderGorevler === 'function') window.renderGorevler();
        }
    }
    sesCal(sesSiraSende);
});

socket.on('cip_guncelle_ozel', (data) => {
    if(data.isim === aktifKullaniciAdi) {
        benimAnlikCipim = data.cip;
        const cipKutu = document.getElementById('benimCipim');
        if(cipKutu) {
            cipKutu.innerText = benimAnlikCipim.toLocaleString('tr-TR');
            cipKutu.style.color = "#f1c40f"; 
            cipKutu.style.transform = "scale(1.1)";
            setTimeout(() => { cipKutu.style.color = ""; cipKutu.style.transform = "scale(1)"; }, 1500);
        }
        if(typeof auth !== 'undefined' && auth.currentUser && !isMisafir) {
            db.collection("kullanicilar").doc(auth.currentUser.uid).update({ cip: benimAnlikCipim }).catch(e => console.log("Cip kayit hatasi: ", e));
        }
    }
});

socket.on('cip_guncelle', (cip) => {
    benimAnlikCipim = cip;
    if(document.getElementById('benimCipim')) {
        document.getElementById('benimCipim').innerText = benimAnlikCipim.toLocaleString('tr-TR');
    }
});

// ⸻ AMİRAL GEMİSİ: KOMPAKT, PREMİUM VE 3 SÜTUNLU LOBİ HTML RENDER DÖNGÜSÜ ⸻
socket.on('masalari_guncelle', (lobidekiMasalar) => {
    guncelMasalar = lobidekiMasalar; 
    if(!masalarAlani) return; 
    masalarAlani.innerHTML = '';
    
    Object.entries(lobidekiMasalar).forEach(([masaAdi, koltuklar]) => {
        const dolu = koltuklar.filter(k => k !== null).length; 
        const benVarim = koltuklar.includes(aktifKullaniciAdi);
        
        // Mantık fonksiyonları aynı
        const action = benVarim ? `masayaGeriDon('${masaAdi}')` : `masayaOtur('${masaAdi}')`; 
        
        // İnce ve sade VIP algılama
        const isVIP = masaAdi.toUpperCase().includes('VIP') || masaAdi.includes('50K') || masaAdi.includes('100K');
        const vipClass = isVIP ? 'vip-board' : '';
        const vipBadge = isVIP ? '<div class="vip-badge-tag">👑 VIP</div>' : '';

        // Aksiyon Butonları Metin ve Sınıfı
        const txt = benVarim ? 'OTURDUN ✓' : (dolu >= 4 ? 'MASA DOLU' : 'OTUR');
        const btnDisabled = (dolu >= 4 && !benVarim) ? 'disabled' : '';
        const btnClass = dolu >= 4 && !benVarim ? 'disabled' : '';
        const izleBtn = (!benVarim && dolu > 0) ? `<button class="btn-izle" onclick="masayiIzle('${masaAdi}')">İZLE</button>` : '';

        // Orta Masadaki 4 Koltuğu (2x2 Grid) Doldur
        let koltukHtml = '';
        const defaultAvatars = ["😀", "😎", "🙂", "🤩"];
        for(let i = 0; i < 4; i++) {
            if(koltuklar[i]) {
                let koz = (globalKozmetikler && globalKozmetikler[koltuklar[i]]) || [];
                let emoji = defaultAvatars[i % 4];
                if(koz.includes('neon_tac')) emoji = "👑";
                koltukHtml += `<div class="mini-koltuk dolu" title="${koltuklar[i]}">${emoji}</div>`;
            } else {
                koltukHtml += `<div class="mini-koltuk bos">+</div>`;
            }
        }

        // Yeni Kompakt 3 Sütunlu HTML Yerleşimi
        masalarAlani.innerHTML += `
        <div class="masa-kart ${vipClass}">
            <div class="masa-sol">
                <div class="masa-adi">🎲 ${masaAdi}</div>
                ${vipBadge}
            </div>
            
            <div class="masa-orta">
                <div class="mini-masa-oval">
                    ${koltukHtml}
                </div>
            </div>
            
            <div class="masa-sag">
                <div class="masa-oyuncu-sayisi">👥 ${dolu} / 4</div>
                <div class="masa-aksiyon">
                    ${izleBtn}
                    <button class="btn-otur ${btnClass}" onclick="${action}" ${btnDisabled}>${txt}</button>
                </div>
            </div>
        </div>`;
        
        if(benVarim) window.gelişmişKoltukHizala(koltuklar);
    });
});

socket.on('online_oyuncular', (liste) => {
    onlineOyuncularListesi = liste; const lobiDiv = document.getElementById('lobidekilerListesi'); if(!lobiDiv) return; lobiDiv.innerHTML = '';
    liste.forEach(o => { if(o !== aktifKullaniciAdi) lobiDiv.innerHTML += `<div class="lobi-oyuncu-satir"><span class="lobi-oyuncu-isim" onclick="profiliGoster('${o}')">🟢 ${o}</span><button class="btn-arkadas-ekle" onclick="arkadasEkle('${o}')">+ Ekle</button></div>`; });
});

socket.on('liderlik_tablosu_guncelle', (list) => {
    const div = document.getElementById('liderlikListesi'); div.innerHTML = '';
    list.forEach((o, i) => { div.innerHTML += `<div class="lider-satir" onclick="profiliGoster('${o.isim}')"><div class="lider-sira">${i+1}.</div><div class="lider-isim">${o.isim}</div><div class="lider-cip">${Number(o.cip).toLocaleString()} ÇİP</div></div>`; });
});

socket.on('sen_masadasin', (data) => { window.masayiTemizle(); suAnkiMasam = data.masaAdi || data; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; document.getElementById('masaOrtasiYazi').innerHTML = suAnkiMasam.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>"; socket.emit('masaya_geri_don', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi }); });
socket.on('izleyici_olarak_katildin', (data) => { window.masayiTemizle(); suAnkiMasam = data.masaAdi; izleyiciModu = true; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; document.getElementById('masaOrtasiYazi').innerHTML = data.masaAdi.toUpperCase() + "<br><span style='font-size:10px; color:#f2c94c;'>İzleyici Modu</span>"; document.querySelector('.istaka-container').style.display = 'none'; document.querySelector('.okey-istaka-tuslar-area').style.display = 'none'; oyunuBaslatBtn.style.display = 'none'; if(data.oyunBasladi) { masaOyunBasladiMi = true; oyunAlanObjeleri.style.display = 'flex'; kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; } } window.gelişmişKoltukHizala(data.koltuklar); });
socket.on('vip_durum_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { suAnkiMasaGizliMi = data.gizli; if(btnVipGizlilikTetikle) { btnVipGizlilikTetikle.innerText = suAnkiMasaGizliMi ? "🔓 MASAYI HERKESE AÇ" : "🔒 MASAYI KİLİTLE"; btnVipGizlilikTetikle.style.background = suAnkiMasaGizliMi ? "#2ecc71" : "#ff33aa"; } } });
socket.on('vip_masa_kapandi', (data) => { if(suAnkiMasam === data.masaAdi) { alert("🚨 VIP oda sahibi masadan ayrıldığı için oda kapatıldı!"); window.masadanAyrilmaIslemi(false); } });

socket.on('masa_oyun_basladi', (data) => { 
    if(suAnkiMasam === data.masaAdi) { 
        window.masayiTemizle(); masaOyunBasladiMi = true; oyunuBaslatBtn.style.display = 'none'; oyunAlanObjeleri.style.display = 'flex'; bitisAlani.style.display = 'flex'; kalanTasBilgi.innerText = data.kalanTas; 
        if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; window.checkGosterge(); } 
        window.gelişmişKoltukHizala(data.koltuklar); 
    } 
});

socket.on('masa_ortasi_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { if(kalanTasBilgi) kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge && document.getElementById('gostergeTasi')) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; } } });
socket.on('taslari_al', (data) => { if (data.kime === aktifKullaniciAdi && !izleyiciModu) { gostergeHakki = true; data.taslar.forEach((t, i) => window.tasEkle(t, 'y'+i)); window.checkGosterge(); } });
socket.on('tas_cekildi', (t) => { if(!izleyiciModu) { for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { window.tasEkle(t, 'y'+i); break; } } } });

socket.on('sira_guncelle', (data) => {
    document.querySelectorAll('.turn-timer-bar').forEach(e => e.remove());
    
    ['seatTop', 'seatLeft', 'seatRight'].forEach(id => { let el = document.getElementById(id); if(el) { el.style.boxShadow = 'none'; el.style.border = 'none'; } });
    let myRack = document.getElementById('benimIstakam');
    if(myRack) myRack.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)'; 

    if (window.suAnkiMasam !== data.masaAdi) return;

    const gBtn = document.getElementById('gostergeBtn');
    if(gBtn) gBtn.style.display = 'none';

    let isMyTurn = (data.kimde === window.aktifKullaniciAdi);
    if(isMyTurn) {
        if(myRack) myRack.style.boxShadow = '0 0 25px #2ecc71, inset 0 0 15px #2ecc71';
        
        if (window.gostergeTasiObj && window.gostergeGosterildi === false) {
            let gRenk = window.gostergeTasiObj.renk;
            let gSayi = String(window.gostergeTasiObj.sayi).trim();
            let varMi = false;
            for(let i=0; i<24; i++) {
                let yuva = document.getElementById('y'+i);
                if(yuva.children.length > 0) {
                    let t = yuva.children[0];
                    let tRenkClass = Array.from(t.classList).find(c => c.startsWith('tas-'));
                    if(tRenkClass && tRenkClass.replace('tas-', '') === gRenk && String(t.innerText).trim() === gSayi) {
                        varMi = true; break;
                    }
                }
            }
            if (varMi && gBtn) gBtn.style.display = 'block';
        }

    } else if (window.masaKoltukMapping) {
        let elId = null;
        if(window.masaKoltukMapping.right === data.kimde) elId = 'seatRight';
        else if(window.masaKoltukMapping.top === data.kimde) elId = 'seatTop';
        else if(window.masaKoltukMapping.left === data.kimde) elId = 'seatLeft';
        
        if(elId) { let seat = document.getElementById(elId); if(seat) { seat.style.boxShadow = '0 0 20px #2ecc71'; seat.style.border = '2px solid #2ecc71'; } }
    }

    let centerDiv = document.getElementById('masaKasaBilgisi');
    if(centerDiv) {
        let container = document.createElement('div'); container.className = 'turn-timer-bar';
        container.style.cssText = "width: 100%; max-width: 150px; height: 8px; background: rgba(0,0,0,0.8); border-radius: 4px; margin: 10px auto 0; overflow: hidden; border: 1px solid #555; position: absolute; left: 50%; transform: translateX(-50%); top: 100%;";
        let bar = document.createElement('div'); bar.style.cssText = "height: 100%; width: 100%; background: #2ecc71; animation: shrinkBar 15s linear forwards;";
        container.appendChild(bar); centerDiv.appendChild(container);
    }
});

socket.on('oto_tas_atildi_istemci', (data) => {
    if(data.kim === window.aktifKullaniciAdi) {
        let tasEl = document.getElementById(data.tas.id);
        if(tasEl) tasEl.remove(); 
        if(window.seciliTas && window.seciliTas.id === data.tas.id) window.seciliTas = null; 
    }
});

socket.on('oyun_bitti', (data) => {
    if (window.suAnkiMasam !== data.masaAdi) return;

    let htmlIcerik = "";
    if (data.bitisEli && Array.isArray(data.bitisEli) && data.bitisEli.length > 0) {
        let siraliEl = [...data.bitisEli];
        siraliEl.forEach(tas => {
            if(!tas) return; 
            let textColor = '#111';
            if(tas.renk === 'kirmizi') textColor = '#cc0000';
            else if(tas.renk === 'mavi') textColor = '#0000cc';
            else if(tas.renk === 'sari') textColor = '#d4af37';
            
            let displaySayi = tas.sayi === 'S' ? '☻' : tas.sayi;
            htmlIcerik += `<div class="okey-tasi-bitis" style="position:relative; width:26px; height:38px; font-size:16px; font-weight:900; color:${textColor}; border-radius:4px; display:flex; justify-content:center; align-items:center; margin:2px;">${displaySayi}</div>`;
        });
    } else {
        htmlIcerik = '<span style="color:#aaa; font-size:12px;">Sunucudan taş bilgisi alınamadı.</span>';
    }

    setTimeout(() => {
        let sEkrani = document.getElementById('sonucEkrani');
        if (sEkrani) sEkrani.style.display = 'flex';
        
        let sBaslik = document.getElementById('sonucBaslik');
        let sMetin = document.getElementById('sonucMetin');
        let sOdul = document.getElementById('sonucOdul');
        
        if (data.kazanan) {
            if(sBaslik) sBaslik.innerHTML = (data.kazanan === window.aktifKullaniciAdi) ? '🏆 TEBRİKLER, KAZANDIN! 🏆' : '😢 OYUN BİTTİ!';
            if(sMetin) sMetin.innerHTML = 'Kazanan: ' + data.kazanan + '<br>Sebep: ' + data.sebep;
            if(sOdul) sOdul.innerHTML = '+' + (data.odul || 0).toLocaleString('tr-TR') + ' ÇİP';
            
            let elAlani = document.getElementById('kazananEliAlani');
            if (elAlani) {
                elAlani.innerHTML = htmlIcerik; 
                let vurusSayisi = 0;
                let civiMotoru = setInterval(() => {
                    let hedefKutu = document.getElementById('kazananEliAlani');
                    if(hedefKutu) hedefKutu.innerHTML = htmlIcerik;
                    vurusSayisi++;
                    if(vurusSayisi > 10) clearInterval(civiMotoru); 
                }, 200);
            }
        } else {
            if(sBaslik) sBaslik.innerHTML = '⚖️ BERABERE!';
            if(sMetin) sMetin.innerHTML = data.sebep;
            if(sOdul) sOdul.innerHTML = '';
            let elAlani = document.getElementById('kazananEliAlani');
            if(elAlani) elAlani.innerHTML = '';
        }
    }, 150); 
    
    // Temizleme rutinleri bozulmadan korunur
    sonucEkrani.style.display = 'flex'; 
    const flash = document.getElementById('flashBildirim'); 
    if (flash) flash.classList.remove('goster'); 
    oyunAlanObjeleri.style.display = 'none'; 
    if(document.getElementById('gostergeBtn')) document.getElementById('gostergeBtn').style.display = 'none'; 
    gostergeHakki = false; 
    if (!izleyiciModu) { oyunuBaslatBtn.innerText = "🔄 AYNI MASADA TEKRAR OYNA"; oyunuBaslatBtn.style.display = 'block'; }
    bitisAlani.style.display = 'none'; masaKasaBilgisi.style.display = 'none'; bitisAlani.innerHTML = 'BİTİR<br>🏆'; 
    for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; 
    document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; 
    document.getElementById('iskartaSag').innerHTML = ''; document.getElementById('iskartaSol').innerHTML = ''; document.getElementById('iskartaUst').innerHTML = ''; 
    benimSiramMi = false; masaOyunBasladiMi = false;
});

if(typeof socket !== 'undefined') {

    socket.on('sync_iskartalar', (data) => {
        if (window.suAnkiMasam !== data.masaAdi) return;
        
        ['iskartaUst', 'iskartaSag', 'iskartaSol', 'benimIskartam'].forEach(id => {
            let el = document.getElementById(id);
            if(el) {
                if(id === 'benimIskartam' && (!data.iskartalar[window.aktifKullaniciAdi] || data.iskartalar[window.aktifKullaniciAdi].length === 0)) {
                    el.innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>';
                } else {
                    el.innerHTML = '';
                }
            }
        });

        for(let player in data.iskartalar) {
            let tDiv = 'benimIskartam';
            if(window.masaKoltukMapping) {
                if(window.masaKoltukMapping.right === player) tDiv = 'iskartaSag';
                else if(window.masaKoltukMapping.top === player) tDiv = 'iskartaUst';
                else if(window.masaKoltukMapping.left === player) tDiv = 'iskartaSol';
            }
            
            let k = document.getElementById(tDiv);
            if(k && Array.isArray(data.iskartalar[player])) {
                if (data.iskartalar[player].length > 0) {
                    if(tDiv === 'benimIskartam' && document.getElementById('iskartaYazi')) {
                        document.getElementById('iskartaYazi').style.display = 'none';
                    }
                    data.iskartalar[player].forEach((tas, index) => {
                        if(!tas) return;
                        let topOffset = index * -4;
                        let leftOffset = index * 2;
                        k.innerHTML += `<div class="okey-tasi tas-${tas.renk}" style="position:absolute; top:50%; left:50%; transform:translate(calc(-50% + ${leftOffset}px), calc(-50% + ${topOffset}px)) !important; box-shadow:0 2px 5px rgba(0,0,0,0.8); margin:0;">${tas.sayi}</div>`;
                    });
                }
            }
        }
    });

    socket.on('masa_oyun_basladi', (data) => {
        window.gostergeTasiObj = data.gosterge;
        window.gostergeGosterildi = false;
        const gBtn = document.getElementById('gostergeBtn');
        if(gBtn) gBtn.style.display = 'none';
    });

    socket.on('masa_ortasi_guncelle', (data) => {
        window.gostergeTasiObj = data.gosterge;
    });

    socket.on('sira_guncelle', (data) => {
        document.querySelectorAll('.turn-timer-bar').forEach(e => e.remove());
        
        ['seatTop', 'seatLeft', 'seatRight'].forEach(id => { let el = document.getElementById(id); if(el) { el.style.boxShadow = 'none'; el.style.border = 'none'; } });
        let myRack = document.getElementById('benimIstakam');
        if(myRack) myRack.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)'; 

        if (window.suAnkiMasam !== data.masaAdi) return;

        const gBtn = document.getElementById('gostergeBtn');
        if(gBtn) gBtn.style.display = 'none';

        let isMyTurn = (data.kimde === window.aktifKullaniciAdi);
        if(isMyTurn) {
            if(myRack) myRack.style.boxShadow = '0 0 25px #2ecc71, inset 0 0 15px #2ecc71';
            
            if (window.gostergeTasiObj && window.gostergeGosterildi === false) {
                let gRenk = window.gostergeTasiObj.renk;
                let gSayi = String(window.gostergeTasiObj.sayi).trim();
                let varMi = false;
                for(let i=0; i<24; i++) {
                    let yuva = document.getElementById('y'+i);
                    if(yuva.children.length > 0) {
                        let t = yuva.children[0];
                        let tRenkClass = Array.from(t.classList).find(c => c.startsWith('tas-'));
                        if(tRenkClass && tRenkClass.replace('tas-', '') === gRenk && String(t.innerText).trim() === gSayi) {
                            varMi = true; break;
                        }
                    }
                }
                if (varMi && gBtn) gBtn.style.display = 'block';
            }

        } else if (window.masaKoltukMapping) {
            let elId = null;
            if(window.masaKoltukMapping.right === data.kimde) elId = 'seatRight';
            else if(window.masaKoltukMapping.top === data.kimde) elId = 'seatTop';
            else if(window.masaKoltukMapping.left === data.kimde) elId = 'seatLeft';
            
            if(elId) { let seat = document.getElementById(elId); if(seat) { seat.style.boxShadow = '0 0 20px #2ecc71'; seat.style.border = '2px solid #2ecc71'; } }
        }

        let centerDiv = document.getElementById('masaKasaBilgisi');
        if(centerDiv) {
            let container = document.createElement('div'); container.className = 'turn-timer-bar';
            container.style.cssText = "width: 100%; max-width: 150px; height: 8px; background: rgba(0,0,0,0.8); border-radius: 4px; margin: 10px auto 0; overflow: hidden; border: 1px solid #555; position: absolute; left: 50%; transform: translateX(-50%); top: 100%;";
            let bar = document.createElement('div'); bar.style.cssText = "height: 100%; width: 100%; background: #2ecc71; animation: shrinkBar 15s linear forwards;";
            container.appendChild(bar); centerDiv.appendChild(container);
        }
    });

    socket.on('oto_tas_atildi_istemci', (data) => {
        if(data.kim === window.aktifKullaniciAdi) {
            let tasEl = document.getElementById(data.tas.id);
            if(tasEl) tasEl.remove(); 
            if(window.seciliTas && window.seciliTas.id === data.tas.id) window.seciliTas = null; 
        }
    });

    socket.on('masa_temizlendi', (data) => {
        if(window.suAnkiMasam === data.masaAdi) {
            if (typeof window.masayiTemizle === 'function') window.masayiTemizle();
        }
    });

    socket.on('masa_sohbet_balonu', (data) => {
        if(window.suAnkiMasam !== data.masaAdi) return;
        let elId = 'benimAdimKutusu';
        let ozelStil = 'top: -50px; left: 50%; transform: translateX(-50%);'; 
        if(window.masaKoltukMapping) {
            if(window.masaKoltukMapping.right === data.isim) { elId = 'seatRight'; ozelStil = 'top: 50%; right: 110%; transform: translateY(-50%);'; }
            else if(window.masaKoltukMapping.top === data.isim) { elId = 'seatTop'; ozelStil = 'top: 110%; left: 50%; transform: translateX(-50%);'; }
            else if(window.masaKoltukMapping.left === data.isim) { elId = 'seatLeft'; ozelStil = 'top: 50%; left: 110%; transform: translateY(-50%);'; }
        }
        let target = document.getElementById(elId);
        if(target) {
            let b = document.createElement('div');
            b.innerText = data.mesaj;
            b.style.cssText = ozelStil + " position: absolute; background: linear-gradient(135deg, #f1c40f, #f39c12); color: #111; padding: 8px 12px; border-radius: 12px; font-size: 11px; font-weight: 900; white-space: nowrap; box-shadow: 0 4px 15px rgba(0,0,0,0.5); z-index: 9999;";
            target.parentElement.style.position = 'relative';
            target.appendChild(b);
            setTimeout(() => { b.style.opacity = '0'; b.style.transition = 'all 0.5s'; }, 3500);
            setTimeout(() => b.remove(), 4000);
        }
    });

    socket.on('gosterge_basarili', (data) => {
        if(data.isim === window.aktifKullaniciAdi) {
            if(window.bildirimGoster) window.bildirimGoster(`⭐ GÖSTERGE YAPILDI! ${data.odul.toLocaleString('tr-TR')} ÇİP KAZANDIN!`, "basari");
            const gBtn = document.getElementById('gostergeBtn'); 
            if(gBtn) gBtn.style.display = 'none';
            window.gostergeGosterildi = true;
        }
    });
    
    socket.on('kozmetikleri_guncelle', (data) => { window.globalKozmetikler = data; });
}
