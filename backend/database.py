import sqlite3
import os
import json
import random
from datetime import datetime, timedelta

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, 'ops_platform.db')

SERVICES_SEED = [
    {
        "id": "gateway-service",
        "name": "API Gateway",
        "tier": 1,
        "owner": "Edge Team",
        "uptime_percent": 99.98,
        "status": "healthy",
        "alert_threshold_cpu": 85.0,
        "alert_threshold_latency": 250.0
    },
    {
        "id": "auth-service",
        "name": "Authentication API",
        "tier": 1,
        "owner": "Security Guild",
        "uptime_percent": 99.95,
        "status": "healthy",
        "alert_threshold_cpu": 80.0,
        "alert_threshold_latency": 150.0
    },
    {
        "id": "payment-api",
        "name": "Payment Gateway Integration",
        "tier": 1,
        "owner": "Finance Core",
        "uptime_percent": 99.90,
        "status": "healthy",
        "alert_threshold_cpu": 75.0,
        "alert_threshold_latency": 500.0
    },
    {
        "id": "search-service",
        "name": "Search & Catalog Indexer",
        "tier": 2,
        "owner": "Discovery Crew",
        "uptime_percent": 99.85,
        "status": "healthy",
        "alert_threshold_cpu": 90.0,
        "alert_threshold_latency": 300.0
    },
    {
        "id": "database-cluster",
        "name": "Main SQL Replication Cluster",
        "tier": 1,
        "owner": "DBA & Cloud Infra",
        "uptime_percent": 99.99,
        "status": "healthy",
        "alert_threshold_cpu": 80.0,
        "alert_threshold_latency": 50.0
    },
    {
        "id": "notification-service",
        "name": "Batch Notifications Dispatcher",
        "tier": 3,
        "owner": "Engagement Squad",
        "uptime_percent": 99.20,
        "status": "healthy",
        "alert_threshold_cpu": 95.0,
        "alert_threshold_latency": 1000.0
    }
]

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Drop tables if they exist to clean-slate for new project
    cursor.execute("DROP TABLE IF EXISTS services")
    cursor.execute("DROP TABLE IF EXISTS metrics")
    cursor.execute("DROP TABLE IF EXISTS logs")
    cursor.execute("DROP TABLE IF EXISTS incidents")
    cursor.execute("DROP TABLE IF EXISTS incident_notes")
    cursor.execute("DROP TABLE IF EXISTS deployments")
    cursor.execute("DROP TABLE IF EXISTS alert_feedback")
    
    # 1. Services Schema
    cursor.execute("""
    CREATE TABLE services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tier INTEGER NOT NULL,
        owner TEXT NOT NULL,
        uptime_percent REAL NOT NULL,
        status TEXT NOT NULL,
        alert_threshold_cpu REAL NOT NULL,
        alert_threshold_latency REAL NOT NULL
    )
    """)
    
    # 2. Metrics Schema
    cursor.execute("""
    CREATE TABLE metrics (
        service_id TEXT,
        timestamp TEXT,
        cpu REAL,
        memory REAL,
        request_count REAL,
        latency REAL,
        error_rate REAL,
        PRIMARY KEY (service_id, timestamp)
    )
    """)
    
    # 3. Logs Schema
    cursor.execute("""
    CREATE TABLE logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id TEXT,
        timestamp TEXT,
        severity TEXT,
        message TEXT,
        classification TEXT,
        matched_pattern TEXT
    )
    """)
    
    # 4. Incidents Schema
    cursor.execute("""
    CREATE TABLE incidents (
        id TEXT PRIMARY KEY,
        service_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL, -- Open, Investigating, Resolved
        priority TEXT NOT NULL, -- Low, Medium, High, Critical
        severity TEXT NOT NULL, -- Warning, Critical
        created_at TEXT,
        updated_at TEXT
    )
    """)
    
    # 5. Incident Notes Schema
    cursor.execute("""
    CREATE TABLE incident_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id TEXT,
        author TEXT,
        note TEXT,
        created_at TEXT
    )
    """)
    
    # 6. Deployments Schema
    cursor.execute("""
    CREATE TABLE deployments (
        id TEXT PRIMARY KEY,
        service_id TEXT,
        version TEXT NOT NULL,
        deployed_by TEXT,
        risk_score REAL,
        risk_level TEXT,
        risk_factors TEXT, -- JSON string list of strings
        status TEXT, -- Succeeded, Failed, Active
        created_at TEXT
    )
    """)
    
    # 7. Alert Feedback Schema (User overrides / tunes ML threshold)
    cursor.execute("""
    CREATE TABLE alert_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id TEXT,
        metric_type TEXT, -- cpu, latency, error_rate
        feedback_type TEXT, -- useful, false_positive
        user_comment TEXT,
        created_at TEXT
    )
    """)
    
    # --- SEEDING DATA ---
    # Seed Services
    for s in SERVICES_SEED:
        cursor.execute("""
            INSERT INTO services (id, name, tier, owner, uptime_percent, status, alert_threshold_cpu, alert_threshold_latency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (s["id"], s["name"], s["tier"], s["owner"], s["uptime_percent"], s["status"], s["alert_threshold_cpu"], s["alert_threshold_latency"]))
        
    # Generate 12 hours of historical metrics for each service (5-min intervals = 144 points per service)
    now = datetime.now()
    base_metrics = {
        "gateway-service": {"cpu": 15.0, "mem": 45.0, "req": 1200.0, "lat": 45.0, "err": 0.01},
        "auth-service": {"cpu": 20.0, "mem": 55.0, "req": 600.0, "lat": 60.0, "err": 0.005},
        "payment-api": {"cpu": 12.0, "mem": 40.0, "req": 150.0, "lat": 180.0, "err": 0.02},
        "search-service": {"cpu": 35.0, "mem": 70.0, "req": 400.0, "lat": 120.0, "err": 0.05},
        "database-cluster": {"cpu": 25.0, "mem": 65.0, "req": 3000.0, "lat": 8.0, "err": 0.001},
        "notification-service": {"cpu": 40.0, "mem": 30.0, "req": 80.0, "lat": 250.0, "err": 0.10}
    }
    
    random.seed(42) # Deterministic seeding
    
    for service_id, base in base_metrics.items():
        metrics_rows = []
        for i in range(144):
            time_offset = now - timedelta(minutes=5 * (144 - i))
            time_str = time_offset.isoformat()
            
            # Simulate slight time-of-day traffic waves
            hour_factor = 0.5 + 0.5 * abs(12 - time_offset.hour) / 12.0
            
            # Normal variance
            cpu = max(5.0, min(100.0, base["cpu"] * hour_factor + random.uniform(-5, 5)))
            mem = max(10.0, min(100.0, base["mem"] + random.uniform(-2, 2)))
            req = max(10.0, base["req"] * hour_factor + random.uniform(-20, 20))
            lat = max(2.0, base["lat"] + random.uniform(-10, 10))
            err = max(0.0, base["err"] + random.uniform(-0.02, 0.02))
            
            # Inject small historical anomaly for visualization context (e.g. 6 hours ago on gateway-service)
            if service_id == "gateway-service" and 60 < i < 66:
                # CPU spike and high latency
                cpu += 50.0
                lat += 180.0
                err += 0.08
                
            if service_id == "database-cluster" and 100 < i < 105:
                # DB lock spike
                cpu += 45.0
                lat += 35.0
                err += 0.05
                
            metrics_rows.append((service_id, time_str, round(cpu, 2), round(mem, 2), round(req, 1), round(lat, 2), round(err, 4)))
            
        cursor.executemany("""
            INSERT INTO metrics (service_id, timestamp, cpu, memory, request_count, latency, error_rate)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, metrics_rows)
        
    # Seed historical Deployments
    deployments = [
        ("deploy-001", "gateway-service", "v2.4.1", "Sarah (Ops)", 15.0, "Low", json.dumps(["Small route mapping update"]), "Succeeded", (now - timedelta(hours=10)).isoformat()),
        ("deploy-002", "search-service", "v1.12.0", "Kevin (Dev)", 65.0, "Medium", json.dumps(["Major rebuild of indexing rules", "Database schema migration"]), "Succeeded", (now - timedelta(hours=8)).isoformat()),
        ("deploy-003", "payment-api", "v1.0.8", "Emma (Fintech)", 85.0, "High", json.dumps(["Third-party SDK integration upgrade", "Modified transaction locking mechanisms"]), "Failed", (now - timedelta(hours=5)).isoformat()),
        ("deploy-004", "auth-service", "v3.0.2", "Admin Console", 22.0, "Low", json.dumps(["Token expiry configuration bump"]), "Succeeded", (now - timedelta(hours=2)).isoformat())
    ]
    cursor.executemany("""
        INSERT INTO deployments (id, service_id, version, deployed_by, risk_score, risk_level, risk_factors, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, deployments)
    
    # Seed historical Incidents and notes
    incidents = [
        ("inc-001", "payment-api", "Payment Gateway Timeout Surge", 
         "Transaction error rate spiked to 12.5% following payment-api v1.0.8 deployment. Third-party provider returned 504 Gateway Timeouts.", 
         "Resolved", "Critical", "Critical", (now - timedelta(hours=5)).isoformat(), (now - timedelta(hours=4)).isoformat()),
        ("inc-002", "database-cluster", "Replication Lag Alert", 
         "High disk I/O on database master node caused write replication delay to exceed 12 seconds, raising latency for indexing services.", 
         "Resolved", "Medium", "Warning", (now - timedelta(hours=3)).isoformat(), (now - timedelta(hours=2)).isoformat())
    ]
    cursor.executemany("""
        INSERT INTO incidents (id, service_id, title, description, status, priority, severity, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, incidents)
    
    notes = [
        ("inc-001", "Emma (Fintech)", "Identified that transaction locking was blocking gateway threads under high load.", (now - timedelta(hours=4, minutes=45)).isoformat()),
        ("inc-001", "Sarah (Ops)", "Rolled back deployment v1.0.8 to v1.0.7. System stabilized immediately.", (now - timedelta(hours=4, minutes=10)).isoformat()),
        ("inc-002", "Alex (Infra)", "Ran vacuum on logging table, cleared disk space. Master-slave syncing caught up within 15 minutes.", (now - timedelta(hours=2, minutes=30)).isoformat())
    ]
    cursor.executemany("""
        INSERT INTO incident_notes (incident_id, author, note, created_at)
        VALUES (?, ?, ?, ?)
    """, notes)
    
    # Seed some sample starting logs
    sample_logs = []
    log_severities = ["INFO", "INFO", "INFO", "WARNING", "INFO", "ERROR"]
    log_messages = {
        "gateway-service": [
            ("INFO", "Gateway routing initialized on port 8080"),
            ("INFO", "Route resolved successfully for /api/v1/auth/validate"),
            ("WARNING", "Slow response from search-service on route /api/v1/search (320ms)"),
            ("ERROR", "Connection refused connecting to payment-api backend on port 8081"),
            ("INFO", "Rate-limiting applied for IP address 192.168.1.145 (100 req/sec ceiling reached)")
        ],
        "auth-service": [
            ("INFO", "Token verification request completed for user_token_9x12"),
            ("WARNING", "JWT verification failed: Token expired for user_id=451902"),
            ("INFO", "OAuth login handshake completed successfully with Google Identity Provider"),
            ("ERROR", "Brute-force security mitigation triggered: IP 45.18.29.11 blocked after 5 failed password attempts"),
            ("INFO", "Keyring refreshed. 3 public keys imported successfully")
        ],
        "payment-api": [
            ("INFO", "Stripe API Client configured and verified connection status"),
            ("WARNING", "Stripe API response delayed: latency=1800ms"),
            ("ERROR", "Payment capture transaction failed for card ending in 4242: insufficient funds"),
            ("ERROR", "Out of Memory: Python heap allocation limit exceeded during transaction report generation"),
            ("INFO", "Payment authorization succeeded for order_ref=998822 (USD 49.99)")
        ],
        "database-cluster": [
            ("INFO", "Vacuum completed on logs table: cleared 1.2 GB of storage"),
            ("WARNING", "Active connection pool utilization at 88% (88/100 connections in use)"),
            ("ERROR", "Deadlock detected during concurrent update of accounts table rows"),
            ("INFO", "Replication lag currently at 0.12 seconds, healthy state"),
            ("INFO", "Database query optimization cache cleared successfully")
        ],
        "search-service": [
            ("INFO", "Re-indexing batch completed: 15,204 catalog records processed in 452ms"),
            ("INFO", "Query cache hit rate is 78.4% (31,288/39,901)"),
            ("WARNING", "Heap threshold warning: garbage collection took 2.4 seconds to execute"),
            ("ERROR", "Search index corrupt: mapping mapping_product_v3 is missing field material")
        ],
        "notification-service": [
            ("INFO", "SMTP dispatcher connected to mail.production.internal"),
            ("INFO", "Batch alert email dispatched to 1,294 customer accounts"),
            ("WARNING", "SMS gateway API quota at 10% (1,000 credits remaining)"),
            ("ERROR", "Webhook dispatch failed: Server at webhook.partner.com returned 502 Bad Gateway")
        ]
    }
    
    # Populate historical logs spread out over 1 hour
    log_time = now - timedelta(hours=1)
    for service_id, logs_list in log_messages.items():
        for severity, msg in logs_list:
            log_time += timedelta(minutes=2)
            # Dummy classifications
            classification = "Normal"
            if severity == "WARNING":
                classification = "Warning"
            elif severity == "ERROR":
                classification = "Suspicious"
            
            sample_logs.append((service_id, log_time.isoformat(), severity, msg, classification, "Keyword Match"))
            
    cursor.executemany("""
        INSERT INTO logs (service_id, timestamp, severity, message, classification, matched_pattern)
        VALUES (?, ?, ?, ?, ?, ?)
    """, sample_logs)
    
    conn.commit()
    conn.close()
    print("SQLite database successfully initialized and seeded at:", DB_PATH)

if __name__ == "__main__":
    init_db()
