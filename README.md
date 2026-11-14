# ai-duo-lingo

하루 30분, 논문 한 편으로 배우는 AI 수학. 듀오링고처럼 문제를 풀면서 익히는 자습 교재입니다.

첫 번째 코스는 Sutskever 외, *Sequence to Sequence Learning with Neural Networks* (2014, [arXiv 1409.3215](https://arxiv.org/abs/1409.3215))입니다. 이 논문 한 편을 따라가며 선형대수, 조건부확률과 베이즈 정리, 엔트로피와 크로스엔트로피, 중심극한정리, teacher forcing을 배웁니다.

## 바로 쓰기

`index.html` 하나로 동작하는 정적 페이지입니다. 파일을 브라우저에서 열거나, 저장소를 Vercel이나 GitHub Pages에 연결하면 됩니다. 빌드 단계나 서버가 필요 없습니다.

- 레슨 10개 (1~2주차), 3~4주차는 개요만 있습니다.
- 레슨마다 직접 만져보는 실습 위젯이 있습니다 (내적, 행렬곱, 베이즈, 소프트맥스, 엔트로피, 경사하강, 중심극한정리, teacher forcing 등).
- 레슨마다 연습 문제 10개: 객관식, 계산 입력, O/X, 순서 맞추기. 하트 3개, XP, 연속 학습일, 틀린 문제 다시 출제.
- 진도와 XP는 브라우저(localStorage)에만 저장됩니다.

## 구조

```
lessons/           레슨 원문 (마크다운). 내용을 고칠 때는 여기를 고칩니다.
  00_커리큘럼.md
  week1/ day01 ~ day05
  week2/ day06 ~ day10
  week3-4_개요.md
src/
  data.js          레슨별 도입 장면, 즉석 퀴즈, 용어 사전
  practice-data.js 연습 문제 은행 (DRILL)
  practice.js      연습 모드 (하트, XP, 연속 학습)
  widgets.js       실습 위젯
  app.js           목차, 라우팅, 마크다운 렌더링, 진도 저장
  style.css
build.py           lessons/ 와 src/ 를 합쳐 index.html 을 만듭니다.
index.html         빌드 결과물
```

## 고친 뒤 다시 빌드하기

```bash
python3 build.py
```

Python 3만 있으면 됩니다. 마크다운과 수식은 브라우저에서 marked와 KaTeX(CDN)로 그립니다.

## 레슨 추가하기

1. `lessons/weekN/dayNN_제목.md`를 같은 형식으로 씁니다 (목표, 개념, 예제, 능동 연습, 셀프 체크 퀴즈, 정답).
2. `src/data.js`에 도입 장면(`HOOKS`)과 즉석 퀴즈(`QUICK`)를, `src/practice-data.js`에 연습 문제(`DRILL`)를 추가합니다.
3. 실습 위젯이 필요하면 `src/widgets.js`에 만들고 `build.py`의 `WID`에 연결합니다.
4. `build.py`의 레슨 파일 패턴(`week[12]`)을 새 주차에 맞게 넓힙니다.
