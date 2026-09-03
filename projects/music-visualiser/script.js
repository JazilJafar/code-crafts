const fileInput = document.querySelector('#file');
const audio = document.querySelector('#audio');
const canvas = document.querySelector('#canvas');
const modeSelect = document.querySelector('#visualiserMode');
const ctx = canvas.getContext('2d');

const BAR_COUNT = 64;

let audioCtx, analyser, data;
let animationFrameId = null;
let visualiserMode = 'bars';

function setupAudio() {
    if (audioCtx) return;

    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    data = new Uint8Array(analyser.frequencyBinCount);
}

function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function getBarValues() {
    const values = [];
    const bins = data.length;

    for (let i = 0; i < BAR_COUNT; i++) {
        const start = Math.floor(Math.pow(bins, i / BAR_COUNT));
        const end = Math.floor(Math.pow(bins, (i + 1) / BAR_COUNT));

        let sum = 0;
        let count = 0;
        
        for (let j = start; j < Math.max(end, start + 1) && j < bins; j++) {
            sum += data[j];
            count++;
        }

        values.push(count ? sum / count: 0);
    }

    return values;
}

function getBarColour(index, value) {
    const hue = 185 + (index / BAR_COUNT) * 105;
    const brightness = 42 + (value / 255) * 28;

    return `hsl(${hue} 95% ${brightness}%)`;
}

function drawBars(values, w, h) {
    const barWidth = w / BAR_COUNT;

    values.forEach((value, i) => {
        const barHeight = (value / 255) * h;
        
        ctx.fillStyle = getBarColour(i, value);

        ctx.fillRect(
            i * barWidth,
            h - barHeight,
            barWidth - 2,
            barHeight
        );
    });
}

function drawCircle(values, w, h) {
    const centerX = w / 2;
    const centerY = h / 2;

    const baseRadius = Math.min(w, h) * 0.19;
    const maxBarLength = Math.min(w, h) * 0.23;

    const angleStep = (Math.PI * 2) / BAR_COUNT;
    const barThickness = Math.max(2, (Math.PI * 2 * baseRadius) / BAR_COUNT - 3);

    ctx.save();
    ctx.translate(centerX, centerY);

    values.forEach((value, i) => {
        const barLength = (value / 255) * maxBarLength;
        const angle = i * angleStep - Math.PI / 2;

        ctx.save();
        ctx.rotate(angle);

        ctx.fillStyle = getBarColour(i, value);

        ctx.fillRect(
            baseRadius,
            -barThickness / 2,
            barLength,
            barThickness
        );

        ctx.restore();
    });

    const averageValue = values.reduce((total, value) => total + value, 0) / values.length;

    const pulseSize = baseRadius * 0.72 + (averageValue / 255) * 16;

    const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);

    coreGradient.addColorStop(0, 'rgba(34, 211, 238, 0.45)');
    coreGradient.addColorStop(0.65, 'rgba(139, 92, 246, .18)');
    coreGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(216, 180, 254, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius - 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function draw() {
    animationFrameId = requestAnimationFrame(draw);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    if (!analyser || !data) return;

    analyser.getByteFrequencyData(data);

    const values = getBarValues();

    if (visualiserMode === 'circle') {
        drawCircle(values, w, h);
    } else {
        drawBars(values, w, h);
    }
}

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];

    if (!file) return;

    audio.src = URL.createObjectURL(file);
    audio.play();
});

modeSelect.addEventListener('change', () => {
    visualiserMode = modeSelect.value;
});

audio.addEventListener('play', () => {
    setupAudio();
    audioCtx.resume();

    if (!animationFrameId) {
        draw();
    }
});

audio.addEventListener('pause', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
});

audio.addEventListener('ended', () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
});

window.addEventListener('resize', resize);

resize();