const uploader = document.getElementById('uploader');
const msg = document.getElementById('msg');
const status = document.getElementById('status');

let key;
let ok;

function handleFileClick() {
    new Promise((_ok) => ok = _ok)
    .then(([file, fileName]) => upload(file, fileName));

    uploader.click();
}

function handleTextClick() {
    const txt = prompt('input text');

    if (!!txt) {
        upload(txt);
    }
}

async function waitForClient() {
    await new Promise((ok) => {
        const lp = (async () => {
            const resp = await(await fetch(`/status?key=${key}`)).json();
            
            if (!resp.result) {
                setTimeout(lp, 300);
            } else {
                ok();
            }
        });

        setTimeout(lp, 300);
    });
}

async function upload(body, name) {
    let resp = await(await fetch('/new-session')).json();

    key = resp.result;

    if (name === undefined) {
        name = `${key}.txt`;
    }

    msg.innerText = key;

    await waitForClient();
    
    status.innerText = 'uploading...';
    resp = await(await fetch(`/upload?key=${key}&fileName=${encodeURIComponent(name)}`, {
        method: 'post',
        body,
    })).json();

    if (!resp.result) {
        status.innerText = 'error...';
    } else {
        status.innerText = 'completed';
    }
}

uploader.addEventListener('change', (e) => {
    const file = e.target.files[0];

    ok([file, file.name]);
});