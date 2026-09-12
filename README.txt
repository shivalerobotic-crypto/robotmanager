ROBOT PROGRAMMER MANAGER

Files:
- index.html
- style.css
- app.js
- manifest.json

FEATURES
1. Responsive PC + phone UI
2. Robot database
3. Calibration values
4. Digital / Analog / Fieldbus I/O records
5. Ethernet configuration
6. Separate OLD ROBOT / NEW ROBOT overhang records
7. Drag-and-drop panel diagram
8. Other robot/cell details
9. JSON backup and restore
10. Browser local storage

RUN
Open index.html in a browser.

IMPORTANT
This version stores data locally in the browser. It does not automatically synchronize data between different PCs/phones.

NEXT DEVELOPMENT OPTIONS
- Login/user accounts
- Central MySQL/SQLite database
- Cloud synchronization
- Photo/PDF attachment per robot
- Search/filter
- Robot-specific calibration forms for FANUC/KUKA/ABB/YASKAWA
- Detailed overhang calculation formulas
- Editable panel symbols and wiring
- Excel import/export
- QR code for each robot
- PWA offline installation

LATEST MODULE UPDATE
- Overhang Generator replaced with the Old Fanuc / New Fanuc interface and calculation logic from the supplied index(4).html.
- Old Fanuc uses 0.707 overhang calculation; New Fanuc uses 0.574 / 0.819 calculation.
- Aluminium Panel Diagram replaced with the customer-based stiffener generator from the supplied index(4).html.
- Panel generator supports STDREV_DECK, KALPATARU_DECK, RAGHAVAN, KALPATARU, STDREV, WT and WX.
