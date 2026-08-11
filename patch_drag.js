import fs from 'fs';

let content = fs.readFileSync('src/components/EmojiSelector.tsx', 'utf8');

if (!content.includes('useRef')) {
    content = content.replace("import React, { useState } from 'react';", "import React, { useState, useRef } from 'react';");
}

if (!content.includes('const scrollRef')) {
    const refs = `
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollRef.current?.scrollLeft || 0;
  };

  const onMouseLeave = () => {
    isDragging.current = false;
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  const onMouseMove = (e) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };
`;
    content = content.replace("const [tempEmoji, setTempEmoji] = useState(emoji || '📌');", "const [tempEmoji, setTempEmoji] = useState(emoji || '📌');\n" + refs);
}

if (!content.includes('ref={scrollRef}')) {
    content = content.replace(
        /className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-2 flex-1 scroll-smooth"\n\s*onWheel=\{\(e\) => \{/,
        `className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-2 flex-1 scroll-smooth cursor-grab active:cursor-grabbing"
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onWheel={(e) => {`
    );
}

fs.writeFileSync('src/components/EmojiSelector.tsx', content);
console.log('done');
