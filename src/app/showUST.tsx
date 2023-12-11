import Encoding from "encoding-japanese";
import React from "react";
import { UST, UST_Note, UST_Setting, USTparser } from "@/app/ustParser";

//https://w.atwiki.jp/utaou/pages/64.html#id_e7beb30c
export function USTInput() {
  const fetchAsText = async (file: File) => {
    const txt = await new Promise<String>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const codes = new Uint8Array(reader.result as ArrayBuffer);
        const encoding = Encoding.detect(codes);

        if (encoding == false) {
          reject("Encoding not detected");
          return;
        }
        const unicodeString = Encoding.convert(codes, {
          to: "UNICODE",
          from: encoding,
          type: "string",
        });
        resolve(unicodeString);
      });

      reader.addEventListener("error", () => {
        reject(reader.error);
      });

      reader.readAsArrayBuffer(file);
    });
    return txt;
  };

  const printLyrics = (ust: UST) => {
    const lyrics = extractLyrics(ust);
    console.info(lyrics);
    document.getElementById("result")!.innerText = lyrics;
  };

  const extractLyrics = (ust: UST) => {
    let lyrics: string = "";
    for (const section of ust.sections) {
      if (section.name === "SETTING") {
        document.getElementById("tempo")!.innerText = `Tempo: ${
          (section.element as UST_Setting).Tempo
        } \t 4分:${(1000 / (section.element as UST_Setting).Tempo).toFixed(
          4
        )} ms`;
      } else if (section.name === "NOTE") {
        const element: UST_Note = section.element as UST_Note;
        lyrics += `${element.Lyric} : ${element.NoteNum} : ${
          element.Length / 480
        }拍  ${element.Tempo ? `newTempo: ${element.Tempo}` : ""}\n`;
      }
    }
    return lyrics;
  };

  const fileChanged = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.files);
    for (const file of event.target.files as FileList) {
      const text = (await fetchAsText(file)) as string;
      const parseResult = USTparser(text);
      console.log(parseResult);
      printLyrics(parseResult);
    }
  };

  return (
    <div>
      <input
        type="file"
        id="ustInput"
        name="ustInput"
        accept=".ust"
        onChange={fileChanged}
      />
      <p id="tempo"></p>
      <p id="result"></p>
    </div>
  );
}
