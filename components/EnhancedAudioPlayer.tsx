'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Download, SkipBack, SkipForward } from 'lucide-react';

interface EnhancedAudioPlayerProps {
  audioUrl: string;
  documentId?: string;
}

export function EnhancedAudioPlayer({ audioUrl, documentId }: EnhancedAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newVolume = value[0];
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `audio-${documentId || 'script'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Waveform Visual (simplified) */}
      <div className="mb-8">
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-200"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-sm font-medium text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {/* Skip Back */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => skip(-10)}
          disabled={isLoading}
          className="rounded-full w-14 h-14 hover:bg-gray-100"
        >
          <SkipBack className="h-6 w-6 text-gray-700" />
        </Button>

        {/* Play/Pause Button */}
        <Button
          size="lg"
          onClick={togglePlayPause}
          disabled={isLoading}
          className="rounded-full w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300"
        >
          {isLoading ? (
            <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-8 w-8 text-white" fill="white" />
          ) : (
            <Play className="h-8 w-8 text-white ml-1" fill="white" />
          )}
        </Button>

        {/* Skip Forward */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => skip(10)}
          disabled={isLoading}
          className="rounded-full w-14 h-14 hover:bg-gray-100"
        >
          <SkipForward className="h-6 w-6 text-gray-700" />
        </Button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between gap-6 pt-6 border-t border-gray-100">
        {/* Volume Control */}
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="rounded-full hover:bg-gray-100"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5 text-gray-600" />
            ) : (
              <Volume2 className="h-5 w-5 text-gray-600" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
        </div>

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          disabled={isLoading}
          className="rounded-full px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}
