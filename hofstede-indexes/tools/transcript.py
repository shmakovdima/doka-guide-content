#!/usr/bin/env python3
"""Транскрипт YouTube-видео: скачать и механически почистить. Только stdlib.

  python3 -I transcript.py fetch URL [-l ru] [-o out.md]   скачать субтитры
  python3 -I transcript.py clean in.md [-o out.md] [-s 60] механическая чистка

fetch: пишет строки вида `М:СС текст` (как копирование из панели YouTube).
clean: понимает и этот формат, и формат из панели ("0:044 секундыТекст",
       "1:021 минута 2 секундыТекст"), убирает дубли таймкодов, склеивает в
       абзацы, ставит таймкод раз в -s секунд. Смысловые ослышки не чинит.
"""
import argparse
import html
import json
import re
import sys
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def http_get(url, data=None, headers=None):
    h = {"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"}
    h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def video_id(url):
    m = re.search(r"(?:v=|youtu\.be/|/shorts/|/live/|/embed/)([\w-]{11})", url)
    if m:
        return m.group(1)
    if re.fullmatch(r"[\w-]{11}", url):
        return url
    sys.exit("не нашёл id видео в: " + url)


def player_response(vid):
    """Сначала innertube API (клиент ANDROID), запасной путь - HTML страницы."""
    body = json.dumps({
        "context": {"client": {"clientName": "ANDROID", "clientVersion": "20.10.38"}},
        "videoId": vid,
    }).encode()
    try:
        raw = http_get(
            "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
            data=body,
            headers={"Content-Type": "application/json",
                     "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)"},
        )
        pr = json.loads(raw)
        if pr.get("captions"):
            return pr
    except Exception as e:  # noqa: BLE001
        print("innertube не сработал:", e, file=sys.stderr)
    page = http_get(f"https://www.youtube.com/watch?v={vid}&hl=en")
    m = re.search(r"ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:var|</script>)", page, re.S)
    if not m:
        sys.exit("не нашёл данные плеера (возможно, нужна авторизация или консент)")
    return json.loads(m.group(1))


def pick_track(tracks, lang):
    def score(t):
        code = t.get("languageCode", "")
        auto = t.get("kind") == "asr"
        return (code != lang and not code.startswith(lang + "-"), auto)
    return sorted(tracks, key=score)[0]


def fmt_time(sec):
    sec = int(sec)
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def fetch(args):
    vid = video_id(args.url)
    pr = player_response(vid)
    tracks = (pr.get("captions", {})
                .get("playerCaptionsTracklistRenderer", {})
                .get("captionTracks", []))
    if not tracks:
        sys.exit("у видео нет субтитров (ни ручных, ни автоматических)")
    track = pick_track(tracks, args.lang)
    print("дорожка:", track.get("languageCode"), track.get("kind", "manual"), file=sys.stderr)
    raw = http_get(track["baseUrl"])
    if not raw.strip():
        sys.exit("YouTube вернул пустой ответ (нужен PO-токен). Используй копирование из панели + clean")
    lines = []
    if raw.lstrip().startswith("{"):  # json3
        for ev in json.loads(raw).get("events", []):
            text = "".join(sg.get("utf8", "") for sg in ev.get("segs") or []).replace("\n", " ").strip()
            if text:
                lines.append(f"{fmt_time(ev.get('tStartMs', 0) / 1000)} {html.unescape(text)}")
    else:  # srv3 xml: <p t="мс"><s>слово</s>...</p> или <p t="мс">текст</p>
        import xml.etree.ElementTree as ET
        for p in ET.fromstring(raw).iter("p"):
            text = re.sub(r"\s+", " ", "".join(p.itertext())).strip()
            if text:
                lines.append(f"{fmt_time(int(p.get('t', 0)) / 1000)} {text}")
    out = "\n".join(lines) + "\n"
    if args.o:
        open(args.o, "w", encoding="utf-8").write(out)
        print(f"записано {len(lines)} строк в {args.o}", file=sys.stderr)
    else:
        sys.stdout.write(out)


# --- clean -----------------------------------------------------------------

# Панель YouTube: "0:044 секунды" / "1:021 минута 2 секунды" / "40:1440 минут 14 секунд".
# После M:SS идёт дубль "N секунд[ы]" или "N минут[а|ы] K секунд[ы]", текст приклеен без пробела.
# Окончание однозначно по числу (1 -> а, 2-4 -> ы, иначе пусто), поэтому "секундыребята" делится верно.
def _ending(n, word):
    n = int(n)
    if n % 100 in range(11, 15) or n % 10 in (0, 5, 6, 7, 8, 9):
        return word
    return word + ("а" if n % 10 == 1 else "ы")


def _strip_duplicate(rest):
    m = re.match(r"(\d+)\s+минут", rest)
    if m:
        w = _ending(m[1], "минут")
        rest = rest[m.end(1):].lstrip()[len(w):]
        m2 = re.match(r"\s*(\d+)\s+секунд", rest)
        if m2:
            w2 = _ending(m2[1], "секунд")
            rest = rest[m2.end(1):].lstrip()[len(w2):]
        return rest
    m = re.match(r"(\d+)\s+секунд", rest)
    if m:
        w = _ending(m[1], "секунд")
        return rest[m.end(1):].lstrip()[len(w):]
    return rest


PANEL = re.compile(r"^(?P<m>\d+):(?P<s>\d{2})(?P<rest>.*)$")
PLAIN = re.compile(r"^(?:(?P<h>\d+):)?(?P<m>\d+):(?P<s>\d{2})\s+(?P<t>.*)$")


def parse_line(line):
    line = line.strip().replace("�", "")
    if not line:
        return None
    m = PLAIN.match(line)
    if m:
        sec = int(m["h"] or 0) * 3600 + int(m["m"]) * 60 + int(m["s"])
        return sec, m["t"].strip()
    m = PANEL.match(line)
    if m:
        # "0:044 секунды" -> секунды = первые 2 цифры после ":"
        return int(m["m"]) * 60 + int(m["s"]), _strip_duplicate(m["rest"]).strip()
    return None


def clean(args):
    items = []
    for line in open(args.inp, encoding="utf-8", errors="replace"):
        p = parse_line(line)
        if p:
            items.append(p)
        elif line.strip() and items:  # хвост без таймкода - дописываем к предыдущему
            items[-1] = (items[-1][0], items[-1][1] + " " + line.strip())
    if not items:
        sys.exit("не распознал ни одной строки с таймкодом")

    paras, cur, cur_start, last_mark = [], [], items[0][0], items[0][0]
    for sec, text in items:
        if cur and sec - last_mark >= args.s:
            paras.append((cur_start, " ".join(cur)))
            cur, cur_start, last_mark = [], sec, sec
        cur.append(text)
    if cur:
        paras.append((cur_start, " ".join(cur)))

    out = []
    for sec, text in paras:
        text = re.sub(r"\s+", " ", text).strip()
        text = re.sub(r"\[(музыка|аплодисменты|music|applause)\]", r"[\1]", text, flags=re.I)
        out.append(f"**{fmt_time(sec)}**\n\n{text}\n")
    res = "\n".join(out)
    if args.o:
        open(args.o, "w", encoding="utf-8").write(res)
        print(f"{len(items)} строк -> {len(paras)} абзацев, {args.o}", file=sys.stderr)
    else:
        sys.stdout.write(res)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    f = sub.add_parser("fetch")
    f.add_argument("url")
    f.add_argument("-l", "--lang", default="ru")
    f.add_argument("-o")
    f.set_defaults(fn=fetch)
    c = sub.add_parser("clean")
    c.add_argument("inp")
    c.add_argument("-o")
    c.add_argument("-s", type=int, default=60, help="секунд между таймкодами абзацев")
    c.set_defaults(fn=clean)
    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
