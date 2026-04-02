const uploader = document.getElementById('uploader');
const msg = document.getElementById('msg');
const status = document.getElementById('status');
const dropZone = document.getElementById('dropZone');
const fileList = document.getElementById('fileList');
const textInput = document.getElementById('textInput');

let key;

// 이모지 파티클 생성
const EMOJIS = ['🚀', '⚡', '💾', '📁', '🎉', '✨', '🌈', '💫', '🔥', '🎯'];
function spawnParticle() {
    const el = document.createElement('div');
    el.className = 'emoji-particle';
    el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    el.style.left = Math.random() * 100 + 'vw';
    const duration = 6 + Math.random() * 8;
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = Math.random() * duration + 's';
    el.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), (duration * 2) * 1000);
}
for (let i = 0; i < 12; i++) setTimeout(spawnParticle, i * 600);
setInterval(spawnParticle, 2000);

// 파일 크기 포맷
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// 파일 목록 렌더링
function renderFileList(files) {
    fileList.innerHTML = '';
    for (const f of files) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `<span class="file-icon">📄</span><span class="file-name">${f.name}</span><span class="file-size">${formatSize(f.size)}</span>`;
        fileList.appendChild(item);
    }
}

// 드래그앤드롭
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragging');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        renderFileList(files);
        handleFilesReady(files);
    }
});

dropZone.addEventListener('click', () => {
    uploader.click();
});

document.getElementById('btnFile').addEventListener('click', () => {
    uploader.click();
});

uploader.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        renderFileList(files);
        handleFilesReady(files);
    }
    uploader.value = '';
});

document.getElementById('btnText').addEventListener('click', () => {
    if (textInput.classList.contains('visible') && textInput.value.trim()) {
        upload(textInput.value.trim());
    } else {
        textInput.classList.toggle('visible');
        if (textInput.classList.contains('visible')) textInput.focus();
    }
});

// ZIP 생성 (fflate 사용)
function createZip(files) {
    return new Promise((resolve, reject) => {
        const zipData = {};
        let remaining = files.length;

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                zipData[file.name] = new Uint8Array(e.target.result);
                remaining--;
                if (remaining === 0) {
                    fflate.zip(zipData, (err, data) => {
                        if (err) reject(err);
                        else resolve(new Blob([data], { type: 'application/zip' }));
                    });
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    });
}

async function handleFilesReady(files) {
    let body, name;

    if (files.length === 1) {
        body = files[0];
        name = files[0].name;
    } else {
        setStatus('<span class="status-uploading"><span class="spinner"></span> ZIP 압축 중...</span>');
        try {
            body = await createZip(files);
            name = 'files.zip';
        } catch (_e) {
            setStatus('<span class="status-err">ZIP 압축 실패</span>');
            return;
        }
    }

    upload(body, name);
}

function copyKey() {
    navigator.clipboard.writeText(key).then(() => {
        const el = document.getElementById('sessionKey');
        if (!el) return;
        const toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.textContent = '복사됨!';
        el.appendChild(toast);
        setTimeout(() => toast.remove(), 1500);
    });
}

function setStatus(html) {
    status.innerHTML = html;
}

async function waitForClient() {
    await new Promise((ok) => {
        const lp = async () => {
            const resp = await (await fetch(`/status?key=${key}`)).json();
            if (!resp.result) {
                setTimeout(lp, 300);
            } else {
                ok();
            }
        };
        setTimeout(lp, 300);
    });
}

async function upload(body, name) {
    const isTxt = typeof body === 'string';

    fileList.innerHTML = '';
    msg.innerHTML = '';
    setStatus('<span class="status-uploading"><span class="spinner"></span> 세션 생성 중...</span>');

    const resp = await (await fetch('/new-session')).json();
    key = resp.result;

    if (name === undefined) {
        name = `${key}.txt`;
    }

    msg.innerHTML = `<div class="session-key" id="sessionKey" title="클릭해서 복사">${key}</div>`;
    document.getElementById('sessionKey').addEventListener('click', copyKey);
    setStatus('수신자가 연결되기를 기다리는 중...');

    await waitForClient();

    setStatus('<span class="status-uploading"><span class="spinner"></span> 업로드 중...</span>');

    const uploadResp = await (await fetch(
        `/upload?key=${key}&fileName=${encodeURIComponent(name)}${isTxt ? '&isTxt' : ''}`,
        { method: 'POST', body }
    )).json();

    if (!uploadResp.result) {
        setStatus('<span class="status-err">❌ 오류가 발생했습니다</span>');
    } else {
        setStatus('<span class="status-ok">✅ 전송 완료!</span>');
        msg.innerHTML = '';
        setTimeout(() => { setStatus(''); }, 3000);
    }
}
