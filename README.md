# Plant Stand Project v5

Welcome prospective employers! This project is purely for my own personal interest and wasn't really designed to share, but I decided to make the repo public to *hopefully* increase my odds of getting an interview.

---

I've been experimenting with growing plants in enclosed structures since 2015--past versions of my stand have been a lot smaller, and had features this stand does not have like ventilation and fully automated hydroponics.

The focus of this stand is to have fine-grained control over the lights, from anywhere in the world. Oh, and also making it way bigger and more powerful (specs: 15 cubic feet, 400 watts).

---

The JavaScript code in this repo is for an app to control the stand (progressive web app downloadable to any device). C++ code is what I used to program ESP32 microcontrollers attached to each individual grow light. Python code is a stripped down version of what I have running on my proxy server. The C++ and Python code does not integrate directly with the React code and are totally separate pieces of the project I included for context. I also included the Dockerfile on my server as a starting point for anyone interested in trying to recreate.

## Features
- On/off control for each light
- Permanent time range setting
- Temporary cycle setting
- All lights on/off toggle
- Viewing mode toggle

## Basic Usage of the App to Control Lights in My Plant Stand

<table>
  <tr>
    <td align="center">
        <strong>Basic interface</strong><br>
        <video autoplay loop muted playsinline height="420">
            <source src="./assets/basicdemo.mp4" type="video/mp4">
            Your browser does not support the video tag.
        </video>
    </td>
    <td align="center">
        <strong>Controlling the plant stand</strong><br>
        <video autoplay loop muted playsinline height="420">
            <source src="./assets/irldemo.mov" type="video/mp4">
            Your browser does not support the video tag.
        </video>
    </td>
    <td align="center">
        <strong>Custom circuits to hack the lights</strong><br>
        <video autoplay loop muted playsinline height="420">
            <source src="./assets/circuits.mov" type="video/mp4">
            Your browser does not support the video tag.
        </video>
    </td>
  </tr>
</table>

---

## Requirements

You will need several things to recreate this project, much of which can't be included in this repo either for logistical reasons or security concerns.

- Grow lights
- Capability to make circuits controlling the lights
    - ESP32 microcontrollers (I would suggest getting a basic dev board with build in USB connection, because it can be pretty tricky to make these yourself)
    - Relays (to control flow of power to the lights)
    - LM2596 buck converters (used to step down power adapter input to 5v for microcontrollers)
    - soldering gun and solder wire
    - hot glue gun
    - multimeter (you actually need this to calibrate the buck converters, if you don't do it accurately you will fry the chips for sure)
- Computer with Arduino IDE installed (as well as ESP32 board manager and libraries)
- On-prem proxy server (to interface between external app API requests and local IP addresses of microcontrollers--cloud solutions will not work)
- API running on proxy server
- Server to host React app (can be cloud or on-prem)

### Setup

1) Upload C++ code to ESP32 chips (add your own network name and password to code)
2) Assemble circuits for grow lights
3) Connect circuits to grow lights (wiring will differ based on the type of lights you have)
4) Test API using local IP addresses assigned to microcontrollers
5) Create on-prem server/API (I used Ubuntu server in VirtualBox running on a Windows 10 computer, and Django REST framework as the API)
6) Clone React code (this repo), change my server URLs to reference your own, and test
7) Once it all works you can set up a server to host the React app (I used a clone of the Ubuntu server/VirtualBox setup, and docker)


### Final notes
- If your grow lights have power adapters greater than like 30v, or are directly connected to an outlet via a 3 pronged power cord, I would recommend running the circuit off a separate 5v power supply (2 cords for 1 light). The heat created by trying to step down this voltage will cause problems.

- 💀💀💀 DONT TRY TO 💀💀💀 HACK 💀💀💀 MY SERVER OR MAKE 👻👻👻 API REQUESTS 👻👻👻 TO MY SERVER, I WILL BE VERY UPSET!!! 💀💀💀