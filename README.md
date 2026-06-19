# Meu Portfólio Site

Repositório central para todos os meus projetos pessoais. Site estático com cards de projetos, downloads, pesquisa e filtros.

## 🚀 Stack

- **Frontend:** HTML + CSS + JavaScript (Vanilla JS)
- **Hospedagem:** Vercel
- **CI/CD:** GitHub Actions → Vercel
- **Dados:** Ficheiros JSON

## 📁 Estrutura

```
meu-portfolio-site/
├── public/downloads/      # Ficheiros para download (APK, PDF, etc.)
├── public/images/projects/# Screenshots dos projetos
├── src/
│   ├── data/projects.json # Base de dados dos projetos
│   ├── styles/main.css    # Estilos
│   └── js/                # JavaScript modular
├── index.html             # SPA - página principal
└── vercel.json            # Configuração de deploy
```

## 🛠️ Desenvolvimento Local

```bash
# Opção 1: Live Server (recomendado)
npm run dev

# Opção 2: HTTP Server
npm start
```

Depois abre [http://localhost:3000](http://localhost:3000).

## 📦 Adicionar Projetos

Edita `src/data/projects.json` com a estrutura:

```json
{
  "id": "meu-projeto",
  "title": "Meu Projeto",
  "category": "app|web|file|other",
  "tags": ["tag1", "tag2"],
  "downloads": [
    { "label": "APK", "url": "/downloads/apps/ficheiro.apk", "size": "4.2 MB" }
  ]
}
```

## ☕ Apoiar

Se gostaste de algum projeto, considera apoiar:
[https://buymeacoffee.com/oseulink](https://buymeacoffee.com/oseulink)

## 📄 Licença

MIT