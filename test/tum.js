// Tüm testleri sırayla çalıştırır; Windows, macOS ve Linux'ta aynı komutla çalışır.
// Kullanım: node tum.js            → dört mesafe ölçeğinde senaryolar + savunma testleri (npm test bunu çalıştırır)
//           node tum.js 2.5        → yalnızca bir ölçek (1, 2.5, 6 ya da R)
//           node tum.js savunma    → yalnızca savunma testleri
const { spawnSync } = require('child_process');
const HEPSI = ['1', '2.5', '6', 'R', 'savunma'];
const AD = { '1': 'Kompakt', '2.5': 'Geniş', '6': 'Gerçekçiye yakın', 'R': 'Gerçek ölçek' };
const istenen = process.argv.slice(2);
const gecersiz = istenen.filter(k => !HEPSI.includes(k));
if (gecersiz.length) { console.log('Bilinmeyen seçenek: ' + gecersiz.join(', ') + '. Geçerli olanlar: ' + HEPSI.join(', ')); process.exit(2); }
const liste = istenen.length ? istenen : HEPSI;
const kalan = [];
for (const k of liste) {
  const sav = k === 'savunma';
  console.log('\n===== ' + (sav ? 'Savunma testleri' : 'Senaryolar · ' + AD[k] + ' (DS=' + k + ')') + ' =====');
  const r = spawnSync(process.execPath, sav ? ['savunma.js'] : ['run.js', 'senaryolar.js'],
    { cwd: __dirname, stdio: 'inherit', env: Object.assign({}, process.env, sav ? {} : { DS: k }) });
  if (r.status !== 0) kalan.push(sav ? 'savunma' : AD[k]);
}
console.log('\n===== Özet =====');
console.log(kalan.length ? 'BAŞARISIZ: ' + kalan.join(', ') : 'Hepsi geçti (' + liste.length + ' tur)');
process.exit(kalan.length ? 1 : 0);
