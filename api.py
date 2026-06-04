import asyncio
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

import aiohttp
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.engine.url import URL
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import Field, SQLModel, select

# ---------- Config ----------

load_dotenv()

DB_HOST = os.environ["DB_HOST"]
DB_PORT = int(os.environ.get("DB_PORT", 3306))
DB_USER = os.environ["DB_USER"]
DB_PASS = os.environ["DB_PASS"]
DB_NAME = os.environ["DB_NAME"]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30

db_url = URL.create(
    drivername="mysql+asyncmy",
    username=DB_USER,
    password=DB_PASS,
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
)

engine = create_async_engine(db_url, pool_pre_ping=True, echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------- Models ----------

class User(SQLModel, table=True):
    __tablename__ = "plantapp_users"
    id: str = Field(primary_key=True, max_length=36)
    username: Optional[str] = Field(default=None, max_length=64, unique=True, index=True)
    password_hash: Optional[str] = Field(default=None, max_length=255)
    display_name: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Device(SQLModel, table=True):
    __tablename__ = "plantapp_devices"
    mac: str = Field(primary_key=True, max_length=12)
    first_seen: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)


class UserDevice(SQLModel, table=True):
    __tablename__ = "plantapp_user_devices"
    user_id: str = Field(primary_key=True, max_length=36)
    mac: str = Field(primary_key=True, max_length=12)
    nickname: Optional[str] = Field(default=None, max_length=255)
    added_at: datetime = Field(default_factory=datetime.utcnow)


# ---------- App + CORS ----------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://plantapp.store", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Auth helpers ----------

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_session():
    async with SessionLocal() as session:
        yield session


async def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    session: AsyncSession = Depends(get_session),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Malformed token")
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------- Existing: HTTP fan-out proxy (legacy, kept for any non-PlantApp clients) ----------

class ToggleRequest(BaseModel):
    ip: list[str]


async def toggle_light(client_session: aiohttp.ClientSession, url: str) -> dict:
    try:
        async with client_session.get(url, timeout=aiohttp.ClientTimeout(total=3)) as response:
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


# ---------- Auth: register / login ----------

class RegisterRequest(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/api/auth/register")
async def auth_register(body: RegisterRequest, session: AsyncSession = Depends(get_session)):
    username = body.username.strip()
    if len(username) < 3 or len(username) > 64:
        raise HTTPException(status_code=400, detail="Username must be 3-64 chars")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 chars")
    stmt = select(User).where(User.username == username)
    existing = (await session.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")
    user = User(
        id=str(uuid.uuid4()),
        username=username,
        password_hash=hash_password(body.password),
        display_name=body.display_name or username,
    )
    session.add(user)
    await session.commit()
    return {
        "token": create_access_token(user.id),
        "user": {"id": user.id, "username": user.username, "display_name": user.display_name},
    }


@app.post("/api/auth/login")
async def auth_login(body: LoginRequest, session: AsyncSession = Depends(get_session)):
    stmt = select(User).where(User.username == body.username.strip())
    user = (await session.execute(stmt)).scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {
        "token": create_access_token(user.id),
        "user": {"id": user.id, "username": user.username, "display_name": user.display_name},
    }


# ---------- Current user ----------

class UpdateMeRequest(BaseModel):
    display_name: str


@app.get("/api/me")
async def get_me(user: User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username, "display_name": user.display_name}


@app.put("/api/me")
async def update_me(
    body: UpdateMeRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user.display_name = body.display_name
    session.add(user)
    await session.commit()
    return {"id": user.id, "username": user.username, "display_name": user.display_name}


# ---------- Devices (open: ESP32 has no user context) ----------

class DeviceRegisterRequest(BaseModel):
    mac: str


@app.post("/api/devices/register")
async def register_device(
    body: DeviceRegisterRequest,
    session: AsyncSession = Depends(get_session),
):
    mac = body.mac.upper()
    device = await session.get(Device, mac)
    if device is None:
        device = Device(mac=mac)
        session.add(device)
    else:
        device.last_seen = datetime.utcnow()
        session.add(device)
    await session.commit()
    return {"mac": device.mac, "first_seen": device.first_seen, "last_seen": device.last_seen}


@app.get("/api/devices/unclaimed")
async def list_unclaimed(
    session: AsyncSession = Depends(get_session),
    _user: User = Depends(get_current_user),  # require auth to see unclaimed
):
    stmt = (
        select(Device)
        .outerjoin(UserDevice, UserDevice.mac == Device.mac)
        .where(UserDevice.mac.is_(None))
    )
    result = await session.execute(stmt)
    devices = result.scalars().all()
    return [
        {"mac": d.mac, "first_seen": d.first_seen, "last_seen": d.last_seen}
        for d in devices
    ]


# ---------- Per-user device list ----------

class ClaimDeviceRequest(BaseModel):
    mac: str
    nickname: Optional[str] = None


class RenameDeviceRequest(BaseModel):
    nickname: str


@app.get("/api/me/devices")
async def list_my_devices(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    stmt = (
        select(UserDevice, Device)
        .join(Device, UserDevice.mac == Device.mac)
        .where(UserDevice.user_id == user.id)
    )
    result = await session.execute(stmt)
    rows = result.all()
    return [
        {
            "mac": ud.mac,
            "nickname": ud.nickname,
            "first_seen": d.first_seen,
            "last_seen": d.last_seen,
            "added_at": ud.added_at,
        }
        for ud, d in rows
    ]


@app.post("/api/me/devices")
async def claim_device(
    body: ClaimDeviceRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    mac = body.mac.upper()
    device = await session.get(Device, mac)
    if device is None:
        raise HTTPException(status_code=404, detail=f"Device {mac} not registered")
    existing = await session.get(UserDevice, (user.id, mac))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Device already claimed by this user")
    ud = UserDevice(user_id=user.id, mac=mac, nickname=body.nickname)
    session.add(ud)
    await session.commit()
    return {"mac": ud.mac, "nickname": ud.nickname, "added_at": ud.added_at}


@app.delete("/api/me/devices/{mac}")
async def unclaim_device(
    mac: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    mac = mac.upper()
    ud = await session.get(UserDevice, (user.id, mac))
    if ud is None:
        raise HTTPException(status_code=404, detail="Device not claimed by this user")
    await session.delete(ud)
    await session.commit()
    return {"status": "ok"}


@app.patch("/api/me/devices/{mac}")
async def rename_device(
    mac: str,
    body: RenameDeviceRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    mac = mac.upper()
    ud = await session.get(UserDevice, (user.id, mac))
    if ud is None:
        raise HTTPException(status_code=404, detail="Device not claimed by this user")
    ud.nickname = body.nickname
    session.add(ud)
    await session.commit()
    return {"mac": ud.mac, "nickname": ud.nickname}
