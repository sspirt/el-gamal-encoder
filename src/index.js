const inputP = document.getElementById('inputP');
const inputX = document.getElementById('inputX');
const inputK = document.getElementById('inputK');
const hintP = document.getElementById('hintP');
const hintX = document.getElementById('hintX');
const hintK = document.getElementById('hintK');
const hintG = document.getElementById('hintG');
const btnFindRoots = document.getElementById('btnFindRoots');
const rootsPanel = document.getElementById('rootsPanel');
const rootsList = document.getElementById('rootsList');
const rootsCount = document.getElementById('rootsCount');
const selectG = document.getElementById('selectG');
const pubKeyPanel = document.getElementById('pubKeyPanel');
const pubKeyDisplay =document.getElementById('pubKeyDisplay');
const btnOpen = document.getElementById('btnOpen');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const btnEncrypt = document.getElementById('btnEncrypt');
const btnDecrypt = document.getElementById('btnDecrypt');
const outputSection = document.getElementById('outputSection');
const decryptSection =document.getElementById('decryptSection');
const outA = document.getElementById('outA');
const outB = document.getElementById('outB');
const outDecrypted = document.getElementById('outDecrypted');
const btnSaveEnc = document.getElementById('btnSaveEnc');
const btnSaveDec = document.getElementById('btnSaveDec');

let fileBytes = null;
let fileOrigName = '';
let encryptedA = [];
let encryptedB = [];
let decryptedBytes = null;
let toastTimer = null;

function modPow(base, exp, mod) {
    base = BigInt(base); exp = BigInt(exp); mod = BigInt(mod);
    if (mod === 1n) return 0n;
    let result = 1n;
    base = base % mod;
    while (exp > 0n) {
        if (exp % 2n === 1n) result = (result * base) % mod;
        exp = exp / 2n;
        base = (base * base) % mod;
    }
    return result;
}

function extGcd(a, b) {
    a = BigInt(a);
    b = BigInt(b);
    if (b === 0n) return { g: a, x: 1n, y: 0n };
    const { g, x, y } = extGcd(b, a % b);
    return { g, x: y, y: x - (a / b) * y };
}

function gcd(a, b) {
    a = BigInt(a);
    b = BigInt(b);
    while (b) {
        [a, b] = [b, a % b];
    }
    return a;
}

function primeFactors(n) {
    n = BigInt(n);
    const factors = new Set();
    let d = 2n;
    while (d * d <= n) {
        if (n % d === 0n) {
            factors.add(d);
            while (n % d === 0n) n /= d;
        }
        d++;
    }
    if (n > 1n) factors.add(n);
    return [...factors];
}

function isPrime(n) {
    n = BigInt(n);
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;
    for (let i = 3n; i * i <= n; i += 2n) {
        if (n % i === 0n) return false;
    }
    return true;
}

function findAllPrimitiveRoots(p) {
    p = BigInt(p);
    const phi = p - 1n;
    const factors = primeFactors(phi);
    let firstRoot = null;
    for (let g = 2n; g < p; g++) {
        let isPrimRoot = true;
        for (const q of factors) {
            if (modPow(g, phi / q, p) === 1n) {
                isPrimRoot = false;
                break;
            }
        }
        if (isPrimRoot) {
            firstRoot = g;
            break;
        }
    }
    if (firstRoot === null) return [];
    const roots = [];
    for (let k = 1n; k < phi; k++) {
        if (gcd(k, phi) === 1n) {
            roots.push(modPow(firstRoot, k, p));
        }
    }
    return roots.sort((a, b) => (a < b ? -1 : 1));
}

function modInverse(a, m) {
    a = BigInt(a); m = BigInt(m);
    const { g, x } = extGcd(a, m);
    if (g !== 1n) return null;
    return ((x % m) + m) % m;
}

function getP() {
    return BigInt(inputP.value || '0');
}

function getX() {
    return BigInt(inputX.value || '0');
}

function getK() {
    return BigInt(inputK.value || '0');
}

function validateP() {
    const v = inputP.value.trim();
    if (!v) {
        setHint(hintP, ''); inputP.className='mono';
        return false;
    }
    const n = BigInt(v);
    if (!isPrime(n)) {
        setHint(hintP, '✗ Не является простым числом', 'err');
        inputP.className='mono invalid';
        return false;
    }
    if (n <= 256n) {
        setHint(hintP, '✗ Должно быть > 256', 'err');
        inputP.className='mono invalid';
        return false;
    }
    if (n >= 65536n) {
        setHint(hintP, '✗ Должно быть < 65536', 'err');
        inputP.className='mono invalid'; return false;
    }
    setHint(hintP, '✓ Корректно', 'ok');
    inputP.className='mono valid'; return true;
}

function validateX() {
    if (!validateP()) {
        setHint(hintX,'', '');
        return false;
    }
    const p = getP();
    const v = inputX.value.trim();
    if (!v) {
        setHint(hintX,''); return false;
    }
    const x = BigInt(v);
    if (x <= 1n || x >= p - 1n) {
        setHint(hintX, `✗ Должно быть: 1 < x < ${p - 1n}`, 'err');
        inputX.className='mono invalid';
        return false;
    }
    setHint(hintX, '✓ Корректно', 'ok');
    inputX.className='mono valid';
    return true;
}

function validateK() {
    if (!validateP()) {
        setHint(hintK,'');
        return false;
    }
    const p = getP();
    const v = inputK.value.trim();
    if (!v) {
        setHint(hintK,'');
        return false;
    }
    const k = BigInt(v);
    if (k <= 1n || k >= p - 1n) {
        setHint(hintK, `✗ Должно быть: 1 < k < ${p - 1n}`, 'err');
        inputK.className='mono invalid';
        return false;
    }
    if (gcd(k, p - 1n) !== 1n) {
        setHint(hintK, `✗ k должно быть взаимно простым с p−1 = ${p - 1n}`, 'err');
        inputK.className='mono invalid';
        return false;
    }
    setHint(hintK, '✓ Корректно', 'ok');
    inputK.className='mono valid'; return true;
}

function setHint(el, msg, cls='') {
    el.textContent = msg;
    el.className = 'field-hint' + (cls ? ' ' + cls : '');
}

inputP.addEventListener('input', () => {
    validateP();
    updatePubKey();
});

inputX.addEventListener('input', () => {
    validateX();
    updatePubKey();
});

inputK.addEventListener('input', () => validateK());

btnFindRoots.addEventListener('click', () => {
    if (!validateP()) {
        showToast('Введите корректное простое p > 256', 'error');
        return;
    }
    const p = getP();
    btnFindRoots.textContent = 'Поиск…';
    btnFindRoots.disabled = true;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const roots = findAllPrimitiveRoots(p);
            rootsPanel.classList.remove('hidden');
            rootsCount.textContent = roots.length + ' корней';
            rootsList.innerHTML = '';
            selectG.innerHTML = '<option value="">Выберите g </option>';
            roots.forEach(r => {
                const chip = document.createElement('span');
                chip.className = 'root-chip';
                chip.textContent = r.toString();
                chip.addEventListener('click', () => {
                    document.querySelectorAll('.root-chip').forEach(c => c.classList.remove('selected'));
                    chip.classList.add('selected');
                    selectG.value = r.toString();
                    selectG.dispatchEvent(new Event('change'));
                });
                rootsList.appendChild(chip);
                const opt = document.createElement('option');
                opt.value = r.toString();
                opt.textContent = r.toString();
                selectG.appendChild(opt);
            });
            btnFindRoots.textContent = 'Найти все первообразные корни по модулю p';
            btnFindRoots.disabled = false;
            showToast(`Найдено ${roots.length} первообразных корней`, 'success');
        });
    });
});

selectG.addEventListener('change', () => {
    const g = selectG.value;
    document.querySelectorAll('.root-chip').forEach(c => {
        c.classList.toggle('selected', c.textContent === g);
    });
    updatePubKey();
});

function updatePubKey() {
    const gVal = selectG.value;
    if (!gVal || !validateP() || !validateX()) {
        pubKeyPanel.classList.add('hidden');
        return;
    }
    const p = getP(), x = getX(), g = BigInt(gVal);
    const y = modPow(g, x, p);
    pubKeyPanel.classList.remove('hidden');
    pubKeyDisplay.textContent = `Ko = (p=${p}, g=${g}, y=${y}), Kc = x = ${x}`;
    setHint(hintG, `y = g^x mod p = ${g}^${x} mod ${p} = ${y}`, 'ok');
}

btnOpen.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    fileOrigName = file.name;
    fileName.textContent = file.name;
    fileName.classList.add('loaded');
    const reader = new FileReader();
    reader.onload = e => {
        fileBytes = new Uint8Array(e.target.result);
        showToast(`Загружен файл: ${file.name} (${fileBytes.length} байт)`, 'success');
    };
    reader.readAsArrayBuffer(file);
});

btnEncrypt.addEventListener('click', () => {
    if (!fileBytes) {
        showToast('Выберите файл', 'error');
        return;
    }
    if (!validateP()) {
        showToast('Введите корректное p', 'error');
        return;
    }
    if (!validateX()) {
        showToast('Введите корректное x', 'error');
        return;
    }
    if (!validateK()) {
        showToast('Введите корректное k', 'error');
        return;
    }
    if (!selectG.value) {
        showToast('Выберите g (первообразный корень)', 'error');
        return;
    }
    const p = getP();
    const x = getX();
    const k0= getK();
    const g = BigInt(selectG.value);
    const y = modPow(g, x, p);
    encryptedA = [];
    encryptedB = [];
    for (let i = 0; i < fileBytes.length; i++) {
        let k;
        if (i === 0) {
            k = k0;
        } else {
            k = randomCoPrime(p - 1n);
        }
        const m = BigInt(fileBytes[i]);
        const a = modPow(g, k, p);
        const b = (modPow(y, k, p) * m) % p;
        encryptedA.push(a);
        encryptedB.push(b);
    }
    outA.value = encryptedA.map(v => v.toString()).join(' ');
    outB.value = encryptedB.map(v => v.toString()).join(' ');
    outputSection.style.display = 'block';
    outputSection.scrollIntoView({ behavior: 'smooth' });
    showToast('Файл зашифрован', 'success');
});

function randomCoPrime(m) {
    let k;
    do {
        const range = m - 3n;
        const rand = BigInt(Math.floor(Math.random() * Number(range)));
        k = rand + 2n;
    } while (gcd(k, m) !== 1n);
    return k;
}

btnDecrypt.addEventListener('click', () => {
    if (encryptedA.length === 0) {
        if (!fileBytes) {
            showToast('Сначала зашифруйте файл или загрузите .elg файл', 'error');
            return;
        }
        loadEncryptedFile();
        return;
    }
    runDecrypt();
});

function runDecrypt() {
    if (!validateP()) {
        showToast('Введите корректное p', 'error');
        return;
    }
    if (!validateX()) {
        showToast('Введите корректное x', 'error');
        return;
    }
    const p = getP();
    const x = getX();
    decryptedBytes = new Uint8Array(encryptedA.length);
    for (let i = 0; i < encryptedA.length; i++) {
        const a = encryptedA[i];
        const b = encryptedB[i];
        const ax = modPow(a, x, p);
        const axInv = modInverse(ax, p);
        if (axInv === null) {
            showToast('Ошибка: нет обратного элемента', 'error');
            return;
        }
        const m = (b * axInv) % p;
        decryptedBytes[i] = Number(m);
    }
    outDecrypted.value = Array.from(decryptedBytes).join(' ');
    decryptSection.style.display = 'block';
    decryptSection.scrollIntoView({ behavior: 'smooth' });
    showToast('Файл расшифрован', 'success');
}

function loadEncryptedFile() {
    if (fileBytes.length % 4 !== 0) {
        showToast('Некорректный формат зашифрованного файла', 'error');
        return;
    }
    encryptedA = [];
    encryptedB = [];
    for (let i = 0; i < fileBytes.length; i += 4) {
        const a = BigInt((fileBytes[i] << 8) | fileBytes[i+1]);
        const b = BigInt((fileBytes[i+2] << 8) | fileBytes[i+3]);
        encryptedA.push(a);
        encryptedB.push(b);
    }
    outA.value = encryptedA.map(v => v.toString()).join(' ');
    outB.value = encryptedB.map(v => v.toString()).join(' ');
    outputSection.style.display = 'block';
    runDecrypt();
}

btnSaveEnc.addEventListener('click', () => {
    if (!encryptedA.length) {
        showToast('Нет данных для сохранения', 'error');
        return;
    }
    const buf = new Uint8Array(encryptedA.length * 4);
    encryptedA.forEach((a, i) => {
        const b = encryptedB[i];
        buf[i*4] = Number(a >> 8n) & 0xFF;
        buf[i*4 + 1] = Number(a) & 0xFF;
        buf[i*4 + 2] = Number(b >> 8n) & 0xFF;
        buf[i*4 + 3] = Number(b) & 0xFF;
    });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    saveBlob(blob, stripExt(fileOrigName) + '.elg');
    showToast('Зашифрованный файл сохранён', 'success');
});

btnSaveDec.addEventListener('click', () => {
    if (!decryptedBytes) {
        showToast('Нет данных для сохранения', 'error');return;
    }
    const blob = new Blob([decryptedBytes], { type: 'application/octet-stream' });
    saveBlob(blob, 'decrypted_' + fileOrigName);
    showToast('Расшифрованный файл сохранён', 'success');
});

function saveBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function stripExt(name) {
    const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(0, dot) : name;
}

function showToast(msg, type = '') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ''; }, 2800);
}
