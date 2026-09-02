const fileInput = document.querySelector('#file');
const audio = document.querySelector('#audio');
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

const BAR_COUNT = 64;

let audioCtx, analyser, data;

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
    const dpr = window.dividePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(data);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const barWidth = w / BAR_COUNT;
    const bins = data.length;

    for(let i = 0; i < BAR_COUNT; i++) {
        const start = Math.floor(Math.pow(bins, i / BAR_COUNT));
        const end = Math.floor(Math.pow(bins, (i + 1) / BAR_COUNT));

        let sum = 0;
        let count = 0;
        for (let j = start; j < Math.max(end, start + 1) && j < bins; j++) {
            sum += data[j];
            count++;
        }

        const value = count ? sum / count : 0;
        const barHeight = (value / 255) * h;

        ctx.fillStyle = `hsl(${200 + (i / BAR_COUNT) * 120} 90% 60%)`;
        ctx.fillRect(i* barWidth, h - barHeight, barWidth - 2, barHeight);
    }
}

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    audio.src = URL.createObjectURL(file);
    audio.play();
});

audio.addEventListener('play', () => {
    setupAudio();
    audioCtx.resume();
    draw();
});

window.addEventListener('resize', resize);
resize();