# Windows Quick Start

1. Extract the ZIP.
2. Open the extracted folder in VS Code.
3. Open terminal in VS Code.
4. Confirm you see `package.json`:

```powershell
dir
```

5. Install dependencies:

```powershell
npm install
```

6. Start the app:

```powershell
npm run dev
```

7. Open:

```text
http://localhost:5173
```

If npm fails because of registry/network issues:

```powershell
npm config set registry https://registry.npmjs.org/
npm cache clean --force
npm install
```
