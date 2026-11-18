// 근거와 참고 자료. 레슨 id별 배열, 첫 줄이 채점 화면에도 붙는다.
// t: 저자(연도) 제목, u: 링크, w: 어느 부분, n: 이 레슨이 그 자료에서 가져온 것
const S2S = "https://arxiv.org/abs/1409.3215";
const DLB = "https://www.deeplearningbook.org/contents/";
const REFS = {
  day01: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "2장, 3.8절", n: "문장을 고정 길이 벡터 v 하나로 바꾼다는 구조와, 뜻이 비슷한 문장의 벡터가 가까이 모인다는 관찰" },
    { t: "Mikolov 외 (2013) Efficient Estimation of Word Representations in Vector Space", u: "https://arxiv.org/abs/1301.3781", w: "4장", n: "단어 벡터의 방향이 뜻을 담고, 코사인 유사도로 비슷한 단어를 찾는다는 내용" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "linear_algebra.html", w: "2장 선형대수 (2.1, 2.5)", n: "벡터, 내적, 노름의 정의" }
  ],
  day02: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.4절", n: "4층 LSTM, 층마다 1000개 셀, 1000차원 임베딩, 파라미터 3억 8천4백만 개라는 숫자" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "linear_algebra.html", w: "2장 선형대수 (2.2)", n: "행렬과 벡터의 곱, shape 규칙" }
  ],
  day03: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "2장 식 (1)", n: "출력 문장의 확률을 단어별 조건부확률의 곱으로 쓰는 식" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "prob.html", w: "3장 확률 (3.5, 3.6)", n: "조건부확률의 정의와 연쇄법칙" }
  ],
  day04: [
    { t: "Brown 외 (1993) The Mathematics of Statistical Machine Translation", u: "https://aclanthology.org/J93-2003/", w: "1~2장", n: "번역을 베이즈 정리로 쪼개는 방식: 가능도(번역 모델) × 사전확률(언어 모델)" },
    { t: "Gigerenzer, Hoffrage (1995) How to Improve Bayesian Reasoning Without Instruction: Frequency Formats", u: "https://doi.org/10.1037/0033-295X.102.4.684", w: "", n: "확률 대신 '1,000명 중 몇 명'으로 세면 베이즈 문제를 훨씬 잘 푼다는 실험. 이 레슨이 사람 수로 먼저 세는 이유" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.2절", n: "가장 그럴듯한 번역을 고르는 argmax 식" }
  ],
  day05: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "2장, 3.2절", n: "어휘 전체에 대한 소프트맥스와, 로그 확률을 더하는 학습 목표" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "numerical.html", w: "4장 수치 계산 (4.1)", n: "소프트맥스에서 최댓값을 빼 넘침을 막는 방법" },
    { t: "Hinton, Vinyals, Dean (2015) Distilling the Knowledge in a Neural Network", u: "https://arxiv.org/abs/1503.02531", w: "2장", n: "temperature로 소프트맥스 분포를 부드럽게 만드는 식" }
  ],
  day06: [
    { t: "Shannon (1948) A Mathematical Theory of Communication", u: "https://doi.org/10.1002/j.1538-7305.1948.tb01338.x", w: "6절", n: "엔트로피 H = −Σ p log p의 정의와 비트 단위" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.3절", n: "입력을 뒤집자 perplexity가 5.8에서 4.7로 내려갔다는 결과" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "prob.html", w: "3장 (3.13 정보이론)", n: "놀람(자기 정보)과 엔트로피의 관계" }
  ],
  day07: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.2절", n: "정답 번역의 로그 확률을 최대화하는 학습 목표 (= 크로스엔트로피 최소화)" },
    { t: "Kullback, Leibler (1951) On Information and Sufficiency", u: "https://doi.org/10.1214/aoms/1177729694", w: "", n: "두 분포의 차이를 재는 KL 발산의 정의" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "prob.html", w: "3장 (3.13)", n: "H(p, q) = H(p) + KL(p‖q) 관계" }
  ],
  day08: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.4절", n: "모멘텀 없는 SGD, 학습률 0.7, 배치 128, 그래디언트 노름이 5를 넘으면 줄이는 설정" },
    { t: "Robbins, Monro (1951) A Stochastic Approximation Method", u: "https://doi.org/10.1214/aoms/1177729586", w: "", n: "일부 표본만 보고 조금씩 고쳐 가는 확률적 경사하강법의 뿌리" },
    { t: "Pascanu, Mikolov, Bengio (2013) On the Difficulty of Training Recurrent Neural Networks", u: "https://arxiv.org/abs/1211.5063", w: "3.2절", n: "기울기 폭발과 그래디언트 클리핑" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "optimization.html", w: "8장 최적화 (8.1, 8.3)", n: "미니배치와 학습률" }
  ],
  day09: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.4절", n: "파라미터를 −0.08 ~ 0.08 균등분포로 초기화하고 128문장 배치의 평균 기울기를 쓴다는 설정" },
    { t: "Glorot, Bengio (2010) Understanding the Difficulty of Training Deep Feedforward Neural Networks", u: "https://proceedings.mlr.press/v9/glorot10a.html", w: "4장", n: "초기값의 분산이 층을 지나며 신호 크기를 어떻게 바꾸는지" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "prob.html", w: "3장 (3.9.3 정규분포)", n: "중심극한정리와 정규분포가 자주 나오는 이유" }
  ],
  day10: [
    { t: "Williams, Zipser (1989) A Learning Algorithm for Continually Running Fully Recurrent Neural Networks", u: "https://doi.org/10.1162/neco.1989.1.2.270", w: "", n: "teacher forcing이라는 이름과 방법이 처음 나온 논문" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "2장", n: "RNN 식, 인코더와 디코더, <EOS>로 문장을 끝내는 방식" },
    { t: "Bengio 외 (2015) Scheduled Sampling for Sequence Prediction with Recurrent Neural Networks", u: "https://arxiv.org/abs/1506.03099", w: "2장", n: "학습 때와 실전의 입력이 달라 생기는 문제(노출 편향)와 완화 방법" },
    { t: "Hochreiter, Schmidhuber (1997) Long Short-Term Memory", u: "https://doi.org/10.1162/neco.1997.9.8.1735", w: "", n: "LSTM의 원 논문 (Day 11에서 자세히)" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "rnn.html", w: "10장 (10.2.1)", n: "teacher forcing 설명" }
  ],
  prep01: [
    { t: "칸아카데미 한국어 수학 (분수, 소수, 비율)", u: "https://ko.khanacademy.org/math", w: "기초 산수", n: "분수와 소수, 비율 계산을 영상과 연습 문제로 다시 익힐 수 있는 무료 강의" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "prob.html", w: "3장 3.3절", n: "확률이 0과 1 사이의 값이고 모두 더하면 1이라는 정의" }
  ],
  prep02: [
    { t: "칸아카데미 한국어 수학 (지수와 거듭제곱)", u: "https://ko.khanacademy.org/math", w: "지수", n: "0제곱, 음수 지수, 지수법칙 연습" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "numerical.html", w: "4장 4.1절", n: "소프트맥스가 exp로 계산되고, 같은 수를 빼도 결과가 같다는 성질" }
  ],
  prep03: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.4절", n: "입력 단어 160,000개, 출력 단어 80,000개, 파라미터 3억 8천4백만 개라는 모델 규모" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "numerical.html", w: "4장 4.1절", n: "아주 작은 수가 0으로 뭉개지는 underflow" }
  ],
  prep04: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.2절", n: "정답 번역의 로그 확률을 최대화하도록 학습한다는 목표" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "numerical.html", w: "4장 4.1절", n: "underflow와, 로그 영역에서 계산해 이를 피하는 방법" },
    { t: "칸아카데미 한국어 수학 (로그)", u: "https://ko.khanacademy.org/math", w: "로그", n: "로그의 정의와 성질 연습" }
  ],
  prep05: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "2장 식 (1), 3.2절", n: "출력 확률을 단어별 조건부확률의 곱(∏)으로 쓰고, 학습 목표를 문장들의 평균(1/|S| Σ)으로 쓴 식" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "notation.html", w: "표기법", n: "Σ, ∏, 아래첨자 같은 기호의 뜻" }
  ],
  prep06: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "2장", n: "LSTM으로 문장을 읽고 쓴다는 구조 (게이트에 시그모이드, 기억에 tanh가 쓰임)" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "mlp.html", w: "6장 6.3절", n: "ReLU, 시그모이드, tanh 같은 은닉층 함수와 비선형 함수가 필요한 이유" }
  ],
  ev01: [
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "prob.html", w: "3장 3.8절", n: "기댓값과 분산, 표준편차의 정의" },
    { t: "Seeing Theory (Brown University)", u: "https://seeing-theory.brown.edu/", w: "Basic Probability", n: "기댓값과 분산을 움직이는 그림으로 보여 주는 무료 사이트" }
  ],
  dx01: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.4절", n: "학습률 0.7의 SGD로 학습했다는 설정" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "numerical.html", w: "4장 4.3절", n: "기울기와 경사하강, 학습률의 정의" }
  ],
  prep07: [
    { t: "NumPy 공식 문서: the absolute basics for beginners", u: "https://numpy.org/doc/stable/user/absolute_beginners.html", w: "", n: "배열 만들기, shape, 인덱싱을 처음부터 설명하는 공식 입문서 (영어)" },
    { t: "Harris 외 (2020) Array programming with NumPy", u: "https://doi.org/10.1038/s41586-020-2649-2", w: "", n: "numpy가 과학 계산의 표준 도구가 된 과정과 배열 계산의 개념을 정리한 Nature 논문" }
  ],
  nd01: [
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "prob.html", w: "3장 3.9.3절", n: "정규분포(가우시안)의 정의와 평균, 분산" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.4절", n: "문장 128개 묶음으로 기울기를 구해 그 수로 나눈다는 설정" },
    { t: "Seeing Theory (Brown University)", u: "https://seeing-theory.brown.edu/", w: "Probability Distributions", n: "정규분포와 중심극한정리를 움직이는 그림으로 보여 주는 무료 사이트" }
  ],
  day11: [
    { t: "Hochreiter, Schmidhuber (1997) Long Short-Term Memory", u: "https://doi.org/10.1162/neco.1997.9.8.1735", w: "", n: "LSTM의 원 논문. 기억을 더하기로 전달해 기울기 소실을 피하는 아이디어" },
    { t: "Olah (2015) Understanding LSTM Networks", u: "https://colah.github.io/posts/2015-08-Understanding-LSTMs/", w: "", n: "게이트와 셀 상태를 그림으로 풀어 쓴 가장 유명한 해설 글" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "1장, 3.4절", n: "LSTM을 고른 이유, 4층 LSTM에 층마다 셀 1000개라는 설정" },
    { t: "Pascanu, Mikolov, Bengio (2013) On the difficulty of training recurrent neural networks", u: "https://arxiv.org/abs/1211.5063", w: "2장", n: "기울기 소실과 폭발이 반복되는 곱셈에서 나온다는 분석" }
  ],
  day12: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.3절", n: "입력을 뒤집어 perplexity 5.8→4.7, BLEU 25.9→30.6이 된 결과와 minimal time lag 설명" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.2절, 표 1", n: "빔 서치 절차와 빔 크기 1, 2, 12의 BLEU" }
  ],
  day13: [
    { t: "Papineni, Roukos, Ward, Zhu (2002) BLEU: a Method for Automatic Evaluation of Machine Translation", u: "https://aclanthology.org/P02-1040/", w: "2장", n: "BLEU의 원 논문. 클리핑한 n-gram 정밀도와 짧은 번역 벌점의 정의" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.6절, 표 1과 표 2", n: "BLEU 34.81 대 기준선 33.30, 다시 채점했을 때 36.5" },
    { t: "Post (2018) A Call for Clarity in Reporting BLEU Scores", u: "https://arxiv.org/abs/1804.08771", w: "", n: "같은 BLEU라도 계산 설정에 따라 점수가 달라진다는 지적 (BLEU를 읽을 때의 주의점)" }
  ],
  bp01: [
    { t: "Rumelhart, Hinton, Williams (1986) Learning representations by back-propagating errors", u: "https://doi.org/10.1038/323533a0", w: "", n: "역전파로 여러 층짜리 신경망을 학습할 수 있음을 보여 널리 알린 논문" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "mlp.html", w: "6장 6.5절", n: "계산 그래프와 연쇄법칙으로 역전파를 설명" },
    { t: "3Blue1Brown: Neural Networks", u: "https://www.3blue1brown.com/?topic=neural-networks", w: "", n: "역전파가 하는 일을 그림으로 보여 주는 영상 시리즈 (한글 자막)" }
  ],
  gv01: [
    { t: "Pascanu, Mikolov, Bengio (2013) On the difficulty of training recurrent neural networks", u: "https://arxiv.org/abs/1211.5063", w: "2장, 3.2절", n: "기울기 소실과 폭발의 원인 분석, 기울기 노름 자르기 제안" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.4절", n: "기울기 노름이 5를 넘으면 5로 줄인다는 설정, ±0.08 초기화" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "mlp.html", w: "6장 6.3절", n: "ReLU와 시그모이드 같은 은닉층 함수의 비교" }
  ],
  opt01: [
    { t: "Kingma, Ba (2014) Adam: A Method for Stochastic Optimization", u: "https://arxiv.org/abs/1412.6980", w: "2장, 알고리즘 1", n: "Adam의 식과 기본값 (β₁ = 0.9, β₂ = 0.999, 학습률 0.001)" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "optimization.html", w: "8장 8.3절, 8.5절", n: "모멘텀과 가중치별 학습률 방법(Adam 포함)" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.4절", n: "학습률 0.7에서 시작해 5 에폭 이후 반 에폭마다 절반으로 줄인 설정" }
  ],
  norm01: [
    { t: "Ioffe, Szegedy (2015) Batch Normalization", u: "https://arxiv.org/abs/1502.03167", w: "3장", n: "배치 정규화의 식과 γ, β" },
    { t: "Ba, Kiros, Hinton (2016) Layer Normalization", u: "https://arxiv.org/abs/1607.06450", w: "3장", n: "층 정규화. 배치 대신 한 샘플 안에서 통계를 구함" },
    { t: "He, Zhang, Ren, Sun (2015) Deep Residual Learning for Image Recognition", u: "https://arxiv.org/abs/1512.03385", w: "3장", n: "잔차 연결 y = x + F(x)와 152층 ResNet" }
  ],
  pt01: [
    { t: "Paszke 외 (2019) PyTorch: An Imperative Style, High-Performance Deep Learning Library", u: "https://arxiv.org/abs/1912.01703", w: "", n: "PyTorch의 설계와 자동 미분을 설명한 논문" },
    { t: "PyTorch 공식 튜토리얼: Learn the Basics", u: "https://docs.pytorch.org/tutorials/beginner/basics/intro.html", w: "", n: "텐서, 자동 미분, 학습 루프를 처음부터 따라 하는 공식 입문서 (영어)" }
  ],
  vs01: [
    { t: "Mikolov, Chen, Corrado, Dean (2013) Efficient Estimation of Word Representations in Vector Space", u: "https://arxiv.org/abs/1301.3781", w: "", n: "단어 벡터의 덧셈과 뺄셈으로 뜻의 관계를 찾는 실험 (King − Man + Woman ≈ Queen)" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "linear_algebra.html", w: "2장 2.4절", n: "선형종속과 생성(span)의 정의" },
    { t: "3Blue1Brown: Essence of Linear Algebra", u: "https://www.3blue1brown.com/?topic=linear-algebra", w: "", n: "선형결합, 생성, 기저를 움직이는 그림으로 설명 (한글 자막)" }
  ],
  rk01: [
    { t: "Strang, MIT 18.06 Linear Algebra (MIT OpenCourseWare)", u: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/", w: "", n: "열공간, 영공간, 랭크를 처음부터 다루는 무료 강의" },
    { t: "3Blue1Brown: Essence of Linear Algebra", u: "https://www.3blue1brown.com/?topic=linear-algebra", w: "", n: "선형변환, 행렬식, 랭크와 영공간을 그림으로 설명" },
    { t: "Hu 외 (2021) LoRA: Low-Rank Adaptation of Large Language Models", u: "https://arxiv.org/abs/2106.09685", w: "4.1절", n: "랭크가 낮은 행렬만 학습해 큰 모델을 고치는 방법 (10단계에서 자세히)" }
  ],
  or01: [
    { t: "Strang, MIT 18.06 Linear Algebra (MIT OpenCourseWare)", u: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/", w: "", n: "직교, 사영, 최소제곱법 강의" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "linear_algebra.html", w: "2장 2.6절", n: "직교 벡터와 정규직교 행렬의 정의" }
  ],
  eg01: [
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "linear_algebra.html", w: "2장 2.7절", n: "고유값 분해의 정의와 성질" },
    { t: "Pascanu, Mikolov, Bengio (2013) On the difficulty of training recurrent neural networks", u: "https://arxiv.org/abs/1211.5063", w: "2장", n: "RNN 가중치 행렬의 가장 큰 고유값(특이값)이 크기가 1보다 작은지 큰지로 소실과 폭발의 조건을 설명" },
    { t: "3Blue1Brown: Essence of Linear Algebra", u: "https://www.3blue1brown.com/?topic=linear-algebra", w: "", n: "고유벡터와 고유값을 그림으로 설명" }
  ],
  svd01: [
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.8절, 그림 2", n: "문장 벡터를 PCA로 2차원에 그린 그림" },
    { t: "Eckart, Young (1936) The approximation of one matrix by another of lower rank", u: "https://doi.org/10.1007/BF02288367", w: "", n: "특이값이 큰 조각만 남긴 것이 가장 좋은 저랭크 근사라는 정리" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "linear_algebra.html", w: "2장 2.8절, 2.12절", n: "특이값 분해와 PCA 유도" }
  ],
  att01: [
    { t: "Bahdanau, Cho, Bengio (2014) Neural Machine Translation by Jointly Learning to Align and Translate", u: "https://arxiv.org/abs/1409.0473", w: "3장", n: "어텐션을 처음 제안한 논문. 고정 길이 벡터의 병목과 가중 평균 문맥 벡터" },
    { t: "Luong, Pham, Manning (2015) Effective Approaches to Attention-based Neural Machine Translation", u: "https://arxiv.org/abs/1508.04025", w: "3장", n: "내적 등 여러 점수 계산 방식을 비교" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "2장", n: "문장을 벡터 하나로 압축하는 원래 구조" }
  ],
  sa01: [
    { t: "Vaswani 외 (2017) Attention Is All You Need", u: "https://arxiv.org/abs/1706.03762", w: "3.2.1절", n: "Scaled Dot-Product Attention의 식과 √d_k로 나누는 이유" },
    { t: "Alammar (2018) The Illustrated Transformer", u: "https://jalammar.github.io/illustrated-transformer/", w: "", n: "Q, K, V 계산을 그림으로 한 단계씩 보여 주는 해설" }
  ],
  mh01: [
    { t: "Vaswani 외 (2017) Attention Is All You Need", u: "https://arxiv.org/abs/1706.03762", w: "3.2.2절, 3.5절", n: "헤드 8개와 d_k = 64, sin과 cos 위치 인코딩" },
    { t: "Vaswani 외 (2017) Attention Is All You Need", u: "https://arxiv.org/abs/1706.03762", w: "그림 1, 6장", n: "Transformer 전체 구조와 큰 모델의 번역 결과 (BLEU 28.4, 41.8)" },
    { t: "Alammar (2018) The Illustrated Transformer", u: "https://jalammar.github.io/illustrated-transformer/", w: "", n: "멀티헤드와 위치 인코딩 그림" }
  ],
  bg01: [
    { t: "Devlin, Chang, Lee, Toutanova (2018) BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding", u: "https://arxiv.org/abs/1810.04805", w: "3.1절", n: "15%를 가리고 맞히는 마스크 언어 모델 사전학습" },
    { t: "Brown 외 (2020) Language Models are Few-Shot Learners", u: "https://arxiv.org/abs/2005.14165", w: "2장", n: "1750억 파라미터 GPT-3와 예시 몇 개로 일을 시키는 few-shot 방식" },
    { t: "Vaswani 외 (2017) Attention Is All You Need", u: "https://arxiv.org/abs/1706.03762", w: "3.1절", n: "디코더에서 뒤쪽 위치를 보지 못하게 가리는 마스크" }
  ],
  mle01: [
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "ml.html", w: "5장 5.5절, 5.6절", n: "최대가능도 추정, 베이즈 통계와 MAP 추정" },
    { t: "Sutskever, Vinyals, Le (2014) Sequence to Sequence Learning with Neural Networks", u: S2S, w: "3.2절", n: "정답 번역의 로그 확률을 최대화하는 학습 목표 (최대가능도)" },
    { t: "Seeing Theory (Brown University)", u: "https://seeing-theory.brown.edu/", w: "Bayesian Inference", n: "가능도와 사전, 사후 분포를 움직이는 그림으로 보여 주는 무료 사이트" }
  ],
  vae01: [
    { t: "Kingma, Welling (2013) Auto-Encoding Variational Bayes", u: "https://arxiv.org/abs/1312.6114", w: "2장, 3장", n: "VAE의 원 논문. 재매개변수화와 복원 오차 + KL 손실" }
  ],
  gan01: [
    { t: "Goodfellow 외 (2014) Generative Adversarial Networks", u: "https://arxiv.org/abs/1406.2661", w: "3장, 4장", n: "GAN의 원 논문. 생성자와 판별자의 목표와 균형점 D = 1/2" }
  ],
  dif01: [
    { t: "Ho, Jain, Abbeel (2020) Denoising Diffusion Probabilistic Models", u: "https://arxiv.org/abs/2006.11239", w: "2장, 3장, 4장", n: "DDPM. 정방향과 역방향 과정, 잡음을 예측하는 단순한 손실, T = 1000" }
  ],
  pf01: [
    { t: "Axler (2024) Linear Algebra Done Right, 4판 (무료 공개)", u: "https://linear.axler.net/", w: "", n: "정의, 정리, 증명의 형식으로 쓰인 대학원 입문 선형대수 교재" },
    { t: "Hammack (2018) Book of Proof, 3판 (무료 공개)", u: "https://richardhammack.github.io/BookOfProof/", w: "4장, 6장, 9장", n: "직접 증명, 귀류법, 반례를 처음부터 가르치는 교재" }
  ],
  sp01: [
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "linear_algebra.html", w: "2장 2.7절", n: "대칭 행렬의 고유분해, 양의 정부호와 양의 준정부호" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "numerical.html", w: "4장 4.3절", n: "헤시안의 고유값으로 극소점, 극대점, 안장점을 가르는 법" },
    { t: "Strang, MIT 18.06 Linear Algebra (MIT OpenCourseWare)", u: "https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/", w: "", n: "대칭 행렬과 양의 정부호 강의가 들어 있는 무료 강좌" }
  ],
  nm01: [
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "linear_algebra.html", w: "2장 2.5절", n: "L1, L2, 최대 노름과 프로베니우스 노름" },
    { t: "Goodfellow, Bengio, Courville (2016) Deep Learning", u: DLB + "numerical.html", w: "4장 4.2절, 4.3절", n: "조건수, 그리고 조건수가 나쁠 때 경사하강이 느린 이유" }
  ],
  lr01: [
    { t: "Hu 외 (2021) LoRA: Low-Rank Adaptation of Large Language Models", u: "https://arxiv.org/abs/2106.09685", w: "4.1절", n: "LoRA의 원 논문. W + BA, B는 0으로 시작, 학습 후 합치기" },
    { t: "Eckart, Young (1936) The approximation of one matrix by another of lower rank", u: "https://doi.org/10.1007/BF02288367", w: "", n: "SVD에서 큰 특이값만 남긴 것이 가장 좋은 저랭크 근사라는 정리" }
  ],
  sl01: [
    { t: "Kaplan, McCandlish, Henighan 외 (2020) Scaling Laws for Neural Language Models", u: "https://arxiv.org/abs/2001.08361", w: "초록, 1장", n: "손실이 모델 크기, 데이터, 계산량에 대해 거듭제곱 법칙을 따른다는 관찰" },
    { t: "Hoffmann 외 (2022) Training Compute-Optimal Large Language Models", u: "https://arxiv.org/abs/2203.15556", w: "초록", n: "Chinchilla. 모델 크기와 학습 토큰을 같은 비율로. 700억 개 Chinchilla가 2800억 개 Gopher를 앞섬" }
  ],
  rl01: [
    { t: "Ouyang 외 (2022) Training language models to follow instructions with human feedback", u: "https://arxiv.org/abs/2203.02155", w: "초록, 3장", n: "InstructGPT. 시범, 보상 모델, 강화학습의 세 걸음. 13억 개 모델의 답이 1750억 개 GPT-3보다 선호됨" },
    { t: "Rafailov 외 (2023) Direct Preference Optimization: Your Language Model is Secretly a Reward Model", u: "https://arxiv.org/abs/2305.18290", w: "초록, 4장", n: "DPO. 단순한 분류 손실만으로 RLHF 문제를 푸는 방법" },
    { t: "Schulman 외 (2017) Proximal Policy Optimization Algorithms", u: "https://arxiv.org/abs/1707.06347", w: "", n: "InstructGPT가 쓴 강화학습 방법 PPO (선택)" }
  ],
  rag01: [
    { t: "Lewis 외 (2020) Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", u: "https://arxiv.org/abs/2005.11401", w: "초록, 2장", n: "RAG의 원 논문. 위키백과의 벡터 색인에서 문서를 찾아 생성에 쓰는 방법" },
    { t: "Wei 외 (2022) Chain-of-Thought Prompting Elicits Reasoning in Large Language Models", u: "https://arxiv.org/abs/2201.11903", w: "초록, 2장", n: "풀이가 달린 예시 8개만으로 수학 문장제(GSM8K) 성능이 크게 오름" }
  ],
  moe01: [
    { t: "Fedus, Zoph, Shazeer (2021) Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity", u: "https://arxiv.org/abs/2101.03961", w: "초록, 2장", n: "토큰마다 전문가 한 명만 고르는 MoE. T5-XXL보다 4배 빠른 학습" }
  ],
  mm01: [
    { t: "Dosovitskiy 외 (2020) An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", u: "https://arxiv.org/abs/2010.11929", w: "3.1절", n: "ViT. 그림을 패치로 잘라 트랜스포머에 넣는 방법" },
    { t: "Radford 외 (2021) Learning Transferable Visual Models From Natural Language Supervision", u: "https://arxiv.org/abs/2103.00020", w: "초록, 2장", n: "CLIP. 그림과 글 4억 쌍의 대조 학습, 이미지넷 제로샷 분류" }
  ]
};
// 이 앱의 학습 방식(문제를 풀며 떠올리기, 능동 학습)이 기대는 연구
const METHOD_REFS = [
  { t: "Roediger, Karpicke (2006) Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention", u: "https://doi.org/10.1111/j.1467-9280.2006.01693.x", w: "", n: "다시 읽는 것보다 문제를 풀며 떠올릴 때 오래 기억한다는 실험. 레슨마다 연습 문제를 두고 틀린 문제를 다시 내는 이유" },
  { t: "Freeman 외 (2014) Active Learning Increases Student Performance in Science, Engineering, and Mathematics", u: "https://doi.org/10.1073/pnas.1319030111", w: "", n: "듣기만 하는 수업보다 직접 해 보는 수업의 성적이 높다는 225개 연구 종합. 손계산과 실습 위젯을 넣은 이유" }
];
function refList(list) {
  return h("ol", { class: "refs" }, ...list.map(r => h("li", {}, h("a", { href: r.u, target: "_blank", rel: "noopener" }, r.t), r.w ? h("span", { class: "ref-w" }, r.w) : null, /doi\.org/.test(r.u) ? null : h("span", { class: "ref-w ok" }, "열람 확인"), h("p", {}, r.n))));
}
function refSection(id) {
  if (!REFS[id]) return null;
  return h("section", { class: "refbox" }, h("h2", {}, "근거와 참고 자료"), h("p", { class: "w-hint" }, "이 레슨의 설명과 문제는 아래 자료를 바탕으로 만들었습니다. 제목을 누르면 원문이 열립니다."), refList(REFS[id]), h("a", { href: "#refs", class: "ref-all" }, "전체 참고 자료 보기"));
}
