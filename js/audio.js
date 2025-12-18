/**
 * Módulo de Audio - Text-to-Speech
 * Narración de capítulos usando Web Speech API
 */

let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let isPaused = false;
let isReading = false;
let currentTextIndex = 0;
let textChunks = [];
let speechRate = 1.0;

function toggleAudioPlayer() {
    const player = document.getElementById('audioPlayer');
    const isVisible = player.classList.contains('show');

    if (isVisible) {
        closeAudioPlayer();
    } else {
        openAudioPlayer();
    }
}

function openAudioPlayer() {
    const player = document.getElementById('audioPlayer');
    prepareTextForReading();
    player.classList.add('show');
    updateAudioInfo();
}

function closeAudioPlayer() {
    const player = document.getElementById('audioPlayer');
    stopReading();
    player.classList.remove('show');
}

function prepareTextForReading() {
    const content = document.getElementById('content');
    if (!content) return;

    const paragraphs = content.querySelectorAll('p, h1, h2, h3');
    textChunks = [];

    paragraphs.forEach(p => {
        const text = p.textContent.trim();
        if (text && !text.startsWith('NOTAS DE AUTOR')) {
            if (text.length > 500) {
                const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
                textChunks.push(...sentences);
            } else {
                textChunks.push(text);
            }
        }
    });

    currentTextIndex = 0;
}

function updateAudioInfo() {
    const num = (typeof currentChapter !== 'undefined' ? currentChapter : 1).toString().padStart(2, '0');
    const titleEl = document.getElementById('audioChapterTitle');
    if (titleEl) titleEl.textContent = `Capítulo ${num}`;

    const coverImg = document.getElementById('audioCover');
    if (coverImg) {
        const newSrc = num <= 30 ? `imagenes/cap_${num}.jpg` : `imagenes/cover_opt.jpg`;
        if (!coverImg.src.endsWith(newSrc)) {
            coverImg.src = newSrc;
        }
    }
}

function togglePlayPause() {
    if (isReading && !isPaused) {
        pauseAudio();
    } else {
        playAudio();
    }
}

function playAudio() {
    if (textChunks.length === 0) {
        prepareTextForReading();
    }

    if (isPaused) {
        speechSynthesis.resume();
        isPaused = false;
    } else {
        isReading = true;
        readNextChunk();
    }

    updatePlayButton(true);
}

function pauseAudio() {
    if (speechSynthesis.speaking) {
        speechSynthesis.pause();
        isPaused = true;
        updatePlayButton(false);
    }
}

function stopReading() {
    speechSynthesis.cancel();
    currentUtterance = null;
    isReading = false;
    isPaused = false;
    currentTextIndex = 0;
    updatePlayButton(false);
    updateProgress(0);
}

function readNextChunk() {
    if (currentTextIndex >= textChunks.length) {
        const TOTAL_CHAPTERS = 30;
        if (typeof currentChapter !== 'undefined' && currentChapter < TOTAL_CHAPTERS) {
            if (typeof loadChapter === 'function') {
                loadChapter(currentChapter + 1);
            }
            setTimeout(() => {
                prepareTextForReading();
                currentTextIndex = 0;
                readNextChunk();
            }, 500);
        } else {
            stopReading();
        }
        return;
    }

    const text = textChunks[currentTextIndex];
    currentUtterance = new SpeechSynthesisUtterance(text);

    const voices = speechSynthesis.getVoices();
    const spanishVoice = voices.find(voice =>
        voice.lang.startsWith('es') || voice.lang.startsWith('spa')
    );
    if (spanishVoice) {
        currentUtterance.voice = spanishVoice;
    }

    currentUtterance.lang = 'es-ES';
    currentUtterance.rate = speechRate;
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;

    currentUtterance.onend = () => {
        currentTextIndex++;
        updateProgress((currentTextIndex / textChunks.length) * 100);

        if (isReading && !isPaused) {
            readNextChunk();
        }
    };

    currentUtterance.onerror = (e) => {
        console.error('Error en síntesis de voz:', e);
        stopReading();
    };

    speechSynthesis.speak(currentUtterance);
    updateProgress((currentTextIndex / textChunks.length) * 100);
}

function skipBackward() {
    if (currentTextIndex > 0) {
        currentTextIndex = Math.max(0, currentTextIndex - 3);
        speechSynthesis.cancel();
        if (isReading) {
            readNextChunk();
        }
    }
}

function skipForward() {
    if (currentTextIndex < textChunks.length - 1) {
        currentTextIndex = Math.min(textChunks.length - 1, currentTextIndex + 3);
        speechSynthesis.cancel();
        if (isReading) {
            readNextChunk();
        }
    }
}

function setAudioProgress(e) {
    const progressBar = document.getElementById('audioProgress');
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    currentTextIndex = Math.floor(percent * textChunks.length);
    speechSynthesis.cancel();

    if (isReading) {
        readNextChunk();
    }

    updateProgress(percent * 100);
}

function updateProgress(percent) {
    const progressBar = document.getElementById('audioProgressBar');
    if (progressBar) progressBar.style.width = percent + '%';

    const totalChunks = textChunks.length;
    const avgTimePerChunk = 5;
    const totalSeconds = totalChunks * avgTimePerChunk;
    const currentSeconds = currentTextIndex * avgTimePerChunk;

    const currentTimeEl = document.getElementById('audioCurrentTime');
    const durationEl = document.getElementById('audioDuration');
    if (currentTimeEl) currentTimeEl.textContent = formatTime(currentSeconds);
    if (durationEl) durationEl.textContent = formatTime(totalSeconds);
}

function setVolume(e) {
    const volume = e.target.value / 100;
    if (currentUtterance) {
        currentUtterance.volume = volume;
    }
}

function setSpeechRate(e) {
    speechRate = parseFloat(e.target.value);
    const speedValue = document.getElementById('speedValue');
    if (speedValue) speedValue.textContent = speechRate.toFixed(1) + 'x';

    if (isReading && !isPaused) {
        speechSynthesis.cancel();
        readNextChunk();
    }
}

function updatePlayButton(playing) {
    const icon = playing ? `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
    ` : `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    `;
    const playIcon = document.getElementById('playIcon');
    if (playIcon) playIcon.innerHTML = icon;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Cargar voces cuando estén disponibles
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
        // Voces cargadas
    };
}

// Exportar funciones globales
window.toggleAudioPlayer = toggleAudioPlayer;
window.openAudioPlayer = openAudioPlayer;
window.closeAudioPlayer = closeAudioPlayer;
window.togglePlayPause = togglePlayPause;
window.skipBackward = skipBackward;
window.skipForward = skipForward;
window.setAudioProgress = setAudioProgress;
window.setVolume = setVolume;
window.setSpeechRate = setSpeechRate;
window.prepareTextForReading = prepareTextForReading;
window.updateAudioInfo = updateAudioInfo;
