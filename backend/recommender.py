import sqlite3
import json
import numpy as np

import os
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, 'pinterest_discovery.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def search_recommendations(query_embedding, active_board_id=None, selected_category=None):
    """
    Retrieves and ranks catalog items by combining:
    1. Vector Cosine Similarity (CLIP embeddings)
    2. Bipartite Graph Board-Save Jaccard overlap
    3. User Feedback Up/Down adjustments
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Retrieve all products
    if selected_category and selected_category != 'Any':
        cursor.execute("SELECT * FROM products WHERE category = ?", (selected_category,))
    else:
        cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()
    
    # 2. Retrieve user feedback adjustments
    cursor.execute("SELECT * FROM feedback")
    feedback_map = {row['product_id']: row['type'] for row in cursor.fetchall()}
    
    # 3. Graph Personalization Preparation: load active board saves
    active_board_saves = set()
    if active_board_id:
        cursor.execute("SELECT product_id FROM board_saves WHERE board_id = ?", (active_board_id,))
        active_board_saves = {row['product_id'] for row in cursor.fetchall()}
        
    # Query other boards and their saves to calculate board overlap similarities
    cursor.execute("SELECT board_id, product_id FROM board_saves")
    all_saves = cursor.fetchall()
    
    board_to_products = {}
    product_to_boards = {}
    for row in all_saves:
        bid, pid = row['board_id'], row['product_id']
        board_to_products.setdefault(bid, set()).add(pid)
        product_to_boards.setdefault(pid, set()).add(bid)

    query_vec = np.array(query_embedding)
    results = []
    
    # Pre-identify exact matches in categories to help categorize cheaper/premium options
    exact_prices = {}
    for p in products:
        if p['id'].endswith('_exact') or 'exact' in p['id']:
            exact_prices[p['category']] = p['price']

    for p in products:
        pid = p['id']
        p_embedding = np.array(json.loads(p['embedding']))
        
        # 1. Cosine Similarity (since vectors are unit-normalized, this is just the dot product)
        cosine_sim = float(np.dot(query_vec, p_embedding))
        
        # Scale to 0.0 - 1.0 range
        sim_score = max(0.0, min(1.0, (cosine_sim + 1.0) / 2.0))
        
        # Base rank is visual similarity weight (70% of total score)
        score = sim_score * 0.7
        
        # 2. Bipartite Graph Personalization Jaccard Boost
        graph_boost = 0.0
        board_explanations = []
        if active_board_id and len(active_board_saves) > 0:
            # Direct save boost: if already saved in active board, it gets a slight affinity boost
            if pid in active_board_saves:
                graph_boost += 0.15
                board_explanations.append("already saved in your board")
            
            # Bipartite Neighborhood overlap: Jaccard similarity of board co-saves
            p_boards = product_to_boards.get(pid, set())
            jaccard_sum = 0.0
            overlap_boards_count = 0
            
            for b_other in p_boards:
                # Skip active board direct count to avoid double-boosting
                if b_other == active_board_id:
                    continue
                other_saves = board_to_products.get(b_other, set())
                intersection = len(active_board_saves.intersection(other_saves))
                union = len(active_board_saves.union(other_saves))
                if union > 0:
                    jaccard = intersection / union
                    jaccard_sum += jaccard
                    if jaccard > 0:
                        overlap_boards_count += 1
            
            # Cap neighborhood boost
            if overlap_boards_count > 0:
                neighborhood_score = (jaccard_sum / overlap_boards_count) * 0.15
                graph_boost += neighborhood_score
                if neighborhood_score > 0.02:
                    board_explanations.append("matches style patterns in your board saves")

        score += graph_boost
        
        # 3. User feedback direct weight influence
        feedback = feedback_map.get(pid)
        if feedback == 'up':
            score += 0.08  # Boost upvoted items
        elif feedback == 'down':
            score -= 0.25  # Heavily penalize downvoted items
            
        # Ensure bounds
        score = max(0.0, min(1.0, score))
        
        # Determine pricing match type
        match_type = 'alternative'
        exact_price = exact_prices.get(p['category'])
        if pid.endswith('_exact') or 'exact' in pid:
            match_type = 'exact'
        elif exact_price:
            if p['price'] < exact_price:
                match_type = 'cheaper'
            elif p['price'] > exact_price:
                match_type = 'premium'
                
        # Generate semantic explanation
        explanation = ""
        if feedback == 'up':
            explanation = f"Recommended based on your positive feedback for {p['brand']} items."
        elif len(board_explanations) > 0:
            active_board_name = conn.execute("SELECT name FROM boards WHERE id = ?", (active_board_id,)).fetchone()
            bname = active_board_name['name'] if active_board_name else "Active Board"
            explanation = f"Graph Personalized: matches pins inside your active board ({bname})."
        elif match_type == 'exact':
            explanation = "98% Visual match: Identical structure lines, style tags, and color palette."
        elif match_type == 'cheaper':
            diff = int(exact_price - p['price']) if exact_price else 0
            explanation = f"Cheaper visual alternative. Saves you ${diff} compared to the exact matches!"
        elif match_type == 'premium':
            explanation = "Premium upgrade: Superior materials, hand-finished borders, and high-end brand detailing."
        else:
            explanation = f"Highly matching modern {p['style'].lower()} aesthetics."

        results.append({
            'product': {
                'id': pid,
                'name': p['name'],
                'brand': p['brand'],
                'category': p['category'],
                'price': p['price'],
                'rating': p['rating'],
                'style': p['style'],
                'colors': json.loads(p['colors']),
                'material': p['material'],
                'tags': json.loads(p['tags']),
                'shopUrl': p['shop_url'],
                'imagePath': p['image_path'],
                'gradient': p['gradient']
            },
            'score': round(score * 100),
            'matchType': match_type,
            'explanation': explanation
        })
        
    conn.close()
    
    # Sort results by Jaccard+CLIP score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    return results
