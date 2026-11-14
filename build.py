import re, json, glob, os
ROOT=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(ROOT,'lessons')
HERE=os.path.join(ROOT,'src')
EMO=re.compile(r'[\U0001F300-\U0001FAFF☀-✒✕-➿⬀-⯿⏩-⏿️]\s?')
WID={'day01':['dot'],'day02':['matvec'],'day03':['condprob'],'day04':['bayes'],'day05':['softmax'],'day06':['entropy'],'day07':['crossent'],'day08':['gd'],'day09':['clt'],'day10':['rnn','tf']}
def clean(md): return EMO.sub('', md)
pages=[]
cur=open(f'{SRC}/00_커리큘럼.md').read()
cur=re.sub(r'\((week[12])/(day\d\d)_[^)]*\.md\)', lambda m:f'(#{m.group(2)})', cur)
cur=cur.replace('(week3-4_개요.md)','(#roadmap)')
pages.append(dict(id='home',short='교재 소개',md=clean(cur),link=''))
for f in sorted(glob.glob(f'{SRC}/week[12]/day*.md')):
    did=os.path.basename(f)[:5]
    md=open(f).read()
    if did=='day01':
        md=re.sub(r'```\n.*?```', '<div class="widget" data-w="papermap"></div>', md, count=1, flags=re.S)
    block='## 직접 만져보기\n\n'+'\n\n'.join(f'<div class="widget" data-w="{w}"></div>' for w in WID[did])+'\n\n'
    md=re.sub(r'(?m)^(## [^\n]*능동 연습)', lambda m: block+m.group(1), md, count=1)
    md=clean(md)
    title=re.search(r'^# Day \d\d\. (.*)$', md, re.M).group(1).strip()
    link=re.search(r'논문 연결: (.*)$', md, re.M).group(1)
    link=re.sub(r'\*\*|\$[^$]*\$|"[^"]*"','',link).strip(' ,')
    link=re.sub(r'\s+',' ',link)[:70]
    pages.append(dict(id=did,short=title,md=md,link='논문 연결: '+link))
rm=open(f'{SRC}/week3-4_개요.md').read()
pages.append(dict(id='roadmap',short='3~4주차 개요',md=clean(rm),link=''))
css=open(f'{HERE}/style.css').read()
js='const PAGES = '+json.dumps(pages,ensure_ascii=False).replace('</','<\\/')+';\n'+open(f'{HERE}/data.js').read()+'\n'+open(f'{HERE}/widgets.js').read()+'\n'+open(f'{HERE}/practice-data.js').read()+'\n'+open(f'{HERE}/practice.js').read()+'\n'+open(f'{HERE}/app.js').read()
html=f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Seq2Seq 논문(2014)으로 선형대수·베이즈·엔트로피·중심극한정리·teacher forcing을 하루 30분씩 배우는 인터랙티브 교재">
<title>손으로 푸는 Seq2Seq</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}
{css}
</style>
</head>
<body>
<header class="top">
  <button class="iconbtn menu-btn" id="menu" type="button" aria-label="목차 열기">목차</button>
  <a class="brand" href="#home"><b>손으로 푸는 Seq2Seq</b><span>하루 30분 · AI 논문 학습 교재</span></a>
  <div class="grow"></div>
  <span class="chip" id="streak">연속 0일</span><span class="chip" id="xp">0 XP</span>
  <div class="prog"><span id="progtxt">완료 0/10</span><div class="bar"><i id="progbar" style="width:0"></i></div></div>
</header>
<div class="shell">
  <nav class="rail" id="rail" aria-label="교재 목차"></nav>
  <main id="main"><div class="page"><article class="lesson" id="lesson"></article><aside class="toc" id="toc"></aside></div><section class="practice" id="practice" hidden aria-label="연습 문제"></section></main>
</div>
<button class="fab" id="fab" type="button">용어 사전<kbd>?</kbd></button>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script>
{js}
</script>
</body>
</html>
'''
out=os.path.join(ROOT,'index.html')
open(out,'w').write(html)
print(out, len(html))
