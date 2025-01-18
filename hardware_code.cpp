#include <WiFi.h>
#include <EEPROM.h>
#include <time.h>
#include <ArduinoOTA.h>

// Replace with your network credentials
const char* ssid = "hahahahackers";
const char* password = "trololololhackers";

// Define GPIO pin to control 144 = 16, 108=19, 150=19, 196=19, 185=19, 186=19
#define CONTROL_PIN 19

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

// Helper for EEPROM offsets
#define EEPROM_SIZE 512
#define TIME_START_ADDR 0
#define TIME_END_ADDR 4

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

  // Set CONTROL_PIN as output
  pinMode(CONTROL_PIN, OUTPUT);
  digitalWrite(CONTROL_PIN, HIGH); // Start with pin OFF (Active LOW)
  logMessage("Initial state: GPIO 19 OFF");

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    logMessage("Connecting to WiFi...");
  }
  logMessage("Connected to WiFi");
  logMessage("IP Address: " + WiFi.localIP().toString());

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
  
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    logMessage("Reconnecting to WiFi...");
    delay(5000); // Adjust delay as needed
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
        client.print("Pin 16 State: " + pinStateStr); // Send the actual state
        
        logMessage("Served pin status (direct read): " + pinStateStr);
        client.stop(); // Ensure the client connection is properly closed
      }
    // Manual ON/OFF endpoints
    else if (request.indexOf("/led/on") != -1) {
      manualOverride = true;
      timeOnMillis = 0;
      timeOffMillis = 0;
      digitalWrite(CONTROL_PIN, LOW); // Turn ON (Active LOW)
      client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nGPIO 19 is ON");
      logMessage("GPIO 19 manually turned ON");
    } else if (request.indexOf("/led/off") != -1) {
      manualOverride = true;
      timeOnMillis = 0;
      timeOffMillis = 0;
      digitalWrite(CONTROL_PIN, HIGH); // Turn OFF (Active LOW)
      client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\nGPIO 19 is OFF");
      logMessage("GPIO 19 manually turned OFF");
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
    } 
      else if (request.indexOf("/logs") != -1) {
        client.print("HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\n\r\n");
        client.print(logBuffer);  // Serve log buffer content
        client.stop();
        logMessage("Logs served to client.");
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