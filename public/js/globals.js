// public/globals.js

const socket = io();

// Ortak Değişkenler
let aktifKullaniciAdi = ""; 
let suAnkiMasam = null; 
let benimSiramMi = false;
let guncelMasalar = {}; 
let gostergeHakki = false; 
let izleyiciModu = false; 

let benimAnlikCipim = 0; 
let benimKazanilanOyun = 0; 
let benimEnvanterim = []; 
let aktifKozmetikler = []; 
let sonBonusTarihim = ""; 
let isMisafir = false; 
let globalKozmetikler = {}; 

let benimArkadaslarim = []; 
let onlineOyuncularListesi = []; 
let masaOyunBasladiMi = false; 
let cikisIcinBekleyenLogout = false; 

let suAnkiMasaVIPMi = false;
let suAnkiMasaSahibi = "";
let suAnkiMasaGizliMi = false;

let benimGorevler = { kazanma: 0, mesaj: 0, gosterge: 0, tarih: "", alinanlar: {} };

// Uyarı Fonksiyonu (Her dosya erişebilsin diye globalde)
window.ozelUyariGoster = function(mesaj) {
    const uyariMetin = document.getElementById('uyariModalMetni');
    const uyariEkran = document.getElementById('uyariModalEkrani');
    if(uyariMetin && uyariEkran) {
        uyariMetin.innerText = mesaj;
        uyariEkran.style.display = 'flex';
    } else { alert(mesaj); }
};

// Beyco Games Filigranı
function markaVeReklamKurulumu() {
    setInterval(() => {
        document.querySelectorAll('*').forEach(el => {
            if(el.childNodes.length === 1 && el.textContent.includes('Sistem: VIP Oyuna Hoş Geldiniz!')) {
                el.innerHTML = '🟢 Sistem: Seri Okey Salonlarına Hoş Geldiniz - <b style="color:#f2c94c; margin-left:5px;">BEYCO GAMES</b>';
            }
        });
    }, 1000);
}
window.addEventListener('DOMContentLoaded', markaVeReklamKurulumu);
setTimeout(markaVeReklamKurulumu, 1000);

// Ses Efektleri
const sesTasCek = new Audio('sounds/tas_cek.mp3'); 
const sesTasKoy = new Audio('sounds/tas_koy.mp3'); 
const sesSiraSende = new Audio('sounds/sira_sende.mp3');
function sesCal(sesObje) { if(window.oyunSesleriAktif === false) return; try { let yeniSes = sesObje.cloneNode(); yeniSes.volume = 0.5; yeniSes.play().catch(e => console.log(e)); } catch(err) {} }

// DOM Elementleri
const authEkrani = document.getElementById('authEkrani');
const lobiEkrani = document.getElementById('lobiEkrani');
const masaEkrani = document.getElementById('masaEkrani');
const vipHeader = document.querySelector('.vip-header');
const oyunuBaslatBtn = document.getElementById('oyunuBaslatBtn');
const oyunAlanObjeleri = document.getElementById('oyunAlanObjeleri');
const kalanTasBilgi = document.getElementById('kalanTasBilgi');
const bitisAlani = document.getElementById('bitisAlani');
const ustRaf = document.getElementById('ustRaf');
const altRaf = document.getElementById('altRaf');
const masaOrtasiYazi = document.getElementById('masaOrtasiYazi');
const masaKasaBilgisi = document.getElementById('masaKasaBilgisi');
const masalarAlani = document.getElementById('masalarAlani');
const sohbetCekmecesi = document.getElementById('sohbetCekmecesi');
const btnVipGizlilikTetikle = document.getElementById('btnVipGizlilikTetikle');

let gostergeBtn = document.createElement('button');
gostergeBtn.id = 'gostergeBtn'; gostergeBtn.innerText = '⭐ GÖSTERGE YAP'; gostergeBtn.className = 'gosterge-btn';
if(oyunAlanObjeleri && oyunAlanObjeleri.firstElementChild) {
    oyunAlanObjeleri.firstElementChild.appendChild(gostergeBtn);
}

function getLigRozeti(kazanilanOyunSayisi, misafirMi = false) {
    if (misafirMi) return { metin: "DENEME HESABI", renk: "#7f8c8d", yaziRenk: "#fff" };
    if (kazanilanOyunSayisi < 10) return { metin: "🥉 BRONZ LİG", renk: "linear-gradient(180deg, #cd7f32 0%, #8b4513 100%)", yaziRenk: "#fff" };
    if (kazanilanOyunSayisi < 50) return { metin: "🥈 GÜMÜŞ LİG", renk: "linear-gradient(180deg, #e0e0e0 0%, #9e9e9e 100%)", yaziRenk: "#000" };
    if (kazanilanOyunSayisi < 100) return { metin: "🥇 ALTIN LİG", renk: "linear-gradient(180deg, #f2d94c 0%, #d4af37 100%)", yaziRenk: "#000" };
    return { metin: "💎 ELMAS LİG", renk: "linear-gradient(180deg, #00d2ff 0%, #3a7bd5 100%)", yaziRenk: "#fff" };
}

// Firebase Kurulumu
const firebaseConfig = { 
    apiKey: "AIzaSyDZ2VhlFEtpT4kpvJn0TbCwbot8QB3MJGg", 
    authDomain: "okeyoyunu-41321.firebaseapp.com", 
    projectId: "okeyoyunu-41321", 
    storageBucket: "okeyoyunu-41321.firebasestorage.app", 
    messagingSenderId: "472848132493", 
    appId: "1:472848132493:web:d104317f6398b5a3adf5c4" 
};
firebase.initializeApp(firebaseConfig); 
const auth = firebase.auth(); 
const db = firebase.firestore();
