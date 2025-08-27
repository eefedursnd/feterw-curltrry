'use client';

import React, { useState } from 'react';
import { Loader2, Wand2, X, Settings, Award, BadgeCheck, Palette, Info, Share2, Plus, Eye, ArrowRight } from 'lucide-react';
import { UserWidget, User } from 'haze.bio/types';
import toast from 'react-hot-toast';
import WidgetSort from 'haze.bio/components/sorting/WidgetSort';
import { profileAPI, widgetAPI } from 'haze.bio/api';
import DashboardLayout from '../dashboard/Layout';
import { availableWidgets, WidgetSettingField } from 'haze.bio/widgets';
import { DiscordIcon, GithubIcon } from 'haze.bio/socials/Socials';
import { useUser } from 'haze.bio/context/UserContext';
import Link from 'next/link';

interface WidgetContentProps {
}

interface WidgetSettingsProps {
  widgetType: string;
  settings: any;
  onChange: (newSettings: any) => void;
}

const WidgetSettings: React.FC<WidgetSettingsProps> = ({ widgetType, settings, onChange }) => {
  const widgetDefinition = availableWidgets.find((widget) => widget.type === widgetType);

  if (!widgetDefinition || !widgetDefinition.settings) {
    return <p className="text-white/60">No settings available for this widget.</p>;
  }

  const handleSettingChange = (key: string, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const renderSettingField = (field: WidgetSettingField) => {
    const currentValue = settings[field.key] !== undefined ? settings[field.key] : field.defaultValue;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleSettingChange(field.key, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label}`}
            className="w-full px-3 py-2.5 bg-black/40 border border-zinc-800/60 rounded-lg 
                    text-white text-sm placeholder-white/30 focus:outline-none
                    focus:border-purple-500/30 transition-colors"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleSettingChange(field.key, Number(e.target.value))}
            placeholder={field.placeholder || `Enter ${field.label}`}
            className="w-full px-3 py-2.5 bg-black/40 border border-zinc-800/60 rounded-lg 
                    text-white text-sm placeholder-white/30 focus:outline-none
                    focus:border-purple-500/30 transition-colors"
          />
        );

      case 'dropdown':
        return (
          <div className="relative">
            <select
              value={currentValue}
              onChange={(e) => handleSettingChange(field.key, e.target.value)}
              className="w-full px-3 py-2.5 bg-black/40 border border-zinc-800/60 rounded-lg 
                      text-white text-sm focus:outline-none appearance-none
                      focus:border-purple-500/30 transition-colors"
            >
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none text-white/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentValue}
                onChange={(e) => handleSettingChange(field.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer 
                       peer-checked:after:translate-x-full peer-checked:after:border-white 
                       after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                       after:bg-white after:border-white after:border after:rounded-full 
                       after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        );

      case 'color':
        return (
          <input
            type="color"
            value={currentValue}
            onChange={(e) => handleSettingChange(field.key, e.target.value)}
            className="h-10 w-full rounded-lg bg-black/40 border border-zinc-800/60 cursor-pointer"
          />
        );

      default:
        return <p className="text-red-400">Unknown field type: {field.type}</p>;
    }
  };

  return (
    <div className="space-y-4">
      {Array.isArray(widgetDefinition.settings) ? (
        widgetDefinition.settings.map((field) => {
          const typedField = field as WidgetSettingField;

          return (
            <div key={typedField.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-white">
                  {typedField.label}
                </label>
                {typedField.type === 'checkbox' && renderSettingField(typedField)}
              </div>
              {typedField.type !== 'checkbox' && renderSettingField(typedField)}
              {typedField.helpText && (
                <p className="text-xs text-white/50 mt-1">{typedField.helpText}</p>
              )}
            </div>
          );
        })
      ) : (
        <p className="text-red-400">Invalid settings format</p>
      )}
    </div>
  );
};

const WIDGET_LIMITS = {
  discord_presence: 1,
  discord_server: 3,
  github_profile: 2,
  spotify: 1,
  default: 1
} as const;

export default function WidgetContent({ }: WidgetContentProps) {
  const { user: contextUser, updateUser } = useUser();

  const [widgets, setWidgets] = useState<UserWidget[]>(contextUser?.widgets || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState<string | null>(null);
  const [editingWidget, setEditingWidget] = useState<UserWidget | null>(null);
  const [widgetSettings, setWidgetSettings] = useState<any>({});
  const [showWidgetsOutside, setShowWidgetsOutside] = useState(contextUser?.profile?.show_widgets_outside || false);
  const [activeTab, setActiveTab] = useState<'manage' | 'available'>('manage');

  const handleOpenModal = (widgetType: string) => {
    const widgetDefinition = availableWidgets.find((widget) => widget.type === widgetType);

    if (widgetDefinition?.name === "Spotify (soon)") {
      toast.error('This widget is not available yet.');
      return;
    }

    if (widgetDefinition?.name === "Custom Badge" && !contextUser?.has_premium) {
      toast.error('This widget is only available for premium users.');
      return;
    }

    const typeCount = widgets.filter(w => {
      try {
        const data = JSON.parse(w.widget_data);
        return data.type === widgetType;
      } catch {
        return false;
      }
    }).length;

    const limit = WIDGET_LIMITS[widgetType as keyof typeof WIDGET_LIMITS] || WIDGET_LIMITS.default;

    if (typeCount >= limit) {
      toast.error(`You can only add up to ${limit} ${widgetDefinition?.name} widgets`);
      return;
    }

    setSelectedWidgetType(widgetType);
    setIsModalOpen(true);

    const initialSettings: Record<string, any> = {};
    if (widgetDefinition && Array.isArray(widgetDefinition.settings)) {
      widgetDefinition.settings.forEach((setting: WidgetSettingField) => {
        initialSettings[setting.key] = setting.defaultValue;
      });
    }

    setWidgetSettings(initialSettings);
  };

  const handleCloseModal = () => {
    setSelectedWidgetType(null);
    setIsModalOpen(false);
    setEditingWidget(null);
    setWidgetSettings({});
  };

  const handleAddWidget = async () => {
    if (!selectedWidgetType) return;

    const widgetDefinition = availableWidgets.find((widget) => widget.type === selectedWidgetType);
    if (!widgetDefinition) return;

    const newWidgetData = {
      widget_data: JSON.stringify({
        name: widgetDefinition.name,
        description: widgetDefinition.description,
        type: widgetDefinition.type,
        settings: widgetSettings,
      }),
      sort: widgets.length,
      hidden: false,
      id: 0,
    };

    try {
      setIsLoading(true);
      const response = await widgetAPI.createWidget(newWidgetData);
      const newWidgetDataParsed = JSON.parse(JSON.stringify(newWidgetData));
      const newWidget: UserWidget = {
        id: response,
        uid: contextUser?.uid || 0,
        widget_data: newWidgetDataParsed.widget_data,
        sort: widgets.length,
        hidden: false,
      };

      const updatedWidgets = [...widgets, newWidget];
      setWidgets(updatedWidgets);

      if (contextUser) {
        updateUser({
          widgets: updatedWidgets
        });
      }

      toast.success('Widget added successfully');
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to add widget');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (newWidgets: UserWidget[]) => {
    setWidgets(newWidgets);

    if (contextUser) {
      updateUser({
        widgets: newWidgets
      });
    }
  };

  const handleOpenSettings = (widget: UserWidget) => {
    setEditingWidget(widget);
    try {
      const widgetData = JSON.parse(widget.widget_data);
      const widgetType = widgetData.type;
      const widgetDefinition = availableWidgets.find(w => w.type === widgetType);

      const initialSettings: Record<string, any> = {};
      if (widgetDefinition && Array.isArray(widgetDefinition.settings)) {
        widgetDefinition.settings.forEach((setting: WidgetSettingField) => {
          initialSettings[setting.key] = setting.defaultValue;
        });
      }

      const currentSettings = widgetData.settings || {};
      const mergedSettings = { ...initialSettings, ...currentSettings };

      setWidgetSettings(mergedSettings);
      setSelectedWidgetType(widgetType);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error parsing widget JSON:", error);
      setWidgetSettings({});
    }
  };

  const handleSaveSettings = async () => {
    if (!editingWidget) return;

    try {
      setIsLoading(true);
      const widgetData = JSON.parse(editingWidget.widget_data);
      widgetData.settings = widgetSettings;
      const updatedWidgetData = JSON.stringify(widgetData);

      await widgetAPI.updateWidget(editingWidget.id, { widget_data: updatedWidgetData });

      const updatedWidgets = widgets.map(widget =>
        widget.id === editingWidget.id
          ? { ...widget, widget_data: updatedWidgetData }
          : widget
      );

      setWidgets(updatedWidgets);

      if (contextUser) {
        updateUser({
          widgets: updatedWidgets
        });
      }

      toast.success("Widget settings saved successfully");
    } catch (error) {
      toast.error("Failed to save widget settings");
      console.error("Error saving widget settings:", error);
    } finally {
      handleCloseModal();
      setIsLoading(false);
    }
  };

  const handleWidgetSettingsChange = (newSettings: any) => {
    setWidgetSettings(newSettings);
  };

  const handleDeleteWidget = async (widgetId: number) => {
    try {
      setIsLoading(true);
      await widgetAPI.deleteWidget(widgetId);
      const updatedWidgets = widgets.filter(widget => widget.id !== widgetId);
      setWidgets(updatedWidgets);

      if (contextUser) {
        updateUser({
          widgets: updatedWidgets
        });
      }

      toast.success('Widget deleted successfully');
    } catch (error) {
      toast.error('Failed to delete widget');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    await handleProfileSettingsSave();
  };

  const handleProfileSettingsSave = async () => {
    try {
      setIsLoading(true);
      await profileAPI.updateProfile({
        show_widgets_outside: showWidgetsOutside,
      });

      // Update user context
      if (contextUser && contextUser.profile) {
        updateUser({
          profile: {
            ...contextUser.profile,
            show_widgets_outside: showWidgetsOutside
          }
        });
      }

      setShowWidgetsOutside(showWidgetsOutside);
      toast.success('Widgets settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save widgets settings');
      console.error('Failed to update widgets settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWidgetIcon = (widgetType: string) => {
    if (widgetType.includes('discord')) return <DiscordIcon className="w-5 h-5" color='white' />;
    if (widgetType.includes('github')) return <GithubIcon className="w-5 h-5" color='white' />;
    return <Settings className="w-5 h-5" color='white' />;
  };

  const isPremium = contextUser?.has_premium || false;

  const WidgetButton = ({ widget, widgets, isPremium, handleOpenModal }: {
    widget: any;
    widgets: UserWidget[];
    isPremium: boolean;
    handleOpenModal: (widgetType: string) => void;
  }) => {
    const widgetsOfType = widgets.filter((w) => {
      try {
        const widgetData = JSON.parse(w.widget_data);
        return widgetData.type === widget.type;
      } catch (error) {
        return false;
      }
    });

    const count = widgetsOfType.length;
    const limit = WIDGET_LIMITS[widget.type as keyof typeof WIDGET_LIMITS] || WIDGET_LIMITS.default;
    const isPremiumWidget = widget.name === "Custom Badge";
    const isDisabled = widget.name.includes('(soon)') || (isPremiumWidget && !isPremium);
    const widgetIcon = getWidgetIcon(widget.type);

    return (
      <button
        key={widget.type}
        onClick={() => !isDisabled && handleOpenModal(widget.type)}
        disabled={isDisabled || count >= limit}
        className={`p-3 rounded-lg border transition-all flex items-center gap-3
          ${count >= limit
            ? 'bg-zinc-800/40 border-zinc-700/50 cursor-not-allowed'
            : isDisabled
              ? 'bg-zinc-800/30 border-zinc-800/50 opacity-50 cursor-not-allowed'
              : 'bg-zinc-800/30 border-zinc-800/50 hover:bg-zinc-800/40 hover:border-purple-500/20 cursor-pointer'
          }`}
      >
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${count >= limit
          ? 'bg-zinc-700/50'
          : isDisabled
            ? 'bg-zinc-800/70'
            : 'bg-purple-800/20'
          }`}>
          {React.cloneElement(widgetIcon as React.ReactElement<any, any>, {
            className: count >= limit
              ? 'text-white/60'
              : isDisabled
                ? 'text-white/50'
                : 'text-purple-400'
          } as any)}
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium truncate ${count >= limit ? 'text-white/60' : 'text-white'}`}>
              {widget.name}
            </span>
            {isPremiumWidget && !isPremium && (
              <span className="text-[10px] font-medium bg-purple-800/20 text-purple-400 px-1.5 py-0.5 rounded-full">
                Premium
              </span>
            )}
          </div>
          <span className="text-xs text-white/60">
            {count > 0 && `${count}/${limit} used`}
          </span>
        </div>
      </button>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-[100rem] mx-auto space-y-8 relative">
        {/* Hero Section with Header */}
        <div className="bg-black rounded-xl p-8 border border-zinc-800/50 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"></div>

          <div className="relative z-10 max-w-3xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Widgets</h1>
                  <div className="px-3 py-1 bg-purple-900/20 rounded-full border border-purple-800/30 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-sm font-medium text-white/80">
                      {widgets.length} Widgets
                    </span>
                  </div>
                </div>
                <p className="text-white/70 text-sm md:text-base mt-1">
                  Customize your profile with interactive widgets
                </p>
              </div>
              <button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500
                transition-colors font-medium disabled:opacity-50
                disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Save Changes
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-t border-zinc-800/50 pt-4">
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === 'manage'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <Settings className="w-4 h-4" /> Manage Widgets
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeTab === 'available'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'}`}
              >
                <Plus className="w-4 h-4" /> Add Widget
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Your Widgets */}
              <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-purple-400" />
                    Your Widgets
                  </h2>
                  <span className="text-xs text-white/60">
                    {widgets.length} {widgets.length === 1 ? 'Widget' : 'Widgets'}
                  </span>
                </div>
                <div className="p-5">
                  <WidgetSort
                    widgets={widgets}
                    onReorder={handleReorder}
                    onEdit={handleOpenSettings}
                    onDelete={handleDeleteWidget}
                  />
                </div>
              </div>

              {/* Widget Information */}
              <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-purple-400" />
                    Widget Tips
                  </h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                      <div className="flex items-start gap-3 mb-1">
                        <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DiscordIcon className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">Discord Widgets</h3>
                          <p className="text-xs text-white/60 mt-1">
                            Show your Discord presence, allowing visitors to see your online status and what games you're playing.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                      <div className="flex items-start gap-3 mb-1">
                        <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GithubIcon className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">GitHub Widgets</h3>
                          <p className="text-xs text-white/60 mt-1">
                            Display your GitHub stats and recent activity directly on your profile. Available with premium.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Settings */}
            <div className="space-y-6">
              {/* Widget Position */}
              <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-400" />
                    Widget Settings
                  </h2>
                </div>
                <div className="p-5 space-y-5">
                  {/* Widget Position Setting */}
                  <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg
                       border border-zinc-800/50 hover:border-purple-800/30 hover:bg-zinc-800/40 transition-all duration-300"
                  >
                    <div>
                      <span className="block text-sm font-medium text-white">
                        Position
                      </span>
                      <span className="text-xs text-white/60">
                        Show widgets outside profile card
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={showWidgetsOutside}
                        onChange={(e) => setShowWidgetsOutside(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer
                         peer-checked:after:translate-x-full peer-checked:after:border-white
                         after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                         after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                         peer-checked:bg-purple-600"
                      />
                    </label>
                  </div>
                  <div className="text-xs text-white/60 px-4">
                    {showWidgetsOutside
                      ? "Widgets will appear below your profile card"
                      : "Widgets will appear inside your profile card"}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800/50">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-400" />
                    Quick Actions
                  </h2>
                </div>
                <div className="divide-y divide-zinc-800/50">
                  <button
                    onClick={() => setActiveTab('available')}
                    className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Plus className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-white">Add New Widget</span>
                      <span className="text-xs text-white/60">Customize your profile with widgets</span>
                    </div>
                  </button>

                  <Link
                    href={`/${contextUser?.username}`}
                    target="_blank"
                    className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-white">View Profile</span>
                      <span className="text-xs text-white/60">See how your widgets look to visitors</span>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Widget Tips */}
              <div className="bg-black rounded-lg border border-zinc-800/50 relative overflow-hidden p-5">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.15),transparent_70%)]"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-base font-semibold text-white">Widget Tips</h3>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-white/60">
                      <span className="block font-medium text-white/80 mb-0.5">Discord Presence</span>
                      Show your live Discord status and activities. Visitors can see what games you're playing or music you're listening to.
                    </p>
                    <p className="text-sm text-white/60">
                      <span className="block font-medium text-white/80 mb-0.5">Discord Server</span>
                      Add your Discord server widget to let visitors join directly from your profile. Great for communities and content creators.
                    </p>
                    <p className="text-sm text-white/60">
                      <span className="block font-medium text-white/80 mb-0.5">Widget Order</span>
                      Drag widgets to rearrange their order on your profile.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'available' && (
          <div className="space-y-6">
            {/* Available Widgets */}
            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800/50">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  Available Widgets
                </h2>
              </div>
              <div className="p-5 space-y-6">
                {/* Discord Widgets */}
                <div>
                  <h3 className="text-sm font-medium text-white/80 mb-3 pl-1">Discord</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {availableWidgets
                      .filter(widget => widget.type.includes('discord'))
                      .map((widget) => (
                        <WidgetButton
                          key={widget.type}
                          widget={widget}
                          widgets={widgets}
                          isPremium={isPremium}
                          handleOpenModal={handleOpenModal}
                        />
                      ))}
                  </div>
                </div>

                {/* GitHub Widgets */}
                <div>
                  <h3 className="text-sm font-medium text-white/80 mb-3 pl-1">GitHub</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {availableWidgets
                      .filter(widget => widget.type.includes('github'))
                      .map((widget) => (
                        <WidgetButton
                          key={widget.type}
                          widget={widget}
                          widgets={widgets}
                          isPremium={isPremium}
                          handleOpenModal={handleOpenModal}
                        />
                      ))}
                  </div>
                </div>

                {/* Other Widgets */}
                <div>
                  <h3 className="text-sm font-medium text-white/80 mb-3 pl-1">Other</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                    {availableWidgets
                      .filter(widget => !widget.type.includes('discord') && !widget.type.includes('github'))
                      .map((widget) => (
                        <WidgetButton
                          key={widget.type}
                          widget={widget}
                          widgets={widgets}
                          isPremium={isPremium}
                          handleOpenModal={handleOpenModal}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Help Section */}
            <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden p-6 relative">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.15),transparent_70%)]"></div>

              <div className="relative flex flex-col md:flex-row gap-6 items-center">
                <div className="w-16 h-16 bg-purple-800/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Settings className="w-8 h-8 text-purple-400" />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-white mb-2">Need more widgets?</h3>
                  <p className="text-white/70 mb-0 md:mb-0 max-w-2xl">
                    We're constantly adding new widget types to help you customize your profile. If you have suggestions for new widgets or integrations, let us know!
                  </p>
                </div>

                <a
                  href="https://discord.gg/cutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-2 flex-shrink-0"
                >
                  Suggest Widget
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Adding/Editing Widget */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={handleCloseModal}
            />

            {/* Modal content */}
            <div className="relative bg-black rounded-xl border border-zinc-800/50 w-full max-w-md max-h-[85vh] overflow-y-auto m-4 z-10">
              {/* Header */}
              <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-800/20 rounded-lg flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{editingWidget ? 'Edit Widget Settings' : 'Add Widget'}</h3>
                    <p className="text-xs text-white/50">Enhance your profile with interactive elements</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {editingWidget ? (
                  <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                    <h4 className="text-sm font-medium text-white mb-4">Widget Settings</h4>
                    <WidgetSettings
                      widgetType={selectedWidgetType || ''}
                      settings={widgetSettings}
                      onChange={handleWidgetSettingsChange}
                    />
                  </div>
                ) : (
                  <div className="bg-zinc-800/30 rounded-lg border border-zinc-800/50 p-4">
                    <div className="flex items-center gap-3 mb-4">
                      {selectedWidgetType && (
                        <div className="w-10 h-10 bg-purple-800/20 rounded-lg flex items-center justify-center">
                          {getWidgetIcon(selectedWidgetType) &&
                            React.cloneElement(getWidgetIcon(selectedWidgetType) as React.ReactElement<any, any>, {
                              className: "text-purple-400"
                            } as any)
                          }
                        </div>
                      )}
                      <div>
                        <h4 className="text-white font-medium">
                          {availableWidgets.find(w => w.type === selectedWidgetType)?.name}
                        </h4>
                        <p className="text-xs text-white/60">
                          {availableWidgets.find(w => w.type === selectedWidgetType)?.description}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-white/70">
                      Are you sure you want to add this widget to your profile?
                    </p>
                  </div>
                )}

                {/* Info box */}
                <div className="bg-zinc-800/20 rounded-lg border border-zinc-800/50 p-3 flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/60">
                    Widgets will appear on your profile in the order you arrange them. You can edit their settings anytime.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-zinc-800/50 flex justify-between bg-zinc-900/30">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-zinc-800/70 hover:bg-zinc-700/70 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={editingWidget ? handleSaveSettings : handleAddWidget}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:hover:bg-purple-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingWidget ? 'Saving...' : 'Adding...'}
                    </>
                  ) : (
                    editingWidget ? 'Save Changes' : 'Add Widget'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}