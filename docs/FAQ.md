# Frequently Asked Questions (FAQ)

## General Questions

### Q: Who can participate in this hackathon?
**A:** The hackathon is open to everyone! Whether you're a student, professional, hobbyist, or just curious about AI automation, you're welcome to participate. Teams can have up to 4 members.

### Q: Do I need to be an expert in AI to participate?
**A:** No! We welcome participants of all skill levels. You can use existing AI APIs and services (like OpenAI, Google Cloud AI, etc.) without needing deep ML expertise.

### Q: Is there a registration process?
**A:** Check with the event organizers for registration details. Generally, you can start by forking this repository and working on your project.

### Q: What if I don't have a team?
**A:** You can participate individually or use hackathon communication channels to find teammates.

## Technical Questions

### Q: What programming languages can I use?
**A:** You can use any programming language you're comfortable with. Popular choices include Python, JavaScript/Node.js, Java, and Go.

### Q: Can I use existing libraries and APIs?
**A:** Yes! Using existing libraries, frameworks, and APIs is encouraged. Examples include:
- OpenAI API, Google Cloud AI, Azure AI
- Hugging Face transformers
- TensorFlow, PyTorch
- Automation frameworks like Selenium, Puppeteer

### Q: Can I use code from my previous projects?
**A:** Your hackathon submission should be primarily new work created during the hackathon period. You can use your own reusable utilities/libraries, but the main project logic should be fresh.

### Q: Do I need to deploy my project?
**A:** Deployment is not required but can enhance your submission. If you do deploy, include the URL in your README.

### Q: What if I use paid APIs?
**A:** You're responsible for any costs associated with APIs you use. Many services offer free tiers or trial credits that should be sufficient for hackathon projects.

## Project Questions

### Q: What counts as "AI Automation"?
**A:** AI Automation includes:
- Using AI/ML to automate tasks (e.g., automated email responses using GPT)
- Intelligent process automation (e.g., smart document processing)
- Automated decision-making systems
- AI-powered workflow optimization
- Creative automation using generative AI

### Q: How detailed should my documentation be?
**A:** Your README should enable someone to:
1. Understand what your project does
2. Install and run it
3. See a demo or example output
4. Understand the technology used

### Q: Can I work on multiple projects?
**A:** We recommend focusing on one project, but check with organizers for specific rules.

### Q: What if my project isn't finished?
**A:** Submit what you have! Partial projects are acceptable. Make sure to document what works and what's planned.

## Submission Questions

### Q: How do I submit my project?
**A:** Follow the steps in [CONTRIBUTING.md](../CONTRIBUTING.md):
1. Create your project in `projects/your-team-name/`
2. Create a pull request
3. Fill out the PR template
4. Add the `submission` label

### Q: Can I update my submission after the deadline?
**A:** Check with organizers about late updates. Generally, minor fixes are allowed, but major changes after the deadline may not be accepted.

### Q: What happens after I submit?
**A:** Organizers will review submissions, and judges will evaluate based on the criteria outlined in the README.

### Q: When will winners be announced?
**A:** Check with event organizers for the judging timeline and announcement schedule.

## Environment Setup Questions

### Q: How do I set up Python environment?
**A:**
```bash
# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Q: How do I manage API keys safely?
**A:**
1. Use `.env` files for secrets (never commit these)
2. Add `.env` to `.gitignore`
3. Provide `.env.example` with placeholder values
4. Document required environment variables

Example `.env` file:
```
OPENAI_API_KEY=your-key-here
```

### Q: How do I handle large model files?
**A:** Don't commit large files to the repository. Instead:
- Provide download instructions in your README
- Use Git LFS if necessary (for files < 100MB)
- Host large files externally (Google Drive, S3, etc.)

## Troubleshooting

### Q: My pull request is blocked. What should I do?
**A:** Common issues:
- Make sure you're not modifying files outside your project directory
- Check that you haven't committed sensitive data
- Ensure your branch is up to date with main

### Q: I'm getting merge conflicts. How do I fix them?
**A:**
```bash
# Update your fork's main branch
git checkout main
git pull upstream main

# Rebase your branch
git checkout your-branch
git rebase main

# Resolve conflicts, then
git push origin your-branch --force-with-lease
```

### Q: What if I can't run the example project?
**A:** The example project is a template and may not run without modifications. It's meant to show structure, not be a complete application.

## Judging Questions

### Q: How will projects be judged?
**A:** Based on the criteria in the README:
- Innovation (30%)
- Technical Implementation (25%)
- Impact (25%)
- Presentation (20%)

### Q: Do I need to present my project?
**A:** Typically, a demo video or clear documentation is sufficient, but check with organizers for presentation requirements.

### Q: Can I get feedback on my project before submission?
**A:** Open an issue with the `question` label to ask for feedback, but note that organizers may have limited time to respond.

## Getting Help

### Q: Where can I ask questions not covered here?
**A:** 
1. Check the [README](../README.md) for resources
2. Open an issue with the `question` label
3. Check event communication channels (Discord, Slack, etc.)

### Q: I found a bug in the hackathon repository. How do I report it?
**A:** Open an issue describing the bug, steps to reproduce, and expected vs actual behavior.

---

**Still have questions?** Open an issue with the `question` label and we'll help you out!
