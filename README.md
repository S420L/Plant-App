# Plant Stand Project v5
Decided to make this public to showcase my full stack engineering abilities. Sorry about the commit messages...continue reading to see a description of the project and its motivation, app demo, and steps to create your own version.

---
# Background
I've been experimenting with growing plants in enclosed structures since 2015. The main motivation has always been to be able to grow more plants in apartments with poor sunlight, however, I am also interested in using these systems for research purposes. No vertical farming company has ever been able to grow enough produce to offset the cost of power, however, if one was to be able to solve this problem they might quickly achieve industry dominance due to the potential to grow infinitely more plants per square foot vertically. I also believe food can't ever be grown in space without major advances towards solving this problem. My latest experiments attempt to solve it through aggressive companion planting to increase space efficiency. For example; potatoes, peas, and thyme seem to grow well together as the peas provide shade and nitrogen for the potatoes, and the thyme helps aerate the roots.

Past version of the stand had features this one doesn't (yet) have; like advanced ventilation systems and automated watering through hydroponics. I decided to scrap the hydroponics for now, as it makes it harder to companion plant and isn't ideal for long lived plants like trees.

The focus of this stand is to have an app on my phone giving me fine grained control over the lights from anywhere in the world. Oh...and also to be way bigger and more powerful (specs: 15 cubic feet, 400 watts).

## App Features
- Progressive Web App that can be installed on any device
- Infinite scroll displaying all your grow lights
- On/off control for each individual light
- Time range setting for each individual light (military time input, settings persist after restart)
- Time cycle setting for each individual light (input in hours, settings are lost on restart)
- Ability to set all of the above for all lights at once
- Viewing mode toggle for stand (you specify weaker lights to be viewing lights as to not blind yourself)
- Lights are colored red for OFF and green for ON (it directly reads data from microcontroller GPIO pins so you can be sure the state is accurate)
- Ability to wirelessly update grow light circuits (as long as you don't change your network login settings...)

## Demo

<table>
  <tr>
    <td align="center">
    <strong>Basic interface</strong><br>
    <img src="./assets/basicdemogif.gif" height="420">
    </td>
    <td align="center">
    <strong>Live demo</strong><br>
    <img src="./assets/irldemo.gif" height="420">
    </td>
    <td align="center">
    <strong>Circuits</strong><br>
    <img src="./assets/circuitdemo.gif" height="420">
    </td>
  </tr>
</table>

The JavaScript code in this repo is for an app to control the stand. C++ code is what I used to program ESP32 microcontrollers attached to each individual grow light. Python code is a stripped down version of what I have running on my server, I don't wanna make that code public and get ☠️hacked☠️. The C++, Python, and Docker code does not integrate directly with the React code and are separate pieces of the project I included for context.

---

## Requirements

You will need several things to recreate this project, much of which can't be included in this repo either for logistical reasons or security concerns.

- Grow lights
- Capability to make circuits
    - ESP32 microcontrollers (I would suggest getting a basic dev board with build in USB connection, because it can be pretty tricky to make these yourself)
    - Relays (to control flow of power to the lights)
    - LM2596 buck converters (used to step down input power to 5v for microcontrollers so you don't need 2 power adapters for each light)
    - soldering gun and solder wire
    - hot glue gun (so you don't electrocute yourself--or alternativly a 3D printer)
    - multimeter (needed to calibrate the buck converters, if you don't do it accurately you will fry the chips for sure)
- Computer with Arduino IDE installed (as well as ESP32 board manager and libraries)
- On-prem proxy server to interface between external API requests and local IP addresses of microcontrollers (cloud solutions will not work!!!)
- API running on the proxy server (I'm using Django REST Framework)
- Server to host React app (can be cloud or on-prem)

### Setup

1) Upload C++ code to ESP32 chips (add your own network name and password to code)
2) Assemble circuits for grow lights
3) Connect circuits to grow lights (wiring will differ based on the type of lights you have--I have 4 different kinds, some with up to 15 individual connections)
4) Test API manually using local IP addresses assigned to microcontrollers (you can find the IP it was assigned in Arduino app)
5) Create on-prem server (I used Nginx running on Ubuntu server in VirtualBox running on a Windows 10 computer)
6) Set up a public facing API on your on-prem server (you will also need to go into your router settings and set up some port forwarding rules, and register a domain name)
7) Clone React code (this repo), change my server URLs to reference your own, grow light IP addresses to match your own, and test
8) Once it all works you can set up a server to host the React app (I used a clone of the Ubuntu/VirtualBox/Nginx and Docker)


### Final notes
- If your grow lights have power adapters greater than like 30v, or are directly connected to an outlet via a 3 pronged power cord, I would recommend running the circuit off a separate 5v power supply (2 cords for 1 light). The heat created by trying to step down this voltage will cause problems.

- 💀💀💀 DO NOT TRY TO 💀💀💀 HACK 💀💀💀 MY SERVER OR MAKE 👻👻👻 API REQUESTS 👻👻👻 TO MY SERVER, I WILL BE VERY UPSET!!! 💀💀💀