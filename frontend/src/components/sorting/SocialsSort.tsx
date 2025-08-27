import React, { useState, useCallback, useRef, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { UserSocial } from "haze.bio/types";
import { GripHorizontal, Globe, Pencil, Trash2, Info, ChevronUp, ChevronDown, Copy, LinkIcon } from "lucide-react";
import * as SocialIcons from "../../socials/Socials";
import { socialAPI } from "haze.bio/api";
import toast from "react-hot-toast";
import Image from "next/image";
import { isTouchDevice } from "haze.bio/utils/device";
import Tooltip from "../ui/Tooltip";

interface SocialsSortProps {
  socials: UserSocial[];
  onReorder: (newSocials: UserSocial[]) => void;
  onEdit: (social: UserSocial) => void;
  onDelete: (socialID: number) => void;
}

interface DraggableItemProps {
  social: UserSocial;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onEdit: (social: UserSocial) => void;
  onDelete: (socialID: number) => void;
  getIconComponent: (platform: string) => any;
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
  social,
  index,
  moveItem,
  onEdit,
  onDelete,
  getIconComponent,
  onDragEnd,
  moveUp,
  moveDown,
  totalItems
}: DraggableItemProps) => {
  const platform = social.platform === "ko-fi" ? "Kofi" : social.platform;
  const IconComponent = getIconComponent(platform);
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "SOCIAL",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      if (onDragEnd) onDragEnd();
    }
  });

  const [, drop] = useDrop({
    accept: "SOCIAL",
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
  const isDarkIcon = ['namemc'].includes(social.platform.toLowerCase());

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
            {social.platform.toLowerCase() === 'custom' && social.image_url ? (
              <Image
                src={social.image_url}
                alt="Custom Icon"
                width={24}
                height={24}
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                draggable="false"
              />
            ) : (
              IconComponent ? (
                <IconComponent 
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${isDarkIcon ? 'text-black' : 'text-purple-400'}`} 
                />
              ) : (
                <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              )
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base text-white font-medium truncate capitalize">{social.platform}</h3>
              <Tooltip
                text={social.social_type === 'copy_text'
                  ? "Clicking will copy text to clipboard"
                  : "Clicking will redirect to the page"}
                position="top"
              >
                <span className="flex items-center bg-black/50 rounded-md px-1 py-0 border border-zinc-800">
                  {social.social_type === 'copy_text' ? (
                    <Copy className="w-3 h-3 text-white/70" />
                  ) : (
                    <LinkIcon className="w-3 h-3 text-white/70" />
                  )}
                </span>
              </Tooltip>
            </div>
            <span className="text-xs sm:text-sm text-white/60 truncate block">
              {social.platform.toLowerCase() === 'custom'
                ? (social.social_type === 'copy_text'
                  ? (social.link.length > 20 ? social.link.substring(0, 20) + '...' : social.link)
                  : new URL(social.link).hostname)
                : social.social_type === 'copy_text'
                  ? (social.link.length > 20 ? social.link.substring(0, 20) + '...' : social.link)
                  : social.link.includes('@')
                    ? social.link.split('@').pop()
                    : social.link.split('/').pop()}
            </span>
          </div>

          <div className="flex items-center">
            <button
              onClick={() => onEdit(social)}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Edit link"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(social.id)}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Delete link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SocialsSort({ socials, onReorder, onEdit, onDelete }: SocialsSortProps) {
  const [sortedSocials, setSortedSocials] = useState<UserSocial[]>(socials);
  const [emptyState, setEmptyState] = useState(socials.length === 0);

  useEffect(() => {
    setSortedSocials(socials);
    setEmptyState(socials.length === 0);
  }, [socials]);

  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setSortedSocials((prevSocials) => {
      const updatedSocials = [...prevSocials];
      const [draggedSocial] = updatedSocials.splice(dragIndex, 1);
      updatedSocials.splice(hoverIndex, 0, draggedSocial);
      return updatedSocials;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    onReorder(sortedSocials);
    socialAPI.reorderSocials(
      sortedSocials.map((social, index) => ({
        id: social.id,
        order: index
      }))
    ).then(() => {
      toast.success("Social links order updated successfully");
    }).catch(error => {
      toast.error("Failed to update social links order");
    });
  }, [sortedSocials, onReorder]);

  const moveUp = useCallback((index: number) => {
    if (index > 0) {
      const newSocials = [...sortedSocials];
      [newSocials[index - 1], newSocials[index]] = [newSocials[index], newSocials[index - 1]];
      setSortedSocials(newSocials);
      onReorder(newSocials);

      // Save to API
      socialAPI.reorderSocials(
        newSocials.map((social, idx) => ({
          id: social.id,
          order: idx
        }))
      ).then(() => {
        toast.success("Social link moved up");
      }).catch(error => {
        toast.error("Failed to update social links order");
      });
    }
  }, [sortedSocials, onReorder]);

  const moveDown = useCallback((index: number) => {
    if (index < sortedSocials.length - 1) {
      const newSocials = [...sortedSocials];
      [newSocials[index], newSocials[index + 1]] = [newSocials[index + 1], newSocials[index]];
      setSortedSocials(newSocials);
      onReorder(newSocials);

      // Save to API
      socialAPI.reorderSocials(
        newSocials.map((social, idx) => ({
          id: social.id,
          order: idx
        }))
      ).then(() => {
        toast.success("Social link moved down");
      }).catch(error => {
        toast.error("Failed to update social links order");
      });
    }
  }, [sortedSocials, onReorder]);

  const getIconComponent = useCallback((platform: string) => {
    const iconName = `${platform.charAt(0).toUpperCase()}${platform.slice(1)}Icon`;
    return SocialIcons[iconName as keyof typeof SocialIcons];
  }, []);

  return (
    <CustomDndProvider>
      {emptyState ? (
        <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className="text-white font-medium mb-2">No Social Links Yet</h3>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            Add your social media accounts to make it easier for visitors to find and follow you elsewhere.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
          {sortedSocials.map((social, index) => (
            <DraggableItem
              key={social.id}
              social={social}
              index={index}
              moveItem={moveItem}
              getIconComponent={getIconComponent}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragEnd={handleDragEnd}
              moveUp={moveUp}
              moveDown={moveDown}
              totalItems={sortedSocials.length}
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
            <h4 className="text-sm font-medium text-white mb-1">Arranging Your Links</h4>
            <p className="flex-1">
              <span className="hidden sm:inline">Drag links to reorder them.</span>
              <span className="sm:hidden">Use the up/down arrows to reorder links.</span>
              {" "}The order here will determine how they appear on your profile.
              You can edit or delete individual links using the buttons on each card.
            </p>
          </div>
        </div>
      )}
    </CustomDndProvider>
  );
}