/// Parses ffmpeg's stderr progress line (`... time=00:01:23.45 ...`) into
/// seconds. Returns `None` for lines without a `time=` field (most of them -
/// ffmpeg logs plenty of lines that aren't progress updates).
pub fn parse_ffmpeg_time_line(line: &str) -> Option<f64> {
    let idx = line.find("time=")?;
    let token = line[idx + 5..].split_whitespace().next()?;
    let mut parts = token.split(':');
    let h: f64 = parts.next()?.parse().ok()?;
    let m: f64 = parts.next()?.parse().ok()?;
    let s: f64 = parts.next()?.parse().ok()?;
    Some(h * 3600.0 + m * 60.0 + s)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_a_standard_progress_line() {
        let line = "frame=  120 fps=30 q=28.0 size=    512kB time=00:01:23.45 bitrate= 512.0kbits/s speed=1.2x";
        assert_eq!(parse_ffmpeg_time_line(line), Some(83.45));
    }

    #[test]
    fn parses_an_hour_plus_timestamp() {
        let line = "time=01:02:03.00";
        assert_eq!(parse_ffmpeg_time_line(line), Some(3723.0));
    }

    #[test]
    fn returns_none_without_a_time_field() {
        let line = "Input #0, matroska,webm, from 'movie.mkv':";
        assert_eq!(parse_ffmpeg_time_line(line), None);
    }
}
