socket.on('masalari_guncelle', (lobidekiMasalar) => {
    guncelMasalar = lobidekiMasalar; if(!masalarAlani) return; masalarAlani.innerHTML = '';
    Object.entries(lobidekiMasalar).forEach(([masaAdi, koltuklar]) => {
        const dolu = koltuklar.filter(k => k !== null).length; const benVarim = koltuklar.includes(aktifKullaniciAdi);
        const action = benVarim ? `masayaGeriDon('${masaAdi}')` : `masayaOtur('${masaAdi}')`; const txt = benVarim ? 'OTURDUN ✓' : (dolu>=4 ? 'DOLU' : 'OTUR');
        let izleBtn = !benVarim ? `<button class="btn-izle" onclick="masayiIzle('${masaAdi}')">👁️ İZLE</button>` : '';
        masalarAlani.innerHTML += `<div class="masa-kart"><div class="kart-sol">🎲 ${masaAdi}</div><div class="kart-sag"><div style="display:flex; gap:8px;">${izleBtn}<button class="btn-otur" onclick="${action}">${txt}</button></div></div></div>`;
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
socket.on('izleyici_olarak_katildin', (data) => { window.masayiTemizle(); suAnkiMasam = data.masaAdi; izleyiciModu = true; lobiEkrani.style.display = 'none'; masaEkrani.style.display = 'flex'; document.getElementById('masaOrtasiYazi').innerHTML = data.masaAdi.toUpperCase() + "<br><span style='font-size:9px; color:rgba(255,255,255,0.3);'>BEYCO GAMES</span>"; document.querySelector('.istaka-container').style.display = 'none'; document.querySelector('.okey-istaka-tuslar-area').style.display = 'none'; oyunuBaslatBtn.style.display = 'none'; if(data.oyunBasladi) { masaOyunBasladiMi = true; oyunAlanObjeleri.style.display = 'flex'; kalanTasBilgi.innerText = data.kalanTas; if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; } } window.gelişmişKoltukHizala(data.koltuklar); });
socket.on('vip_durum_guncelle', (data) => { if(suAnkiMasam === data.masaAdi) { suAnkiMasaGizliMi = data.gizli; if(btnVipGizlilikTetikle) { btnVipGizlilikTetikle.innerText = suAnkiMasaGizliMi ? "🔓 MASAYI HERKESE AÇ" : "🔒 MASAYI KİLİTLE"; btnVipGizlilikTetikle.style.background = suAnkiMasaGizliMi ? "#2ecc71" : "#ff33aa"; } } });
socket.on('vip_masa_kapandi', (data) => { if(suAnkiMasam === data.masaAdi) { alert("🚨 VIP oda sahibi masadan ayrıldığı için oda kapatıldı!"); window.masadanAyrilmaIslemi(false); } });

socket.on('masa_oyun_basladi', (data) => { 
    if(suAnkiMasam === data.masaAdi) { 
        window.masayiTemizle(); masaOyunBasladiMi = true; oyunuBaslatBtn.style.display = 'none'; oyunAlanObjeleri.style.display = 'flex'; bitisAlani.style.display = 'flex'; kalanTasBilgi.innerText = data.kalanTas; 
        if(data.gosterge) { document.getElementById('gostergeTasi').innerText = data.gosterge.sayi; document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`; window.checkGosterge(); } 
        window.gelişmişKoltukHizala(data.koltuklar); 
    } 
});

socket.on('masa_ortasi_guncelle', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        if(kalanTasBilgi) kalanTasBilgi.innerText = data.kalanTas;
        if(data.gosterge && document.getElementById('gostergeTasi')) {
            document.getElementById('gostergeTasi').innerText = data.gosterge.sayi;
            document.getElementById('gostergeTasi').className = `gosterge-tasi tas-${data.gosterge.renk}`;
        }
    }
});

socket.on('taslari_al', (data) => { if (data.kime === aktifKullaniciAdi && !izleyiciModu) { gostergeHakki = true; data.taslar.forEach((t, i) => window.tasEkle(t, 'y'+i)); window.checkGosterge(); } });
socket.on('tas_cekildi', (t) => { if(!izleyiciModu) { for(let i=0; i<24; i++) { if(document.getElementById('y'+i).children.length === 0) { window.tasEkle(t, 'y'+i); break; } } } });

socket.on('sira_guncelle', (data) => {
    if(suAnkiMasam === data.masaAdi) {
        benimSiramMi = (!izleyiciModu && data.kimde === aktifKullaniciAdi); if(benimSiramMi) sesCal(sesSiraSende);
        let bName = izleyiciModu ? document.getElementById('benimAdimKutusu').dataset.isim : aktifKullaniciAdi;
        const koltuklar = [ { id: 'benimAdimKutusu', isim: bName }, { id: 'seatRight', isim: document.getElementById('seatRight').dataset.isim }, { id: 'seatTop', isim: document.getElementById('seatTop').dataset.isim }, { id: 'seatLeft', isim: document.getElementById('seatLeft').dataset.isim } ];
        koltuklar.forEach(k => { const el = document.getElementById(k.id); if(el) { if(k.isim === data.kimde && k.isim !== "") el.classList.add('aktif-sira'); else el.classList.remove('aktif-sira'); } });
    }
});

// 🔥 İZLEYİCİLER İÇİN TAŞ GÖSTERME (DOM DATASET ODAKLI ÇÖZÜM) 🔥
socket.on('ortaya_tas_atildi', (data) => { 
    if(suAnkiMasam === data.masaAdi) { 
        let target = null;
        const right = document.getElementById('seatRight'); const top = document.getElementById('seatTop'); const left = document.getElementById('seatLeft'); const me = document.getElementById('benimAdimKutusu');
        if(right && data.kimAtti === right.dataset.isim) target = 'iskartaSag'; 
        else if(top && data.kimAtti === top.dataset.isim) target = 'iskartaUst'; 
        else if(left && data.kimAtti === left.dataset.isim) target = 'iskartaSol'; 
        else if(me && data.kimAtti === me.dataset.isim) target = 'benimIskartam'; 
        
        if(target) { 
            const kutu = document.getElementById(target); 
            if(kutu) {
                kutu.innerHTML = ''; 
                const div = document.createElement('div'); div.className = `okey-tasi tas-${data.tas.renk}`; div.innerText = data.tas.sayi; div.id = data.tas.id; 
                div.style.position = 'absolute'; div.style.top = '50%'; div.style.left = '50%'; div.style.transform = 'translate(-50%, -50%)'; div.style.margin = '0'; 
                div.style.pointerEvents = (target === 'iskartaSol' && !izleyiciModu) ? 'auto' : 'none'; 
                kutu.appendChild(div); sesCal(sesTasKoy); 
            }
        } 
    } 
});

socket.on('yandan_alindi_guncelle', (data) => { 
    if(data.masaAdi === suAnkiMasam && data.kimAldi !== aktifKullaniciAdi) { 
        let source = null; 
        const right = document.getElementById('seatRight'); const top = document.getElementById('seatTop'); const left = document.getElementById('seatLeft'); const me = document.getElementById('benimAdimKutusu');
        if(right && data.kimAldi === right.dataset.isim) source = 'benimIskartam'; 
        else if(top && data.kimAldi === top.dataset.isim) source = 'iskartaSag'; 
        else if(left && data.kimAldi === left.dataset.isim) source = 'iskartaUst'; 
        else if(me && data.kimAldi === me.dataset.isim) source = 'iskartaSol'; 
        
        if(source) { 
            document.getElementById(source).innerHTML = ''; 
            if(source === 'benimIskartam' && !izleyiciModu) document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; 
            sesCal(sesTasCek); 
        } 
    } 
});

socket.on('hatali_bitis', (data) => { ozelUyariGoster(data.mesaj); const atilanTas = document.getElementById(data.tasId); if(atilanTas && atilanTas.parentNode === bitisAlani) { for(let i=0; i<24; i++) { let yuva = document.getElementById('y'+i); if(yuva.children.length === 0) { atilanTas.style.position = 'relative'; atilanTas.style.top = 'auto'; atilanTas.style.left = 'auto'; atilanTas.style.transform = 'none'; yuva.appendChild(atilanTas); break; } } } });
socket.on('hata_mesaji', (mesaj) => { ozelUyariGoster(mesaj); if (suAnkiMasam && !masaOyunBasladiMi) { suAnkiMasam = null; masaEkrani.style.display = 'none'; lobiEkrani.style.display = 'flex'; } });
socket.on('esya_firlatildi', (data) => { if(data.masaAdi !== suAnkiMasam) return; let senderEl = null; let receiverEl = null; ['benimAdimKutusu', 'seatRight', 'seatTop', 'seatLeft'].forEach(id => { const el = document.getElementById(id); if(!el) return; let isim = id === 'benimAdimKutusu' ? (izleyiciModu ? el.dataset.isim : aktifKullaniciAdi) : el.dataset.isim; if(isim === data.kimden) senderEl = el; if(isim === data.kime) receiverEl = el; }); if(senderEl && receiverEl) { const sRect = senderEl.getBoundingClientRect(); const rRect = receiverEl.getBoundingClientRect(); const uE = document.createElement('div'); uE.innerText = data.esya; uE.style = `position:fixed; left:${sRect.left}px; top:${sRect.top}px; font-size:45px; z-index:999999; transition:all 1s; pointer-events:none;`; document.body.appendChild(uE); setTimeout(() => { uE.style.left = rRect.left + 'px'; uE.style.top = rRect.top + 'px'; }, 50); setTimeout(() => { uE.remove(); }, 1050); } });
socket.on('yeni_sohbet_mesaji', (data) => { if(data.masaAdi === suAnkiMasam) { let isimRenk = data.isim === "Sistem" ? "#2ecc71" : "#f2c94c"; let tacIcon = ""; if (data.kozmetikler) { if(data.kozmetikler.includes('atesli_isim')) { isimRenk = "#ff4d4d"; } if(data.kozmetikler.includes('neon_tac')) { tacIcon = "👑 "; } } const div = document.createElement('div'); div.className = 'pro-mesaj'; div.innerHTML = `<span class="pro-mesaj-isim" style="color:${isimRenk};">${tacIcon}${data.isim}</span>${data.mesaj}`; const mesajAlani = document.getElementById('sohbetMesajlari'); if(mesajAlani) { mesajAlani.appendChild(div); mesajAlani.scrollTop = mesajAlani.scrollHeight; } const anlikDiv = document.createElement('div'); anlikDiv.className = 'anlik-mesaj'; anlikDiv.innerHTML = `<strong style="color:${isimRenk};">${tacIcon}${data.isim}:</strong> ${data.mesaj}`; document.getElementById('anlikMesajAlani')?.appendChild(anlikDiv); setTimeout(() => { anlikDiv.remove(); }, 4000); } });
socket.on('yeni_vip_emoji', (data) => { if(data.masaAdi === suAnkiMasam) { const div = document.createElement('div'); div.className = 'ucan-emoji'; div.innerText = data.emoji; document.getElementById('masaEkrani').appendChild(div); setTimeout(() => { div.remove(); }, 2500); } });
socket.on('admin_flash_mesaj', (mesaj) => { const flash = document.getElementById('flashBildirim'); if (flash) { flash.innerHTML = `👑 PATRON DUYURUSU 👑<br><span style="font-size:18px; color:#fff; text-transform:none; margin-top:5px; display:block;">${mesaj}</span>`; flash.style.background = "linear-gradient(135deg, #c0392b, #8e44ad)"; flash.style.boxShadow = "0 15px 40px rgba(0,0,0,0.85), 0 0 25px rgba(192, 57, 43, 0.8)"; flash.style.borderColor = "#f2c94c"; flash.classList.remove('goster'); void flash.offsetWidth; flash.classList.add('goster'); setTimeout(() => { flash.style.background = ""; flash.style.boxShadow = ""; flash.style.borderColor = ""; }, 3500); } });
socket.on('admin_islem_uyarisi', (data) => { if(data.isim === aktifKullaniciAdi) { if(data.islem === 'kick') { ozelUyariGoster("🚨 YÖNETİCİ TARAFINDAN MASADAN ATILDINIZ!"); if(suAnkiMasam) { window.masadanAyrilmaIslemi(false); } } else if(data.islem === 'ban') { ozelUyariGoster("🛑 HESABINIZ SİSTEMDEN SINIRSIZ BANLANDI!"); location.reload(); } } });

socket.on('oyun_bitti', (data) => { 
    if(suAnkiMasam === data.masaAdi) { 
        const sonucEkrani = document.getElementById('sonucEkrani'); const baslik = document.getElementById('sonucBaslik'); const metin = document.getElementById('sonucMetin'); const odul = document.getElementById('sonucOdul'); 
        if(auth.currentUser && !isMisafir && !izleyiciModu && data.kazanan && !aktifBotlar.includes(data.kazanan) && !data.kazanan.startsWith('Misafir_')) {
            const userRef = db.collection("kullanicilar").doc(auth.currentUser.uid);
            if(data.kazanan === aktifKullaniciAdi) { userRef.update({ oynananOyun: firebase.firestore.FieldValue.increment(1), kazanilanOyun: firebase.firestore.FieldValue.increment(1) }); benimKazanilanOyun++; benimGorevler.kazanma++; gorevleriKaydet(); window.arayuzGuncelle(); } 
            else { userRef.update({ oynananOyun: firebase.firestore.FieldValue.increment(1) }); }
        }
        if (data.kazanan) { 
            if (data.kazanan === aktifKullaniciAdi) { baslik.innerText = data.okeyleBittiMi ? "🔥 OKEYLE BİTİRDİN! 🔥" : "🏆 TEBRİKLER, KAZANDIN! 🏆"; baslik.style.color = data.okeyleBittiMi ? "#ff3333" : "#f2c94c"; } else { baslik.innerText = data.okeyleBittiMi ? "🚨 RAKİP OKEY ATTI! 🚨" : "🎉 OYUN BİTTİ 🎉"; baslik.style.color = data.okeyleBittiMi ? "#ff3333" : "#f2c94c"; } 
            metin.innerText = `Kazanan: ${data.kazanan}\nSebep: ${data.sebep}`; odul.innerText = `+${data.odul.toLocaleString('tr-TR')} ÇİP`; sesCal(sesSiraSende); 
        } else { baslik.innerText = "🛑 OYUN BİTTİ 🛑"; baslik.style.color = "#dc3545"; metin.innerText = data.sebep || "Masadaki herkes ayrıldı."; odul.innerText = ""; } 
        sonucEkrani.style.display = 'flex'; const flash = document.getElementById('flashBildirim'); if (flash) flash.classList.remove('goster'); oyunAlanObjeleri.style.display = 'none'; if(document.getElementById('gostergeBtn')) document.getElementById('gostergeBtn').style.display = 'none'; gostergeHakki = false; 
        if (!izleyiciModu) { oyunuBaslatBtn.innerText = "🔄 AYNI MASADA TEKRAR OYNA"; oyunuBaslatBtn.style.display = 'block'; }
        bitisAlani.style.display = 'none'; masaKasaBilgisi.style.display = 'none'; bitisAlani.innerHTML = 'BİTİR<br>🏆'; 
        for(let i=0; i<24; i++) document.getElementById('y'+i).innerHTML = ''; document.getElementById('benimIskartam').innerHTML = '<div class="iskarta-yazi" id="iskartaYazi">TAŞ AT<br>⬇</div>'; document.getElementById('iskartaSag').innerHTML = ''; document.getElementById('iskartaSol').innerHTML = ''; document.getElementById('iskartaUst').innerHTML = ''; benimSiramMi = false; masaOyunBasladiMi = false; 
    } 
});
