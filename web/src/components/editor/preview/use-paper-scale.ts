import { useEffect, useRef, useState } from 'react';

import { paperSizes, type PreviewSettings } from './constants';

export function usePaperScale(size: PreviewSettings['paper']) {
  const containerRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [paperHeight, setPaperHeight] = useState(0);
  const page = paperSizes[size];

  useEffect(() => {
    const container = containerRef.current;
    const paper = paperRef.current;
    if (!container || !paper) return;

    const observer = new ResizeObserver(() => {
      setContainerWidth(container.clientWidth);
      setPaperHeight(paper.offsetHeight);
    });
    observer.observe(container);
    observer.observe(paper);
    return () => observer.disconnect();
  }, []);

  const scale = containerWidth > 0 ? Math.min(1, containerWidth / page.widthPx) : 1;
  return {
    containerRef,
    paperRef,
    scale,
    scaledHeight: Math.max(paperHeight, page.heightPx) * scale,
  };
}
