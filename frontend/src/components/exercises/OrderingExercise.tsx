import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
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

interface WordItem {
  id: string;   
  word: string; 
}

interface SortableWordProps {
  item: WordItem;
  disabled: boolean;
}

const SortableWord = ({ item, disabled }: SortableWordProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
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
        ${disabled
          ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
          : 'border-border bg-card text-foreground cursor-grab hover:border-primary/40 hover:bg-accent active:cursor-grabbing'
        }
      `}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
      {item.word}
    </div>
  );
};

const DragGhost = ({ word }: { word: string }) => (
  <div className="flex items-center gap-1.5 rounded-lg border-2 border-primary bg-primary/10 text-primary px-3 py-2 font-display text-xl shadow-card-hover rotate-2 cursor-grabbing select-none">
    <GripVertical className="h-3 w-3 shrink-0" />
    {word}
  </div>
);

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
  
  const [items, setItems] = useState<WordItem[]>(() =>
    [...data.words]
      .sort(() => Math.random() - 0.5)
      .map((word, i) => ({ id: `word-${i}`, word }))
  );

  const [activeItem, setActiveItem] = useState<WordItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const found = items.find((item) => item.id === event.active.id);
    setActiveItem(found ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      onAnswer({ order: reordered.map((item) => item.word) });
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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-2 min-h-[60px] rounded-lg border-2 border-dashed border-border bg-muted/30 p-3">
            {items.map((item) => (
              <SortableWord
                key={item.id}
                item={item}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeItem ? <DragGhost word={activeItem.word} /> : null}
        </DragOverlay>
      </DndContext>

      {data.translation && (
        <p className="text-xs text-muted-foreground italic">
          Hint: &quot;{data.translation}&quot;
        </p>
      )}
    </div>
  );
};