**CONTRIBUTING.md**

```markdown
# Contributing to Zuum

Thank you for considering contributing to Zuum! We welcome contributions that enhance the platform and foster a vibrant community.

## Getting Started

1. **Fork the Repository**: Create a personal copy of the project by clicking the "Fork" button.
2. **Clone the Fork**: Clone your fork to your local machine.
   ```bash
   git clone https://github.com/your-username/zuum.git
   ```
3. **Set Upstream Remote**: Link your local repository to the original project.
   ```bash
   git remote add upstream https://github.com/Myles181/Zuum-backend.git
   ```

## Branch Naming Convention

To maintain consistency, please adhere to the following branch naming pattern:

```
feat/<your_initials>_<feature_name>
```

*Example:*
```
feat/jd_audio_player
```

## Making Changes

1. **Create a New Branch**: Based on the `main` branch, create a new branch for your feature or fix.
   ```bash
   git checkout -b feat/your_initials_feature_name main
   ```
2. **Implement Changes**: Develop your feature or fix, ensuring you:
   - Write clear, concise, and well-documented code.
   - Document all functions created.
   - Include tests (screenshots) for new features or bug fixes.
3. **Commit Changes**: Commit your changes with descriptive messages.
   ```bash
   git pull origin main
   git add .
   git commit -m "Add feature: description of feature"
   ```

## Pull Request Guidelines

Before submitting a pull request (PR):

1. **Sync with Upstream**: Ensure your branch is up-to-date with the main repository.
   ```bash
   git fetch upstream
   git merge upstream/main
   ```
2. **Push to Your Fork**: Push your changes to your forked repository.
   ```bash
   git push origin feat/your_initials_feature_name
   ```
3. **Create Pull Request**: Navigate to the original repository and click "New Pull Request". Ensure you:
   - **Tag a Reviewer**: Use `@username` to request a specific team member's review.
   - **Add Labels**: Assign appropriate labels (e.g., `enhancement`, `bug`, `documentation`).
   - **Provide a Descriptive Title and Description**: Clearly outline the purpose and details of the PR.

![image](https://github.com/user-attachments/assets/8683c23c-764c-4501-a89b-4ea3dd477cec)

