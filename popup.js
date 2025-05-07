/* Shamir over GF(256) — minimal implementation */

/* ---------- GF(256) arithmetic ---------- */
const GF256 = {
    add: (a, b) => a ^ b,
    /* Russian‑peasant multiplication mod 0x11B (AES poly 0x1B) */
    multiply(a, b) {
        let p = 0;
        for (let i = 0; i < 8; i++) {
            if (b & 1) p ^= a;
            const hi = a & 0x80;
            a = ((a << 1) & 0xFF);
            if (hi) a ^= 0x1B;
            b >>= 1;
        }
        return p;
    },
    pow(base, exp) {
        let result = 1;
        while (exp) {
            if (exp & 1) result = GF256.multiply(result, base);
            base = GF256.multiply(base, base);
            exp >>= 1;
        }
        return result;
    },
    inv(a) {
        if (a === 0) throw new Error("Zero has no inverse");
        /* a^254 ≡ a⁻¹ in GF(256) */
        return GF256.pow(a, 254);
    }
};

/* ---------- Shamir split & combine ---------- */
function split(secretBytes, n, k) {
    if (secretBytes.length === 0) {
        throw new Error("The secret field must not be empty");
    }
    if (k < 2 || k > n) {
        throw new Error("The number of shares must be greater than or equal to the threshold for recovery");
    }
    if (n > 255) {
        throw new Error("The number of shares cannot exceed 255");
    }
    const shares = Array.from({ length: n }, () => new Uint8Array(secretBytes.length + 1));
    shares.forEach((s, i) => { s[0] = i + 1; }); // x = 1..n

    const rnd = crypto.getRandomValues.bind(crypto);
    for (let byteIdx = 0; byteIdx < secretBytes.length; byteIdx++) {
        const sByte = secretBytes[byteIdx];
        const coeffs = new Uint8Array(k - 1);
        rnd(coeffs);
        for (let shareIdx = 0; shareIdx < n; shareIdx++) {
            const x = shareIdx + 1;
            let y = sByte;
            let xPow = 1;
            for (const a of coeffs) {
                xPow = GF256.multiply(xPow, x);
                y ^= GF256.multiply(a, xPow);
            }
            shares[shareIdx][byteIdx + 1] = y;
        }
    }
    return shares.map(arr => btoa(String.fromCharCode(...arr)));
}

function combine(shareStrings) {
    try {
        const shares = shareStrings.map(s => Uint8Array.from(atob(s), c => c.charCodeAt(0)));
        const len = shares[0].length;
        if (!shares.every(s => s.length === len)) throw new Error("Shares of different lengths");
        const secretBytes = new Uint8Array(len - 1);
        const xs = shares.map(s => s[0]);
        /* check uniqueness */
        if (new Set(xs).size !== xs.length) throw new Error("Duplicate shares");
        for (let byteIdx = 1; byteIdx < len; byteIdx++) {
            const ys = shares.map(s => s[byteIdx]);
            let sByte = 0;
            for (let j = 0; j < xs.length; j++) {
                let num = 1, den = 1;
                for (let m = 0; m < xs.length; m++) {
                    if (m === j) continue;
                    num = GF256.multiply(num, xs[m]);             // Π x_m
                    den = GF256.multiply(den, xs[j] ^ xs[m]);     // Π (x_j ⊕ x_m)
                }
                const term = GF256.multiply(ys[j], GF256.multiply(num, GF256.inv(den)));
                sByte ^= term; // add in GF(256)
            }
            secretBytes[byteIdx - 1] = sByte;
        }
        return secretBytes;
    } catch (e) {
        if (e instanceof DOMException && e.name === "InvalidCharacterError") {
            throw new Error("Invalid share format");
        }
        throw e;
    }
}

/* ---------- UI bindings ---------- */
const $ = id => document.getElementById(id);

function show(el, txt) {
    el.textContent = txt;
}

$("splitBtn").onclick = () => {
    try {
        $("splitErr").textContent = "";
        const phrase = $("phrase").value.trim();
        const n = Number($("total").value);
        const k = Number($("threshold").value);
        const secret = new TextEncoder().encode(phrase);
        const shares = split(secret, n, k);
        show($("shares"), shares.join("\n\n"));
        show($("copySharesBtn"), "Copy All");
        $("copySharesBtn").style.display = "inline-block";
        $("copySharesBtn").style.visibility = "visible";
    } catch (e) {
        show($("splitErr"), e.message);
    }
};

$("combineBtn").onclick = () => {
    try {
        $("combineErr").textContent = "";
        const sharesInput = $("sharesInput").value.trim().split(/\s+/);
        if (sharesInput.length === 1 && sharesInput[0] === "") {
            throw new Error("Recovery field is empty");
        }
        const secretBytes = combine(sharesInput);
        const phrase = new TextDecoder().decode(secretBytes);
        show($("recovered"), phrase);
    } catch (e) {
        if (e.message.includes("Invalid typed array length: -1")) {
            show($("combineErr"), "Recovery field is empty");
        } else {
            show($("combineErr"), e.message);
        }
    }
};

$("copySharesBtn").onclick = () => {
    const sharesText = $("shares").textContent;
    navigator.clipboard.writeText(sharesText).catch(err => {
        alert("Error while copying shares: " + err);
    });
};

document.getElementById('supportLink').onclick = function(event) {
    event.preventDefault();
    document.getElementById('supportModal').style.display = 'block';
};

document.querySelector('#supportModal button[onclick="closeModal()"]')
    .addEventListener('click', closeModal);

document.querySelectorAll('#supportModal button[onclick^="copyToClipboard("]')
    .forEach(button => {
        button.addEventListener('click', function() {
            const elementId = this.previousElementSibling.id;
            copyToClipboard(elementId);
        });
    });

function closeModal() {
    document.getElementById('supportModal').style.display = 'none';
}

function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert('Address copied to clipboard');
    }).catch(err => {
        alert('Error copying address: ' + err);
    });
}