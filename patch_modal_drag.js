import fs from 'fs';

let content = fs.readFileSync('src/components/EmojiSelector.tsx', 'utf8');

if (!content.includes('const modalScrollRef')) {
    const newRefs = `
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const isModalDragging = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const onModalMouseDown = (e: React.MouseEvent) => {
    isModalDragging.current = true;
    startY.current = e.pageY - (modalScrollRef.current?.offsetTop || 0);
    scrollTop.current = modalScrollRef.current?.scrollTop || 0;
  };

  const onModalMouseLeave = () => {
    isModalDragging.current = false;
  };

  const onModalMouseUp = () => {
    isModalDragging.current = false;
  };

  const onModalMouseMove = (e: React.MouseEvent) => {
    if (!isModalDragging.current || !modalScrollRef.current) return;
    e.preventDefault();
    const y = e.pageY - (modalScrollRef.current.offsetTop || 0);
    const walk = (y - startY.current) * 2;
    modalScrollRef.current.scrollTop = scrollTop.current - walk;
  };
`;
    content = content.replace("  const onMouseMove = (e: React.MouseEvent) => {\n    if (!isDragging.current || !scrollRef.current) return;\n    e.preventDefault();\n    const x = e.pageX - (scrollRef.current.offsetLeft || 0);\n    const walk = (x - startX.current) * 2;\n    scrollRef.current.scrollLeft = scrollLeft.current - walk;\n  };\n", "  const onMouseMove = (e: React.MouseEvent) => {\n    if (!isDragging.current || !scrollRef.current) return;\n    e.preventDefault();\n    const x = e.pageX - (scrollRef.current.offsetLeft || 0);\n    const walk = (x - startX.current) * 2;\n    scrollRef.current.scrollLeft = scrollLeft.current - walk;\n  };\n" + newRefs);
}

if (!content.includes('ref={modalScrollRef}')) {
    content = content.replace(
        '<div className="p-4 overflow-y-auto flex-1 space-y-6 no-scrollbar">',
        `<div 
              className="p-4 overflow-y-auto flex-1 space-y-6 no-scrollbar cursor-grab active:cursor-grabbing"
              ref={modalScrollRef}
              onMouseDown={onModalMouseDown}
              onMouseLeave={onModalMouseLeave}
              onMouseUp={onModalMouseUp}
              onMouseMove={onModalMouseMove}
            >`
    );
}

fs.writeFileSync('src/components/EmojiSelector.tsx', content);
console.log('done');
