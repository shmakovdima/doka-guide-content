#!/bin/sh
set -eu

textutil -convert txt -stdout output/power-of-attorney.docx | rg -F 'ДОВЕРЕННОСТЬ'
textutil -convert txt -stdout output/power-of-attorney.docx | rg -F 'Шмаков Дмитрий Алексеевич'
textutil -convert txt -stdout output/power-of-attorney.docx | rg -F 'Доверенность выдана без права передоверия полномочий другим лицам.'
