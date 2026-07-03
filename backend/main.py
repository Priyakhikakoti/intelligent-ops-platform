import os
import json
import sqlite3
import random
import threading
import time
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import DB_PATH
import ml_engine

app = FastAPI(title="Intelligent Engineering Operations Platform API")

# Setup CORS to allow React dev server connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to query DB
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- REQUEST MODELS ---

class IncidentCreate(BaseModel):
    service_id: str
    title: str
    description: str
    priority: str
    severity: str

class IncidentUpdateStatus(BaseModel):
    status: str # Open, Investigating, Resolved

class NoteCreate(BaseModel):
    author: str
    note: str

class DeploymentCreate(BaseModel):
    service_id: str
    version: str
    deployed_by: str
    description: str

class AlertFeedbackCreate(BaseModel):
    service_id: str
    metric_type: str
    feedback_type: str # useful, false_positive
    user_comment: str

class ThresholdUpdate(BaseModel):
    alert_threshold_cpu: float
    alert_threshold_latency: float

# --- SIMULATOR CONTROLLER STATE ---
SIMULATION_ACTIVE = True
SIMULATION_TICK_SECONDS = 5
simulation_thread = None

# Active simulated scenarios triggered by timer or user actions
# E.g. {"gateway-service": {"type": "high-cpu", "cycles_left": 5}}
ACTIVE_SCENARIOS = {}

# Feedback-adjusted multiplier cache
# E.g. {"gateway-service": {"cpu": 1.2}} -> raises effective CPU threshold
FEEDBACK_THRESHOLD_MULTIPLIERS = {}

def load_feedback_multipliers():
    """Reads feedbacks to adjust anomaly threshold tolerances dynamically."""
    global FEEDBACK_THRESHOLD_MULTIPLIERS
    FEEDBACK_THRESHOLD_MULTIPLIERS = {}
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT service_id, metric_type, feedback_type FROM alert_feedback")
        rows = cursor.fetchall()
        conn.close()
        
        for r in rows:
            svc = r["service_id"]
            metric = r["metric_type"]
            f_type = r["feedback_type"]
            
            if svc not in FEEDBACK_THRESHOLD_MULTIPLIERS:
                FEEDBACK_THRESHOLD_MULTIPLIERS[svc] = {}
                
            if metric not in FEEDBACK_THRESHOLD_MULTIPLIERS[svc]:
                FEEDBACK_THRESHOLD_MULTIPLIERS[svc][metric] = 1.0
                
            # If marked false positive, increase threshold (make it less sensitive)
            if f_type == "false_positive":
                FEEDBACK_THRESHOLD_MULTIPLIERS[svc][metric] += 0.25 # Increase threshold limit by 25%
            # If marked useful, decrease threshold (make it more sensitive)
            elif f_type == "useful":
                FEEDBACK_THRESHOLD_MULTIPLIERS[svc][metric] = max(0.5, FEEDBACK_THRESHOLD_MULTIPLIERS[svc][metric] - 0.15)
    except Exception as e:
        print("Failed to load feedback multipliers:", e)

# Run background simulator loop
def run_telemetry_simulator():
    global SIMULATION_ACTIVE, ACTIVE_SCENARIOS
    print("Background Telemetry Simulator Thread Started.")
    
    while SIMULATION_ACTIVE:
        try:
            # 1. Reload feedback metrics to adjust sensitivity in real-time
            load_feedback_multipliers()
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Fetch services list
            cursor.execute("SELECT id, name, tier, alert_threshold_cpu, alert_threshold_latency, status FROM services")
            services = [dict(r) for r in cursor.fetchall()]
            
            now = datetime.now()
            time_str = now.isoformat()
            
            # Sometimes (5% chance) trigger a random scenario on a random service if none is running
            if not ACTIVE_SCENARIOS and random.random() < 0.08:
                victim = random.choice(services)
                victim_id = victim["id"]
                # Scenarios: high-cpu, high-latency, error-rate-jump
                scen_type = random.choice(["high-cpu", "high-latency", "error-rate-jump"])
                ACTIVE_SCENARIOS[victim_id] = {
                    "type": scen_type,
                    "cycles_left": random.randint(4, 7),
                    "started_by": "random_generator"
                }
                
            # Process each service
            for s in services:
                svc_id = s["id"]
                tier = s["tier"]
                
                # Base metrics
                cpu = random.uniform(10.0, 30.0)
                mem = random.uniform(40.0, 60.0)
                req = random.uniform(300.0, 600.0) if svc_id != "notification-service" else random.uniform(10.0, 50.0)
                lat = random.uniform(10.0, 50.0) if svc_id == "database-cluster" else random.uniform(40.0, 100.0)
                err = random.uniform(0.0, 0.005)
                
                status = "healthy"
                
                # Modify based on active scenarios
                if svc_id in ACTIVE_SCENARIOS:
                    scen = ACTIVE_SCENARIOS[svc_id]
                    stype = scen["type"]
                    
                    if stype == "high-cpu":
                        cpu = random.uniform(82.0, 96.0)
                        lat += 80.0 # CPU spike slows response times
                        status = "warning"
                    elif stype == "high-latency":
                        lat = s["alert_threshold_latency"] * random.uniform(1.2, 2.0)
                        cpu += 15.0 # Processing slow requests takes some extra CPU
                        status = "warning"
                    elif stype == "error-rate-jump":
                        err = random.uniform(0.08, 0.22)
                        cpu += 10.0
                        status = "critical"
                        
                    # Decrement scenario cycles
                    scen["cycles_left"] -= 1
                    if scen["cycles_left"] <= 0:
                        del ACTIVE_SCENARIOS[svc_id]
                
                # Dynamic Feedback multiplier adjustments
                # e.g., if CPU threshold was 80, but user gave feedback, multiply limit
                cpu_mult = FEEDBACK_THRESHOLD_MULTIPLIERS.get(svc_id, {}).get("cpu", 1.0)
                lat_mult = FEEDBACK_THRESHOLD_MULTIPLIERS.get(svc_id, {}).get("latency", 1.0)
                err_mult = FEEDBACK_THRESHOLD_MULTIPLIERS.get(svc_id, {}).get("error_rate", 1.0)
                
                # Call ML anomaly detector
                metrics_payload = {"cpu": cpu, "memory": mem, "request_count": req, "latency": lat, "error_rate": err}
                
                # Z-Score sensitivity factor adjusted by multipliers
                anomalies = ml_engine.detect_metric_anomalies(svc_id, metrics_payload, z_threshold=3.0 * cpu_mult)
                
                # Check for thresholds
                is_anomalous = len(anomalies) > 0
                
                # Log writing
                severity = "INFO"
                log_msg = f"Health check passed. CPU: {cpu:.1f}%, Latency: {lat:.1f}ms, Request Count: {req:.0f}/s"
                
                if is_anomalous:
                    severity = "WARNING"
                    primary_anomaly = anomalies[0]
                    log_msg = f"Alert Triggered! Anomaly detected in {primary_anomaly['metric_type']}. {primary_anomaly['explanation']}"
                    
                    # If it's a critical error rate or massive latency jump, mark ERROR
                    if err > 0.05 or lat > (s["alert_threshold_latency"] * 1.5):
                        severity = "ERROR"
                        status = "critical"
                    else:
                        status = "warning"
                        
                    # 2. Prioritize Alert
                    score, priority_level = ml_engine.prioritize_alert(svc_id, primary_anomaly, tier, err)
                    
                    # 3. Write incident to DB automatically if not already existing for this service
                    cursor.execute("""
                        SELECT id FROM incidents 
                        WHERE service_id = ? AND status IN ('Open', 'Investigating')
                    """, (svc_id,))
                    existing_inc = cursor.fetchone()
                    
                    if not existing_inc and priority_level in ["High", "Critical"]:
                        # Auto-spawn incident ticket
                        inc_id = f"inc-{int(time.time())}-{random.randint(10,99)}"
                        title = f"Automated Alert: High {primary_anomaly['metric_type'].upper()} on {s['name']}"
                        desc = f"ML Engine flagged abnormal metric: {primary_anomaly['explanation']}. Prioritization score: {score}/100."
                        
                        cursor.execute("""
                            INSERT INTO incidents (id, service_id, title, description, status, priority, severity, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (inc_id, svc_id, title, desc, "Open", priority_level, "Critical" if priority_level == "Critical" else "Warning", time_str, time_str))
                        
                        # Add system note
                        cursor.execute("""
                            INSERT INTO incident_notes (incident_id, author, note, created_at)
                            VALUES (?, ?, ?, ?)
                        """, (inc_id, "ML-Engine Daemon", f"Incident ticket auto-generated. Active anomaly score: {score}. Service owner notified.", time_str))
                        
                # Update service status in DB
                cursor.execute("UPDATE services SET status = ? WHERE id = ?", (status, svc_id))
                
                # Write current metric values to metrics history
                cursor.execute("""
                    INSERT OR REPLACE INTO metrics (service_id, timestamp, cpu, memory, request_count, latency, error_rate)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (svc_id, time_str, round(cpu, 2), round(mem, 2), round(req, 1), round(lat, 2), round(err, 4)))
                
                # Classify log and write to log DB
                log_classification, matched_pat = ml_engine.classify_log_entry(log_msg, severity)
                cursor.execute("""
                    INSERT INTO logs (service_id, timestamp, severity, message, classification, matched_pattern)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (svc_id, time_str, severity, log_msg, log_classification, matched_pat))
                
            # Keep database clean: delete logs and metrics older than 24 hours
            cutoff_time = (now - timedelta(hours=24)).isoformat()
            cursor.execute("DELETE FROM metrics WHERE timestamp < ?", (cutoff_time,))
            cursor.execute("DELETE FROM logs WHERE timestamp < ?", (cutoff_time,))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print("Telemetry Simulator encountered error:", e)
            
        time.sleep(SIMULATION_TICK_SECONDS)
        
    print("Background Telemetry Simulator Thread Stopped.")

# Startup handler
@app.on_event("startup")
def startup_event():
    # Automatically initialize database if it doesn't exist (e.g., on Render clean deploy)
    if not os.path.exists(DB_PATH):
        print("Database file not found. Auto-initializing SQLite tables...")
        try:
            from database import init_db
            init_db()
            print("Database successfully initialized.")
        except Exception as e:
            print("Failed to auto-initialize database:", e)

    global simulation_thread
    # Start telemetry simulator daemon thread
    simulation_thread = threading.Thread(target=run_telemetry_simulator, daemon=True)
    simulation_thread.start()

# Shutdown handler
@app.on_event("shutdown")
def shutdown_event():
    global SIMULATION_ACTIVE
    SIMULATION_ACTIVE = False

# --- REST ENDPOINTS ---

# Helper to check headers for basic roles
# Mock authentication by passing user-role in request header 'X-User-Role'
def get_user_role(x_user_role: Optional[str] = Header(None)) -> str:
    # Default to Viewer if not provided
    return x_user_role or "Viewer"

def verify_role_permission(required_roles: List[str], current_role: str):
    if current_role not in required_roles:
        raise HTTPException(
            status_code=403,
            detail=f"Access Denied: Current role '{current_role}' does not have permission. Required roles: {required_roles}."
        )

@app.get("/api/health")
def health():
    return {"status": "healthy", "simulator_running": SIMULATION_ACTIVE}

# Services Endpoints
@app.get("/api/services")
def get_services():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Query services and attach their active incident counts
    cursor.execute("""
        SELECT s.id, s.name, s.tier, s.owner, s.uptime_percent, s.status, 
               s.alert_threshold_cpu, s.alert_threshold_latency,
               COUNT(i.id) as active_incidents
        FROM services s
        LEFT JOIN incidents i ON s.id = i.service_id AND i.status IN ('Open', 'Investigating')
        GROUP BY s.id
    """)
    rows = cursor.fetchall()
    services = [dict(r) for r in rows]
    conn.close()
    return services

@app.put("/api/services/{service_id}/thresholds")
def update_thresholds(service_id: str, payload: ThresholdUpdate, role: str = Header("Viewer")):
    verify_role_permission(["Admin"], role)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE services 
        SET alert_threshold_cpu = ?, alert_threshold_latency = ?
        WHERE id = ?
    """, (payload.alert_threshold_cpu, payload.alert_threshold_latency, service_id))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Thresholds updated for {service_id}"}

# Metrics Endpoints
@app.get("/api/services/{service_id}/metrics")
def get_service_metrics(service_id: str, limit: int = 60):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT timestamp, cpu, memory, request_count, latency, error_rate
        FROM metrics
        WHERE service_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    """, (service_id, limit))
    rows = cursor.fetchall()
    conn.close()
    # Reverse to return chronological order for charts
    return [dict(r) for r in reversed(rows)]

# Logs Endpoints
@app.get("/api/logs")
def get_logs(
    service_id: Optional[str] = None, 
    severity: Optional[str] = None, 
    classification: Optional[str] = None, 
    search: Optional[str] = None,
    limit: int = 100
):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT id, service_id, timestamp, severity, message, classification, matched_pattern FROM logs WHERE 1=1"
    params = []
    
    if service_id:
        query += " AND service_id = ?"
        params.append(service_id)
    if severity:
        query += " AND severity = ?"
        params.append(severity)
    if classification:
        query += " AND classification = ?"
        params.append(classification)
    if search:
        query += " AND message LIKE ?"
        params.append(f"%{search}%")
        
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# Incidents Endpoints
@app.get("/api/incidents")
def get_incidents(status: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = """
        SELECT i.id, i.service_id, i.title, i.description, i.status, i.priority, i.severity, i.created_at, i.updated_at,
               s.name as service_name
        FROM incidents i
        JOIN services s ON i.service_id = s.id
    """
    params = []
    
    if status:
        query += " WHERE i.status = ?"
        params.append(status)
        
    query += " ORDER BY i.created_at DESC"
    
    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/incidents")
def create_incident(payload: IncidentCreate, role: str = Header("Viewer")):
    verify_role_permission(["Operator", "Admin"], role)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    inc_id = f"inc-{int(time.time())}-{random.randint(10,99)}"
    time_str = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT INTO incidents (id, service_id, title, description, status, priority, severity, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (inc_id, payload.service_id, payload.title, payload.description, "Open", payload.priority, payload.severity, time_str, time_str))
    
    cursor.execute("""
        INSERT INTO incident_notes (incident_id, author, note, created_at)
        VALUES (?, ?, ?, ?)
    """, (inc_id, "System", f"Incident ticket created manually by {role}.", time_str))
    
    conn.commit()
    conn.close()
    return {"status": "success", "incident_id": inc_id}

@app.patch("/api/incidents/{incident_id}")
def update_incident_status(incident_id: str, payload: IncidentUpdateStatus, role: str = Header("Viewer")):
    verify_role_permission(["Operator", "Admin"], role)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    time_str = datetime.now().isoformat()
    
    cursor.execute("""
        UPDATE incidents 
        SET status = ?, updated_at = ?
        WHERE id = ?
    """, (payload.status, time_str, incident_id))
    
    cursor.execute("""
        INSERT INTO incident_notes (incident_id, author, note, created_at)
        VALUES (?, ?, ?, ?)
    """, (incident_id, "System", f"Status changed to '{payload.status}' by {role}.", time_str))
    
    # If resolving, update target service health status to healthy
    if payload.status == "Resolved":
        cursor.execute("SELECT service_id FROM incidents WHERE id = ?", (incident_id,))
        inc_svc = cursor.fetchone()
        if inc_svc:
            cursor.execute("UPDATE services SET status = 'healthy' WHERE id = ?", (inc_svc[0],))
            
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.get("/api/incidents/{incident_id}/notes")
def get_incident_notes(incident_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT author, note, created_at
        FROM incident_notes
        WHERE incident_id = ?
        ORDER BY created_at ASC
    """, (incident_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/incidents/{incident_id}/notes")
def add_incident_note(incident_id: str, payload: NoteCreate, role: str = Header("Viewer")):
    verify_role_permission(["Operator", "Admin"], role)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    time_str = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT INTO incident_notes (incident_id, author, note, created_at)
        VALUES (?, ?, ?, ?)
    """, (incident_id, payload.author, payload.note, time_str))
    
    conn.commit()
    conn.close()
    return {"status": "success"}

# Deployments Endpoints
@app.get("/api/deployments")
def get_deployments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT d.id, d.service_id, d.version, d.deployed_by, d.risk_score, d.risk_level, d.risk_factors, d.status, d.created_at,
               s.name as service_name
        FROM deployments d
        JOIN services s ON d.service_id = s.id
        ORDER BY d.created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        d = dict(r)
        try:
            d["risk_factors"] = json.loads(d["risk_factors"])
        except Exception:
            d["risk_factors"] = []
        result.append(d)
        
    return result

@app.post("/api/deployments/analyze-risk")
def analyze_deployment_risk(payload: DeploymentCreate):
    risk_info = ml_engine.evaluate_deployment_risk(payload.service_id, payload.version, payload.description)
    return risk_info

@app.post("/api/deployments")
def trigger_deployment(payload: DeploymentCreate, role: str = Header("Viewer")):
    verify_role_permission(["Admin"], role)
    
    # 1. Evaluate risk
    risk_info = ml_engine.evaluate_deployment_risk(payload.service_id, payload.version, payload.description)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    deploy_id = f"deploy-{int(time.time())}"
    time_str = datetime.now().isoformat()
    
    # 2. Insert into database
    cursor.execute("""
        INSERT INTO deployments (id, service_id, version, deployed_by, risk_score, risk_level, risk_factors, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (deploy_id, payload.service_id, payload.version, payload.deployed_by, 
          risk_info["risk_score"], risk_info["risk_level"], json.dumps(risk_info["risk_factors"]), "Succeeded", time_str))
    
    conn.commit()
    conn.close()
    
    # 3. Simulate deployment impact in background scenario scheduler
    # High Risk deployment has 70% chance of failing and spawning incidents in 5 seconds
    # Medium Risk has 30% chance
    # Low Risk has 0% chance
    roll = random.random()
    if risk_info["risk_level"] == "High" and roll < 0.70:
        ACTIVE_SCENARIOS[payload.service_id] = {
            "type": "error-rate-jump",
            "cycles_left": 6,
            "started_by": "deployment_failure"
        }
    elif risk_info["risk_level"] == "Medium" and roll < 0.30:
        ACTIVE_SCENARIOS[payload.service_id] = {
            "type": "high-latency",
            "cycles_left": 4,
            "started_by": "deployment_latency"
        }
        
    return {"status": "success", "deploy_id": deploy_id, "risk": risk_info}

# Feedback Loop endpoint
@app.post("/api/feedback")
def submit_feedback(payload: AlertFeedbackCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    time_str = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT INTO alert_feedback (service_id, metric_type, feedback_type, user_comment, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (payload.service_id, payload.metric_type, payload.feedback_type, payload.user_comment, time_str))
    
    conn.commit()
    conn.close()
    
    # Force reload of multipliers immediately
    load_feedback_multipliers()
    return {"status": "success"}

@app.post("/api/reset-data")
def reset_database(role: str = Header("Viewer")):
    verify_role_permission(["Admin"], role)
    from database import init_db
    init_db()
    # Reset local simulation scenarios
    global ACTIVE_SCENARIOS
    ACTIVE_SCENARIOS = {}
    load_feedback_multipliers()
    return {"status": "success", "message": "Database successfully reset and seeded."}
