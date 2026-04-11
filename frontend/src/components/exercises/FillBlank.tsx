import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { FillBlankData, FillBlankAnswer } from '@/hooks/useContent';

interface Chip {
  id: string;
  text: string;
}

// ============================================================
// DraggableChip
// ============================================================
const DraggableChip = ({
  chip,
  disabled,
}: {
  chip: Chip;
  disabled: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: chip.id, disabled });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        inline-flex items-center justify-center
        rounded-lg border-2 px-3 py-1.5
        font-display text-xl select-none
        transition-all duration-150
        ${isDragging
          ? 'opacity-0'
          : disabled
          ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
          : 'border-primary/40 bg-primary/8 text-primary hover:border-primary hover:bg-primary/15 cursor-grab active:cursor-grabbing'
        }
      `}
    >
      {chip.text}
    </div>
  );
};

// ============================================================
// DroppableSlot — blank in propozitie
// ============================================================
const DroppableSlot = ({
  id,
  chip,
  disabled,
  onRemove,
}: {
  id: string;
  chip: Chip | null;
  disabled: boolean;
  onRemove: () => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id, disabled });

  return (
    <span
      ref={setNodeRef}
      onClick={chip && !disabled ? onRemove : undefined}
      title={chip ? 'Click to remove' : undefined}
      className={`
        inline-flex items-center justify-center
        rounded-lg border-2 min-w-[64px] h-10 px-2 mx-1
        font-display text-xl align-middle
        transition-all duration-150
        ${chip
          ? 'border-primary bg-primary/10 text-primary cursor-pointer hover:border-destructive hover:bg-destructive/10 hover:text-destructive'
          : isOver
          ? 'border-primary bg-primary/5 border-solid'
          : 'border-border bg-muted border-dashed text-muted-foreground'
        }
      `}
    >
      {chip ? chip.text : <span className="text-sm opacity-40">___</span>}
    </span>
  );
};

// ============================================================
// DroppablePool — zona chip-urilor disponibile
// ============================================================
const DroppablePool = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-wrap gap-2 min-h-[52px] rounded-lg
        border-2 border-dashed p-3 transition-colors duration-150
        ${isOver ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/30'}
      `}
    >
      {children}
    </div>
  );
};

// ============================================================
// FillBlank
// ============================================================
interface Props {
  prompt: string;
  data: FillBlankData;
  onAnswer: (answer: FillBlankAnswer) => void;
  disabled?: boolean;
  previousAnswer?: FillBlankAnswer | null;
}

export const FillBlank = ({
  prompt,
  data,
  onAnswer,
  disabled = false,
}: Props) => {
  const [chips] = useState<Chip[]>(() =>
    [...data.correctAnswers]
      .sort(() => Math.random() - 0.5)
      .map((text, i) => ({ id: `chip-${i}`, text }))
  );

  // slots[i] = chip.id | null
  const [slots, setSlots] = useState<(string | null)[]>(() =>
    Array(data.correctAnswers.length).fill(null)
  );

  const [activeChipId, setActiveChipId] = useState<string | null>(null);

  const getChipById = useCallback(
    (id: string) => chips.find((c) => c.id === id) ?? null,
    [chips]
  );

  const getSlotIndexForChip = useCallback(
    (chipId: string) => slots.findIndex((s) => s === chipId),
    [slots]
  );

  const poolChips = chips.filter((c) => !slots.includes(c.id));
  const activeChip = activeChipId ? getChipById(activeChipId) : null;

  const emitAnswerIfComplete = useCallback(
    (newSlots: (string | null)[]) => {
      if (newSlots.every((s) => s !== null)) {
        const answers = newSlots.map((id) => getChipById(id!)?.text ?? '');
        onAnswer({ answers });
      }
    },
    [getChipById, onAnswer]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveChipId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveChipId(null);
    if (!over) return;

    const chipId = active.id as string;
    const overId = over.id as string;
    const sourceSlotIdx = getSlotIndexForChip(chipId);

    if (overId === 'pool') {
      if (sourceSlotIdx >= 0) {
        const newSlots = [...slots];
        newSlots[sourceSlotIdx] = null;
        setSlots(newSlots);
      }
      return;
    }

    if (overId.startsWith('slot-')) {
      const targetSlotIdx = parseInt(overId.split('-')[1]);
      const existingChipId = slots[targetSlotIdx];
      const newSlots = [...slots];

      if (existingChipId && existingChipId !== chipId) {
        // Swap: chip existent merge in slot sursa sau inapoi in pool
        if (sourceSlotIdx >= 0) {
          newSlots[sourceSlotIdx] = existingChipId;
        }
        // Daca sursa e pool, chip-ul existent ramane in pool (nu e in newSlots)
      } else if (sourceSlotIdx >= 0) {
        newSlots[sourceSlotIdx] = null;
      }

      newSlots[targetSlotIdx] = chipId;
      setSlots(newSlots);
      emitAnswerIfComplete(newSlots);
    }
  };

  const handleRemoveFromSlot = useCallback(
    (slotIdx: number) => {
      if (disabled) return;
      const newSlots = [...slots];
      newSlots[slotIdx] = null;
      setSlots(newSlots);
    },
    [slots, disabled]
  );

  const handleClear = () => {
    setSlots(Array(data.correctAnswers.length).fill(null));
  };

  // Parseaza prompt-ul in parti
  const parts = prompt.split('___');
  let slotCounter = 0;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Propozitie cu slot-uri droppable */}
        <div className="rounded-lg bg-muted/50 border border-border px-4 py-4 flex flex-wrap items-center leading-loose">
          {parts.map((part, i) => {
            const currentSlot = slotCounter;
            if (i < parts.length - 1) slotCounter++;
            return (
              <span key={i} className="inline-flex items-center flex-wrap">
                <span className="font-display text-xl text-foreground">
                  {part}
                </span>
                {i < parts.length - 1 && (
                  <DroppableSlot
                    id={`slot-${currentSlot}`}
                    chip={
                      slots[currentSlot]
                        ? getChipById(slots[currentSlot]!)
                        : null
                    }
                    disabled={disabled}
                    onRemove={() => handleRemoveFromSlot(currentSlot)}
                  />
                )}
              </span>
            );
          })}
        </div>

        {/* Pool chip-uri disponibile */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Drag words into the blanks. Click a placed word to remove it.
            </p>
            {!disabled && slots.some((s) => s !== null) && (
              <button
                onClick={handleClear}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ↺ Clear
              </button>
            )}
          </div>
          <DroppablePool>
            {poolChips.length === 0 ? (
              <span className="text-xs text-muted-foreground italic self-center">
                All words placed
              </span>
            ) : (
              poolChips.map((chip) => (
                <DraggableChip
                  key={chip.id}
                  chip={chip}
                  disabled={disabled}
                />
              ))
            )}
          </DroppablePool>
        </div>
      </div>

      {/* Ghost chip in timp ce se trage */}
      <DragOverlay>
        {activeChip && (
          <div className="rounded-lg border-2 border-primary bg-primary/10 text-primary px-3 py-1.5 font-display text-xl shadow-card-hover rotate-3 cursor-grabbing">
            {activeChip.text}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};