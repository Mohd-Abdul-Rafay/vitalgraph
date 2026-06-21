// ─────────────────────────────────────────────────────────────────────────────
// Food database — ported verbatim from nutrition-dashboard.html.
// All values are per 100 g unless the food's perUnit specifies otherwise.
// null means "not reported by the source" — never treat as 0.
// ─────────────────────────────────────────────────────────────────────────────

// ── Micronutrient metadata ────────────────────────────────────────────────────
export const MICRO_META = {
  iron:      { label: "Iron",        unit: "mg",  rda: 8    },
  calcium:   { label: "Calcium",     unit: "mg",  rda: 1000 },
  potassium: { label: "Potassium",   unit: "mg",  rda: 3400 },
  magnesium: { label: "Magnesium",   unit: "mg",  rda: 400  },
  zinc:      { label: "Zinc",        unit: "mg",  rda: 11   },
  vitC:      { label: "Vitamin C",   unit: "mg",  rda: 90   },
  vitD:      { label: "Vitamin D",   unit: "mcg", rda: 15   },
  vitA:      { label: "Vitamin A",   unit: "mcg", rda: 900  },
  vitB12:    { label: "Vitamin B12", unit: "mcg", rda: 2.4  },
  folate:    { label: "Folate",      unit: "mcg", rda: 400  },
  sodium:    { label: "Sodium",      unit: "mg",  rda: 2300 },
};

// ── Amino acid classifications ────────────────────────────────────────────────
export const ESSENTIAL_AA = [
  "histidine","isoleucine","leucine","lysine",
  "methionine","phenylalanine","threonine","tryptophan","valine",
];

export const NONESSENTIAL_AA = [
  "alanine","arginine","aspartate","cystine",
  "glutamate","glycine","proline","serine","tyrosine",
];

export const AA_LABEL = {
  histidine:"Histidine", isoleucine:"Isoleucine", leucine:"Leucine",
  lysine:"Lysine",       methionine:"Methionine", phenylalanine:"Phenylalanine",
  threonine:"Threonine", tryptophan:"Tryptophan", valine:"Valine",
  alanine:"Alanine",     arginine:"Arginine",     aspartate:"Aspartate",
  cystine:"Cystine",     glutamate:"Glutamate",   glycine:"Glycine",
  proline:"Proline",     serine:"Serine",         tyrosine:"Tyrosine",
};

// ── Activity levels (used by profile / onboarding) ────────────────────────────
export const ACTIVITY = [
  { id:"sedentary", label:"Sedentary",         desc:"Desk job, little or no exercise",               mult:1.2   },
  { id:"light",     label:"Lightly active",    desc:"Light exercise 1–3 days/week",                  mult:1.375 },
  { id:"moderate",  label:"Moderately active", desc:"Exercise 3–5 days/week",                        mult:1.55  },
  { id:"very",      label:"Very active",       desc:"Hard exercise or sport 6–7 days/week",          mult:1.725 },
  { id:"extra",     label:"Extra active",      desc:"Twice-a-day training or physical labour job",   mult:1.9   },
];

// ── Goal presets (used by profile / onboarding) ───────────────────────────────
export const GOALS = [
  { id:"recomp",       label:"Recomposition", desc:"Eat at maintenance — build muscle and lose fat simultaneously"  },
  { id:"fat_loss",     label:"Fat loss",      desc:"Calorie deficit — lose fat while preserving muscle with high protein" },
  { id:"muscle_gain",  label:"Muscle gain",   desc:"Calorie surplus — provide extra energy for muscle growth"       },
];

// ── Food database ─────────────────────────────────────────────────────────────
// Note: TARGETS was replaced by the science-based calcTargets() function
// (Mifflin–St Jeor BMR + TDEE + goal adjustment). That logic migrates in
// a later step alongside the profile system.
export const FOODS = [
  {
    id:"chicken_breast", name:"Chicken breast, skinless", category:"protein",
    perUnit:{ label:"100g", grams:100 }, unit:{ type:"gram" },
    macros:{ kcal:165, protein:31, carb:0, fat:3.6, fiber:0 },
    carbProfile:{ sugars:0, starch:0, addedSugar:0 },
    fatProfile:{ sat:1.0, mono:1.2, poly:0.8, omega3:0.03, omega6:0.55 },
    fiberProfile:{ soluble:0, insoluble:0 },
    amino:{ histidine:950,isoleucine:1630,leucine:2330,lysine:2640,methionine:860,phenylalanine:1230,threonine:1310,tryptophan:360,valine:1540,alanine:1690,arginine:1870,aspartate:2770,cystine:410,glutamate:4640,glycine:1490,proline:1230,serine:1070,tyrosine:1040 },
    micros:{ iron:1.0,calcium:15,potassium:256,magnesium:29,zinc:1.0,vitC:0,vitD:0.1,vitA:9,vitB12:0.3,folate:4,sodium:74 },
  },
  {
    id:"whole_egg", name:"Egg, whole", category:"protein",
    perUnit:{ label:"1 large (50g)", grams:50 }, unit:{ type:"piece", label:"egg", gramsEach:50 },
    macros:{ kcal:143, protein:12.6, carb:0.7, fat:9.5, fiber:0 },
    carbProfile:{ sugars:0.4, starch:0, addedSugar:0 },
    fatProfile:{ sat:3.1, mono:3.7, poly:1.9, omega3:0.08, omega6:1.6 },
    fiberProfile:{ soluble:0, insoluble:0 },
    amino:{ histidine:309,isoleucine:672,leucine:1086,lysine:912,methionine:380,phenylalanine:680,threonine:556,tryptophan:167,valine:858,alanine:736,arginine:820,aspartate:1330,cystine:272,glutamate:1650,glycine:432,proline:500,serine:970,tyrosine:500 },
    micros:{ iron:1.8,calcium:56,potassium:138,magnesium:12,zinc:1.3,vitC:0,vitD:2.0,vitA:160,vitB12:0.9,folate:47,sodium:142 },
    variants:[
      {
        id:"whole", label:"Whole",
        macros:{ kcal:143, protein:12.6, carb:0.7, fat:9.5, fiber:0 },
        carbProfile:{ sugars:0.4, starch:0, addedSugar:0 },
        fatProfile:{ sat:3.1, mono:3.7, poly:1.9, omega3:0.08, omega6:1.6 },
        fiberProfile:{ soluble:0, insoluble:0 },
        amino:{ histidine:309,isoleucine:672,leucine:1086,lysine:912,methionine:380,phenylalanine:680,threonine:556,tryptophan:167,valine:858,alanine:736,arginine:820,aspartate:1330,cystine:272,glutamate:1650,glycine:432,proline:500,serine:970,tyrosine:500 },
        micros:{ iron:1.8,calcium:56,potassium:138,magnesium:12,zinc:1.3,vitC:0,vitD:2.0,vitA:160,vitB12:0.9,folate:47,sodium:142 },
      },
      {
        id:"whites", label:"Whites only",
        macros:{ kcal:52, protein:11, carb:0.7, fat:0.2, fiber:0 },
        carbProfile:{ sugars:0.3, starch:0, addedSugar:0 },
        fatProfile:{ sat:0.03, mono:0.01, poly:0.04, omega3:0.0, omega6:0.04 },
        fiberProfile:{ soluble:0, insoluble:0 },
        amino:{ histidine:237,isoleucine:532,leucine:847,lysine:700,methionine:316,phenylalanine:560,threonine:446,tryptophan:148,valine:672,alanine:591,arginine:646,aspartate:1054,cystine:248,glutamate:1411,glycine:341,proline:331,serine:699,tyrosine:390 },
        micros:{ iron:0.1,calcium:7,potassium:163,magnesium:11,zinc:0.03,vitC:0,vitD:0,vitA:0,vitB12:0.09,folate:4,sodium:166 },
      },
      {
        id:"boiled", label:"Boiled",
        macros:{ kcal:143, protein:12.6, carb:0.7, fat:9.5, fiber:0 },
        carbProfile:{ sugars:0.4, starch:0, addedSugar:0 },
        fatProfile:{ sat:3.1, mono:3.7, poly:1.9, omega3:0.08, omega6:1.6 },
        fiberProfile:{ soluble:0, insoluble:0 },
        amino:{ histidine:309,isoleucine:672,leucine:1086,lysine:912,methionine:380,phenylalanine:680,threonine:556,tryptophan:167,valine:858,alanine:736,arginine:820,aspartate:1330,cystine:272,glutamate:1650,glycine:432,proline:500,serine:970,tyrosine:500 },
        micros:{ iron:1.8,calcium:56,potassium:138,magnesium:12,zinc:1.3,vitC:0,vitD:2.0,vitA:160,vitB12:0.9,folate:47,sodium:142 },
      },
      {
        id:"omelette", label:"Omelette",
        macros:{ kcal:233, protein:12.6, carb:0.7, fat:19.5, fiber:0 },
        carbProfile:{ sugars:0.4, starch:0, addedSugar:0 },
        fatProfile:{ sat:9.3, mono:6.6, poly:2.3, omega3:0.13, omega6:1.82 },
        fiberProfile:{ soluble:0, insoluble:0 },
        amino:{ histidine:309,isoleucine:672,leucine:1086,lysine:912,methionine:380,phenylalanine:680,threonine:556,tryptophan:167,valine:858,alanine:736,arginine:820,aspartate:1330,cystine:272,glutamate:1650,glycine:432,proline:500,serine:970,tyrosine:500 },
        micros:{ iron:1.8,calcium:56,potassium:138,magnesium:12,zinc:1.3,vitC:0,vitD:2.0,vitA:244,vitB12:0.9,folate:47,sodium:142 },
      },
    ],
  },
  {
    id:"whey_gold", name:"Whey — Gold Standard", brand:"Optimum Nutrition", category:"protein",
    perUnit:{ label:"1 scoop (31g)", grams:31 }, unit:{ type:"serving", label:"scoop", gramsEach:31 },
    macros:{ kcal:387, protein:77, carb:10, fat:5, fiber:0 },
    carbProfile:{ sugars:12, starch:null, addedSugar:6 },
    fatProfile:{ sat:3.2, mono:null, poly:null, omega3:null, omega6:null },
    fiberProfile:{ soluble:null, insoluble:null },
    amino:{ histidine:1300,isoleucine:4900,leucine:8000,lysine:7100,methionine:1700,phenylalanine:2300,threonine:5200,tryptophan:1400,valine:4500,alanine:null,arginine:null,aspartate:null,cystine:1900,glutamate:null,glycine:null,proline:null,serine:null,tyrosine:null },
    micros:{ iron:1.0,calcium:480,potassium:580,magnesium:50,zinc:1.2,vitC:0,vitD:0,vitA:0,vitB12:1.5,folate:0,sodium:280 },
  },
  {
    id:"oikos_pro", name:"Oikos Pro yogurt, plain", brand:"Danone", category:"protein",
    perUnit:{ label:"1 cup (227g)", grams:227 }, unit:{ type:"serving", label:"cup", gramsEach:227 },
    macros:{ kcal:79, protein:13.2, carb:5.3, fat:0.9, fiber:0 },
    carbProfile:{ sugars:4.0, starch:0, addedSugar:0 },
    fatProfile:{ sat:0.5, mono:0.2, poly:0.05, omega3:null, omega6:null },
    fiberProfile:{ soluble:0, insoluble:0 },
    amino:{ histidine:330,isoleucine:700,leucine:1280,lysine:1150,methionine:340,phenylalanine:680,threonine:590,tryptophan:180,valine:870,alanine:null,arginine:null,aspartate:null,cystine:null,glutamate:null,glycine:null,proline:null,serine:null,tyrosine:null },
    micros:{ iron:0.05,calcium:141,potassium:200,magnesium:13,zinc:0.6,vitC:0,vitD:0,vitA:2,vitB12:0.6,folate:11,sodium:46 },
  },
  {
    id:"white_rice", name:"White rice, cooked", category:"carb",
    perUnit:{ label:"1 cup (158g)", grams:158 }, unit:{ type:"gram" },
    macros:{ kcal:130, protein:2.7, carb:28, fat:0.3, fiber:0.4 },
    carbProfile:{ sugars:0.1, starch:27, addedSugar:0 },
    fatProfile:{ sat:0.08, mono:0.1, poly:0.08, omega3:0.01, omega6:0.07 },
    fiberProfile:{ soluble:0.0, insoluble:0.4 },
    amino:{ histidine:60,isoleucine:110,leucine:220,lysine:95,methionine:60,phenylalanine:140,threonine:95,tryptophan:30,valine:160,alanine:null,arginine:null,aspartate:null,cystine:null,glutamate:null,glycine:null,proline:null,serine:null,tyrosine:null },
    micros:{ iron:0.2,calcium:10,potassium:35,magnesium:12,zinc:0.5,vitC:0,vitD:0,vitA:0,vitB12:0,folate:58,sodium:1 },
  },
  {
    id:"mission_carb_balance", name:"Carb Balance tortilla", brand:"Mission", category:"carb",
    perUnit:{ label:"1 tortilla (42g)", grams:42 }, unit:{ type:"serving", label:"tortilla", gramsEach:42 },
    macros:{ kcal:190, protein:12, carb:43, fat:10, fiber:38 },
    carbProfile:{ sugars:0, starch:null, addedSugar:0 },
    fatProfile:{ sat:2.4, mono:null, poly:null, omega3:null, omega6:null },
    fiberProfile:{ soluble:null, insoluble:null },
    amino: null,
    micros:{ iron:3.6,calcium:120,potassium:100,magnesium:24,zinc:0.8,vitC:0,vitD:0,vitA:0,vitB12:0,folate:90,sodium:950 },
  },
  {
    id:"banana", name:"Banana", category:"fruit",
    perUnit:{ label:"1 medium (118g)", grams:118 }, unit:{ type:"piece", label:"banana", gramsEach:118 },
    macros:{ kcal:89, protein:1.1, carb:23, fat:0.3, fiber:2.6 },
    carbProfile:{ sugars:12, starch:5.4, addedSugar:0 },
    fatProfile:{ sat:0.1, mono:0.03, poly:0.07, omega3:0.03, omega6:0.05 },
    fiberProfile:{ soluble:0.7, insoluble:1.9 },
    amino:{ histidine:77,isoleucine:28,leucine:68,lysine:50,methionine:8,phenylalanine:49,threonine:28,tryptophan:9,valine:47,alanine:null,arginine:null,aspartate:null,cystine:null,glutamate:null,glycine:null,proline:null,serine:null,tyrosine:null },
    micros:{ iron:0.3,calcium:5,potassium:358,magnesium:27,zinc:0.2,vitC:8.7,vitD:0,vitA:3,vitB12:0,folate:20,sodium:1 },
  },
  {
    id:"spinach", name:"Spinach, raw", category:"vegetable",
    perUnit:{ label:"1 cup (30g)", grams:30 }, unit:{ type:"gram" },
    macros:{ kcal:23, protein:2.9, carb:3.6, fat:0.4, fiber:2.2 },
    carbProfile:{ sugars:0.4, starch:0, addedSugar:0 },
    fatProfile:{ sat:0.06, mono:0.01, poly:0.16, omega3:0.14, omega6:0.02 },
    fiberProfile:{ soluble:0.6, insoluble:1.6 },
    amino:{ histidine:64,isoleucine:147,leucine:223,lysine:174,methionine:53,phenylalanine:129,threonine:122,tryptophan:39,valine:161,alanine:null,arginine:null,aspartate:null,cystine:null,glutamate:null,glycine:null,proline:null,serine:null,tyrosine:null },
    micros:{ iron:2.7,calcium:99,potassium:558,magnesium:79,zinc:0.5,vitC:28,vitD:0,vitA:469,vitB12:0,folate:194,sodium:79 },
  },
  {
    id:"almonds", name:"Almonds", category:"fat",
    perUnit:{ label:"1 oz (28g)", grams:28 }, unit:{ type:"gram" },
    macros:{ kcal:579, protein:21, carb:22, fat:50, fiber:12.5 },
    carbProfile:{ sugars:4.4, starch:0.7, addedSugar:0 },
    fatProfile:{ sat:3.8, mono:31, poly:12, omega3:0.003, omega6:12 },
    fiberProfile:{ soluble:0.9, insoluble:11.6 },
    amino:{ histidine:540,isoleucine:750,leucine:1490,lysine:580,methionine:150,phenylalanine:1130,threonine:600,tryptophan:210,valine:820,alanine:null,arginine:null,aspartate:null,cystine:null,glutamate:null,glycine:null,proline:null,serine:null,tyrosine:null },
    micros:{ iron:3.7,calcium:269,potassium:733,magnesium:270,zinc:3.1,vitC:0,vitD:0,vitA:0,vitB12:0,folate:44,sodium:1 },
  },
  {
    id:"ghee", name:"Ghee", category:"fat",
    perUnit:{ label:"1 tbsp (14g)", grams:14 }, unit:{ type:"serving", label:"tbsp", gramsEach:14 },
    macros:{ kcal:900, protein:0, carb:0, fat:100, fiber:0 },
    carbProfile:{ sugars:0, starch:0, addedSugar:0 },
    fatProfile:{ sat:62, mono:29, poly:4, omega3:0.5, omega6:2.2 },
    fiberProfile:{ soluble:0, insoluble:0 },
    amino: null,
    micros:{ iron:0,calcium:0,potassium:0,magnesium:0,zinc:0,vitC:0,vitD:0,vitA:840,vitB12:0,folate:0,sodium:0 },
  },
];

// ── Pure helpers (no side effects, no React, no localStorage) ─────────────────

// Scale a per-100g value to the eaten gram amount. Returns null if value is null.
export const scale = (v, grams) => v == null ? null : v * grams / 100;

// Look up a food by its id.
export const FOOD_BY_ID = (id) => FOODS.find(f => f.id === id);

// Resolve the nutrition profile for a log entry, respecting the chosen variant.
export const getProfile = (entry) => {
  if (entry.variantId && entry.food.variants) {
    const v = entry.food.variants.find(v => v.id === entry.variantId);
    if (v) return v;
  }
  return entry.food;
};
