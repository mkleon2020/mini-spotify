'use strict'
var fs = require('fs');
var path = require('path');
var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');


function pruebas(req, res) {
    res.status(200).send({
        message: 'Probando una accion del controlador de usuarios con node y mongo '
    });
}

function saveUser(req, res) {
    var user = new User();

    var params = JSON.parse(req.body.json);
    console.log(params);
    user.name = params.name;
    user.surname = params.surname;
    user.email = params.email;
    user.role = 'ROLE/USER';
    user.image = 'null';

    if (params.password) {
        // encriptar contrasena
        bcrypt.hash(params.password, null, null, function(err, hash) {
            user.password = hash;
            if (user.name != null && user.surname != null && user.email != null) {
                // guardar el usuario
                user.save((err, userStored) => {
                    if (err) {
                        res.status(500).send({ message: 'Error al guardar usuarios' });
                    } else {
                        if (!userStored) {
                            res.status(404).send({ message: 'No se ha registrado el usuario' });
                        } else {
                            res.status(200).send({ user: userStored });
                        }

                    }
                });
            } else {
                res.status(200).send({ message: 'Rellenar todos los campos' });
            }
        });
    } else {
        res.status(500).send({ message: 'introduce la clave' });
    }
}

function loginUser(req, res) {
    var params = JSON.parse(req.body.json);
    // console.log(JSON.parse(req.body.json));
    var email = params.email;
    var password = params.password;
    // me falta esto toLowerCase();
    User.findOne({ email: email }, (err, user) => {
        if (err) {
            return res.status(500).send({ message: 'error en la peticion' });
        } else {
            if (!user) {
                return res.status(404).send({ message: 'no existe usuario' });
            } else {
                //comprobar la contrasena
                bcrypt.compare(password, user.password, function(err, check) {
                    if (check) {
                        // devolver los datos del usuario logeado
                        if (params.gethash) {
                            //devolver un token de jwt
                            return res.status(200).send({
                                token: jwt.createToken(user)
                            });

                        } else {
                            return res.status(200).send({ user });
                        }
                    } else {
                        return res.status(404).send({ message: 'el usuario no ha podido loguearse clave o usuario INCORECCTA' });
                    }
                });
            }
        }
    });
}

function updateUser(req, res) {
    var userId = req.params.id;
    var update = req.body;
    if (userId != req.user.sub) {
        return res.status(500).send({ message: 'No tienes permiso para actualizar este usuario' });
    }
    User.findByIdAndUpdate(userId, update, (err, userUpdate) => {
        if (err) {
            res.status(500).send({ message: 'Error al actualizar el usuario' });
        } else {
            if (!userUpdate) {
                res.status(404).send({ message: 'No se ha podido actualizar el usuario' });
            } else {
                res.status(200).send({ user: userUpdate });
            }
        }
    });
}

function uploadImage(req, res) {
    var userId = req.params.id;
    var file_name = 'no subido..';

    if (req.files) {
        var file_path = req.files.image.path;
        var file_split = file_path.split('\\');
        var file_name = file_split[2];

        var ext_split = file_name.split('\.');
        var file_ext = ext_split[1];

        if (file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif') {
            User.findByIdAndUpdate(userId, { image: file_name }, (err, userUpdate) => {
                if (!userUpdate) {
                    res.status(404).send({ message: 'No se ha podido actualizar el usuario' });
                } else {
                    res.status(200).send({ image: file_name, user: userUpdate });
                }
            });
        } else {
            res.status(200).send({ message: 'La extension no es correcta...' });
        }
        console.log(ext_split);
    } else {
        res.status(200).send({ message: 'No has subido ninguna imagen...' });
    }
}

function getImageFile(req, res) {
    var imageFile = req.params.imageFile;

    var path_file = './uploads/users/' + imageFile;
    fs.exists(path_file, function(exists) {
        if (exists) {
            res.sendFile(path.resolve(path_file));
        } else {
            res.status(200).send({ message: 'No existe la imagen...' });
        }
    });
}

module.exports = {
    pruebas,
    saveUser,
    loginUser,
    updateUser,
    uploadImage,
    getImageFile
};