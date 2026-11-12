// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAfojz6wQ3JBk1DA3fre6VNhlV_HIGKIc",
  authDomain: "lanuitmaison.firebaseapp.com",
  projectId: "lanuitmaison",
  storageBucket: "lanuitmaison.firebasestorage.app",
  messagingSenderId: "580321303663",
  appId: "1:580321303663:web:0d9fc732b8dad8a425819a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);# La Nuit Maison

Sistema de gestão criado com Angular e Firebase.

## Configuração do Firebase

1. O projeto e o app Web já estão registrados. A configuração do app está em `src/environments/environment.ts`.
   A configuração Web é incluída no navegador; nunca coloque chaves de conta de serviço ou outros segredos nesse arquivo.
2. Em **Authentication → Sign-in method**, habilite **E-mail/senha**.
3. Em **Authentication → Users**, adicione o usuário que poderá acessar o sistema.
4. Em **Firestore Database**, crie o banco de dados.
5. No terminal PowerShell, execute **um comando por vez**, pressionando `Enter` e aguardando terminar antes do próximo:

   ```bash
   npm install -g firebase-tools
   ```

   Quando a instalação terminar:

   ```bash
   firebase login
   ```

   Conclua o login que abrirá no navegador. Depois, no mesmo terminal:

   ```bash
   firebase use --add
   ```

   Selecione o projeto `lanuitmaison`. Por fim, publique as regras:

   ```bash
   firebase deploy --only firestore:rules
   ```

   As regras em `firestore.rules` permitem acesso apenas a usuários autenticados. Não use regras públicas de leitura/escrita.

O app persiste os dados nas coleções `products`, `sales`, `orders`, `shopeeProducts` e `shopeeSales`. O login é feito pelo Firebase Authentication; não há senha padrão no app.

## Desenvolvimento

```bash
npm install
npm start
```

Abra `http://localhost:4200/`. Para compilar:

```bash
npm run build
```
