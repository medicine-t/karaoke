"use client";
import React from "react";
import { AudioBar } from "./audioBar";

export default function Home() {
  return (
    <div>
      <AudioBar />
      <div>
        <h3>使い方</h3>
        <p>
          マイクの音声をFFTした結果はMic
          Startボタンを押すことで表示が開始されます。
        </p>
        <p>
          USTファイルを読みこんだ状態で、Note
          Startボタンを押すと、USTファイルの内容に従った赤いノーツが流れてきます。
          Stopで再生を終了します。
        </p>
        <p>歌ったり、一人で練習するときの参考にしてください。</p>
        <h3>ある機能</h3>
        <ul>
          <li>ピッチの検出(疑似) とその周波数の表示/ノート番号の表示</li>
          <li>ノートをオクターブごとに調整すること</li>
        </ul>
        <h3>現在ない機能</h3>
        <ul>
          <li>表示外のノートに合わせた自動調整</li>
          <li>ノートの一時停止</li>
          <li>判定</li>
        </ul>
      </div>
    </div>
  );
}
