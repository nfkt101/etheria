// Bridge to the Tauri backend for local (non-Jellyfin) file playback.
// Every export degrades safely when the app is running as a plain web build
// (no Tauri runtime) so the browser-only Jellyfin client path is unaffected.

export interface MediaStreamInfo {
  index: number;
  codec_type: string;
  codec_name: string;
  language?: string;
  title?: string;
  width?: number;
  height?: number;
  channels?: number;
}

export interface MediaProbe {
  container: string;
  duration_secs: number;
  streams: MediaStreamInfo[];
}

export type LocalPlaybackPlan =
  | { mode: 'direct'; url: string }
  | { mode: 'remux'; url: string; sessionId: string }
  | { mode: 'hls'; url: string; sessionId: string };

export const isDesktopRuntime = async (): Promise<boolean> => {
  try {
    const { isTauri } = await import('@tauri-apps/api/core');
    return isTauri();
  } catch {
    return false;
  }
};

export const pickLocalVideoFile = async (): Promise<string | null> => {
  const { open } = await import('@tauri-apps/plugin-dialog');
  const selected = await open({
    multiple: false,
    directory: false,
    filters: [
      {
        name: 'Video',
        extensions: ['mp4', 'mkv', 'webm', 'mov', 'avi', 'm4v', 'ts', 'wmv', 'flv'],
      },
    ],
  });
  return typeof selected === 'string' ? selected : null;
};

export const probeMedia = async (path: string): Promise<MediaProbe> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<MediaProbe>('probe_media', { path });
};

export const localFileUrl = async (path: string): Promise<string> => {
  const { convertFileSrc } = await import('@tauri-apps/api/core');
  return convertFileSrc(path);
};

export const remuxToMp4 = async (path: string): Promise<{ sessionId: string; url: string }> => {
  const { invoke, convertFileSrc } = await import('@tauri-apps/api/core');
  const result = await invoke<{ session_id: string; output_path: string }>('remux_to_mp4', { path });
  return { sessionId: result.session_id, url: convertFileSrc(result.output_path) };
};

export const startTranscodeToHls = async (
  path: string,
  opts?: { videoCodec?: string; audioCodec?: string }
): Promise<{ sessionId: string; url: string }> => {
  const { invoke, convertFileSrc } = await import('@tauri-apps/api/core');
  const result = await invoke<{ session_id: string; manifest_path: string }>('transcode_to_hls', {
    path,
    videoCodec: opts?.videoCodec,
    audioCodec: opts?.audioCodec,
  });
  return { sessionId: result.session_id, url: convertFileSrc(result.manifest_path) };
};

export const cancelProcessing = async (sessionId: string): Promise<void> => {
  if (!sessionId) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('cancel_processing', { sessionId });
};

export const cleanupSession = async (sessionId: string): Promise<void> => {
  if (!sessionId) return;
  const { invoke } = await import('@tauri-apps/api/core');
  await invoke('cleanup_session', { sessionId });
};

// Heuristic guess at a MIME type from ffprobe's container/codec names, good
// enough to feed HTMLMediaElement.canPlayType() for a live capability check
// against whatever webview engine the app is actually running on.
const guessMimeType = (probe: MediaProbe): string | null => {
  const video = probe.streams.find((s) => s.codec_type === 'video');
  const audio = probe.streams.find((s) => s.codec_type === 'audio');
  const isMkvLabeled = probe.container.includes('matroska');
  const isWebmLikely =
    isMkvLabeled && (video?.codec_name === 'vp8' || video?.codec_name === 'vp9' || video?.codec_name === 'av1');

  const codecTokens: string[] = [];
  if (video) {
    if (video.codec_name === 'h264') codecTokens.push('avc1.42E01E');
    else if (video.codec_name === 'av1') codecTokens.push('av01.0.05M.08');
    else if (video.codec_name === 'vp9') codecTokens.push('vp09.00.10.08');
    else if (video.codec_name === 'vp8') codecTokens.push('vp8');
  }
  if (audio) {
    if (audio.codec_name === 'aac') codecTokens.push('mp4a.40.2');
    else if (audio.codec_name === 'opus') codecTokens.push('opus');
    else if (audio.codec_name === 'vorbis') codecTokens.push('vorbis');
  }

  if (isWebmLikely) {
    return codecTokens.length ? `video/webm; codecs="${codecTokens.join(', ')}"` : 'video/webm';
  }
  if (!isMkvLabeled) {
    return codecTokens.length ? `video/mp4; codecs="${codecTokens.join(', ')}"` : 'video/mp4';
  }
  // MKV container itself is unreliable across webviews even with
  // compatible codecs inside - don't claim direct-play support for it.
  return null;
};

const canDirectPlay = (probe: MediaProbe): boolean => {
  const mime = guessMimeType(probe);
  if (!mime) return false;
  const probeEl = document.createElement('video');
  return probeEl.canPlayType(mime) !== '';
};

// Codecs a stream-copy remux can safely repackage without re-encoding -
// i.e. only the *container* is the problem, not the codecs inside it.
const REMUXABLE_VIDEO_CODECS = new Set(['h264', 'vp8', 'vp9', 'av1']);
const REMUXABLE_AUDIO_CODECS = new Set(['aac', 'opus', 'vorbis', 'mp3', 'flac']);

const isRemuxEligible = (probe: MediaProbe): boolean => {
  const videoStreams = probe.streams.filter((s) => s.codec_type === 'video');
  const audioStreams = probe.streams.filter((s) => s.codec_type === 'audio');
  return (
    videoStreams.every((s) => REMUXABLE_VIDEO_CODECS.has(s.codec_name)) &&
    audioStreams.every((s) => REMUXABLE_AUDIO_CODECS.has(s.codec_name))
  );
};

// Decides Tier 1 (direct play) vs Tier 2 (remux or transcode) for a local
// file. The caller should still treat this as a best-effort plan and fall
// back further (direct -> remux -> transcode) if actual playback errors out,
// since canPlayType() is itself only a hint, not a guarantee - that's what
// planLocalPlaybackFallback is for.
export const planLocalPlayback = async (path: string): Promise<LocalPlaybackPlan> => {
  const probe = await probeMedia(path);

  if (canDirectPlay(probe)) {
    return { mode: 'direct', url: await localFileUrl(path) };
  }

  return planLocalPlaybackFallback(probe, path);
};

// Skips the direct-play check - used when a 'direct' attempt already failed
// at runtime (canPlayType() said yes but the engine choked anyway) and we
// need to escalate straight to remux/transcode.
export const planLocalPlaybackFallback = async (
  probe: MediaProbe,
  path: string
): Promise<LocalPlaybackPlan> => {
  if (isRemuxEligible(probe)) {
    const { sessionId, url } = await remuxToMp4(path);
    return { mode: 'remux', url, sessionId };
  }

  const { sessionId, url } = await startTranscodeToHls(path);
  return { mode: 'hls', url, sessionId };
};

// Convenience for callers reacting to a failed direct-play attempt - they
// only have the path, not the probe result from the first pass.
export const escalateAfterDirectPlayFailure = async (path: string): Promise<LocalPlaybackPlan> => {
  const probe = await probeMedia(path);
  return planLocalPlaybackFallback(probe, path);
};
