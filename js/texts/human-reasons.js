// Samler HUMAN_REASONS til appens fælles sproglag.
export const HUMAN_REASONS = {
  da: {
    filler: 'En indledende fyldvending er fjernet eller gjort kortere. Selve påstanden bevares.',
    transition: 'En formel overgang er erstattet af en kortere, almindelig overgang.',
    split: 'En lang sætning er delt foran en ny hovedsætning. Forbindelsesordet bevares.',
    typography: 'Et usynligt formateringstegn eller en tankestreg er normaliseret uden for beskyttet tekst.',
  },
  de: {
    filler: 'Eine einleitende Wendung wurde gekürzt. Die eigentliche Aussage bleibt erhalten.',
    transition: 'Ein formeller Übergang wurde durch einen kürzeren, geläufigen Übergang ersetzt.',
    split: 'Ein langer Satz wurde vor einem neuen Hauptsatz geteilt. Die Konjunktion bleibt erhalten.',
    typography:
      'Ein unsichtbares Formatierungszeichen oder Gedankenstrich wurde außerhalb geschützter Textstellen normalisiert.',
  },
  en: {
    filler: 'An introductory or wordy expression was shortened. The underlying statement is retained.',
    transition: 'A formal transition was replaced with a shorter, everyday transition.',
    split: 'A long sentence was split before a new main clause. The conjunction is retained.',
    typography: 'An invisible formatting character or dash was normalized outside protected text.',
  },
};
