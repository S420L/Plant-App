This is an app to control growlights through that are physically wired to ESP32 chips and controllable over the internet via REST API. 

There are 3 main views: 
    -homescreen (a list of tiles each representing a growlight and its current on/off state)
    -plantbox (specific page for a growlight allowing individual control)
    -settings/all (a screen to manage all growlights at once)

The plantbox has an on/off switch, cycle, and timerange settings. The settings/all page is a stripped down version of plantbox that sends the same API request to all lights at once.

There is an on/off switch for all lights on the homescreen, a viewing mode toggle (only weaker lights are turned on), and a manual reset button which sets all the lights back to their current timerange settings (lets say lights are programmed to be on 4am-10pm, and its 8pm and a light has been manually turned off--manual reset lets it default back to being on per its timerange settings).

This app was created prior to the existence of claude code, and for now your goal is simply to overhaul the code and modernize the UI without degrading any of the current functionality.