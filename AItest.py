#!/usr/bin/env python3
"""
One-shot test: grab a frame from the camera relay, ask LM Studio two
separate questions about it, print both answers together. Run from
Windows. No arguments needed.

The two questions are deliberately separate requests so that a failure
or context overrun on the harder identification question cannot destroy
the simple plant/no-plant answer, which has already completed.
"""

import base64
import json
import urllib.request

# Ubuntu VM running the camera relay
FRAME_URL = "http://192.168.1.7:8090/"

# LM Studio on this Windows machine
BASE_URL = "http://192.168.1.240:1267/v1"

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
    "What plant is this? Give your single best guess as a name. If a common name exists for the plant provide that rather than the scientific name."
    "If you cannot tell, answer UNKNOWN. "
    "Answer with only the name or the word UNKNOWN, nothing else."
)


def get_frame():
    with urllib.request.urlopen(FRAME_URL, timeout=30) as resp:
        return resp.read()


def get_model_id():
    with urllib.request.urlopen(f"{BASE_URL}/models", timeout=30) as resp:
        data = json.loads(resp.read())
    ids = [m["id"] for m in data.get("data", [])]
    if not ids:
        raise RuntimeError("No models returned — is one loaded in LM Studio?")
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
        "temperature": 0,
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


if __name__ == "__main__":
    print("Grabbing frame from camera...")
    frame = get_frame()
    print(f"Got {len(frame)} bytes")

    # Saved so you can eyeball what the model was actually shown —
    # useful when the answer looks wrong.
    with open("frame.jpg", "wb") as f:
        f.write(frame)
    print("Saved as frame.jpg")

    b64 = base64.b64encode(frame).decode("ascii")
    model_id = get_model_id()
    print(f"Using model: {model_id}\n")

    print("Q1: are there plants?")
    plant = ask(b64, model_id, PROMPT_IS_PLANT, max_tokens=2048, fallback="UNKNOWN")

    print("Q2: what plant is it?")
    species = ask(b64, model_id, PROMPT_SPECIES, max_tokens=4096, fallback="UNKNOWN")

    print("\n=== Result ===")
    print(f"PLANT:   {plant}")
    print(f"SPECIES: {species}")