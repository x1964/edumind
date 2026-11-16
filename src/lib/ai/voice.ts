import "server-only";

/**
 * Modular text-to-speech adapter.
 *
 * The default implementation targets any OpenAI-compatible `/audio/speech`
 * endpoint so the provider can be changed by environment variables only.
 * The API key never leaves the server.
 *
 * Configuration:
 *   TTS_BASE_URL      e.g. https://api.openai.com/v1
 *   TTS_API_KEY       provider key
 *   TTS_MODEL         e.g. gpt-4o-mini-tts
 *   TTS_VOICE         provider voice id (optional)
 *   TTS_ARABIC_VOICE  voice id used for Arabic (optional)
 *   TTS_SUPPORTS_ARABIC  "true" | "false" (default true)
 */

export class VoiceNotConfiguredError extends Error {
  constructor() {
    super("Voice provider is not configured.");
    this.name = "VoiceNotConfiguredError";
  }
}

export class VoiceUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoiceUnsupportedError";
  }
}

export class VoiceProviderError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "VoiceProviderError";
    this.status = status;
  }
}

const BASE_URL = (process.env.TTS_BASE_URL ?? "").replace(/\/+$/, "");
const API_KEY = process.env.TTS_API_KEY ?? "";
const MODEL = process.env.TTS_MODEL ?? "";
const DEFAULT_VOICE = process.env.TTS_VOICE ?? "alloy";
const ARABIC_VOICE = process.env.TTS_ARABIC_VOICE ?? "";
const SUPPORTS_ARABIC = process.env.TTS_SUPPORTS_ARABIC !== "false";
const TIMEOUT_MS = Number(process.env.TTS_TIMEOUT_MS ?? "60000");

export interface VoiceSynthesisRequest {
  text: string;
  lang: "ar" | "en";
  speed?: number;
}

export interface VoiceSynthesisResult {
  audio: ArrayBuffer;
  contentType: string;
  voice: string;
}

export function isVoiceConfigured(): boolean {
  return Boolean(BASE_URL && API_KEY && MODEL);
}

export function voiceCapabilities() {
  return {
    configured: isVoiceConfigured(),
    arabic: isVoiceConfigured() && SUPPORTS_ARABIC,
    provider: isVoiceConfigured() ? "openai_compatible" : null,
  };
}

export async function synthesizeSpeech(
  request: VoiceSynthesisRequest
): Promise<VoiceSynthesisResult> {
  if (!isVoiceConfigured()) throw new VoiceNotConfiguredError();
  if (request.lang === "ar" && !SUPPORTS_ARABIC) {
    throw new VoiceUnsupportedError("The configured voice provider does not support Arabic.");
  }

  const voice = request.lang === "ar" && ARABIC_VOICE ? ARABIC_VOICE : DEFAULT_VOICE;
  const speed = Math.min(2, Math.max(0.5, request.speed ?? 1));

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        voice,
        input: request.text,
        speed,
        response_format: "mp3",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new VoiceProviderError("The voice provider timed out.", 504);
    }
    throw new VoiceProviderError("The voice provider could not be reached.", 503);
  }

  if (!response.ok) {
    throw new VoiceProviderError(`Voice provider returned ${response.status}.`, response.status);
  }

  const contentType = response.headers.get("content-type") ?? "audio/mpeg";
  if (!contentType.startsWith("audio/")) {
    throw new VoiceProviderError("The voice provider returned an unsupported format.");
  }

  return { audio: await response.arrayBuffer(), contentType, voice };
}
