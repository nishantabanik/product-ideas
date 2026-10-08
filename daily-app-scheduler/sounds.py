"""Background sounds for focus, study and meditation.

The built-in sounds are generated here (no downloads, no licences). Your own
files live in data/sounds/: add them from the app's ⋮ menu or copy them into
that folder in Finder.
"""

import io
import wave
from pathlib import Path

import numpy as np

from config import DATA_DIR

RATE = 22050
SECONDS = 40  # loop length; the ends are cross-faded so the loop is seamless
USER_DIR = DATA_DIR / "sounds"
USER_EXTENSIONS = {".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".aac": "audio/aac", ".ogg": "audio/ogg"}
VOLUMES = {"Low": 0.35, "Medium": 0.65, "High": 1.0}


def _rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def _lowpass(x: np.ndarray, cutoff: float) -> np.ndarray:
    """Simple one-pole low-pass filter (vectorised through an FFT)."""
    spectrum = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1 / RATE)
    spectrum /= np.sqrt(1 + (freqs / cutoff) ** 2)
    return np.fft.irfft(spectrum, len(x))


def _bandpass(x: np.ndarray, low: float, high: float) -> np.ndarray:
    spectrum = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1 / RATE)
    spectrum[(freqs < low) | (freqs > high)] = 0
    return np.fft.irfft(spectrum, len(x))


def _brown(n: int, seed: int) -> np.ndarray:
    x = np.cumsum(_rng(seed).standard_normal(n))
    x -= _lowpass(x, 15)  # remove the slow drift so it stays centred
    return x


def _normalise(x: np.ndarray, peak: float = 0.8) -> np.ndarray:
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def _t(n: int) -> np.ndarray:
    return np.arange(n) / RATE


# ---------- built-in sounds ----------

def rain(n: int) -> np.ndarray:
    hiss = _lowpass(_rng(1).standard_normal(n), 4000) * 0.5 + _brown(n, 2) * 0.004
    drops = np.zeros(n)
    for pos in _rng(3).integers(0, n - 400, size=SECONDS * 40):
        decay = np.exp(-np.arange(400) / 40)
        drops[pos:pos + 400] += decay * _rng(int(pos)).uniform(0.2, 1.0) * np.sin(np.arange(400) * _rng(int(pos) + 1).uniform(0.3, 0.9))
    return _normalise(hiss + drops * 0.6)


def ocean(n: int) -> np.ndarray:
    t = _t(n)
    surf = _lowpass(_rng(4).standard_normal(n), 1200)
    # waves: a slow swell every ~8 seconds, each with its own height
    swell = 0.15 + 0.85 * np.clip(np.sin(2 * np.pi * t / 8.0) * 0.5 + 0.5, 0, 1) ** 3
    return _normalise(surf * swell + _brown(n, 5) * 0.003)


def forest(n: int) -> np.ndarray:
    t = _t(n)
    wind = _lowpass(_rng(6).standard_normal(n), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * t / 11.0))
    birds = np.zeros(n)
    rng = _rng(7)
    for start in rng.integers(0, n - RATE, size=SECONDS // 2):
        for k in range(rng.integers(2, 6)):
            length = int(RATE * rng.uniform(0.05, 0.12))
            s = start + k * int(RATE * 0.11)
            if s + length >= n:
                break
            tt = np.arange(length) / length
            f0, f1 = rng.uniform(2500, 3500), rng.uniform(3500, 5000)
            phase = 2 * np.pi * np.cumsum(f0 + (f1 - f0) * tt) / RATE
            birds[s:s + length] += np.sin(np.pi * tt) ** 2 * np.sin(phase) * rng.uniform(0.2, 0.5)
    return _normalise(_normalise(wind, 0.5) + birds * 0.5)


def brown_noise(n: int) -> np.ndarray:
    return _normalise(_brown(n, 8))


def white_noise(n: int) -> np.ndarray:
    return _normalise(_lowpass(_rng(9).standard_normal(n), 6000), 0.5)


def calm_music(n: int) -> np.ndarray:
    """Slow ambient pads moving through Cmaj7, Am7, Fmaj7, G6."""
    t = _t(n)
    chords = [[261.6, 329.6, 392.0, 493.9], [220.0, 261.6, 329.6, 392.0], [174.6, 220.0, 261.6, 329.6], [196.0, 246.9, 293.7, 329.6]]
    out = np.zeros(n)
    seg = n // len(chords)
    for i, chord in enumerate(chords):
        s, e = i * seg, n if i == len(chords) - 1 else (i + 1) * seg
        tt = t[s:e] - t[s]
        env = np.minimum(1, tt / 2.5) * np.minimum(1, (tt[-1] - tt) / 2.5 + 0.0001)
        for f in chord:
            out[s:e] += env * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt + 1)) * (1 + 0.02 * np.sin(2 * np.pi * 0.3 * tt))
    return _normalise(out, 0.6)


def meditation(n: int) -> np.ndarray:
    """A low drone with a singing-bowl strike every 10 seconds."""
    t = _t(n)
    drone = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((136.1, 1), (136.6, 0.8), (272.2, 0.3), (408.3, 0.15)))
    bowl = np.zeros(n)
    for start in range(0, n, RATE * 10):
        tt = t[: n - start]
        bowl[start:] += np.exp(-tt / 3.5) * (np.sin(2 * np.pi * 528 * tt) + 0.5 * np.sin(2 * np.pi * 1405 * tt))
    return _normalise(_normalise(drone, 0.35) + bowl * 0.35)


def _pulse(x: np.ndarray, rate_hz: float = 16.0, depth: float = 0.3) -> np.ndarray:
    """Fast amplitude modulation (beta range), the technique behind 'functional' focus music."""
    t = _t(len(x))
    return x * (1 - depth * (0.5 + 0.5 * np.sin(2 * np.pi * rate_hz * t)))


def focus_pads(n: int) -> np.ndarray:
    return _normalise(_pulse(calm_music(n), 16.0, 0.35), 0.6)


def focus_beat(n: int) -> np.ndarray:
    """Calm lo-fi groove at 72 BPM (48 beats fit the loop exactly) with a 16 Hz pulse."""
    t = _t(n)
    beat = RATE * 60 // 72
    out = calm_music(n) * 0.6
    bass_notes = [65.4, 55.0, 43.7, 49.0]  # C, A, F, G
    for b, start in enumerate(range(0, n, beat)):
        length = min(beat, n - start)
        tt = t[:length]
        if b % 2 == 0:  # soft kick
            out[start:start + length] += 0.5 * np.exp(-tt * 18) * np.sin(2 * np.pi * (50 + 60 * np.exp(-tt * 30)) * tt)
        else:  # brushed hat
            out[start:start + length] += 0.05 * np.exp(-tt * 40) * _rng(b).standard_normal(length)
        note = bass_notes[(b // 12) % 4]
        out[start:start + length] += 0.18 * np.exp(-tt * 2.5) * np.sin(2 * np.pi * note * tt)
    return _normalise(_pulse(out, 16.0, 0.25), 0.7)


BUILT_IN = {
    "Focus music: pulsed pads": focus_pads,
    "Focus music: calm beat": focus_beat,
    "Rain": rain,
    "Ocean waves": ocean,
    "Forest birds": forest,
    "Brown noise (focus)": brown_noise,
    "White noise (focus)": white_noise,
    "Calm music (study)": calm_music,
    "Meditation drone & bowl": meditation,
}


def _seamless(make) -> np.ndarray:
    fade = RATE * 2
    n = RATE * SECONDS
    x = make(n + fade)
    ramp = np.linspace(0, 1, fade)
    x[:fade] = x[:fade] * ramp + x[n:n + fade] * (1 - ramp)
    return x[:n]


def built_in_wav(name: str, volume: str = "Medium") -> bytes:
    samples = _seamless(BUILT_IN[name])
    samples = samples / (np.sqrt(np.mean(samples ** 2)) + 1e-9) * 0.14 * VOLUMES[volume]  # same loudness for every sound
    pcm = (np.clip(samples, -1, 1) * 32000).astype("<i2").tobytes()
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(pcm)
    return buf.getvalue()


# ---------- your own sounds ----------

def user_sounds() -> dict[str, Path]:
    USER_DIR.mkdir(parents=True, exist_ok=True)
    return {p.stem: p for p in sorted(USER_DIR.iterdir()) if p.suffix.lower() in USER_EXTENSIONS}


def save_user_sound(filename: str, data: bytes) -> str:
    USER_DIR.mkdir(parents=True, exist_ok=True)
    path = USER_DIR / Path(filename).name
    path.write_bytes(data)
    return path.stem


def mime(path: Path) -> str:
    return USER_EXTENSIONS[path.suffix.lower()]
