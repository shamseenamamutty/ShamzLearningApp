import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { useRef, useState } from 'react';
import { courseIdOf, directionOf, getItem } from '@/content/course';
import { Picture } from '@/ui/Picture';
import { ScriptText } from '@/ui/ScriptText';
import { Feedback } from '../Feedback';
import type { ActivityProps } from '../types';
import { useAnswer } from '../useAnswer';

function Tile({ id, courseId, glyph, label, shaking, disabled, onTap }: { id: string; courseId: string; glyph: string; label: string; shaking: boolean; disabled: boolean; onTap: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled });
  return (
    <button
      ref={setNodeRef}
      type="button"
      data-testid={`tile-${id}`}
      aria-label={label}
      {...listeners}
      {...attributes}
      // Tapping a letter puts it in the basket too, so the child never has to drag across the screen.
      onClick={onTap}
      style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, touchAction: 'none' }}
      className={`flex h-[min(6rem,13dvh)] w-[min(6rem,13dvh)] min-h-tap min-w-tap items-center justify-center rounded-blob bg-white shadow-[0_6px_0_#ddd6fe] ${isDragging ? 'z-10 scale-110 shadow-xl' : ''} ${shaking ? 'animate-shake' : ''}`}
    >
      <ScriptText courseId={courseId} className="text-[min(3.75rem,8dvh)] leading-none">{glyph}</ScriptText>
    </button>
  );
}

function Basket({ courseId, emoji, word, filled }: { courseId: string; emoji: string; word: string; filled: string | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'basket' });
  return (
    <div
      ref={setNodeRef}
      data-testid="basket"
      className={`flex w-full flex-col items-center gap-[min(0.5rem,1dvh)] rounded-blob border-4 border-dashed p-[min(1rem,2dvh)] transition-colors ${
        isOver ? 'border-grape-500 bg-grape-100' : 'border-sun-400 bg-sun-100'
      }`}
    >
      <span className="text-[min(4.5rem,9dvh)] leading-none"><Picture value={emoji} alt={word} /></span>
      <ScriptText courseId={courseId} className="text-[min(1.875rem,5dvh)] font-bold leading-tight text-ink/70">{word}</ScriptText>
      <div className="flex h-[min(6rem,12dvh)] w-[min(6rem,12dvh)] items-center justify-center rounded-3xl bg-white/70 text-[min(3rem,7dvh)]">
        {filled ? <ScriptText courseId={courseId} className="text-6xl text-leaf-500 animate-pop-in">{filled}</ScriptText> : '🧺'}
      </div>
    </div>
  );
}

/** A4 Drag & Drop: drag the letter that starts the pictured word into the basket. */
export default function DragDrop({ activity, onDone }: ActivityProps<'drag_drop'>) {
  const target = getItem(activity.itemId);
  const courseId = courseIdOf(target.id);
  const { feedback, answer, finished } = useAnswer(activity, onDone);
  const [filled, setFilled] = useState<string | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor));

  // A finished drag can also fire a click on the same tile; ignore that click so it isn't a 2nd answer.
  const lastDragEnd = useRef(0);

  const drop = (id: string) => {
    const ok = id === activity.itemId;
    if (ok) setFilled(getItem(id).glyph);
    else {
      setShake(id);
      window.setTimeout(() => setShake(null), 400);
    }
    answer(ok);
  };

  const onDragEnd = (e: DragEndEvent) => {
    lastDragEnd.current = Date.now();
    if (e.over?.id !== 'basket') return;
    drop(String(e.active.id));
  };

  const onTap = (id: string) => {
    if (finished || Date.now() - lastDragEnd.current < 400) return;
    drop(id);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex flex-col items-center gap-[min(1.5rem,3dvh)] pt-2">
        <Basket courseId={courseId} emoji={target.example.emoji} word={target.example.word} filled={filled} />
        <div dir={directionOf(target.id)} className="flex justify-center gap-4">
          {activity.options
            .filter((id) => !(filled && id === activity.itemId))
            .map((id) => (
              <Tile key={id} id={id} courseId={courseId} glyph={getItem(id).glyph} label={getItem(id).name.en} shaking={shake === id} disabled={finished} onTap={() => onTap(id)} />
            ))}
        </div>
        <Feedback state={feedback} />
      </div>
    </DndContext>
  );
}
