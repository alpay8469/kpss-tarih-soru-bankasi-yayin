# KPSS Tarih Soru Bankası

Bu paket, soru bankasını bilgisayarında çalıştırmak ve kaynak kodunu incelemek içindir. Uygulama çevrimiçi hizmet olarak yayınlanmaz.

## Windows'ta çalıştırma

1. GitHub'daki Releases bölümünden kpss-tarih-yayin-paketi.zip dosyasını indirip bir klasöre tamamen çıkar. ZIP penceresinin içinden BASLAT.cmd çalıştırılamaz.
2. Çıkarılan klasörde outputs/tarih-soru-bankasi/BASLAT.cmd dosyasını çalıştır. Bu yayın ZIP'inde Windows x64 için Node.js 24.22.2 çalışma zamanı vardır; Node.js kurulumu veya internet bağlantısı gerekmez. Sunucu hazır olunca soru bankası tarayıcıda açılır.

GitHub'ın Code → Download ZIP kaynağında taşınabilir çalışma zamanı bulunmaz. Kaynak ZIP'ini kullanacaksan Windows x64'e Node.js 24.15 veya üstünü ayrıca kur.

## macOS veya Linux'ta çalıştırma

macOS/Linux için Node.js 24.15 veya üstünü kur. Terminalde paketin kök dizininden şu komutları çalıştır:

    cd outputs/tarih-soru-bankasi
    node scripts/build.mjs
    node scripts/dev.mjs

Ardından tarayıcıda http://localhost:4173 adresini aç. Port 4173 kullanımda ise sunucu başlamaz; önce diğer yerel uygulamayı kapat. Paketteki taşınabilir runtime yalnızca Windows x64 içindir; diğer sistemlerde Node.js gerekir.

Uygulama yalnızca bu bilgisayarda 127.0.0.1 adresini dinler. Profil ve ilerleme kayıtları, yedekler ve yönetici anahtarı uygulama klasöründeki .local dizininde oluşturulur; bu klasörü paylaşma. Uygulamayı başka bir klasöre taşırken ilerleme verilerini ayrıca yedekle.

Bu bir kurulum programı değildir. Otomatik güncelleme veya imzalı kurulum içermez.

## Soru kapsamı

Paket yalnız aktif öğrenci sorularını ve gerekli cevap/açıklama/kaynak alanlarını içerir. İç inceleme ve bekleyen maddeler pakete alınmaz. Güçlük etiketleri ölçülmüş öğrenci sonuçları değil editoryal tahminlerdir.

## Kullanım izni

Bu pakete henüz yeniden dağıtım veya ticari kullanım lisansı eklenmemiştir. Herkese açık olması, içeriği yeniden yayımlama ya da ticari kullanım izni vermez.