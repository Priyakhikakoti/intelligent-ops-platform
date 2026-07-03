// Pinterest Smart Discovery Assistant - Application Logic

// ==========================================
// 1. DATA DEFINITIONS & DATABASE
// ==========================================

const SAMPLE_PINS = [
    {
        id: 'cozy_living_room',
        title: 'Cozy Modern Living Room',
        imagePath: 'assets/cozy_living_room.png',
        dominantColors: ['#e6dfd3', '#b89f72', '#2f3542', '#747d8c'],
        tags: ['living-room', 'home-decor', 'neutral', 'warm', 'wood', 'cozy'],
        style: 'Cozy Modern',
        suggestedBoard: 'Home Decor',
        objects: [
            { id: 'sofa', name: 'Cozy Modern Sofa', category: 'Sofa', x: 8, y: 52, w: 58, h: 36, style: 'Cozy Modern', tags: ['sofa', 'linen', 'beige', 'cozy', 'cushion'], color: '#e6dfd3' },
            { id: 'lamp', name: 'Sleek Gold Floor Lamp', category: 'Lamp', x: 68, y: 12, w: 22, h: 72, style: 'Minimalist', tags: ['lamp', 'gold', 'brass', 'lighting', 'metal'], color: '#b89f72' },
            { id: 'rug', name: 'Geometric Cream Rug', category: 'Rug', x: 18, y: 74, w: 64, h: 22, style: 'Cozy Modern', tags: ['rug', 'cream', 'wool', 'geometric', 'pattern'], color: '#747d8c' },
            { id: 'table', name: 'Marble Coffee Table', category: 'Table', x: 34, y: 64, w: 28, h: 14, style: 'Minimalist', tags: ['table', 'coffee-table', 'marble', 'stone', 'white'], color: '#ffffff' }
        ]
    },
    {
        id: 'minimal_outfit',
        title: 'Minimalist Summer Outfit',
        imagePath: 'assets/minimal_outfit.png',
        dominantColors: ['#dfd6c8', '#f5f6fa', '#2f3640', '#7f8fa6'],
        tags: ['fashion', 'streetwear', 'summer', 'linen', 'casual', 'minimalist'],
        style: 'Minimalist',
        suggestedBoard: 'Outfits',
        objects: [
            { id: 'blazer', name: 'Linen Summer Blazer', category: 'Blazer', x: 22, y: 12, w: 56, h: 46, style: 'Minimalist', tags: ['blazer', 'linen', 'beige', 'jacket', 'outerwear'], color: '#dfd6c8' },
            { id: 'tshirt', name: 'Organic White Tee', category: 'T-Shirt', x: 34, y: 22, w: 32, h: 26, style: 'Minimalist', tags: ['t-shirt', 'white', 'cotton', 'tee', 'basic'], color: '#f5f6fa' },
            { id: 'jeans', name: 'Light Denim Jeans', category: 'Jeans', x: 28, y: 55, w: 44, h: 33, style: 'Casual', tags: ['jeans', 'denim', 'blue', 'pants', 'cotton'], color: '#7f8fa6' },
            { id: 'loafers', name: 'Leather Penny Loafers', category: 'Shoes', x: 34, y: 86, w: 32, h: 11, style: 'Classic', tags: ['shoes', 'loafers', 'leather', 'brown', 'slip-on'], color: '#2f3640' }
        ]
    },
    {
        id: 'boho_outfit',
        title: 'Bohemian Fall Outfit',
        imagePath: 'assets/boho_outfit.png',
        dominantColors: ['#ece4db', '#8f5c38', '#cf6a3c', '#5e3e29'],
        tags: ['fashion', 'boho', 'autumn', 'knit', 'cozy', 'earthy'],
        style: 'Bohemian',
        suggestedBoard: 'Outfits',
        objects: [
            { id: 'cardigan', name: 'Knit Cozy Cardigan', category: 'Cardigan', x: 18, y: 14, w: 64, h: 52, style: 'Bohemian', tags: ['cardigan', 'knit', 'cream', 'sweater', 'wool'], color: '#ece4db' },
            { id: 'dress', name: 'Floral Midi Dress', category: 'Dress', x: 28, y: 28, w: 44, h: 56, style: 'Bohemian', tags: ['dress', 'floral', 'midi', 'rust', 'pattern'], color: '#cf6a3c' },
            { id: 'boots', name: 'Suede Ankle Boots', category: 'Shoes', x: 32, y: 80, w: 36, h: 16, style: 'Bohemian', tags: ['shoes', 'boots', 'suede', 'brown', 'leather'], color: '#8f5c38' }
        ]
    },
    {
        id: 'modern_study',
        title: 'Mid-Century Modern Study',
        imagePath: 'assets/modern_study.png',
        dominantColors: ['#573d2a', '#2d3436', '#4b6584', '#a5b1c2'],
        tags: ['home-decor', 'office', 'study', 'wood', 'mid-century', 'vintage'],
        style: 'Mid-Century',
        suggestedBoard: 'Study Room Setup',
        objects: [
            { id: 'desk', name: 'Walnut Writing Desk', category: 'Desk', x: 18, y: 47, w: 47, h: 37, style: 'Mid-Century', tags: ['desk', 'walnut', 'wood', 'table', 'office'], color: '#573d2a' },
            { id: 'chair', name: 'Leather Desk Chair', category: 'Chair', x: 54, y: 48, w: 29, h: 37, style: 'Mid-Century', tags: ['chair', 'desk-chair', 'leather', 'brown', 'office'], color: '#2d3436' },
            { id: 'desk_lamp', name: 'Brass Task Lamp', category: 'Lamp', x: 23, y: 28, w: 15, h: 26, style: 'Mid-Century', tags: ['lamp', 'brass', 'desk-lamp', 'lighting', 'metal'], color: '#a5b1c2' },
            { id: 'plant', name: 'Potted Monstera Plant', category: 'Plant', x: 3, y: 35, w: 20, h: 55, style: 'Cozy Modern', tags: ['plant', 'monstera', 'green', 'pot', 'decor'], color: '#4b6584' }
        ]
    }
];

const PRODUCT_CATALOG = [
    // --- HOME DECOR: SOFAS ---
    {
        id: 'prod_sofa_exact',
        imagePath: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
        name: 'Sloane Linen Blend Sofa',
        brand: 'Loom & Nest',
        category: 'Sofa',
        price: 1399,
        rating: 4.8,
        style: 'Cozy Modern',
        colors: ['#e6dfd3', '#b89f72'],
        material: 'Linen',
        tags: ['sofa', 'linen', 'beige', 'cozy', 'modern', 'living-room'],
        shopUrl: 'https://www.pinterest.com/shopping/sloane-sofa',
        gradient: 'linear-gradient(135deg, #e6dfd3 0%, #b89f72 100%)'
    },
    {
        id: 'prod_sofa_cheap',
        imagePath: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=400&q=80',
        name: 'Beverly Fabric Loveseat',
        brand: 'Modway',
        category: 'Sofa',
        price: 549,
        rating: 4.3,
        style: 'Cozy Modern',
        colors: ['#e6dfd3'],
        material: 'Polyester Blend',
        tags: ['sofa', 'beige', 'fabric', 'cozy', 'cheap', 'living-room'],
        shopUrl: 'https://www.pinterest.com/shopping/beverly-loveseat',
        gradient: 'linear-gradient(135deg, #f1eae0 0%, #d5c8b3 100%)'
    },
    {
        id: 'prod_sofa_premium',
        imagePath: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80',
        name: 'Nouveau Curved Bouclé Sofa',
        brand: 'Studio M',
        category: 'Sofa',
        price: 2899,
        rating: 4.9,
        style: 'Minimalist',
        colors: ['#ffffff', '#e6dfd3'],
        material: 'Bouclé Wool',
        tags: ['sofa', 'boucle', 'curved', 'premium', 'luxury', 'white', 'minimalist'],
        shopUrl: 'https://www.pinterest.com/shopping/nouveau-sofa',
        gradient: 'linear-gradient(135deg, #ffffff 0%, #e6dfd3 100%)'
    },
    {
        id: 'prod_sofa_velvet',
        imagePath: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80',
        name: 'Sven Velvet Chesterfield Sofa',
        brand: 'Article',
        category: 'Sofa',
        price: 1899,
        rating: 4.7,
        style: 'Mid-Century',
        colors: ['#2f3542', '#747d8c'],
        material: 'Tufted Velvet',
        tags: ['sofa', 'velvet', 'blue', 'tufted', 'chesterfield', 'mid-century'],
        shopUrl: 'https://www.pinterest.com/shopping/sven-velvet-sofa',
        gradient: 'linear-gradient(135deg, #1e3799 0%, #2f3542 100%)'
    },
    {
        id: 'prod_sofa_sectional',
        imagePath: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=400&q=80',
        name: 'Modena Modular Leather Sectional',
        brand: 'Studio M',
        category: 'Sofa',
        price: 3400,
        rating: 4.9,
        style: 'Cozy Modern',
        colors: ['#b89f72', '#573d2a'],
        material: 'Cognac Aniline Leather',
        tags: ['sofa', 'leather', 'sectional', 'modular', 'premium', 'brown', 'cozy'],
        shopUrl: 'https://www.pinterest.com/shopping/modena-sectional',
        gradient: 'linear-gradient(135deg, #844c21 0%, #b89f72 100%)'
    },
    
    // --- HOME DECOR: LAMPS ---
    {
        id: 'prod_lamp_exact',
        imagePath: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
        name: 'Arched Brass Floor Lamp',
        brand: 'Aura Light Co.',
        category: 'Lamp',
        price: 249,
        rating: 4.6,
        style: 'Minimalist',
        colors: ['#b89f72', '#2f3542'],
        material: 'Brass',
        tags: ['lamp', 'gold', 'brass', 'lighting', 'floor-lamp', 'metal'],
        shopUrl: 'https://www.pinterest.com/shopping/brass-floor-lamp',
        gradient: 'linear-gradient(135deg, #ffe066 0%, #b89f72 100%)'
    },
    {
        id: 'prod_lamp_cheap',
        imagePath: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80',
        name: 'Modern Gold-Finish Arc Lamp',
        brand: 'Hampton Bay',
        category: 'Lamp',
        price: 89,
        rating: 4.1,
        style: 'Cozy Modern',
        colors: ['#b89f72'],
        material: 'Iron',
        tags: ['lamp', 'gold', 'cheap', 'lighting', 'floor-lamp'],
        shopUrl: 'https://www.pinterest.com/shopping/gold-arc-lamp',
        gradient: 'linear-gradient(135deg, #eed8a1 0%, #b89f72 100%)'
    },
    {
        id: 'prod_lamp_premium',
        imagePath: 'https://images.unsplash.com/photo-1542728929-14ab1c67791f?auto=format&fit=crop&w=400&q=80',
        name: 'Monolith Solid Brass Floor Lamp',
        brand: 'Arteriors',
        category: 'Lamp',
        price: 899,
        rating: 5.0,
        style: 'Minimalist',
        colors: ['#b89f72', '#090d16'],
        material: 'Solid Brass & Marble',
        tags: ['lamp', 'brass', 'premium', 'luxury', 'lighting', 'marble', 'designer'],
        shopUrl: 'https://www.pinterest.com/shopping/monolith-brass-lamp',
        gradient: 'linear-gradient(135deg, #d4af37 0%, #8c7e6c 100%)'
    },
    {
        id: 'prod_lamp_globe',
        imagePath: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=400&q=80',
        name: 'Globe Glass Desk Lamp',
        brand: 'West Elm',
        category: 'Lamp',
        price: 75,
        rating: 4.4,
        style: 'Mid-Century',
        colors: ['#ffffff', '#b89f72'],
        material: 'Opal Glass & Brass',
        tags: ['lamp', 'globe', 'brass', 'glass', 'desk-lamp', 'table-lamp', 'mid-century'],
        shopUrl: 'https://www.pinterest.com/shopping/globe-desk-lamp',
        gradient: 'radial-gradient(circle, #ffffff 40%, #eed8a1 100%)'
    },
    {
        id: 'prod_lamp_pendant',
        imagePath: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=400&q=80',
        name: 'Linear Minimalist LED Pendant',
        brand: 'Aura Light Co.',
        category: 'Lamp',
        price: 320,
        rating: 4.7,
        style: 'Minimalist',
        colors: ['#2f3436'],
        material: 'Anodized Aluminum',
        tags: ['lamp', 'led', 'pendant', 'minimalist', 'ceiling', 'hanging'],
        shopUrl: 'https://www.pinterest.com/shopping/linear-pendant',
        gradient: 'linear-gradient(90deg, #2d3436 0%, #090d16 100%)'
    },

    // --- HOME DECOR: RUGS ---
    {
        id: 'prod_rug_exact',
        imagePath: 'https://images.unsplash.com/photo-1575414003591-ece8d0416c7a?auto=format&fit=crop&w=400&q=80',
        name: 'Kasbah Diamond Wool Rug',
        brand: 'West Elm',
        category: 'Rug',
        price: 499,
        rating: 4.7,
        style: 'Cozy Modern',
        colors: ['#e6dfd3', '#2f3542'],
        material: 'New Zealand Wool',
        tags: ['rug', 'cream', 'wool', 'geometric', 'diamond', 'cozy'],
        shopUrl: 'https://www.pinterest.com/shopping/kasbah-rug',
        gradient: 'repeating-linear-gradient(45deg, #e6dfd3, #e6dfd3 10px, #747d8c 10px, #747d8c 20px)'
    },
    {
        id: 'prod_rug_cheap',
        imagePath: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=400&q=80',
        name: 'Trellis Plush Shag Rug',
        brand: 'Safavieh',
        category: 'Rug',
        price: 120,
        rating: 4.2,
        style: 'Cozy Modern',
        colors: ['#e6dfd3', '#747d8c'],
        material: 'Polypropylene',
        tags: ['rug', 'cream', 'shag', 'cheap', 'geometric', 'pattern'],
        shopUrl: 'https://www.pinterest.com/shopping/trellis-shag-rug',
        gradient: 'repeating-linear-gradient(-45deg, #f1eae0, #f1eae0 15px, #a4b0be 15px, #a4b0be 30px)'
    },
    {
        id: 'prod_rug_jute',
        imagePath: 'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=400&q=80',
        name: 'Abstract Earth-Tone Jute Rug',
        brand: 'Loom & Nest',
        category: 'Rug',
        price: 180,
        rating: 4.5,
        style: 'Bohemian',
        colors: ['#b89f72', '#e6dfd3'],
        material: 'Natural Woven Jute',
        tags: ['rug', 'jute', 'natural', 'woven', 'tan', 'earthy', 'boho'],
        shopUrl: 'https://www.pinterest.com/shopping/jute-rug',
        gradient: 'repeating-linear-gradient(90deg, #d2b48c, #d2b48c 8px, #cd853f 8px, #cd853f 16px)'
    },
    {
        id: 'prod_rug_persian',
        imagePath: 'https://images.unsplash.com/photo-1582282040002-e241198c60bc?auto=format&fit=crop&w=400&q=80',
        name: 'Vintage Persian Wool Runner',
        brand: 'Rejuvenation',
        category: 'Rug',
        price: 750,
        rating: 4.9,
        style: 'Bohemian',
        colors: ['#cf6a3c', '#5e3e29'],
        material: 'Distressed Wool',
        tags: ['rug', 'persian', 'vintage', 'red', 'runner', 'wool', 'classic'],
        shopUrl: 'https://www.pinterest.com/shopping/vintage-persian-rug',
        gradient: 'radial-gradient(circle, #8b0000 30%, #5e3e29 100%)'
    },

    // --- HOME DECOR: TABLES & DESKS ---
    {
        id: 'prod_table_exact',
        imagePath: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=400&q=80',
        name: 'Hexa Carrara Coffee Table',
        brand: 'Article',
        category: 'Table',
        price: 699,
        rating: 4.8,
        style: 'Minimalist',
        colors: ['#ffffff', '#747d8c'],
        material: 'Carrara Marble & Steel',
        tags: ['table', 'coffee-table', 'marble', 'white', 'minimalist', 'living-room'],
        shopUrl: 'https://www.pinterest.com/shopping/hexa-marble-table',
        gradient: 'radial-gradient(circle, #ffffff 60%, #cbd5e1 100%)'
    },
    {
        id: 'prod_table_premium',
        imagePath: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80',
        name: 'Plinth Marble Low Table',
        brand: 'Menu Space',
        category: 'Table',
        price: 1850,
        rating: 4.9,
        style: 'Minimalist',
        colors: ['#ffffff', '#2f3542'],
        material: 'Solid Marble Block',
        tags: ['table', 'coffee-table', 'marble', 'solid', 'premium', 'luxury', 'designer'],
        shopUrl: 'https://www.pinterest.com/shopping/plinth-marble-table',
        gradient: 'linear-gradient(45deg, #ffffff 0%, #94a3b8 100%)'
    },
    {
        id: 'prod_table_chevron',
        imagePath: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=400&q=80',
        name: 'Chevron Reclaimed Coffee Table',
        brand: 'West Elm',
        category: 'Table',
        price: 450,
        rating: 4.6,
        style: 'Cozy Modern',
        colors: ['#573d2a', '#b89f72'],
        material: 'Reclaimed Oak Wood',
        tags: ['table', 'coffee-table', 'wood', 'chevron', 'rustic', 'cozy'],
        shopUrl: 'https://www.pinterest.com/shopping/chevron-wood-table',
        gradient: 'repeating-linear-gradient(135deg, #573d2a, #573d2a 12px, #8c7e6c 12px, #8c7e6c 24px)'
    },
    {
        id: 'prod_table_glass',
        imagePath: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=400&q=80',
        name: 'Sleek Glass Floating Console',
        brand: 'Article',
        category: 'Table',
        price: 310,
        rating: 4.5,
        style: 'Minimalist',
        colors: ['#ffffff'],
        material: 'Tempered Glass',
        tags: ['table', 'console', 'glass', 'floating', 'minimalist', 'modern'],
        shopUrl: 'https://www.pinterest.com/shopping/glass-console',
        gradient: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(226,232,240,0.4) 100%)'
    },
    {
        id: 'prod_desk_exact',
        imagePath: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80',
        name: 'Mid-Century Walnut Writing Desk',
        brand: 'West Elm',
        category: 'Desk',
        price: 799,
        rating: 4.7,
        style: 'Mid-Century',
        colors: ['#573d2a'],
        material: 'Walnut Wood & Acacia',
        tags: ['desk', 'walnut', 'wood', 'table', 'office', 'mid-century', 'furniture'],
        shopUrl: 'https://www.pinterest.com/shopping/westelm-walnut-desk',
        gradient: 'linear-gradient(135deg, #6f4e37 0%, #573d2a 100%)'
    },
    {
        id: 'prod_desk_oak',
        imagePath: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=400&q=80',
        name: 'Studio Solid Oak Workstation',
        brand: 'Loom & Nest',
        category: 'Desk',
        price: 1200,
        rating: 4.9,
        style: 'Cozy Modern',
        colors: ['#e6dfd3', '#2d3436'],
        material: 'White Solid Oak & Iron',
        tags: ['desk', 'oak', 'wood', 'workspace', 'office', 'cozy', 'premium'],
        shopUrl: 'https://www.pinterest.com/shopping/oak-workstation',
        gradient: 'linear-gradient(135deg, #f5eae0 0%, #a5b1c2 100%)'
    },

    // --- HOME DECOR: CHAIRS ---
    {
        id: 'prod_chair_exact',
        imagePath: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=400&q=80',
        name: 'Landon Leather Office Chair',
        brand: 'West Elm',
        category: 'Chair',
        price: 349,
        rating: 4.5,
        style: 'Mid-Century',
        colors: ['#2d3436', '#573d2a'],
        material: 'Top-grain Leather & Steel',
        tags: ['chair', 'desk-chair', 'leather', 'brown', 'office', 'mid-century'],
        shopUrl: 'https://www.pinterest.com/shopping/westelm-leather-chair',
        gradient: 'linear-gradient(135deg, #4b382a 0%, #2d3436 100%)'
    },
    {
        id: 'prod_chair_wishbone',
        imagePath: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=400&q=80',
        name: 'Wegner Ash Wood Wishbone Chair',
        brand: 'Studio M',
        category: 'Chair',
        price: 220,
        rating: 4.8,
        style: 'Minimalist',
        colors: ['#e6dfd3'],
        material: 'Ash Wood & Paper Cord',
        tags: ['chair', 'wishbone', 'dining-chair', 'wood', 'classic', 'minimalist'],
        shopUrl: 'https://www.pinterest.com/shopping/wishbone-chair',
        gradient: 'linear-gradient(135deg, #f7f1e3 0%, #d1ccc0 100%)'
    },
    {
        id: 'prod_chair_sherpa',
        imagePath: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=400&q=80',
        name: 'Bouclé Sherpa Accent Armchair',
        brand: 'Loom & Nest',
        category: 'Chair',
        price: 450,
        rating: 4.7,
        style: 'Cozy Modern',
        colors: ['#ffffff', '#e6dfd3'],
        material: 'Sherpa Bouclé Fabric',
        tags: ['chair', 'accent-chair', 'boucle', 'sherpa', 'cream', 'cozy'],
        shopUrl: 'https://www.pinterest.com/shopping/sherpa-armchair',
        gradient: 'radial-gradient(circle, #ffffff 70%, #ece4db 100%)'
    },

    // --- HOME DECOR: PLANTS & WALL ART ---
    {
        id: 'prod_plant_exact',
        imagePath: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=400&q=80',
        name: 'Lush Potted Monstera Deliciosa',
        brand: 'The Sill',
        category: 'Plant',
        price: 68,
        rating: 4.9,
        style: 'Cozy Modern',
        colors: ['#4b6584', '#2ed573'],
        material: 'Clay Pot & Organic Plant',
        tags: ['plant', 'monstera', 'green', 'pot', 'decor', 'indoor-plant'],
        shopUrl: 'https://www.pinterest.com/shopping/thesill-monstera',
        gradient: 'linear-gradient(135deg, #2ed573 0%, #20bf6b 100%)'
    },
    {
        id: 'prod_plant_fiddle',
        imagePath: 'https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&w=400&q=80',
        name: 'Live Fiddle Leaf Fig Tree',
        brand: 'The Sill',
        category: 'Plant',
        price: 95,
        rating: 4.7,
        style: 'Cozy Modern',
        colors: ['#2ed573', '#2f3542'],
        material: 'Ceramic Planter & Live Tree',
        tags: ['plant', 'fig', 'tree', 'green', 'pot', 'decor', 'plant-parent'],
        shopUrl: 'https://www.pinterest.com/shopping/fiddle-leaf-fig',
        gradient: 'linear-gradient(135deg, #10ac84 0%, #2f3542 100%)'
    },
    {
        id: 'prod_art_arch',
        imagePath: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=400&q=80',
        name: 'Abstract Arch Plaster Relief Art',
        brand: 'Aura Light Co.',
        category: 'Table',
        price: 110,
        rating: 4.8,
        style: 'Minimalist',
        colors: ['#e6dfd3', '#ffffff'],
        material: 'Plaster Relief Art',
        tags: ['decor', 'art', 'plaster', 'minimalist', 'wall-art', 'frame'],
        shopUrl: 'https://www.pinterest.com/shopping/plaster-art',
        gradient: 'linear-gradient(135deg, #f1eae0 0%, #ffffff 100%)'
    },

    // --- FASHION: BLAZERS & COATS ---
    {
        id: 'prod_blazer_exact',
        imagePath: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80',
        name: 'Relaxed Linen-Cotton Blazer',
        brand: 'Everlane',
        category: 'Blazer',
        price: 148,
        rating: 4.5,
        style: 'Minimalist',
        colors: ['#dfd6c8'],
        material: 'Linen Blend',
        tags: ['blazer', 'linen', 'beige', 'casual', 'minimalist', 'summer'],
        shopUrl: 'https://www.pinterest.com/shopping/everlane-linen-blazer',
        gradient: 'linear-gradient(135deg, #dfd6c8 0%, #c5bba8 100%)'
    },
    {
        id: 'prod_blazer_premium',
        imagePath: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=400&q=80',
        name: 'Wool & Silk Tailored Blazer',
        brand: 'Theory',
        category: 'Blazer',
        price: 495,
        rating: 4.8,
        style: 'Minimalist',
        colors: ['#dfd6c8', '#ffffff'],
        material: 'Wool Silk Blend',
        tags: ['blazer', 'tailored', 'premium', 'wool', 'cream', 'luxury'],
        shopUrl: 'https://www.pinterest.com/shopping/theory-tailored-blazer',
        gradient: 'linear-gradient(135deg, #ece4db 0%, #dfd6c8 100%)'
    },
    {
        id: 'prod_coat_trench',
        imagePath: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=400&q=80',
        name: 'Oversized Wool Trench Coat',
        brand: 'Theory',
        category: 'Blazer',
        price: 280,
        rating: 4.9,
        style: 'Minimalist',
        colors: ['#dfd6c8', '#5e3e29'],
        material: 'Beige Cashmere Wool Blend',
        tags: ['coat', 'trench', 'wool', 'beige', 'outerwear', 'minimalist', 'premium'],
        shopUrl: 'https://www.pinterest.com/shopping/wool-trench-coat',
        gradient: 'linear-gradient(135deg, #dfd6c8 0%, #8c7e6c 100%)'
    },
    {
        id: 'prod_jacket_denim',
        imagePath: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=400&q=80',
        name: 'Classic Denim Trucker Jacket',
        brand: 'Levi\'s',
        category: 'Blazer',
        price: 88,
        rating: 4.6,
        style: 'Casual',
        colors: ['#7f8fa6'],
        material: 'Medium Wash Denim Cotton',
        tags: ['jacket', 'denim', 'blue', 'casual', 'trucker', 'outerwear'],
        shopUrl: 'https://www.pinterest.com/shopping/levis-denim-jacket',
        gradient: 'linear-gradient(135deg, #54a0ff 0%, #5f27cd 100%)'
    },

    // --- FASHION: SHIRTS & TOPS ---
    {
        id: 'prod_tshirt_exact',
        imagePath: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
        name: 'Premium Weight Crew Tee',
        brand: 'Everlane',
        category: 'T-Shirt',
        price: 38,
        rating: 4.7,
        style: 'Minimalist',
        colors: ['#f5f6fa'],
        material: 'Organic Cotton',
        tags: ['t-shirt', 'white', 'cotton', 'tee', 'basic', 'minimalist'],
        shopUrl: 'https://www.pinterest.com/shopping/everlane-crew-tee',
        gradient: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)'
    },
    {
        id: 'prod_shirt_linen',
        imagePath: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=400&q=80',
        name: 'Relaxed Linen Button-Down',
        brand: 'Everlane',
        category: 'T-Shirt',
        price: 78,
        rating: 4.6,
        style: 'Casual',
        colors: ['#ffffff', '#dfd6c8'],
        material: 'French Linen',
        tags: ['shirt', 'linen', 'button-down', 'white', 'casual', 'summer'],
        shopUrl: 'https://www.pinterest.com/shopping/linen-button-down',
        gradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
    },
    {
        id: 'prod_top_silk',
        imagePath: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=400&q=80',
        name: 'Silk Mockneck Sleeveless Top',
        brand: 'Theory',
        category: 'T-Shirt',
        price: 120,
        rating: 4.8,
        style: 'Classic',
        colors: ['#dfd6c8'],
        material: 'Champagne Silk',
        tags: ['top', 'silk', 'champagne', 'sleeveless', 'mockneck', 'classic'],
        shopUrl: 'https://www.pinterest.com/shopping/silk-mockneck-top',
        gradient: 'linear-gradient(135deg, #f5f6fa 0%, #dfd6c8 100%)'
    },

    // --- FASHION: JEANS & TROUSERS ---
    {
        id: 'prod_jeans_exact',
        imagePath: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80',
        name: 'The Way-High Straight Jean',
        brand: 'Everlane',
        category: 'Jeans',
        price: 98,
        rating: 4.4,
        style: 'Casual',
        colors: ['#7f8fa6'],
        material: 'Organic Denim Cotton',
        tags: ['jeans', 'denim', 'blue', 'straight', 'casual', 'pants'],
        shopUrl: 'https://www.pinterest.com/shopping/everlane-high-jeans',
        gradient: 'linear-gradient(135deg, #70a1ff 0%, #1e90ff 100%)'
    },
    {
        id: 'prod_jeans_cheap',
        imagePath: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=80',
        name: 'Classic Straight Denim Jeans',
        brand: 'Levi\'s',
        category: 'Jeans',
        price: 69,
        rating: 4.5,
        style: 'Casual',
        colors: ['#7f8fa6'],
        material: 'Cotton Denim',
        tags: ['jeans', 'denim', 'blue', 'cheap', 'classic', 'pants'],
        shopUrl: 'https://www.pinterest.com/shopping/levis-straight-jeans',
        gradient: 'linear-gradient(135deg, #82ccdd 0%, #4a69bd 100%)'
    },
    {
        id: 'prod_pants_trouser',
        imagePath: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=400&q=80',
        name: 'Wide-Leg Pleated Trousers',
        brand: 'Theory',
        category: 'Jeans',
        price: 115,
        rating: 4.7,
        style: 'Minimalist',
        colors: ['#dfd6c8', '#2f3640'],
        material: 'Lightweight Wool-Poly',
        tags: ['pants', 'trousers', 'wide-leg', 'pleated', 'tan', 'minimalist'],
        shopUrl: 'https://www.pinterest.com/shopping/wide-leg-trousers',
        gradient: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
    },
    {
        id: 'prod_pants_linen',
        imagePath: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=400&q=80',
        name: 'Tailored Linen Work Pants',
        brand: 'Everlane',
        category: 'Jeans',
        price: 90,
        rating: 4.3,
        style: 'Minimalist',
        colors: ['#ffffff', '#dfd6c8'],
        material: '100% Belgian Linen',
        tags: ['pants', 'linen', 'tailored', 'white', 'summer', 'minimalist'],
        shopUrl: 'https://www.pinterest.com/shopping/tailored-linen-pants',
        gradient: 'linear-gradient(135deg, #ffffff 0%, #f1f2f6 100%)'
    },

    // --- FASHION: SHOES & SNEAKERS ---
    {
        id: 'prod_loafers_exact',
        imagePath: 'https://images.unsplash.com/photo-1614252329309-de4e45d17a3a?auto=format&fit=crop&w=400&q=80',
        name: 'Handcrafted Classic Penny Loafer',
        brand: 'G.H. Bass',
        category: 'Shoes',
        price: 165,
        rating: 4.6,
        style: 'Classic',
        colors: ['#2f3640', '#5e3e29'],
        material: 'Hand-sewn Leather',
        tags: ['shoes', 'loafers', 'leather', 'brown', 'penny-loafer', 'slip-on'],
        shopUrl: 'https://www.pinterest.com/shopping/ghbass-loafers',
        gradient: 'linear-gradient(135deg, #4b382a 0%, #2f3640 100%)'
    },
    {
        id: 'prod_loafers_cheap',
        imagePath: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=400&q=80',
        name: 'Slip-On Faux Leather Loafers',
        brand: 'ASOS DESIGN',
        category: 'Shoes',
        price: 36,
        rating: 3.9,
        style: 'Classic',
        colors: ['#2f3640'],
        material: 'Faux Leather',
        tags: ['shoes', 'loafers', 'cheap', 'slip-on', 'synthetic'],
        shopUrl: 'https://www.pinterest.com/shopping/asos-faux-loafers',
        gradient: 'linear-gradient(135deg, #535c68 0%, #2f3640 100%)'
    },
    {
        id: 'prod_boots_exact',
        imagePath: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=400&q=80',
        name: 'Suede Ankle Western Boots',
        brand: 'Free People',
        category: 'Shoes',
        price: 198,
        rating: 4.7,
        style: 'Bohemian',
        colors: ['#8f5c38'],
        material: 'Suede Leather',
        tags: ['shoes', 'boots', 'suede', 'brown', 'western', 'boho'],
        shopUrl: 'https://www.pinterest.com/shopping/freepeople-boots',
        gradient: 'linear-gradient(135deg, #a0522d 0%, #8f5c38 100%)'
    },
    {
        id: 'prod_sneaker_leather',
        imagePath: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80',
        name: 'Minimalist Leather Sneakers',
        brand: 'Everlane',
        category: 'Shoes',
        price: 120,
        rating: 4.8,
        style: 'Minimalist',
        colors: ['#ffffff'],
        material: 'Calf Leather & Rubber',
        tags: ['shoes', 'sneakers', 'leather', 'white', 'minimalist', 'casual'],
        shopUrl: 'https://www.pinterest.com/shopping/leather-sneakers',
        gradient: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)'
    },
    {
        id: 'prod_boots_chelsea',
        imagePath: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=400&q=80',
        name: 'Suede Platform Chelsea Boots',
        brand: 'Free People',
        category: 'Shoes',
        price: 310,
        rating: 4.9,
        style: 'Bohemian',
        colors: ['#8f5c38', '#dfd6c8'],
        material: 'Genuine Suede',
        tags: ['shoes', 'boots', 'chelsea', 'suede', 'platform', 'tan', 'boho'],
        shopUrl: 'https://www.pinterest.com/shopping/suede-chelsea-boots',
        gradient: 'linear-gradient(135deg, #cd853f 0%, #8f5c38 100%)'
    },

    // --- FASHION: CARDIGAN & DRESS ---
    {
        id: 'prod_cardigan_exact',
        imagePath: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=400&q=80',
        name: 'Chunky Wool Knit Cardigan',
        brand: 'Sezane',
        category: 'Cardigan',
        price: 170,
        rating: 4.8,
        style: 'Bohemian',
        colors: ['#ece4db'],
        material: 'Alpaca Wool',
        tags: ['cardigan', 'knit', 'cream', 'cozy', 'sweater', 'wool', 'boho'],
        shopUrl: 'https://www.pinterest.com/shopping/sezane-cardigan',
        gradient: 'linear-gradient(135deg, #f5ebe0 0%, #ece4db 100%)'
    },
    {
        id: 'prod_dress_exact',
        imagePath: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80',
        name: 'Bohemian Floral Midi Dress',
        brand: 'Free People',
        category: 'Dress',
        price: 168,
        rating: 4.6,
        style: 'Bohemian',
        colors: ['#cf6a3c', '#8f5c38'],
        material: 'Viscose',
        tags: ['dress', 'floral', 'midi', 'rust', 'pattern', 'bohemian', 'boho'],
        shopUrl: 'https://www.pinterest.com/shopping/freepeople-midi-dress',
        gradient: 'linear-gradient(135deg, #cf6a3c 0%, #f39c12 100%)'
    },

    // --- FASHION: ACCESSORIES (HATS, BAGS) ---
    {
        id: 'prod_fedora_wool',
        imagePath: 'https://images.unsplash.com/photo-1533055640609-24b498dfd74c?auto=format&fit=crop&w=400&q=80',
        name: 'Wide-Brim Wool Felt Fedora',
        brand: 'Free People',
        category: 'Cardigan',
        price: 85,
        rating: 4.4,
        style: 'Bohemian',
        colors: ['#5e3e29', '#8f5c38'],
        material: 'Wool Felt',
        tags: ['hat', 'fedora', 'wool', 'brown', 'accessories', 'boho'],
        shopUrl: 'https://www.pinterest.com/shopping/wool-fedora',
        gradient: 'linear-gradient(135deg, #3d2314 0%, #5e3e29 100%)'
    },
    {
        id: 'prod_bag_hobo',
        imagePath: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80',
        name: 'Slouchy Pebbled Leather Hobo',
        brand: 'Sezane',
        category: 'Cardigan',
        price: 260,
        rating: 4.8,
        style: 'Bohemian',
        colors: ['#8f5c38'],
        material: 'Pebbled Calf Leather',
        tags: ['bag', 'hobo', 'leather', 'brown', 'slouchy', 'boho'],
        shopUrl: 'https://www.pinterest.com/shopping/leather-hobo-bag',
        gradient: 'linear-gradient(135deg, #b89f72 0%, #8f5c38 100%)'
    },
    {
        id: 'prod_bag_crossbody',
        imagePath: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=400&q=80',
        name: 'Minimalist Box Crossbody Bag',
        brand: 'Theory',
        category: 'Blazer',
        price: 390,
        rating: 4.7,
        style: 'Minimalist',
        colors: ['#2f3640'],
        material: 'Box Calfskin',
        tags: ['bag', 'crossbody', 'leather', 'black', 'box-bag', 'minimalist'],
        shopUrl: 'https://www.pinterest.com/shopping/box-crossbody',
        gradient: 'linear-gradient(135deg, #2d3436 0%, #090d16 100%)'
    }
];

// Default Board list matching board history personalization requirement
const DEFAULT_BOARDS = [
    { id: 'board_decor', name: 'Home Decor', styleFocus: 'Cozy Modern', categoryFocus: 'Home Decor', itemsCount: 4 },
    { id: 'board_outfits', name: 'Outfits', styleFocus: 'Minimalist', categoryFocus: 'Fashion', itemsCount: 2 },
    { id: 'board_study', name: 'Study Room Setup', styleFocus: 'Mid-Century', categoryFocus: 'Home Decor', itemsCount: 1 },
    { id: 'board_wishlist', name: 'Wishlist', styleFocus: 'Any', categoryFocus: 'Any', itemsCount: 0 }
];

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================

let state = {
    boards: [],
    savedPins: {}, // Maps productCatalog ID -> Board ID
    clicksHistory: [], // Array of productCatalog IDs clicked
    activeBoardId: 'board_decor',
    selectedPresetId: 'cozy_living_room',
    activePin: null, // Holds currently loaded Pin object (preset or custom)
    selectedObjectId: null, // Active bounding box ID
    activeTab: 'all', // all, cheaper, premium, personalized
    comparisonList: [], // Array of products selected for comparison (max 3)
    userFeedback: {}, // Maps product ID -> 'up' or 'down'
    customCropMode: false,
    cropStart: null,
    calibrationMode: false
};

// ==========================================
// 3. INITIALIZATION & STORAGE
// ==========================================

function initApp() {
    // Load from local storage or set defaults
    const storedBoards = localStorage.getItem('pinterest_boards');
    if (storedBoards) {
        state.boards = JSON.parse(storedBoards);
    } else {
        state.boards = [...DEFAULT_BOARDS];
        saveBoardsToStorage();
    }

    const storedSavedPins = localStorage.getItem('pinterest_saved_pins');
    if (storedSavedPins) {
        state.savedPins = JSON.parse(storedSavedPins);
    }

    const storedFeedback = localStorage.getItem('pinterest_feedback');
    if (storedFeedback) {
        state.userFeedback = JSON.parse(storedFeedback);
    }

    // Load calibrated pins from storage
    const storedCalibrated = localStorage.getItem('pinterest_calibrated_pins');
    if (storedCalibrated) {
        const calibrated = JSON.parse(storedCalibrated);
        SAMPLE_PINS.forEach(pin => {
            if (calibrated[pin.id]) {
                pin.objects.forEach(obj => {
                    if (calibrated[pin.id][obj.id]) {
                        Object.assign(obj, calibrated[pin.id][obj.id]);
                    }
                });
            }
        });
    }

    // Set initial active pin
    state.activePin = SAMPLE_PINS.find(p => p.id === state.selectedPresetId);
    
    // Bind Event Listeners
    setupEventHandlers();
    
    // Initial Renders
    renderBoardSelector();
    renderPresetCarousel();
    renderActivePin();
    renderDiscoveryFeed();
    updateComparisonCounter();
}

function saveBoardsToStorage() {
    localStorage.setItem('pinterest_boards', JSON.stringify(state.boards));
}

function savePinsToStorage() {
    localStorage.setItem('pinterest_saved_pins', JSON.stringify(state.savedPins));
}

function saveFeedbackToStorage() {
    localStorage.setItem('pinterest_feedback', JSON.stringify(state.userFeedback));
}

// ==========================================
// 4. EVENT HANDLERS
// ==========================================

function setupEventHandlers() {
    // Active Board change
    const boardSelect = document.getElementById('header-board-select');
    if (boardSelect) {
        boardSelect.addEventListener('change', (e) => {
            state.activeBoardId = e.target.value;
            showToast(`Personalization set to active board: ${getActiveBoardName()}`, 'info');
            renderDiscoveryFeed();
        });
    }

    // Feed Tabs change
    const tabs = document.querySelectorAll('.feed-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.activeTab = tab.getAttribute('data-tab');
            renderDiscoveryFeed();
        });
    });

    // Preset Carousel interaction
    document.getElementById('preset-carousel-container').addEventListener('click', (e) => {
        const item = e.target.closest('.preset-item');
        if (item) {
            document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            const pinId = item.getAttribute('data-id');
            state.selectedPresetId = pinId;
            state.activePin = SAMPLE_PINS.find(p => p.id === pinId);
            state.selectedObjectId = null; // reset selection
            
            // Adjust active board based on preset type to simulate smart flow
            if (pinId === 'cozy_living_room') {
                setActiveBoard('board_decor');
            } else if (pinId === 'minimal_outfit' || pinId === 'boho_outfit') {
                setActiveBoard('board_outfits');
            } else if (pinId === 'modern_study') {
                setActiveBoard('board_study');
            }

            renderActivePin();
            renderDiscoveryFeed();
        }
    });

    // Tab Switch for Custom Upload / Pin URL
    const uploadTabBtn = document.getElementById('upload-tab-btn');
    const urlTabBtn = document.getElementById('url-tab-btn');
    const uploadWrapper = document.getElementById('upload-input-wrapper');
    const urlWrapper = document.getElementById('url-input-wrapper');

    if (uploadTabBtn && urlTabBtn) {
        uploadTabBtn.addEventListener('click', () => {
            uploadTabBtn.classList.add('active');
            urlTabBtn.classList.remove('active');
            uploadWrapper.style.display = 'block';
            urlWrapper.style.display = 'none';
        });

        urlTabBtn.addEventListener('click', () => {
            urlTabBtn.classList.add('active');
            uploadTabBtn.classList.remove('active');
            urlWrapper.style.display = 'flex';
            uploadWrapper.style.display = 'none';
        });
    }

    // File input change
    const fileInput = document.getElementById('file-input');
    const dropzone = document.getElementById('dropzone-area');
    
    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'var(--color-pinterest)';
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            if (e.dataTransfer.files.length > 0) {
                handleUploadedFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleUploadedFile(e.target.files[0]);
            }
        });
    }

    // Pin URL Search Button
    const searchBtn = document.getElementById('btn-url-search');
    const urlInput = document.getElementById('url-input');
    if (searchBtn && urlInput) {
        searchBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (!url) {
                showToast('Please enter a valid Pin or Image URL', 'warning');
                return;
            }
            handleUrlSearch(url);
        });
    }

    // Reset Visual Search Selection clicking on canvas background
    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
        canvasContainer.addEventListener('click', (e) => {
            if (e.target === canvasContainer || e.target.classList.contains('canvas-image')) {
                state.selectedObjectId = null;
                // remove active classes
                document.querySelectorAll('.bounding-box').forEach(box => box.classList.remove('active'));
                renderDiscoveryFeed();
            }
        });
    }

    // Modal Close buttons
    document.querySelectorAll('.btn-close, .modal-overlay').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target === el || el.classList.contains('btn-close') || el.closest('.btn-close')) {
                document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
            }
        });
    });

    // Comparison Counter click
    const compCounter = document.getElementById('comparison-floating-counter');
    if (compCounter) {
        compCounter.addEventListener('click', openComparisonModal);
    }

    // Calibration toggle button
    const btnCalibrate = document.getElementById('btn-calibrate-nodes');
    const labelStatus = document.getElementById('calibration-status-label');
    if (btnCalibrate) {
        btnCalibrate.addEventListener('click', () => {
            state.calibrationMode = !state.calibrationMode;
            if (state.calibrationMode) {
                btnCalibrate.innerText = 'Save Nodes';
                btnCalibrate.style.background = 'var(--color-success)';
                btnCalibrate.style.borderColor = 'var(--color-success)';
                btnCalibrate.style.color = '#ffffff';
                if (labelStatus) {
                    labelStatus.innerHTML = '<span style="color: var(--color-success); font-weight:600;">Edit Mode:</span> Drag boxes to move, drag bottom-right dots to resize!';
                }
                showToast('Calibration Mode: Adjust nodes on the canvas.', 'info');
            } else {
                btnCalibrate.innerText = 'Edit Nodes';
                btnCalibrate.style.background = 'transparent';
                btnCalibrate.style.borderColor = 'var(--border-color)';
                btnCalibrate.style.color = 'var(--text-secondary)';
                if (labelStatus) {
                    labelStatus.innerText = 'Calibrate: adjust visual bounding boxes if misaligned';
                }
                
                // Save calibrated coordinates to localStorage
                const calibrated = JSON.parse(localStorage.getItem('pinterest_calibrated_pins') || '{}');
                if (state.activePin) {
                    calibrated[state.activePin.id] = {};
                    state.activePin.objects.forEach(obj => {
                        calibrated[state.activePin.id][obj.id] = {
                            x: obj.x,
                            y: obj.y,
                            w: obj.w,
                            h: obj.h
                        };
                    });
                    localStorage.setItem('pinterest_calibrated_pins', JSON.stringify(calibrated));
                }
                
                showToast('Nodes calibrated and saved locally!', 'success');
                renderDiscoveryFeed();
            }
            renderActivePin();
        });
    }
}

// ==========================================
// 5. PIN UNDERSTANDING & CANVAS ANALYSIS
// ==========================================

function renderActivePin() {
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer || !state.activePin) return;

    // Clear previous boxes/dots
    const boxes = canvasContainer.querySelectorAll('.bounding-box');
    boxes.forEach(b => b.remove());

    const img = document.getElementById('canvas-img-element');
    img.src = state.activePin.imagePath;

    // Wait for image to load to extract colors and render coordinates
    img.onload = () => {
        // If it's a predefined pin, we have preloaded colors
        let colors = state.activePin.dominantColors;
        
        // Render dominant color chips
        renderColorPalette(colors);
        renderMetaTags();

        // Render bounding boxes
                // Render bounding boxes
        if (state.activePin.objects && state.activePin.objects.length > 0) {
            state.activePin.objects.forEach(obj => {
                const boxDiv = document.createElement('div');
                boxDiv.className = 'bounding-box';
                if (state.selectedObjectId === obj.id) boxDiv.classList.add('active');
                boxDiv.style.left = `${obj.x}%`;
                boxDiv.style.top = `${obj.y}%`;
                boxDiv.style.width = `${obj.w}%`;
                boxDiv.style.height = `${obj.h}%`;
                boxDiv.setAttribute('title', obj.name);
                boxDiv.setAttribute('data-id', obj.id);

                if (state.calibrationMode) {
                    boxDiv.style.border = '2px dashed var(--color-success)';
                    boxDiv.style.background = 'rgba(46, 213, 115, 0.1)';
                    boxDiv.style.cursor = 'move';
                    
                    const label = document.createElement('span');
                    label.innerText = obj.name;
                    label.style.cssText = 'position: absolute; top:-18px; left:0; background: var(--color-success); color: white; font-size: 0.6rem; padding: 1px 4px; border-radius: 4px; white-space: nowrap; pointer-events: none;';
                    boxDiv.appendChild(label);

                    const handle = document.createElement('div');
                    handle.className = 'resize-handle';
                    handle.style.cssText = 'position: absolute; right: -4px; bottom: -4px; width: 10px; height: 10px; background: white; border: 2px solid var(--color-success); border-radius: 50%; cursor: se-resize; z-index: 100;';
                    boxDiv.appendChild(handle);

                    // Drag Event
                    boxDiv.addEventListener('mousedown', (e) => {
                        if (e.target === handle) return;
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const rect = canvasContainer.getBoundingClientRect();
                        const boxRect = boxDiv.getBoundingClientRect();
                        const origLeft = boxRect.left - rect.left;
                        const origTop = boxRect.top - rect.top;

                        const onMouseMove = (moveEvent) => {
                            const dx = moveEvent.clientX - startX;
                            const dy = moveEvent.clientY - startY;
                            let newLeft = origLeft + dx;
                            let newTop = origTop + dy;
                            
                            newLeft = Math.max(0, Math.min(rect.width - boxRect.width, newLeft));
                            newTop = Math.max(0, Math.min(rect.height - boxRect.height, newTop));
                            
                            const leftPercent = (newLeft / rect.width) * 100;
                            const topPercent = (newTop / rect.height) * 100;
                            
                            boxDiv.style.left = `${leftPercent}%`;
                            boxDiv.style.top = `${topPercent}%`;
                            
                            obj.x = Math.round(leftPercent);
                            obj.y = Math.round(topPercent);
                        };

                        const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                        };

                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    });

                    // Resize Event
                    handle.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const rect = canvasContainer.getBoundingClientRect();
                        const boxRect = boxDiv.getBoundingClientRect();
                        const origWidth = boxRect.width;
                        const origHeight = boxRect.height;
                        const origLeft = boxRect.left - rect.left;
                        const origTop = boxRect.top - rect.top;

                        const onMouseMove = (moveEvent) => {
                            const dx = moveEvent.clientX - startX;
                            const dy = moveEvent.clientY - startY;
                            let newWidth = origWidth + dx;
                            let newHeight = origHeight + dy;
                            
                            newWidth = Math.max(20, Math.min(rect.width - origLeft, newWidth));
                            newHeight = Math.max(20, Math.min(rect.height - origTop, newHeight));
                            
                            const widthPercent = (newWidth / rect.width) * 100;
                            const heightPercent = (newHeight / rect.height) * 100;
                            
                            boxDiv.style.width = `${widthPercent}%`;
                            boxDiv.style.height = `${heightPercent}%`;
                            
                            obj.w = Math.round(widthPercent);
                            obj.h = Math.round(heightPercent);
                        };

                        const onMouseUp = () => {
                            document.removeEventListener('mousemove', onMouseMove);
                            document.removeEventListener('mouseup', onMouseUp);
                        };

                        document.addEventListener('mousemove', onMouseMove);
                        document.addEventListener('mouseup', onMouseUp);
                    });

                } else {
                    const dotDiv = document.createElement('div');
                    dotDiv.className = 'bounding-box-dot';
                    boxDiv.appendChild(dotDiv);

                    boxDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = boxDiv.getAttribute('data-id');
                        
                        if (state.selectedObjectId === id) {
                            state.selectedObjectId = null;
                            boxDiv.classList.remove('active');
                        } else {
                            state.selectedObjectId = id;
                            canvasContainer.querySelectorAll('.bounding-box').forEach(b => b.classList.remove('active'));
                            boxDiv.classList.add('active');
                            showToast(`Visual search focused on: ${obj.name}`, 'success');
                        }
                        renderDiscoveryFeed();
                    });
                }

                canvasContainer.appendChild(boxDiv);
            });
        }
    };
}

function renderColorPalette(colors) {
    const paletteContainer = document.getElementById('color-palette-container');
    if (!paletteContainer) return;

    paletteContainer.innerHTML = '';
    colors.forEach(hex => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = hex;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'color-swatch-tooltip';
        tooltip.innerText = hex;
        swatch.appendChild(tooltip);

        // Click to search/filter color
        swatch.addEventListener('click', () => {
            showToast(`Filtering visual matches by color shade ${hex}`, 'info');
            // We could perform a color filter in retrieval
            filterByColor(hex);
        });

        paletteContainer.appendChild(swatch);
    });
}

function renderMetaTags() {
    const container = document.getElementById('meta-tags-container');
    if (!container || !state.activePin) return;

    container.innerHTML = '';

    // Add main style tag
    const styleBadge = document.createElement('span');
    styleBadge.className = 'meta-badge style';
    styleBadge.innerText = `Aesthetic: ${state.activePin.style}`;
    container.appendChild(styleBadge);

    // Add target board assistant suggestions
    const boardBadge = document.createElement('span');
    boardBadge.className = 'meta-badge category';
    boardBadge.innerText = `Suggested Board: ${state.activePin.suggestedBoard}`;
    container.appendChild(boardBadge);

    // Add search tags
    state.activePin.tags.forEach(tag => {
        const tagBadge = document.createElement('span');
        tagBadge.className = 'meta-badge';
        tagBadge.innerText = `#${tag}`;
        container.appendChild(tagBadge);
    });
}

// Canvas Pixel Color Extractor for custom uploaded files
function extractDominantColorsFromImage(imgElement) {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100; // downscale for performance
        ctx.drawImage(imgElement, 0, 0, 100, 100);
        
        const imgData = ctx.getImageData(0, 0, 100, 100).data;
        const colorCounts = {};
        
        // Sample every 4th pixel to save time
        for (let i = 0; i < imgData.length; i += 16) {
            const r = imgData[i];
            const g = imgData[i+1];
            const b = imgData[i+2];
            
            // Convert to HEX
            const rgb = (r << 16) | (g << 8) | b;
            let hex = '#' + ('000000' + rgb.toString(16)).slice(-6);
            
            // Round hex values to cluster colors slightly
            const roundedHex = roundColorHex(hex);
            colorCounts[roundedHex] = (colorCounts[roundedHex] || 0) + 1;
        }

        // Sort colors by frequency
        const sortedColors = Object.keys(colorCounts).sort((a,b) => colorCounts[b] - colorCounts[a]);
        // Return top 4 dominant colors
        return sortedColors.slice(0, 4);
    } catch (e) {
        console.error('Color extraction failed (likely CORS on external image URL)', e);
        // Fallback colors
        return ['#57606f', '#2f3542', '#a4b0be', '#f1f2f6'];
    }
}

function roundColorHex(hex) {
    // Basic rounding to group close colors
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Round to nearest 32
    r = Math.min(255, Math.round(r / 48) * 48);
    g = Math.min(255, Math.round(g / 48) * 48);
    b = Math.min(255, Math.round(b / 48) * 48);
    
    const rgb = (r << 16) | (g << 8) | b;
    return '#' + ('000000' + rgb.toString(16)).slice(-6);
}

// Custom Upload Handler
function handleUploadedFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const customPin = {
            id: 'custom_upload_' + Date.now(),
            title: file.name.split('.')[0] || 'Uploaded Image',
            imagePath: e.target.result,
            dominantColors: ['#333', '#666', '#999', '#ccc'], // filled post-load
            tags: ['custom-upload', 'visual-search'],
            style: 'Modern',
            suggestedBoard: 'Wishlist',
            objects: [] // populated by user clicking or choosing a class
        };

        // Switch to uploaded display
        state.selectedPresetId = null;
        state.activePin = customPin;
        state.selectedObjectId = null;

        // Render loading state first
        showToast('Uploading and analyzing image features...', 'info');
        
        // Update carousel state (unselect all)
        document.querySelectorAll('.preset-item').forEach(el => el.classList.remove('active'));
        
        // Render
        const img = document.getElementById('canvas-img-element');
        img.src = customPin.imagePath;
        
        img.onload = () => {
            // Extract actual color palette from uploaded image!
            const realColors = extractDominantColorsFromImage(img);
            customPin.dominantColors = realColors;
            
            // Auto detect objects (simulate smart bounding boxes for custom image)
            // To make it extremely interesting, we will place 2 simulated bounding boxes
            // based on the theme of the page or random coordinates, so they can test immediately.
            customPin.objects = [
                { id: 'custom_obj_1', name: 'Detected Object A', category: 'Sofa', x: 20, y: 30, w: 40, h: 40, style: 'Cozy Modern', tags: ['decor', 'furniture'], color: realColors[0] },
                { id: 'custom_obj_2', name: 'Detected Object B', category: 'Lamp', x: 65, y: 20, w: 15, h: 60, style: 'Minimalist', tags: ['lighting', 'metal'], color: realColors[1] }
            ];

            renderActivePin();
            renderDiscoveryFeed();
            showToast('Analysis complete: Dominant colors and item nodes extracted!', 'success');
        };
    };
    reader.readAsDataURL(file);
}

// URL Search Handler
function handleUrlSearch(url) {
    showToast('Fetching Pin metadata from URL...', 'info');
    
    // Simulate fetching Pinterest API details
    setTimeout(() => {
        // We will mock loading a Pin. If the URL contains "outfit", we load one of our outfits
        // If it contains "decor" or "room", we load the room. Else, we load a custom mock.
        let matchingPin = SAMPLE_PINS[0]; // default Cozy room
        
        if (url.includes('outfit') || url.includes('fashion') || url.includes('style')) {
            matchingPin = SAMPLE_PINS[1]; // minimal outfit
        } else if (url.includes('study') || url.includes('office') || url.includes('desk')) {
            matchingPin = SAMPLE_PINS[3]; // study
        }
        
        state.selectedPresetId = matchingPin.id;
        state.activePin = matchingPin;
        state.selectedObjectId = null;
        
        // Highlight active thumbnail in carousel
        document.querySelectorAll('.preset-item').forEach(el => {
            if (el.getAttribute('data-id') === matchingPin.id) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        renderActivePin();
        renderDiscoveryFeed();
        showToast('Successfully fetched Pin from Pinterest graph!', 'success');
    }, 1200);
}

// ==========================================
// 6. VISUAL RETRIEVAL & SEARCH ENGINE
// ==========================================

function getActiveBoardName() {
    const b = state.boards.find(x => x.id === state.activeBoardId);
    return b ? b.name : 'None';
}

function getActiveBoard() {
    return state.boards.find(x => x.id === state.activeBoardId);
}

function setActiveBoard(boardId) {
    state.activeBoardId = boardId;
    const boardSelect = document.getElementById('header-board-select');
    if (boardSelect) {
        boardSelect.value = boardId;
    }
}

function calculateSimilarity(product, searchTarget) {
    let score = 0;
    
    // 1. Category Match (Very High Importance for product match)
    if (product.category.toLowerCase() === searchTarget.category.toLowerCase()) {
        score += 45;
    }

    // 2. Style Match (e.g. Minimalist, Cozy Modern, Mid-Century)
    if (product.style.toLowerCase() === searchTarget.style.toLowerCase()) {
        score += 20;
    }

    // 3. Tag Overlap (Jaccard similarity)
    if (searchTarget.tags && searchTarget.tags.length > 0) {
        const prodTags = product.tags;
        const intersection = prodTags.filter(t => searchTarget.tags.includes(t));
        const union = [...new Set([...prodTags, ...searchTarget.tags])];
        const jaccard = intersection.length / union.length;
        score += Math.round(jaccard * 20);
    }

    // 4. Color Proximity
    // Check if product contains dominant color or tags match color names
    const colorMatches = product.colors.filter(c => {
        if (searchTarget.color) {
            return isColorSimilar(c, searchTarget.color);
        }
        return false;
    });
    if (colorMatches.length > 0) {
        score += 15;
    }

    // 5. Personalization graph rank boost based on user's active board
    const activeBoard = getActiveBoard();
    if (activeBoard) {
        // Boost if matches active board theme style
        if (activeBoard.styleFocus.toLowerCase() === product.style.toLowerCase()) {
            score += 10;
        }
        // Boost if matches active board category focus
        if (activeBoard.categoryFocus.toLowerCase() === 'fashion' && ['Blazer', 'T-Shirt', 'Jeans', 'Shoes', 'Cardigan', 'Dress'].includes(product.category)) {
            score += 5;
        }
        if (activeBoard.categoryFocus.toLowerCase() === 'home decor' && ['Sofa', 'Lamp', 'Rug', 'Table', 'Desk', 'Chair', 'Plant'].includes(product.category)) {
            score += 5;
        }
    }

    // 6. User feedback loop influence (up/down signals)
    const feedback = state.userFeedback[product.id];
    if (feedback === 'up') {
        score += 10; // Boost
    } else if (feedback === 'down') {
        score -= 25; // Heavily penalize
    }

    return Math.min(100, Math.max(0, score));
}

// Simple Hex color similarity approximation
function isColorSimilar(hex1, hex2) {
    // Convert to RGB
    const r1 = parseInt(hex1.substring(1,3), 16);
    const g1 = parseInt(hex1.substring(3,5), 16);
    const b1 = parseInt(hex1.substring(5,7), 16);

    const r2 = parseInt(hex2.substring(1,3), 16);
    const g2 = parseInt(hex2.substring(3,5), 16);
    const b2 = parseInt(hex2.substring(5,7), 16);

    // Euclidean distance in RGB space
    const distance = Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
    // Threshold (lower means more similar)
    return distance < 130; 
}

function retrieveSimilarProducts() {
    let results = [];
    
    if (state.selectedObjectId) {
        // Search matches for a SPECIFIC object
        const activeObj = state.activePin.objects.find(o => o.id === state.selectedObjectId);
        if (!activeObj) return [];

        PRODUCT_CATALOG.forEach(prod => {
            const similarity = calculateSimilarity(prod, activeObj);
            // Only keep items with a baseline similarity
            if (similarity > 20) {
                results.push({
                    product: prod,
                    score: similarity,
                    matchType: getMatchType(prod, activeObj)
                });
            }
        });
    } else {
        // Search matches for the WHOLE pin
        // Build a composite target based on pin tags, styles, colors
        const compositeTarget = {
            category: 'Any',
            style: state.activePin.style,
            tags: state.activePin.tags,
            color: state.activePin.dominantColors[0]
        };

        PRODUCT_CATALOG.forEach(prod => {
            const similarity = calculateSimilarity(prod, compositeTarget);
            if (similarity > 15) {
                results.push({
                    product: prod,
                    score: similarity,
                    matchType: 'alternative'
                });
            }
        });
    }

    // Sort results by similarity score descending
    results.sort((a, b) => b.score - a.score);
    return results;
}

function getMatchType(product, activeObj) {
    if (product.name.toLowerCase().includes('exact') || product.id.includes('exact')) {
        return 'exact';
    }
    // Check if price is lower than exact
    const exactItem = PRODUCT_CATALOG.find(p => p.category === activeObj.category && (p.id.includes('exact')));
    if (exactItem) {
        if (product.price < exactItem.price) return 'cheaper';
        if (product.price > exactItem.price) return 'premium';
    }
    return 'alternative';
}

// Color filter
function filterByColor(hexColor) {
    const gridContainer = document.getElementById('discovery-grid-container');
    if (!gridContainer) return;
    
    // Perform simple visual search with strong focus on color similarity
    const dummyTarget = {
        category: 'Any',
        style: 'Any',
        tags: [],
        color: hexColor
    };

    let filtered = PRODUCT_CATALOG.map(prod => {
        let score = 0;
        const colorMatches = prod.colors.filter(c => isColorSimilar(c, hexColor));
        if (colorMatches.length > 0) score += 60;
        
        // Add active board boost
        const activeBoard = getActiveBoard();
        if (activeBoard && activeBoard.styleFocus.toLowerCase() === prod.style.toLowerCase()) {
            score += 15;
        }

        return { product: prod, score, matchType: 'alternative' };
    }).filter(x => x.score > 20);

    filtered.sort((a,b) => b.score - a.score);
    renderResults(filtered);
}

// ==========================================
// 7. EXPLANATION GENERATOR
// ==========================================

function generateExplanation(itemMatch, searchTarget) {
    const prod = itemMatch.product;
    const activeBoard = getActiveBoard();

    // 1. Check if boosted by active board personalization
    if (activeBoard && activeBoard.styleFocus.toLowerCase() === prod.style.toLowerCase()) {
        return `Saved by users with similar boards (matches your active board: <strong>${activeBoard.name}</strong>).`;
    }

    // 2. Check if feedback boost
    if (state.userFeedback[prod.id] === 'up') {
        return `Recommended based on your positive feedback for ${prod.brand} items.`;
    }

    // 3. Match type explanation
    if (itemMatch.matchType === 'exact') {
        return `98% visual match: Same color palette, modern design lines, and premium materials.`;
    }

    if (itemMatch.matchType === 'cheaper') {
        // Find exact item price to calculate savings
        const exact = PRODUCT_CATALOG.find(p => p.category === prod.category && p.id.includes('exact'));
        const savings = exact ? exact.price - prod.price : 0;
        return `Cheaper alternative in same color tone. ${savings > 0 ? `Saves you $${savings}!` : ''}`;
    }

    if (itemMatch.matchType === 'premium') {
        return `Premium material upgrade with hand-crafted detailing and custom finishes.`;
    }

    // Default tag/color overlap explanation
    return `Shares similar silhoutte, materials, and modern ${prod.style.toLowerCase()} styling.`;
}

// ==========================================
// 8. RENDER DISCOVERY RESULTS
// ==========================================

function renderDiscoveryFeed() {
    const gridContainer = document.getElementById('discovery-grid-container');
    if (!gridContainer) return;

    // Show skeletons to simulate visual search loading transition
    gridContainer.innerHTML = Array(4).fill(0).map(() => `<div class="skeleton-card"></div>`).join('');

    setTimeout(() => {
        let results = retrieveSimilarProducts();
        
        // Apply filter tab
        if (state.activeTab === 'cheaper') {
            results = results.filter(r => r.matchType === 'cheaper');
        } else if (state.activeTab === 'premium') {
            results = results.filter(r => r.matchType === 'premium');
        } else if (state.activeTab === 'personalized') {
            const activeBoard = getActiveBoard();
            results = results.filter(r => {
                // Return items that match active board style or custom signals
                const hasFeedback = state.userFeedback[r.product.id] === 'up';
                const matchesStyle = activeBoard && activeBoard.styleFocus.toLowerCase() === r.product.style.toLowerCase();
                return matchesStyle || hasFeedback;
            });
        }

        renderResults(results);
    }, 400); // short delay for visual transition
}

function renderResults(results) {
    const gridContainer = document.getElementById('discovery-grid-container');
    if (!gridContainer) return;

    if (results.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <h3>No recommendations found</h3>
                <p>Try switching tabs or adjusting your selected object pin to discover items.</p>
            </div>
        `;
        return;
    }

    gridContainer.innerHTML = '';
    
    results.forEach(match => {
        const prod = match.product;
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-id', prod.id);

        const isSaved = !!state.savedPins[prod.id];
        const isSelectedForComp = state.comparisonList.includes(prod.id);
        const explanation = generateExplanation(match, state.selectedObjectId);

        // Feedback states
        const feedback = state.userFeedback[prod.id];
        const upActive = feedback === 'up' ? 'active' : '';
        const downActive = feedback === 'down' ? 'active' : '';

        // Check if catalog has an image path, otherwise draw beautifully stylized SVG placeholder
        let cardImageHtml = '';
        if (prod.imagePath) {
            cardImageHtml = `<img src="${prod.imagePath}" alt="${prod.name}">`;
        } else {
            // Premium SVG dynamic mockup matching the color palette and style!
            cardImageHtml = `
                <svg width="100%" height="100%" viewBox="0 0 200 200" style="background: ${prod.gradient || '#1e293b'}">
                    <defs>
                        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.3"/>
                        </filter>
                    </defs>
                    <rect x="0" y="0" width="200" height="200" fill="url(#bg-grad)" opacity="0.05"/>
                    <g filter="url(#shadow)">
                        ${getMockSvgIcon(prod.category, prod.colors[0] || '#fff')}
                    </g>
                    <text x="10" y="190" fill="rgba(255,255,255,0.4)" font-family="Outfit" font-size="9" font-weight="600" letter-spacing="1">${prod.style.toUpperCase()}</text>
                </svg>
            `;
        }

        card.innerHTML = `
            <div class="card-image-wrapper">
                ${cardImageHtml}
                <div class="match-score">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    <span>${match.score}% match</span>
                </div>
                <div class="price-tag">$${prod.price}</div>
                <div class="tier-badge ${match.matchType}">${match.matchType}</div>
            </div>
            <div class="card-details">
                <div class="product-meta">
                    <span class="product-brand">${prod.brand}</span>
                    <span>★ ${prod.rating}</span>
                </div>
                <h4 class="product-title">${prod.name}</h4>
                <div class="explanation-box ${match.score > 85 ? 'graph' : ''}">
                    ${explanation}
                </div>
                <div class="card-actions">
                    <button class="btn-card save-pin ${isSaved ? 'saved' : ''}" onclick="handleSaveAction('${prod.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                        <span>${isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                    <button class="btn-card compare-pin ${isSelectedForComp ? 'selected' : ''}" onclick="toggleCompare('${prod.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h2V1h-2v2zm0 16H5V5h5v14zm10-5h-5v7h5c1.1 0 2-.9 2-2v-3c0-1.1-.9-2-2-2zm0 5h-3v-3h3v3z"/></svg>
                        <span>Compare</span>
                    </button>
                    <a href="${prod.shopUrl}" target="_blank" class="btn-card" style="grid-column: 1 / -1; margin-top: 0.25rem; text-decoration: none; background: rgba(30, 144, 255, 0.1); border-color: rgba(30, 144, 255, 0.2); color: #0097e6;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                        <span>Shop Product</span>
                    </a>
                </div>
                <div class="feedback-row">
                    <span style="font-size:0.65rem; color:var(--text-muted); margin-right:auto; align-self:center;">Is this relevant?</span>
                    <button class="btn-feedback thumbs-up ${upActive}" onclick="handleFeedback('${prod.id}', 'up')" title="Highly Relevant">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.02-.1-.01-.88z"/></svg>
                    </button>
                    <button class="btn-feedback thumbs-down ${downActive}" onclick="handleFeedback('${prod.id}', 'down')" title="Not Relevant">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 15h4V3h-4v12zM21 1c-1.1 0-2 .9-2 2v10c0 .55.22 1.05.59 1.41l6.59 6.59c.27.27.65.44 1.06.44.32 0 .61-.1.85-.27l-3.02-7.05C23.04 13.5 22.33 13 21.5 13H15.2l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 21h-9v-2h6.31l-.95-4.57-.03-.32c0-.41.17-.79.44-1.06L14.17 1z"/></svg>
                    </button>
                </div>
            </div>
        `;
        gridContainer.appendChild(card);
    });
}

function getMockSvgIcon(category, hexColor) {
    // Generate beautiful clean flat SVGs representing categories
    const fillStr = `fill="${hexColor}"`;
    switch(category) {
        case 'Sofa':
            return `<path d="M20 120 h160 v30 h-160 z M30 80 h140 v40 h-140 z M15 100 h15 v40 h-15 z M170 100 h15 v40 h-15 z" ${fillStr}/>`;
        case 'Lamp':
            return `<path d="M90 150 h20 v10 h-20 z M98 40 h4 v110 h-4 z M75 40 h50 l-15 -25 h-20 z" ${fillStr}/>`;
        case 'Rug':
            return `<rect x="30" y="60" width="140" height="80" rx="4" ${fillStr} stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-dasharray="4"/>`;
        case 'Table':
            return `<path d="M20 70 h160 v15 h-160 z M40 85 h10 v60 h-10 z M150 85 h10 v60 h-10 z" ${fillStr}/>`;
        case 'Blazer':
            return `<path d="M50 40 L80 20 L100 45 L120 20 L150 40 L160 110 L140 160 L100 145 L60 160 L40 110 Z" ${fillStr}/>`;
        case 'T-Shirt':
            return `<path d="M50 40 l20 -10 l15 20 l15 -20 l20 10 l10 30 l-15 10 v70 h-60 v-70 l-15 -10 z" ${fillStr}/>`;
        case 'Jeans':
            return `<path d="M60 30 h80 l15 130 h-35 l-20 -70 l-20 70 h-35 z" ${fillStr}/>`;
        case 'Shoes':
            return `<path d="M30 130 c20 -20 60 -25 90 -25 c10 0 20 10 35 15 c10 5 15 25 15 25 h-140 z" ${fillStr}/>`;
        case 'Cardigan':
            return `<path d="M40 40 L70 15 L100 40 L130 15 L160 40 L155 150 L100 160 L45 150 Z M90 40 v120 h20 v-120 z" ${fillStr}/>`;
        case 'Dress':
            return `<path d="M70 20 h60 l20 50 l-15 10 l30 80 h-110 l30 -80 l-15 -10 z" ${fillStr}/>`;
        case 'Desk':
            return `<path d="M15 80 h170 v15 h-170 z M25 95 h25 v30 h-25 z M150 95 h25 v30 h-25 z M45 125 h10 v40 h-10 z M145 125 h10 v40 h-10 z" ${fillStr}/>`;
        case 'Chair':
            return `<path d="M70 40 h60 v50 h-60 z M65 90 h70 v10 h-70 z M80 100 l-10 60 h10 l10 -60 z M120 100 l10 60 h-10 l-10 -60 z" ${fillStr}/>`;
        case 'Plant':
            return `<path d="M80 120 h40 l-5 45 h-30 z M100 120 v-40 M90 90 c0 -20 20 -30 20 -40 c0 10 10 20 10 40 z" ${fillStr}/>`;
        default:
            return `<circle cx="100" cy="100" r="50" ${fillStr}/>`;
    }
}

// ==========================================
// 9. BOARD ASSISTANT MODULE
// ==========================================

function handleSaveAction(prodId) {
    const product = PRODUCT_CATALOG.find(p => p.id === prodId);
    if (!product) return;

    // Check if already saved
    if (state.savedPins[prodId]) {
        // Unsave
        const boardId = state.savedPins[prodId];
        delete state.savedPins[prodId];
        savePinsToStorage();
        
        // Decrement board count
        const board = state.boards.find(b => b.id === boardId);
        if (board && board.itemsCount > 0) {
            board.itemsCount--;
            saveBoardsToStorage();
        }

        renderDiscoveryFeed();
        showToast('Removed pin from board', 'info');
        return;
    }

    // Open Board Picker Modal
    openBoardPickerModal(product);
}

function openBoardPickerModal(product) {
    const overlay = document.getElementById('save-board-modal');
    if (!overlay) return;

    overlay.classList.add('active');

    // Suggest a board automatically (Board Assistant)
    // Rule: Outfits board for fashion, Home Decor for decor items.
    let suggestedBoardId = 'board_decor';
    const fashionCategories = ['Blazer', 'T-Shirt', 'Jeans', 'Shoes', 'Cardigan', 'Dress'];
    if (fashionCategories.includes(product.category)) {
        suggestedBoardId = 'board_outfits';
    } else if (product.category === 'Desk' || product.category === 'Chair' || product.category === 'Plant') {
        suggestedBoardId = 'board_study';
    }

    const pickerList = document.getElementById('board-picker-list');
    pickerList.innerHTML = '';

    state.boards.forEach(board => {
        const item = document.createElement('div');
        item.className = 'board-picker-item';
        if (board.id === suggestedBoardId) item.classList.add('suggested');

        item.innerHTML = `
            <div>
                <strong>${board.name}</strong>
                <div style="font-size:0.7rem; color:var(--text-muted)">Style: ${board.styleFocus}</div>
            </div>
        `;

        item.addEventListener('click', () => {
            // Save to this board
            state.savedPins[product.id] = board.id;
            savePinsToStorage();
            
            // Increment count
            board.itemsCount++;
            saveBoardsToStorage();

            overlay.classList.remove('active');
            renderDiscoveryFeed();
            showToast(`Saved to board: ${board.name}`, 'success');
        });

        pickerList.appendChild(item);
    });

    // Create board inline action
    const btnCreate = document.getElementById('btn-create-board-inline');
    const inputCreate = document.getElementById('input-create-board-inline');

    // Remove previous listeners
    const newBtn = btnCreate.cloneNode(true);
    btnCreate.parentNode.replaceChild(newBtn, btnCreate);

    newBtn.addEventListener('click', () => {
        const name = inputCreate.value.trim();
        if (!name) {
            showToast('Enter a board name', 'warning');
            return;
        }

        const newId = 'board_' + Date.now();
        const newBoard = {
            id: newId,
            name: name,
            styleFocus: product.style,
            categoryFocus: ['Sofa', 'Lamp', 'Rug', 'Table', 'Desk', 'Chair', 'Plant'].includes(product.category) ? 'Home Decor' : 'Fashion',
            itemsCount: 1
        };

        state.boards.push(newBoard);
        saveBoardsToStorage();
        
        state.savedPins[product.id] = newId;
        savePinsToStorage();

        inputCreate.value = '';
        overlay.classList.remove('active');
        renderBoardSelector();
        renderDiscoveryFeed();
        showToast(`Created board & saved to: ${name}`, 'success');
    });
}

function renderBoardSelector() {
    const boardSelect = document.getElementById('header-board-select');
    if (!boardSelect) return;

    boardSelect.innerHTML = '';
    state.boards.forEach(board => {
        const option = document.createElement('option');
        option.value = board.id;
        option.text = `${board.name} (${board.itemsCount})`;
        if (board.id === state.activeBoardId) option.selected = true;
        boardSelect.add(option);
    });
}

// ==========================================
// 10. PRODUCT COMPARISON ENGINE
// ==========================================

function toggleCompare(prodId) {
    const idx = state.comparisonList.indexOf(prodId);
    if (idx > -1) {
        state.comparisonList.splice(idx, 1);
        showToast('Removed product from comparison list', 'info');
    } else {
        if (state.comparisonList.length >= 3) {
            showToast('You can compare a maximum of 3 products at a time.', 'warning');
            return;
        }
        state.comparisonList.push(prodId);
        showToast('Added product to comparison list', 'success');
    }

    updateComparisonCounter();
    renderDiscoveryFeed();
}

function updateComparisonCounter() {
    const counter = document.getElementById('comparison-floating-counter');
    if (!counter) return;

    const count = state.comparisonList.length;
    if (count > 0) {
        counter.innerHTML = `Compare Products (${count})`;
        counter.style.display = 'block';
    } else {
        counter.style.display = 'none';
    }
}

function openComparisonModal() {
    const overlay = document.getElementById('comparison-modal');
    if (!overlay) return;

    overlay.classList.add('active');

    const tableBody = document.getElementById('comparison-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    const products = state.comparisonList.map(id => PRODUCT_CATALOG.find(p => p.id === id)).filter(Boolean);

    // Build table rows
    const attributes = [
        { label: 'Product Info', key: 'header' },
        { label: 'Brand', key: 'brand' },
        { label: 'Price', key: 'price', format: (val) => `$${val}` },
        { label: 'Aesthetic / Style', key: 'style' },
        { label: 'Rating', key: 'rating', format: (val) => `★ ${val}` },
        { label: 'Material', key: 'material' },
        { label: 'Key Tags', key: 'tags', format: (val) => val.slice(0,3).join(', ') }
    ];

    attributes.forEach(attr => {
        const row = document.createElement('tr');
        
        const labelTd = document.createElement('td');
        labelTd.style.fontWeight = '700';
        labelTd.innerText = attr.label;
        row.appendChild(labelTd);

        products.forEach(p => {
            const td = document.createElement('td');
            if (attr.key === 'header') {
                let imgHtml = '';
                if (p.imagePath) {
                    imgHtml = `<img src="${p.imagePath}" alt="${p.name}">`;
                } else {
                    imgHtml = `
                        <div style="width:80px; height:80px; border-radius:8px; background:${p.gradient}; display:flex; align-items:center; justify-content:center;">
                            <svg width="32" height="32" viewBox="0 0 200 200">
                                ${getMockSvgIcon(p.category, '#fff')}
                            </svg>
                        </div>
                    `;
                }
                td.innerHTML = `
                    <div class="comparison-item-header">
                        ${imgHtml}
                        <strong>${p.name}</strong>
                    </div>
                `;
            } else {
                const val = p[attr.key];
                td.innerHTML = attr.format ? attr.format(val) : val;
            }
            row.appendChild(td);
        });

        tableBody.appendChild(row);
    });
}

// ==========================================
// 11. RELEVANCE FEEDBACK LOOP
// ==========================================

function handleFeedback(prodId, type) {
    if (state.userFeedback[prodId] === type) {
        // Toggle off
        delete state.userFeedback[prodId];
        showToast('Feedback reset', 'info');
    } else {
        state.userFeedback[prodId] = type;
        if (type === 'up') {
            showToast('Thanks! We will show more recommendations like this.', 'success');
        } else {
            showToast('Got it. Down-ranking similar recommendations.', 'warning');
        }
    }
    
    saveFeedbackToStorage();
    renderDiscoveryFeed();
}

// ==========================================
// 12. UTILITIES & TOASTS
// ==========================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 50);

    // Remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function renderPresetCarousel() {
    const container = document.getElementById('preset-carousel-container');
    if (!container) return;

    container.innerHTML = '';
    SAMPLE_PINS.forEach(pin => {
        const div = document.createElement('div');
        div.className = `preset-item ${pin.id === state.selectedPresetId ? 'active' : ''}`;
        div.setAttribute('data-id', pin.id);
        div.innerHTML = `
            <img src="${pin.imagePath}" alt="${pin.title}">
            <div class="preset-label">${pin.title}</div>
        `;
        container.appendChild(div);
    });
}

// ==========================================
// 13. BOOTSTRAP APP ON LOAD
// ==========================================

window.addEventListener('DOMContentLoaded', initApp);
