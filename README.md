# Celestia: Güneş Sistemi Gezgini

Tarayıcıda çalışan, etkileşimli bir 3D Güneş Sistemi keşif ve deney uygulaması. Kişisel bir hobi projesi.

Tek bir `index.html` dosyasıdır. Kurulum ya da derleme gerekmez. Dokular `tex/` klasöründedir.

## Neler var

- **Gerçek konumlar.** Gezegenlerin ve Ay'ın konumları [astronomy-engine](https://github.com/cosinekitty/astronomy) ile o anki tarihe göre hesaplanır. Gerçek güneş ve ay tutulmaları da bu hesaplardan bulunur.
- **Fotoğraf gerçekliğinde dokular.** Güneş, Merkür, Venüs (atmosfer ve yüzey), Dünya, Ay, Mars, Jüpiter, Satürn ve halkası, Uranüs ve Neptün NASA görev verilerine dayanır.
- **Gerçek gökyüzü.** Hipparcos/Yale yıldızları, takımyıldızlar ve ekliptik koordinatlara yeniden yansıtılmış bir Samanyolu panoraması. Andromeda ve Macellan Bulutları gibi derin uzay cisimleri de gökyüzünde yer alır.
- **Dünya hava durumu.** Rüzgârla sürüklenen gerçek bulut haritası, mevsimler, kasırgalar ve kutup ışıkları. Gece tarafında şehir ışıkları görünür.
- **Diğer gezegenlerin havası.** Mars toz fırtınaları, Satürn'ün büyük beyaz lekesi ve Neptün'ün karanlık lekesi.
- **Laboratuvar modu.**
  - Gezegen yörüngesini, boyutunu ve atmosferini değiştirip iklimin ve yaşanabilirliğin nasıl değiştiğini izleyebilirsin.
  - Kütleçekim simülasyonunda çarpışmalar, Roche sınırı ve gelgit kilidi hesaplanır.
  - Güneş'i kırmızı deve, süpernovaya ya da kara deliğe dönüştürebilirsin. Kara deliğe yaklaşan gezegen uzayıp parçalanarak yutulur.
  - Kendi gezegenini tasarlayabilirsin.
- **Zaman çizelgesi.** Zamanı geri sarabilir, olayları yeniden oynatabilirsin.
- **Yüzey görünümü ve ölçek yolculuğu.** Dünya yüzeyinden bakabilir ya da Güneş'ten yakın yıldızlara uzanan bir yolculuğa çıkabilirsin.
- **Uzay araçları.** ISS, JWST, Voyager, New Horizons ve Parker Solar Probe.
- **Diğer yıldız sistemleri.** Proxima Centauri, Alfa Centauri, TRAPPIST-1, 55 Cancri ve Kepler-16.
- **Telefona uygun.** Mobil için sadeleştirilmiş arayüz, düşük kalite modu, sesleri açıp kapatma.

## Çalıştırma

```bash
python3 -m http.server 8000
# tarayıcıda http://localhost:8000
```

Dokular tarayıcı güvenliği nedeniyle `file://` ile açılınca yüklenmez. Bu durumda uygulama, kodla üretilen yedek dokulara geçer.

## Dallar

| Dal | İçerik |
|---|---|
| `main` | Gerçek fotoğraf dokuları |
| `eski-modeller` | Kodla üretilen (prosedürel) gezegen dokuları. Daha hafiftir. Yalnızca Dünya'da NASA dokusu vardır. |

## Teknolojiler

- [three.js r128](https://threejs.org/): WebGL 3D çizim
- [astronomy-engine 2.1.19](https://github.com/cosinekitty/astronomy): gök mekaniği hesapları
- Özel GLSL gölgelendiriciler: Güneş granülasyonu, bulutlar, lav, krater, halka gölgesi, tutulma gölgesi

## Kaynaklar ve lisanslar

- Gezegen, Güneş, Ay, halka, bulut ve Samanyolu dokuları: [Solar System Scope](https://www.solarsystemscope.com/textures/), CC BY 4.0 (NASA verilerine dayanır)
- Dünya gündüz/gece dokuları: NASA Blue Marble ve Black Marble
- Yıldızlar, takımyıldızlar: [d3-celestial](https://github.com/ofrohn/d3-celestial) © Olaf Frohn, BSD lisansı (Hipparcos / Yale Parlak Yıldız Kataloğu)
- Kıyı çizgileri: Natural Earth (kamu malı)
