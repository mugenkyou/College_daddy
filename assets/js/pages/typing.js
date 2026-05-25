const SNIPPETS = {
    Python: {
        Easy: [
            "print('Hello, World!')\nname = input('Name: ')\nprint(f'Hi, {name}')",
            "def add(a, b):\n    return a + b\n\nprint(add(5, 3))"
        ],
        Medium: [
            "def is_prime(n):\n    if n <= 1:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True",
            "class Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        pass"
        ],
        Hard: [
            "import asyncio\n\nasync def fetch_data(url):\n    async with aiohttp.ClientSession() as session:\n        async with session.get(url) as response:\n            return await response.json()\n\nasyncio.run(fetch_data('https://api.example.com'))"
        ]
    },
    JavaScript: {
        Easy: [
            "console.log('Hello, World!');\nconst name = 'Alice';\nconsole.log(`Hi, ${name}`);",
            "function add(a, b) {\n  return a + b;\n}\nconsole.log(add(5, 3));"
        ],
        Medium: [
            "const debounce = (func, delay) => {\n  let timeoutId;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => func(...args), delay);\n  };\n};",
            "fetch('https://api.example.com/data')\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error(error));"
        ],
        Hard: [
            "class PromisePool {\n  constructor(maxConcurrent) {\n    this.maxConcurrent = maxConcurrent;\n    this.active = 0;\n    this.queue = [];\n  }\n\n  async add(task) {\n    if (this.active >= this.maxConcurrent) {\n      await new Promise(resolve => this.queue.push(resolve));\n    }\n    this.active++;\n    try {\n      return await task();\n    } finally {\n      this.active--;\n      if (this.queue.length > 0) {\n        this.queue.shift()();\n      }\n    }\n  }\n}"
        ]
    },
    "C++": {
        Easy: [
            "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello, World!\" << endl;\n    return 0;\n}",
            "int add(int a, int b) {\n    return a + b;\n}"
        ],
        Medium: [
            "#include <vector>\n#include <algorithm>\n\nvoid sortVector(std::vector<int>& v) {\n    std::sort(v.begin(), v.end());\n}",
            "class Rectangle {\nprivate:\n    int width, height;\npublic:\n    Rectangle(int w, int h) : width(w), height(h) {}\n    int getArea() { return width * height; }\n};"
        ],
        Hard: [
            "template <typename T>\nclass Node {\npublic:\n    T data;\n    Node* next;\n    Node(T d) : data(d), next(nullptr) {}\n};\n\ntemplate <typename T>\nvoid reverseList(Node<T>*& head) {\n    Node<T>* prev = nullptr;\n    Node<T>* current = head;\n    Node<T>* next = nullptr;\n    while (current != nullptr) {\n        next = current->next;\n        current->next = prev;\n        prev = current;\n        current = next;\n    }\n    head = prev;\n}"
        ]
    },
    Java: {
        Easy: [
            "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}",
            "public int add(int a, int b) {\n    return a + b;\n}"
        ],
        Medium: [
            "import java.util.List;\nimport java.util.Collections;\n\npublic class Sorter {\n    public void sortList(List<Integer> list) {\n        Collections.sort(list);\n    }\n}",
            "class Animal {\n    String name;\n    Animal(String name) {\n        this.name = name;\n    }\n    void makeSound() {\n        System.out.println(\"Some sound\");\n    }\n}"
        ],
        Hard: [
            "import java.util.concurrent.*;\n\npublic class ThreadPoolExample {\n    public static void main(String[] args) {\n        ExecutorService executor = Executors.newFixedThreadPool(5);\n        for (int i = 0; i < 10; i++) {\n            Runnable worker = new WorkerThread(\"\" + i);\n            executor.execute(worker);\n        }\n        executor.shutdown();\n        while (!executor.isTerminated()) {   }\n        System.out.println(\"Finished all threads\");\n    }\n}"
        ]
    },
    SQL: {
        Easy: [
            "SELECT * FROM users\nWHERE age > 18\nORDER BY created_at DESC;",
            "INSERT INTO employees (name, role)\nVALUES ('Alice', 'Developer');"
        ],
        Medium: [
            "SELECT department, COUNT(*) as emp_count\nFROM employees\nGROUP BY department\nHAVING COUNT(*) > 5;",
            "SELECT u.name, o.order_date\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE o.status = 'completed';"
        ],
        Hard: [
            "WITH RankedSalaries AS (\n    SELECT \n        department_id,\n        salary,\n        DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank\n    FROM employees\n)\nSELECT *\nFROM RankedSalaries\nWHERE rank <= 3;"
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const languageSelect = document.getElementById('languageSelect');
    const difficultySelect = document.getElementById('difficultySelect');
    const startTestBtn = document.getElementById('startTestBtn');
    
    const liveStats = document.getElementById('liveStats');
    const liveWpm = document.getElementById('liveWpm');
    const liveAccuracy = document.getElementById('liveAccuracy');
    const liveTime = document.getElementById('liveTime');
    
    const typingArea = document.getElementById('typingArea');
    const snippetDisplay = document.getElementById('snippetDisplay');
    const hiddenInput = document.getElementById('hiddenInput');
    
    const resultCard = document.getElementById('resultCard');
    const finalWpm = document.getElementById('finalWpm');
    const finalAccuracy = document.getElementById('finalAccuracy');
    const finalTime = document.getElementById('finalTime');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    const nextSnippetBtn = document.getElementById('nextSnippetBtn');
    
    const historyList = document.getElementById('historyList');

    // State
    let currentSnippet = "";
    let startTime = null;
    let timerInterval = null;
    let isTestActive = false;
    let typedText = "";

    // Load History
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('cd_typing')) || [];
        if (history.length === 0) {
            historyList.innerHTML = '<p class="empty-history">No typing history yet. Start a test to record your stats!</p>';
            return;
        }

        historyList.innerHTML = '';
        history.reverse().slice(0, 10).forEach(entry => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = \`
                <div class="history-details">
                    <span class="history-lang">\${entry.language} - \${entry.difficulty}</span>
                    <span class="history-date">\${entry.date}</span>
                </div>
                <div class="history-stats">
                    <div>
                        <div class="stat-label">WPM</div>
                        <div class="history-stat-val">\${entry.wpm}</div>
                    </div>
                    <div>
                        <div class="stat-label">ACC</div>
                        <div class="history-stat-val">\${entry.accuracy}%</div>
                    </div>
                </div>
            \`;
            historyList.appendChild(el);
        });
    }

    function getRandomSnippet(lang, diff) {
        const list = SNIPPETS[lang][diff];
        return list[Math.floor(Math.random() * list.length)];
    }

    function startTest() {
        const lang = languageSelect.value;
        const diff = difficultySelect.value;
        currentSnippet = getRandomSnippet(lang, diff);
        
        typedText = "";
        isTestActive = true;
        startTime = null;
        
        // UI Updates
        resultCard.style.display = 'none';
        liveStats.style.display = 'flex';
        typingArea.style.display = 'block';
        
        liveWpm.textContent = '0';
        liveAccuracy.textContent = '100%';
        liveTime.textContent = '0s';
        
        hiddenInput.value = '';
        renderSnippet();
        hiddenInput.focus();

        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 1000);
    }

    function updateTimer() {
        if (!isTestActive || !startTime) return;
        const elapsed = Math.floor((new Date() - startTime) / 1000);
        liveTime.textContent = elapsed + 's';
        updateStats(elapsed);
    }

    function updateStats(elapsedSec) {
        if (elapsedSec <= 0) return;
        
        // Calculate WPM
        // standard word = 5 characters
        const wordsTyped = typedText.length / 5;
        const minutes = elapsedSec / 60;
        const wpm = Math.round(wordsTyped / minutes);
        
        // Calculate Accuracy
        let correctChars = 0;
        for (let i = 0; i < typedText.length; i++) {
            if (typedText[i] === currentSnippet[i]) {
                correctChars++;
            }
        }
        const accuracy = typedText.length > 0 ? Math.round((correctChars / typedText.length) * 100) : 100;

        liveWpm.textContent = wpm;
        liveAccuracy.textContent = accuracy + '%';
        
        return { wpm, accuracy };
    }

    function renderSnippet() {
        let html = '';
        for (let i = 0; i < currentSnippet.length; i++) {
            let classes = 'char';
            if (i < typedText.length) {
                if (typedText[i] === currentSnippet[i]) {
                    classes += ' correct';
                } else {
                    classes += ' incorrect';
                }
            }
            if (i === typedText.length) {
                classes += ' cursor';
            }
            // replace newline with <br> and space with &nbsp; for display
            let charToDisplay = currentSnippet[i];
            if (charToDisplay === '\\n') {
                charToDisplay = '⏎<br>';
            } else if (charToDisplay === ' ') {
                charToDisplay = '&nbsp;';
            }
            
            html += \`<span class="\${classes}">\${charToDisplay}</span>\`;
        }
        if (typedText.length === currentSnippet.length) {
            html += \`<span class="char cursor">&nbsp;</span>\`;
        }
        snippetDisplay.innerHTML = html;
    }

    function finishTest() {
        isTestActive = false;
        clearInterval(timerInterval);
        
        const elapsed = Math.floor((new Date() - startTime) / 1000);
        const stats = updateStats(elapsed) || { wpm: 0, accuracy: 0 };
        
        liveStats.style.display = 'none';
        typingArea.style.display = 'none';
        resultCard.style.display = 'block';
        
        finalWpm.textContent = stats.wpm;
        finalAccuracy.textContent = stats.accuracy + '%';
        finalTime.textContent = elapsed + 's';

        // Save progress
        const history = JSON.parse(localStorage.getItem('cd_typing')) || [];
        history.push({
            date: new Date().toLocaleString(),
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            language: languageSelect.value,
            difficulty: difficultySelect.value,
            time: elapsed
        });
        localStorage.setItem('cd_typing', JSON.stringify(history));
        
        loadHistory();
    }

    hiddenInput.addEventListener('input', (e) => {
        if (!isTestActive) return;
        if (!startTime) {
            startTime = new Date();
        }
        
        typedText = e.target.value;
        
        // Prevent typing more than snippet length
        if (typedText.length > currentSnippet.length) {
            typedText = typedText.substring(0, currentSnippet.length);
            hiddenInput.value = typedText;
        }
        
        renderSnippet();
        
        if (typedText.length === currentSnippet.length) {
            finishTest();
        }
    });

    typingArea.addEventListener('click', () => {
        if (isTestActive) {
            hiddenInput.focus();
        }
    });

    startTestBtn.addEventListener('click', startTest);
    tryAgainBtn.addEventListener('click', startTest);
    nextSnippetBtn.addEventListener('click', startTest);

    // Initial Load
    loadHistory();
});
