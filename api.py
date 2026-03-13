import asyncio
import aiohttp
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://plantapp.store", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ToggleRequest(BaseModel):
    ip: list[str]

async def toggle_light(session: aiohttp.ClientSession, url: str) -> dict:
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=3)) as response:
            return {"ip": url, "status": "success", "response": await response.text()}
    except asyncio.TimeoutError:
        return {"ip": url, "status": "timeout"}
    except Exception as e:
        return {"ip": url, "status": "error", "error": str(e)}

@app.post("/api/toggle_lights")
async def toggle_lights(body: ToggleRequest):
    async with aiohttp.ClientSession() as session:
        results = await asyncio.gather(*[toggle_light(session, url) for url in body.ip])
    return results
