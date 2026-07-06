'use client'

import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import { 
  LayoutDashboard, 
  Palette, 
  Home, 
  Bot, 
  CreditCard, 
  Database, 
  Shield, 
  Settings, 
  Menu, 
  X,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FEATURE_ORDER,
  PLAN_ORDER,
  type FeatureControl,
  type FeatureKey,
  type PlanKey,
  type PricingPlanConfig,
  type SiteConfig,
} from '@/app/lib/site-config-defaults'
import { useSiteConfig } from '../_component/SiteConfigProvider'
import FeatureUnavailable from '../_component/FeatureUnavailable'
import { ApiService } from '@/app/lib/api-client'

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
    </div>
  </div>
)

// Section Header Component
const SectionHeader = ({ 
  title, 
  description, 
  icon: Icon 
}: { 
  title: string, 
  description: string, 
  icon: LucideIcon 
}) => (
  <div className="flex items-start gap-3 mb-6">
    <div className="p-2 bg-primary/10 rounded-lg">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  </div>
)

// Feature Toggle Component
const FeatureToggle = ({ 
  featureKey, 
  feature, 
  onToggle,
  onCopyChange,
}: { 
  featureKey: FeatureKey, 
  feature: FeatureControl,
  onToggle: (key: FeatureKey, value: boolean) => void,
  onCopyChange: (
    key: FeatureKey,
    field: 'unavailableTitle' | 'unavailableMessage',
    value: string,
  ) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-900">{feature.label}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              feature.enabled 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {feature.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Feature: {featureKey}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </button>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={feature.enabled}
              onChange={(e) => onToggle(featureKey, e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t space-y-2">
          <div>
            <label className="text-xs font-medium text-slate-600">Unavailable Title</label>
            <input
              type="text"
              value={feature.unavailableTitle}
              onChange={(event) =>
                onCopyChange(featureKey, 'unavailableTitle', event.target.value)
              }
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Unavailable Message</label>
            <textarea
              value={feature.unavailableMessage}
              onChange={(event) =>
                onCopyChange(featureKey, 'unavailableMessage', event.target.value)
              }
              rows={2}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Preview</label>
            <div className="mt-1">
              <FeatureUnavailable
                compact
                title={feature.unavailableTitle}
                message={feature.unavailableMessage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Theme Color Picker Component
const ColorPicker = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string, 
  value: string, 
  onChange: (value: string) => void 
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded border border-slate-200 cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm"
      />
    </div>
  </div>
)

// Fetch config function
const fetchConfig = () => ApiService.getAdminSiteConfig()

// Save config function
const saveConfig = (config: SiteConfig) => ApiService.updateSiteConfig(config)

type AdminTabId =
  | 'overview'
  | 'features'
  | 'theme'
  | 'home'
  | 'ai'
  | 'pricing'
  | 'data'
  | 'status'

type SaveStatus = {
  type: 'success' | 'error' | null
  message: string
}

// Main Admin Page Component
const AdminPage = () => {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview')
  const [localConfig, setLocalConfig] = useState<SiteConfig | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    type: null,
    message: ''
  })
  
  // Use React Query for fetching config
  const { 
    data: config, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['siteConfig', 'admin'],
    queryFn: fetchConfig,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveConfig,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['siteConfig', 'admin'] })
      // Also refresh the provider
      queryClient.invalidateQueries({ queryKey: ['siteConfig'] })
    },
  })

  // Update local config when fetched config changes
  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
  }, [config])

  // Use the provider config as fallback
  const { refresh } = useSiteConfig()

  const updateConfig = (updater: (current: SiteConfig) => SiteConfig) => {
    setLocalConfig((current) => (current ? updater(current) : current))
  }

  // Handle feature toggle
  const handleFeatureToggle = (featureKey: FeatureKey, enabled: boolean) => {
    if (!localConfig) return
    updateConfig((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: {
          ...prev.features[featureKey],
          enabled
        }
      }
    }))
  }

  const handleFeatureCopyChange = (
    featureKey: FeatureKey,
    field: 'unavailableTitle' | 'unavailableMessage',
    value: string,
  ) => {
    updateConfig((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: {
          ...prev.features[featureKey],
          [field]: value,
        },
      },
    }))
  }

  // Handle theme changes
  const handleThemeChange = <K extends keyof SiteConfig['theme']>(
    key: K,
    value: SiteConfig['theme'][K],
  ) => {
    if (!localConfig) return
    updateConfig((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value
      }
    }))
  }

  // Handle text changes
  const handleTextChange = <
    S extends 'home' | 'ai' | 'pricing' | 'data',
    K extends keyof SiteConfig[S],
  >(
    section: S,
    key: K,
    value: SiteConfig[S][K],
  ) => {
    if (!localConfig) return
    updateConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    } as SiteConfig))
  }

  const handlePlanChange = <K extends keyof PricingPlanConfig>(
    planKey: PlanKey,
    key: K,
    value: PricingPlanConfig[K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        plans: {
          ...prev.pricing.plans,
          [planKey]: {
            ...prev.pricing.plans[planKey],
            [key]: value,
          },
        },
      },
    }))
  }

  // Handle save
  const handleSave = async () => {
    if (!localConfig) return
    
    saveMutation.mutate(localConfig, {
      onSuccess: () => {
        // Refresh the provider
        refresh()
        // Refetch admin config
        refetch()
        // Show success message via toast or alert
        setSaveStatus({ 
          type: 'success', 
          message: 'Configuration saved successfully!' 
        })
        setTimeout(() => {
          setSaveStatus({ type: null, message: '' })
        }, 5000)
      },
      onError: (error: Error) => {
        setSaveStatus({ 
          type: 'error', 
          message: error.message || 'Failed to save configuration' 
        })
        setTimeout(() => {
          setSaveStatus({ type: null, message: '' })
        }, 5000)
      }
    })
  }

  // Tabs configuration
  const tabs: Array<{ id: AdminTabId; label: string; icon: LucideIcon }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'features', label: 'Features', icon: Shield },
    { id: 'theme', label: 'Theme & Branding', icon: Palette },
    { id: 'home', label: 'Home Page', icon: Home },
    { id: 'ai', label: 'AI Configuration', icon: Bot },
    { id: 'pricing', label: 'Pricing', icon: CreditCard },
    { id: 'data', label: 'Data & Analytics', icon: Database },
    { id: 'status', label: 'Maintenance', icon: Settings },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="bg-white border rounded-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h3 className="font-semibold">Error Loading Configuration</h3>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            {error instanceof Error ? error.message : 'Failed to load configuration'}
          </p>
          <button
            onClick={() => refetch()}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!localConfig) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 rounded hover:bg-slate-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 hidden sm:flex">
                <span>{user?.fullName || user?.username || 'Admin'}</span>
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                  {user?.fullName?.[0] || user?.username?.[0] || 'A'}
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
              >
                {saveMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 w-64
          transition-transform duration-300 ease-in-out z-20
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="p-4 space-y-1 overflow-y-auto h-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${activeTab === tab.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Save Status Alert */}
          {saveStatus.type && (
            <div className={`
              mb-6 p-4 rounded-lg flex items-center gap-3
              ${saveStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : ''}
              ${saveStatus.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : ''}
            `}>
              {saveStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm">{saveStatus.message}</span>
            </div>
          )}

          {/* Save Mutation Error */}
          {saveMutation.isError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">
                {saveMutation.error instanceof Error 
                  ? saveMutation.error.message 
                  : 'Failed to save configuration'}
              </span>
            </div>
          )}

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="Dashboard Overview" 
                  description="Quick overview of your site configuration and status" 
                  icon={LayoutDashboard}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Status</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        localConfig.status.maintenanceMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {localConfig.status.maintenanceMode ? 'Maintenance' : 'Live'}
                      </span>
                    </div>
                    <p className="text-xl font-semibold mt-2">{localConfig.theme.brandName}</p>
                    <p className="text-xs text-slate-500 mt-1">v{localConfig.version}</p>
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-slate-500">Active Features</p>
                    <p className="text-2xl font-semibold mt-1">
                      {Object.values(localConfig.features).filter((feature) => feature.enabled).length}
                      <span className="text-sm text-slate-400 font-normal ml-1">
                        / {Object.keys(localConfig.features).length}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Features enabled</p>
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-slate-500">Last Updated</p>
                    <p className="text-sm font-medium mt-1">
                      {new Date(localConfig.updatedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(localConfig.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm text-slate-500">Default Currency</p>
                    <p className="text-2xl font-semibold mt-1">{localConfig.data.defaultCurrency}</p>
                    <p className="text-xs text-slate-500 mt-1">Analytics: {localConfig.data.analyticsEnabled ? 'On' : 'Off'}</p>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button 
                      onClick={() => setActiveTab('status')}
                      className="p-3 border rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <Settings className="w-5 h-5 text-primary mb-1" />
                      <p className="text-sm font-medium">Maintenance</p>
                      <p className="text-xs text-slate-500">Toggle site mode</p>
                    </button>
                    <button 
                      onClick={() => setActiveTab('features')}
                      className="p-3 border rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <Shield className="w-5 h-5 text-primary mb-1" />
                      <p className="text-sm font-medium">Features</p>
                      <p className="text-xs text-slate-500">Manage features</p>
                    </button>
                    <button 
                      onClick={() => setActiveTab('theme')}
                      className="p-3 border rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <Palette className="w-5 h-5 text-primary mb-1" />
                      <p className="text-sm font-medium">Theme</p>
                      <p className="text-xs text-slate-500">Customize branding</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="Feature Management" 
                  description="Enable or disable features and customize their unavailable messages" 
                  icon={Shield}
                />
                
                <div className="bg-white border rounded-lg p-6">
                  <div className="space-y-4">
                    {FEATURE_ORDER.map((key) => (
                      <FeatureToggle
                        key={key}
                        featureKey={key}
                        feature={localConfig.features[key]}
                        onToggle={handleFeatureToggle}
                        onCopyChange={handleFeatureCopyChange}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="Theme & Branding" 
                  description="Customize the visual appearance of your site" 
                  icon={Palette}
                />
                
                <div className="bg-white border rounded-lg p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Brand Name</label>
                      <input
                        type="text"
                        value={localConfig.theme.brandName}
                        onChange={(e) => handleThemeChange('brandName', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Tagline</label>
                      <input
                        type="text"
                        value={localConfig.theme.tagline}
                        onChange={(e) => handleThemeChange('tagline', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Logo Image URL</label>
                    <input
                      type="text"
                      value={localConfig.theme.logoImageUrl}
                      onChange={(e) => handleThemeChange('logoImageUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker
                      label="Primary Color"
                      value={localConfig.theme.primaryColor}
                      onChange={(value) => handleThemeChange('primaryColor', value)}
                    />
                    <ColorPicker
                      label="Accent Color"
                      value={localConfig.theme.accentColor}
                      onChange={(value) => handleThemeChange('accentColor', value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker
                      label="Background Color"
                      value={localConfig.theme.backgroundColor}
                      onChange={(value) => handleThemeChange('backgroundColor', value)}
                    />
                    <ColorPicker
                      label="Foreground Color"
                      value={localConfig.theme.foregroundColor}
                      onChange={(value) => handleThemeChange('foregroundColor', value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Text Scale</label>
                    <input
                      type="range"
                      min="85"
                      max="120"
                      value={localConfig.theme.textScale}
                      onChange={(e) => handleThemeChange('textScale', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm text-slate-500">{localConfig.theme.textScale}%</span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Background Image URL</label>
                    <input
                      type="text"
                      value={localConfig.theme.backgroundImageUrl}
                      onChange={(e) => handleThemeChange('backgroundImageUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      placeholder="https://example.com/background.jpg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Home Tab */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="Home Page Configuration" 
                  description="Customize the content displayed on your homepage" 
                  icon={Home}
                />
                
                <div className="bg-white border rounded-lg p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={localConfig.home.badgeText}
                      onChange={(e) => handleTextChange('home', 'badgeText', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Hero Title</label>
                    <input
                      type="text"
                      value={localConfig.home.heroTitle}
                      onChange={(e) => handleTextChange('home', 'heroTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Hero Accent</label>
                    <input
                      type="text"
                      value={localConfig.home.heroAccent}
                      onChange={(e) => handleTextChange('home', 'heroAccent', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Subtitle</label>
                    <textarea
                      value={localConfig.home.subtitle}
                      onChange={(e) => handleTextChange('home', 'subtitle', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Prompt Placeholder</label>
                    <input
                      type="text"
                      value={localConfig.home.promptPlaceholder}
                      onChange={(e) => handleTextChange('home', 'promptPlaceholder', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">CTA Label</label>
                    <input
                      type="text"
                      value={localConfig.home.ctaLabel}
                      onChange={(e) => handleTextChange('home', 'ctaLabel', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Signed Out Hint</label>
                    <input
                      type="text"
                      value={localConfig.home.signedOutHint}
                      onChange={(e) => handleTextChange('home', 'signedOutHint', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Trust Text</label>
                    <input
                      type="text"
                      value={localConfig.home.trustText}
                      onChange={(e) => handleTextChange('home', 'trustText', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Recommendations Title</label>
                    <input
                      type="text"
                      value={localConfig.home.recommendationsTitle}
                      onChange={(e) => handleTextChange('home', 'recommendationsTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Footer Text</label>
                    <input
                      type="text"
                      value={localConfig.home.footerText}
                      onChange={(e) => handleTextChange('home', 'footerText', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="AI Configuration" 
                  description="Configure the AI trip planner behavior and settings" 
                  icon={Bot}
                />
                
                <div className="bg-white border rounded-lg p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">System Prompt</label>
                    <textarea
                      value={localConfig.ai.plannerSystemPrompt}
                      onChange={(e) => handleTextChange('ai', 'plannerSystemPrompt', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Response Guidelines</label>
                    <textarea
                      value={localConfig.ai.responseGuidelines}
                      onChange={(e) => handleTextChange('ai', 'responseGuidelines', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Temperature</label>
                      <input
                        type="number"
                        min="0"
                        max="1.5"
                        step="0.1"
                        value={localConfig.ai.temperature}
                        onChange={(e) => {
                          updateConfig((prev) => ({
                            ...prev,
                            ai: { ...prev.ai, temperature: parseFloat(e.target.value) }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Max Tokens</label>
                      <input
                        type="number"
                        min="200"
                        max="4000"
                        step="100"
                        value={localConfig.ai.maxTokens}
                        onChange={(e) => {
                          updateConfig((prev) => ({
                            ...prev,
                            ai: { ...prev.ai, maxTokens: parseInt(e.target.value) }
                          }))
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">Save Generated Trips</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localConfig.ai.saveGeneratedTrips}
                        onChange={(e) => {
                          updateConfig((prev) => ({
                            ...prev,
                            ai: { ...prev.ai, saveGeneratedTrips: e.target.checked }
                          }))
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Suggested Options</label>
                    <input
                      type="text"
                      value={localConfig.ai.suggestedOptions.join(', ')}
                      onChange={(e) => {
                        const options = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        updateConfig((prev) => ({
                          ...prev,
                          ai: { ...prev.ai, suggestedOptions: options }
                        }))
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      placeholder="India, Maldives, Dubai, Bali, Thailand"
                    />
                    <p className="text-xs text-slate-500 mt-1">Separate options with commas</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="Pricing Configuration" 
                  description="Manage your pricing plans and billing settings" 
                  icon={CreditCard}
                />
                
                <div className="bg-white border rounded-lg p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Currency</label>
                      <input
                        type="text"
                        value={localConfig.pricing.currency}
                        onChange={(e) => handleTextChange('pricing', 'currency', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Billing Note</label>
                      <input
                        type="text"
                        value={localConfig.pricing.billingNote}
                        onChange={(e) => handleTextChange('pricing', 'billingNote', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      />
                    </div>
                  </div>
                  
                  {PLAN_ORDER.map((planKey) => {
                    const plan = localConfig.pricing.plans[planKey]

                    return (
                    <div key={planKey} className="border-t pt-4 first:border-t-0 first:pt-0">
                      <h3 className="font-medium text-slate-900 mb-3 capitalize">{planKey} Plan</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={plan.label}
                          onChange={(e) =>
                            handlePlanChange(planKey, 'label', e.target.value)
                          }
                          className="px-3 py-2 border border-slate-200 rounded text-sm"
                          placeholder="Plan name"
                        />
                        <input
                          type="number"
                          min="0"
                          value={plan.monthlyPrice}
                          onChange={(e) =>
                            handlePlanChange(planKey, 'monthlyPrice', parseInt(e.target.value))
                          }
                          className="px-3 py-2 border border-slate-200 rounded text-sm"
                          placeholder="Monthly price"
                        />
                        <input
                          type="number"
                          min="0"
                          value={plan.monthlyCredits}
                          onChange={(e) =>
                            handlePlanChange(planKey, 'monthlyCredits', parseInt(e.target.value))
                          }
                          className="px-3 py-2 border border-slate-200 rounded text-sm"
                          placeholder="Monthly credits"
                        />
                        <input
                          type="text"
                          value={plan.ctaLabel}
                          onChange={(e) =>
                            handlePlanChange(planKey, 'ctaLabel', e.target.value)
                          }
                          className="px-3 py-2 border border-slate-200 rounded text-sm"
                          placeholder="CTA label"
                        />
                        <div className="md:col-span-2">
                          <textarea
                            value={plan.description}
                            onChange={(e) =>
                              handlePlanChange(planKey, 'description', e.target.value)
                            }
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                            placeholder="Plan description"
                          />
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="Data & Analytics" 
                  description="Configure data retention, analytics, and application settings" 
                  icon={Database}
                />
                
                <div className="bg-white border rounded-lg p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Default Currency</label>
                    <input
                      type="text"
                      value={localConfig.data.defaultCurrency}
                      onChange={(e) => handleTextChange('data', 'defaultCurrency', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Retention Days</label>
                    <input
                      type="number"
                      min="1"
                      value={localConfig.data.retentionDays}
                      onChange={(e) => {
                        updateConfig((prev) => ({
                          ...prev,
                          data: { ...prev.data, retentionDays: parseInt(e.target.value) }
                        }))
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">Number of days to keep user data</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">Collect Trip Images</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localConfig.data.collectTripImages}
                        onChange={(e) => {
                          updateConfig((prev) => ({
                            ...prev,
                            data: { ...prev.data, collectTripImages: e.target.checked }
                          }))
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">Analytics Enabled</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localConfig.data.analyticsEnabled}
                        onChange={(e) => {
                          updateConfig((prev) => ({
                            ...prev,
                            data: { ...prev.data, analyticsEnabled: e.target.checked }
                          }))
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="space-y-6">
                <SectionHeader 
                  title="Maintenance & Status" 
                  description="Configure maintenance mode and status messages" 
                  icon={Settings}
                />
                
                <div className="bg-white border rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">Maintenance Mode</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localConfig.status.maintenanceMode}
                        onChange={(e) => {
                          updateConfig((prev) => ({
                            ...prev,
                            status: { ...prev.status, maintenanceMode: e.target.checked }
                          }))
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className={`text-sm ${localConfig.status.maintenanceMode ? 'text-red-600' : 'text-green-600'}`}>
                      {localConfig.status.maintenanceMode ? 'Site is under maintenance' : 'Site is live'}
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Headline</label>
                    <input
                      type="text"
                      value={localConfig.status.headline}
                      onChange={(e) => {
                        updateConfig((prev) => ({
                          ...prev,
                          status: { ...prev.status, headline: e.target.value }
                        }))
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Message</label>
                    <textarea
                      value={localConfig.status.message}
                      onChange={(e) => {
                        updateConfig((prev) => ({
                          ...prev,
                          status: { ...prev.status, message: e.target.value }
                        }))
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Support URL</label>
                    <input
                      type="text"
                      value={localConfig.status.supportUrl}
                      onChange={(e) => {
                        updateConfig((prev) => ({
                          ...prev,
                          status: { ...prev.status, supportUrl: e.target.value }
                        }))
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                      placeholder="https://support.example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Expected Back At</label>
                    <input
                      type="datetime-local"
                      value={localConfig.status.expectedBackAt}
                      onChange={(e) => {
                        updateConfig((prev) => ({
                          ...prev,
                          status: { ...prev.status, expectedBackAt: e.target.value }
                        }))
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">Estimated time when the site will be back online</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
            >
              {saveMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Configuration...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save All Changes
                </>
              )}
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminPage
