'use client';

import { useRef, useState } from 'react';

export function usePreviewDivider() {
  const workspaceRef = useRef<HTMLElement>(null);
  const [editorShare, setEditorShare] = useState(50);

  function resize(clientX: number) {
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const percent = ((clientX - bounds.left) / bounds.width) * 100;
    setEditorShare(Math.max(30, Math.min(70, percent)));
  }

  return {
    workspaceRef,
    editorShare,
    divider: (
      <div
        role="separator"
        aria-label="Resize editor and preview"
        aria-orientation="vertical"
        aria-valuemin={30}
        aria-valuemax={70}
        aria-valuenow={Math.round(editorShare)}
        tabIndex={0}
        className="resume-divider group hidden cursor-col-resize touch-none items-stretch justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:flex"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          resize(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) resize(event.clientX);
        }}
        onKeyDown={(event) => {
          const increment = event.key === 'ArrowLeft' ? -2 : event.key === 'ArrowRight' ? 2 : 0;
          if (!increment) return;
          event.preventDefault();
          setEditorShare((value) => Math.max(30, Math.min(70, value + increment)));
        }}
      >
        <span aria-hidden="true" className="w-1 rounded-full bg-border-strong transition-colors group-hover:bg-primary group-focus-visible:bg-primary" />
      </div>
    ),
  };
}
