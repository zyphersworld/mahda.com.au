#!/bin/bash
# Injects pages.json into app.js as the offline fallback, so the two
# can never drift. Run after any edit to pages.json.
set -e
cd "$(dirname "$0")"
python3 - <<'PY'
import json
d = json.load(open('assets/data/pages.json'))
src = open('assets/js/app.js').read()
a = src.index('/*__FALLBACK__*/')
b = src.index('/*__END__*/') + len('/*__END__*/')
new = src[:a] + '/*__FALLBACK__*/ ' + json.dumps(d, ensure_ascii=False) + ' /*__END__*/' + src[b:]
open('assets/js/app.js','w').write(new)
print("fallback injected:", len(d['pages']), "pages")
PY
node --check assets/js/app.js && echo "build ok"
