import React, { useEffect, useState, useCallback, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { UserBadge } from "haze.bio/types";
import { GripHorizontal, Eye, EyeOff, Settings, Info, ChevronUp, ChevronDown, BadgeCheck } from 'lucide-react';
import Image from "next/image";
import { badgeAPI } from "haze.bio/api";
import toast from "react-hot-toast";
import { BugHunterBadge, BoosterBadge, EarlyUserBadge, EventWinnerBadge, FeaturedBadge, PremiumBadge, StaffBadge, PartnerBadge, Easter2025Badge } from "../../badges/Badges";
import { isTouchDevice } from "haze.bio/utils/device";

interface BadgeSortProps {
  userBadges: UserBadge[];
  onReorder: (newBadges: UserBadge[]) => void;
  onEdit?: (badge: UserBadge) => void;
}

interface DraggableItemProps {
  badge: UserBadge;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onToggleVisibility: (badgeId: number) => void;
  getBadgeIcon: (badge: UserBadge) => React.ReactNode;
  onDragEnd?: () => void;
  onEdit?: (badge: UserBadge) => void;
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
  badge,
  index,
  moveItem,
  onToggleVisibility,
  getBadgeIcon,
  onDragEnd,
  onEdit,
  moveUp,
  moveDown,
  totalItems
}: DraggableItemProps) => {
  const IconComponent = getBadgeIcon(badge);
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "BADGE",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: () => {
      if (onDragEnd) onDragEnd();
    }
  });

  const [, drop] = useDrop({
    accept: "BADGE",
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

  return (
    <div
      ref={ref}
      className={`group w-full sm:w-[280px] bg-zinc-800/30 rounded-lg border transition-all select-none ${
        isDragging
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
            {IconComponent}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base text-white font-medium truncate">
              {badge.badge.name}
            </h3>
            <p className="text-xs sm:text-sm text-white/60 flex items-center gap-1.5">
              {badge.hidden ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 bg-zinc-600 rounded-full"></span>
                  Hidden
                </>
              ) : (
                <>
                  <span className="inline-block w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  Visible
                </>
              )}
            </p>
          </div>

          <div className="flex items-center">
            {badge.badge.is_custom && onEdit && (
              <button
                onClick={() => onEdit(badge)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                title="Edit custom badge"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onToggleVisibility(badge.badge_id)}
              className={`p-1.5 sm:p-2 transition-colors rounded-lg ${
                badge.hidden
                  ? "text-white/40 hover:text-white hover:bg-white/5"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              title={badge.hidden ? "Show badge" : "Hide badge"}
            >
              {badge.hidden ? (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BadgeSort({ userBadges, onReorder, onEdit }: BadgeSortProps) {
  const [sortedBadges, setSortedBadges] = useState<UserBadge[]>(
    [...userBadges]
  );
  const [emptyState, setEmptyState] = useState(userBadges.length === 0);

  useEffect(() => {
    setSortedBadges([...userBadges]);
    setEmptyState(userBadges.length === 0);
  }, [userBadges]);

  const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
    setSortedBadges((prevBadges) => {
      const updatedBadges = [...prevBadges];
      const [draggedBadge] = updatedBadges.splice(dragIndex, 1);
      updatedBadges.splice(hoverIndex, 0, draggedBadge);
      return updatedBadges;
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    const updatedBadges = [...sortedBadges];

    onReorder(updatedBadges);

    badgeAPI.reorderBadge(
      updatedBadges.map((badge, index) => ({
        badge_id: badge.badge_id,
        order: index
      }))
    ).then(() => {
      toast.success("Badge order updated successfully");
    }).catch(error => {
      toast.error("Failed to update badge order");
    });
  }, [sortedBadges, onReorder]);

  const moveUp = useCallback((index: number) => {
    if (index > 0) {
      const newBadges = [...sortedBadges];
      [newBadges[index - 1], newBadges[index]] = [newBadges[index], newBadges[index - 1]];

      setSortedBadges(newBadges);

      onReorder(newBadges);

      badgeAPI.reorderBadge(
        newBadges.map((badge, idx) => ({
          badge_id: badge.badge_id,
          order: idx
        }))
      ).then(() => {
        toast.success("Badge moved up");
      }).catch(error => {
        toast.error("Failed to update badge order");
      });
    }
  }, [sortedBadges, onReorder]);

  const moveDown = useCallback((index: number) => {
    if (index < sortedBadges.length - 1) {
      const newBadges = [...sortedBadges];
      [newBadges[index], newBadges[index + 1]] = [newBadges[index + 1], newBadges[index]];
      
      setSortedBadges(newBadges);
      
      onReorder(newBadges);

      badgeAPI.reorderBadge(
        newBadges.map((badge, idx) => ({
          badge_id: badge.badge_id,
          order: idx
        }))
      ).then(() => {
        toast.success("Badge moved down");
      }).catch(error => {
        toast.error("Failed to update badge order");
      });
    }
  }, [sortedBadges, onReorder]);

  const toggleBadgeVisibility = async (badgeId: number) => {
    const badge = sortedBadges.find(b => b.badge_id === badgeId);
    if (!badge) return;

    try {
      await badgeAPI.hideBadge(badge.badge_id, !badge.hidden);

      const updatedBadges = sortedBadges.map(b =>
        b.badge_id === badgeId ? { ...b, hidden: !b.hidden } : b
      );

      setSortedBadges(updatedBadges);

      onReorder(updatedBadges);

      toast.success(`Badge ${badge.hidden ? 'shown' : 'hidden'} successfully`);
    } catch (error) {
      console.error('Failed to update badge visibility:', error);
      toast.error("Failed to update badge visibility");
    }
  };

  const getBadgeIcon = (badge: UserBadge) => {
    const size = 24;

    switch (badge.badge.name.toLowerCase()) {
      case 'staff':
        return <StaffBadge size={size} />;
      case 'early user':
        return <EarlyUserBadge size={size} />;
      case 'partner':
        return <PartnerBadge size={size} />;
      case "bug hunter":
        return <BugHunterBadge size={size} />;
      case 'premium':
        return <PremiumBadge size={size} />;
      case 'event winner':
        return <EventWinnerBadge size={size} />;
      case "featured":
        return <FeaturedBadge size={size} />;
      case 'booster':
        return <BoosterBadge size={size} />;
      case 'easter 2025':
        return <Easter2025Badge size={size} />;
      default:
        return badge.badge.media_url ? (
          <Image
            src={badge.badge.media_url}
            alt={badge.badge.name}
            width={size}
            height={size}
            draggable="false"
            className="w-full h-full object-contain rounded-full"
          />
        ) : null;
    }
  };

  return (
    <CustomDndProvider>
      {emptyState ? (
        <div className="bg-zinc-800/30 border border-zinc-800/50 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-purple-800/20 rounded-lg flex items-center justify-center">
              <BadgeCheck className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className="text-white font-medium mb-2">No Badges Yet</h3>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            Earn badges by participating in the community or completing specific actions on the platform.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
          {sortedBadges.map((badge, index) => (
            <DraggableItem
              key={badge.badge_id}
              badge={badge}
              index={index}
              moveItem={moveItem}
              onToggleVisibility={toggleBadgeVisibility}
              getBadgeIcon={getBadgeIcon}
              onDragEnd={handleDragEnd}
              onEdit={onEdit}
              moveUp={moveUp}
              moveDown={moveDown}
              totalItems={sortedBadges.length}
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
            <h4 className="text-sm font-medium text-white mb-1">Arranging Your Badges</h4>
            <p className="flex-1">
              <span className="hidden sm:inline">Drag badges to reorder them.</span>
              <span className="sm:hidden">Use the up/down arrows to reorder badges.</span>
              {" "}The order here will determine how they appear on your profile.
              Use the eye icon to show or hide individual badges.
            </p>
          </div>
        </div>
      )}
    </CustomDndProvider>
  );
};