#!/usr/bin/env python3
"""伤寒钤法预告片 · 配乐生成器（纯音乐，无歌词无旁白）

用法：
    /mnt/linux-data/shushu-venv/bin/python tools/make_cue.py out/cue.wav

设计：18.0 秒预告片 cue，D 小调。**每个音符都钉在画面的落点上**（见 EVENTS），
时间点取自 `src/interlude/cine/trailer.tsx` 的 v5 分镜（节奏 ×2 之后）：

    镜一 0.00–3.23  医学 / & / 数术 三下砸入
    镜二 3.27–8.73  花甲成墙 → 罗盘现身 → 内圈 12 声 → 外圈 12 声
    镜三 8.77–13.23 17 枚术语砸满 → 先裂 → 全屏碎裂
    镜四 13.27–18.0 题名 + 小标题 + 长尾

声音素材全部**本地合成**（numpy 写波形，不下载任何素材），可复现、无版权问题。
混音：soft-clip 总线 + 卷积混响（合成 IR）+ loudnorm 到 -15 LUFS / -1.5 dBTP。
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 18.05


# ---------------------------------------------------------------- 基础工具
def t_axis(dur: float) -> np.ndarray:
    return np.arange(int(dur * SR)) / SR


def place(bus: np.ndarray, sig: np.ndarray, at: float, gain: float = 1.0) -> None:
    """把 sig 叠加到 bus 的 at 秒处（越界自动裁）。"""
    i = int(at * SR)
    if i >= len(bus):
        return
    n = min(len(sig), len(bus) - i)
    if n <= 0:
        return
    bus[i:i + n] += sig[:n] * gain


def env_ad(n: int, attack: float, decay: float, curve: float = 2.0) -> np.ndarray:
    """attack-decay 包络（秒）。"""
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.exp(-np.maximum(t - attack, 0) / max(decay, 1e-4))
    return (a ** 0.6) * (d ** curve)


def soft_clip(x: np.ndarray, drive: float = 1.0) -> np.ndarray:
    return np.tanh(x * drive) / np.tanh(drive) if drive != 0 else x


def bandpass(x: np.ndarray, f0: float, f1: float) -> np.ndarray:
    """极简 FFT 带通（离线合成够用）。"""
    spec = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1 / SR)
    mask = np.ones_like(freqs)
    lo = freqs < f0
    hi = freqs > f1
    mask[lo] = np.clip(freqs[lo] / max(f0, 1.0), 0, 1) ** 2
    mask[hi] = np.clip(f1 / np.maximum(freqs[hi], 1.0), 0, 1) ** 2
    return np.fft.irfft(spec * mask, n=len(x))


# ---------------------------------------------------------------- 音色
def sub_hit(dur: float, f_start: float = 92.0, f_end: float = 36.7, decay: float = 0.75,
            drive: float = 1.6) -> np.ndarray:
    """下潜的低频撞击：音高快速下落 + 软削波，预告片里"砸"的那一下。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f_end + (f_start - f_end) * np.exp(-t / 0.055)
    phase = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(phase) * env_ad(n, 0.004, decay, 1.5)
    return soft_clip(body * drive, 1.4)


def transient(dur: float = 0.09, lo: float = 1800.0, hi: float = 9000.0) -> np.ndarray:
    """撞击的"咔"：一小段高频噪声，给落点以清晰度。"""
    n = int(dur * SR)
    rng = np.random.default_rng(7)
    x = rng.standard_normal(n)
    return bandpass(x, lo, hi) * env_ad(n, 0.0008, 0.022, 2.0)


def click_tick(dur: float = 0.16, freq: float = 2400.0, decay: float = 0.045) -> np.ndarray:
    """罗盘锁定的"嗒"：短促共振噪声 + 一点音高。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(11)
    noise = bandpass(rng.standard_normal(n), freq * 0.7, freq * 1.8) * env_ad(n, 0.0006, decay, 2.2)
    ping = np.sin(2 * np.pi * freq * t) * env_ad(n, 0.0006, decay * 0.7, 2.4) * 0.35
    return noise * 0.8 + ping


def ring_bell(dur: float = 2.2, base: float = 220.0) -> np.ndarray:
    """罗盘现身时的金属泛音（非谐分音，像钟而不是正弦）。"""
    n = int(dur * SR)
    out = np.zeros(n)
    for k, (mul, g, dec) in enumerate([(1.0, 1.0, 1.1), (2.76, 0.5, 0.8), (5.4, 0.28, 0.55), (8.9, 0.15, 0.35)]):
        out += np.sin(2 * np.pi * base * mul * np.arange(n) / SR) * env_ad(n, 0.002, dec, 1.6) * g
    return out


def riser(dur: float, lo: float = 220.0, hi: float = 5200.0, seed: int = 3) -> np.ndarray:
    """上扫：噪声的频带随时间上移 + 音量渐强（预告片的"吸气"）。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal(n)
    seg = 24
    out = np.zeros(n)
    for s in range(seg):
        a, b = int(n * s / seg), int(n * (s + 1) / seg)
        k = s / (seg - 1)
        f = lo * (hi / lo) ** k
        out[a:b] = bandpass(noise[a:b], f * 0.6, f * 2.2)
        out[a:b] *= (k ** 1.6)
    # 交叉淡化，避免分段接缝
    win = int(0.02 * SR)
    for s in range(1, seg):
        i = int(n * s / seg)
        out[i - win:i + win] *= np.hanning(2 * win)
    return out * env_ad(n, 0.02, dur * 0.5, 0.8) * 1.4


def braaam(dur: float = 3.6, root: float = 36.7) -> np.ndarray:
    """BRAAAM：低音铜管式的巨响（锯齿堆叠 + 软削波 + 缓慢上滑）。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    bend = 1 + 0.05 * (1 - np.exp(-t / 0.5))
    out = np.zeros(n)
    for mul, g in [(1.0, 1.0), (1.5, 0.55), (2.0, 0.42), (3.0, 0.26), (4.0, 0.16)]:
        f = root * mul * bend
        saw = 2 * ((f * t) % 1.0) - 1.0                      # 锯齿波
        out += saw * g
    out = soft_clip(out * 0.9, 3.0)
    return out * env_ad(n, 0.012, dur * 0.42, 1.2)


def glass_shatter(dur: float = 1.5, seed: int = 5) -> np.ndarray:
    """玻璃碎裂：高频噪声爆 + 一把随机小碎片声 + 几枚亮铃。"""
    n = int(dur * SR)
    out = bandpass(np.random.default_rng(seed).standard_normal(n), 2600, 11000) * env_ad(n, 0.001, 0.16, 2.2)
    rng = np.random.default_rng(seed + 1)
    for _ in range(46):
        at = abs(rng.standard_normal()) * 0.34
        i = int(at * SR)
        if i >= n - 10:
            continue
        ln = int(0.012 * SR)
        frag = bandpass(rng.standard_normal(ln), 3200, 12000) * env_ad(ln, 0.0004, 0.01, 2.6)
        out[i:i + ln] += frag * 0.7
    for base in (1980.0, 2760.0, 3520.0):
        ln = min(n, int(0.9 * SR))                      # ⚠ 短片段时别越界（ln > n 会让包络长度对不上）
        out[:ln] += np.sin(2 * np.pi * base * np.arange(ln) / SR) * env_ad(ln, 0.001, 0.22, 2.0) * 0.16
    return out


def drone(dur: float, root: float = 73.4, level: float = 0.16, trem: float = 0.6) -> np.ndarray:
    """持续低音：根音 + 五度 + 八度，带缓慢颤音（铺垫张力）。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for mul, g, det in [(0.5, 0.9, 0.0), (1.0, 1.0, 0.06), (1.5, 0.45, -0.05), (2.0, 0.30, 0.03)]:
        out += np.sin(2 * np.pi * root * mul * (1 + det / 100) * t) * g
    lfo = 1 - 0.28 * (0.5 + 0.5 * np.sin(2 * np.pi * trem * t))
    fade = np.clip(t / 0.6, 0, 1) * np.clip((dur - t) / 0.8, 0, 1)
    return out * lfo * fade * level


def pad(dur: float, root: float = 146.8, level: float = 0.14) -> np.ndarray:
    """尾段的柔和和声垫（D 小调：D F A + 高八度 D），慢起慢落。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for mul, g in [(1.0, 1.0), (1.2, 0.7), (1.5, 0.8), (2.0, 0.5), (2.4, 0.28)]:
        vib = 1 + 0.0016 * np.sin(2 * np.pi * 4.6 * t + mul)
        out += np.sin(2 * np.pi * root * mul * vib * t) * g
    return out * env_ad(n, 1.1, dur * 0.9, 0.7) * level


def swarm(dur: float, level: float = 0.10, seed: int = 9) -> np.ndarray:
    """乱飞的花甲子：中高频噪声床，缓慢起伏（像风穿过纸）。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bandpass(np.random.default_rng(seed).standard_normal(n), 900, 5200)
    mod = 0.6 + 0.4 * np.sin(2 * np.pi * 2.3 * t) * np.sin(2 * np.pi * 0.31 * t + 1.2)
    return x * mod * env_ad(n, 0.25, dur * 0.6, 0.9) * level


# ---------------------------------------------------------------- 混响（合成 IR 卷积）
def reverb(x: np.ndarray, tail: float = 2.4, damp: float = 6500.0, seed: int = 21) -> np.ndarray:
    n_ir = int(tail * SR)
    t = np.arange(n_ir) / SR
    rng = np.random.default_rng(seed)
    ir = rng.standard_normal(n_ir) * np.exp(-t / (tail * 0.34))
    ir = bandpass(ir, 120, damp)
    ir[: int(0.008 * SR)] *= np.linspace(0, 1, int(0.008 * SR))
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    spec = np.fft.rfft(x, n=len(x) + n_ir)
    irs = np.fft.rfft(ir, n=len(x) + n_ir)
    y = np.fft.irfft(spec * irs, n=len(x) + n_ir)[: len(x)]
    return y / (np.max(np.abs(y)) + 1e-9)


# ---------------------------------------------------------------- 事件表（钉在画面落点上）
# (秒, 类型, 参数)  —— 时间点来自 v5 分镜换算
EVENTS = [
    # 镜一：三下砸入（0.20 / 1.33 / 1.93），音高逐级下沉
    (0.20, 'HIT', dict(f_end=41.2, decay=0.85, gain=0.95)),
    (1.33, 'HIT', dict(f_end=36.7, decay=0.75, gain=0.85)),
    (1.93, 'HIT', dict(f_end=32.7, decay=0.70, gain=0.90)),
    (2.35, 'RISER', dict(dur=0.92, gain=0.55)),
    # 镜二：花甲成墙 → 罗盘 → 内圈 12 声 → 外圈 12 声
    (3.30, 'DRONE', dict(dur=5.5, gain=1.0)),
    (3.55, 'SWARM', dict(dur=1.30, gain=1.0)),
    (4.77, 'HIT', dict(f_end=36.7, decay=1.15, gain=0.88)),
    (4.77, 'BELL', dict(base=220.0, gain=0.5)),
    (4.77, 'SHATTER_LITE', dict(gain=0.22)),
    # 内圈锁定：12 声，音高上行（0.125s 一枚）
    *[(4.87 + i * 0.125, 'TICK', dict(freq=1750.0 * (1 + 0.018 * i), gain=0.34)) for i in range(12)],
    # 外圈飞入锁定：12 声，更快、音高下行（0.083s 一枚）
    *[(6.43 + i * 0.083, 'TICK', dict(freq=3100.0 * (1 - 0.022 * i), gain=0.30)) for i in range(12)],
    (7.90, 'RISER', dict(dur=0.80, gain=0.45, lo=300.0, hi=3200.0)),
    # 镜三：17 枚术语砸入（0.1s 一枚）→ 先裂 → 全屏碎裂
    *[(8.80 + i * 0.10, 'HIT', dict(f_end=58.0 - 1.4 * i, decay=0.30, gain=0.30 + 0.012 * i)) for i in range(17)],
    (10.70, 'RISER', dict(dur=0.92, gain=0.85, lo=260.0, hi=6800.0, seed=6)),
    (11.23, 'CRACK', dict(gain=0.55)),
    (11.60, 'BRAAAM', dict(gain=1.35)),
    (11.60, 'SHATTER', dict(gain=1.0)),
    (12.60, 'HIT', dict(f_end=32.7, decay=1.2, gain=0.45)),
    # 镜四：题名 → 小标题 → 长尾
    (13.47, 'HIT', dict(f_end=36.7, decay=1.3, gain=0.85)),
    (13.47, 'BELL', dict(base=146.8, gain=0.35)),
    (13.60, 'PAD', dict(dur=4.4, gain=1.0)),
    (15.40, 'HIT', dict(f_end=29.4, decay=1.1, gain=0.55)),
]


def build() -> np.ndarray:
    n = int(DUR * SR)
    dry = np.zeros(n)
    wet_send = np.zeros(n)
    cache: dict = {}

    def get(kind: str, **kw):
        key = (kind, tuple(sorted(kw.items())))
        if key not in cache:
            if kind == 'HIT':
                cache[key] = sub_hit(2.4, f_start=110.0, f_end=kw.get('f_end', 36.7), decay=kw.get('decay', 0.8))
            elif kind == 'TICK':
                cache[key] = click_tick(freq=kw.get('freq', 2400.0))
            elif kind == 'BELL':
                cache[key] = ring_bell(base=kw.get('base', 220.0))
            elif kind == 'RISER':
                cache[key] = riser(kw.get('dur', 0.9), kw.get('lo', 220.0), kw.get('hi', 5200.0), kw.get('seed', 3))
            elif kind == 'BRAAAM':
                cache[key] = braaam()
            elif kind == 'SHATTER':
                cache[key] = glass_shatter()
            elif kind == 'SHATTER_LITE':
                cache[key] = glass_shatter(0.9, seed=13) * 0.5
            elif kind == 'DRONE':
                cache[key] = drone(kw.get('dur', 5.0))
            elif kind == 'PAD':
                cache[key] = pad(kw.get('dur', 4.0))
            elif kind == 'SWARM':
                cache[key] = swarm(kw.get('dur', 1.2))
            elif kind == 'CRACK':
                a = glass_shatter(0.5, seed=17) * 0.7
                b = transient(0.12, 2400, 12000)
                ln = max(len(a), len(b))
                mix = np.zeros(ln)
                mix[:len(a)] += a
                mix[:len(b)] += b
                cache[key] = mix
        return cache[key]

    sends = {'HIT': 0.30, 'TICK': 0.22, 'BELL': 0.55, 'RISER': 0.25, 'BRAAAM': 0.42,
             'SHATTER': 0.35, 'SHATTER_LITE': 0.3, 'DRONE': 0.18, 'PAD': 0.45, 'SWARM': 0.2, 'CRACK': 0.3}
    for at, kind, kw in EVENTS:
        sig = get(kind, **kw)
        g = kw.get('gain', 1.0)
        place(dry, sig, at, g)
        place(wet_send, sig, at, g * sends.get(kind, 0.3))
        if kind == 'HIT':                       # 每一下撞击都配一个清晰的"咔"
            place(dry, transient(), at, 0.30 * g)
            place(wet_send, transient(), at, 0.10 * g)

    # 低频单声道（sub 不入混响湿声，避免糊）
    rev = reverb(wet_send)
    mix = dry + rev * 0.9
    # 轻微左右差异，制造宽度
    left = mix
    right = np.concatenate([np.zeros(7), mix[:-7]]) * 0.995
    st = np.stack([left, right], axis=1)
    st = soft_clip(st * 0.92, 1.25)
    # 收尾 0.5s 淡出，开头 15ms 淡入
    fade_in = int(0.015 * SR)
    st[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    fade_out = int(0.55 * SR)
    st[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
    peak = np.max(np.abs(st)) + 1e-9
    st *= 0.89 / peak                            # 留 1 dB 余量，响度交给 ffmpeg loudnorm
    return st


def main() -> int:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else 'out/cue.wav')
    out.parent.mkdir(parents=True, exist_ok=True)
    st = build()
    pcm = (np.clip(st, -1, 1) * 32767).astype('<i2')
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    # 打印包络峰值，便于核对"落点有没有对上画面"（无法试听时的替代 QC）
    mono = st.mean(axis=1)
    win = int(0.05 * SR)
    env = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, mode='same'))
    idx = np.argsort(env)[::-1][:240]
    picked: list[float] = []
    for i in idx:
        ts = i / SR
        if all(abs(ts - p) > 0.22 for p in picked):
            picked.append(round(ts, 2))
        if len(picked) >= 8:
            break
    print(f'✓ {out}  {DUR:.2f}s / {SR}Hz / 立体声')
    print('  包络最强的 8 个时刻（秒）:', sorted(picked))
    print(f'  峰值 {np.max(np.abs(st)):.3f}  有效值 {np.sqrt(np.mean(st ** 2)):.4f}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
