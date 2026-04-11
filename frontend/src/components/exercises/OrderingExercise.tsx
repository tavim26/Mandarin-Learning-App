import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { OrderingData, OrderingAnswer } from '@/hooks/useContent';

interface SortableWordProps {
  id: string;
  word: string;
  disabled: boolean;
}

const SortableWord = ({ id, word, disabled }: SortableWordProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        flex items-center gap-1.5 rounded-lg border-2 px-3 py-2
        font-display text-xl select-none
        transition-all duration-150
        ${isDragging
          ? 'border-primary bg-primary/10 text-primary shadow-card-hover z-50 scale-105'
          : disabled
          ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
          : 'border-border bg-card text-foreground cursor-grab hover:border-primary/40 hover:bg-accent active:cursor-grabbing'
        }
      `}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
      {word}
    </div>
  );
};

interface Props {
  data: OrderingData;
  onAnswer: (answer: OrderingAnswer) => void;
  disabled?: boolean;
}

export const OrderingExercise = ({
  data,
  onAnswer,
  disabled = false,
}: Props) => {
  // Amesteca cuvintele la mount
  const [items, setItems] = useState<string[]>(() =>
    [...data.words].sort(() => Math.random() - 0.5)
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      onAnswer({ order: reordered });
      return reordered;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drag the words to form the correct sentence.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-2 min-h-[60px] rounded-lg border-2 border-dashed border-border bg-muted/30 p-3">
            {items.map((word) => (
              <SortableWord
                key={word}
                id={word}
                word={word}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {data.translation && (
        <p className="text-xs text-muted-foreground italic">
          Hint: &quot;{data.translation}&quot;
        </p>
      )}
    </div>
  );
};