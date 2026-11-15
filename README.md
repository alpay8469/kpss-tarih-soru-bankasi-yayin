# KPSS Tarih Soru Bankası

Bu paket, soru bankasını bilgisayarında çalıştırmak ve kaynak kodunu incelemek içindir. Uygulama çevrimiçi hizmet olarak yayınlanmaz.

## Windows'ta çalıştırma

1. ZIP'i WinRAR ile bir klasöre tamamen çıkar. ZIP penceresinin içinden `BASLAT.cmd` çalıştırılamaz.
2. Çıkarılan klasörde `outputs/tarih-soru-bankasi/BASLAT.cmd` dosyasını çalıştır. Windows x64 için Node.js 24.22.2 çalışma zamanı pakete dahildir; Node.js kurulumu veya internet bağlantısı gerekmez. Sunucu hazır olunca soru bankası tarayıcıda açılır.

## macOS veya Linux'ta çalıştırma

macOS/Linux için Node.js 24.15 veya üstünü kur. Terminalde paketin kök dizininden şu komutları çalıştır:

```sh
cd outputs/tarih-soru-bankasi
node scripts/build.mjs
node scripts/dev.mjs
```

Ardından tarayıcıda `http://localhost:4173` adresini aç. Port 4173 kullanımda ise sunucu başlamaz; önce diğer yerel uygulamayı kapat. Paketteki taşınabilir runtime yalnızca Windows x64 içindir; diğer sistemlerde Node.js gerekir.

Uygulama yalnızca bu bilgisayarda `127.0.0.1` adresini dinler. Profil ve ilerleme kayıtları, yedekler ve yönetici anahtarı uygulama klasöründeki `.local` dizininde oluşturulur; bu klasörü paylaşma. Uygulamayı başka bir klasöre taşırken ilerleme verilerini ayrıca yedekle.

Bu bir kurulum programı değildir. GitHub deposunun **Code → Download ZIP** seçeneğiyle indirilen kaynak paketi Node.js ile çalıştırılır. Otomatik güncelleme veya imzalı kurulum içermez.

## Soru kapsamı

Paket yalnız aktif öğrenci sorularını ve gerekli cevap/açıklama/kaynak alanlarını içerir. İç inceleme ve bekleyen maddeler pakete alınmaz. Güçlük etiketleri ölçülmüş öğrenci sonuçları değil editoryal tahminlerdir.

## Kullanım izni

Bu pakete henüz yeniden dağıtım veya ticari kullanım lisansı eklenmemiştir. Herkese açık olması, içeriği yeniden yayımlama ya da ticari kullanım izni vermez.

