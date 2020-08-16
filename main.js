
var results = [];

function normalizeWord(word) {
    return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace("ç", "c");
}

var solveWorker = new Worker("solveWorker.js");
solveWorker.onmessage = e => {
    console.log("worker sent msg: " + e);
    if (e.data.type == "found") {
        blinkCellIdPath(e.data.cellIdPath);
        if (!results.some(r => r.word == e.data.word)) {
            results.push({word: e.data.word, normed:normalizeWord(e.data.word)});
            buildResultsList();
        }
    }
    // if (e.data[0] == "result") {
    //     let foundWords = e.data[1];
    //     let resultList = document.getElementById("resultList");
    //     foundWords.forEach(w => {
    //         let li = document.createElement("li");
    //         resultList.appendChild(li);
    //         li.innerHTML = w;
    //     });
    // }
};

function buildResultsList() {
    let resultList = document.getElementById("resultList");
    results.sort((a, b) => a.normed.localeCompare(b.normed));
    resultList.innerHTML = "";
    results.forEach(r => {
        let li = document.createElement("li");
        resultList.appendChild(li);
        li.innerHTML = r.word;
    });
}

// solveWorker.onerror = e => {
//     console.error(e.message, e.filename, e.lineno);
// };
solveWorker.postMessage(["init", wordList]);

const dice = [
        ["N", "Z", "D", "V", "E", "A"],
        ["F", "E", "H", "S", "E", "I"],
        ["A", "B", "O", "J", "Qu", "M"],
        ["S", "P", "T", "L", "E", "U"],
        ["M", "C", "D", "P", "A", "E"],
        ["K", "E", "T", "N", "O", "U"],
        ["R", "U", "E", "I", "L", "W"],
        ["E", "H", "I", "S", "N", "R"],
        ["S", "R", "C", "L", "A", "E"],
        ["I", "X", "O", "A", "R", "F"],
        ["I", "O", "S", "A", "R", "M"],
        ["G", "E", "N", "I", "T", "V"],
        ["L", "P", "B", "R", "I", "A"],
        ["Y", "E", "G", "U", "N", "L"],
        ["T", "A", "E", "I", "A", "O"],
        ["O", "S", "E", "T", "N", "D"]
    ]

function randomise() {
    let diceSet = dice.slice();

    document.getElementsByName("boggleCell").forEach(e => {
        // pick die
        index = Math.floor(Math.random() * diceSet.length);
        die = diceSet[index];
        diceSet.splice(index, 1);
        //throw die
        e.value = die[Math.floor(Math.random() * die.length)];

        // rotate
        e.style.transform = "rotate(" + (Math.floor(Math.random() * 4) * 90) + "deg)";
        
        
        switch(e.value) {
            case "M":
            case "W":
            case "N":
            case "Z":
                e.style.textDecoration = "underline";
                break;
            
            default:
                e.style.textDecoration = "";
                break;
        }
    })

    startTimer();
}

function getData() {
    data = Array(16)
    // grab data
    for (y = 0; y < 4; y++) {
        for (x = 0; x < 4; x++) {
            data[y][x] = document.getElementById()
        }
    }
}

function build() {
    let t = document.getElementById("boggleTable");
    for (y = 0; y < 4; y++) {
        let tr = document.createElement("tr");
        t.appendChild(tr)
        for (x = 0; x < 4; x++) {
            let td = document.createElement("td");
            tr.appendChild(td);
            let txt = document.createElement("input");
            txt.id = "boggleCell_" + y.toString() + x.toString();
            txt.name =  "boggleCell";
            txt.classList.add("boggleCell");
            
            td.appendChild(txt);
            txt.onfocus = (e) => {
                e.srcElement.select();
            };
            txt.addEventListener("input", (e) => {
                let cell = e.srcElement;
                cell.value = cell.value.toUpperCase().slice(0, 1);
                // find value in dice
                let found = dice.flat().some(d => {
                    if (d.startsWith(cell.value)) {
                        cell.value = d;
                        return true;
                    }
                })
                if (found) {
                    // focus next
                    let isNext = false;
                    document.getElementsByName(cell.name).forEach(elem => {
                        if (cell === elem) isNext = true;
                        else if (isNext) {
                            elem.focus();
                            isNext = false;
                        }
                    });
                }
                else {
                    cell.value = "";
                }
                
            });
            //txt.value = y + "_" + x;
        }
    }
}

var blinkCellTimout = null;

function clearCellBlink() {
    document.getElementsByName("boggleCell").forEach(cell => {
        cell.style.backgroundColor = "white";
        cell.style.color = "black";
    });
    blinkCellTimout = null;
}

function blinkCellIdPath(cellIdPath) {
    if (blinkCellTimout) {
        window.clearTimeout(blinkCellTimout);
    }
    clearCellBlink();
    cellIdPath.forEach((cellId, i) => {
        cell = document.getElementById(cellId)
        let val = Math.min(200, 250 - 160 + i * 20);
        cell.style.backgroundColor = "rgb("+val+","+val+","+val+")";
    });
    blinkCellTimout = window.setTimeout(clearCellBlink, 100);
}

function log(obj) {
    let consoleText = document.getElementById("console");
    consoleText.value += obj.toString() + "\n";
}

function solve() {
    results = [];
    document.getElementById("resultList").innerHTML = "";

    let grid = Array(4);
    let cells = Array(4);
    for (y = 0; y < 4; y++) {
        grid[y] = Array(4);
        cells[y] = Array(4);
        for (x = 0; x < 4; x++) {
            let elem = document.getElementById("boggleCell_" + y.toString() + x.toString());
            grid[y][x] = elem.value;
            cells[y][x] = {
                value: elem.value,
                x: x,
                y: y,
                id: elem.id
            }
        }
    }

    for (y = 0; y < 4; y++) {
        for (x = 0; x < 4; x++) {
            let c = cells[y][x];
            c["neighbours"] = []
            if (c.x > 0) c.neighbours.push(cells[y][x-1])
            if (c.x < 3) c.neighbours.push(cells[y][x+1])
            if (c.y > 0) c.neighbours.push(cells[y-1][x])
            if (c.y < 3) c.neighbours.push(cells[y+1][x])
            if (c.x > 0 && c.y > 0) c.neighbours.push(cells[y-1][x-1])
            if (c.x > 0 && c.y < 3) c.neighbours.push(cells[y+1][x-1])
            if (c.x < 3 && c.y > 0) c.neighbours.push(cells[y-1][x+1])
            if (c.x < 3 && c.y < 3) c.neighbours.push(cells[y+1][x+1])
        }
    }

    

    // let sovleCell = function (x, y)
    // let grid = [["I", "F", "K", "Z"], ["N", "J", "I", "F"], ["A", "A", "E", "S"], ["O", "G", "E", "P"]];
    console.log(cells)

    solveWorker.postMessage(["solve", cells]);
    
}

var timeout = 0;
var timer;

function startTimer() {
    let timerText = document.getElementById("timerText");
    let timerProgress = document.getElementById("timerProgress");
    let startTimeMs = window.performance.now();
    let maxTimeMs = 90 * 1000;
    if (timer != null) window.clearInterval(timer);
    timerProgress.value = 0;
    timerProgress.innerHTML = 0;
    timer = window.setInterval(() => {
        let ellapsedTimeMs = window.performance.now() - startTimeMs;
        // timerText.innerHTML = ellapsedTimeMs / 1000;
        timerProgress.value = ellapsedTimeMs / 1000;
        timerProgress.innerHTML = Math.round(ellapsedTimeMs / 1000);
        if (ellapsedTimeMs >= maxTimeMs) {
            // timerText.innerHTML = "STOP";
            window.clearInterval(timer);
            timer = null;
        }
    }, 100)
}

function clear() {
    document.location.reload();
    // document.getElementsByName("boggleCell").forEach(e => e.value = "");
    // document.getElementById("console").value = "";
}