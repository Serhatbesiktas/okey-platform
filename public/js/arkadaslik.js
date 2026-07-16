// public/js/arkadaslik.js
// ==========================================
// BEYCO GAMES - ARKADAŞLIK SİSTEMİ (İstek / Kabul / Red / Sil / Online-Offline-Son Görülme)
//
// Bu dosya daha önce sadece sunucu tarafında (server.js) iskeleti bulunan ama
// istemciye hiç bağlanmamış arkadaşlık altyapısını tamamlar.
//
// Mimari kararı: Her kullanıcı SADECE KENDİ Firestore dokümanına yazar.
// Karşı tarafın dokümanına asla doğrudan yazılmaz (çoğu Firestore kural
// setinde buna izin verilmez). İstek/kabul/red koordinasyonu, katılımcılara
// özel yeni bir koleksiyon (arkadaslikIstekleri) üzerinden, gerçek zamanlı
// onSnapshot dinleyicileriyle yapılır — mesajlar.js'in zaten kullandığı
// desenin aynısı.
//
// Bağımlılıklar (bu dosyadan ÖNCE yüklenmiş olmalı): globals.js, auth.js,
// mesajlar.js (engellenenKullanicilar için).
// ==========================================

(function () {

    // ---------------------------------------------
    // ORTAK DURUM
    // ---------------------------------------------
    window.benimGonderilenIstekler = window.benimGonderilenIstekler || new Set(); // cevap bekleyen, bana gönderdiğim istekler (hedef isim)
    let benimGelenIsteklerim = [];        // [{id, gonderenIsim, ...}]
    let bilinenGelenIstekIdleri = new Set();
    let sonGorulmeCache = {};             // isim -> Date | null

    let dinleyiciGelenIstekler = null;
    let dinleyiciGidenIstekler = null;
    let dinleyiciKendiProfilim = null;
    let dinleyiciSilmeSinyalleri = null;
    let sonGorulmeInterval = null;

    function istekIdUret(gonderenIsim, aliciIsim) {
        return encodeURIComponent(gonderenIsim) + "__" + encodeURIComponent(aliciIsim);
    }

    function hataGoster(baglam, err) {
        console.error("[arkadaslik]", baglam, err);
        ozelUyariGoster("⚠️ İşlem şu anda tamamlanamadı. Lütfen tekrar deneyin.");
    }

    function misafirMi(isim) {
        if (!isim) return false;
        const u = isim.toUpperCase();
        return u.startsWith("MİSAFİR") || u.startsWith("MISAFIR");
    }

    // ---------------------------------------------
    // 1) ARKADAŞLIK İSTEĞİ GÖNDER
    //    (window.arkadasEkle -> geriye dönük uyumluluk için alias, en altta)
    // ---------------------------------------------
    window.arkadaslikIstegiGonder = function (hedefIsim) {
        if (isMisafir) { ozelUyariGoster("⚠️ Misafirler arkadaşlık isteği gönderemez."); return; }
        if (!hedefIsim || !aktifKullaniciAdi) return;
        if (hedefIsim === aktifKullaniciAdi) { ozelUyariGoster("⚠️ Kendine arkadaşlık isteği gönderemezsin."); return; }
        if (misafirMi(hedefIsim)) { ozelUyariGoster("⚠️ Misafir oyunculara arkadaşlık isteği gönderilemez."); return; }
        if (benimArkadaslarim.includes(hedefIsim)) { ozelUyariGoster("ℹ️ Zaten arkadaşsınız."); return; }
        if (window.benimGonderilenIstekler.has(hedefIsim)) { ozelUyariGoster("ℹ️ Bu oyuncuya zaten istek gönderdin."); return; }
        if (typeof engellenenKullanicilar !== 'undefined' && Array.isArray(engellenenKullanicilar) && engellenenKullanicilar.includes(hedefIsim)) {
            ozelUyariGoster("⚠️ Engellediğin bir kişiye arkadaşlık isteği gönderemezsin.");
            return;
        }
        if (!auth.currentUser) { ozelUyariGoster("⚠️ Oturum bulunamadı, lütfen tekrar giriş yapın."); return; }

        const benimUID = auth.currentUser.uid;

        db.collection("kullanicilar").where("isim", "==", hedefIsim).limit(1).get().then((q) => {
            if (q.empty) { ozelUyariGoster("⚠️ Bu oyuncuya şu anda arkadaşlık isteği gönderilemiyor."); return; }
            const hedefDoc = q.docs[0];
            const hedefData = hedefDoc.data();
            const hedefUID = hedefDoc.id;

            if (Array.isArray(hedefData.engellenenler) && hedefData.engellenenler.includes(aktifKullaniciAdi)) {
                ozelUyariGoster("⚠️ Bu oyuncuya arkadaşlık isteği gönderilemiyor.");
                return;
            }

            const kendiIstekId = istekIdUret(aktifKullaniciAdi, hedefIsim);
            const karsiIstekId = istekIdUret(hedefIsim, aktifKullaniciAdi);
            const kendiRef = db.collection("arkadaslikIstekleri").doc(kendiIstekId);
            const karsiRef = db.collection("arkadaslikIstekleri").doc(karsiIstekId);

            kendiRef.get().then((mevcut) => {
                if (mevcut.exists) { ozelUyariGoster("ℹ️ Bu oyuncuya zaten istek gönderdin."); return; }

                karsiRef.get().then((karsiSnap) => {
                    if (karsiSnap.exists && karsiSnap.data().durum === "bekliyor") {
                        // Karşı taraf zaten bana istek göndermiş -> karşılıklı ilgi, doğrudan arkadaş ol.
                        // Kendi dokümanıma SADECE kendim yazıyorum; karşı taraftaki isteği "kabul edildi"
                        // olarak işaretliyorum, o taraf da kendi kabul akışıyla kendi listesini güncelleyecek.
                        // İki yazma tek batch'te -> ya ikisi de uygulanır, ya hiçbiri (yarım kalma riski yok).
                        const batch = db.batch();
                        batch.update(db.collection("kullanicilar").doc(benimUID), {
                            arkadaslar: firebase.firestore.FieldValue.arrayUnion(hedefIsim)
                        });
                        batch.update(karsiRef, { durum: "kabul_edildi", kabulEdenUID: benimUID });
                        batch.commit().then(() => {
                            if (!benimArkadaslarim.includes(hedefIsim)) benimArkadaslarim.push(hedefIsim);
                            ozelUyariGoster(`✅ ${hedefIsim} ile artık arkadaşsınız!`);
                        }).catch(err => hataGoster("karsilikliEslesme", err));
                        return;
                    }

                    kendiRef.set({
                        gonderenUID: benimUID,
                        gonderenIsim: aktifKullaniciAdi,
                        aliciUID: hedefUID,
                        aliciIsim: hedefIsim,
                        durum: "bekliyor",
                        tarih: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        window.benimGonderilenIstekler.add(hedefIsim);
                        ozelUyariGoster("✅ Arkadaşlık isteği gönderildi.");
                    }).catch(err => hataGoster("istekOlustur", err));
                }).catch(err => hataGoster("karsiIstekKontrol", err));
            }).catch(err => hataGoster("kendiIstekKontrol", err));
        }).catch(err => hataGoster("hedefKullaniciBul", err));
    };

    // ---------------------------------------------
    // 2) İSTEĞİ İPTAL ET (gönderen taraf) — karşı taraftaki bildirim de düşer
    //    çünkü doküman silinince onSnapshot her iki tarafta da güncellenir.
    // ---------------------------------------------
    window.arkadaslikIstegiIptalEt = function (hedefIsim) {
        if (!hedefIsim || !aktifKullaniciAdi) return;
        const istekId = istekIdUret(aktifKullaniciAdi, hedefIsim);
        db.collection("arkadaslikIstekleri").doc(istekId).delete().then(() => {
            window.benimGonderilenIstekler.delete(hedefIsim);
            ozelUyariGoster("🗑️ İstek iptal edildi.");
        }).catch(err => hataGoster("istekIptal", err));
    };

    // ---------------------------------------------
    // 3) İSTEĞİ KABUL ET (alıcı taraf) — sadece KENDİ dokümanıma yazıyorum,
    //    isteği "kabul_edildi" işaretliyorum; gönderen taraf kendi
    //    dinleyicisinde bunu görüp kendi listesini kendisi günceller.
    // ---------------------------------------------
    window.arkadaslikIstegiKabulEt = function (istekId) {
        if (isMisafir || !auth.currentUser) return;
        const ref = db.collection("arkadaslikIstekleri").doc(istekId);
        ref.get().then((doc) => {
            if (!doc.exists) { ozelUyariGoster("ℹ️ Bu istek artık geçerli değil."); return; }
            const istek = doc.data();
            if (istek.aliciIsim !== aktifKullaniciAdi) return; // güvenlik: sadece alıcı kabul edebilir
            if (istek.durum !== "bekliyor") return;

            const batch = db.batch();
            batch.update(db.collection("kullanicilar").doc(auth.currentUser.uid), {
                arkadaslar: firebase.firestore.FieldValue.arrayUnion(istek.gonderenIsim)
            });
            batch.update(ref, { durum: "kabul_edildi", kabulEdenUID: auth.currentUser.uid });
            batch.commit().then(() => {
                if (!benimArkadaslarim.includes(istek.gonderenIsim)) benimArkadaslarim.push(istek.gonderenIsim);
                ozelUyariGoster(`✅ ${istek.gonderenIsim} artık arkadaşın!`);
            }).catch(err => hataGoster("istekKabul", err));
        }).catch(err => hataGoster("istekKabulGet", err));
    };

    // ---------------------------------------------
    // 4) İSTEĞİ REDDET (alıcı taraf)
    // ---------------------------------------------
    window.arkadaslikIstegiReddet = function (istekId) {
        db.collection("arkadaslikIstekleri").doc(istekId).delete().then(() => {
            ozelUyariGoster("❌ İstek reddedildi.");
        }).catch(err => hataGoster("istekReddet", err));
    };

    // ---------------------------------------------
    // 5) ARKADAŞ SİL (her iki taraftan da)
    //    Kendi listemden kendim çıkarıyorum + karşı tarafa "seni sildim"
    //    sinyali bırakıyorum; o taraf kendi dinleyicisinde görüp kendi
    //    listesinden kendisi çıkarır. Bilateral silme, sadece self-write ile.
    // ---------------------------------------------
    window.arkadasSil = function (hedefIsim) {
        if (isMisafir || !auth.currentUser || !hedefIsim) return;
        if (!confirm(`${hedefIsim} arkadaş listenden çıkarılsın mı?`)) return;

        const batch = db.batch();
        batch.update(db.collection("kullanicilar").doc(auth.currentUser.uid), {
            arkadaslar: firebase.firestore.FieldValue.arrayRemove(hedefIsim)
        });
        batch.set(db.collection("arkadaslikSilmeSinyalleri").doc(), {
            kimSildi: aktifKullaniciAdi,
            kimSilindi: hedefIsim,
            tarih: firebase.firestore.FieldValue.serverTimestamp()
        });
        batch.commit().then(() => {
            benimArkadaslarim = benimArkadaslarim.filter(n => n !== hedefIsim);
            ozelUyariGoster(`🗑️ ${hedefIsim} arkadaş listenden çıkarıldı.`);
        }).catch(err => hataGoster("arkadasSil", err));
    };

    // ---------------------------------------------
    // GERİYE DÖNÜK UYUMLULUK
    // "arkadasEkle" adı socket.js, index.html ve (yüklenmeyen) arkadas.js
    // içinde çağrılıyordu ama hiçbir yerde tanımlı değildi. İsim değişmeden,
    // gerçek işlevine bağlanıyor.
    // ---------------------------------------------
    window.arkadasEkle = function (hedefIsim) { window.arkadaslikIstegiGonder(hedefIsim); };

    // ---------------------------------------------
    // GERÇEK ZAMANLI DİNLEYİCİLER
    // ---------------------------------------------
    function dinleyicileriBaslat() {
        if (isMisafir || !aktifKullaniciAdi || !auth.currentUser) return;

        // a) Bana gelen bekleyen istekler
        if (dinleyiciGelenIstekler) dinleyiciGelenIstekler();
        dinleyiciGelenIstekler = db.collection("arkadaslikIstekleri")
            .where("aliciIsim", "==", aktifKullaniciAdi)
            .where("durum", "==", "bekliyor")
            .onSnapshot((snap) => {
                benimGelenIsteklerim = snap.docs.map(d => ({ id: d.id, ...d.data() }));

                benimGelenIsteklerim.forEach(istek => {
                    if (!bilinenGelenIstekIdleri.has(istek.id)) {
                        bilinenGelenIstekIdleri.add(istek.id);
                        ozelUyariGoster(`📨 ${istek.gonderenIsim} seni arkadaş olarak eklemek istiyor. Kabul/Red için "Arkadaşlar" menüsünü aç.`);
                    }
                });
                const guncelIdler = new Set(benimGelenIsteklerim.map(i => i.id));
                Array.from(bilinenGelenIstekIdleri).forEach(id => { if (!guncelIdler.has(id)) bilinenGelenIstekIdleri.delete(id); });

                arkadaslarPaneliniYenile();
            }, (err) => console.error("[arkadaslik] gelenIstekler dinleyici:", err));

        // b) Benim gönderdiğim, hâlâ bekleyen istekler (duplicate engelleme + "İstek Gönderildi" state)
        if (dinleyiciGidenIstekler) dinleyiciGidenIstekler();
        dinleyiciGidenIstekler = db.collection("arkadaslikIstekleri")
            .where("gonderenIsim", "==", aktifKullaniciAdi)
            .onSnapshot((snap) => {
                const yeniBekleyen = new Set();
                snap.forEach(d => {
                    const data = d.data();
                    if (data.durum === "bekliyor") {
                        yeniBekleyen.add(data.aliciIsim);
                    } else if (data.durum === "kabul_edildi") {
                        // Karşı taraf kabul etti -> kendi listeme kendim ekliyorum, dokümanı temizliyorum.
                        if (!benimArkadaslarim.includes(data.aliciIsim)) {
                            benimArkadaslarim.push(data.aliciIsim);
                            ozelUyariGoster(`✅ ${data.aliciIsim} arkadaşlık isteğini kabul etti!`);
                        }
                        db.collection("arkadaslikIstekleri").doc(d.id).delete().catch(() => {});
                    }
                });
                window.benimGonderilenIstekler = yeniBekleyen;
            }, (err) => console.error("[arkadaslik] gidenIstekler dinleyici:", err));

        // c) Kendi dokümanım (arkadaş listem başka bir cihaz/sekmeden değişse de canlı yansısın)
        if (dinleyiciKendiProfilim) dinleyiciKendiProfilim();
        dinleyiciKendiProfilim = db.collection("kullanicilar").doc(auth.currentUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists && Array.isArray(doc.data().arkadaslar)) {
                    benimArkadaslarim = doc.data().arkadaslar;
                    arkadaslarPaneliniYenile();
                }
            }, (err) => console.error("[arkadaslik] kendiProfil dinleyici:", err));

        // d) Beni silen biri var mı? (bilateral silme sinyali)
        if (dinleyiciSilmeSinyalleri) dinleyiciSilmeSinyalleri();
        dinleyiciSilmeSinyalleri = db.collection("arkadaslikSilmeSinyalleri").where("kimSilindi", "==", aktifKullaniciAdi)
            .onSnapshot((snap) => {
                snap.forEach(d => {
                    const data = d.data();
                    if (benimArkadaslarim.includes(data.kimSildi)) {
                        db.collection("kullanicilar").doc(auth.currentUser.uid).update({
                            arkadaslar: firebase.firestore.FieldValue.arrayRemove(data.kimSildi)
                        }).then(() => {
                            benimArkadaslarim = benimArkadaslarim.filter(n => n !== data.kimSildi);
                            arkadaslarPaneliniYenile();
                            return db.collection("arkadaslikSilmeSinyalleri").doc(d.id).delete();
                        }).catch(err => console.error("[arkadaslik] silmeSinyali işlenemedi, tekrar denenecek:", err));
                    } else {
                        // Zaten listemde yok (daha önce işlendi ya da hiç eklenmemiş) -> sinyali temizle
                        db.collection("arkadaslikSilmeSinyalleri").doc(d.id).delete().catch(() => {});
                    }
                });
            }, (err) => console.error("[arkadaslik] silmeSinyali dinleyici:", err));

        // e) Son görülme heartbeat
        if (sonGorulmeInterval) clearInterval(sonGorulmeInterval);
        sonGorulmeGuncelle();
        sonGorulmeInterval = setInterval(sonGorulmeGuncelle, 60000);
    }

    function sonGorulmeGuncelle() {
        if (isMisafir || !auth.currentUser || document.visibilityState !== 'visible') return;
        db.collection("kullanicilar").doc(auth.currentUser.uid).update({
            sonGorulme: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {}); // arka plan güncellemesi, kritik değil - sessiz geçilir
    }

    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sonGorulmeGuncelle(); });
    window.addEventListener('beforeunload', () => { sonGorulmeGuncelle(); });

    // ---------------------------------------------
    // ARKADAŞLAR PANELİ
    // Mevcut #arkadaslarEkrani / #arkadasListesiDiv elemanları yeniden
    // kullanılıyor. Yeni bir popup/tasarım oluşturulmuyor.
    // ---------------------------------------------
    window.arkadaslarMenusuAc = function () {
        if (isMisafir) { ozelUyariGoster("⚠️ Misafirler arkadaş kullanamaz."); return; }
        document.getElementById('arkadaslarEkrani').style.display = 'flex';
        arkadaslarPaneliniYenile();
    };

    function zamanFarkiYaz(tarihObj) {
        if (!tarihObj) return "bilinmiyor";
        const farkMs = new Date() - tarihObj;
        const dk = Math.floor(farkMs / 60000);
        if (dk < 1) return "az önce";
        if (dk < 60) return dk + " dk önce";
        const sa = Math.floor(dk / 60);
        if (sa < 24) return sa + " sa önce";
        return Math.floor(sa / 24) + " gün önce";
    }

    function arkadaslarPaneliniCiz() {
        const listeDiv = document.getElementById('arkadasListesiDiv');
        if (!listeDiv) return;
        let html = '';

        if (benimGelenIsteklerim.length > 0) {
            html += '<p style="color:#f2c94c; font-size:12px; text-align:center; font-weight:bold;">📨 Gelen İstekler</p>';
            benimGelenIsteklerim.forEach(istek => {
                html += `<div class="lider-satir">
                    <div style="color:#fff;"><span class="online-nokta"></span> ${istek.gonderenIsim}</div>
                    <div style="display:flex; gap:6px;">
                        <button class="btn-davet-et" onclick="arkadaslikIstegiKabulEt('${istek.id}')">Kabul Et</button>
                        <button class="btn-davet-et" style="background:#e74c3c;" onclick="arkadaslikIstegiReddet('${istek.id}')">Reddet</button>
                    </div>
                </div>`;
            });
        }

        html += '<p style="color:#a3c4bc; font-size:11px; text-align:center; margin-top:10px;">Arkadaşların</p>';

        const gecerliArkadaslar = (benimArkadaslarim || []).filter(o => o !== aktifKullaniciAdi);
        if (gecerliArkadaslar.length === 0) {
            html += '<p style="text-align:center; color:#777; font-size:12px;">Henüz arkadaşın yok.</p>';
        } else {
            gecerliArkadaslar.forEach(o => {
                let koz = globalKozmetikler[o] || [];
                let iR = koz.includes('atesli_isim') ? '#ff4d4d' : '#fff';
                let cevrimici = onlineOyuncularListesi.includes(o);
                let durumYazi = cevrimici ? '🟢 Çevrimiçi' : ('⚪ Çevrimdışı • ' + zamanFarkiYaz(sonGorulmeCache[o]));
                html += `<div class="lider-satir">
                    <div style="color:${iR};">
                        <span onclick="profiliGoster('${o}')" style="cursor:pointer;"><span class="online-nokta"></span> ${o}</span>
                        <div style="font-size:10px; color:#a3c4bc; font-weight:normal;">${durumYazi}</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        ${cevrimici ? `<button class="btn-davet-et" onclick="masayaDavetEt('${o}')">Davet Et</button>` : ''}
                        <button class="btn-davet-et" style="background:#e74c3c;" onclick="arkadasSil('${o}')">Sil</button>
                    </div>
                </div>`;
            });
        }

        listeDiv.innerHTML = html;
    }

    function arkadaslarPaneliniYenile() {
        const ekran = document.getElementById('arkadaslarEkrani');
        if (!ekran || ekran.style.display === 'none' || isMisafir) return;

        arkadaslarPaneliniCiz(); // hızlı ilk çizim (son görülme cache'ten, boşsa "bilinmiyor")

        const cevrimdisiArkadaslar = (benimArkadaslarim || [])
            .filter(o => o !== aktifKullaniciAdi && !onlineOyuncularListesi.includes(o) && !(o in sonGorulmeCache));

        if (cevrimdisiArkadaslar.length === 0) return;

        const parcalar = [];
        for (let i = 0; i < cevrimdisiArkadaslar.length; i += 10) parcalar.push(cevrimdisiArkadaslar.slice(i, i + 10));

        Promise.all(parcalar.map(p => db.collection("kullanicilar").where("isim", "in", p).get()))
            .then(sonuclar => {
                sonuclar.forEach(qs => qs.forEach(doc => {
                    const d = doc.data();
                    sonGorulmeCache[d.isim] = (d.sonGorulme && d.sonGorulme.toDate) ? d.sonGorulme.toDate() : null;
                }));
                arkadaslarPaneliniCiz(); // son görülme bilgisiyle yeniden çiz
            }).catch(err => console.error("[arkadaslik] sonGorulme fetch:", err));
    }

    // ---------------------------------------------
    // BAŞLATMA
    // ---------------------------------------------
    auth.onAuthStateChanged((user) => {
        if (!user) return;
        let deneme = 0;
        const bekle = setInterval(() => {
            deneme++;
            if (aktifKullaniciAdi && !isMisafir) {
                clearInterval(bekle);
                dinleyicileriBaslat();
            } else if (deneme > 100) {
                clearInterval(bekle); // ~20 sn güvenlik freni
            }
        }, 200);
    });

})();
