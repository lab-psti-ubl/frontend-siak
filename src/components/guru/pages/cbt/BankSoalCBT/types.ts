import type { CBTQuestionType, CBTOption, CBTMatchingPair } from '../../../../../types';

export type SoalFormState = {
  tipe: CBTQuestionType;
  pertanyaan: string;
  poin: number;
  opsi: CBTOption[];
  jawabanBenarBoolean?: boolean;
  pasangan: CBTMatchingPair[];
  jawabanEssay?: string;
  gambar?: string | null;
  menjodohkanScoring: 'semua_benar' | 'minimal_benar';
  menjodohkanMinimalBenar: number;
};

export const defaultSoalState: SoalFormState = {
  tipe: 'pilihan_ganda',
  pertanyaan: '',
  poin: 1,
  opsi: [
    { id: 'opt-1', text: '', isCorrect: true },
    { id: 'opt-2', text: '', isCorrect: false },
  ],
  pasangan: [
    { id: 'pair-1', left: '', right: '' },
    { id: 'pair-2', left: '', right: '' },
  ],
  menjodohkanScoring: 'semua_benar',
  menjodohkanMinimalBenar: 1,
};
