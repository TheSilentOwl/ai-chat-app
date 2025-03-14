"use client";

import { useState, useEffect } from "react";

interface TypewriterEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export default function TypewriterEffect({
  text,
  speed = 30,
  onComplete,
}: TypewriterEffectProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return <span>{displayedText}</span>;
}
