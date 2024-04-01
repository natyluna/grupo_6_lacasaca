const fs = require("fs");
const { validationResult } = require("express-validator");
const path = require("path");
const userFilePath = path.join(__dirname, "../data/user.json");
const user = JSON.parse(fs.readFileSync(userFilePath, "utf-8"));
const bcrypt = require("bcryptjs");
const { Usuarios } = require("../database/models");
const db = require("../database/models");

const controlador = {
  login: (req, res) => {
    res.render("users/login");
  },

  register: (req, res) => {
    res.render("users/register");
  },

  guardarUsuario: (req, res) => {
    // Validar los resultados de la validación
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // Si hay errores, renderizar nuevamente la página de registro con los mensajes de error
      return res.render("users/register", { errors: errors.array() });
    }

    // Verificar si se cargó correctamente el archivo
    if (!req.file) {
      console.log("No se ha seleccionado una imagen");
      // Puedes manejar esto según tus necesidades, como redirigir a la página de registro con un mensaje de error.
      return res.render("users/register", {
        errors: [{ msg: "Debes seleccionar una imagen" }],
      });
    }

    // Si no hay errores y se ha cargado un archivo, continuar con la lógica para guardar el usuario
    user.push({
      ...req.body,
      fotoPerfil: req.file.filename, // Usar el nombre de archivo proporcionado por Multer
    });

    fs.writeFileSync(userFilePath, JSON.stringify(user), "utf-8");
    res.redirect("/login");
  },

  usuarios: (req, res) => {
    // let usuario = user;
    // if (req.file) {
    // }
    // res.render("users/admin", { usuario: usuario });
    db.Usuarios.findAll({
      //include: [{ association: "equipo" }, { association: "marca" }],
      raw: true,
      nest: true,
    }).then(function (usuario) {
      res.render("users/admin", { usuario: usuario });
    });
    
  },

  destroy: (req, res) => {
    // const { id } = req.params;
    // const usersIndex = user.findIndex((user) => user.id === parseInt(id));
    // user.splice(usersIndex, 1);
    // fs.writeFileSync(userFilePath, JSON.stringify(user), "utf-8");
    // res.redirect("/users/usuarios");
    db.Usuarios.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.redirect("/users/usuarios");
  },

  editar: async(req, res) => {
    let userId = req.params.id;
    
    const result = await db.Usuarios.findByPk(userId);
    res.render("users/userEdit", { usuario: result });
  },

  update: (req, res) => {
    db.Usuarios.update(
      {
        nombre: req.body.Nombre,
        apellido: req.body.Apellido,
        email: req.body.email,
        telefono: req.body.tel,
        fec_nac: req.body.nacimiento,
        genero: req.body.genero,
        url_foto_perfil: req.file.filename, 
        contrasenia: req.body.contrasenia,
        confirmar_contrasenia: req.body.confirmar_contrasenia,
        tyc: req.body.aceptar_terminos,
        novedades: req.body.newsletter,
      },
      { where: { id: req.params.id } }
    );
    
    res.redirect("/users/usuarios");
  },

  iniciarSesion: async (req, res) => {
    try {
      console.log("Iniciando sesión. Modelo Usuarios:", Usuarios);
      // Validar los resultados de la validación
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.render("users/login", { errors: errors.array() });
      }

      const { email, contrasenia } = req.body;
      // Buscar al usuario en la base de datos utilizando Sequelize
      const usuario = await Usuarios.findOne({ where: { email } });

      if (usuario && bcrypt.compareSync(contrasenia, bcrypt.hashSync(usuario.contrasenia))){
        req.session.user = usuario;
        res.redirect("/");
      } else {
        res.render("users/login", {
          errors: [{ msg: "Usuario y/o contraseña incorrectos" }],
        });
      }
    } catch (error) {
      console.error("Error en la función iniciarSesion:", error);
      res.status(500).send("Error interno del servidor");
    }
  },

  cerrarSesion: (req, res) => {
    req.session.destroy();
    res.redirect("/");
  },
};

module.exports = controlador;
