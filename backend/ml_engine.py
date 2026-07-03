import numpy as np
import re
import json
import sqlite3
import os

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, 'ops_platform.db')

HAS_SKLEARN = False
try:
    from sklearn.ensemble import IsolationForest
    HAS_SKLEARN = True
except ImportError:
    pass

# --- METRICS ANOMALY DETECTION ENGINE ---

def detect_metric_anomalies(service_id: str, current_metrics: dict, z_threshold: float = 3.0) -> list:
    """
    Analyzes current metrics against historical data for a service using rolling Z-Score.
    If sklearn is available, also runs Isolation Forest on the combined metrics space.
    Returns a list of detected anomalies. Each anomaly is a dict containing:
      - metric_type (cpu, latency, error_rate, etc.)
      - z_score
      - current_value
      - baseline_mean
      - explanation
    """
    anomalies = []
    
    # 1. Fetch historical metrics (up to last 100 points)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT cpu, memory, request_count, latency, error_rate
        FROM metrics
        WHERE service_id = ?
        ORDER BY timestamp DESC
        LIMIT 100
    """, (service_id,))
    rows = cursor.fetchall()
    conn.close()
    
    if len(rows) < 10:
        # Not enough history to detect anomalies
        return anomalies
        
    history = np.array(rows)
    # Columns: 0=cpu, 1=memory, 2=request_count, 3=latency, 4=error_rate
    
    # Check individual metrics
    metrics_mapping = {
        "cpu": {"idx": 0, "name": "CPU Usage", "unit": "%"},
        "memory": {"idx": 1, "name": "Memory Utilization", "unit": "%"},
        "request_count": {"idx": 2, "name": "Request Count", "unit": " req/sec"},
        "latency": {"idx": 3, "name": "Response Latency", "unit": "ms"},
        "error_rate": {"idx": 4, "name": "Error Rate", "unit": "%"}
    }
    
    for metric_key, config in metrics_mapping.items():
        curr_val = current_metrics.get(metric_key)
        if curr_val is None:
            continue
            
        hist_vals = history[:, config["idx"]]
        mean = np.mean(hist_vals)
        std = np.std(hist_vals)
        
        # Avoid division by zero
        if std == 0:
            std = 0.1
            
        z_val = (curr_val - mean) / std
        
        # We only flag positive spikes as anomalies for CPU, memory, latency, and error_rate.
        # For request count, both extreme spikes or sudden drops could be anomalies.
        is_anomaly = False
        if metric_key in ["cpu", "memory", "latency", "error_rate"] and z_val > z_threshold:
            is_anomaly = True
        elif metric_key == "request_count" and abs(z_val) > z_threshold:
            is_anomaly = True
            
        if is_anomaly:
            # Generate description
            ratio = curr_val / mean if mean > 0 else 0
            if ratio >= 1.5:
                exp = f"{config['name']} is {ratio:.1f}x higher than baseline mean ({mean:.1f}{config['unit']})"
            else:
                exp = f"{config['name']} is elevated at {curr_val:.1f}{config['unit']} (baseline: {mean:.1f}{config['unit']})"
                
            anomalies.append({
                "metric_type": metric_key,
                "z_score": round(float(z_val), 2),
                "current_value": float(curr_val),
                "baseline_mean": round(float(mean), 2),
                "explanation": exp
            })
            
    # 2. Advanced Multi-variate Anomaly Detection (Isolation Forest)
    if HAS_SKLEARN and len(rows) >= 20:
        try:
            # Train a fast Isolation Forest on history
            # Contamination represents expected proportion of outliers in seed
            clf = IsolationForest(contamination=0.03, random_state=42)
            clf.fit(history)
            
            # Predict for current metrics
            curr_vec = np.array([[
                current_metrics.get("cpu", 0),
                current_metrics.get("memory", 0),
                current_metrics.get("request_count", 0),
                current_metrics.get("latency", 0),
                current_metrics.get("error_rate", 0)
            ]])
            
            prediction = clf.predict(curr_vec)
            # prediction is -1 for anomaly, 1 for normal
            
            if prediction[0] == -1:
                # Check if we didn't already catch this via simple Z-score.
                # If not, add a multi-variate system anomaly
                if not anomalies:
                    anomalies.append({
                        "metric_type": "system",
                        "z_score": 3.5, # generic score for multivariate
                        "current_value": 0.0,
                        "baseline_mean": 0.0,
                        "explanation": "Isolation Forest flagged abnormal multi-variate system metric signature."
                    })
        except Exception:
            pass # Fall back to Z-scores if fitting fails
            
    return anomalies


# --- LOG CLASSIFICATION ENGINE ---

SUSPICIOUS_KEYWORDS = [
    (r"(?i)brute-force", "Brute-force security mitigation triggered"),
    (r"(?i)sql\s+syntax|sql\s+injection", "Possible SQL injection attack vector"),
    (r"(?i)out\s+of\s+memory|heap\s+allocation", "Heap out-of-memory crash warning"),
    (r"(?i)deadlock\s+detected", "Database concurrency lock deadlock"),
    (r"(?i)unauthorized|credential|access\s+denied|forbidden", "Access violation attempt"),
    (r"(?i)port\s+scan|hacked|exploit", "Malicious activity footprint")
]

WARNING_KEYWORDS = [
    (r"(?i)slow\s+response|high\s+latency", "Performance bottleneck"),
    (r"(?i)connection\s+pool|exhausted", "DB connections approaching limit"),
    (r"(?i)disk\s+space|utilization\s+at\s+8\d%", "Disk storage warning"),
    (r"(?i)timeout", "Network transmission timeout"),
    (r"(?i)gc\s+took|garbage\s+collection", "JVM/Runtime execution delay")
]

def classify_log_entry(message: str, severity: str) -> tuple:
    """
    Classifies a log message into 'Normal', 'Warning', or 'Suspicious'
    using pattern-matching and NLP concepts.
    Returns: (classification, matched_pattern)
    """
    # 1. Check severe security or resource conditions first (Suspicious)
    for pattern, descriptor in SUSPICIOUS_KEYWORDS:
        if re.search(pattern, message):
            return "Suspicious", descriptor
            
    # 2. Check warning parameters (Warning)
    for pattern, descriptor in WARNING_KEYWORDS:
        if re.search(pattern, message):
            return "Warning", descriptor
            
    # 3. Check base level severity
    if severity.upper() == "ERROR":
        return "Suspicious", "Error Severity Flag"
    elif severity.upper() == "WARNING":
        return "Warning", "Warning Severity Flag"
        
    return "Normal", "Standard Operation Pattern"


# --- ALERT PRIORITIZATION ENGINE ---

def prioritize_alert(service_id: str, anomaly: dict, service_tier: int, error_rate: float) -> tuple:
    """
    Scores an anomaly to rank it against other alerts.
    Returns: (score, priority_level)
      - score: 0 to 100
      - priority_level: Low, Medium, High, Critical
    """
    # Base score determined by the extent of Z-Score deviation
    # E.g., Z-score of 3.0 -> 30, Z-score of 6.0 -> 60
    base_score = min(70, max(20, anomaly.get("z_score", 3.0) * 10))
    
    # Service Tier Multiplier
    # Tier 1: Core paths -> 1.5x score
    # Tier 2: Non-core -> 1.0x score
    # Tier 3: Internal/Async batch -> 0.6x score
    tier_multipliers = {1: 1.5, 2: 1.0, 3: 0.6}
    multiplier = tier_multipliers.get(service_tier, 1.0)
    
    score = base_score * multiplier
    
    # Error rate modifier
    # If the error rate is high, this escalates importance dramatically
    if error_rate > 0.05: # >5% errors
        score += 25
    elif anomaly.get("metric_type") == "error_rate":
        score += 15
        
    # Cap the final score at 100 and floor at 0
    score = min(100.0, max(0.0, score))
    
    # Priority Level assignment
    if score >= 75.0:
        priority = "Critical"
    elif score >= 50.0:
        priority = "High"
    elif score >= 25.0:
        priority = "Medium"
    else:
        priority = "Low"
        
    return round(score, 1), priority


# --- DEPLOYMENT RISK MODULE ---

def evaluate_deployment_risk(service_id: str, version: str, description: str) -> dict:
    """
    Analyzes potential deployment risk before code is rolled out.
    Evaluates:
      - Service tier
      - Complexity of modifications (via description text)
      - Past deployment failures of the service
      - Current metric instability (if target service has active alerts)
    Returns:
      - risk_score (0-100)
      - risk_level (Low, Medium, High)
      - risk_factors (list of strings explaining risk)
    """
    risk_score = 15.0 # baseline risk
    risk_factors = []
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Service Tier impact
    cursor.execute("SELECT tier, status FROM services WHERE id = ?", (service_id,))
    svc_row = cursor.fetchone()
    if svc_row:
        tier, status = svc_row
        if tier == 1:
            risk_score += 20
            risk_factors.append("Target service lies on the Critical Tier-1 Path.")
        if status != "healthy":
            risk_score += 15
            risk_factors.append("Target service currently displays unstable metrics or active issues.")
            
    # 2. Historical deployment failures
    cursor.execute("""
        SELECT status
        FROM deployments
        WHERE service_id = ?
        ORDER BY created_at DESC
        LIMIT 10
    """, (service_id,))
    deploys = cursor.fetchall()
    
    if deploys:
        failed_count = sum(1 for d in deploys if d[0] == "Failed")
        fail_rate = failed_count / len(deploys)
        if fail_rate > 0.20:
            risk_score += 20
            risk_factors.append(f"High historical deployment failure rate ({fail_rate*100:.0f}%) in last {len(deploys)} rollouts.")
            
    conn.close()
    
    # 3. Code change scope analysis (from description)
    desc_lower = description.lower()
    if "schema" in desc_lower or "migration" in desc_lower or "database" in desc_lower:
        risk_score += 25
        risk_factors.append("Includes database schema changes or data migrations.")
    if "auth" in desc_lower or "security" in desc_lower or "encryption" in desc_lower or "token" in desc_lower:
        risk_score += 15
        risk_factors.append("Alters authentication, cryptography or security credentials.")
    if "override" in desc_lower or "refactor" in desc_lower or "rewrite" in desc_lower:
        risk_score += 10
        risk_factors.append("Contains large-scale module rewrite or refactoring.")
        
    # Cap score
    risk_score = min(100.0, max(0.0, risk_score))
    
    if risk_score >= 70.0:
        level = "High"
    elif risk_score >= 35.0:
        level = "Medium"
    else:
        level = "Low"
        
    if not risk_factors:
        risk_factors.append("Standard rollout update with minimal configuration changes.")
        
    return {
        "risk_score": round(risk_score, 1),
        "risk_level": level,
        "risk_factors": risk_factors
    }
