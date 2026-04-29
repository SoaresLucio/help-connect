// Bloqueio de troca de contato fora da plataforma (estilo Workana).
// Detecta telefones, e-mails, links de mensageria e sequências de dígitos.

const DIGIT_MAP: Record<string, string> = {
  "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
  "o":"0","O":"0","i":"1","I":"1","l":"1","z":"2","Z":"2","s":"5","S":"5","b":"6","B":"8",
  "zero":"0","um":"1","dois":"2","tres":"3","três":"3","quatro":"4","cinco":"5","seis":"6","sete":"7","oito":"8","nove":"9",
};

function normalize(text: string): string {
  let t = text.toLowerCase();
  // troca palavras numéricas por dígitos
  t = t.replace(/\b(zero|um|dois|tr[êe]s|quatro|cinco|seis|sete|oito|nove)\b/g, (w) => DIGIT_MAP[w] ?? w);
  // troca leetspeak básico
  t = t.replace(/[oilzsb]/gi, (c) => DIGIT_MAP[c] ?? c);
  return t;
}

function digitsOnly(text: string): string {
  return text.replace(/\D+/g, "");
}

const PHRASE_PATTERNS: RegExp[] = [
  /\b(whats?app|whatsapp|wpp|zap|zapzap|telegram|tele|signal|skype|discord|insta|instagram|face|facebook|messenger|email|e-?mail|gmail|hotmail|outlook|yahoo)\b/i,
  /\b(meu|minha|seu|sua)\s+(numero|n[uú]mero|cel|celular|whats|whatsapp|telefone|fone|contato|email|e-?mail)\b/i,
  /\b(me\s+(chama|liga|manda|adiciona|add)|chama\s+no|liga\s+no|fala\s+comigo)\b/i,
  /\b(fora\s+(da|do)\s+(app|aplicativo|plataforma|site|helpaqui))\b/i,
  /(@[a-z0-9._-]+)/i, // handle estilo @user
  /\b(https?:\/\/|www\.|t\.me\/|wa\.me\/|api\.whatsapp\.com)/i,
];

export type ContentCheck = { ok: boolean; reason?: string };

/**
 * Detecta tentativas de troca de número/contato.
 * - 7+ dígitos consecutivos (com separadores opcionais)
 * - Sequências repetidas (ex.: 11000, 630000) — qualquer bloco com 5+ dígitos é suspeito
 * - Palavras-chave de mensageria, "me chama no zap", e-mails, URLs.
 */
export function checkExternalContact(rawText: string): ContentCheck {
  if (!rawText) return { ok: true };
  const text = rawText.trim();

  // 1) e-mail explícito
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) {
    return { ok: false, reason: "Não é permitido enviar e-mails. Mantenha a conversa pela HelpAqui." };
  }

  // 2) frases de contato externo
  for (const re of PHRASE_PATTERNS) {
    if (re.test(text)) {
      return { ok: false, reason: "Por segurança, é proibido trocar contatos (WhatsApp, telefone, redes sociais) ou pedir negociação fora da HelpAqui." };
    }
  }

  // 3) números de telefone — analisamos dígitos somente (com normalização leetspeak)
  const normalized = normalize(text);
  // Captura blocos de 5+ "dígitos" (após normalização) em até 20 caracteres com separadores
  const phoneLike = normalized.match(/(?:\d[\s\-.()/]?){5,}/g);
  if (phoneLike) {
    for (const block of phoneLike) {
      const d = digitsOnly(block);
      if (d.length >= 7) {
        return { ok: false, reason: "Detectamos um possível número de telefone. É proibido trocar números. Use o chat da HelpAqui." };
      }
      // sequências curtas tipo 11000, 630000, 92000 — 5-6 dígitos com muitos zeros/repetições
      if (d.length >= 5) {
        const repeated = /(\d)\1{2,}/.test(d); // 3+ iguais seguidos
        const sequential = /01234|12345|23456|34567|45678|56789|98765|87654|76543|65432|54321/.test(d);
        if (repeated || sequential) {
          return { ok: false, reason: "Detectamos uma sequência numérica suspeita (parece um telefone). É proibido trocar contatos fora da HelpAqui." };
        }
      }
    }
  }

  // 4) blocos de dígitos não-contíguos somando muito (ex: "6 3 0 0 0 0")
  const totalDigits = digitsOnly(normalized).length;
  const looksSpaced = /(\d[\s.\-_]+){4,}\d/.test(normalized);
  if (looksSpaced && totalDigits >= 7) {
    return { ok: false, reason: "Não envie números de telefone, mesmo separados por espaços. É proibido trocar contatos fora da HelpAqui." };
  }

  return { ok: true };
}
