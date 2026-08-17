# MealinBudget - Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** August 2026  
**Status:** Ready for Development  

---

## TABLE OF CONTENTS

1. [Product Overview](#product-overview)
2. [Problem & Solution](#problem--solution)
3. [User Personas](#user-personas)
4. [Core Features](#core-features)
5. [User Flows](#user-flows)
6. [Design System](#design-system)
7. [Technical Specifications](#technical-specifications)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Component Specifications](#component-specifications)
11. [Acceptance Criteria](#acceptance-criteria)
12. [Success Metrics](#success-metrics)
13. [Timeline](#timeline)
14. [Deployment](#deployment)

---

## PRODUCT OVERVIEW

**App Name:** MealinBudget  
**Type:** Progressive Web App (PWA)  
**Platform:** Mobile Web (iOS Safari, Android Chrome)  
**Target Market:** Indian households with weekly food budgets ₹1000-5000  
**MVP Launch:** Week 3  

**One-Line Description:**  
"AI-powered weekly meal planning PWA that generates 21 personalized meals within your budget, respecting dietary needs and cooking constraints."

**Core Promise to Users:**  
"Tell us your budget, preferences, and constraints → Get a complete weekly meal plan + shopping list in 3 seconds → Cook with confidence, no decision-making needed."

---

## PROBLEM & SOLUTION

### Problem Statement
Indian families waste 2-3 hours weekly deciding "What to cook today?" This leads to:
- Decision paralysis (30+ mins deciding meal)
- Food waste (buy same items repeatedly, ₹300-500/month wasted)
- Unplanned spending (impulse purchases at store)
- Unhealthy eating patterns (order from outside when overwhelmed)
- Duplicate grocery purchases (buy paneer twice in same week)

### Solution
MealinBudget generates personalized, AI-powered weekly meal plans that:
- ✅ Respect user's budget (strict constraint)
- ✅ Match dietary preferences (vegetarian, no onions, etc)
- ✅ Consider cooking appliances (cooker, microwave, stove)
- ✅ Optimize ingredient reuse (reduce shopping list size)
- ✅ Show nutritional breakdown (transparent health tracking)
- ✅ Work completely offline (PWA with caching)
- ✅ Install like native app (home screen icon)

---

## USER PERSONAS

### Primary User: Priya (30, Homemaker, Delhi)
- **Budget:** ₹2000/week for family of 4
- **Constraint:** Limited cooking time (45 mins/meal max)
- **Goal:** No decision-making, just cook
- **Pain:** Wastes ₹400/month on duplicate groceries
- **Motivation:** Save time, reduce food waste, eat healthier
- **Tech Comfort:** High (uses apps daily)

### Secondary User: Arjun (25, Single, Bangalore)
- **Budget:** ₹800/week
- **Constraint:** Protein-focused (gym routine)
- **Goal:** Healthy, affordable meals with prep
- **Pain:** Takes 30 mins daily to search recipes
- **Motivation:** Get fit, save money
- **Tech Comfort:** Very High

### Tertiary User: Rajesh (45, Self-employed, Mumbai)
- **Budget:** ₹3000/week for family of 5
- **Constraint:** North Indian cuisine only
- **Goal:** Family enjoys cooking
- **Pain:** Kids don't like repetitive meals
- **Motivation:** Variety, family bonding
- **Tech Comfort:** Medium

---

## CORE FEATURES

### FEATURE 1: Meal Plan Generation

#### 1.1 Input Form

**Screen: Preference Collection**

**Field 1: Budget Slider**
- Type: Interactive slider
- Range: ₹500 - ₹5000
- Step: ₹100
- Default: ₹2000
- Validation: Must be > ₹500
- Visual: Rupee symbol + amount display

**Field 2: Number of People**
- Type: Stepper / Select
- Options: 1, 2, 3, 4, 5, 6+
- Default: 4
- Validation: Required

**Field 3: Mood / Preference Type** (Select ONE)
- Options:
  - 🌶️ **Spicy Indian** - Traditional north/south Indian recipes
  - ⚡ **Quick & Easy** - All meals <30 mins
  - 💪 **Protein Packed** - 70g+ protein per day
  - 🏃 **Low Calorie** - <1800 calories per day
  - 💰 **Budget Minimal** - Maximum value for money
- Default: Spicy Indian
- Validation: Required

**Field 4: Dietary Restrictions** (Select MULTIPLE)
- Options:
  - ☑️ Vegetarian / ☐ Non-vegetarian
  - ☑️ No onions / ☐ Onions OK
  - ☑️ No garlic / ☐ Garlic OK
  - ☑️ No dairy / ☐ Dairy OK (lactose-free)
  - ☑️ Gluten-free / ☐ Gluten OK
  - ☑️ No eggs / ☐ Eggs OK
- Default: Vegetarian + Onions OK + Dairy OK
- Validation: At least one option selected

**Field 5: Cooking Appliances** (Select MULTIPLE)
- Options:
  - ☑️ Pressure Cooker (Cooker)
  - ☑️ Microwave
  - ☑️ Regular Stovetop
  - ☑️ Mixer/Grinder
  - ☑️ Oven (Tawa)
- Default: All selected
- Validation: At least one option

**Submit Button:**
- Label: "Generate Meal Plan"
- State: Disabled until form valid
- Action: POST /api/meals/generate
- Loading: Show spinner + "Generating your meals..."
- Time: <3 seconds

#### 1.2 Output: Meal Plan

**21 Meals Generated (7 days × 3 meals)**

**Per Meal Data:**
```
{
  day: 1,
  date: "2024-03-18",
  meal_type: "breakfast",
  meal_name: "Rava Upma",
  cuisine: "South Indian",
  cooking_time_mins: 15,
  difficulty: "Easy",
  ingredients: [
    { name: "Semolina (rava)", qty: 200, unit: "g" },
    { name: "Oil", qty: 30, unit: "ml" },
    { name: "Mustard seeds", qty: 5, unit: "g" },
    { name: "Curry leaves", qty: 10, unit: "g" }
  ],
  nutritional_info: {
    calories: 320,
    protein_g: 8,
    carbs_g: 45,
    fat_g: 10,
    fiber_g: 2
  },
  appliances_needed: ["Stovetop"],
  instructions: [
    "Roast semolina in dry pan for 1 minute",
    "Add oil, mustard seeds, curry leaves",
    "Fry until seeds crackle",
    "Add water and salt",
    "Stir until cooked (2 mins)"
  ]
}
```

**Constraints (Hard Rules for Gemini):**
1. All 21 meals must fit within user's budget
2. No ingredient over-budget (e.g., don't suggest premium paneer if budget too low)
3. Use only ingredients available in quick commerce (Zepto, Blinkit)
4. Maximize ingredient reuse (if rice in 15 meals, use same brand/type)
5. Respect cooking time constraint
6. Follow dietary restrictions exactly (0 tolerance)
7. Only use available appliances
8. Nutritional data accurate ±10%
9. Seasonal ingredients preferred (if available)
10. Vary recipes (max 2 repeated meals per week)

---

### FEATURE 2: Smart Shopping List

#### 2.1 Auto-Generated List

**Consolidation Logic:**
- Extract all ingredients from 21 meals
- Group by category (automatic)
- Sum quantities (e.g., "Rice 2kg" = 400g + 600g + 1000g)
- Show in practical units (kg for rice, g for spices, pieces for eggs)
- Remove duplicates (if "oil" appears 15 times, consolidate to "Oil: 1L total")

**Categories (Fixed Order):**
1. STAPLES & GRAINS (Rice, Atta, Dal, etc)
2. VEGETABLES (Tomatoes, Onions, Spinach, etc)
3. PROTEIN (Paneer, Eggs, Milk, etc)
4. SPICES & CONDIMENTS (Turmeric, Chili, Salt, Oil, etc)
5. DAIRY & OTHERS (if applicable)

**Per Item Display:**
```
Category: STAPLES & GRAINS

Rice (Basmati, 1kg): ₹90-110
  ├─ Used in: Day 1 Lunch, Day 2 Dinner, Day 3 Breakfast
  ├─ Total Qty: 2kg
  └─ ☐ Mark as purchased

Moong Dal (1kg): ₹180-200
  ├─ Used in: 5 meals
  ├─ Total Qty: 1kg
  └─ ☐ Mark as purchased
```

**Features:**
- Checkbox to mark items purchased
- Price range (estimated, no live prices)
- Show which meals use this item (collapsible)
- Print button (generate printable shopping list)
- Share button (download as text/image)
- Save locally (IndexedDB)
- Offline support

**Print Format:**
```
╔════════════════════════════════════════╗
║   MealinBudget Shopping List           ║
║   Week: March 18-24, 2024             ║
║   Budget: ₹2000 | People: 4           ║
╚════════════════════════════════════════╝

STAPLES & GRAINS
☐ Rice (Basmati, 1kg)        ₹90-110
☐ Atta (Flour, 1kg)          ₹40-50
☐ Moong Dal (1kg)           ₹180-200
...

TOTAL ESTIMATED: ₹1800-2100
```

---

### FEATURE 3: Nutritional Analysis

#### 3.1 Per-Meal Breakdown

**Display on Meal Card:**
```
┌─────────────────────────────┐
│ Rava Upma                   │
│ 15 mins | Easy              │
├─────────────────────────────┤
│ 🔥 320 cal                  │
│ 💪 8g protein               │
│ 🌾 45g carbs                │
│ 🧈 10g fat                  │
│ 🌿 2g fiber                 │
└─────────────────────────────┘
```

#### 3.2 Weekly Summary

**Display:**
```
📊 WEEKLY NUTRITIONAL SUMMARY

☀️ Daily Average (per person):
  • Calories: 2000
  • Protein: 65g
  • Carbs: 260g
  • Fat: 60g
  • Fiber: 15g

📈 Total for Week:
  • Calories: 42,000 (7 days × 4 people × 1500)
  • Protein: 1820g
  • Carbs: 7280g
  • Fat: 1680g

✅ Goal Status:
  "Your meals match your 'Protein Packed' goal perfectly!"
  (65g protein > 70g target by only 5g)

⚠️ Status Bar:
  Protein: ████████████████░░ 93% (Target: 70g)
  Carbs:   ██████████████░░░░ 74% (Target: 350g)
  Fat:     ███████████████░░░ 85% (Target: 70g)
```

**Data Calculation:**
- Per meal: Fetch from nutritional_info object
- Daily: Sum breakfast + lunch + dinner
- Weekly: Sum all 7 days, then divide by 7 for average
- Per person: If 4 people, divide daily by 4

**Source of Nutrition Data:**
- Hardcoded nutrition database for 50+ common Indian dishes
- Estimates based on standard 100g/150g portions
- Maintained in backend constants or database

---

### FEATURE 4: Offline-First PWA

#### 4.1 Service Worker

**Cached Assets:**
- All static files (HTML, CSS, JS)
- App shell (main layout, navigation)
- All generated meal plans (IndexedDB)
- User preferences (IndexedDB)
- Shopping lists (IndexedDB)

**Offline Behavior:**
- User can view all saved meal plans
- User can view shopping lists
- User CANNOT generate new plans (requires Gemini API)
- User sees "Offline Mode" banner
- When online, auto-syncs data

**Cache Strategy:**
```
Network-first for API calls:
1. Try network
2. If fails, use cache
3. If cache available, show cached

Cache-first for static assets:
1. Check cache
2. If not found, fetch from network
3. Update cache
```

#### 4.2 Local Storage (IndexedDB)

**Stored Data:**
```
mealplans/
├─ plan_001: { week_date, meals[], shopping_list[] }
├─ plan_002: { ... }

user_prefs/
└─ preferences: { budget, people, mood, dietary, appliances }

sync_status/
└─ last_sync: timestamp
```

**Sync Logic:**
- When online, periodically sync to server
- If conflict, server data wins
- Show sync status in UI

---

### FEATURE 5: Seasonal Recommendations

#### 5.1 Seasonal Calendar (Hardcoded)

**India Seasonal Ingredients:**
```
January-February (Winter):
├─ Cheap: Onions (₹20/kg), Tomatoes, Leafy greens
├─ Expensive: Mangoes, Berries
└─ Meals: More onion-based, earthy greens

March-May (Summer):
├─ Cheap: Mangoes, Lychee, Berries
├─ Expensive: Leafy greens
└─ Meals: Mango-based, light meals

June-August (Monsoon):
├─ Cheap: Leafy greens, Root vegetables
├─ Expensive: Tomatoes
└─ Meals: Spinach, batata, root veggies

September-November (Autumn):
├─ Cheap: Onions (supply peak), Tomatoes
├─ Expensive: Mangoes
└─ Meals: North Indian, onion-heavy

December (Year-end):
├─ Cheap: Winter vegetables, Leafy greens
├─ Expensive: Fruits
└─ Meals: Traditional winter dishes
```

#### 5.2 Display to User

**When Generating Plan:**
- Show: "💰 Onions are super cheap this week! I've added 5 onion-based recipes"
- Seasonal ingredients prioritized in meal generation
- Cost estimate more accurate due to seasonal factors

---

### FEATURE 6: Multiple Plan Variants

#### 6.1 Generate Different Variants

**User Scenario:**
```
Input: ₹2000 budget, 4 people, Family wants options

Output: 5 variants to choose from
├─ Current Plan: 🌶️ Spicy Indian
├─ Variant 1: ⚡ Quick & Easy
├─ Variant 2: 💪 Protein Packed
├─ Variant 3: 🏃 Low Calorie
└─ Variant 4: 💰 Budget Minimal
```

**Variant Differences:**

| Aspect | Spicy Indian | Quick & Easy | Protein Packed | Low Calorie | Budget Minimal |
|--------|-------------|------------|----------------|------------|----------------|
| Cooking Time | 20-40 mins | <30 mins | 15-30 mins | 15-25 mins | 20-35 mins |
| Cuisine | Trad N/S Indian | Modern simple | Gym-friendly | Light, healthy | Max economical |
| Protein/day | 60-70g | 50-60g | 75-90g | 50-55g | 55-65g |
| Calories/day | 2000-2200 | 1900-2000 | 2100-2300 | 1600-1800 | 1800-2000 |
| Ingredients | Traditional | Common store | Paneer, eggs | Veggies, dal | Dal, rice heavy |
| Cost | ₹2000 | ₹1800-2000 | ₹2000 | ₹1600-1900 | ₹1500-1800 |
| Example Meals | Dal fry, Paneer butter | Rice, Dal, Eggs | Paneer tikka, Eggs curry | Salads, light dals | Plain rice, basic dal |

**UI for Variant Selection:**
```
┌─────────────────────────────────────┐
│ 🔄 OTHER MEAL PLANS (Same Budget)   │
├─────────────────────────────────────┤
│                                     │
│ Current: 🌶️ Spicy Indian           │
│ [YOU ARE HERE]                      │
│ 21 meals | ₹2000 total              │
│                                     │
│ ─────────────────────────────────  │
│                                     │
│ ⚡ Quick & Easy                     │
│ All meals <30 mins                  │
│ 21 meals | ₹1900                    │
│ [SWITCH TO THIS] →                  │
│                                     │
│ 💪 Protein Packed                   │
│ 70g+ protein/day                    │
│ 21 meals | ₹2100                    │
│ [SWITCH TO THIS] →                  │
│                                     │
│ 🏃 Low Calorie                      │
│ <1800 cal/day                       │
│ 21 meals | ₹1800                    │
│ [SWITCH TO THIS] →                  │
│                                     │
│ 💰 Budget Minimal                   │
│ Max value for money                 │
│ 21 meals | ₹1600                    │
│ [SWITCH TO THIS] →                  │
│                                     │
└─────────────────────────────────────┘
```

**Implementation:**
- When user requests variants, call Gemini 5 times with different moods
- Show all 5 side-by-side
- User can switch between them
- Only save/finalize one choice

---

## USER FLOWS

### FLOW 1: First-Time User (Complete Journey)

```
START
  ↓
┌─────────────────────────────────────┐
│ LANDING PAGE                        │
├─────────────────────────────────────┤
│ Logo: MealinBudget                  │
│ Tagline: "Weekly meals, no decisions"
│                                     │
│ Feature highlights (3 bullets)      │
│ - ✅ AI meal plans in 3 seconds    │
│ - ✅ Always within budget           │
│ - ✅ Works offline                  │
│                                     │
│ Install prompt: "Add to Home"       │
│ [SIGN UP] [LOG IN]                  │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ SIGN UP FORM                        │
├─────────────────────────────────────┤
│ Email: [___________]                │
│ Password: [___________]             │
│ Confirm: [___________]              │
│                                     │
│ [SIGN UP] [Already have account?]   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ PREFERENCE FORM                     │
├─────────────────────────────────────┤
│ 💰 Budget: ₹2000  ○────●────○       │
│                                     │
│ 👥 People: [4 ▼]                   │
│                                     │
│ 🎯 Mood:                            │
│ ○ Spicy Indian                      │
│ ● Quick & Easy                      │
│ ○ Protein Packed                    │
│ ○ Low Calorie                       │
│ ○ Budget Minimal                    │
│                                     │
│ 🥗 Dietary:                          │
│ ☑ Vegetarian  ☑ No onions          │
│ ☑ No dairy    ☐ Gluten-free        │
│                                     │
│ 🍳 Appliances:                       │
│ ☑ Cooker      ☑ Microwave          │
│ ☑ Stovetop    ☑ Mixer              │
│                                     │
│ [GENERATE MEAL PLAN]                │
└────────────┬────────────────────────┘
             ↓
         (3 seconds)
         Loading spinner
             ↓
┌─────────────────────────────────────┐
│ MEAL PLAN VIEW (Day 1)              │
├─────────────────────────────────────┤
│ MONDAY, MARCH 18                    │
│                                     │
│ 🌅 BREAKFAST (7:00 AM)              │
│ Rava Upma                           │
│ 15 mins | Easy | 320 cal | 8g prot  │
│ [VIEW RECIPE] [INGREDIENTS]         │
│                                     │
│ 🍽️ LUNCH (1:00 PM)                 │
│ Moong Dal Fry                       │
│ 20 mins | Medium | 350 cal | 14g    │
│                                     │
│ 🍴 DINNER (8:00 PM)                 │
│ Rice + Dal with Spinach             │
│ 25 mins | Easy | 380 cal | 10g      │
│                                     │
│ ☀️ Daily Total: 1050 cal, 32g prot  │
│                                     │
│ [< PREV] [TUE ▼] [NEXT >]          │
│                                     │
│ [📋 SHOPPING LIST] [📊 NUTRITION]   │
│ [🔄 VARIANTS] [💾 SAVE]             │
└────────────┬────────────────────────┘
             ↓
       (User explores)
             ↓
┌─────────────────────────────────────┐
│ SHOPPING LIST VIEW                  │
├─────────────────────────────────────┤
│ 📋 SHOPPING LIST                    │
│ Week: March 18-24                   │
│ Total Est: ₹1900-2200               │
│                                     │
│ STAPLES & GRAINS                    │
│ ☐ Rice (Basmati): 2kg               │
│ ☐ Atta: 1kg                         │
│ ☐ Moong Dal: 1kg                    │
│                                     │
│ VEGETABLES                          │
│ ☐ Tomatoes: 1.5kg                   │
│ ☐ Onions: 1kg                       │
│ ☐ Spinach: 250g                     │
│                                     │
│ [🖨️ PRINT] [📷 SHARE] [💾 SAVE]    │
└────────────┬────────────────────────┘
             ↓
       (User satisfied)
             ↓
┌─────────────────────────────────────┐
│ FINAL CONFIRMATION                  │
├─────────────────────────────────────┤
│ ✅ Meal plan saved to device!       │
│                                     │
│ 📱 Next time: Plan loads instantly  │
│ 🔔 Monday 9:00 AM reminder          │
│    (optional push notification)     │
│                                     │
│ [DONE] [GENERATE ANOTHER] [EDIT]    │
└─────────────────────────────────────┘

END
```

---

### FLOW 2: Returning User

```
START
  ↓
┌─────────────────────────────────────┐
│ APP OPENS                           │
├─────────────────────────────────────┤
│ (Auto-login with saved session)     │
│                                     │
│ Dashboard shows:                    │
│ "Your meal plan ends today"         │
│                                     │
│ Recent plans (last 3):              │
│ • Week of March 18-24 (completed)   │
│ • Week of March 11-17 (archived)    │
│ • Week of March 4-10 (archived)     │
│                                     │
│ Options:                            │
│ [GENERATE NEW] [USE SAME] [REPEAT]  │
└────────────┬────────────────────────┘
             ↓
          (Choose action)
             ↓
       [Path 1: New Plan]
             ↓
    (Shows form with last settings)
    (User can modify or use same)
             ↓
    (Generate & Show new plan)
```

---

### FLOW 3: Viewing Meal Details

```
User on Meal Plan View
        ↓
    Clicks on Meal Card
        ↓
┌─────────────────────────────────────┐
│ MEAL DETAIL VIEW                    │
├─────────────────────────────────────┤
│ Rava Upma                           │
│ South Indian | Vegetarian           │
│ ⏱️ 15 mins | 🥘 Easy                │
│                                     │
│ INGREDIENTS (for 4 people):         │
│ • Semolina: 200g                    │
│ • Oil: 30ml                         │
│ • Mustard seeds: 5g                 │
│ • Curry leaves: 10g                 │
│                                     │
│ INSTRUCTIONS:                       │
│ 1. Roast semolina in dry pan (1m)  │
│ 2. Add oil, mustard seeds           │
│ 3. Fry until seeds crackle (30s)   │
│ 4. Add water and salt               │
│ 5. Stir until cooked (2m)          │
│                                     │
│ NUTRITION:                          │
│ 🔥 320 cal | 💪 8g protein         │
│ 🌾 45g carbs | 🧈 10g fat          │
│                                     │
│ 🍳 Uses: Cooker (can substitute)    │
│                                     │
│ [MARK COOKED] [BACK]               │
└─────────────────────────────────────┘
```

---

### FLOW 4: Offline Usage

```
User offline
        ↓
Opens app
        ↓
App loads from cache instantly
        ↓
┌─────────────────────────────────────┐
│ OFFLINE MODE                        │
├─────────────────────────────────────┤
│ ⚠️ You're offline                   │
│ (Cached data showing)               │
│                                     │
│ Can view:                           │
│ ✅ Saved meal plans                │
│ ✅ Shopping lists                  │
│ ✅ Nutritional info                │
│ ✅ Meal details                    │
│                                     │
│ Cannot:                             │
│ ❌ Generate new plans              │
│ ❌ Sync to server                  │
│                                     │
│ When online: Auto-syncs data       │
└─────────────────────────────────────┘
```

---

## DESIGN SYSTEM

### COLOR PALETTE

```css
/* Primary Colors */
--primary: #6366f1;          /* Indigo - energetic, modern */
--primary-light: #818cf8;    /* Lighter indigo */
--primary-dark: #4f46e5;     /* Darker indigo */

/* Secondary Colors */
--secondary: #f97316;        /* Orange - food, warmth */
--secondary-light: #fb923c;  /* Lighter orange */
--secondary-dark: #ea580c;   /* Darker orange */

/* Functional Colors */
--success: #22c55e;          /* Green - healthy, go */
--warning: #eab308;          /* Yellow - caution */
--error: #ef4444;            /* Red - alert */
--neutral: #94a3b8;          /* Slate - neutral text/borders */

/* Light Mode (Default) */
--bg-primary: #ffffff;       /* Page background */
--bg-secondary: #f8fafc;     /* Card background */
--bg-tertiary: #f1f5f9;      /* Subtle background */
--text-primary: #1e293b;     /* Main text */
--text-secondary: #64748b;   /* Secondary text */
--text-tertiary: #94a3b8;    /* Subtle text */
--border: #e2e8f0;           /* Borders */

/* Dark Mode */
--dark-bg-primary: #0f172a;  /* Page background */
--dark-bg-secondary: #1e293b;/* Card background */
--dark-bg-tertiary: #334155; /* Subtle background */
--dark-text-primary: #f1f5f9;/* Main text */
--dark-text-secondary: #cbd5e1; /* Secondary text */
--dark-text-tertiary: #94a3b8; /* Subtle text */
--dark-border: #334155;      /* Borders */
```

### TYPOGRAPHY

```css
/* Font Family */
font-family: 'Segoe UI', 'Roboto', sans-serif;

/* Heading 1 (Page Title) */
font-size: 2rem (32px);
font-weight: 700;
line-height: 1.2;
letter-spacing: -0.5px;

/* Heading 2 (Section Title) */
font-size: 1.5rem (24px);
font-weight: 700;
line-height: 1.3;

/* Heading 3 (Card Title) */
font-size: 1.25rem (20px);
font-weight: 600;
line-height: 1.4;

/* Body Regular */
font-size: 1rem (16px);
font-weight: 400;
line-height: 1.6;

/* Body Small */
font-size: 0.875rem (14px);
font-weight: 400;
line-height: 1.5;

/* Caption */
font-size: 0.75rem (12px);
font-weight: 500;
line-height: 1.4;
```

### SPACING SCALE (8px grid)

```css
--space-0: 0px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-9: 36px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

### BORDER RADIUS

```css
--radius-sm: 4px;    /* Inputs, small elements */
--radius-md: 8px;    /* Cards, buttons */
--radius-lg: 12px;   /* Modals, large elements */
--radius-full: 9999px; /* Circular, badges */
```

### SHADOWS

```css
/* Elevation 1 - Cards */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 
            0 1px 2px rgba(0, 0, 0, 0.24);

/* Elevation 2 - Floating */
box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15), 
            0 2px 4px rgba(0, 0, 0, 0.12);

/* Elevation 3 - Modal */
box-shadow: 0 10px 40px rgba(0, 0, 0, 0.16), 
            0 0 0 1px rgba(0, 0, 0, 0.08);
```

### RESPONSIVE BREAKPOINTS

```css
/* Mobile First */
--mobile: 320px;      /* Default */
--small-mobile: 375px;  /* iPhone */
--tablet: 768px;      /* iPad */
--desktop: 1024px;    /* Desktop */
--large-desktop: 1440px; /* Large screens */

/* Usage */
@media (min-width: 768px) { ... }  /* Tablet and up */
```

---

## TECHNICAL SPECIFICATIONS

### TECH STACK

**Frontend:**
- SvelteKit 2.0 (meta framework)
- Svelte 4.0 (UI components)
- TypeScript 5.x (type safety)
- TailwindCSS 3.x (styling)
- Workbox (PWA tooling)
- IndexedDB (local data)
- Supabase JS Client (database sync)

**Backend:**
- Node.js 20.x LTS
- Express.js 4.x (HTTP server)
- TypeScript 5.x (type safety)
- Gemini API (meal generation)
- Zod (input validation)
- CORS (cross-origin)
- Dotenv (environment variables)

**Database:**
- PostgreSQL 15.x (via Supabase)
- Real-time subscriptions
- Auth built-in

**Hosting:**
- Vercel (frontend) - Free tier
- Railway (backend) - Free tier + ₹500/month if needed
- Supabase (database) - Free tier
- Upstash (Redis) - Free tier (optional)

### PROJECT STRUCTURE

```
meal-in-budget/
│
├── frontend/                    (SvelteKit app)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +page.svelte       (Landing page)
│   │   │   ├── +layout.svelte     (Main layout)
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   ├── login/+page.svelte
│   │   │   │   └── signup/+page.svelte
│   │   │   │
│   │   │   ├── (app)/
│   │   │   │   ├── +layout.svelte (App wrapper)
│   │   │   │   ├── dashboard/+page.svelte
│   │   │   │   ├── generate/+page.svelte
│   │   │   │   ├── meal-plan/+page.svelte
│   │   │   │   ├── shopping-list/+page.svelte
│   │   │   │   └── nutrition/+page.svelte
│   │   │   │
│   │   │   └── api/
│   │   │       ├── meals/+server.ts
│   │   │       ├── preferences/+server.ts
│   │   │       └── shopping-list/+server.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   │   ├── MealCard.svelte
│   │   │   │   ├── ShoppingList.svelte
│   │   │   │   ├── NutritionSummary.svelte
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Slider.svelte
│   │   │   │   ├── Card.svelte
│   │   │   │   ├── Checkbox.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   └── Loading.svelte
│   │   │   │
│   │   │   ├── db/
│   │   │   │   ├── client.ts       (Supabase client)
│   │   │   │   └── local.ts        (IndexedDB wrapper)
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── user.ts         (User store)
│   │   │   │   ├── mealPlan.ts     (Meal plan store)
│   │   │   │   └── ui.ts           (UI state)
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── api.ts          (API calls)
│   │   │   │   ├── offline.ts      (Offline sync)
│   │   │   │   └── utils.ts        (Utilities)
│   │   │   │
│   │   │   └── types/
│   │   │       └── index.ts        (TypeScript types)
│   │   │
│   │   ├── service-worker.ts       (PWA offline)
│   │   └── app.html                (Base HTML)
│   │
│   ├── static/
│   │   ├── manifest.json           (PWA manifest)
│   │   ├── favicon.ico
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   │
│   └── svelte.config.js            (SvelteKit config)
│
├── backend/                         (Express app)
│   ├── src/
│   │   ├── index.ts                (Entry point)
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.ts             (Auth endpoints)
│   │   │   ├── meals.ts            (Meal endpoints)
│   │   │   ├── preferences.ts       (Preference endpoints)
│   │   │   └── shopping-list.ts     (Shopping endpoints)
│   │   │
│   │   ├── services/
│   │   │   ├── gemini.ts           (Gemini API wrapper)
│   │   │   ├── db.ts               (Database operations)
│   │   │   ├── cache.ts            (Redis caching)
│   │   │   └── nutrition.ts        (Nutrition calculations)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts             (JWT verification)
│   │   │   ├── validation.ts       (Input validation)
│   │   │   └── errorHandler.ts     (Error handling)
│   │   │
│   │   ├── constants/
│   │   │   ├── nutrition.ts        (Nutrition database)
│   │   │   ├── seasonal.ts         (Seasonal data)
│   │   │   └── config.ts           (App config)
│   │   │
│   │   └── types/
│   │       └── index.ts            (TypeScript types)
│   │
│   ├── .env.example
│   ├── .env.local (local development)
│   └── package.json
│
├── database/                        (Migrations)
│   ├── migrations/
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_meal_plans.sql
│   │   ├── 003_create_shopping_lists.sql
│   │   └── 004_create_preferences.sql
│   │
│   └── seeds/
│       ├── nutrition.sql           (Nutrition data)
│       └── seasonal.sql            (Seasonal data)
│
├── docker-compose.yml              (Local dev)
├── .gitignore
└── README.md
```

### ENVIRONMENT VARIABLES

**Frontend (.env.local)**
```
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

**Backend (.env.local)**
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost/mealinbudget
GEMINI_API_KEY=xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx
JWT_SECRET=xxx
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

---

## DATABASE SCHEMA

### TABLE: users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- User metadata
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(500),
  
  -- Preferences (stored as JSONB)
  default_budget INTEGER DEFAULT 2000,
  default_people_count INTEGER DEFAULT 4,
  
  INDEX idx_email (email)
);
```

### TABLE: meal_plans

```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadata
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  -- User inputs
  budget INTEGER NOT NULL,
  people_count INTEGER NOT NULL,
  mood VARCHAR(50) NOT NULL,
  dietary_restrictions JSONB,
  appliances JSONB,
  
  -- Generated plan (stored as JSON)
  meals JSONB NOT NULL,           -- Array of 21 meals
  shopping_list JSONB NOT NULL,   -- Consolidated ingredients
  
  -- Metadata
  is_active BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  INDEX idx_user_date (user_id, week_start_date)
);
```

### TABLE: meal_ratings (Future - Not in MVP)

```sql
CREATE TABLE meal_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  
  -- Rating info
  day_number INTEGER NOT NULL,
  meal_type VARCHAR(20) NOT NULL,  -- breakfast, lunch, dinner
  meal_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL,          -- 1-5 stars
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  
  INDEX idx_user_meal (user_id, meal_plan_id)
);
```

### TABLE: user_preferences

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Preferences
  dietary_restrictions JSONB DEFAULT '[]',
  favorite_moods JSONB DEFAULT '[]',
  budget_range JSONB DEFAULT '{"min": 1000, "max": 5000}',
  
  -- Settings
  notification_enabled BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  language VARCHAR(20) DEFAULT 'en',
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## API ENDPOINTS

### AUTH ENDPOINTS

**POST /api/auth/signup**
```
Request:
{
  email: "user@example.com",
  password: "secure_password"
}

Response (201):
{
  user: { id, email, created_at },
  token: "jwt_token"
}
```

**POST /api/auth/login**
```
Request:
{
  email: "user@example.com",
  password: "secure_password"
}

Response (200):
{
  user: { id, email },
  token: "jwt_token"
}
```

**POST /api/auth/logout**
```
Response (200):
{
  message: "Logged out successfully"
}
```

---

### MEAL ENDPOINTS

**POST /api/meals/generate**
```
Request (requires auth):
{
  budget: 2000,
  people_count: 4,
  mood: "protein_packed",
  dietary_restrictions: ["vegetarian", "no_onions"],
  appliances: ["cooker", "microwave", "stove"]
}

Response (201, 3 seconds max):
{
  meal_plan_id: "uuid",
  week_start_date: "2024-03-18",
  week_end_date: "2024-03-24",
  
  meals: [
    {
      day: 1,
      date: "2024-03-18",
      meal_type: "breakfast",
      meal_name: "Rava Upma",
      cooking_time_mins: 15,
      difficulty: "Easy",
      ingredients: [...],
      nutritional_info: {...},
      instructions: [...]
    },
    ... (21 total)
  ],
  
  shopping_list: [
    {
      category: "STAPLES & GRAINS",
      items: [
        {
          name: "Rice (Basmati)",
          qty: 2,
          unit: "kg",
          est_price_min: 90,
          est_price_max: 110
        }
      ]
    }
  ],
  
  nutritional_summary: {
    daily_avg_calories: 2000,
    daily_avg_protein: 65,
    daily_avg_carbs: 260,
    daily_avg_fat: 60
  }
}
```

**GET /api/meals/:mealPlanId**
```
Response (200):
{
  meal_plan: { ... full plan },
  variants: [
    {
      mood: "quick_easy",
      shopping_list_total: "₹1800-2000",
      preview: "All meals <30 mins"
    }
  ]
}
```

**GET /api/meals/recent**
```
Response (200):
[
  {
    id: "uuid",
    week_start_date: "2024-03-18",
    mood: "protein_packed",
    status: "active"
  }
]
```

---

### SHOPPING LIST ENDPOINTS

**GET /api/shopping-list/:mealPlanId**
```
Response (200):
{
  meal_plan_id: "uuid",
  categories: [
    {
      name: "STAPLES & GRAINS",
      items: [...]
    }
  ],
  total_estimated_min: 1800,
  total_estimated_max: 2200
}
```

**POST /api/shopping-list/:mealPlanId/download**
```
Response (200):
{
  file_url: "...",
  format: "pdf" or "text"
}
```

---

### PREFERENCES ENDPOINTS

**GET /api/preferences**
```
Response (200):
{
  budget_default: 2000,
  people_count_default: 4,
  dietary_restrictions: [...],
  appliances: [...]
}
```

**PUT /api/preferences**
```
Request:
{
  budget_default: 2000,
  dietary_restrictions: [...],
  appliances: [...]
}

Response (200):
{
  success: true,
  preferences: { ... }
}
```

---

## COMPONENT SPECIFICATIONS

### Core Components Needed

#### 1. Button Component

**Variants:**
- primary (filled indigo)
- secondary (outlined indigo)
- success (filled green)
- danger (filled red)
- ghost (no fill)

**Sizes:**
- sm (12px font, 24px height)
- md (14px font, 40px height)
- lg (16px font, 48px height)

**States:**
- default
- hover
- active
- disabled
- loading

**Example Usage:**
```svelte
<Button variant="primary" size="lg" onClick={handleClick}>
  Generate Meal Plan
</Button>
```

---

#### 2. Input Component

**Types:**
- text
- email
- password
- number
- tel

**Features:**
- Label
- Placeholder
- Error message
- Helper text
- Icon (left/right)

**Example:**
```svelte
<Input 
  type="email" 
  label="Email" 
  placeholder="you@example.com"
  error={emailError}
/>
```

---

#### 3. Slider Component

**Features:**
- Min/Max values
- Step size
- Display current value
- Responsive
- Touch-friendly

**Example:**
```svelte
<Slider 
  min={500} 
  max={5000} 
  step={100}
  value={budget}
  onChange={(val) => budget = val}
/>
```

---

#### 4. Card Component

**Variants:**
- meal (for meal cards)
- ingredient (for shopping items)
- default (generic card)

**Props:**
- title
- subtitle
- icon
- clickable
- selected

---

#### 5. Checkbox Component

**Features:**
- Label
- Checked state
- Indeterminate (for groups)
- Disabled

---

#### 6. Navigation Component

**Mobile Bottom Navigation:**
- Home icon
- Meal Plan icon
- Shopping List icon
- Preferences icon
- Profile icon

**Active indicator**
**Labels**

---

#### 7. Modal Component

**Features:**
- Title
- Description
- Close button
- Action buttons
- Overlay

---

#### 8. Loading Spinner

**Variants:**
- Full page overlay
- Inline spinner
- Progress indicator

---

## ACCEPTANCE CRITERIA

### Feature: Meal Plan Generation

- ✅ Form validates all required fields
- ✅ Generate button disabled until form valid
- ✅ API call completes in <3 seconds (Gemini call)
- ✅ All 21 meals generated (7 days × 3)
- ✅ Meals respect budget constraint (±10%)
- ✅ Meals respect all dietary restrictions (0% tolerance)
- ✅ Meals use only available cooking appliances
- ✅ Ingredient quantities accurate (±5%)
- ✅ Seasonal ingredients prioritized when available
- ✅ Shopping list consolidated (no duplicate ingredients)
- ✅ Nutritional data present for all meals
- ✅ Loading state shows spinner with message
- ✅ Error handling for API failures (retry option)
- ✅ Plan saved locally (IndexedDB)
- ✅ Plan synced to server when online

### Feature: Shopping List

- ✅ Auto-grouped by category (consistent order)
- ✅ Quantities in practical units (kg for rice, g for spices)
- ✅ Shows estimated price range (±15%)
- ✅ Checkbox to mark items purchased
- ✅ Print layout is readable (A4 compatible)
- ✅ Share button works (PDF or image)
- ✅ Saves locally (offline access)
- ✅ <1 second load time

### Feature: Nutritional Analysis

- ✅ Per-meal nutritional data displayed
- ✅ Weekly summary calculated correctly
- ✅ Daily averages correct (sum of 3 meals ÷ 7 days)
- ✅ Macro breakdown accurate (protein, carbs, fat)
- ✅ Goal status shows correctly (matches user's mood)
- ✅ Visual indicators (progress bars) working

### Feature: Offline Support

- ✅ App loads from cache (<2 seconds) when offline
- ✅ Can view saved meal plans offline
- ✅ Can view shopping lists offline
- ✅ Offline banner displayed
- ✅ Cannot generate new plans (shows message)
- ✅ Auto-syncs when online
- ✅ Service Worker registered and active
- ✅ IndexedDB storage working

### Feature: PWA

- ✅ Install prompt appears on first visit
- ✅ "Add to Home Screen" works (iOS & Android)
- ✅ App icon appears on home screen
- ✅ App opens in standalone mode (no browser UI)
- ✅ Splash screen on launch
- ✅ Responsive on all screen sizes (320px - 768px)
- ✅ No horizontal scrolling
- ✅ Touch targets minimum 44px
- ✅ Lighthouse PWA score >90
- ✅ Lighthouse Performance score >85

### Performance

- ✅ First load <3 seconds (on 4G)
- ✅ Meal generation <3 seconds (Gemini call)
- ✅ Bundle size <150 KB (gzipped)
- ✅ No memory leaks (tested with DevTools)
- ✅ Smooth animations (60 fps)
- ✅ No layout shifts (CLS < 0.1)

### Accessibility

- ✅ Color contrast ratio >4.5:1
- ✅ All buttons/inputs keyboard accessible
- ✅ Touch targets >44px
- ✅ Form labels associated with inputs
- ✅ Error messages linked to inputs
- ✅ Focus visible on all elements

### Browser/Device Support

- ✅ iOS 14+ (Safari)
- ✅ Android 8+ (Chrome)
- ✅ Screen sizes 320px - 768px
- ✅ Offline-first (works without internet)
- ✅ Tested on real devices (iPhone 8+, Galaxy S10+)

---

## SUCCESS METRICS

### Week 1-2 (Development)
- ✅ Zero critical bugs
- ✅ All acceptance criteria met
- ✅ 0 crashes during testing
- ✅ Load time <3 seconds

### Week 3 (Launch)
- ✅ Deploy to Vercel + Railway
- ✅ 100+ beta testers sign up
- ✅ 4+ star rating within first week
- ✅ <2% error rate in analytics

### Month 1
- ✅ 500+ active users
- ✅ 70% retention rate (users return)
- ✅ 5000+ meal plans generated
- ✅ 4.2+ star rating
- ✅ <1% crash rate

### Ongoing
- ✅ <2 second load time (p95)
- ✅ <99% uptime
- ✅ <0.1% error rate

---

## TIMELINE

### Week 1: Backend Setup + Database

**Days 1-2: Project Setup**
- Express.js boilerplate
- TypeScript configuration
- Environment variables setup
- Database connection (Supabase)

**Days 3-4: Database & Auth**
- PostgreSQL schema creation
- Supabase auth integration
- JWT token implementation
- Auth endpoints (signup/login)

**Day 5: Gemini Integration**
- Gemini API connection
- Prompt engineering for meals
- Test meal generation
- Error handling

**Deliverable:** Working backend API, can generate meals

---

### Week 2: Frontend + Core Features

**Days 1-2: SvelteKit Setup + UI Components**
- SvelteKit project scaffolding
- TailwindCSS configuration
- Design system setup (colors, typography)
- Base components (Button, Input, Card, etc)

**Days 3-4: Pages & Forms**
- Landing page
- Auth pages (signup/login)
- Preference form page
- Meal plan display page
- Shopping list page

**Day 5: Integration + Polish**
- Connect frontend to backend API
- Test all flows
- Fix bugs
- Add loading states

**Deliverable:** Complete frontend, all pages working

---

### Week 3: PWA + Testing + Deploy

**Days 1-2: PWA Setup**
- Service Worker implementation
- IndexedDB integration
- Offline support
- Install prompt
- Manifest.json

**Day 3: Mobile Responsive + Testing**
- Mobile optimization
- All screen sizes tested (320px-768px)
- Touch interactions
- Accessibility audit

**Day 4: Final Testing**
- Lighthouse audit
- Performance optimization
- Bug fixes
- Production build

**Day 5: Deployment**
- Deploy frontend to Vercel
- Deploy backend to Railway
- Database backup
- DNS configuration
- Monitor for errors

**Deliverable:** Production-ready app, live on web

---

## DEPLOYMENT

### Frontend (Vercel)

```
1. Connect GitHub repo to Vercel
2. Set environment variables (VITE_API_URL, etc)
3. Auto-deploy on git push
4. Enable custom domain
5. Auto-renew SSL certificate
```

**Cost:** Free tier (unlimited deployments, auto-scaling)

### Backend (Railway)

```
1. Connect GitHub repo to Railway
2. Add PostgreSQL plugin
3. Set environment variables (.env)
4. Auto-deploy on git push
5. Enable custom domain
```

**Cost:** ₹0-500/month (free tier + pay-as-you-go)

### Database (Supabase)

```
1. Create Supabase project
2. Run migrations (create tables)
3. Seed with nutrition/seasonal data
4. Enable auth
5. Enable real-time (optional)
```

**Cost:** Free tier (500 MB storage, sufficient for MVP)

### Monitoring & Analytics

```
1. Sentry (error tracking) - Free tier
2. Vercel Analytics (performance) - Free
3. LogRocket (user sessions) - Free tier
4. Google Analytics - Free
```

---

## ADDITIONAL NOTES

### Assumptions

1. **Gemini API Availability:** Assumes Google Gemini API remains free for MVP tier
2. **Internet Connection:** While app works offline, initial generation requires internet (Gemini API call)
3. **Device Storage:** IndexedDB storage ~50MB per device (sufficient for 100+ meal plans)
4. **Location:** Currently no location-based features (can add later)
5. **Multi-language:** MVP is English only (Hindi/Tamil support in Phase 2)

### Future Enhancements (Not MVP)

1. **Phase 2: Pricing Integration**
   - Connect QuickCommerce API
   - Show real Zepto/Blinkit prices
   - Compare platform prices
   - Direct ordering

2. **Phase 3: Advanced Features**
   - Preference learning (AI improves recommendations)
   - Pantry tracker (inventory management)
   - Community features (share meal plans)
   - Recipe videos (YouTube integration)
   - Multi-language support (Hindi, Tamil, etc)

3. **Phase 4: Monetization**
   - Premium subscription (advanced features)
   - Affiliate commissions (Zepto/Blinkit orders)
   - Sponsored recipes (brands)

### Known Limitations

1. **No real-time pricing** (use estimates only)
2. **No allergy database** (users manually specify)
3. **No recipe videos** (links only)
4. **No inventory management** (Phase 2)
5. **No social sharing** (Phase 2)
6. **English only** (Phase 2: Hindi support)

### Support & Contact

- **Support Email:** support@mealinbudget.com (setup later)
- **Feedback Form:** In-app feedback (Phase 2)
- **Bug Reports:** GitHub Issues (developers use this)

---

## DOCUMENT HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Aug 2026 | Product Team | Initial PRD for MVP |

---

**END OF DOCUMENT**

---

# HOW TO USE THIS PRD

1. **OpenCode Agent:** Read this entire document before starting any implementation
2. **Developers:** Use this as your development guide (no prior context needed)
3. **QA/Testers:** Use Acceptance Criteria section for testing
4. **Designers:** Use Design System section for UI consistency
5. **Product Manager:** Use Timeline & Metrics sections for tracking

**Questions?** This document is self-contained. If something is unclear, refer to the relevant section above.

---

**STATUS:** Ready for Development ✅  
**START DATE:** Immediately  
**TARGET COMPLETION:** Week 3  
