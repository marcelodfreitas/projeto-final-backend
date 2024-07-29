const express = require("express");
const cors = require("cors")
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const app = express();
//const { v4: uuidv4 } = require('uuid');

const port = 3000;

app.use(cors())
//uuidv4();



app.use(bodyParser.json());

const users = [];
const messages = []
const isEmailRegistered = (email) => users.some((user) => user.email === email);
const getUserByEmail = (email) => users.find((user) => user.email === email);

// Criar um novo usuário
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

    return response.status(201).json({
      message: `Bem-Vindo ${name}! Pessoa usuária registrada com sucesso.`,
      user: newUser,
    });
  });
});
// Entrar em uma conta existente
app.post("/login", async (request, response) => {
  const { email, password } = request.body;

  const user = users.find(user => user.email === email)
  
  if (!user) {
    return response.status(404).json({message: "Usuário não encontrado.",});
  }

  const passwordMatch = await bcrypt.compare(password, user.password)

  if (!passwordMatch) {
    return response.status(404).json({ message: "Credenciais Invalidas." });
  }
  
  return response.status(200).json({
      message: `Seja bem-vindo ${user.name}!`,
      user: user.email
    });
  });


// Endpoint para enviar uma nova mensagem
app.post("/message", (request, response) => {
  const { email, title, description } = request.body;

  if (!email) {
    return response.status(400).json({ message: "Insira um e-mail válido." });
  }
  if (!title) {
    return response
      .status(400)
      .json({
        message: "Por favor, verifique se passou o título da mensagem.",
      });
  }
  if (!description) {
    return response
      .status(400)
      .json({
        message: "Por favor, verifique se passou a descrição da mensagem.",
      });
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

  // Criação da nova mensagem com ID gerado automaticamente
  const newMessage = {
    id: messages.length + 1,
    title,
    description,
    userId: user.id, // Relaciona a mensagem ao usuário
  };


  messages.push(newMessage);

  return response
    .status(201)
    .json({
      message: `Mensagem criada com sucesso!`,
      messageData: newMessage
    });
});
// Endpoint para listar as mensagens
app.get("/message/:email", (request, response) => {
  const { email } = request.params;

  if (!isEmailRegistered(email)) {
    return response
      .status(404)
      .json({
        message:
          "Email não encontrado no sistema, verifique ou crie uma conta.",
      });
  }

  const userMessages = messages.filter((message) => {
    const user = getUserByEmail(email);
    return message.userId === user.id;
  });

  return response
    .status(200)
    .json({
      message: `Seja bem-vindo! Aqui estão as suas mensagens:`,
      messages: userMessages,
    });
});
// Endpoint para atualizar as mensagens
app.put("/message/:id", (request, response) => {
  const { id } = request.params;
  const { title, description } = request.body;

  const message = messages.find((msg) => msg.id == parseInt(id));

  if (!message) {
    return response
      .status(404)
      .json({ message: "Por favor, informe um id válido da mensagem" });
  }
  if (!title) {
    return response
      .status(400)
      .json({
        message: "Por favor, verifique se passou o título da mensagem.",
      });
  }
  if (!description) {
    return response
      .status(400)
      .json({
        message: "Por favor, verifique se passou a descrição da mensagem.",
      });
  }

  message.title = title;
  message.description = description;

  return response
    .status(200)
    .json({
      message: "Mensagem atualizada com sucesso!",
      updatedMessage: message,
    });
});
// Endpoint para deletar as mensagens
app.delete("/message/:id", (request, response) => {
  const { id } = request.params;

  const messageIndex = messages.findIndex((msg) => msg.id === parseInt(id));

  if (messageIndex === -1) {
    return response
      .status(404)
      .json({
        message:
          "Mensagem não encontrada, verifique o identificador em nosso banco",
      });
  }

  messages.splice(messageIndex, 1);

  return response
    .status(200)
    .json({ message: "Mensagem apagada com sucesso!" });
});

app.get("/details/:id", (request, response) => {
  const { id } = request.params

  const note = messages.find(message => message.id == id)

  if (!note) {
    return response.status(404).json({
      message: "Recado não encontrado."
    })
  }

  response.status(200).json(note)
})






// Endpoint inicial
app.get("/", (request, response) => {
  return response.status(200).json({ message: "Bem-vindo à aplicação" });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Olá... Servidor rodando em http://localhost:${port}`);
});
