import React, { useRef, useEffect, useState } from "react";
import Note from "@/app/Note";

const extractPeak = (
  buffer: Uint8Array,
  minIndex: number,
  maxIndex: number
) => {
  const bufferLength = buffer.length;
  const subBuffer = [];
  for (let i = 0; i < bufferLength - 1; i++) {
    subBuffer.push(buffer[i + 1] - buffer[i]);
  }

  let ret = [];
  for (
    let i = minIndex;
    i < Math.min(maxIndex - 1, subBuffer.length - 1);
    i++
  ) {
    if (subBuffer[i] > 0 && subBuffer[i + 1] <= 0) {
      if (buffer[i + 1] / 256 < 0.6) continue;
      ret.push(i + 1);
    }
  }
  return ret; // ここにピークのインデックスが入っている
};

function drawFrequencyLogBar(
  context: CanvasRenderingContext2D,
  analyser: AnalyserNode,
  audioContext: AudioContext,
  frequencySetting: { minFrequency: number; maxFrequency: number },
  canvasSetting: { width: number; height: number },
  offSet: { offSetX: number; offSetY: number } = { offSetX: 0, offSetY: 0 }
): Note {
  const fftSize = 8192;
  analyser.fftSize = fftSize;
  const bufferSize = analyser.frequencyBinCount;
  const sampleRate = audioContext.sampleRate;
  const buffer = new Uint8Array(bufferSize);
  const { minFrequency, maxFrequency } = frequencySetting;
  const { width, height } = canvasSetting;
  const { offSetX, offSetY } = offSet;

  const minFrequencyIndex = Math.trunc((minFrequency / sampleRate) * fftSize);
  const maxFrequencyIndex = Math.trunc((maxFrequency / sampleRate) * fftSize);

  analyser.getByteFrequencyData(buffer);

  const subBuffer = [];
  for (let i = 0; i < bufferSize - 1; i++) {
    subBuffer[i] = buffer[i + 1] - buffer[i];
  }

  let bigWaveFlag = false;
  let bigWaveIndex = 0;
  const maxIndex = buffer.indexOf(Math.max(...buffer));
  const indexToFrequency = (index: number) => (index / fftSize) * sampleRate;

  const peak = extractPeak(buffer, minFrequencyIndex, maxFrequencyIndex);
  const note = new Note();

  let noteLog = "";
  for (let i = 0; i < peak.length; i++) {
    const frequency = indexToFrequency(peak[i]);
    if (frequency < minFrequency || frequency > maxFrequency) continue;
    const strength = buffer[peak[i]] / 256;
    note.add(frequency, strength);
    noteLog += `${frequency.toFixed(5)}\t ${Note.getNoteNumber(
      frequency
    )} \t ${Note.getNoteName(Note.getNoteNumber(frequency))}\t strength: ${
      strength * 256
    }\n`;
  }

  for (let i = minFrequencyIndex; i < maxFrequencyIndex; i++) {
    // const h = (buffer[i] / 256) * height;
    const w = (buffer[i] / 256) * width;
    // const x =
    //   ((i - minFrequencyIndex) / (maxFrequencyIndex - minFrequencyIndex)) *
    //   width;
    let y =
      ((Math.log(indexToFrequency(i)) - Math.log(minFrequency)) /
        (Math.log(maxFrequency) - Math.log(minFrequency))) *
      height;

    if (!bigWaveFlag && subBuffer[i] / 265 > 0.1) {
      bigWaveFlag = true;
    }
    if (
      bigWaveFlag &&
      !bigWaveIndex &&
      subBuffer[i] <= 0 &&
      buffer[i] / 256 > 0.6
    ) {
      bigWaveIndex = i;
    }

    context.fillStyle = "#0aa"; //green
    if (peak.includes(i)) {
      context.fillStyle = "#ff0"; //yellow
    }
    if (maxIndex == i && buffer[i] / 256 > 0.4) {
      context.fillStyle = "#0f0"; // green
    }
    if (Math.abs(indexToFrequency(i) - note.getBaseFrequency()) < 1) {
      context.fillStyle = "#f00"; // white
      // context.fillRect(x, 0, 2, height);
    }
    context.fillRect(width - w + offSetX, height - y + offSetY, w, 2);
  }
  return note;
}

//https://www.asahi-net.or.jp/~hb9t-ktd/music/Japan/Research/DTM/freq_map.html
function drawStaffNotation(
  context: CanvasRenderingContext2D,
  frequencySetting: { minFrequency: number; maxFrequency: number },
  canvasSetting: { width: number; height: number },
  offSet: { offSetX: number; offSetY: number } = { offSetX: 0, offSetY: 0 }
) {
  const { minFrequency, maxFrequency } = frequencySetting;
  const { width, height } = canvasSetting;
  const { offSetX, offSetY } = offSet;

  const minNoteNum = Note.getNoteNumber(minFrequency);
  const maxNoteNum = Note.getNoteNumber(maxFrequency);
  const freqPerPixel =
    height / (Math.log(maxFrequency) - Math.log(minFrequency));
  const logFrequency = (freq: number) => {
    return (
      ((Math.log(freq) - Math.log(minFrequency)) /
        (Math.log(maxFrequency) - Math.log(minFrequency))) *
      height
    );
  };
  for (let noteNum = minNoteNum - 1; noteNum <= maxNoteNum; noteNum++) {
    const y =
      (logFrequency(Note.getFrequency(noteNum)) +
        logFrequency(Note.getFrequency(noteNum + 1))) /
      2;
    if (y < 0) continue;
    if (y > height) continue;
    context.fillStyle = "#a6a6a6";
    context.fillRect(offSetX, height - y + offSetY, width, 2);
  }
}

export function AudioBar() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>();
  const pitchRef = useRef<HTMLDivElement>(null);
  const peakRef = useRef<HTMLDivElement>(null);

  let audioContext: AudioContext | undefined = undefined;
  let analyser: AnalyserNode | undefined = undefined;
  let animationFrame = 0;

  const minFrequency = 87;
  const maxFrequency = 622;

  const width = window.innerWidth - 100;
  const height = window.innerHeight * 0.8;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null) return;
    const ctx = canvas.getContext("2d");
    if (ctx == null) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    setContext(ctx);
  });

  const tick = () => {
    if (context != null && analyser != null && audioContext != null) {
      context.clearRect(0, 0, width, height);
      drawStaffNotation(
        context,
        { minFrequency, maxFrequency },
        { width, height }
      );
      const note = drawFrequencyLogBar(
        context,
        analyser,
        audioContext,
        { minFrequency, maxFrequency },
        { width: 150, height: height },
        { offSetX: 500, offSetY: 0 }
      );
      // if (peakRef.current != null) peakRef.current.innerText = noteLog;
      if (pitchRef.current != null) {
        const freq = note.getBaseFrequency();
        pitchRef.current.innerText = `baseFrequency: ${note.getBaseFrequency()} \n noteNumber: ${Note.getNoteNumber(
          freq
        )}\n${Note.getNoteName(Note.getNoteNumber(freq))}`;
      }
      animationFrame = requestAnimationFrame(tick);
    }
  };

  const onRecordStart = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
      },
    });
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    const input = audioContext.createMediaStreamSource(stream);
    input.connect(analyser);

    tick();
  };

  const onRecordStop = async () => {
    cancelAnimationFrame(animationFrame);
  };

  return (
    <div>
      <canvas
        id="audioBar"
        width={width}
        height={height}
        ref={canvasRef}
      ></canvas>
      <div id="audioBarControl">
        <button id="recordStart" onClick={onRecordStart}>
          Mic Start
        </button>
        <button id="recordStop" onClick={onRecordStop}>
          Mic Stop
        </button>
      </div>
      <div id="pitch" ref={pitchRef}></div>
      <div>******************************</div>
      <div id="peak" ref={peakRef}></div>
    </div>
  );
}
