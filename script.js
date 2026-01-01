const API_URL = 'https://script.google.com/macros/s/AKfycbylpokiuVNgggYWh7i-7-qJ5pG3G4zzwBuPiimZ3nAnDPgbn_hFF2tR22ej-qc2Awts-w/exec';

// 날짜 표시
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
});

// 실시간 프리뷰 계산 기능
const inputs = ['pushup', 'core', 'squat'];
inputs.forEach(type => {
    const repsInput = document.getElementById(`${type}Reps`);
    const setsInput = document.getElementById(`${type}Sets`);
    const preview = document.getElementById(`preview-${type}`);

    const updatePreview = () => {
        const total = (Number(repsInput.value) || 0) * (Number(setsInput.value) || 0);
        preview.innerText = `${total} total`;
    };

    repsInput.addEventListener('input', updatePreview);
    setsInput.addEventListener('input', updatePreview);
});

// 데이터 저장 (POST)
document.getElementById('saveBtn').addEventListener('click', async () => {
    const btn = document.getElementById('saveBtn');
    const data = {
        pushupReps: Number(document.getElementById('pushupReps').value) || 0,
        pushupSets: Number(document.getElementById('pushupSets').value) || 0,
        coreReps: Number(document.getElementById('coreReps').value) || 0,
        coreSets: Number(document.getElementById('coreSets').value) || 0,
        squatReps: Number(document.getElementById('squatReps').value) || 0,
        squatSets: Number(document.getElementById('squatSets').value) || 0
    };

    // 간단한 검증
    if (data.pushupReps + data.coreReps + data.squatReps === 0) {
        showToast("기록할 데이터가 없습니다.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "저장 중...";

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast("기록이 성공적으로 저장되었습니다! 💪");
        resetInputs();
        fetchHistory();
    } catch (error) {
        console.error(error);
        showToast("저장 실패. 네트워크를 확인하세요.");
    } finally {
        btn.disabled = false;
        btn.innerText = "기록 저장하기";
    }
});

// 데이터 불러오기 (GET)
async function fetchHistory() {
    const container = document.getElementById('historyList');
    try {
        const response = await fetch(API_URL);
        const logs = await response.json();
        
        renderHistory(logs);
        updateSummary(logs[0]); // 가장 최근 데이터를 요약에 반영
    } catch (error) {
        container.innerHTML = `<p class="loading-text">데이터를 불러오지 못했습니다.</p>`;
    }
}

function renderHistory(logs) {
    const container = document.getElementById('historyList');
    if (!logs || logs.length === 0) {
        container.innerHTML = `<p class="loading-text">아직 기록이 없습니다.</p>`;
        return;
    }

    container.innerHTML = logs.map(log => `
        <div class="history-card">
            <div class="history-date">${log.날짜}</div>
            <div class="history-stats">
                <div class="stat-box" style="border-top: 3px solid var(--pushup-color)">
                    <span class="type">푸쉬업</span>
                    <span class="count">${log.푸쉬업_총합}</span>
                </div>
                <div class="stat-box" style="border-top: 3px solid var(--core-color)">
                    <span class="type">코어</span>
                    <span class="count">${log.코어_총합}</span>
                </div>
                <div class="stat-box" style="border-top: 3px solid var(--squat-color)">
                    <span class="type">스쿼트</span>
                    <span class="count">${log.스쿼트_총합}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 상단 요약 업데이트
function updateSummary(lastLog) {
    if(!lastLog) return;
    document.getElementById('today-pushup').innerText = lastLog.푸쉬업_총합 || 0;
    document.getElementById('today-core').innerText = lastLog.코어_총합 || 0;
    document.getElementById('today-squat').innerText = lastLog.스쿼트_총합 || 0;
}

// 토스트 알림 기능
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// 입력란 초기화
function resetInputs() {
    inputs.forEach(type => {
        document.getElementById(`${type}Reps`).value = '';
        document.getElementById(`${type}Sets`).value = '';
        document.getElementById(`preview-${type}`).innerText = '0 total';
    });
}

// 새로고침 버튼
document.getElementById('refreshBtn').addEventListener('click', fetchHistory);

// 초기 실행
fetchHistory();
