# Contributing to AI Automation Hackathon

Thank you for participating in the AI Automation Hackathon! This guide will help you understand how to contribute your project.

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/AI-Automation-Hackathon.git
cd AI-Automation-Hackathon
```

### 2. Create Your Project Directory

```bash
# Create a directory for your team's project
mkdir -p projects/your-team-name
cd projects/your-team-name
```

### 3. Set Up Your Project

Use the example project as a template or create your own structure. Make sure to include:

- `README.md` - Project documentation
- Source code files
- `requirements.txt` or `package.json` - Dependencies
- `.env.example` - Environment variable template
- Tests (optional but recommended)

## 📋 Project Requirements

### Directory Structure

Your project must be in a subdirectory under `projects/`:

```
projects/
└── your-team-name/
    ├── README.md
    ├── src/
    ├── tests/
    ├── requirements.txt
    └── .env.example
```

### README Requirements

Your project README.md must include:

1. **Project Description**: What does it do?
2. **Team Information**: Team name and members
3. **Installation Instructions**: How to set it up
4. **Usage Instructions**: How to run it
5. **Technology Stack**: Languages, frameworks, APIs used
6. **Demo**: Screenshots, videos, or live demo link

## 🔄 Submission Process

### 1. Create a Feature Branch

```bash
git checkout -b submission/your-team-name
```

### 2. Add Your Project

```bash
# Add your project files
git add projects/your-team-name/

# Commit with a clear message
git commit -m "Add [Team Name] project: [Project Title]"
```

### 3. Push to Your Fork

```bash
git push origin submission/your-team-name
```

### 4. Create a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the pull request template
5. Add the `submission` label
6. Submit the PR

## ✅ Before Submitting

### Checklist

- [ ] Code is in `projects/[your-team-name]` directory
- [ ] README.md with complete documentation
- [ ] All dependencies documented
- [ ] No sensitive data (API keys, passwords) in code
- [ ] `.env.example` instead of `.env`
- [ ] Code follows the code of conduct
- [ ] Proper attribution for third-party code
- [ ] Project works as described

### Common Issues to Avoid

1. **Don't commit sensitive data**
   - Use `.env` files for secrets (and add to `.gitignore`)
   - Provide `.env.example` with placeholder values

2. **Don't include large files**
   - Use `.gitignore` for models, datasets, node_modules
   - Provide instructions to download large files separately

3. **Don't modify the main README**
   - Your project should have its own README
   - Don't edit files outside your project directory

4. **Don't use pre-existing projects**
   - All code must be original work from the hackathon period
   - You can use libraries/APIs but not complete existing projects

## 🎨 Code Style

While we don't enforce strict style guidelines, we recommend:

- **Python**: Follow PEP 8
- **JavaScript**: Use ESLint with standard config
- **Comments**: Add comments for complex logic
- **Naming**: Use clear, descriptive names

## 🧪 Testing

While not mandatory, testing is encouraged:

```bash
# Python
python -m pytest tests/

# JavaScript
npm test
```

## 📞 Getting Help

If you need help:

1. Check the [README](README.md) for resources
2. Open an issue with the `question` label
3. Ask in the community discussion channels

## 🏆 After Submission

After submitting your PR:

1. Wait for review from organizers
2. Address any feedback or questions
3. Your project will be judged according to the criteria in the README

## 📝 Updates to Your Submission

If you need to update your submission:

```bash
# Make your changes
git add .
git commit -m "Update: [description]"
git push origin submission/your-team-name
```

The pull request will automatically update.

## ⚖️ License

By submitting your project, you agree that:

- Your project is your original work
- You retain copyright to your code
- You grant permission for the hackathon to showcase your work
- You've properly attributed any third-party code or resources

## 🙏 Thank You

Thank you for participating! We can't wait to see what you build!

---

Questions? Open an issue with the `question` label.
