#include <ESP8266WiFi.h>
#include <EEPROM.h>
#include <time.h>
#include <ArduinoOTA.h>

const char* ssid = "NETGEAR67";
const char* password = "festivecar351";

#define CONTROL_PIN 0

WiFiServer server(80);

unsigned long timeOnMillis = 0;
unsigned long timeOffMillis = 0;
unsigned long lastToggleTime = 0;
bool isOn = false;
bool manualOverride = false;

float timeStartUTC = 0;
float timeEndUTC = 0;
bool timeControlActive = false;

String logBuffer = "";
const int maxLogSize = 2000;

#define EEPROM_SIZE 512
#define TIME_START_ADDR 0
#define TIME_END_ADDR 4

void logMessage(String message) {
  Serial.println(message);
  logBuffer += message + "\n";
  if (logBuffer.length() > maxLogSize) {
    int excess = logBuffer.length() - maxLogSize;
    logBuffer = logBuffer.substring(excess);
  }
}

void sendResponse(WiFiClient& client, String status, String body) {
  client.print("HTTP/1.1 " + status + "\r\n");
  client.print("Content-Type: text/plain\r\n");
  client.print("Access-Control-Allow-Origin: *\r\n");
  client.print("Connection: close\r\n");
  client.print("Content-Length: " + String(body.length()) + "\r\n");
  client.print("\r\n");
  client.print(body);
  delay(20);
  client.flush();
}

void setup() {
  Serial.begin(115200);
  delay(2000);
  logMessage("Booted");

  EEPROM.begin(EEPROM_SIZE);
  EEPROM.get(TIME_START_ADDR, timeStartUTC);
  EEPROM.get(TIME_END_ADDR, timeEndUTC);
  timeControlActive = (timeStartUTC != 0 || timeEndUTC != 0);
  logMessage("Restored time range: " + String(timeStartUTC) + " to " + String(timeEndUTC));

  pinMode(CONTROL_PIN, OUTPUT);
  digitalWrite(CONTROL_PIN, HIGH);
  logMessage("CONTROL_PIN set, initial state OFF");

  logMessage("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(5000);
    logMessage("Still connecting...");
    Serial.println(WiFi.status());
  }
  logMessage("Connected to WiFi");
  logMessage("IP Address: " + WiFi.localIP().toString());

  ArduinoOTA.onStart([]() {
    String type = (ArduinoOTA.getCommand() == U_FLASH) ? "sketch" : "filesystem";
    logMessage("OTA update starting: " + type);
  });
  ArduinoOTA.onEnd([]() {
    logMessage("OTA update complete");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    logMessage("OTA progress: " + String(progress * 100 / total) + "%");
  });
  ArduinoOTA.onError([](ota_error_t error) {
    logMessage("OTA error [" + String(error) + "]: " +
      (error == OTA_AUTH_ERROR ? "Auth Failed" :
      error == OTA_BEGIN_ERROR ? "Begin Failed" :
      error == OTA_CONNECT_ERROR ? "Connect Failed" :
      error == OTA_RECEIVE_ERROR ? "Receive Failed" :
      error == OTA_END_ERROR ? "End Failed" : "Unknown Error"));
  });
  ArduinoOTA.begin();
  logMessage("OTA initialized");

  logMessage("Starting NTP sync...");
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  if (timeControlActive) {
    struct tm timeInfo;
    time_t now = time(nullptr);
    localtime_r(&now, &timeInfo);
    if (now > 100000) {
      logMessage("NTP synced, checking time range");
      float currentHour = timeInfo.tm_hour + timeInfo.tm_min / 60.0 + timeInfo.tm_sec / 3600.0;
      if (currentHour >= timeStartUTC && currentHour < timeEndUTC) {
        digitalWrite(CONTROL_PIN, LOW);
        isOn = true;
        logMessage("Restored to ON based on time range");
      } else {
        digitalWrite(CONTROL_PIN, HIGH);
        isOn = false;
        logMessage("Restored to OFF based on time range");
      }
    } else {
      logMessage("NTP not yet synced, skipping time restore");
    }
  }

  server.begin();
  logMessage("Server started");
}

void loop() {
  ArduinoOTA.handle();

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    logMessage("Reconnecting to WiFi...");
    delay(5000);
  }

  WiFiClient client = server.available();
  if (client) {
    unsigned long timeout = millis();
    while (client.available() == 0) {
      if (millis() - timeout > 3000) {
        client.stop();
        return;
      }
      delay(1);
    }

    String request = client.readStringUntil('\r');
    client.flush();
    delay(10);
    logMessage("Received request: " + request);

    if (request.indexOf("/timer?time_on=") != -1 && request.indexOf("&time_off=") != -1) {
      timeControlActive = false;
      int timeOnStart = request.indexOf("time_on=") + 8;
      int timeOnEnd = request.indexOf("&", timeOnStart);
      int timeOffStart = request.indexOf("time_off=") + 9;

      String timeOnStr = request.substring(timeOnStart, timeOnEnd);
      String timeOffStr = request.substring(timeOffStart, request.indexOf(" ", timeOffStart));

      timeOnMillis = (unsigned long)(timeOnStr.toFloat() * 3600000);
      timeOffMillis = (unsigned long)(timeOffStr.toFloat() * 3600000);
      manualOverride = false;

      lastToggleTime = millis();
      isOn = false;
      digitalWrite(CONTROL_PIN, LOW);

      sendResponse(client, "200 OK", "Timer set.");
      logMessage("Timer updated: ON for " + String(timeOnMillis / 60000) + "m " + String((timeOnMillis % 60000) / 1000) + "s, OFF for " + String(timeOffMillis / 60000) + "m " + String((timeOffMillis % 60000) / 1000) + "s");
    }
    else if (request.indexOf("/pin/status") != -1) {
      int pinState = digitalRead(CONTROL_PIN);
      String pinStateStr = (pinState == LOW) ? "LOW (ON)" : "HIGH (OFF)";
      sendResponse(client, "200 OK", "Pin State: " + pinStateStr);
      logMessage("Served pin status: " + pinStateStr);
    }
    else if (request.indexOf("/led/on") != -1) {
      manualOverride = true;
      timeOnMillis = 0;
      timeOffMillis = 0;
      digitalWrite(CONTROL_PIN, LOW);
      sendResponse(client, "200 OK", "GPIO ON");
      logMessage("Manually turned ON");
    }
    else if (request.indexOf("/led/off") != -1) {
      manualOverride = true;
      timeOnMillis = 0;
      timeOffMillis = 0;
      digitalWrite(CONTROL_PIN, HIGH);
      sendResponse(client, "200 OK", "GPIO OFF");
      logMessage("Manually turned OFF");
    }
    else if (request.indexOf("/timerange?start=") != -1 && request.indexOf("&end=") != -1) {
      int startIdx = request.indexOf("start=") + 6;
      int endIdx = request.indexOf("&end=");
      int endEnd = request.indexOf(" ", endIdx);

      timeStartUTC = fmod(request.substring(startIdx, endIdx).toFloat() + 5.0, 24.0);
      timeEndUTC = fmod(request.substring(endIdx + 5, endEnd).toFloat() + 5.0, 24.0);
      timeControlActive = true;
      timeOnMillis = 0;
      timeOffMillis = 0;

      EEPROM.put(TIME_START_ADDR, timeStartUTC);
      EEPROM.put(TIME_END_ADDR, timeEndUTC);
      EEPROM.commit();

      sendResponse(client, "200 OK", "Time range set.");
      logMessage("Time range updated: " + String(timeStartUTC) + " to " + String(timeEndUTC));
      manualOverride = false;
    }
    else if (request.indexOf("/reset_timerange") != -1) {
      timeStartUTC = 0;
      timeEndUTC = 0;
      timeControlActive = false;

      EEPROM.put(TIME_START_ADDR, timeStartUTC);
      EEPROM.put(TIME_END_ADDR, timeEndUTC);
      EEPROM.commit();

      digitalWrite(CONTROL_PIN, HIGH);
      isOn = false;

      sendResponse(client, "200 OK", "Time range reset.");
      logMessage("Time range reset");
    }
    else if (request.indexOf("/manual/release") != -1) {
      manualOverride = false;
      timeControlActive = (timeStartUTC != 0 || timeEndUTC != 0);
      if (timeControlActive) {
        struct tm timeInfo;
        time_t now = time(nullptr);
        localtime_r(&now, &timeInfo);
        if (now > 100000) {
          float currentHour = timeInfo.tm_hour + timeInfo.tm_min / 60.0 + timeInfo.tm_sec / 3600.0;
          bool shouldBeOn = (timeStartUTC < timeEndUTC && (currentHour >= timeStartUTC && currentHour < timeEndUTC)) ||
                            (timeStartUTC > timeEndUTC && !(currentHour >= timeEndUTC && currentHour < timeStartUTC));
          if (shouldBeOn) {
            digitalWrite(CONTROL_PIN, LOW);
            isOn = true;
            logMessage("Restored to ON based on time range");
          } else {
            digitalWrite(CONTROL_PIN, HIGH);
            isOn = false;
            logMessage("Restored to OFF based on time range");
          }
        } else {
          logMessage("NTP not synced, skipping time restore on manual release");
        }
      }
      sendResponse(client, "200 OK", "Manual override released.");
      logMessage("Manual override released");
    }
    else if (request.indexOf("/logs") != -1) {
      sendResponse(client, "200 OK", logBuffer);
      logMessage("Logs served");
    }
    else {
      sendResponse(client, "404 Not Found", "Not Found");
      logMessage("Invalid request");
    }

    delay(20);
    client.flush();
    client.stop();
  }

  // Timer logic
  if (!manualOverride && !timeControlActive && (timeOnMillis > 0 || timeOffMillis > 0)) {
    unsigned long currentTime = millis();
    if (!isOn && currentTime - lastToggleTime >= timeOffMillis) {
      digitalWrite(CONTROL_PIN, LOW);
      isOn = true;
      lastToggleTime = currentTime;
      logMessage("Turned ON by timer");
    } else if (isOn && currentTime - lastToggleTime >= timeOnMillis) {
      digitalWrite(CONTROL_PIN, HIGH);
      isOn = false;
      lastToggleTime = currentTime;
      logMessage("Turned OFF by timer");
    }
  }

  // Time range logic
  if (timeControlActive && !manualOverride) {
    struct tm timeInfo;
    time_t now = time(nullptr);
    localtime_r(&now, &timeInfo);
    if (now > 100000) {
      float currentHour = timeInfo.tm_hour + timeInfo.tm_min / 60.0 + timeInfo.tm_sec / 3600.0;
      bool shouldBeOn = (timeStartUTC < timeEndUTC && (currentHour >= timeStartUTC && currentHour < timeEndUTC)) ||
                        (timeStartUTC > timeEndUTC && !(currentHour >= timeEndUTC && currentHour < timeStartUTC));
      if (shouldBeOn && !isOn) {
        digitalWrite(CONTROL_PIN, LOW);
        isOn = true;
        logMessage("Turned ON by time range");
      } else if (!shouldBeOn && isOn) {
        digitalWrite(CONTROL_PIN, HIGH);
        isOn = false;
        logMessage("Turned OFF by time range");
      }
    }
  }
}