import { useState, useRef, useEffect } from 'react';
import { motion, useInView, PanInfo, useMotionValue, useTransform, animate } from 'motion/react';
import { PolaroidImage } from '../types';

// Helper to synthesize a simple "pop/click" sound
const playPopSound = (pitch = 150) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    // Start at pitch, drop to 40Hz quickly for a "pop" effect
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
    
    // Quick volume envelope
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // Ignore audio errors
  }
};

function PolaroidCard({ 
  image, 
  index, 
  stackLength, 
  activeId, 
  setActiveId, 
  hasEntered, 
  isInView, 
  handleDragEnd,
  handleDrag,
  dragProgress
}: any) {
  const isSelected = activeId === image.id;
  const isTop = index === stackLength - 1;
  const visualIndex = stackLength - 1 - index;

  const yOffset = isSelected ? 0 : visualIndex * 12;
  const rotateOffset = isSelected ? 0 : (visualIndex % 2 === 0 ? -1 : 1) * visualIndex * 2.5;
  const scaleOffset = isSelected ? 1.25 : Math.max(0.82, 1 - visualIndex * 0.04);
  const zIndexVal = isSelected ? 100 : index;
  const opacityVal = visualIndex > 4 ? 0 : 1;

  // React to the top card being dragged with smoother animation
  const innerScale = useTransform(dragProgress, (p: number) => {
    if (isTop || isSelected) return 1;
    const base = Math.max(0.82, 1 - visualIndex * 0.04);
    const target = Math.max(0.82, 1 - Math.max(0, visualIndex - p) * 0.04);
    return target / base;
  });

  const innerY = useTransform(dragProgress, (p: number) => {
    if (isTop || isSelected) return 0;
    return -p * 12;
  });

  // Subtle, smooth drift animation for the pile effect
  const driftAnimation = (!isSelected && !isTop && hasEntered) ? {
    x: [0, (Math.random() - 0.5) * 4, 0],
    y: [0, (Math.random() - 0.5) * 4, 0],
    transition: {
      duration: 4 + Math.random() * 2,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut"
    }
  } : {};

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: -600, 
        scale: 1.5, 
        rotate: (Math.random() - 0.5) * 60 
      }}
      animate={
        isInView ? {
          opacity: opacityVal, 
          y: yOffset, 
          scale: scaleOffset, 
          rotate: rotateOffset, 
          x: 0,
          zIndex: zIndexVal
        } : {
          opacity: 0, 
          y: -600, 
          scale: 1.5, 
          rotate: rotateOffset, 
          x: 0,
          zIndex: zIndexVal
        }
      }
      transition={{ 
        duration: isSelected ? 0.5 : 0.9, 
        delay: (!hasEntered && isInView && !isSelected) ? 0.2 + index * 0.12 : 0, 
        type: 'spring', 
        bounce: 0.25,
        stiffness: 120,
        damping: 15
      }}
      style={{
        position: 'absolute',
        transformOrigin: 'bottom center'
      }}
      className="pointer-events-auto"
    >
      <motion.div
        drag={isTop && !isSelected}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.6}
        onDrag={handleDrag}
        whileDrag={{ 
          scale: 1.08, 
          cursor: 'grabbing',
          rotate: [rotateOffset - 3, rotateOffset + 3, rotateOffset - 3, rotateOffset + 3, rotateOffset - 3, rotateOffset + 3, rotateOffset]
        }}
        onDragStart={() => playPopSound(250)}
        onDragEnd={(e, info) => handleDragEnd(e, info, image.id)}
        onClick={() => {
          if (isSelected || isTop) {
            playPopSound(isSelected ? 100 : 200);
            setActiveId(isSelected ? null : image.id);
          }
        }}
        animate={driftAnimation}
        style={(!isTop && !isSelected) ? { scale: innerScale, y: innerY } : {}}
        className="bg-white p-2 pb-6 md:p-3 md:pb-8 shadow-2xl transition-shadow rounded-sm border border-gray-200 w-48 h-56 md:w-64 md:h-72 flex flex-col items-center justify-between touch-none cursor-grab active:cursor-grabbing"
      >
        <motion.div 
          className="w-full h-full bg-slate-200 mb-2 border border-black/10 overflow-hidden bg-cover bg-center pointer-events-none rounded-xs"
          style={{ 
            backgroundImage: `url(${image.url})`,
            filter: isSelected ? "none" : (isTop ? "grayscale(5%)" : "grayscale(40%) contrast(1.05) sepia(15%)"),
          }}
          transition={{ filter: { duration: 0.5, ease: "easeInOut" } }}
        />
        <motion.span 
          className="font-sans text-gray-800 text-xs md:text-sm font-medium transform -rotate-1 truncate max-w-full pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {image.caption}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

export default function PolaroidPile({ images }: { images: PolaroidImage[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [stack, setStack] = useState<PolaroidImage[]>([]);
  
  // Only trigger entry when the user scrolls near the pile
  const isInView = useInView(containerRef, { once: true, margin: "20%" });
  
  const dragProgress = useMotionValue(0);

  useEffect(() => {
    if (images && images.length > 0 && stack.length === 0) {
      setStack([...images].reverse());
    }
  }, [images, stack.length]);

  useEffect(() => {
    if (isInView && !hasEntered) {
      // Mark as entered after the stagger animation completes
      setTimeout(() => setHasEntered(true), images.length * 120 + 800);
    }
  }, [isInView, hasEntered, images.length]);

  if (!images || images.length === 0) return null;

  const handleDrag = (e: any, info: PanInfo) => {
    const dist = Math.min(1, Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2) / 100);
    dragProgress.set(dist);
  };

  const handleDragEnd = (event: any, info: PanInfo, imageId: string) => {
    const threshold = 100;
    
    // Animate the cards underneath back to the resting state with smooth spring
    animate(dragProgress, 0, { type: "spring", bounce: 0.2, stiffness: 150 });

    // If dragged roughly past threshold in any direction, shuffle!
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.offset.y) > threshold) {
      playPopSound(150);
      setStack((prev) => {
        const newStack = [...prev];
        const index = newStack.findIndex(img => img.id === imageId);
        if (index !== -1) {
          const [removed] = newStack.splice(index, 1);
          newStack.unshift(removed); // Move to the bottom of the deck
        }
        return newStack;
      });
    } else {
      playPopSound(100);
    }
  };

  return (
    <motion.div 
      ref={containerRef} 
      className="w-full relative py-16 grid place-items-center min-h-[550px] overflow-hidden my-8 px-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <motion.h3 
        className="absolute top-4 md:top-8 left-0 right-0 text-xl md:text-2xl font-bold text-white/50 z-0 text-center px-4 w-full"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        Memories 📸<br/><span className="text-sm font-normal">(Swipe to shuffle, Tap to inspect!)</span>
      </motion.h3>
      
      {/* Invisible overlay to collapse inspected photo if clicked outside */}
      {activeId && (
        <motion.div 
          className="absolute inset-0 z-40 cursor-zoom-out"
          onClick={() => setActiveId(null)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      <div className="relative grid place-items-center w-full max-w-[280px] sm:max-w-sm md:max-w-md h-[400px] mt-12 perspective-1000">
        {stack.map((image, index) => (
          <PolaroidCard
            key={image.id}
            image={image}
            index={index}
            stackLength={stack.length}
            activeId={activeId}
            setActiveId={setActiveId}
            hasEntered={hasEntered}
            isInView={isInView}
            handleDragEnd={handleDragEnd}
            handleDrag={handleDrag}
            dragProgress={dragProgress}
          />
        ))}
      </div>
    </motion.div>
  );
}