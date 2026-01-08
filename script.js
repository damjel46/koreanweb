let allWords = [];
let quizQueue = [];
let currentItem = null;
let score = 0;
let timeLeft = 0;
let timerObj = null;
let mode = 'study';
let isHintUsed = false;
let isAnswerUsed = false;

window.addEventListener('load', async () => {
    await loadData();
    showHighScore();
    showScreen('screen-home');
    const inputField = document.getElementById('et-answer');
});

async function loadData() {
    try {
        const response = await fetch('./data.json'); 
        if (!response.ok) throw new Error('데이터 로드 실패');
        
        allWords = await response.json();
    } catch (error) {
        console.error("에러:", error);
        alert("단어 데이터를 가져오지 못했습니다.");
    }
}

//게임 시작 함수
function startGame(selectedMode, seconds = 0) {
    mode = selectedMode;
    score = 0;
    document.getElementById('score-display').innerText = score;

    // 데이터 셔플
    quizQueue = shuffle(allWords);

    // 모드 설정
    if (mode === 'challenge') {
        timeLeft = seconds;
        document.getElementById('btn-pass').innerText = "PASS (-5초)";
        document.getElementById('timer-label').innerText = "TIME";
        document.getElementById('timer-badge').className = "badge bg-danger rounded-pill px-3 py-2";
        runTimer();
    } else {
        document.getElementById('timer-display').innerText = "∞";
        document.getElementById('timer-label').innerText = "STUDY";
        document.getElementById('timer-badge').className = "badge bg-success rounded-pill px-3 py-2";
        document.getElementById('btn-pass').innerText = "정답 보기";
    }

    // 1. 레이아웃 확장 애니메이션 시작
    document.getElementById('main-row').classList.add('game-mode');

    // 2. 홈 화면 페이드 아웃
    const homeScreen = document.getElementById('screen-home');
    homeScreen.style.opacity = '0';

    // 3. 애니메이션 시간(0.6초) 절반쯤 지났을 때 내용 교체
    setTimeout(() => {
        homeScreen.classList.remove('active'); // 홈 끄기
        nextQuestion(); // 첫 문제 세팅

        const gameScreen = document.getElementById('screen-game');
        gameScreen.classList.add('active'); // 게임 화면 켜기 (하지만 투명함)

        // 약간의 딜레이 후 페이드 인 (부드럽게)
        setTimeout(() => {
            gameScreen.style.opacity = '1';
        }, 50);

    }, 500);
}

function goHome() {
    clearInterval(timerObj);
    showHighScore();

    // 1. 현재 화면 페이드 아웃
    const currentScreens = document.querySelectorAll('.screen.active');
    currentScreens.forEach(s => s.style.opacity = '0');

    // 2. 레이아웃 원상 복구 (박스 줄어듬)
    document.getElementById('main-row').classList.remove('game-mode');

    setTimeout(() => {
        currentScreens.forEach(s => s.classList.remove('active'));

        const homeScreen = document.getElementById('screen-home');
        homeScreen.classList.add('active');

        setTimeout(() => {
            homeScreen.style.opacity = '1';
        }, 150);
    }, 500);
}

function nextQuestion() {
    if (quizQueue.length === 0) quizQueue = [...allWords].sort(() => Math.random() - 0.5);

    currentItem = quizQueue.pop();
    isHintUsed = false;
    isAnswerUsed = false;

    document.getElementById('tv-initial').innerText = currentItem.initial;
    document.getElementById('tv-mean').innerText = currentItem.mean;
    document.getElementById('tv-example').innerText = currentItem.example.replace(currentItem.word, "___");

    document.getElementById('tv-example-box').style.display = 'none';
    document.getElementById('et-answer').value = '';
    document.getElementById('feedback-msg').innerText = '';
    document.getElementById('quiz-card').classList.remove('shake-anim');

}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; 
    }
    return array;
}

function checkAnswer() {
    const userVal = document.getElementById('et-answer').value.trim();
    const feedback = document.getElementById('feedback-msg');
    const card = document.getElementById('quiz-card');

    if (userVal === currentItem.word && isAnswerUsed === true) {
        feedback.innerText = "정답확인 점수 미처리 😢"
        feedback.style.color = "#dc3545";
        void card.offsetWidth;
        card.classList.add('shake-anim');
        setTimeout(() => {
            card.classList.remove('shake-anim');
            nextQuestion();

        }, 500);
    } else {
        if (userVal === currentItem.word) {
            void card.offsetWidth;
            card.classList.add('shake-anim-solution');
            setTimeout(() => {
                card.classList.remove('shake-anim-solution');
            }, 500)
            score++;
            document.getElementById('score-display').innerText = score;
            feedback.innerText = "정답입니다! 👏";
            feedback.style.color = "#198754";
            setTimeout(nextQuestion, 800);
        } else {
            void card.offsetWidth;
            card.classList.add('shake-anim');
            setTimeout(() => {
                card.classList.remove('shake-anim');
            }, 500)
            if (mode === 'challenge') {
                penalty(2, "오답! (-2초)");
            } else {
                feedback.innerText = "다시 생각해보세요! 😢";
                feedback.style.color = "#dc3545";
                document.getElementById('et-answer').value = '';
                document.getElementById('et-answer').focus();
            }
        }
    }
}

function penalty(sec, msg) {
    timeLeft -= sec;
    const feedback = document.getElementById('feedback-msg');
    feedback.innerText = msg;
    feedback.style.color = "#dc3545";
    if (timeLeft <= 0) endGame();
}

function passQuestion() {
    if (mode === 'challenge') {
        penalty(5, "패스! (-5초)");
        nextQuestion();
    } else {
        showAnswer();
    }
}




function runTimer() {
    if (timerObj) clearInterval(timerObj);
    timerObj = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        document.getElementById('timer-display').innerText = `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    clearInterval(timerObj);
    document.getElementById('final-score').innerText = score;

    const best = localStorage.getItem('webBestScore') || 0;
    if (score > best) {
        localStorage.setItem('webBestScore', score);
        document.getElementById('result-msg').innerText = "🎉 신기록 달성!";
    } else {
        document.getElementById('result-msg').innerText = "수고하셨습니다!";
    }

    const gameScreen = document.getElementById('screen-game');
    gameScreen.style.opacity = '0';

    setTimeout(() => {
        gameScreen.classList.remove('active');
        const resultScreen = document.getElementById('screen-result');
        resultScreen.classList.add('active');
        setTimeout(() => resultScreen.style.opacity = '1', 50);
    }, 400);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.opacity = '0';
    });
    const target = document.getElementById(id);
    target.classList.add('active');
    setTimeout(() => target.style.opacity = '1', 50);
}

function showHighScore() {
    const best = localStorage.getItem('webBestScore') || 0;
    const text = `최고 기록: ${best}점`;
    if (document.getElementById('pc-best-score'))
        document.getElementById('pc-best-score').innerText = text;
    if (document.getElementById('mobile-best-score'))
        document.getElementById('mobile-best-score').innerText = text;
}

function showHint() {
    document.getElementById('tv-example-box').style.display = 'block';
    isHintUsed = true;
}

function showAnswer() {
    document.getElementById('et-answer').value = currentItem.word;
    isAnswerUsed = true;
}

document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.getElementById('screen-game').classList.contains('active')) {
        checkAnswer();
    }
});