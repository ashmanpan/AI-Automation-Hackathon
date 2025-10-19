#!/bin/bash

echo "🔗 AWS Amplify - GitHub CLI Connection Script"
echo "=============================================="
echo ""

# Step 1: Instructions to create GitHub token
echo "📝 Step 1: Create GitHub Personal Access Token"
echo ""
echo "1. Open this URL in your browser:"
echo "   https://github.com/settings/tokens/new?scopes=repo,admin:repo_hook&description=AWS-Amplify-Deployment"
echo ""
echo "2. GitHub will ask you to:"
echo "   - Confirm your password"
echo "   - Set token description: 'AWS Amplify Deployment'"
echo "   - Scopes are pre-selected: repo, admin:repo_hook ✓"
echo ""
echo "3. Click 'Generate token' at the bottom"
echo ""
echo "4. COPY the token (starts with 'ghp_...')"
echo "   ⚠️  You won't be able to see it again!"
echo ""

# Step 2: Prompt for token
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -sp "Paste your GitHub token here (it will be hidden): " GITHUB_TOKEN
echo ""
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: No token provided"
    exit 1
fi

# Step 3: Connect to AWS Amplify
echo "🚀 Connecting GitHub repository to AWS Amplify..."
echo ""

export AWS_PROFILE=new-sept2025-runon

# Update app with GitHub repository and token
aws amplify update-app \
  --app-id d1bik9cnv8higc \
  --repository "https://github.com/ashmanpan/AI-Automation-Hackathon" \
  --access-token "$GITHUB_TOKEN" \
  --region us-east-1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ GitHub repository connected successfully!"
    echo ""

    # Trigger first deployment
    echo "🚀 Starting initial deployment..."
    aws amplify start-job \
      --app-id d1bik9cnv8higc \
      --branch-name main \
      --job-type RELEASE \
      --region us-east-1

    if [ $? -eq 0 ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎉 Deployment started!"
        echo ""
        echo "📊 Monitor progress:"
        echo "   https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d1bik9cnv8higc"
        echo ""
        echo "🌐 Your app will be live at:"
        echo "   https://main.d1bik9cnv8higc.amplifyapp.com"
        echo ""
        echo "⏱️  Build time: ~5-10 minutes"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    else
        echo ""
        echo "⚠️  Repository connected, but deployment didn't start automatically."
        echo "   Start it manually from: https://us-east-1.console.aws.amazon.com/amplify/home?region=us-east-1#/d1bik9cnv8higc"
    fi
else
    echo ""
    echo "❌ Failed to connect repository"
    echo "   Check your GitHub token and try again"
    exit 1
fi
