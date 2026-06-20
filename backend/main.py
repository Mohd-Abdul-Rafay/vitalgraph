import os
import time
from collections import deque
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic

load_dotenv(override=True)  # .env always wins over shell environment variables

app = FastAPI(title="VitalGraph API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate limiter ─────────────────────────────────────────────────────────────
# Tracks timestamps of recent /explain-plan calls. Calls older than 60 s are
# dropped on each check, so the deque never grows beyond RATE_LIMIT entries.
RATE_LIMIT = 10          # max calls
RATE_WINDOW = 60         # per this many seconds
_call_times: deque = deque()

def _check_rate_limit():
    now = time.monotonic()
    while _call_times and now - _call_times[0] > RATE_WINDOW:
        _call_times.popleft()
    if len(_call_times) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit reached: max {RATE_LIMIT} requests per {RATE_WINDOW} s. Try again shortly."
        )
    _call_times.append(now)


# ── Input model ──────────────────────────────────────────────────────────────
class PlanInput(BaseModel):
    age: int
    sex: str                  # "male" | "female"
    height: float             # cm
    weight: float             # kg
    target_weight: float | None = None
    activity_level: str       # e.g. "moderate"
    goal: str                 # "recomp" | "fat_loss" | "muscle_gain"
    bmr: float
    tdee: float
    calorie_target: int
    protein_g: int
    carb_g: int
    fat_g: int


# ── System prompt ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a knowledgeable, encouraging nutritionist explaining a client's personalised nutrition plan.

STRICT RULES — never break these:
- Use ONLY the numbers provided in the user message. Do not invent, change, or "correct" any calorie or macro target.
- Do not give medical advice, diagnose, or prescribe. End with a brief reminder to consult a registered dietitian or physician for individualised medical guidance.
- Do not encourage extreme restriction or any behaviour that could be harmful.
- Do not mention any targets beyond those given (no sodium, micronutrients, etc.).
- Keep your response concise: three to four short paragraphs, plain language, no bullet lists, no headers.

WHAT TO COVER (in natural flowing prose):
1. Why this calorie target fits their stated goal, in the context of their TDEE.
2. Why the protein target matters — specifically its role in preserving or building muscle.
3. How the carb and fat split supports their goal and daily energy.
4. Two or three practical, sustainable tips for hitting these targets day-to-day.

Frame everything as evidence-based general guidance and note these are sensible starting points to monitor and adjust over time."""


def _build_user_message(p: PlanInput) -> str:
    goal_label = {"recomp": "body recomposition", "fat_loss": "fat loss", "muscle_gain": "muscle gain"}.get(p.goal, p.goal)
    target_line = f"Target weight: {p.target_weight} kg\n" if p.target_weight else ""
    return (
        f"Age: {p.age}\n"
        f"Sex: {p.sex}\n"
        f"Height: {p.height} cm | Weight: {p.weight} kg\n"
        f"{target_line}"
        f"Activity level: {p.activity_level}\n"
        f"Goal: {goal_label}\n"
        f"BMR: {round(p.bmr)} kcal | TDEE: {round(p.tdee)} kcal\n"
        f"Daily calorie target: {p.calorie_target} kcal\n"
        f"Protein: {p.protein_g} g | Carbs: {p.carb_g} g | Fat: {p.fat_g} g\n\n"
        "Please explain this plan."
    )


# ── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    key_loaded = bool(os.getenv("ANTHROPIC_API_KEY"))
    return {"status": "ok", "key_loaded": key_loaded}


@app.post("/explain-plan")
def explain_plan(plan: PlanInput):
    _check_rate_limit()

    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=700,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": _build_user_message(plan)}],
        )
        explanation = message.content[0].text
        return {"explanation": explanation}

    except anthropic.AuthenticationError:
        raise HTTPException(status_code=500, detail="API key invalid or not loaded.")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Anthropic rate limit reached. Try again in a moment.")
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=f"Anthropic API error: {e.message}")
    except Exception:
        raise HTTPException(status_code=500, detail="Unexpected error calling the AI service.")
