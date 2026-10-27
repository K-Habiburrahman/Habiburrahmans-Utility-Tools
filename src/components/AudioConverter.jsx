import { useEffect, useRef, useState } from "react";
import { downloadBlob } from "../utils/download.js";

function wavBlob(buffer) {
  const channels = buffer.numberOfChannels;
  const rate = buffer.sampleRate;
  const frames = buffer.length;
  const bytes = 44 + frames * channels * 2;
  const ab = new ArrayBuffer(bytes);
  const v = new DataView(ab);
  const write = (o, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  write(0, "RIFF");
  v.setUint32(4, bytes - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, channels, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * channels * 2, true);
  v.setUint16(32, channels * 2, true);
  v.setUint16(34, 16, true);
  write(36, "data");
  v.setUint32(40, bytes - 44, true);
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let o = 44;
  for (let i = 0; i < frames; i++)
    for (let c = 0; c < channels; c++) {
      const x = Math.max(-1, Math.min(1, data[c][i]));
      v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true);
      o += 2;
    }
  return new Blob([ab], { type: "audio/wav" });
}

export default function AudioConverter({ id, hidden }) {
  const [audioBuffer, setAudioBuffer] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [meta, setMeta] = useState("No audio selected.");
  const [notice, setNotice] = useState("");
  const urlRef = useRef(null);

  useEffect(() => () => urlRef.current && URL.revokeObjectURL(urlRef.current), []);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    setAudioBuffer(null);
    if (!f) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(f);
    urlRef.current = url;
    setPreviewUrl(url);
    setMeta(`${f.name} · ${(f.size / 1024 / 1024).toFixed(2)} MB · decoding…`);
    setNotice("");
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = await ctx.decodeAudioData(await f.arrayBuffer());
      await ctx.close();
      setAudioBuffer(buf);
      setMeta(`${f.name} · ${buf.duration.toFixed(1)} seconds · ${buf.numberOfChannels} channel(s) · ${buf.sampleRate} Hz`);
      setNotice("Audio ready for WAV export.");
    } catch {
      setMeta(f.name);
      setNotice("Your browser could not decode this audio format. Try WAV or MP3.");
    }
  };

  const convert = () => {
    if (!audioBuffer) return setNotice("Choose a supported audio file and wait for decoding.");
    if (audioBuffer.length * audioBuffer.numberOfChannels > 50000000)
      return setNotice("This audio is too large to safely convert in the browser.");
    downloadBlob(wavBlob(audioBuffer), "converted-audio.wav");
    setNotice("WAV file created and downloaded.");
  };

  return (
    <section id={id} className="tool-panel tab-pane" role="tabpanel" aria-labelledby={`${id}-tab`} hidden={hidden}>
      <p className="kicker">AUDIO CONVERTER</p>
      <h2>Audio to WAV</h2>
      <p>
        Decode a supported audio file and export it as uncompressed WAV. Browser codec support varies; this tool does not
        currently encode MP3 or FLAC.
      </p>
      <label className="dropzone">
        <span>♫</span>
        <strong>Select audio file</strong>
        <small>MP3, WAV, OGG, M4A and other browser-supported formats</small>
        <input type="file" accept="audio/*" onChange={onFile} />
      </label>
      <audio src={previewUrl || undefined} controls hidden={!previewUrl} />
      <p className="muted">{meta}</p>
      <button className="primary" onClick={convert}>Convert to WAV</button>
      <p className="notice" role="status">{notice}</p>
    </section>
  );
}
