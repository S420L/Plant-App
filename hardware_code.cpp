#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WiFiManager.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <EEPROM.h>
#include <time.h>
#include <ArduinoOTA.h>

// WiFi credentials are no longer hardcoded — set via captive portal
// (WiFiManager stores them in NVS). To wipe and re-enter the portal,
// hit GET /wifi/reset or publish to plantapp/device/{mac}/cmd/wifi_reset.

// Registry endpoint the device announces itself to on every boot.
const char* registryRegisterUrl = "https://server67.site/api/devices/register";

// Set after WiFi connects; reused by mqttSetup() and registerWithRegistry().
String deviceMac;

// Define GPIO pin to control 144 = 16, 108=19, 150=19, 196=19, 185=19, 186=19
#define CONTROL_PIN 19

// Dimmer (IRLZ44N gate) on GPIO 21 via LEDC PWM (ESP32 core 3.x API)
#define DIMMER_PIN       21
#define DIMMER_FREQ      5000    // 5 kHz - above audible, smooth for MOSFET/LED
#define DIMMER_RES_BITS  10      // 10-bit resolution: 0..1023 internally
#define DIMMER_MAX_DUTY  1023    // (1 << DIMMER_RES_BITS) - 1

// Full spectrum control on GPIO 22 — drives IRLZ44N gate that grounds
// the strands' white wires. HIGH = whites grounded = full spectrum.
// LOW = whites floating = reduced spectrum (red/blue base mode).
#define SPECTRUM_PIN 22

// Current brightness in percent (0-100). Loaded from EEPROM on boot, defaults to 100.
int brightnessPercent = 100;

// Current full-spectrum state. Loaded from EEPROM on boot, defaults to true.
bool fullSpectrum = true;

// Create an instance of WiFiServer
WiFiServer server(80);

// Timer variables
unsigned long timeOnMillis = 0;
unsigned long timeOffMillis = 0;
unsigned long lastToggleTime = 0;
bool isOn = false;            // Current state of the pin
bool manualOverride = false;  // Stops timer if true

// Time-based control variables
float timeStartUTC = 0;
float timeEndUTC = 0;
bool timeControlActive = false;

String logBuffer = "";        // Stores logs in memory
const int maxLogSize = 5000;  // Maximum log size before trimming

// MQTT broker config (POC: no auth, cert verification skipped)
const char* mqttBroker = "s420l.club";
const int   mqttPort   = 8883;

WiFiClientSecure mqttSecureClient;
PubSubClient     mqttClient(mqttSecureClient);

String mqttClientId;
String mqttTopicPrefix;      // "plantapp/device/{mac}"
String mqttTopicCmdAll;      // "plantapp/device/{mac}/cmd/#"
String mqttTopicWillOnline;  // "plantapp/device/{mac}/status/online"

unsigned long lastMqttReconnectAttempt = 0;
const unsigned long mqttReconnectInterval = 5000;

// Helper for EEPROM offsets
#define EEPROM_SIZE 512
#define TIME_START_ADDR  0   // float, 4 bytes
#define TIME_END_ADDR    4   // float, 4 bytes
#define BRIGHTNESS_ADDR  8   // int, 4 bytes
#define BOOT_COUNT_ADDR  12  // uint16_t, 2 bytes — increments every boot,
                             // appended to captive-portal SSID so iOS
                             // sees a fresh network each provisioning cycle
#define SPECTRUM_ADDR    14  // uint8_t, 1 byte — 1 = full spectrum, 0 = reduced

void logMessage(String message) {
  // Print to Serial Monitor
  Serial.println(message);

  // Append to log buffer
  logBuffer += message + "\n";

  // Trim log buffer if it exceeds maximum size
  if (logBuffer.length() > maxLogSize) {
    int excess = logBuffer.length() - maxLogSize;
    logBuffer = logBuffer.substring(excess);
  }
}

// Apply a brightness percentage (0-100) to the IRLZ44N gate via PWM.
// IRLZ44N is N-channel: HIGH gate = ON, so 100% = full brightness.
// If persist is true, the value is saved to EEPROM.
void applyBrightness(int percent, bool persist) {
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;
  brightnessPercent = percent;

  // Map 0-100 to 0..DIMMER_MAX_DUTY
  uint32_t duty = (uint32_t)((long)percent * DIMMER_MAX_DUTY / 100);
  ledcWrite(DIMMER_PIN, duty);

  if (persist) {
    EEPROM.put(BRIGHTNESS_ADDR, brightnessPercent);
    EEPROM.commit();
  }

  logMessage("Brightness set to " + String(percent) + "% (duty " + String(duty) + "/" + String(DIMMER_MAX_DUTY) + ")" + (persist ? " [saved]" : ""));
}

// Apply full spectrum on/off via GPIO 22 -> IRLZ44N gate -> white wires.
// HIGH gate = MOSFET on = whites grounded = full spectrum.
// LOW gate = MOSFET off = whites floating = reduced spectrum.
void applyFullSpectrum(bool on, bool persist) {
  fullSpectrum = on;
  digitalWrite(SPECTRUM_PIN, on ? HIGH : LOW);

  if (persist) {
    uint8_t v = on ? 1 : 0;
    EEPROM.put(SPECTRUM_ADDR, v);
    EEPROM.commit();
  }

  logMessage("Full spectrum set to " + String(on ? "ON" : "OFF") + (persist ? " [saved]" : ""));
}

// ---------- Registry ----------

void registerWithRegistry() {
  WiFiClientSecure client;
  client.setInsecure();  // POC: skip cert verification
  HTTPClient http;
  if (!http.begin(client, registryRegisterUrl)) {
    logMessage("Registry register: http.begin failed");
    return;
  }
  http.addHeader("Content-Type", "application/json");
  String body = "{\"mac\":\"" + deviceMac + "\"}";
  int code = http.POST(body);
  if (code > 0) {
    logMessage("Registry register response " + String(code) + ": " + http.getString());
  } else {
    logMessage("Registry register failed: " + http.errorToString(code));
  }
  http.end();
}

// ---------- /Registry ----------

// ---------- MQTT ----------

void mqttPublishStatus(const String& key, const String& value) {
  if (!mqttClient.connected()) return;
  String topic = mqttTopicPrefix + "/status/" + key;
  mqttClient.publish(topic.c_str(), value.c_str(), true);  // retained
}

void mqttPublishCurrentState() {
  mqttPublishStatus("online", "true");
  int pinState = digitalRead(CONTROL_PIN);
  mqttPublishStatus("led", pinState == LOW ? "on" : "off");
  mqttPublishStatus("brightness", String(brightnessPercent));
  mqttPublishStatus("fullspectrum", fullSpectrum ? "true" : "false");
}

void mqttOnMessage(char* topic, byte* payload, unsigned int length) {
  String topicStr(topic);
  String p; for (unsigned int i = 0; i < length; i++) p += (char)payload[i];
  logMessage("MQTT recv " + topicStr + " = " + p);

  int cmdIdx = topicStr.indexOf("/cmd/");
  if (cmdIdx < 0) return;
  String action = topicStr.substring(cmdIdx + 5);

  if (action == "led") {
    manualOverride = true;
    timeOnMillis = 0; timeOffMillis = 0;
    if (p == "on")       { digitalWrite(CONTROL_PIN, LOW);  isOn = true;  }
    else if (p == "off") { digitalWrite(CONTROL_PIN, HIGH); isOn = false; }
    mqttPublishStatus("led", isOn ? "on" : "off");
    logMessage("GPIO 19 set via MQTT to " + String(isOn ? "ON" : "OFF"));
  }
  else if (action == "brightness") {
    if (p.length() == 0) return;
    int level = p.toInt();
    if (level >= 0 && level <= 100) {
      applyBrightness(level, true);
      mqttPublishStatus("brightness", String(brightnessPercent));
    }
  }
  else if (action == "brightness/reset") {
    applyBrightness(100, true);
    mqttPublishStatus("brightness", "100");
  }
  else if (action == "fullspectrum") {
    // Accept "true"/"false", "on"/"off", "1"/"0"
    String pl = p; pl.toLowerCase();
    bool on;
    if (pl == "true" || pl == "on" || pl == "1") on = true;
    else if (pl == "false" || pl == "off" || pl == "0") on = false;
    else return;
    applyFullSpectrum(on, true);
    mqttPublishStatus("fullspectrum", fullSpectrum ? "true" : "false");
  }
  else if (action == "timer") {
    // Payload "<on_hrs>:<off_hrs>" e.g. "18:6"
    int colon = p.indexOf(':');
    if (colon > 0) {
      timeOnMillis  = (unsigned long)(p.substring(0, colon).toFloat() * 3600000);
      timeOffMillis = (unsigned long)(p.substring(colon + 1).toFloat() * 3600000);
      manualOverride = false;
      timeControlActive = false;
      lastToggleTime = millis();
      isOn = false;
      digitalWrite(CONTROL_PIN, LOW);  // matches existing HTTP /timer handler behavior
      logMessage("Timer set via MQTT: ON=" + String(timeOnMillis/60000) + "m OFF=" + String(timeOffMillis/60000) + "m");
    }
  }
  else if (action == "timerange") {
    // Payload "<start_est>:<end_est>" e.g. "4:22"
    int colon = p.indexOf(':');
    if (colon > 0) {
      timeStartUTC = fmod(p.substring(0, colon).toFloat() + 5.0, 24.0);
      timeEndUTC   = fmod(p.substring(colon + 1).toFloat() + 5.0, 24.0);
      timeControlActive = true;
      timeOnMillis = 0; timeOffMillis = 0;
      manualOverride = false;
      EEPROM.put(TIME_START_ADDR, timeStartUTC);
      EEPROM.put(TIME_END_ADDR, timeEndUTC);
      EEPROM.commit();
      logMessage("Time range set via MQTT: " + String(timeStartUTC) + " to " + String(timeEndUTC));
    }
  }
  else if (action == "timerange/reset") {
    timeStartUTC = 0; timeEndUTC = 0;
    timeControlActive = false;
    EEPROM.put(TIME_START_ADDR, timeStartUTC);
    EEPROM.put(TIME_END_ADDR, timeEndUTC);
    EEPROM.commit();
    digitalWrite(CONTROL_PIN, HIGH);
    isOn = false;
    mqttPublishStatus("led", "off");
    logMessage("Time range reset via MQTT");
  }
  else if (action == "wifi_reset") {
    logMessage("WiFi creds reset via MQTT — rebooting into captive portal");
    mqttPublishStatus("online", "false");
    delay(200);
    WiFiManager wm;
    wm.resetSettings();
    WiFi.disconnect(true, true);  // wifioff + eraseap — clears system-level WiFi config too
    delay(500);
    ESP.restart();
  }
  else if (action == "manual_release") {
    manualOverride = false;
    timeControlActive = (timeStartUTC != 0 || timeEndUTC != 0);
    if (timeControlActive) {
      struct tm ti;
      if (getLocalTime(&ti)) {
        float currentHour = ti.tm_hour + ti.tm_min / 60.0 + ti.tm_sec / 3600.0;
        bool on = (timeStartUTC < timeEndUTC && currentHour >= timeStartUTC && currentHour < timeEndUTC)
               || (timeStartUTC > timeEndUTC && !(currentHour >= timeEndUTC && currentHour < timeStartUTC));
        digitalWrite(CONTROL_PIN, on ? LOW : HIGH);
        isOn = on;
      }
    }
    mqttPublishStatus("led", isOn ? "on" : "off");
    logMessage("Manual override released via MQTT");
  }
}

bool mqttConnect() {
  logMessage("MQTT connecting to " + String(mqttBroker) + ":" + String(mqttPort));
  bool ok = mqttClient.connect(
    mqttClientId.c_str(),
    nullptr, nullptr,                  // no auth (POC)
    mqttTopicWillOnline.c_str(),       // LWT topic
    1, true, "false"                   // LWT: retained "false" on ungraceful drop
  );
  if (ok) {
    logMessage("MQTT connected");
    mqttClient.subscribe(mqttTopicCmdAll.c_str());
    logMessage("MQTT subscribed to " + mqttTopicCmdAll);
    mqttPublishCurrentState();
  } else {
    logMessage("MQTT connect failed, state=" + String(mqttClient.state()));
  }
  return ok;
}

void mqttSetup() {
  mqttTopicPrefix     = "plantapp/device/" + deviceMac;
  mqttTopicCmdAll     = mqttTopicPrefix + "/cmd/#";
  mqttTopicWillOnline = mqttTopicPrefix + "/status/online";
  mqttClientId        = "esp32-" + deviceMac;

  mqttSecureClient.setInsecure();    // POC: skip cert verification
  mqttClient.setServer(mqttBroker, mqttPort);
  mqttClient.setCallback(mqttOnMessage);
  mqttClient.setBufferSize(1024);

  logMessage("MQTT setup; topic prefix=" + mqttTopicPrefix);
}

void mqttLoop() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastMqttReconnectAttempt >= mqttReconnectInterval) {
      lastMqttReconnectAttempt = now;
      mqttConnect();
    }
  } else {
    mqttClient.loop();
  }
}

// ---------- /MQTT ----------

void setup() {
  // Initialize Serial Monitor
  Serial.begin(115200);

  // Initialize EEPROM for persistent storage
  EEPROM.begin(EEPROM_SIZE);
  EEPROM.get(TIME_START_ADDR, timeStartUTC);
  EEPROM.get(TIME_END_ADDR, timeEndUTC);

  // Restore time control state
  timeControlActive = (timeStartUTC != 0 || timeEndUTC != 0); // Enable only if a valid range exists
  logMessage("Restored time range: " + String(timeStartUTC) + " to " + String(timeEndUTC));

  // Restore brightness from EEPROM, with fallback to 100 if uninitialized/invalid
  int storedBrightness = 100;
  EEPROM.get(BRIGHTNESS_ADDR, storedBrightness);
  if (storedBrightness < 0 || storedBrightness > 100) {
    storedBrightness = 100; // Fresh EEPROM reads as 0xFF... -> garbage -> default to 100
    logMessage("EEPROM brightness invalid, defaulting to 100%");
  } else {
    logMessage("Restored brightness from EEPROM: " + String(storedBrightness) + "%");
  }

  // Restore full spectrum state from EEPROM. Fresh EEPROM reads as 0xFF
  // which is neither 0 nor 1, so we treat anything but 0 as "on" (default).
  uint8_t storedSpectrum = 1;
  EEPROM.get(SPECTRUM_ADDR, storedSpectrum);
  bool initialSpectrum = (storedSpectrum != 0);  // 0 = off; anything else (incl. 0xFF) = on
  logMessage("Restored full spectrum from EEPROM: " + String(initialSpectrum ? "ON" : "OFF"));

  // Set CONTROL_PIN as output
  pinMode(CONTROL_PIN, OUTPUT);
  digitalWrite(CONTROL_PIN, HIGH); // Start with pin OFF (Active LOW)
  logMessage("Initial state: GPIO 19 OFF");

  // Set up LEDC PWM for dimmer on GPIO 21 (ESP32 core 3.x API)
  ledcAttach(DIMMER_PIN, DIMMER_FREQ, DIMMER_RES_BITS);
  applyBrightness(storedBrightness, false); // Apply restored value without re-saving
  logMessage("Dimmer initialized on GPIO 21");

  // Set up SPECTRUM_PIN as a digital output and apply restored state.
  pinMode(SPECTRUM_PIN, OUTPUT);
  applyFullSpectrum(initialSpectrum, false);  // Apply restored value without re-saving
  logMessage("Full spectrum control initialized on GPIO " + String(SPECTRUM_PIN));

  // Bump the boot counter — appended to the captive-portal SSID so iOS
  // treats every reset cycle as a brand-new network and (re-)triggers
  // captive portal detection instead of relying on stale per-SSID memory.
  uint16_t bootCount = 0;
  EEPROM.get(BOOT_COUNT_ADDR, bootCount);
  if (bootCount > 60000) bootCount = 0;  // fresh EEPROM reads 0xFFFF
  bootCount++;
  EEPROM.put(BOOT_COUNT_ADDR, bootCount);
  EEPROM.commit();
  logMessage("Boot count: " + String(bootCount));

  // Bring up WiFi via captive portal if no creds saved (WiFiManager).
  // Phone connects to "PlantLight-<MAC>-<bootCount>" SoftAP, captive
  // portal pops the setup form, user picks SSID + password, saved to NVS.
  {
    WiFiManager wm;
    wm.setConfigPortalTimeout(180);  // 3 min, then reboot and try again
    String apName = "PlantLight-" + WiFi.macAddress();
    apName.replace(":", "");
    apName += "-" + String(bootCount);
    bool ok = wm.autoConnect(apName.c_str());
    if (!ok) {
      logMessage("WiFi config portal timed out — rebooting");
      ESP.restart();
    }
    WiFi.setAutoReconnect(true);
  }
  logMessage("Connected to WiFi");
  logMessage("IP Address: " + WiFi.localIP().toString());

  // Cache MAC for both registry and MQTT identifiers.
  deviceMac = WiFi.macAddress();
  deviceMac.replace(":", "");

  // Announce presence to the registry so we show up in the unclaimed list.
  registerWithRegistry();

  mqttSetup();

  // Initialize OTA updates
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

  // Initialize time synchronization (NTP)
  configTime(0, 0, "pool.ntp.org");

  // Check and restore pin state based on time range
  if (timeControlActive) {
    struct tm timeInfo;
    if (getLocalTime(&timeInfo)) {
      float currentHour = timeInfo.tm_hour + timeInfo.tm_min / 60.0 + timeInfo.tm_sec / 3600.0;
      if (currentHour >= timeStartUTC && currentHour < timeEndUTC) {
        digitalWrite(CONTROL_PIN, LOW); // Turn ON (Active LOW)
        isOn = true;
        logMessage("GPIO 19 restored to ON based on time range");
      } else {
        digitalWrite(CONTROL_PIN, HIGH); // Turn OFF (Active LOW)
        isOn = false;
        logMessage("GPIO 19 restored to OFF based on time range");
      }
    }
  }
  // Start the server
  server.begin();
  logMessage("Server started");
}

void loop() {
  // handle OTA
  ArduinoOTA.handle();

  mqttLoop();
  
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();  // uses creds saved by WiFiManager in NVS
    logMessage("Reconnecting to WiFi...");
    delay(5000);
    }

  // Handle client requests
  WiFiClient client = server.available();
  if (client) {
    while (!client.available()) delay(1);

    String request = client.readStringUntil('\r');
    client.flush();
    logMessage("Received request: " + request);

    // Timer endpoint
    if (request.indexOf("/timer?time_on=") != -1 && request.indexOf("&time_off=") != -1) {
      timeControlActive = false;
      int timeOnStart = request.indexOf("time_on=") + 8;
      int timeOnEnd = request.indexOf("&", timeOnStart);
      int timeOffStart = request.indexOf("time_off=") + 9;

      String timeOnStr = request.substring(timeOnStart, timeOnEnd);
      String timeOffStr = request.substring(timeOffStart, request.indexOf(" ", timeOffStart));

      timeOnMillis = (unsigned long)(timeOnStr.toFloat() * 3600000);
      timeOffMillis = (unsigned long)(timeOffStr.toFloat() * 3600000);
      manualOverride = false;  // Reset manual override

      lastToggleTime = millis();
      isOn = false; // Start with pin OFF
      digitalWrite(CONTROL_PIN, LOW);

      client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nTimer set.");
      logMessage("Timer updated: ON for " + String(timeOnMillis / 60000) + "m " + String((timeOnMillis % 60000) / 1000) + "s, OFF for " + String(timeOffMillis / 60000) + "m " + String((timeOffMillis % 60000) / 1000) + "s");
    }
    else if (request.indexOf("/pin/status") != -1) {
        // Read the actual pin state
        int pinState = digitalRead(CONTROL_PIN); 
        String pinStateStr = (pinState == LOW) ? "LOW (ON)" : "HIGH (OFF)";

        // Build and send HTTP response
        client.print("HTTP/1.1 200 OK\r\n");          // HTTP status code
        client.print("Content-Type: text/plain\r\n"); // Content type
        client.print("Access-Control-Allow-Origin: *\r\n"); // Allow all origins
        client.print("Connection: close\r\n\r\n");   // Ensure connection closes
        client.print("Pin " + String(CONTROL_PIN) + " State: " + pinStateStr);
        
        logMessage("Served pin status (direct read): " + pinStateStr);
        client.stop(); // Ensure the client connection is properly closed
      }
    // Brightness endpoint: /brightness?level=N  (N = 0..100)
    else if (request.indexOf("/brightness?level=") != -1) {
      int levelStart = request.indexOf("level=") + 6;
      int levelEnd = request.indexOf(" ", levelStart);
      if (levelEnd == -1) levelEnd = request.length();
      String levelStr = request.substring(levelStart, levelEnd);
      // Strip any trailing & params if present
      int amp = levelStr.indexOf('&');
      if (amp != -1) levelStr = levelStr.substring(0, amp);

      int level = levelStr.toInt();
      if (level < 0 || level > 100 || levelStr.length() == 0) {
        client.print("HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\n\r\nBrightness must be an integer 0-100.");
        logMessage("Rejected brightness request: '" + levelStr + "'");
      } else {
        applyBrightness(level, true); // persist to EEPROM
        client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nAccess-Control-Allow-Origin: *\r\n\r\nBrightness set to " + String(level) + "%");
        mqttPublishStatus("brightness", String(brightnessPercent));
      }
    }
    // Brightness status endpoint
    else if (request.indexOf("/brightness/status") != -1) {
      client.print("HTTP/1.1 200 OK\r\n");
      client.print("Content-Type: text/plain\r\n");
      client.print("Access-Control-Allow-Origin: *\r\n");
      client.print("Connection: close\r\n\r\n");
      client.print("Brightness: " + String(brightnessPercent) + "%");
      logMessage("Served brightness status: " + String(brightnessPercent) + "%");
    }
    // Reset brightness to 100% and save to EEPROM
    else if (request.indexOf("/brightness/reset") != -1) {
      applyBrightness(100, true);
      client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nAccess-Control-Allow-Origin: *\r\n\r\nBrightness reset to 100%.");
      logMessage("Brightness reset to 100%");
      mqttPublishStatus("brightness", "100");
    }
    // Full spectrum endpoint: /fullspectrum/?true or /fullspectrum/?false
    // Also accepts on/off, 1/0 for convenience.
    else if (request.indexOf("/fullspectrum/?") != -1 || request.indexOf("/fullspectrum?") != -1) {
      int qIdx = request.indexOf("/fullspectrum/?");
      int valStart;
      if (qIdx != -1) {
        valStart = qIdx + 15;  // length of "/fullspectrum/?"
      } else {
        qIdx = request.indexOf("/fullspectrum?");
        valStart = qIdx + 14;  // length of "/fullspectrum?"
      }
      int valEnd = request.indexOf(" ", valStart);
      if (valEnd == -1) valEnd = request.length();
      String valStr = request.substring(valStart, valEnd);
      int amp = valStr.indexOf('&');
      if (amp != -1) valStr = valStr.substring(0, amp);
      valStr.toLowerCase();

      bool valid = true;
      bool on;
      if (valStr == "true" || valStr == "on" || valStr == "1") on = true;
      else if (valStr == "false" || valStr == "off" || valStr == "0") on = false;
      else valid = false;

      if (!valid) {
        client.print("HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\n\r\nFull spectrum value must be true/false (or on/off, 1/0).");
        logMessage("Rejected fullspectrum request: '" + valStr + "'");
      } else {
        applyFullSpectrum(on, true);
        client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nAccess-Control-Allow-Origin: *\r\n\r\nFull spectrum set to " + String(on ? "true" : "false"));
        mqttPublishStatus("fullspectrum", fullSpectrum ? "true" : "false");
      }
    }
    // Full spectrum status endpoint
    else if (request.indexOf("/fullspectrum/status") != -1) {
      client.print("HTTP/1.1 200 OK\r\n");
      client.print("Content-Type: text/plain\r\n");
      client.print("Access-Control-Allow-Origin: *\r\n");
      client.print("Connection: close\r\n\r\n");
      client.print("Full spectrum: " + String(fullSpectrum ? "true" : "false"));
      logMessage("Served full spectrum status: " + String(fullSpectrum ? "true" : "false"));
    }
    // Manual ON/OFF endpoints
    else if (request.indexOf("/led/on") != -1) {
      manualOverride = true;
      timeOnMillis = 0;
      timeOffMillis = 0;
      digitalWrite(CONTROL_PIN, LOW); // Turn ON (Active LOW)
      client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nGPIO 19 is ON");
      logMessage("GPIO 19 manually turned ON");
      mqttPublishStatus("led", "on");
    } else if (request.indexOf("/led/off") != -1) {
      manualOverride = true;
      timeOnMillis = 0;
      timeOffMillis = 0;
      digitalWrite(CONTROL_PIN, HIGH); // Turn OFF (Active LOW)
      client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nGPIO 19 is OFF");
      logMessage("GPIO 19 manually turned OFF");
      mqttPublishStatus("led", "off");
    }
    // Time range endpoint
    else if (request.indexOf("/timerange?start=") != -1 && request.indexOf("&end=") != -1) {
      int startIdx = request.indexOf("start=") + 6;
      int endIdx = request.indexOf("&end=");
      int endEnd = request.indexOf(" ", endIdx);

      timeStartUTC = fmod(request.substring(startIdx, endIdx).toFloat() + 5.0, 24.0);
      timeEndUTC = fmod(request.substring(endIdx + 5, endEnd).toFloat() + 5.0, 24.0);
      timeControlActive = true; // Enable time range control
      timeOnMillis = 0;         // Disable timer when time range is set
      timeOffMillis = 0;

      // Persist to EEPROM
      EEPROM.put(TIME_START_ADDR, timeStartUTC);
      EEPROM.put(TIME_END_ADDR, timeEndUTC);
      EEPROM.commit();

      client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nTime range set.");
      logMessage("Time range updated: " + String(timeStartUTC) + " to " + String(timeEndUTC));
      manualOverride = false; // take back control of on/off or timer override if previously lost
    }
    // Reset time range
    else if (request.indexOf("/reset_timerange") != -1) {
      timeStartUTC = 0;
      timeEndUTC = 0;
      timeControlActive = false;

      // Clear EEPROM
      EEPROM.put(TIME_START_ADDR, timeStartUTC);
      EEPROM.put(TIME_END_ADDR, timeEndUTC);
      EEPROM.commit();

      digitalWrite(CONTROL_PIN, HIGH); // Ensure pin is OFF
      isOn = false;

      client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nTime range reset.");
      logMessage("Time range reset to default");
    } else if (request.indexOf("/manual/release") != -1) {
      manualOverride = false; // Disable manual override
      timeControlActive = (timeStartUTC != 0 || timeEndUTC != 0); // Enable only if a valid range exists
      // Check and restore pin state based on time range
      if (timeControlActive) {
        struct tm timeInfo;
        if (getLocalTime(&timeInfo)) {
          float currentHour = timeInfo.tm_hour + timeInfo.tm_min / 60.0 + timeInfo.tm_sec / 3600.0;
          if ((timeStartUTC<timeEndUTC && (currentHour >= timeStartUTC && currentHour < timeEndUTC)) || (timeStartUTC>timeEndUTC && !(currentHour>=timeEndUTC && currentHour<timeStartUTC))) {
            digitalWrite(CONTROL_PIN, LOW); // Turn ON (Active LOW)
            isOn = true;
            logMessage("GPIO 19 restored to ON based on time range");
          } else {
            digitalWrite(CONTROL_PIN, HIGH); // Turn OFF (Active LOW)
            isOn = false;
            logMessage("GPIO 19 restored to OFF based on time range");
          }
        }
      }
      client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nManual override released.");
      logMessage("Manual override released. Time control re-enabled.");
      mqttPublishStatus("led", isOn ? "on" : "off");
    }
      else if (request.indexOf("/logs") != -1) {
        client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n");
        client.print(logBuffer);  // Serve log buffer content
        client.stop();
        logMessage("Logs served to client.");
}     else if (request.indexOf("/wifi/reset") != -1) {
      client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nWiFi creds cleared. Rebooting into captive portal...");
      logMessage("WiFi creds reset via HTTP");
      client.stop();
      WiFiManager wm;
      wm.resetSettings();
      WiFi.disconnect(true, true);
      delay(500);
      ESP.restart();
} else {
      client.print("HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\nNot Found");
      logMessage("Invalid request received.");
    }
    client.stop();
  }

  // Timer logic (only if time range is not active)
  if (!manualOverride && !timeControlActive && (timeOnMillis > 0 || timeOffMillis > 0)) {
    unsigned long currentTime = millis();
    if (!isOn && currentTime - lastToggleTime >= timeOffMillis) {
      digitalWrite(CONTROL_PIN, LOW); // Turn ON (Active LOW)
      isOn = true;
      lastToggleTime = currentTime;
      logMessage("GPIO 19 turned ON by timer");
    } else if (isOn && currentTime - lastToggleTime >= timeOnMillis) {
      digitalWrite(CONTROL_PIN, HIGH); // Turn OFF (Active LOW)
      isOn = false;
      lastToggleTime = currentTime;
      logMessage("GPIO 19 turned OFF by timer");
    }
  }

  // Time-based control logic
  if (timeControlActive && !manualOverride) {
    struct tm timeInfo;
    if (getLocalTime(&timeInfo)) {
      float currentHour = timeInfo.tm_hour + timeInfo.tm_min / 60.0 + timeInfo.tm_sec / 3600.0;
      bool shouldBeOn = (timeStartUTC<timeEndUTC && (currentHour >= timeStartUTC && currentHour < timeEndUTC)) || (timeStartUTC>timeEndUTC && !(currentHour>=timeEndUTC && currentHour<timeStartUTC));

      // Only change the pin state if it's different from the desired state
      if (shouldBeOn && !isOn) {
        digitalWrite(CONTROL_PIN, LOW); // Turn ON (Active LOW)
        isOn = true;
        logMessage("GPIO 19 turned ON by time range");
      } else if (!shouldBeOn && isOn) {
        digitalWrite(CONTROL_PIN, HIGH); // Turn OFF (Active LOW)
        isOn = false;
        logMessage("GPIO 19 turned OFF by time range");
      }
    }
  }
}