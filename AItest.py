#!/usr/bin/env python3
"""
One-shot test: grab a frame from the camera relay, ask LM Studio three
separate questions about it, print the answers together. Run from
Windows. No arguments needed.

The questions are deliberately separate requests so that a failure or
context overrun on one cannot destroy the answers already completed.

Every image sent to the model is saved in ./screenshots (next to this
script). The folder is emptied at the start of each run, so it only
ever holds what the most recent run sent.
"""

import base64
import io
import json
import urllib.request
from pathlib import Path

from PIL import Image

# Ubuntu VM running the camera relay
FRAME_URL = "http://192.168.1.7:8090/"

# LM Studio on this Windows machine
BASE_URL = "http://192.168.1.240:1267/v1"

# With Just-in-Time loading on, /v1/models lists every model you've
# downloaded, not just the loaded one — so "first in the list" can pick
# the wrong model. Paste the exact id here to pin it.
MODEL_ID = None

# Qwen's guidance for its thinking-mode models is to avoid greedy
# decoding (temperature 0), which it says can cause repetition loops.
TEMPERATURE = 0.6
TOP_P = 0.95

# Next to this script, regardless of where it's run from.
SCREENSHOT_DIR = Path(__file__).resolve().parent / "screenshots"

# Soil regions as (left, top, right, bottom) fractions of the frame.
# Each is cropped, zoomed, and stitched side by side into one image.
# Re-tune these if the camera moves; check screenshots/soil.jpg.
SOIL_REGIONS = [
    (0.60, 0.05, 0.88, 0.42),  # upper right: truest colour, stake crosses it
    (0.38, 0.66, 0.74, 0.88),  # lower centre: most open soil, some leaf cover
]
SOIL_ZOOM = 2.5

IGNORE_BACKGROUND = (
    "Look at the main subject of this image and ignore anything that is "
    "background, scenery, or incidental to what the camera is pointed at."
)

PROMPT_IS_PLANT = (
    IGNORE_BACKGROUND + "\n\n"
    "Are there plants in the image? "
    "Answer with only the single word YES or NO."
)

PROMPT_SPECIES = (
    IGNORE_BACKGROUND + "\n\n"
    "What plant(s) are in this photo? If there are several different ones, focus your attention on the 2 or 3 most prominent ones in view do not waste time on edge cases."
    "Ignore background content such as the stick the camera is mounted on."
    "Provide ONLY a single name or a list of names, no explaination in the response just the names of plants."
    "If a common name exists for the plant provide that rather than the scientific name."
    "If you cannot tell, answer UNKNOWN."
)

PROMPT_WATERING = (
    "This image shows close-up crops of the soil surface in a potted plant, "
    "placed side by side and separated by a white divider. "
    "Parts of the soil may be covered by leaves, stems, or a green support stake; "
    "judge only the exposed soil and ignore everything else. "
    "The scene may have a purple or magenta tint from grow lights; do not "
    "mistake that tint for the colour of the soil.\n\n"
    "Based on the texture and appearance of the exposed soil, does this "
    "plant need to be watered? Answer with one of: YES, NO, or UNSURE. "
    "Follow that with a single short sentence describing what you saw in "
    "the soil that led to your answer."
)


def prepare_screenshot_dir():
    """Create the folder if needed and empty it of old images."""
    SCREENSHOT_DIR.mkdir(exist_ok=True)
    for p in SCREENSHOT_DIR.iterdir():
        if p.is_file():
            p.unlink()


def get_frame():
    with urllib.request.urlopen(FRAME_URL, timeout=30) as resp:
        return resp.read()


def build_soil_image(jpeg_bytes):
    """
    Crops each region in SOIL_REGIONS, zooms it by SOIL_ZOOM, and stitches
    the results side by side with a white divider. Returns JPEG bytes.
    """
    img = Image.open(io.BytesIO(jpeg_bytes)).convert("RGB")
    w, h = img.size

    crops = []
    for left, top, right, bottom in SOIL_REGIONS:
        crop = img.crop((int(w * left), int(h * top), int(w * right), int(h * bottom)))
        crop = crop.resize(
            (int(crop.width * SOIL_ZOOM), int(crop.height * SOIL_ZOOM)),
            Image.LANCZOS,
        )
        crops.append(crop)

    gap = 12
    canvas = Image.new(
        "RGB",
        (sum(c.width for c in crops) + gap * (len(crops) - 1), max(c.height for c in crops)),
        (255, 255, 255),
    )
    x = 0
    for crop in crops:
        canvas.paste(crop, (x, 0))
        x += crop.width + gap

    buf = io.BytesIO()
    canvas.save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def get_model_id():
    if MODEL_ID:
        return MODEL_ID
    with urllib.request.urlopen(f"{BASE_URL}/models", timeout=30) as resp:
        data = json.loads(resp.read())
    ids = [m["id"] for m in data.get("data", [])]
    if not ids:
        raise RuntimeError("No models returned — is one loaded in LM Studio?")
    if len(ids) > 1:
        print("WARNING: multiple models available; using the first. Pin MODEL_ID to be sure:")
        for i in ids:
            print(f"  {i}")
    return ids[0]


def ask(b64_image, model_id, prompt, max_tokens, fallback):
    """
    Returns the model's answer, or `fallback` if the model ran out of
    tokens before emitting visible content, errored, or came back empty.
    """
    payload = {
        "model": model_id,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"},
                    },
                ],
            }
        ],
        "temperature": TEMPERATURE,
        "top_p": TOP_P,
        "max_tokens": max_tokens,
    }

    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        # Generous timeout: with Just-in-Time loading on, the first call
        # after an idle period may load the model into VRAM first.
        with urllib.request.urlopen(req, timeout=600) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"  request failed: {e}")
        return fallback

    choice = data["choices"][0]
    msg = choice["message"]
    content = (msg.get("content") or "").strip()
    finish = choice.get("finish_reason")

    # --- debug output ---
    print(f"  finish_reason: {finish}")
    usage = data.get("usage")
    if usage:
        print(f"  usage: {usage}")

    # LM Studio surfaces chain-of-thought separately from the answer on
    # reasoning models; field name varies by build, so check both.
    reasoning = msg.get("reasoning_content") or msg.get("reasoning")
    if reasoning:
        print("  --- reasoning ---")
        print("  " + reasoning.strip().replace("\n", "\n  "))
        print("  --- end reasoning ---")

    if not content:
        # Hit the cap while still reasoning, or returned nothing usable.
        print("  no content returned — full response follows:")
        print(json.dumps(data, indent=2)[:4000])
        return fallback

    print(f"  content: {content!r}")
    return content


def run_analysis():
    """
    Full one-shot run. Returns {"plant", "species", "watering"}.
    Progress still goes to stdout, so behaviour is identical whether this
    is called from the command line or from the API.
    """
    # Clear first: if the fetch fails, an empty folder correctly shows
    # that nothing was sent this run.
    prepare_screenshot_dir()

    print("Grabbing frame from camera...")
    frame = get_frame()
    (SCREENSHOT_DIR / "frame.jpg").write_bytes(frame)
    print(f"Got {len(frame)} bytes — saved screenshots/frame.jpg")

    print("Building soil crop...")
    soil = build_soil_image(frame)
    (SCREENSHOT_DIR / "soil.jpg").write_bytes(soil)
    print(f"Soil crop: {len(soil)} bytes — saved screenshots/soil.jpg")

    b64_full = base64.b64encode(frame).decode("ascii")
    b64_soil = base64.b64encode(soil).decode("ascii")
    model_id = get_model_id()
    print(f"Using model: {model_id}\n")

    print("Q1: are there plants?")
    plant = ask(b64_full, model_id, PROMPT_IS_PLANT, max_tokens=2048, fallback="UNKNOWN")

    print("\nQ2: what plant is it?")
    species = ask(b64_full, model_id, PROMPT_SPECIES, max_tokens=8192, fallback="UNKNOWN")

    print("\nQ3: does it need watering? (soil crop)")
    watering = ask(b64_soil, model_id, PROMPT_WATERING, max_tokens=4096, fallback="UNSURE")

    return {"plant": plant, "species": species, "watering": watering}


if __name__ == "__main__":
    result = run_analysis()

    print("\n=== Result ===")
    print(f"PLANT:    {result['plant']}")
    print(f"SPECIES:  {result['species']}")
    print(f"WATERING: {result['watering']}")
