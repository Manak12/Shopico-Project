// Simple in-memory catalog; images via picsum
const CATEGORIES = ["All", "Accessories", "Apparel", "Electronics", "Home", "Outdoor"];

let PRODUCTS = [
  { id: "p1", title: "Minimalist Wristwatch", brand: "Aurex", mrp: 199.0, price: 129.0, discount: 35, rating: 4.6, reviews: 1421, category: "Accessories", image: "https://picsum.photos/id/1062/800/600", delivery: "Free delivery by Tue", return: "7-day replacement", description: "A modern timepiece with sapphire glass and leather strap." },
  { id: "p2", title: "Noise-canceling Headphones", brand: "SonicPro", mrp: 329.0, price: 249.0, discount: 24, rating: 4.8, reviews: 2875, category: "Electronics", image: "https://picsum.photos/id/180/800/600", delivery: "Free delivery by Mon", return: "10-day return", description: "Immersive sound with active noise cancellation and 30h battery." },
  { id: "p3", title: "Ergonomic Office Chair", brand: "ErgoFlex", mrp: 449.0, price: 349.0, discount: 22, rating: 4.5, reviews: 964, category: "Home", image: "https://picsum.photos/id/83/800/600", delivery: "No-cost EMI available", return: "10-day return", description: "Adjustable lumbar support and breathable mesh back." },
  { id: "p4", title: "Performance Running Shoes", brand: "FleetRun", mrp: 179.0, price: 119.0, discount: 33, rating: 4.4, reviews: 2117, category: "Apparel", image: "https://picsum.photos/id/21/800/600", delivery: "Prime • Tomorrow", return: "7-day return", description: "Lightweight cushioning for everyday miles and race day." },
  { id: "p5", title: "Smart Home Speaker", brand: "EchoSphere", mrp: 119.0, price: 89.0, discount: 25, rating: 4.2, reviews: 3210, category: "Electronics", image: "https://picsum.photos/id/1080/800/600", delivery: "Free delivery by Wed", return: "10-day return", description: "Voice-controlled speaker with room-filling sound." },
  { id: "p6", title: "Stoneware Mug Set", brand: "Hearth", mrp: 59.0, price: 39.0, discount: 34, rating: 4.7, reviews: 640, category: "Home", image: "https://picsum.photos/id/292/800/600", delivery: "Free delivery by Fri", return: "7-day return", description: "Set of 4 hand-glazed mugs, dishwasher safe." },
  { id: "p7", title: "Packable Down Jacket", brand: "NorthPeak", mrp: 219.0, price: 159.0, discount: 27, rating: 4.5, reviews: 1750, category: "Apparel", image: "https://picsum.photos/id/1011/800/600", delivery: "Prime • Tomorrow", return: "7-day return", description: "Warmth without weight, packs into its own pocket." },
  { id: "p8", title: "Stainless Steel Water Bottle", brand: "TrailMate", mrp: 39.0, price: 29.0, discount: 26, rating: 4.9, reviews: 5321, category: "Outdoor", image: "https://picsum.photos/id/1060/800/600", delivery: "Free delivery by Thu", return: "7-day return", description: "Insulated bottle keeps drinks cold for 24h, hot for 12h." },
  { id: "p9", title: "Laptop Backpack", brand: "UrbanCarry", mrp: 129.0, price: 99.0, discount: 23, rating: 4.3, reviews: 1189, category: "Accessories", image: "https://picsum.photos/id/1015/800/600", delivery: "Free delivery by Tue", return: "10-day return", description: "Weather-resistant backpack with 16\" laptop sleeve." },
  { id: "p10", title: "4K Action Camera", brand: "GoActive", mrp: 259.0, price: 199.0, discount: 23, rating: 4.1, reviews: 754, category: "Electronics", image: "https://picsum.photos/id/250/800/600", delivery: "Free delivery by Wed", return: "7-day return", description: "Stabilized 4K60 video with waterproof housing." },
  { id: "p11", title: "Aromatherapy Diffuser", brand: "CalmMist", mrp: 59.0, price: 45.0, discount: 24, rating: 4.4, reviews: 932, category: "Home", image: "https://picsum.photos/id/312/800/600", delivery: "Free delivery by Thu", return: "7-day return", description: "Ultrasonic diffuser with ambient light and timer." },
  { id: "p12", title: "Trail Hiking Poles", brand: "AltiGear", mrp: 89.0, price: 69.0, discount: 22, rating: 4.6, reviews: 641, category: "Outdoor", image: "https://picsum.photos/id/1021/800/600", delivery: "Free delivery by Tue", return: "7-day return", description: "Carbon fiber poles with cork grips, adjustable length." }
  , { id: "p13", title: "Wireless Mouse", brand: "ClickPro", mrp: 39.0, price: 24.0, discount: 38, rating: 4.3, reviews: 2012, category: "Electronics", image: "https://picsum.photos/id/1069/800/600", delivery: "Free delivery by Thu", return: "7-day return", description: "Ergonomic 2.4GHz mouse with silent clicks." }
  , { id: "p14", title: "Mechanical Keyboard", brand: "KeySmith", mrp: 149.0, price: 109.0, discount: 27, rating: 4.6, reviews: 1344, category: "Electronics", image: "https://picsum.photos/id/191/800/600", delivery: "Free delivery by Fri", return: "10-day return", description: "Hot-swappable switches with RGB backlight." }
  , { id: "p15", title: "Leather Belt", brand: "Form&Fit", mrp: 49.0, price: 29.0, discount: 41, rating: 4.2, reviews: 603, category: "Accessories", image: "https://picsum.photos/id/28/800/600", delivery: "Free delivery by Wed", return: "7-day return", description: "Full-grain leather belt with brushed buckle." }
  , { id: "p16", title: "Sunglasses Polarized", brand: "SunGuard", mrp: 99.0, price: 69.0, discount: 30, rating: 4.5, reviews: 911, category: "Accessories", image: "https://picsum.photos/id/237/800/600", delivery: "Free delivery by Mon", return: "7-day return", description: "UV400 protection with polarized lenses." }
  , { id: "p17", title: "Crew Neck T-Shirt", brand: "CottonCo", mrp: 29.0, price: 19.0, discount: 34, rating: 4.4, reviews: 2201, category: "Apparel", image: "https://picsum.photos/id/365/800/600", delivery: "Prime • Tomorrow", return: "7-day return", description: "100% cotton everyday tee." }
  , { id: "p18", title: "Slim Fit Jeans", brand: "DenimLab", mrp: 69.0, price: 49.0, discount: 29, rating: 4.3, reviews: 1788, category: "Apparel", image: "https://picsum.photos/id/362/800/600", delivery: "Free delivery by Tue", return: "7-day return", description: "Stretch denim with tapered fit." }
  , { id: "p19", title: "Ceramic Dinner Set", brand: "HomeSet", mrp: 129.0, price: 89.0, discount: 31, rating: 4.5, reviews: 844, category: "Home", image: "https://picsum.photos/id/477/800/600", delivery: "Free delivery by Thu", return: "10-day return", description: "Dinner set for 6, microwave safe." }
  , { id: "p20", title: "Memory Foam Pillow", brand: "SleepEase", mrp: 59.0, price: 39.0, discount: 34, rating: 4.6, reviews: 1570, category: "Home", image: "https://picsum.photos/id/484/800/600", delivery: "Free delivery by Wed", return: "10-day return", description: "Cooling gel-infused pillow." }
  , { id: "p21", title: "Camping Lantern", brand: "CampFire", mrp: 49.0, price: 32.0, discount: 35, rating: 4.4, reviews: 922, category: "Outdoor", image: "https://picsum.photos/id/1016/800/600", delivery: "Free delivery by Fri", return: "7-day return", description: "Rechargeable LED lantern, 1000lm." }
  , { id: "p22", title: "Trekking Backpack 50L", brand: "SummitPack", mrp: 159.0, price: 119.0, discount: 25, rating: 4.5, reviews: 1103, category: "Outdoor", image: "https://picsum.photos/id/1018/800/600", delivery: "Free delivery by Wed", return: "7-day return", description: "Supportive frame with rain cover." }
  , { id: "p23", title: "Smart LED Bulb", brand: "Lumo", mrp: 19.0, price: 12.0, discount: 37, rating: 4.1, reviews: 2987, category: "Electronics", image: "https://picsum.photos/id/82/800/600", delivery: "Free delivery by Tue", return: "7-day return", description: "Wi‑Fi bulb supports Alexa/Google." }
  , { id: "p24", title: "Stainless Cutlery Set", brand: "ChefHaus", mrp: 79.0, price: 54.0, discount: 32, rating: 4.3, reviews: 465, category: "Home", image: "https://picsum.photos/id/433/800/600", delivery: "Free delivery by Thu", return: "10-day return", description: "24‑piece set, dishwasher safe." }
  , { id: "p25", title: "Sports Socks (Pack of 3)", brand: "Stride", mrp: 19.0, price: 12.0, discount: 37, rating: 4.2, reviews: 1043, category: "Apparel", image: "https://picsum.photos/id/365/800/600", delivery: "Prime • Tomorrow", return: "7-day return", description: "Cushioned arch support." }
];

// Ensure at least 20 products per category (except "All") by generating variants
(function ensureTwentyPerCategory(){
  const baseByCat = PRODUCTS.reduce((acc, p) => { (acc[p.category] ||= []).push(p); return acc; }, {});
  const targetPerCat = 20;
  const makeId = (prefix, i) => `${prefix}-${i}`;
  const newItems = [];
  for (const cat of CATEGORIES) {
    if (cat === 'All') continue;
    const arr = baseByCat[cat] || [];
    for (let i = arr.length; i < targetPerCat; i++) {
      const seed = arr[i % Math.max(1, arr.length)] || PRODUCTS[i % PRODUCTS.length];
      const id = makeId(seed.id || cat.toLowerCase(), i+1);
      newItems.push({
        id,
        title: `${seed.title} ${i+1}`,
        brand: seed.brand,
        mrp: Math.round((seed.mrp + (i%5)*3) * 100) / 100,
        price: Math.max(5, Math.round((seed.price + (i%5)*2) * 100) / 100),
        discount: seed.discount,
        rating: Math.max(3.6, Math.min(4.9, seed.rating - 0.2 + ((i%5)*0.07))),
        reviews: seed.reviews + i*7,
        category: cat,
        image: seed.image,
        delivery: seed.delivery,
        return: seed.return,
        description: seed.description
      });
    }
  }
  PRODUCTS = PRODUCTS.concat(newItems);
})();


