// ==========================================
// BEYCO GAMES - SOHBET VE EMOJİ SİSTEMİ
// ==========================================
const sohbetCekmecesiDOM = document.getElementById('sohbetCekmecesi');
if(sohbetCekmecesiDOM) {
    document.getElementById('sohbetAcBtn')?.addEventListener('click', () => { sohbetCekmecesiDOM.classList.add('acik'); });
    document.getElementById('sohbetKapatBtn')?.addEventListener('click', () => { sohbetCekmecesiDOM.classList.remove('acik'); });
    document.getElementById('sohbetGonderBtn')?.addEventListener('click', () => { 
        if(isMisafir) { ozelUyariGoster("⚠️ MİSAFİR HESAPLAR SOHBETE MESAJ YAZAMAZ!"); return; } 
        const input = document.getElementById('sohbetInput'); 
        if(input.value.trim() !== '' && suAnkiMasam) { 
            socket.emit('sohbet_mesaji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, mesaj: input.value, kozmetikler: aktifKozmetikler }); 
            input.value = ''; 
            benimGorevler.mesaj++; 
            if(typeof window.gorevleriKaydet === 'function') window.gorevleriKaydet(); 
        } 
    });
}

window.vipEmojiGonder = function(emoji) { 
    if(isMisafir) return; 
    if(suAnkiMasam) { 
        socket.emit('vip_emoji', { masaAdi: suAnkiMasam, isim: aktifKullaniciAdi, emoji: emoji }); 
        document.getElementById('sohbetCekmecesi')?.classList.remove('acik'); 
    } 
};
