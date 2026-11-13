# Contribuindo com o Arkada

Obrigado pelo interesse em contribuir com o **Arkada**! Este projeto é open-source e toda melhoria de código, acessibilidade, design flat ou novas dicas de saúde bucal é bem-vinda.

## Como Contribuir

1. Faça um **Fork** deste repositório.
2. Clone o seu fork localmente:
   ```bash
   git clone https://github.com/<seu-usuario>/arkada.git
   cd arkada
   npm install
   ```
3. Crie uma branch para sua feature ou correção:
   ```bash
   git checkout -b feat/minha-melhoria
   ```
4. Certifique-se de que o build TypeScript + Vite passa sem erros:
   ```bash
   npm run build
   ```
5. Siga as diretrizes visuais do projeto:
   - **Flat Design estrito:** Sem sombras (`shadow-none`) e sem gradientes complexos.
   - **Light Mode:** Contraste limpo usando a paleta `slate`, `teal`, `sky` e `amber`.
   - **Acessibilidade:** Utilize elementos HTML semânticos (`<dialog>`, `<input type="range">`, `<input type="checkbox" switch>`, `<fieldset>`/`<legend>`) e mantenha áreas de toque mínimas de `44px`/`48px`.
6. Faça o commit das suas alterações e envie um **Pull Request**.
