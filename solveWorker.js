var wordDatabase;
var cells;
var foundWords;
var progress;
var countTopLevelCellsComplete;
var iterations;

onmessage = function(e) {
    console.log("worker received msg: " + e);
    switch (e.data[0]) {
        case "init": {
            let wordList = e.data[1];
            initWordDatabase(wordList);
        } break;
        case "solve": {
            progress = 0;
            cells = e.data[1];
            cells.flat().forEach(c => {
                if (c.value.length != 1 && c.value.length != 2) {
                    throw "Cell value is invalid";
                }
                c.used = false
            });
            foundWords = [];
            countTopLevelCellsComplete = 0;
            
            iterations = 0;
            postMessage(["progress", 0]);
            cells.flat().forEach(cell => {
                marchCells([], cell);
                countTopLevelCellsComplete++;
            });
            console.log(iterations + " iterations");
            foundWords.sort();
            postMessage(["result", foundWords]);
        }
    }
}

function normalizeWord(word) {
    return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace("ç", "c");
}

function initWordDatabase(wordList) {
    const minLen = 3;
    const maxLen = 17; // because of "Qu"
    wordDatabase = []
    wordList.forEach(word => {
        if (word.length >= minLen &&
            word.length <= maxLen &&
            !word.includes("-") &&
            !word.includes(" ")) {
            wordDatabase.push({
                "word": word, 
                "normalized": normalizeWord(word)
            });
        }
    });
    wordDatabase.sort((a, b) => a.normalized.localeCompare(b.normalized));
}

function findWordInList(word, list) {
    for (i in list) {
        if (list[i] == word) {
            return true;
        }
    }
    return false;
}

function marchCells(path, cell) {
    path.push(cell);
    cell.used = true;
    iterations++;
    let cont = false;
    {
        let word = ""
        path.forEach(c => word += c.value.toLowerCase());
        wordDatabase.forEach(w => {
            if (w.normalized.startsWith(word)) {
                cont = true;
                if (w.normalized == word) {
                    let cellIdPath = [];
                    path.forEach(cell => {
                        cellIdPath.push(cell.id);
                    })
                    postMessage({type:"found", word:w.word, cellIdPath:cellIdPath});
                    if (!findWordInList(w.word, foundWords)) {
                        foundWords.push(w.word);
                    }
                }
                return;
            }
        });
    }
    if (cont) {
        for (i in cell.neighbours) {
            let c = cell.neighbours[i];
            if (c.used) continue;
            marchCells(path, c);
        }
    }
    cell.used = false;
    path.pop();
}