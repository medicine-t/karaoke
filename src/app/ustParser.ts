//https://w.atwiki.jp/utaou/pages/64.html#id_e7beb30c

export interface UST_Element {
  [prop: string]: any;
}

export interface UST_Note extends UST_Element {
  Length: number;
  Lyric: string;
  NoteNum: number;
  PreUtterance: number;
  Tempo?: number;
}

export interface UST_Setting extends UST_Element {
  Tempo: number;
  VoiceDir: string;
  CacheDir: string;
  UstVersion: string;
}

export interface UST_Section {
  name: string;
  element: UST_Element;
}

export interface UST {
  sections: UST_Section[];
}

export function USTparser(text: string): any {
  const lines = text.split("\r\n");
  const ust: UST = { sections: [] };
  let section_name = "";
  let section: UST_Element = {};

  for (const line of lines) {
    if (line.startsWith("[") && line.endsWith("]")) {
      if (section_name !== "") {
        if (section_name == "SETTING") {
          ust.sections.push({
            name: section_name,
            element: section as UST_Setting,
          });
        } else if (section_name == "NOTE") {
          ust.sections.push({
            name: section_name,
            element: section as UST_Note,
          });
        } else {
          ust.sections.push({
            name: section_name,
            element: section,
          });
        }
        section_name = "";
        section = {};
      }

      if (line.match(/\[#SETTING\]/) != null) {
        section_name = "SETTING";
      } else if (line.match(/\[#\d+\]/) != null) {
        section_name = "NOTE";
      } else {
        section_name = line.substring(1, line.length - 1);
      }
    } else {
      const [key, value] = line.split("=");
      section[key] = value;
    }
  }
  return ust;
}
