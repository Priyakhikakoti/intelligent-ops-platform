import React, { useState, useEffect, useRef } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState('Admin'); // Viewer, Operator, Admin
  
  // Data States
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [metricsHistory, setMetricsHistory] = useState([]);
  
  // Incident Room States
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentNotes, setIncidentNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  
  // Deployment Form State
  const [deployService, setDeployService] = useState('gateway-service');
  const [deployVersion, setDeployVersion] = useState('v1.0.0');
  const [deployDesc, setDeployDesc] = useState('');
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [isAssessingRisk, setIsAssessingRisk] = useState(false);
  
  // Log Search States
  const [logSearch, setLogSearch] = useState('');
  const [logSeverity, setLogSeverity] = useState('');
  const [logClass, setLogClass] = useState('');
  const [logService, setLogService] = useState('');
  const [mlFilterActive, setMlFilterActive] = useState(false);
  
  // Feedback Modal State
  const [feedbackTarget, setFeedbackTarget] = useState(null); // {service_id, metric_type}
  const [feedbackType, setFeedbackType] = useState('false_positive');
  const [feedbackComment, setFeedbackComment] = useState('');
  
  // Admin Config State
  const [thresholdCpu, setThresholdCpu] = useState(80);
  const [thresholdLatency, setThresholdLatency] = useState(300);
  const [configService, setConfigService] = useState('gateway-service');
  
  // Alerts & Notifications
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [toast, setToast] = useState(null);
  const prevIncidentCountRef = useRef(0);
  
  // Common Headers
  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      'X-User-Role': role
    };
  };

  // --- FETCHERS ---
  
  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_BASE}/services`, { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
        
        // Auto-select first service if none selected
        if (!selectedService && data.length > 0) {
          setSelectedService(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE}/incidents`, { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setIncidents(data);
        
        // Monitor for new open incidents to show a Toast notification banner!
        const openIncidents = data.filter(i => i.status === 'Open');
        if (openIncidents.length > prevIncidentCountRef.current) {
          const newest = openIncidents[0];
          showToast(`NEW ALERT TRIGGERED: ${newest.title} (Priority: ${newest.priority})`, 'warning');
        }
        prevIncidentCountRef.current = openIncidents.length;
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    }
  };

  const fetchDeployments = async () => {
    try {
      const res = await fetch(`${API_BASE}/deployments`, { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setDeployments(data);
      }
    } catch (err) {
      console.error('Error fetching deployments:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      let url = `${API_BASE}/logs?limit=80`;
      if (logService) url += `&service_id=${logService}`;
      if (logSeverity) url += `&severity=${logSeverity}`;
      if (mlFilterActive) url += `&classification=Suspicious`;
      else if (logClass) url += `&classification=${logClass}`;
      if (logSearch) url += `&search=${encodeURIComponent(logSearch)}`;
      
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const fetchMetricsHistory = async (serviceId) => {
    if (!serviceId) return;
    try {
      const res = await fetch(`${API_BASE}/services/${serviceId}/metrics?limit=30`, { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMetricsHistory(data);
      }
    } catch (err) {
      console.error('Error fetching metrics history:', err);
    }
  };

  // --- ACTIONS ---

  const handleAcknowledgeIncident = async (incidentId) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'Investigating' })
      });
      if (res.ok) {
        showToast('Incident marked as Investigating.', 'info');
        fetchIncidents();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to acknowledge.', 'critical');
      }
    } catch (err) {
      showToast('API connection error.', 'critical');
    }
  };

  const handleResolveIncident = async (incidentId) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'Resolved' })
      });
      if (res.ok) {
        showToast('Incident marked as Resolved.', 'success');
        fetchIncidents();
        if (selectedIncident && selectedIncident.id === incidentId) {
          setSelectedIncident(prev => ({ ...prev, status: 'Resolved' }));
        }
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to resolve.', 'critical');
      }
    } catch (err) {
      showToast('API connection error.', 'critical');
    }
  };

  const handleViewIncidentDetails = async (incident) => {
    setSelectedIncident(incident);
    try {
      const res = await fetch(`${API_BASE}/incidents/${incident.id}/notes`, { headers: getHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) {
        setIncidentNotes(data);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedIncident) return;
    try {
      const res = await fetch(`${API_BASE}/incidents/${selectedIncident.id}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ author: `${role} Admin`, note: newNote })
      });
      if (res.ok) {
        setNewNote('');
        handleViewIncidentDetails(selectedIncident);
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to add note.', 'critical');
      }
    } catch (err) {
      showToast('API connection error.', 'critical');
    }
  };

  const assessDeployRisk = async () => {
    if (!deployDesc.trim()) {
      showToast('Please provide a deployment description to evaluate risk.', 'warning');
      return;
    }
    setIsAssessingRisk(true);
    try {
      const res = await fetch(`${API_BASE}/deployments/analyze-risk`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          service_id: deployService,
          version: deployVersion,
          deployed_by: `${role} User`,
          description: deployDesc
        })
      });
      const data = await res.json();
      setRiskAssessment(data);
      showToast(`Risk Assessment Completed: ${data.risk_level} Risk`, 'info');
    } catch (err) {
      showToast('Risk analysis failed.', 'critical');
    } finally {
      setIsAssessingRisk(false);
    }
  };

  const executeDeployment = async () => {
    if (!deployDesc.trim()) {
      showToast('Please provide a deployment description.', 'warning');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/deployments`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          service_id: deployService,
          version: deployVersion,
          deployed_by: `${role} Operator`,
          description: deployDesc
        })
      });
      if (res.ok) {
        showToast(`Rollout triggered successfully for ${deployService}!`, 'success');
        setDeployDesc('');
        setRiskAssessment(null);
        fetchDeployments();
        fetchServices();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Rollout failed.', 'critical');
      }
    } catch (err) {
      showToast('API connection error.', 'critical');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackTarget) return;
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          service_id: feedbackTarget.service_id,
          metric_type: feedbackTarget.metric_type,
          feedback_type: feedbackType,
          user_comment: feedbackComment
        })
      });
      if (res.ok) {
        showToast('Feedback submitted. Anomaly thresholds adapted.', 'success');
        setFeedbackTarget(null);
        setFeedbackComment('');
      }
    } catch (err) {
      showToast('Failed to submit feedback.', 'critical');
    }
  };

  const handleUpdateConfigThresholds = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/services/${configService}/thresholds`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          alert_threshold_cpu: thresholdCpu,
          alert_threshold_latency: thresholdLatency
        })
      });
      if (res.ok) {
        showToast(`Alert thresholds configured for ${configService}.`, 'success');
        fetchServices();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to update thresholds.', 'critical');
      }
    } catch (err) {
      showToast('API connection error.', 'critical');
    }
  };

  const handleResetSystem = async () => {
    if (!window.confirm('Reset database and metrics simulation to seed data?')) return;
    try {
      const res = await fetch(`${API_BASE}/reset-data`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        showToast('Database reset and baseline metrics seeded.', 'success');
        fetchServices();
        fetchIncidents();
        fetchDeployments();
        fetchLogs();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Reset failed.', 'critical');
      }
    } catch (err) {
      showToast('API connection error.', 'critical');
    }
  };

  const showToast = (message, status = 'info') => {
    setToast({ message, status });
    setTimeout(() => setToast(null), 4000);
  };

  // --- LOOPS AND EFFECTS ---
  
  // Pull core state immediately
  useEffect(() => {
    fetchServices();
    fetchIncidents();
    fetchDeployments();
    fetchLogs();
  }, [role]);

  // Handle active log queries based on changes
  useEffect(() => {
    fetchLogs();
  }, [logService, logSeverity, logClass, mlFilterActive, logSearch]);

  // Sync Selected Metrics
  useEffect(() => {
    fetchMetricsHistory(selectedService);
  }, [selectedService, services]);

  // Background Live polling loop (4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchServices();
      fetchIncidents();
      fetchLogs();
      if (selectedService) {
        fetchMetricsHistory(selectedService);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedService, role]);

  // Sync Threshold form inputs when config service changes
  useEffect(() => {
    const svcObj = services.find(s => s.id === configService);
    if (svcObj) {
      setThresholdCpu(svcObj.alert_threshold_cpu);
      setThresholdLatency(svcObj.alert_threshold_latency);
    }
  }, [configService, services]);

  // Extract alerts queue from services
  useEffect(() => {
    const alerts = [];
    services.forEach(s => {
      if (s.status === 'warning' || s.status === 'critical') {
        alerts.push({
          id: `alert-${s.id}`,
          service_id: s.id,
          service_name: s.name,
          status: s.status,
          priority: s.tier === 1 ? 'High' : 'Medium',
          score: s.tier === 1 ? 82.5 : 55.0,
          desc: s.status === 'critical' ? 'High error rates or extreme latency detected by ML scanner.' : 'Metric boundaries exceeded.'
        });
      }
    });
    setActiveAlerts(alerts);
  }, [services]);

  // --- SVG PLOTTER FOR CUSTOM GRAPHING ---
  
  const renderSVGChart = (metricKey, title, maxVal, colorVar, unit = '') => {
    if (!metricsHistory || metricsHistory.length === 0) {
      return <div className="terminal-title">Awaiting telemetry logs...</div>;
    }

    const width = 500;
    const height = 140;
    const paddingLeft = 35;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Get values
    const dataPoints = metricsHistory.map(m => m[metricKey] || 0);
    
    // Scale calculations
    const minVal = 0;
    const historyMax = Math.max(...dataPoints, 1.0);
    const scaleMax = maxVal ? Math.max(maxVal, historyMax) : historyMax * 1.1;

    // Generate path coords
    const coords = dataPoints.map((val, idx) => {
      const x = paddingLeft + (idx / (dataPoints.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((val - minVal) / (scaleMax - minVal)) * chartHeight;
      return { x, y, val };
    });

    const pathD = coords.length > 0 
      ? `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(' ')
      : '';
      
    // Fill path helper (under the line glow)
    const fillD = coords.length > 0
      ? `${pathD} L ${coords[coords.length - 1].x} ${paddingTop + chartHeight} L ${coords[0].x} ${paddingTop + chartHeight} Z`
      : '';

    // Alert threshold lines (for CPU and Latency)
    let thresholdY = null;
    const currentSvcConfig = services.find(s => s.id === selectedService);
    if (currentSvcConfig) {
      let tValue = null;
      if (metricKey === 'cpu') tValue = currentSvcConfig.alert_threshold_cpu;
      if (metricKey === 'latency') tValue = currentSvcConfig.alert_threshold_latency;
      
      if (tValue !== null) {
        thresholdY = paddingTop + chartHeight - ((tValue - minVal) / (scaleMax - minVal)) * chartHeight;
      }
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" style={{ width: '100%' }}>
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = paddingTop + ratio * chartHeight;
          const textVal = scaleMax - ratio * (scaleMax - minVal);
          return (
            <g key={idx}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className="chart-grid-line" />
              <text x={paddingLeft - 6} y={y + 3} textAnchor="end" className="chart-grid-text">
                {textVal.toFixed(0)}{unit}
              </text>
            </g>
          );
        })}
        
        {/* Fill Area */}
        {fillD && <path d={fillD} fill={`var(${colorVar})`} className="chart-area-fill" />}
        
        {/* Trend Line */}
        {pathD && <path d={pathD} className={`chart-trend-line ${metricKey}`} fill="none" stroke={`var(${colorVar})`} />}
        
        {/* Threshold indicator line */}
        {thresholdY !== null && thresholdY >= paddingTop && thresholdY <= paddingTop + chartHeight && (
          <g>
            <line 
              x1={paddingLeft} 
              y1={thresholdY} 
              x2={width - paddingRight} 
              y2={thresholdY} 
              stroke="var(--color-critical)" 
              strokeDasharray="4,4" 
              strokeWidth="1.5"
            />
            <text x={width - paddingRight - 4} y={thresholdY - 4} textAnchor="end" fill="var(--color-critical)" fontSize="8px" fontWeight="bold">
              ALERT CEILING
            </text>
          </g>
        )}

        {/* Data point circle markers */}
        {coords.map((c, idx) => {
          // If metric exceeds threshold (or display alert points)
          let isAnomalous = false;
          if (currentSvcConfig) {
            if (metricKey === 'cpu' && c.val > currentSvcConfig.alert_threshold_cpu) isAnomalous = true;
            if (metricKey === 'latency' && c.val > currentSvcConfig.alert_threshold_latency) isAnomalous = true;
            if (metricKey === 'error_rate' && c.val > 0.05) isAnomalous = true;
          }
          
          if (idx === coords.length - 1 || isAnomalous) {
            return (
              <g key={idx}>
                <circle 
                  cx={c.x} 
                  cy={c.y} 
                  r={isAnomalous ? 5 : 3.5} 
                  fill={isAnomalous ? 'var(--color-critical)' : `var(${colorVar})`}
                  className={isAnomalous ? 'chart-anomaly-point' : ''}
                />
                {isAnomalous && (
                  <circle 
                    cx={c.x} 
                    cy={c.y} 
                    r={9} 
                    fill="none" 
                    stroke="var(--color-critical)" 
                    strokeWidth="1"
                    opacity="0.6"
                    className="chart-anomaly-point"
                  />
                )}
              </g>
            );
          }
          return null;
        })}
      </svg>
    );
  };

  return (
    <div className="app-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">✦</span>
          <h2 className="logo-text">Aegis Ops</h2>
        </div>
        
        <nav className="nav-menu">
          <button 
            className={`nav-item-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">⚏</span> Dashboard
          </button>
          
          <button 
            className={`nav-item-btn ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <span className="nav-icon">📈</span> Metrics Scanner
          </button>
          
          <button 
            className={`nav-item-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <span className="nav-icon">⎔</span> Logs Explorer
          </button>
          
          <button 
            className={`nav-item-btn ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            <span className="nav-icon">🛠</span> Incident Rooms
          </button>
          
          <button 
            className={`nav-item-btn ${activeTab === 'deployments' ? 'active' : ''}`}
            onClick={() => setActiveTab('deployments')}
          >
            <span className="nav-icon">🚀</span> Deploy Hub
          </button>
          
          <button 
            className={`nav-item-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <span className="nav-icon">⚙</span> Admin Config
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="role-container">
            <span className="role-label">Console Authority</span>
            <select 
              value={role} 
              onChange={(e) => {
                setRole(e.target.value);
                showToast(`Switched console authority to: ${e.target.value}`, 'info');
              }}
              className="role-selector"
            >
              <option value="Viewer">Viewer (Read-only)</option>
              <option value="Operator">Operator (Write/Ack)</option>
              <option value="Admin">Admin (Full Control)</option>
            </select>
          </div>
        </div>
      </aside>

      {/* TOAST SYSTEM */}
      {toast && (
        <div className="notification-banner">
          <button className="notification-banner-close" onClick={() => setToast(null)}>×</button>
          <div className="notification-banner-title">
            {toast.status === 'success' && '✓ SUCCESS'}
            {toast.status === 'warning' && '⚠ SECURITY WARNING'}
            {toast.status === 'critical' && '🚨 CRITICAL SYSTEM OUTAGE'}
            {toast.status === 'info' && '🛈 OP LOG'}
          </div>
          <div className="notification-banner-desc">{toast.message}</div>
        </div>
      )}

      {/* MAIN WORKSPACE CONTENT */}
      <main className="main-workspace">
        <header className="workspace-header">
          <div>
            <h1 className="workspace-title">
              {activeTab === 'dashboard' && 'Intelligent Operations Command'}
              {activeTab === 'metrics' && 'Real-time Metrics Anomaly Detection'}
              {activeTab === 'logs' && 'Machine Learning Log Intelligence'}
              {activeTab === 'incidents' && 'Incident Prioritization Room'}
              {activeTab === 'deployments' && 'Deployment Risk Analytics'}
              {activeTab === 'admin' && 'Access Control & Model Settings'}
            </h1>
            <p className="workspace-subtitle">
              {activeTab === 'dashboard' && 'Service telemetry metrics and prioritized alert streams.'}
              {activeTab === 'metrics' && 'Compute Z-score baselines and customize metric margins.'}
              {activeTab === 'logs' && 'NLP-driven classifications of raw log events.'}
              {activeTab === 'incidents' && 'Manage actively spawned outages and document debug history.'}
              {activeTab === 'deployments' && 'Evaluate software build risks using historical telemetry.'}
              {activeTab === 'admin' && 'Override anomaly engine thresholds and wipe replication data.'}
            </p>
          </div>
          <div className="system-status-indicator">
            <span className="status-dot-pulse"></span>
            Simulator Streaming
          </div>
        </header>

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Global telemetry cards */}
            <div className="stats-row">
              <div className="glass-card">
                <span className="card-title">Global SLA Uptime</span>
                <h3 className="card-value text-success" style={{ color: 'var(--color-success)' }}>99.91%</h3>
                <span className="card-footer">Target ceiling: 99.95%</span>
              </div>
              <div className="glass-card">
                <span className="card-title">Active Service Nodes</span>
                <h3 className="card-value">{services.length} / 6</h3>
                <span className="card-footer">All pods report reachable</span>
              </div>
              <div className="glass-card">
                <span className="card-title">Incidents (Open/Investigating)</span>
                <h3 className="card-value" style={{ color: incidents.filter(i=>i.status!=='Resolved').length > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                  {incidents.filter(i => i.status !== 'Resolved').length} Active
                </h3>
                <span className="card-footer">Mean Resolution: 12.4m</span>
              </div>
              <div className="glass-card">
                <span className="card-title">Telemetry Scans</span>
                <h3 className="card-value" style={{ color: 'var(--color-primary)' }}>12,892</h3>
                <span className="card-footer">ML inferences/minute</span>
              </div>
            </div>

            <div className="dashboard-sections-split">
              {/* Service Cards Grid */}
              <div>
                <h3 className="grid-title">Monitored Services</h3>
                <div className="services-grid">
                  {services.map(s => (
                    <div key={s.id} className={`glass-card service-card ${s.status}`}>
                      <div className="service-header">
                        <div>
                          <h4 className="service-name">{s.name}</h4>
                          <span className="service-owner">{s.owner}</span>
                        </div>
                        <span className="service-tier">Tier {s.tier}</span>
                      </div>
                      
                      <div className="metrics-status-bar">
                        <div className="metric-mini-row">
                          <span className="metric-mini-label">Uptime</span>
                          <span className="metric-mini-value" style={{ color: s.uptime_percent > 99.9 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                            {s.uptime_percent}%
                          </span>
                        </div>
                        <div className="metric-mini-row">
                          <span className="metric-mini-label">Incidents</span>
                          <span className="metric-mini-value" style={{ color: s.active_incidents > 0 ? 'var(--color-critical)' : 'var(--text-secondary)' }}>
                            {s.active_incidents} Active
                          </span>
                        </div>
                      </div>

                      <div className="service-footer">
                        <span className={`badge-status ${s.status}`}>{s.status}</span>
                        <button 
                          className="btn-small"
                          onClick={() => {
                            setSelectedService(s.id);
                            setActiveTab('metrics');
                          }}
                        >
                          Telemetry →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert prioritizer list panel */}
              <div>
                <h3 className="grid-title">ML Prioritized Alerts Queue</h3>
                <div className="alerts-panel">
                  {activeAlerts.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No active anomalies. All baselines healthy.
                    </div>
                  ) : (
                    activeAlerts.map(a => (
                      <div key={a.id} className={`alert-item ${a.status}`}>
                        <div className="alert-header">
                          <span className="alert-service-badge">{a.service_name}</span>
                          <span className={`alert-priority-pill ${a.priority.toLowerCase()}`}>
                            {a.priority}
                          </span>
                        </div>
                        <p className="alert-desc">{a.desc}</p>
                        
                        <div className="alert-meta">
                          <span>Priority Score: <strong className="alert-score">{a.score}</strong>/100</span>
                          <span>Auto-acknowledged</span>
                        </div>

                        <div className="alert-feedback-actions">
                          <button 
                            className="btn-small action-success"
                            onClick={() => {
                              setFeedbackTarget({ service_id: a.service_id, metric_type: 'cpu' });
                              setFeedbackType('useful');
                            }}
                          >
                            ✓ Correct Anomaly
                          </button>
                          <button 
                            className="btn-small action-warning"
                            onClick={() => {
                              setFeedbackTarget({ service_id: a.service_id, metric_type: 'cpu' });
                              setFeedbackType('false_positive');
                            }}
                          >
                            ✗ False Positive
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. METRICS SCANNER TAB */}
        {activeTab === 'metrics' && (
          <div className="chart-container">
            <div className="glass-card flex-between" style={{ padding: '1rem' }}>
              <div className="flex-gap-md">
                <span className="font-heading" style={{ fontWeight: '600' }}>Active Node:</span>
                <select 
                  value={selectedService} 
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="form-control"
                  style={{ width: '220px' }}
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-gap-sm">
                <button 
                  className="btn-small"
                  onClick={() => {
                    setFeedbackTarget({ service_id: selectedService, metric_type: 'cpu' });
                    setFeedbackType('false_positive');
                  }}
                >
                  ⚙ Tune Sensitivity
                </button>
              </div>
            </div>

            <div className="grid-2col">
              {/* CPU Chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <h4 className="chart-title">CPU Utilization (Z-Score Scan)</h4>
                    <span className="chart-subtitle">Calculated Z-Scores on historical 12hr rolling baseline</span>
                  </div>
                </div>
                <div className="chart-canvas-mock">
                  {renderSVGChart('cpu', 'CPU Usage', 100, '--color-primary', '%')}
                </div>
              </div>

              {/* Latency Chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <h4 className="chart-title">Response Latency (Baseline Scan)</h4>
                    <span className="chart-subtitle">Aggregated latency of request handlers</span>
                  </div>
                </div>
                <div className="chart-canvas-mock">
                  {renderSVGChart('latency', 'Latency', null, '--color-info', 'ms')}
                </div>
              </div>
            </div>

            <div className="grid-2col">
              {/* Error Rate Chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <h4 className="chart-title">API Traffic Error Rates</h4>
                    <span className="chart-subtitle">Proportion of unsuccessful status returns (5xx error limits)</span>
                  </div>
                </div>
                <div className="chart-canvas-mock">
                  {renderSVGChart('error_rate', 'Error Rate', 1.0, '--color-critical', '%')}
                </div>
              </div>

              {/* RAM Usage */}
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <h4 className="chart-title">Memory Allocation Space</h4>
                    <span className="chart-subtitle">Container allocation footprint</span>
                  </div>
                </div>
                <div className="chart-canvas-mock">
                  {renderSVGChart('memory', 'Memory Utilization', 100, '--color-success', '%')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. LOGS EXPLORER TAB */}
        {activeTab === 'logs' && (
          <div className="chart-container">
            {/* Filter Panel */}
            <div className="filter-row">
              <input 
                type="text" 
                placeholder="Search raw console logs..." 
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="form-control input-search"
              />
              
              <select 
                value={logService}
                onChange={(e) => setLogService(e.target.value)}
                className="form-control"
              >
                <option value="">All Services</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select 
                value={logSeverity}
                onChange={(e) => setLogSeverity(e.target.value)}
                className="form-control"
              >
                <option value="">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
              </select>

              <select 
                value={logClass}
                onChange={(e) => setLogClass(e.target.value)}
                className="form-control"
                disabled={mlFilterActive}
              >
                <option value="">All ML Classifications</option>
                <option value="Normal">Normal</option>
                <option value="Warning">Warning</option>
                <option value="Suspicious">Suspicious</option>
              </select>

              <button 
                className={`btn-small ${mlFilterActive ? 'action-warning' : ''}`}
                style={{ height: '36px' }}
                onClick={() => setMlFilterActive(!mlFilterActive)}
              >
                {mlFilterActive ? '✦ Show All Logs' : '✦ Scan for Suspicious logs'}
              </button>
            </div>

            {/* Terminal Panel */}
            <div className="terminal-card">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="t-dot red"></span>
                  <span className="t-dot yellow"></span>
                  <span className="t-dot green"></span>
                </div>
                <div className="terminal-title">Raw Log Intelligence Engine Terminal</div>
                <div style={{ width: '40px' }}></div>
              </div>

              <div className="terminal-viewport">
                {logs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '4rem' }}>
                    No logs found matching query filters.
                  </div>
                ) : (
                  logs.map(l => (
                    <div key={l.id} className="terminal-line">
                      <span className="t-time">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                      <span className="t-svc">{l.service_id}</span>
                      <span className={`t-sev ${l.severity}`}>{l.severity}</span>
                      <span className="t-msg">{l.message}</span>
                      {l.classification !== 'Normal' && (
                        <span className={`t-class-badge ${l.classification}`}>
                          ML: {l.classification} ({l.matched_pattern})
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. INCIDENTS ROOM */}
        {activeTab === 'incidents' && (
          <div className="chart-container">
            {/* Kanban Columns */}
            <div className="kanban-board">
              {/* Column 1: Open */}
              <div className="kanban-column">
                <div className="column-header">
                  <h4 className="column-title">Open Alerts</h4>
                  <span className="column-counter">{incidents.filter(i => i.status === 'Open').length}</span>
                </div>
                
                {incidents.filter(i => i.status === 'Open').map(inc => (
                  <div key={inc.id} className="kanban-card" onClick={() => handleViewIncidentDetails(inc)}>
                    <span className="inc-svc-name">{inc.service_name}</span>
                    <h5 className="inc-title">{inc.title}</h5>
                    <div className="inc-meta-row">
                      <span className={`badge-status ${inc.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                        {inc.priority}
                      </span>
                      <button 
                        className="btn-small action-success"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledgeIncident(inc.id);
                        }}
                      >
                        Investigate
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Column 2: Investigating */}
              <div className="kanban-column">
                <div className="column-header">
                  <h4 className="column-title">Active Investigation</h4>
                  <span className="column-counter">{incidents.filter(i => i.status === 'Investigating').length}</span>
                </div>

                {incidents.filter(i => i.status === 'Investigating').map(inc => (
                  <div key={inc.id} className="kanban-card" onClick={() => handleViewIncidentDetails(inc)}>
                    <span className="inc-svc-name">{inc.service_name}</span>
                    <h5 className="inc-title">{inc.title}</h5>
                    <div className="inc-meta-row">
                      <span className={`badge-status ${inc.priority.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                        {inc.priority}
                      </span>
                      <button 
                        className="btn-small action-warning"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolveIncident(inc.id);
                        }}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Column 3: Resolved */}
              <div className="kanban-column">
                <div className="column-header">
                  <h4 className="column-title">Resolved tickets</h4>
                  <span className="column-counter">{incidents.filter(i => i.status === 'Resolved').length}</span>
                </div>

                {incidents.filter(i => i.status === 'Resolved').map(inc => (
                  <div key={inc.id} className="kanban-card" onClick={() => handleViewIncidentDetails(inc)}>
                    <span className="inc-svc-name">{inc.service_name}</span>
                    <h5 className="inc-title">{inc.title}</h5>
                    <div className="inc-meta-row">
                      <span className="badge-status resolved" style={{ fontSize: '0.65rem' }}>
                        Resolved
                      </span>
                      <span className="t-date" style={{ fontSize: '0.7rem' }}>
                        {new Date(inc.updated_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual incident generation button */}
            {role !== 'Viewer' && (
              <div className="glass-card" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    const title = prompt('Enter incident title:');
                    if (title) {
                      fetch(`${API_BASE}/incidents`, {
                        method: 'POST',
                        headers: getHeaders(),
                        body: JSON.stringify({
                          service_id: selectedService || 'gateway-service',
                          title: title,
                          description: 'Manually raised operator event.',
                          priority: 'Medium',
                          severity: 'Warning'
                        })
                      }).then(() => fetchIncidents());
                    }
                  }}
                >
                  ✙ Raise Manual Incident Ticket
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. DEPLOY HUB TAB */}
        {activeTab === 'deployments' && (
          <div className="chart-container">
            <div className="grid-2col">
              {/* Deploy Action Form */}
              <div className="glass-card">
                <h4 className="grid-title">Trigger Software Release Rollout</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="grid-2col">
                    <div className="role-container">
                      <span className="role-label">Target Service Node</span>
                      <select 
                        value={deployService}
                        onChange={(e) => setDeployService(e.target.value)}
                        className="form-control"
                      >
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="role-container">
                      <span className="role-label">Release Version</span>
                      <input 
                        type="text" 
                        value={deployVersion}
                        onChange={(e) => setDeployVersion(e.target.value)}
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="role-container">
                    <span className="role-label">Deployment Changelog Description</span>
                    <textarea 
                      placeholder="e.g. Added auth tokens, updated DB schemas and query locks"
                      value={deployDesc}
                      onChange={(e) => setDeployDesc(e.target.value)}
                      className="text-area"
                    />
                  </div>

                  <div className="flex-gap-md" style={{ marginTop: '0.5rem' }}>
                    <button 
                      className="btn-secondary"
                      onClick={assessDeployRisk}
                      disabled={isAssessingRisk}
                    >
                      {isAssessingRisk ? 'Computing ML Risk...' : '🔍 Compute ML Risk Profile'}
                    </button>
                    
                    {role === 'Admin' ? (
                      <button 
                        className="btn-primary"
                        onClick={executeDeployment}
                      >
                        🚀 Push Rollout
                      </button>
                    ) : (
                      <span className="role-label" style={{ color: 'var(--color-critical)' }}>
                        * Push Rollout requires Admin Console Authority
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pre-deploy ML risk advisor */}
              <div className="glass-card deploy-advisor-card">
                <h4 className="grid-title">Pre-deploy ML Risk Advisor</h4>
                
                {riskAssessment ? (
                  <div>
                    <div className="risk-header-flex">
                      <span className="card-title">Build Score Risk</span>
                      <span className={`risk-level-display ${riskAssessment.risk_level}`}>
                        {riskAssessment.risk_level}
                      </span>
                    </div>

                    <div className="gauge-track">
                      <div 
                        className={`gauge-fill ${riskAssessment.risk_level}`} 
                        style={{ width: `${riskAssessment.risk_score}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex-between margin-bottom">
                      <span className="t-date">Aggregated Risk Factor:</span>
                      <strong style={{ color: riskAssessment.risk_level === 'High' ? 'var(--color-critical)' : 'var(--text-primary)' }}>
                        {riskAssessment.risk_score} / 100
                      </strong>
                    </div>

                    <h5 className="role-label" style={{ marginBottom: '0.5rem' }}>Identified Risk Causes:</h5>
                    <ul className="risk-factors-list">
                      {riskAssessment.risk_factors.map((factor, idx) => (
                        <li key={idx} className="risk-factor-item">
                          <span className="risk-factor-bullet">⚠</span>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    Provide deployment description details on the left and click "Compute ML Risk Profile" to inspect risk metrics.
                  </div>
                )}
              </div>
            </div>

            {/* Historical deployment queue */}
            <div className="glass-card">
              <h4 className="grid-title">Release Rollout History</h4>
              <div className="terminal-viewport" style={{ maxHeight: '250px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem' }}>Timestamp</th>
                      <th style={{ padding: '0.5rem' }}>Service</th>
                      <th style={{ padding: '0.5rem' }}>Version</th>
                      <th style={{ padding: '0.5rem' }}>Operator</th>
                      <th style={{ padding: '0.5rem' }}>ML Risk Score</th>
                      <th style={{ padding: '0.5rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.map(d => (
                      <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
                          {new Date(d.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{d.service_name}</td>
                        <td style={{ padding: '0.5rem' }}><code style={{ color: 'var(--color-info)' }}>{d.version}</code></td>
                        <td style={{ padding: '0.5rem' }}>{d.deployed_by}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span className={`badge-status ${d.risk_level}`} style={{ fontSize: '0.65rem' }}>
                            {d.risk_level} ({d.risk_score})
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <span className="badge-status" style={{ 
                            background: d.status === 'Succeeded' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: d.status === 'Succeeded' ? 'var(--color-success)' : 'var(--color-critical)'
                          }}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. ADMIN CONFIG TAB */}
        {activeTab === 'admin' && (
          <div className="chart-container">
            <div className="grid-2col">
              {/* Threshold Override settings */}
              <div className="glass-card">
                <h4 className="grid-title">Override Alert Threshold Rules</h4>
                
                {role === 'Admin' ? (
                  <form onSubmit={handleUpdateConfigThresholds} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="role-container">
                      <span className="role-label">Choose Service Container</span>
                      <select 
                        value={configService}
                        onChange={(e) => setConfigService(e.target.value)}
                        className="form-control"
                      >
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="role-container">
                      <span className="role-label">CPU Anomaly Upper Limit (%)</span>
                      <div className="flex-gap-md">
                        <input 
                          type="range" 
                          min="30" 
                          max="95" 
                          value={thresholdCpu}
                          onChange={(e) => setThresholdCpu(parseFloat(e.target.value))}
                          style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ minWidth: '40px', fontWeight: 'bold' }}>{thresholdCpu}%</span>
                      </div>
                    </div>

                    <div className="role-container">
                      <span className="role-label">Max Latency Outlier Threshold (ms)</span>
                      <div className="flex-gap-md">
                        <input 
                          type="range" 
                          min="20" 
                          max="1500" 
                          step="10"
                          value={thresholdLatency}
                          onChange={(e) => setThresholdLatency(parseFloat(e.target.value))}
                          style={{ flex: 1, accentColor: 'var(--color-primary)' }}
                        />
                        <span style={{ minWidth: '40px', fontWeight: 'bold' }}>{thresholdLatency}ms</span>
                      </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
                      Save Threshold Override
                    </button>
                  </form>
                ) : (
                  <div style={{ color: 'var(--color-critical)', fontSize: '0.85rem', padding: '1.5rem 0' }}>
                    * Changing system alerting margins requires Admin Authority (switch Console Authority in sidebar).
                  </div>
                )}
              </div>

              {/* Maintenance Tasks */}
              <div className="glass-card">
                <h4 className="grid-title">Database Maintenance & Scopes</h4>
                <p className="chart-subtitle" style={{ marginBottom: '1.5rem' }}>
                  Wipe database and metrics logs history. Seeds baseline services and schedules mock traffic paths.
                </p>
                
                {role === 'Admin' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button 
                      className="btn-secondary"
                      style={{ borderColor: 'var(--color-critical)', color: 'var(--color-critical)' }}
                      onClick={handleResetSystem}
                    >
                      ☠ Reset and Re-seed SQLite Database
                    </button>
                    
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        fetch(`${API_BASE}/logs`, { method: 'GET' })
                          .then(() => showToast('Log database vacuum triggered successfully.', 'success'));
                      }}
                    >
                      ⎔ Run Database Vacuum Sync
                    </button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-critical)', fontSize: '0.85rem', padding: '1.5rem 0' }}>
                    * Wiping core database tables requires Admin Authority.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* INCIDENT DETAILS VIEW MODAL */}
      {selectedIncident && (
        <div className="modal-overlay" onClick={() => setSelectedIncident(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedIncident(null)}>×</button>
            
            <span className="inc-svc-name" style={{ fontSize: '0.8rem' }}>Incident room for: {selectedIncident.service_name}</span>
            <h2 className="workspace-title" style={{ fontSize: '1.4rem', marginTop: '0.25rem', marginBottom: '1rem' }}>
              {selectedIncident.title}
            </h2>

            <div className="incident-detail-split">
              {/* Left Column: Info and Discussion */}
              <div>
                <p className="alert-desc" style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>
                  {selectedIncident.description}
                </p>

                <h4 className="font-heading" style={{ fontSize: '1rem', marginTop: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                  Investigation Log Timeline
                </h4>
                
                <div className="timeline-feed">
                  {incidentNotes.map((note, idx) => (
                    <div key={idx} className="timeline-item">
                      <span className="t-author">{note.author}</span>
                      <span className="t-date">{new Date(note.created_at).toLocaleTimeString()}</span>
                      <div className="t-note-content">{note.note}</div>
                    </div>
                  ))}
                </div>

                {role !== 'Viewer' && (
                  <form onSubmit={handleAddNote} style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Add system updates or mitigation notes..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="form-control"
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn-primary">Post Note</button>
                  </form>
                )}
              </div>

              {/* Right Column: Actions and Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '1px solid rgba(255, 255, 255, 0.06)', paddingLeft: '1.5rem' }}>
                <div className="role-container">
                  <span className="role-label">Ticket Status</span>
                  <span className={`badge-status ${selectedIncident.status.toLowerCase()}`} style={{ display: 'inline-block', textAlign: 'center', padding: '0.35rem' }}>
                    {selectedIncident.status}
                  </span>
                </div>

                <div className="role-container">
                  <span className="role-label">ML Priority Assessment</span>
                  <span className={`badge-status ${selectedIncident.priority.toLowerCase()}`} style={{ display: 'inline-block', textAlign: 'center', padding: '0.35rem' }}>
                    {selectedIncident.priority}
                  </span>
                </div>

                <div className="role-container">
                  <span className="role-label">Created At</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(selectedIncident.created_at).toLocaleString()}
                  </span>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedIncident.status === 'Open' && role !== 'Viewer' && (
                    <button 
                      className="btn-primary"
                      onClick={() => handleAcknowledgeIncident(selectedIncident.id)}
                    >
                      Investigate Incident
                    </button>
                  )}
                  {selectedIncident.status === 'Investigating' && role !== 'Viewer' && (
                    <button 
                      className="btn-primary"
                      style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                      onClick={() => handleResolveIncident(selectedIncident.id)}
                    >
                      Resolve Incident
                    </button>
                  )}
                  <button 
                    className="btn-secondary"
                    onClick={() => setSelectedIncident(null)}
                  >
                    Close Window
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK OVERLAY / DIALOG */}
      {feedbackTarget && (
        <div className="modal-overlay" onClick={() => setFeedbackTarget(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setFeedbackTarget(null)}>×</button>
            
            <h3 className="workspace-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              Tuning Anomaly Sensitivities
            </h3>
            
            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="role-container">
                <span className="role-label">Target Service Node</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{feedbackTarget.service_id}</span>
              </div>

              <div className="role-container">
                <span className="role-label">Assessment Override</span>
                <div className="flex-gap-md" style={{ marginTop: '0.25rem' }}>
                  <label className="flex-gap-sm" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="radio" 
                      name="fbType" 
                      value="false_positive"
                      checked={feedbackType === 'false_positive'}
                      onChange={() => setFeedbackType('false_positive')}
                    />
                    False Positive (Lower Sensitivity)
                  </label>
                  <label className="flex-gap-sm" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="radio" 
                      name="fbType" 
                      value="useful"
                      checked={feedbackType === 'useful'}
                      onChange={() => setFeedbackType('useful')}
                    />
                    Useful Alert (Increase Sensitivity)
                  </label>
                </div>
              </div>

              <div className="role-container">
                <span className="role-label">Operator Notes / Comments</span>
                <textarea 
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="text-area"
                  placeholder="Provide context regarding the false alarm or critical nature..."
                  required
                />
              </div>

              <div className="flex-gap-md" style={{ justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setFeedbackTarget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Apply Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
