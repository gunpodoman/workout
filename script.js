const API_URL = 'https://script.google.com/macros/s/AKfycbylpokiuVNgggYWh7i-7-qJ5pG3G4zzwBuPiimZ3nAnDPgbn_hFF2tR22ej-qc2Awts-w/exec';

// 날짜 표시
document.getElementById('current-date').innerText = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
});

// 실시간 프리뷰 로직 (기존과 동일)
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

    if (data.pushupReps + data.coreReps + data.squatReps === 0) {
        showToast("기록할 데이터가 없습니다.");
        return;
    }

    btn.disabled = true;
    btn.innerText = "저장 중...";

    try {
        // POST 요청 시 mode: 'no-cors'를 쓰면 응답 확인이 어려우므로 
        // 앱스 스크립트에서 응답을 제대로 주도록 설정하는 것이 중요합니다.
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showToast("저장 완료! 데이터를 새로고침합니다.");
        resetInputs();
        // 저장 후 1.5초 뒤에 목록 업데이트 (구글 시트 반영 시간 고려)
        setTimeout(fetchHistory, 1500);
    } catch (error) {
        console.error("Save Error:", error);
        showToast("저장 중 오류가 발생했습니다.");
    } finally {
        btn.disabled = false;
        btn.innerText = "기록 저장하기";
    }
});

// 데이터 불러오기 (GET) - 보완된 핵심 로직
async function fetchHistory() {
    const container = document.getElementById('historyList');
    container.innerHTML = `<p class="loading-text text-center py-10">데이터를 동기화 중...</p>`;
    
    try {
        // 💡 중요: URL 뒤에 ?t=[시간]을 붙여 브라우저 캐시를 방지합니다.
        const response = await fetch(`${API_URL}?t=${Date.now()}`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const logs = await response.json();
        renderHistory(logs);
        
        if (logs && logs.length > 0) {
            updateSummary(logs[0]); // 가장 최신 기록 요약
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        container.innerHTML = `
            <div class="text-center py-10">
                <p class="text-red-500 mb-2">데이터를 불러오지 못했습니다.</p>
                <button onclick="fetchHistory()" class="text-sm text-blue-500 underline">다시 시도</button>
            </div>`;
    }
}

function renderHistory(logs) {
    const container = document.getElementById('historyList');
    
    if (!Array.isArray(logs) || logs.length === 0) {
        container.innerHTML = `<p class="loading-text text-center py-10 text-slate-400">저장된 운동 기록이 없습니다.</p>`;
        return;
    }

    container.innerHTML = logs.map(log => `
        <div class="history-card">
            <div class="history-date">${log.날짜}</div>
            <div class="history-stats">
                <div class="stat-box" style="border-top: 3px solid var(--pushup-color)">
                    <span class="type">푸쉬업</span>
                    <span class="count">${log.푸쉬업_총합 || 0}</span>
                </div>
                <div class="stat-box" style="border-top: 3px solid var(--core-color)">
                    <span class="type">코어</span>
                    <span class="count">${log.코어_총합 || 0}</span>
                </div>
                <div class="stat-box" style="border-top: 3px solid var(--squat-color)">
                    <span class="type">스쿼트</span>
                    <span class="count">${log.스쿼트_총합 || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function updateSummary(lastLog) {
    if(!lastLog) return;
    document.getElementById('today-pushup').innerText = lastLog.푸쉬업_총합 || 0;
    document.getElementById('today-core').innerText = lastLog.코어_총합 || 0;
    document.getElementById('today-squat').innerText = lastLog.스쿼트_총합 || 0;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function resetInputs() {
    inputs.forEach(type => {
        document.getElementById(`${type}Reps`).value = '';
        document.getElementById(`${type}Sets`).value = '';
        document.getElementById(`preview-${type}`).innerText = '0 total';
    });
}

document.getElementById('refreshBtn').addEventListener('click', fetchHistory);

// 초기 실행
fetchHistory();
