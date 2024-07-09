const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const app = express();
const port = 3000;

// Middleware para analisar o corpo da solicitação como JSON
app.use(bodyParser.json());

// Array que guarda os novos usuários
const users = [];
// Array que guarda as novas mensagens
const messages = [];

// Função que verifica se um email já está cadastrado no array de usuários
const isEmailRegistered = (email) => users.some((user) => user.email === email);

// Função que obtém o usuário pelo email
const getUserByEmail = (email) => users.find((user) => user.email === email);

// Endpoint que cria os usuários
app.post("/signup", (request, response) => {
  const { name, email, password } = request.body;

  if (!name) {
    return response
      .status(400)
      .json({ message: "Por favor, verifique se passou o nome." });
  }
  if (!email) {
    return response
      .status(400)
      .json({ message: "Por favor, verifique se passou o email." });
  }
  if (isEmailRegistered(email)) {
    return response
      .status(400)
      .json({ message: "Email já cadastrado, insira outro." });
  }
  if (!password) {
    return response
      .status(400)
      .json({ message: "Por favor, verifique se passou a senha." });
  }

  // Hash da senha
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return response
        .status(500)
        .json({ message: "Erro ao processar a senha." });
    }

    // Criação do novo usuário com ID gerado automaticamente
    const newUser = {
      id: users.length + 1, 
      name,
      email,
      password: hashedPassword,
    };

    users.push(newUser);

    return response
      .status(201)
      .json({
        message: `Bem-Vindo ${name}! Pessoa usuária registrada com sucesso.`,
        user: newUser,
      });
  });
});

// Endpoint para login de usuários
app.post("/login", (request, response) => {
  const { email, password } = request.body;

  if (!email) {
    return response.status(400).json({ message: "Insira um e-mail válido." });
  }
  if (!password) {
    return response.status(400).json({ message: "Insira uma senha válida." });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return response
      .status(404)
      .json({
        message:
          "Email não encontrado no sistema, verifique ou crie uma conta.",
      });
  }

  bcrypt.compare(password, user.password, (err, isMatch) => {
    if (err) {
      return response
        .status(500)
        .json({ message: "Erro ao verificar a senha." });
    }
    if (!isMatch) {
      return response.status(400).json({ message: "Senha incorreta." });
    }

    return response
      .status(200)
      .json({
        message: `Seja bem-vindo ${user.name}! Pessoa usuária logada com sucesso!`,
      });
  });
});

// Endpoint para criar uma mensagem
app.post('/message', (request, response) => {
    const { email, title, description } = request.body;

    if (!email) {
        return response.status(400).json({ message: 'Insira um e-mail válido.' });
    }
    if (!title) {
        return response.status(400).json({ message: 'Por favor, verifique se passou o título da mensagem.' });
    }
    if (!description) {
        return response.status(400).json({ message: 'Por favor, verifique se passou a descrição da mensagem.' });
    }

    const user = getUserByEmail(email);
    if (!user) {
        return response.status(404).json({ message: 'Email não encontrado no sistema, verifique ou crie uma conta.' });
    }

    // Criação da nova mensagem com ID gerado automaticamente
    const newMessage = {
        id: messages.length + 1, 
        title,
        description,
        userId: user.id, // Relaciona a mensagem ao usuário
    };

    messages.push(newMessage);

    return response.status(201).json({ message: `Mensagem criada com sucesso!`, messageData: newMessage.description });
});

// Endpoint para listar as mensagens
app.get('/message/:email', (request, response) => {
    const { email } = request.params;

    if (!isEmailRegistered(email)) {
        return response.status(404).json({ message: 'Email não encontrado no sistema, verifique ou crie uma conta.' });
    }

    const userMessages = messages.filter(message => {
        const user = getUserByEmail(email);
        return message.userId === user.id;
    });

    return response.status(200).json({ message: `Seja bem-vindo! Aqui estão as suas mensagens:`, messages: userMessages});
});

// Endpoint para atualizar as mensagens
app.put('/message/:id', (request, response) => {
    const { id } = request.params;
    const { title, description } = request.body;

    const message = messages.find(msg => msg.id === parseInt(id));

    if (!message) {
        return response.status(404).json({ message: 'Por favor, informe um id válido da mensagem' });
    }
    if (!title) {
        return response.status(400).json({ message: 'Por favor, verifique se passou o título da mensagem.' });
    }
    if (!description) {
        return response.status(400).json({ message: 'Por favor, verifique se passou a descrição da mensagem.' });
    }

    message.title = title;
    message.description = description;

    return response.status(200).json({ message: 'Mensagem atualizada com sucesso!', updatedMessage: message });
});

// Endpoint para deletar as mensagens
app.delete('/message/:id', (request, response) => {
    const { id } = request.params;

    const messageIndex = messages.findIndex(msg => msg.id === parseInt(id));

    if (messageIndex === -1) {
        return response.status(404).json({ message: 'Mensagem não encontrada, verifique o identificador em nosso banco' });
    }

    messages.splice(messageIndex, 1);

    return response.status(200).json({ message: 'Mensagem apagada com sucesso!' });
});

// Endpoint inicial
app.get("/", (request, response) => {
  return response.status(200).json({ message: "Bem-vindo à aplicação" });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
