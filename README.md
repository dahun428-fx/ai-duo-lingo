# ai-duo-lingo

하루 30분, 논문 한 편으로 배우는 AI 수학. 듀오링고처럼 문제를 풀면서 익히는 자습 교재입니다.

첫 번째 코스는 Sutskever 외, *Sequence to Sequence Learning with Neural Networks* (2014, [arXiv 1409.3215](https://arxiv.org/abs/1409.3215))입니다. 이 논문 한 편을 따라가며 선형대수, 조건부확률과 베이즈 정리, 엔트로피와 크로스엔트로피, 중심극한정리, teacher forcing을 배웁니다.

## 바로 쓰기 (웹과 앱)

`public/` 폴더가 배포물 전부인 정적 사이트입니다. 서버도, 로그인도 없습니다.

- 웹: 저장소를 Vercel에 연결하면 `vercel.json` 설정대로 `public/`이 그대로 올라갑니다 (빌드 단계 없음, main만 배포).
- 앱: 배포된 주소를 폰에서 열고 홈 화면에 추가하면 주소창 없는 앱(PWA)으로 열립니다. 한 번 연 뒤에는 인터넷이 없어도 레슨과 연습이 열립니다. 앱 안의 "앱 설치와 진도" 화면에 안내가 있습니다.
- 내 컴퓨터에서 보기: `python3 -m http.server -d public 8000` 뒤 http://localhost:8000

기능

- 과목 5개, 챕터(레슨) 10개. 3~4주차는 개요만 있습니다.
- 레슨마다 실습 위젯, 연습 문제 10개(객관식, 계산, O/X, 순서 맞추기), 힌트, 하트 3개, XP와 레벨, 연속 학습일.
- 면접에서 말해보기: 챕터마다 면접 질문과 1분 답변 스크립트. 읽기, 가리고 말하기(녹음과 받아쓰기는 기기 안에서만), 핵심어 점검.
- 근거와 참고 자료: 레슨 끝과 채점 화면에 논문, 교과서 링크와 해당 절.
- 진도는 기기(localStorage)에만 저장됩니다. 기기 사이에는 "진도 코드"를 복사해 옮깁니다.

## 구조

```
lessons/             레슨 원문 (마크다운). 내용을 고칠 때는 여기를 고칩니다.
src/
  data.js            도입 장면(HOOKS), 즉석 퀴즈(QUICK), 용어 사전, 과목과 챕터(SUBJECTS)
  practice-data.js   연습 문제 은행 (DRILL)
  practice.js        연습 모드 (하트, 힌트, XP, 레벨, 연속 학습)
  speak-data.js      면접 질문과 답변 스크립트 (SPEAK)
  speak.js           면접에서 말해보기 화면
  refs.js            레슨별 근거 자료 (REFS)
  widgets.js         실습 위젯
  app.js             목차, 라우팅, 마크다운 렌더링, 진도 저장
  pwa.js             앱 설치, 서비스 워커 등록, 진도 코드
  sw.js              서비스 워커 원본 (build.py가 빌드 id를 넣어 public/sw.js로 만듦)
  style.css
build.py             lessons/ 와 src/ 를 합쳐 public/index.html, public/sw.js 를 만듭니다.
public/              배포물: index.html, sw.js, manifest.webmanifest, icons/, vendor/(marked, KaTeX)
vercel.json          Vercel 배포 설정
```

## 고친 뒤 다시 빌드하기

```bash
python3 build.py
```

Python 3만 있으면 됩니다. 빌드 결과(`public/`)도 함께 커밋합니다. Vercel은 빌드를 돌리지 않고 `public/`을 그대로 올리기 때문입니다.

## 레슨 추가하기

1. `lessons/weekN/dayNN_제목.md`를 같은 형식으로 씁니다 (목표, 개념, 예제, 능동 연습, 셀프 체크 퀴즈, 정답).
2. `src/data.js`에 도입 장면(`HOOKS`), 즉석 퀴즈(`QUICK`), 챕터(`SUBJECTS`)를, `src/practice-data.js`에 연습 문제(`DRILL`)를, `src/speak-data.js`에 면접 질문(`SPEAK`)을, `src/refs.js`에 근거 자료(`REFS`)를 추가합니다.
3. 실습 위젯이 필요하면 `src/widgets.js`에 만들고 `build.py`의 `WID`에 연결합니다.
4. `build.py`의 레슨 파일 패턴(`week[12]`)을 새 주차에 맞게 넓힙니다.
