# Pull Request — Caixa de Perguntas

## 📌 Summary

Describe clearly what this PR does.

- What was implemented?
- Why was this change needed?
- What problem does it solve?

---

## 🎯 Type of Change

Mark all that apply:

- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation
- [ ] Test improvement
- [ ] Configuration / Infrastructure
- [ ] Security improvement

---

## 🧠 Context

Explain the context of this change:

- What was the previous behavior?
- What is the new behavior?
- Any relevant business rule involved?

---

## 🏗️ Architecture Compliance

Confirm all items below:

- [ ] No business logic added to UI (React components)
- [ ] No business logic added to API route handlers
- [ ] No business logic added to repositories
- [ ] Use cases were used or created when needed
- [ ] Domain rules remain centralized and consistent
- [ ] No direct SQL outside infrastructure layer
- [ ] Dependencies follow hexagonal architecture

---

## 🧪 Tests

- [ ] Unit tests created or updated (domain/use cases)
- [ ] Integration tests created or updated (repositories/API if applicable)
- [ ] Edge cases considered
- [ ] All tests passing locally

Describe what was tested:

---

## 🔐 Security

Confirm all relevant items:

- [ ] Inputs validated server-side
- [ ] Inputs sanitized where necessary
- [ ] No sensitive data exposed in responses
- [ ] Auth rules respected (admin routes protected)
- [ ] No credentials or secrets exposed

---

## 📚 Documentation

- [ ] README.md updated (if applicable)
- [ ] CHANGELOG.md updated
- [ ] New environment variables documented (if any)
- [ ] Azure/deployment implications documented (if any)

---

## ⚙️ Configuration / Environment

- [ ] No hardcoded environment values
- [ ] Config uses environment variables where needed
- [ ] DATABASE_PATH respected and not hardcoded
- [ ] No breaking changes to existing environment unless documented

---

## 🧩 UI / UX (if applicable)

- [ ] UI follows simplicity and clarity principles
- [ ] No unnecessary complexity introduced
- [ ] Responsive behavior preserved
- [ ] User feedback (success/error/loading) handled properly

---

## 🚀 Deployment Impact

- [ ] Safe to deploy without downtime (if applicable)
- [ ] Database changes are backward-compatible or properly handled
- [ ] No impact to Azure App Service single-instance assumptions

---

## 🧾 Checklist

Before requesting review:

- [ ] Code follows copilot-instructions.md
- [ ] No architectural shortcuts were taken
- [ ] No unnecessary complexity introduced
- [ ] Code is readable and maintainable
- [ ] Naming is clear and consistent
- [ ] No debug code or logs left behind

---

## 📝 Additional Notes

Anything else reviewers should know:

---

## 👀 Reviewer Focus

Guide reviewers:

- What should they pay special attention to?
- Any risky area?

---