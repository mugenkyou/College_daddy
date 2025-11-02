# College Daddy

College Daddy is a comprehensive academic tool designed to simplify student life. It provides essential calculators, study resources, and productivity tools to help students efficiently manage their academics. Originally developed during the end-semester exams, this project was created to address common student challenges like note-sharing, internal marks calculation, and study organization.

## Why the Name Change?
The original name, "College Buddy," was not available as a domain, so we rebranded to "College Daddy" to maintain a unique identity while keeping the essence of an all in one academic companion.

## Features
- **CGPA Calculator**: Quickly estimate your CGPA based on your grades. If you enter your current SGPA and desired CGPA, the calculator will tell you how much SGPA is needed in each semester to reach your goal. It also suggests how many companies you may be eligible for during placements based on your CGPA.
- **Internal Marks Calculator**: Predict your intearnal marks and assess your academic standing. It also helps determine if you are eligible for the end-semester exam and calculates how many marks you need in the final exam to achieve your desired grade.
- **Notes Repository**: Access all 8 semesters of engineering notes in one place.
- **Pomodoro Study Timer**: Boost productivity with a built-in study timer designed for effective learning. It also includes built-in study music to help maintain focus.
- **Roadmaps & Career Guidance**: Get structured learning roadmaps for various career paths, including AI, Full Stack Development, and Cybersecurity. Each roadmap includes recommended learning resources and skill-building steps.
- **Aptitude Preparation**: Direct access to aptitude test preparation resources via IndiaBix, offering practice questions in quantitative, logical, and verbal reasoning, along with interview preparation materials.

## How You Can Contribute
If you're interested in contributing, here are some ways to help improve College Daddy:

### Feature Enhancements
- **Enhance UI/UX**: Improve the user experience by making navigation smoother and adding better visuals.
- **Expand the Notes Section**: Upload more semester-wise notes or create subject-specific summaries.
- **Optimize Performance**: Improve loading speeds and backend efficiency.
- **Add More Career Roadmaps**: Include roadmaps for additional domains like Data Science, DevOps, or Blockchain.
- **Chatbot for PDFs**: Build a chatbot that interacts with PDFs and generates questions based on the content.
- **Code Typing Speed Test**: Create a code typing speed test with analytics to track improvement over time.

## Why College Daddy?
Many students struggle with organizing and sharing notes, and traditional methods like Google Drive can be cumbersome. To solve this, College Daddy provides a structured platform for accessing and managing study materials. Additionally, students often find it difficult to calculate their internal marks, leading to uncertainty about their final grades. This tool integrates multiple solutions into one convenient platform, making it an all-in-one academic assistant.

## Demo
Experience College Daddy live: [College Daddy Demo](https://collegedaddy.vercel.app/index.html)

## Installation
To use College Daddy locally, follow these steps:
1. Clone the repository:
   ```bash
   git clone https://github.com/mugenkyou/college_daddy.git
   ```
2. Navigate to the project directory:
   ```bash
   cd college_daddy
   ```
3. Open the `index.html` file in your browser.

## Quick Start

### 1. Install Python Dependencies

```bash
# Install required packages
pip install flask flask-cors werkzeug

# Or if you prefer using requirements.txt
pip install -r requirements.txt
```

### 2. Run the Dashboard

```bash
# Start the Flask application
python app.py
```

## Project Structure
The project follows a clean, organized directory structure:

```
college_daddy/
├── assets/               # All static assets
│   ├── css/              # CSS stylesheets
│   ├── js/               # JavaScript files
│   │   ├── components/   # Reusable UI components (navigation, etc.)
│   │   └── pages/        # Page-specific scripts
│   │       └── notes/    # Notes-specific functionality
│   └── img/              # Images and graphics
├── data/                 # Data files for applications
├── pages/                # Individual page templates (notes.html, cgpa.html, etc.)
└── index.html            # Homepage
```

### Key Components
- **JavaScript Organization**: Scripts are organized by functionality - reusable components and page-specific logic
- **CSS Structure**: Stylesheets follow a consistent naming convention
- **Data Files**: Application data is stored in dedicated data directory for easy updates
- **Page Templates**: Each feature has its own dedicated HTML page in the pages directory

## Contribution Guidelines
We welcome contributions to enhance College Daddy! To contribute:
1. Fork the repository and create a new branch for your feature or bug fix.
2. Write clear and concise commit messages.
3. Ensure your code follows best practices and is well-documented.
4. Submit a pull request with a detailed description of your changes.

Your contributions help improve College Daddy and support students in their academic journey. Feel free to explore, contribute, and make the most of this platform!

---
*Getting notes from all semesters takes a lot of time, so most of the upcoming commits will be focused on uploading notes from other semesters.*

*Developed with students in mind, for students by students.*

