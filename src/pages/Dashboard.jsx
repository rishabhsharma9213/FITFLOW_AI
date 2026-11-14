import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Layers,
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  RotateCw,
  Sparkles,
  Clock,
  Store,
  DollarSign,
  Package,
  Calendar,
  AlertCircle,
  Cpu,
  Bot
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import StatCard from '../components/common/StatCard';
import SizeBadge from '../components/common/SizeBadge';
import { SUPPORTED_SIZES, APP_NAME, APP_TAGLINE } from '../types/constants';
import { getOverviewAnalytics, getRecommendations, getAiInsights } from '../services/api';

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Independent AI states (never blocks dashboard)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Guard against duplicate Gemini requests on multiple renders
  const aiFetchedRef = useRef(false);

  // 1. Fast MongoDB fetch (instant render)
  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      setError(null);

      const [overviewRes, recsRes] = await Promise.all([
        getOverviewAnalytics(),
        getRecommendations(),
      ]);

      if (overviewRes?.success) {
        setOverview(overviewRes.data);
      }
      if (recsRes?.success) {
        setRecommendations(recsRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Unable to connect to FitFlow backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 2. Asynchronous AI fetch (separate lifecycle)
  const fetchAi = useCallback(async (force = false) => {
    try {
      setAiLoading(true);
      setAiError(null);
      const res = await getAiInsights(force);
      if (res?.success) {
        setAiInsights(res.data);
      }
    } catch (err) {
      console.warn('AI insights fetch failed:', err);
      setAiError(err.message || 'AI explanation service temporarily unavailable.');
    } finally {
      setAiLoading(false);
    }
  }, []);

  // On mount: load MongoDB metrics immediately, then trigger AI once
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!aiFetchedRef.current) {
      aiFetchedRef.current = true;
      fetchAi(false);
    }
  }, [fetchAi]);

  const handleFullRefresh = () => {
    fetchDashboardData(true);
    fetchAi(false);
  };

  // Transform data for charts
  const sizeData = (overview?.stockDistributionBySize || []).map((item) => ({
    size: item.size,
    stock: item.totalStock,
    itemCount: item.itemCount,
  }));

  const storeData = (overview?.stockDistributionByStore || []).map((item) => ({
    store: item.store,
    stock: item.totalStock,
    zeroStock: item.zeroStockCount,
  }));

  const salesTrendData = (overview?.dailySalesTrend || []).map((item) => ({
    date: item.date.slice(5),
    qty: item.qtySold,
    revenue: Math.round(item.revenue / 1000),
  }));

  const topSellers = overview?.topSellingProducts || [];
  const lowStockAlerts = (recommendations?.fastSellersRisk || []).slice(0, 4);
  const ageingAlerts = (recommendations?.ageingAlerts || []).slice(0, 4);
  const transferCount = recommendations?.transferRecommendations?.length || 0;

  // Determine provider status and badges
  const isGemini = aiInsights?.provider === 'gemini';
  const isQuotaExceeded = aiInsights?.quotaExceeded;
  const statusHeadline = isGemini
    ? 'Google Gemini AI Active'
    : isQuotaExceeded
    ? 'Gemini AI unavailable — daily API quota exceeded'
    : aiInsights?.aiStatus || 'Deterministic Engine Active';

  const badgeText = isGemini
    ? 'Gemini Active'
    : 'Deterministic Engine Active';

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            {APP_NAME} Control Center
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {APP_TAGLINE} &bull; Real-Time Multi-Store Intelligence
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            MongoDB Live
          </span>

          <button
            type="button"
            onClick={handleFullRefresh}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh All'}</span>
          </button>
        </div>
      </div>

      {/* Main Error Banner */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold">Backend Connection Warning</p>
              <p className="text-xs text-rose-200/80 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs rounded border border-rose-500/40 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading instant inventory metrics from MongoDB...</p>
        </div>
      )}

      {!loading && overview && (
        <>
          {/* Real KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Live Inventory"
              value={`${overview.totalUnits.toLocaleString()} units`}
              change={`${overview.uniqueSkus} Unique SKUs`}
              changeType="positive"
              icon={Package}
              subtitle={`Distributed across ${overview.totalStores} store locations`}
            />
            <StatCard
              title="30-Day Sales Volume"
              value={`${overview.salesQty30Days.toLocaleString()} units`}
              change={`₹${(overview.salesRevenue30Days / 100000).toFixed(1)}L Revenue`}
              changeType="positive"
              icon={TrendingUp}
              subtitle="Verified customer purchase velocity"
            />
            <StatCard
              title="Zero-Stock Records"
              value={`${overview.zeroStockRecords} Out of Stock`}
              change="Urgent Stockout Risk"
              changeType="negative"
              icon={AlertTriangle}
              subtitle="SKUs completely depleted in specific stores"
            />
            <StatCard
              title="Ageing Inventory (≥90d)"
              value={`${overview.ageing90Records} Records`}
              change={`${transferCount} Transfers Ready`}
              changeType="neutral"
              icon={ArrowLeftRight}
              subtitle="Units eligible for inter-store rebalance"
            />
          </div>

          {/* AI Intelligence Card (Asynchronous & Non-Blocking) */}
          <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-purple-950/30 p-6 shadow-lg shadow-indigo-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg border ${
                  isGemini
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : isQuotaExceeded
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                }`}>
                  {isGemini ? (
                    <Bot className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Cpu className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2 flex-wrap">
                    FitFlow AI Merchandising Copilot
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isGemini
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {badgeText}
                    </span>
                  </h2>
                  <p className={`text-xs mt-0.5 ${isQuotaExceeded ? 'text-amber-400/90 font-medium' : 'text-indigo-300/80'}`}>
                    {aiLoading
                      ? 'Analyzing metrics (8s non-blocking timeout)...'
                      : statusHeadline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {aiLoading && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    <RotateCw className="w-3 h-3 animate-spin text-indigo-400" />
                    Processing...
                  </span>
                )}

                {aiInsights && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono border ${
                    isGemini
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${isGemini ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    Source: {aiInsights.provider || 'deterministic'}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => fetchAi(true)}
                  disabled={aiLoading}
                  title={isQuotaExceeded ? 'Attempt Gemini API once (quota may still be restricted)' : 'Refresh AI Analysis'}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span>{isQuotaExceeded ? 'Retry Gemini' : 'Refresh AI'}</span>
                </button>
              </div>
            </div>

            {/* Quota Exceeded Notice */}
            {isQuotaExceeded && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                <span>
                  <strong>Daily API Limit:</strong> Free-tier Gemini quota is exhausted. The deterministic engine is currently active using real MongoDB numbers.
                </span>
                <button
                  onClick={() => fetchAi(true)}
                  disabled={aiLoading}
                  className="px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 rounded text-[11px] font-semibold text-amber-200 transition-colors cursor-pointer"
                >
                  Retry Gemini
                </button>
              </div>
            )}

            {/* AI Content Grid */}
            {aiInsights ? (
              <>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
                  <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <h4 className="font-semibold text-indigo-300 uppercase tracking-wider text-[11px] mb-1.5">
                      Executive Summary
                    </h4>
                    <p className="leading-relaxed text-slate-300">
                      {aiInsights.summary?.executiveSummary || aiInsights.executiveSummary}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <h4 className="font-semibold text-rose-300 uppercase tracking-wider text-[11px] mb-1.5">
                      Critical Stockout Pressure
                    </h4>
                    <p className="leading-relaxed text-slate-300">
                      {aiInsights.insights?.stockoutExplanations || aiInsights.stockoutRisks}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <h4 className="font-semibold text-amber-300 uppercase tracking-wider text-[11px] mb-1.5">
                      Extended Sizing & Rebalancing
                    </h4>
                    <p className="leading-relaxed text-slate-300">
                      {aiInsights.insights?.sizeDemandInsights || aiInsights.sizeAndStoreAttention}
                    </p>
                    {aiInsights.insights?.rebalancingExplanations && (
                      <p className="leading-relaxed text-slate-400 mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
                        {aiInsights.insights.rebalancingExplanations}
                      </p>
                    )}
                  </div>
                </div>

                {/* Immediate Action Plan */}
                {((aiInsights.priorities && aiInsights.priorities.length > 0) || (aiInsights.actionPlan && aiInsights.actionPlan.length > 0)) && (
                  <div className="mt-4 pt-4 border-t border-indigo-500/20">
                    <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                      Immediate Store Action Plan:
                    </span>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {(aiInsights.priorities || aiInsights.actionPlan).map((action, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2.5 rounded bg-slate-950/40 border border-indigo-500/20 text-slate-300"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{typeof action === 'string' ? action : action.action || action.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-4 p-6 rounded-lg bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-400">
                <RotateCw className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-2" />
                <span>Loading inventory intelligence in background... KPI cards and charts are live below.</span>
              </div>
            )}
          </div>

          {/* Primary Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Size-Wise Inventory Distribution */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Live Size-Wise Inventory Distribution</h2>
                  <p className="text-xs text-slate-400">Total units in stock per size across all 6 stores</p>
                </div>
                <span className="text-xs text-indigo-400 font-mono">MongoDB Joined</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sizeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="size" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`${val} units`, 'In-Stock Units']}
                    />
                    <Bar dataKey="stock" name="Stock" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-400 px-2">
                <span>Extended Size Coverage: XL, XXL, 3XL, 4XL, 5XL</span>
                <span className="text-indigo-400 font-semibold">
                  {overview.stockDistributionBySize?.reduce((acc, s) => acc + s.totalStock, 0).toLocaleString()} Total Units
                </span>
              </div>
            </div>

            {/* 2. Store-Wise Stock Distribution */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Stock Distribution by Store Branch</h2>
                  <p className="text-xs text-slate-400">Warehouse vs. Retail Store Inventory</p>
                </div>
                <Store className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="store" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="stock" name="Total Units" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-400 px-2">
                <span>Peenya WH serves as central distribution hub</span>
                <span className="text-emerald-400 font-medium">6 Locations Monitored</span>
              </div>
            </div>
          </div>

          {/* 30-Day Daily Sales Velocity Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">30-Day Sales Velocity & Daily Revenue Trend</h2>
                <p className="text-xs text-slate-400">
                  Aggregated from 11,713 sales records across all store locations
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Units Sold (Daily)
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Revenue (₹ in Thousands)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="qty" name="Units Sold" stroke="#a855f7" fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="revenue" name="Revenue (₹K)" stroke="#10b981" fillOpacity={0.4} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Selling Products & Alerts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top 5 Selling Products */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Top 5 Selling Products
                </h2>
                <span className="text-xs text-slate-400 font-mono">Last 30 Days</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {topSellers.map((item, idx) => (
                  <div key={item.sku} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-indigo-400 font-mono flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        {item.productName}
                      </span>
                      <SizeBadge size={item.size} showQuantity={false} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>SKU: <strong className="text-slate-300 font-mono">{item.sku}</strong></span>
                      <span className="text-emerald-400 font-semibold">{item.totalQtySold} sold (₹{item.totalRevenue.toLocaleString()})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low-Stock Fast-Sellers Alerts */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Stockout Risk Alerts
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Low Coverage
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {lowStockAlerts.map((alert) => (
                  <div key={`${alert.sku}-${alert.store}`} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                      <span>{alert.store}</span>
                      <SizeBadge size={alert.size} quantity={alert.stock} />
                    </div>
                    <p className="text-slate-200 font-medium">{alert.productName}</p>
                    <p className="text-rose-400/90 mt-1 text-[11px]">{alert.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ageing Inventory Alerts (>=90 days) */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Ageing Deadstock Alerts
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  ≥ 90 Days
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {ageingAlerts.map((alert) => (
                  <div key={`${alert.sku}-${alert.store}`} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                      <span>{alert.store}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono">
                        {alert.ageingDays} Days
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium">{alert.productName} ({alert.size})</p>
                    <p className="text-slate-400 mt-1 text-[11px]">{alert.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
