import React, { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { UserWidget } from "haze.bio/types";
import { GripHorizontal, MoreHorizontal, Trash2, Info, ChevronUp, ChevronDown, Settings } from "lucide-react";
import { availableWidgets } from "haze.bio/widgets";
import toast from "react-hot-toast";
import { widgetAPI } from "haze.bio/api";
import { DiscordIcon, GithubIcon, SpotifyIcon } from "haze.bio/socials/Socials";
import { isTouchDevice } from "haze.bio/utils/device";

interface WidgetSortProps {
  widgets: UserWidget[];
  onReorder: (newWidgets: UserWidget[]) => void;
  onEdit: (widget: UserWidget) => void;
  onDelete: (widgetId: number) => void;
}

interface DraggableItemProps {
  widget: UserWidget;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (widget: UserWidget) => void;
  onDelete: (widgetId: number) => void;
  onDragEnd?: () => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  totalItems: number;
}

function CustomDndProvider({ children }: { children: React.ReactNode }) {
  const isTouch = isTouchDevice();

  if (isTouch) {
    return (
      <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
        {children}
      </DndProvider>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  );
}

const DraggableItem = ({
  widget,
  index,
  moveItem,
  onEdit,
  onDelete,
  onDragEnd,
  moveUp,
  moveDown,
  totalItems
}: DraggableItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "WIDGET",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      if (onDragEnd) onDragEnd();
    }
  });

  const [, drop] = useDrop({
    accept: "WIDGET",
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverActualX = clientOffset.x - hoverBoundingRect.left;

      if (dragIndex < hoverIndex && hoverActualX > hoverMiddleX) {
        moveItem(dragIndex, hoverIndex);
        item.index = hoverIndex;
      } else if (dragIndex > hoverIndex && hoverActualX < hoverMiddleX) {
        moveItem(dragIndex, hoverIndex);
        item.index = hoverIndex;
      }
    },
  });

  drag(drop(ref));

  const isFirst = index === 0;
  const isLast = index === totalItems - 1;

  let widgetName = "";
  let widgetDescription = "";
  let widgetType = "";

  try {
    const widgetData = JSON.parse(widget.widget_data);
    widgetName = widgetData.name || "Unknown Widget";
    widgetDescription = widgetData.description || "No description provided.";
    widgetType = widgetData.type || "";
  } catch (error) {
    console.error("Error parsing widget JSON:", error);
    widgetName = "Invalid Widget";
    widgetDescription = "Invalid widget data.";
  }

  const hasSettings = (widgetType: string) => {
    const widgetDefinition = availableWidgets.find((widget: { type: string; }) => widget.type === widgetType);
    return widgetDefinition && widgetDefinition.settings;
  };

  const getWidgetIcon = (widgetType: string) => {
    if (widgetType.includes('discord')) return <DiscordIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />;
    if (widgetType.includes('github')) return <GithubIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />;
    if (widgetType.includes('spotify')) return <SpotifyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />;
    return <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />;
  };

  return (
    <div
      ref={ref}
      className={`group w-full sm:w-[280px] bg-zinc-800/30 rounded-lg border transition-all select-none ${isDragging
        ? "opacity-50 scale-105 border-purple-500/30 shadow-lg shadow-purple-500/5"
        : "hover:border-purple-500/20 hover:bg-zinc-800/40 border-zinc-800/50"
        }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3">
        <div className="cursor-grab active:cursor-grabbing text-white/40 hover:text-white/80 transition-colors hidden sm:block">
          <GripHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        {/* Mobile up/down buttons - only shown on small screens */}
        <div className="flex flex-col sm:hidden">
          <button
            onClick={() => moveUp(index)}
            disabled={isFirst}
            className={`p-1 rounded-t-md ${isFirst ? 'text-white/20' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => moveDown(index)}
            disabled={isLast}
            className={`p-1 rounded-b-md ${isLast ? 'text-white/20' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-black/40 rounded-lg text-white border border-zinc-800/80 group-hover:border-purple-500/30 transition-colors">
            {getWidgetIcon(widgetType)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base text-white font-medium truncate">{widgetName}</h3>
            <p className="text-xs sm:text-sm text-white/60 truncate">{widgetDescription}</p>
          </div>

          <div className="flex items-center">
            {hasSettings(widgetType) && (
              <button
                onClick={() => onEdit(widget)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Edit widget settings"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(widget.id)}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Delete widget"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function WidgetSort({ widgets, onEdit, onReorder, onDelete }: WidgetSortProps) {
  const [sortedWidgets, setSortedWidgets] = useState<UserWidget[]>(widgets);
  const [emptyState, setEmptyState] = useState(widgets.length === 0);

  useEffect(() => {
    setSortedWidgets(widgets);
    setEmptyState(widgets.length === 0);
  }, [widgets]);

  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setSortedWidgets((prevWidgets) => {
      const updatedWidgets = [...prevWidgets];
      const [draggedWidget] = updatedWidgets.splice(dragIndex, 1);
      updatedWidgets.splice(hoverIndex, 0, draggedWidget);
      return updatedWidgets;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    onReorder(sortedWidgets);
    widgetAPI.reorderWidget(
      sortedWidgets.map((widget, index) => ({
        widget_data: widget.widget_data,
        order: index
      }))
    ).then(() => {
      toast.success("Widgets order updated successfully");
    }).catch(error => {
      toast.error("Failed to update widgets order");
    });
  }, [sortedWidgets, onReorder]);

  const moveUp = useCallback((index: number) => {
    if (index > 0) {
      const newWidgets = [...sortedWidgets];
      [newWidgets[index - 1], newWidgets[index]] = [newWidgets[index], newWidgets[index - 1]];
      setSortedWidgets(newWidgets);
      onReorder(newWidgets);

      // Save to API
      widgetAPI.reorderWidget(
        newWidgets.map((widget, idx) => ({
          widget_data: widget.widget_data,
          order: idx
        }))
      ).then(() => {
        toast.success("Widget moved up");
      }).catch(error => {
        toast.error("Failed to update widgets order");
      });
    }
  }, [sortedWidgets, onReorder]);

  const moveDown = useCallback((index: number) => {
    if (index < sortedWidgets.length - 1) {
      const newWidgets = [...sortedWidgets];
      [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]];
      setSortedWidgets(newWidgets);
      onReorder(newWidgets);

      // Save to API
      widgetAPI.reorderWidget(
        newWidgets.map((widget, idx) => ({
          widget_data: widget.widget_data,
          order: idx
        }))
      ).then(() => {
        toast.success("Widget moved down");
      }).catch(error => {
        toast.error("Failed to update widgets order");
      });
    }
  }, [sortedWidgets, onReorder]);

  const handleDeleteWidget = useCallback((widgetId: number) => {
    onDelete(widgetId);
  }, [onDelete]);

  return (
    <CustomDndProvider>
      {emptyState ? (
        <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className="text-white font-medium mb-2">No Widgets Added Yet</h3>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            Add interactive widgets to enhance your profile and engage with visitors.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
          {sortedWidgets.map((widget, index) => (
            <DraggableItem
              key={widget.widget_data}
              widget={widget}
              index={index}
              moveItem={moveItem}
              onEdit={onEdit}
              onDelete={handleDeleteWidget}
              onDragEnd={handleDragEnd}
              moveUp={moveUp}
              moveDown={moveDown}
              totalItems={sortedWidgets.length}
            />
          ))}
        </div>
      )}
      {!emptyState && (
        <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-4 mt-5 text-xs text-white/60 flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-white mb-1">Arranging Your Widgets</h4>
            <p className="flex-1">
              <span className="hidden sm:inline">Drag widgets to reorder them.</span>
              <span className="sm:hidden">Use the up/down arrows to reorder widgets.</span>
              {" "}The order here will determine how they appear on your profile.
              You can configure or delete individual widgets using the buttons on each card.
            </p>
          </div>
        </div>
      )}
    </CustomDndProvider>
  );
}