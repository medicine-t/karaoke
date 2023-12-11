export default class Note {
  notes = Array(12).fill(0);
  cnt = Array(12).fill(0);
  baseFrequency = Array(12).fill(1_000_000);
  allNotes: { frequency: number; strength: number; cnt: number }[] = [];
  constructor() {}

  /**
   * Frequency to NoteNumber (used MIDI / UTAU ..etc )
   * @param frequency
   * @returns noteNumber
   */
  static getNoteNumber(frequency: number) {
    if (frequency <= 0) return -1;
    return Math.round(69 + 12 * Math.log2(frequency / 440));
  }

  /**
   * NoteNumber to NoteName
   * @param noteNumber
   * @returns noteName (C,C#,D,D#,E,F,F#,G,G#,A,A#,B)
   */
  static getNoteName(noteNumber: number) {
    if (noteNumber < 0) return "-";
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    return noteNames[noteNumber % 12];
  }

  /**
   * NoteNumber to Frequency
   * @param noteNumber
   * @returns frequency
   */
  static getFrequency(noteNumber: number) {
    return 440 * Math.pow(2, (noteNumber - 69) / 12);
  }

  add = (frequency: number, strength: number) => {
    const noteNumber = Note.getNoteNumber(frequency);
    this.notes[noteNumber % 12] = Math.max(
      strength,
      this.notes[noteNumber % 12]
    );
    this.cnt[noteNumber % 12]++;
    this.baseFrequency[noteNumber % 12] = Math.min(
      this.baseFrequency[noteNumber % 12],
      frequency
    );
    this.allNotes.push({ frequency, strength, cnt: 1 });
  };

  getBaseFrequency = () => {
    let ret = { frequency: 0, strength_max: 0, cnt: 0 };
    const maxFrequencyInNotes = this.allNotes.reduce(
      (prev, current) => Math.max(prev, current.frequency),
      0
    );

    for (let i = 0; i < this.allNotes.length; i++) {
      let t_cnt = 0;
      let t_strength_max = 0.0;
      let tm = this.allNotes[i];
      let t_frequency = tm.frequency;
      let bai = 1;
      while (t_frequency * bai < maxFrequencyInNotes) {
        for (let j = i; j < this.allNotes.length; j++) {
          if (
            Math.abs(
              this.allNotes[i].frequency - this.allNotes[j].frequency / bai
            ) < 10
          ) {
            t_cnt++;
            t_strength_max = Math.max(
              t_strength_max,
              this.allNotes[j].strength
            );
          }
        }

        bai++;
      }
      if (
        ret.strength_max * Math.max(ret.cnt) <
          t_strength_max * Math.max(t_cnt) ||
        this.allNotes.length == 1
      ) {
        ret = {
          frequency: this.allNotes[i].frequency,
          strength_max: t_strength_max,
          cnt: t_cnt,
        };
      }
    }
    return ret.frequency;
  };
}
