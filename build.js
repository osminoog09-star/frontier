// FRONTIER build/sync script.
// Собирает frontier.html = шаблон-обёртка (frontier.template.html) + _core.js.
// ВАЖНО: запускать только через Node (UTF-8 по умолчанию). НЕ синхронизировать вручную
// через PowerShell `Get-Content -Raw` — в Windows PowerShell 5.1 это читает UTF-8 как CP1251
// и портит кириллицу (double-encoding). build.js имеет встроенный mojibake-guard.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TEMPLATE = path.join(ROOT, 'frontier.template.html');
const CORE = path.join(ROOT, '_core.js');
const OUT = path.join(ROOT, 'frontier.html');
const MARKER = '__CORE__';

// Признаки двойной перекодировки кириллицы (UTF-8, прочитанный как CP1251 и снова в UTF-8).
const MOJIBAKE = /вЂ|Ð[°-я]|Р[”ёµ»єСЂ‘]|РєРёР|С‚С€|РЎРµ/;

function assertClean(name, text) {
  if (MOJIBAKE.test(text)) {
    throw new Error(`MOJIBAKE detected in ${name} — сборка остановлена, чтобы не записать кракозябры.`);
  }
}

function build() {
  if (!fs.existsSync(TEMPLATE)) throw new Error('Нет frontier.template.html — сгенерируй его (см. README сборки).');
  const tpl = fs.readFileSync(TEMPLATE, 'utf8');
  const core = fs.readFileSync(CORE, 'utf8');

  assertClean('_core.js', core);
  assertClean('frontier.template.html', tpl);
  if (!tpl.includes(MARKER)) throw new Error(`В шаблоне нет маркера ${MARKER}.`);

  const out = tpl.replace(MARKER, () => core.trim());

  // Финальные проверки результата
  assertClean('frontier.html (result)', out);
  if (!out.includes('Дикий Запад')) throw new Error('В результате нет «Дикий Запад» — подозрение на порчу кодировки.');
  if (!out.includes('charset="UTF-8"')) throw new Error('В результате нет <meta charset="UTF-8">.');
  if ((out.match(/<script>/g) || []).length !== 1) throw new Error('Должен быть ровно один <script>.');
  if (!out.trimEnd().endsWith('</html>')) throw new Error('Файл не заканчивается на </html>.');

  fs.writeFileSync(OUT, out, 'utf8'); // Node пишет UTF-8 без BOM
  console.log('build.js: frontier.html собран OK (', out.length, 'символов ).');
}

build();
