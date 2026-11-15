import re, json, glob, os, hashlib
ROOT=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(ROOT,'lessons')
HERE=os.path.join(ROOT,'src')
EMO=re.compile(r'[\U0001F300-\U0001FAFF☀-✒✕-➿⬀-⯿⏩-⏿️]\s?')
WID={'day01':['dot'],'day02':['matvec'],'day03':['condprob'],'day04':['bayes'],'day05':['softmax'],'day06':['entropy'],'day07':['crossent'],'day08':['gd'],'day09':['clt'],'day10':['rnn','tf']}
def clean(md): return EMO.sub('', md)
pages=[]
cur=open(f'{SRC}/00_커리큘럼.md').read()
cur=re.sub(r'\((week\d)/(day\d\d)_[^)]*\.md\)', lambda m:f'(#{m.group(2)})', cur)
cur=cur.replace('(week3-4_개요.md)','(#roadmap)')
pages.append(dict(id='home',short='교재 소개',md=clean(cur),link=''))
LESSON_FILES=sorted(glob.glob(f'{SRC}/stage*/*.md'))+sorted(glob.glob(f'{SRC}/week*/day*.md'))
for f in LESSON_FILES:
    did=os.path.basename(f).split('_')[0]
    md=open(f).read()
    if did=='day01':
        md=re.sub(r'```\n.*?```', '<div class="widget" data-w="papermap"></div>', md, count=1, flags=re.S)
    if WID.get(did):
        block='## 직접 만져보기\n\n'+'\n\n'.join(f'<div class="widget" data-w="{w}"></div>' for w in WID[did])+'\n\n'
        md=re.sub(r'(?m)^(## [^\n]*능동 연습)', lambda m: block+m.group(1), md, count=1)
    md=clean(md)
    title=re.search(r'^# (.*)$', md, re.M).group(1).strip()
    title=re.sub(r'^[^.]{1,12}\.\s*','',title)
    lk=re.search(r'논문 연결: (.*)$', md, re.M)
    link=lk.group(1) if lk else ''
    link=re.sub(r'\*\*|\$[^$]*\$|"[^"]*"','',link).strip(' ,')
    link=re.sub(r'\s+',' ',link)[:70]
    pages.append(dict(id=did,short=title,md=md,link=('논문 연결: '+link) if link else '',lesson=True))
rm=open(f'{SRC}/week3-4_개요.md').read()
pages.append(dict(id='roadmap',short='3주차 안내',md=clean(rm),link=''))
css=open(f'{HERE}/style.css').read()+'\n'+open(f'{HERE}/play.css').read()
js='const PAGES = '+json.dumps(pages,ensure_ascii=False).replace('</','<\\/')+';\n'+open(f'{HERE}/data.js').read()+'\n'+open(f'{HERE}/widgets.js').read()+'\n'+open(f'{HERE}/play.js').read()+'\n'+open(f'{HERE}/refs.js').read()+'\n'+open(f'{HERE}/practice-data.js').read()+'\n'+open(f'{HERE}/practice.js').read()+'\n'+open(f'{HERE}/speak-data.js').read()+'\n'+open(f'{HERE}/speak.js').read()+'\n'+open(f'{HERE}/app.js').read()+'\n'+open(f'{HERE}/pwa.js').read()
html=f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Seq2Seq 논문(2014)으로 선형대수·베이즈·엔트로피·중심극한정리·teacher forcing을 하루 30분씩 배우는 인터랙티브 교재">
<title>AI 듀오링고</title>
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#f5f7fb" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f131b" media="(prefers-color-scheme: dark)">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="AI 듀오링고">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Jua&display=swap">
<style>
body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}
{css}
</style>
</head>
<body>
<header class="top">
  <a class="skip" href="#main">본문으로 건너뛰기</a>
  <a class="brand" href="#home" aria-label="AI 듀오링고 홈"><span id="brandmark"></span><b>AI 듀오링고</b></a>
  <div class="grow"></div>
  <span class="stat" id="streak"></span><span class="stat" id="xp"></span><a class="stat" id="lvl" href="#settings" style="text-decoration:none"></a>
  <div class="prog"><span id="progtxt">완료 0/10</span><div class="bar"><i id="progbar" style="width:0"></i></div></div>
</header>
<div class="shell">
  <nav class="rail" id="rail" aria-label="교재 목차"></nav>
  <main id="main"><div class="page"><article class="lesson" id="lesson"></article><aside class="toc" id="toc"></aside></div><section class="practice" id="practice" hidden aria-label="연습 문제"></section></main>
</div>
<nav class="tabs" id="tabs" aria-label="주요 화면"></nav>
<button class="fab" id="fab" type="button">용어 사전<kbd>?</kbd></button>
<script src="vendor/marked.min.js"></script>
<script src="vendor/katex.min.js"></script>
<script>
{js}
</script>
</body>
</html>
'''
PUB=os.path.join(ROOT,'public')
bid=hashlib.sha256(html.encode()).hexdigest()[:10]
html=html.replace('__BUILD__',bid)
out=os.path.join(PUB,'index.html')
open(out,'w').write(html)
# 서비스 워커: 빌드마다 첫 줄의 id가 달라져야 브라우저가 새 버전을 설치한다
sw=open(f'{HERE}/sw.js').read()
first='const BUILD_ID = "dev";'
assert sw.startswith(first)
open(os.path.join(PUB,'sw.js'),'w').write(f'const BUILD_ID = "{bid}";'+sw[len(first):])
print(out, len(html), 'build', bid)
